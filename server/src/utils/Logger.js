class Logger {
    constructor() {
      this.LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
      };
  
      this.currentLevel = process.env.NODE_ENV === 'production' 
        ? this.LOG_LEVELS.INFO 
        : this.LOG_LEVELS.DEBUG;
    }
  
    formatMessage(level, context, message, data = null) {
      const timestamp = new Date().toISOString();
      const formattedData = data ? JSON.stringify(data) : '';
      return `[${timestamp}] [${level}] [${context}] ${message} ${formattedData}`.trim();
    }
  
    debug(context, message, data = null) {
      if (this.currentLevel <= this.LOG_LEVELS.DEBUG) {
        console.debug(this.formatMessage('DEBUG', context, message, data));
      }
    }
  
    info(context, message, data = null) {
      if (this.currentLevel <= this.LOG_LEVELS.INFO) {
        console.info(this.formatMessage('INFO', context, message, data));
      }
    }
  
    warn(context, message, data = null) {
      if (this.currentLevel <= this.LOG_LEVELS.WARN) {
        console.warn(this.formatMessage('WARN', context, message, data));
      }
    }
  
    error(context, message, error = null) {
      if (this.currentLevel <= this.LOG_LEVELS.ERROR) {
        console.error(this.formatMessage('ERROR', context, message, {
          message: error?.message,
          stack: error?.stack,
          ...error
        }));
      }
    }
  
    // Log spécifique pour le jeu
    logGameEvent(roomId, eventType, data = null) {
      this.debug('Game', `Room ${roomId}: ${eventType}`, data);
    }
  
    // Log spécifique pour les mouvements
    logMovement(roomId, playerId, movement, isValid) {
      this.debug('Movement', `Room ${roomId}, Player ${playerId}`, {
        movement,
        isValid
      });
    }
  
    // Log spécifique pour les erreurs de validation
    logValidationError(roomId, playerId, errorType, details = null) {
      this.warn('Validation', `Room ${roomId}, Player ${playerId}: ${errorType}`, details);
    }
  
    // Log des événements socket
    logSocketEvent(eventName, roomId, playerId = null, data = null) {
      this.debug('Socket', eventName, {
        room: roomId,
        player: playerId,
        data
      });
    }
  }
  
  export default new Logger();