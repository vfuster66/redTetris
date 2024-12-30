function SpectrumManager(io) {
    this.io = io;
    this.spectrums = new Map();
    this.updateInterval = 100;
    this.updateTimers = new Map();
}

// Commence à tracker les spectres pour une room
SpectrumManager.prototype.startTracking = function(roomId) {
    if (this.updateTimers.has(roomId)) {
        this.stopTracking(roomId);
    }
    this.spectrums.set(roomId, new Map());
    const timer = setInterval(() => this.broadcastSpectrums(roomId), this.updateInterval);
    this.updateTimers.set(roomId, timer);
};

// Arrête de tracker les spectres pour une room
SpectrumManager.prototype.stopTracking = function(roomId) {
    const timer = this.updateTimers.get(roomId);
    if (timer) {
        clearInterval(timer);
        this.updateTimers.delete(roomId);
    }
    this.spectrums.delete(roomId);
};

// Met à jour le spectre d'un joueur
SpectrumManager.prototype.updateSpectrum = function(roomId, playerId, grid) {
    if (!this.spectrums.has(roomId)) {
        this.spectrums.set(roomId, new Map());
    }
    const spectrum = this.calculateSpectrum(grid);
    this.spectrums.get(roomId).set(playerId, {
        spectrum,
        timestamp: Date.now()
    });
};

// Calcule le spectre à partir d'une grille
SpectrumManager.prototype.calculateSpectrum = function(grid) {
    const spectrum = new Array(10).fill(20);
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 20; y++) {
            if (grid[y][x] !== 0) {
                spectrum[x] = y;
                break;
            }
        }
    }
    return spectrum;
};

// Diffuse les spectres à tous les joueurs d'une room
SpectrumManager.prototype.broadcastSpectrums = function(roomId) {
    const roomSpectrums = this.spectrums.get(roomId);
    if (!roomSpectrums) return;

    const spectrumData = Array.from(roomSpectrums.entries()).map(([playerId, data]) => ({
        playerId,
        spectrum: data.spectrum,
        timestamp: data.timestamp,
    }));

    console.log('Broadcasting spectrums:', spectrumData);
    if (spectrumData.length > 0) {
        this.io.to(roomId).emit('spectrumUpdate', {
            spectrums: spectrumData,
            timestamp: Date.now(),
        });
    }
};

// Supprime un joueur du suivi
SpectrumManager.prototype.removePlayer = function(roomId, playerId) {
    const roomSpectrums = this.spectrums.get(roomId);
    if (roomSpectrums) {
        roomSpectrums.delete(playerId);
        if (roomSpectrums.size === 0) {
            this.stopTracking(roomId);
        }
    }
};

// Récupère le spectre d'un joueur
SpectrumManager.prototype.getPlayerSpectrum = function(roomId, playerId) {
    return this.spectrums.get(roomId)?.get(playerId)?.spectrum;
};

// Vérifie si un joueur est en danger (spectre haut)
SpectrumManager.prototype.isPlayerInDanger = function(roomId, playerId) {
    const spectrum = this.getPlayerSpectrum(roomId, playerId);
    if (!spectrum) return false;

    return spectrum.some(height => height <= 4);
};

// Nettoie les ressources
SpectrumManager.prototype.cleanup = function() {
    for (const [roomId] of this.updateTimers) {
        this.stopTracking(roomId);
    }
    this.spectrums.clear();
};

export default SpectrumManager;