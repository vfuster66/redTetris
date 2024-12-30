import { createPiece, getRandomPieceType } from '../models/Piece.js';

function GameManager(room, io, isSolo = false) {
    this.room = room;
    this.io = io;
    this.isSolo = isSolo;
    this.pieceSequence = [];
    this.playerPieceIndices = new Map();
    this.seedValue = Date.now();
    this.gravityInterval = null;
    this.baseGravitySpeed = 1000;
    this.isRunning = false;
    this.generateMorePieces();
}

GameManager.prototype.seededRandom = function() {
    this.seedValue = (this.seedValue * 9301 + 49297) % 233280;
    return this.seedValue / 233280;
};

GameManager.prototype.generateMorePieces = function() {
    const batchSize = 50;
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (let i = 0; i < batchSize; i++) {
        const index = Math.floor(this.seededRandom() * pieces.length);
        const type = pieces[index];
        this.pieceSequence.push({
            type,
            x: 3,
            y: 0,
            rotation: 0
        });
    }
};

GameManager.prototype.addPlayer = function(playerId) {
    this.playerPieceIndices.set(playerId, 0);
};

GameManager.prototype.removePlayer = function(playerId) {
    this.playerPieceIndices.delete(playerId);
};

GameManager.prototype.getNextPiece = function(playerId) {
    let currentIndex = this.playerPieceIndices.get(playerId);
    if (currentIndex >= this.pieceSequence.length - 10) {
        this.generateMorePieces();
    }
    const pieceData = this.pieceSequence[currentIndex];
    const piece = createPiece(pieceData.type);
    piece.x = pieceData.x;
    piece.y = pieceData.y;
    piece.rotation = pieceData.rotation;
    this.playerPieceIndices.set(playerId, currentIndex + 1);
    return {
        piece,
        index: currentIndex
    };
};

GameManager.prototype.getPieceAtIndex = function(index) {
    if (index >= this.pieceSequence.length) {
        this.generateMorePieces();
    }
    const pieceData = this.pieceSequence[index];
    const piece = createPiece(pieceData.type);
    piece.x = pieceData.x;
    piece.y = pieceData.y;
    piece.rotation = pieceData.rotation;
    return piece;
};

GameManager.prototype.startGravity = function() {
    if (this.gravityInterval) {
        clearInterval(this.gravityInterval);
    }
    this.isRunning = true;
    this.gravityInterval = setInterval(() => {
        if (!this.isRunning) return;
        this.io.to(this.room).emit('gravity', {
            timestamp: Date.now(),
            interval: this.baseGravitySpeed
        });
    }, this.baseGravitySpeed);
};

GameManager.prototype.pauseGravity = function() {
    this.isRunning = false;
};

GameManager.prototype.resumeGravity = function() {
    this.isRunning = true;
};

GameManager.prototype.stopGravity = function() {
    this.isRunning = false;
    if (this.gravityInterval) {
        clearInterval(this.gravityInterval);
        this.gravityInterval = null;
    }
};

GameManager.prototype.setGravitySpeed = function(speed) {
    if (!this.isSolo) return;
    this.baseGravitySpeed = Math.max(100, speed);
    if (this.isRunning) {
        this.startGravity();
    }
};

GameManager.prototype.cleanup = function() {
    this.stopGravity();
    this.pieceSequence = [];
    this.playerPieceIndices.clear();
};

export default GameManager;