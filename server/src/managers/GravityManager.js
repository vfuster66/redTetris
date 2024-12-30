function GravityManager(room, io) {
    this.room = room;
    this.io = io;
    this.timers = new Map();
    this.defaultInterval = 1000;
    this.isRunning = false;
}

// Démarre la gravité pour un joueur
GravityManager.prototype.startForPlayer = function(playerId) {
    if (this.timers.has(playerId)) {
        this.stopForPlayer(playerId);
    }
    const timer = setInterval(() => {
        this.io.to(this.room).emit('gravity', {
            playerId,
            timestamp: Date.now()
        });
    }, this.defaultInterval);
    this.timers.set(playerId, timer);
};

// Arrête la gravité pour un joueur
GravityManager.prototype.stopForPlayer = function(playerId) {
    const timer = this.timers.get(playerId);
    if (timer) {
        clearInterval(timer);
        this.timers.delete(playerId);
    }
};

// Démarre la gravité pour tous les joueurs
GravityManager.prototype.start = function() {
    this.isRunning = true;
};

// Arrête la gravité pour tous les joueurs
GravityManager.prototype.stop = function() {
    this.isRunning = false;
    for (const timer of this.timers.values()) {
        clearInterval(timer);
    }
    this.timers.clear();
};

// Change l'intervalle de gravité (pour les niveaux de difficulté)
GravityManager.prototype.setInterval = function(interval) {
    this.defaultInterval = interval;
    const playerIds = Array.from(this.timers.keys());
    playerIds.forEach(playerId => {
        this.stopForPlayer(playerId);
        this.startForPlayer(playerId);
    });
};

// Nettoie les ressources
GravityManager.prototype.cleanup = function() {
    this.stop();
};

export default GravityManager;