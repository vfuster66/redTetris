import { getRandomPieceType, createPiece } from '../models/Piece.js';

function PieceManager(gameId) {
  this.gameId = gameId;
  this.sequence = [];
  this.currentIndex = 0;
  this.seedValue = Date.now();
}

// Pseudo-random number generator avec seed
PieceManager.prototype.seededRandom = function() {
  const x = Math.sin(this.seedValue++) * 10000;
  return x - Math.floor(x);
};

// Génère un nouveau lot de pièces
PieceManager.prototype.generateNewBatch = function() {
    const batchSize = 100;
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  
    for (let i = 0; i < batchSize; i++) {
        const index = Math.floor(this.seededRandom() * types.length);
        const pieceType = types[index];
        this.sequence.push({
            type: pieceType,
            startX: 3,
            startY: 0,
            rotation: 0
        });
    }
};

// Obtient la prochaine pièce dans la séquence
PieceManager.prototype.getNextPiece = function() {

  if (this.currentIndex >= this.sequence.length - 10) {
    this.generateNewBatch();
  }

  const pieceData = this.sequence[this.currentIndex++];
  return {
    ...pieceData,
    index: this.currentIndex - 1
  };
};

// Obtient une pièce spécifique de la séquence par son index
PieceManager.prototype.getPieceAtIndex = function(index) {
  while (index >= this.sequence.length) {
    this.generateNewBatch();
  }
  
  return this.sequence[index];
};

// Permet à un joueur de rattraper la séquence
PieceManager.prototype.syncPlayerToSequence = function(lastPieceIndex) {
    const pieces = [];
    let currentIndex = lastPieceIndex + 1; // Déclarer currentIndex comme variable modifiable
  
    while (currentIndex < this.currentIndex) {
        pieces.push({
            ...this.sequence[currentIndex],
            index: currentIndex
        });
        currentIndex++; // Incrémenter pour éviter une boucle infinie
    }
  
    return pieces;
};

// Réinitialise le manager pour une nouvelle partie
PieceManager.prototype.reset = function() {
  this.sequence = [];
  this.currentIndex = 0;
  this.seedValue = Date.now();
  this.generateNewBatch();
};

export default PieceManager;