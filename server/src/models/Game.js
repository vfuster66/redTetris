import { getRandomPieceType, createPiece } from './Piece.js';

function Game(roomId, isSolo = false) {
  this.roomId = roomId;
  this.players = new Map();
  this.pieceSequence = [];
  this.nextPieceIndex = 0;
  this.isRunning = false;
  this.isSolo = isSolo;
  this.dropInterval = isSolo ? 1000 : 750;
  this.level = 1;
}

Game.prototype.generatePieceSequence = function() {
  const newPieces = Array(50).fill()
    .map(() => getRandomPieceType());
  this.pieceSequence = [...this.pieceSequence, ...newPieces];
};

Game.prototype.getNextPiece = function() {
  if (this.nextPieceIndex >= this.pieceSequence.length - 10) {
    this.generatePieceSequence();
  }
  
  const pieceType = this.pieceSequence[this.nextPieceIndex++];
  return createPiece(pieceType);
};

Game.prototype.addPlayer = function(player) {
  // En solo, un seul joueur autorisé
  if (this.isSolo && this.players.size > 0) {
    throw new Error('Solo game already has a player');
  }
  
  if (!this.isSolo && this.isRunning) {
    throw new Error('Cannot join a multiplayer game in progress');
  }
  
  player.reset(this.isSolo);
  
  if (this.isSolo) {
    player.isLeader = true;
  } else {
    player.isLeader = this.players.size === 0;
  }
  
  this.players.set(player.id, player);
  
  if (this.isSolo) {
    player.setNextPiece(this.getNextPiece());
  }
  
  return this.players.size;
};

Game.prototype.removePlayer = function(playerId) {
  const player = this.players.get(playerId);
  if (!player) return false;

  this.players.delete(playerId);
  
  if (!this.isSolo) {
    if (player.isLeader && this.players.size > 0) {
      const nextLeader = this.players.values().next().value;
      nextLeader.isLeader = true;
    }
    
    this.checkWinCondition();
  }
  
  if (this.players.size === 0) {
    this.stop();
  }
  
  return true;
};

Game.prototype.start = function() {
  if (this.players.size === 0) {
    throw new Error('Cannot start game with no players');
  }
  if (!this.isSolo && this.players.size < 2) {
    throw new Error('Multiplayer game needs at least 2 players');
  }
  
  this.isRunning = true;
  this.generatePieceSequence();
  this.nextPieceIndex = 0;
  
  for (const player of this.players.values()) {
    player.reset(this.isSolo);
    player.isPlaying = true;
    
    if (this.isSolo) {
      player.setNextPiece(this.getNextPiece());
    }
  }
  
  return true;
};

Game.prototype.stop = function() {
  this.isRunning = false;
  this.nextPieceIndex = 0;
  this.pieceSequence = [];
  
  for (const player of this.players.values()) {
    player.isPlaying = false;
  }
};

Game.prototype.handleLinesClear = function(playerId, linesCleared) {
  if (linesCleared <= 0) return;
  
  // En solo, juste met à jour le niveau
  if (this.isSolo) {
    const player = this.players.get(playerId);
    const totalLines = Math.floor(player.score / 100);
    this.level = Math.floor(totalLines / 10) + 1;
    this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    return;
  }
  
  // En multi, ajoute des pénalités aux autres joueurs
  const penaltyLines = linesCleared - 1;
  if (penaltyLines <= 0) return;
  
  for (const [id, player] of this.players) {
    if (id !== playerId && player.isPlaying) {
      player.addPenaltyLines(penaltyLines);
    }
  }
  
  this.checkWinCondition();
};

Game.prototype.checkWinCondition = function() {
  if (this.isSolo) {
    const player = this.players.values().next().value;
    if (player.gameOver) {
      this.stop();
    }
    return null;
  }
  
  // En multi, compte les joueurs actifs
  const activePlayers = Array.from(this.players.values())
    .filter(p => p.isPlaying);
  
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    this.stop();
    return winner;
  }
  
  return null;
};

Game.prototype.getDropInterval = function() {
  return this.dropInterval;
};

Game.prototype.getState = function() {
  const state = {
    roomId: this.roomId,
    isRunning: this.isRunning,
    isSolo: this.isSolo,
    players: Array.from(this.players.values()).map(p => p.getState())
  };
  
  if (this.isSolo) {
    state.level = this.level;
    state.dropInterval = this.dropInterval;
  }
  
  return state;
};

export default Game;