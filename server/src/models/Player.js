function Player(id, name) {
    this.id = id;
    this.name = name;
    this.grid = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.isPlaying = false;
    this.isLeader = false;
    this.piece = null;
    this.gameOver = false;
    this.isSoloMode = false;
    this.nextPiece = null; // Pour le mode solo
    this.holdPiece = null; // Pour le mode solo
    this.canHold = true;  // Pour le mode solo
  }
  
  Player.prototype.reset = function(isSolo = false) {
    this.grid = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.isPlaying = false;
    this.piece = null;
    this.gameOver = false;
    this.isSoloMode = isSolo;
    this.nextPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    
    // En mode solo, le joueur est toujours leader
    this.isLeader = isSolo;
  };
  
  Player.prototype.getSpectrum = function() {
    const spectrum = [];
    
    for (let x = 0; x < 10; x++) {
      let height = 20;
      for (let y = 0; y < 20; y++) {
        if (this.grid[y][x] !== 0) {
          height = y;
          break;
        }
      }
      spectrum.push(height);
    }
    
    return spectrum;
  };
  
  Player.prototype.addPenaltyLines = function(numLines) {
    // En mode solo, pas de lignes de pénalité
    if (this.isSoloMode) return false;
  
    // Décale la grille vers le haut
    this.grid.splice(0, numLines);
    
    // Ajoute les nouvelles lignes de pénalité en bas
    for (let i = 0; i < numLines; i++) {
      this.grid.push(Array(10).fill(8)); // 8 représente une ligne de pénalité
    }
    
    return this.checkGameOver();
  };
  
  Player.prototype.clearLines = function() {
    let linesCleared = 0;
    for (let y = 19; y >= 0; y--) {
        if (this.grid[y].every(cell => cell !== 0)) {
            // Supprime la ligne
            this.grid.splice(y, 1);
            // Ajoute une nouvelle ligne vide en haut
            this.grid.unshift(Array(10).fill(0));
            linesCleared++;
            y++; // Réexamine la même position
            // Mise à jour du score
            // En mode solo, le score augmente différemment
            if (this.isSoloMode) {
                this.score += 100; // 100 points par ligne en solo
            } else {
                this.score += linesCleared * 50; // Moins de points en multijoueur
            }
        }
    }
    return linesCleared;
  };
  
  Player.prototype.holdCurrentPiece = function() {
    // Le hold n'est disponible qu'en mode solo
    if (!this.isSoloMode || !this.canHold) return null;
    
    const currentPiece = this.piece;
    this.piece = this.holdPiece;
    this.holdPiece = currentPiece;
    this.canHold = false;
    
    return this.piece;
  };
  
  Player.prototype.checkGameOver = function() {
    // Vérifie les 4 premières lignes (zone de spawn)
    const gameOver = this.grid.slice(0, 4).some(row => row.some(cell => cell !== 0));
    if (gameOver) {
      this.gameOver = true;
      this.isPlaying = false;
    }
    return gameOver;
  };
  
  Player.prototype.getState = function() {
    return {
      id: this.id,
      name: this.name,
      grid: this.grid,
      score: this.score,
      isPlaying: this.isPlaying,
      isLeader: this.isLeader,
      gameOver: this.gameOver,
      isSoloMode: this.isSoloMode,
      spectrum: this.getSpectrum(),
      // En mode solo, on envoie plus d'informations
      ...(this.isSoloMode && {
        nextPiece: this.nextPiece,
        holdPiece: this.holdPiece,
        canHold: this.canHold
      })
    };
  };
  
  Player.prototype.setNextPiece = function(piece) {
    if (this.isSoloMode) {
      this.nextPiece = piece;
    }
  };
  
  Player.prototype.newPiecePlaced = function() {
    if (this.isSoloMode) {
      this.canHold = true; // Réactive la possibilité de hold en mode solo
    }
  };
  
  export default Player;