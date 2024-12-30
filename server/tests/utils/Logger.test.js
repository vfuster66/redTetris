import Logger from '../../src/utils/Logger.js';

describe('Logger', () => {
  let originalConsoleDebug;
  let originalConsoleInfo;
  let originalConsoleWarn;
  let originalConsoleError;
  let originalEnv;

  beforeEach(() => {
    // Sauvegarder les méthodes console et l'environnement
    originalConsoleDebug = console.debug;
    originalConsoleInfo = console.info;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalEnv = process.env.NODE_ENV;

    // Créer des mocks pour les méthodes console
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restaurer les méthodes console et l'environnement
    console.debug = originalConsoleDebug;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    process.env.NODE_ENV = originalEnv;
  });

  describe('Log Levels', () => {
    test('should set debug log level in development environment', () => {
      process.env.NODE_ENV = 'development';
      // Recréer l'instance du logger pour refléter le nouvel environnement
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      expect(logger.currentLevel).toBe(logger.LOG_LEVELS.DEBUG);
    });

    test('should set info log level in production environment', () => {
      process.env.NODE_ENV = 'production';
      // Recréer l'instance du logger pour refléter le nouvel environnement
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      expect(logger.currentLevel).toBe(logger.LOG_LEVELS.INFO);
    });
  });

  describe('Message Formatting', () => {
    test('should format message with data correctly', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const formattedMessage = logger.formatMessage(
        'INFO', 
        'TestContext', 
        'Test message', 
        { key: 'value' }
      );
      
      expect(formattedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\] \[INFO\] \[TestContext\] Test message {"key":"value"}/);
    });
  
    test('should format message without data correctly', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const formattedMessage = logger.formatMessage(
        'DEBUG', 
        'Context', 
        'Simple message'
      );
      
      expect(formattedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\] \[DEBUG\] \[Context\] Simple message/);
    });
});

  describe('Logging Levels Behavior', () => {
    test('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      
      logger.debug('Dev', 'Debug message', { detail: 'test' });
      
      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.debug.mock.calls[0][0]).toMatch(/\[DEBUG\] \[Dev\] Debug message {"detail":"test"}/);
    });

    test('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      
      logger.debug('Prod', 'Debug message');
      
      expect(console.debug).not.toHaveBeenCalled();
    });

    test('should log info messages in production', () => {
      process.env.NODE_ENV = 'production';
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      
      logger.info('Prod', 'Info message', { key: 'value' });
      
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info.mock.calls[0][0]).toMatch(/\[INFO\] \[Prod\] Info message {"key":"value"}/);
    });
  });

  describe('Specialized Logging Methods', () => {
    test('logGameEvent should use debug method', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const debugSpy = jest.spyOn(logger, 'debug');
      
      logger.logGameEvent('room1', 'start');
      
      expect(debugSpy).toHaveBeenCalledWith(
        'Game', 
        'Room room1: start', 
        null
      );
    });

    test('logMovement should use debug method', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const debugSpy = jest.spyOn(logger, 'debug');
      
      logger.logMovement('room1', 'player1', 'move', true);
      
      expect(debugSpy).toHaveBeenCalledWith(
        'Movement', 
        'Room room1, Player player1', 
        { movement: 'move', isValid: true }
      );
    });

    test('logValidationError should use warn method', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const warnSpy = jest.spyOn(logger, 'warn');
      
      logger.logValidationError('room1', 'player1', 'invalidMove', { reason: 'out of bounds' });
      
      expect(warnSpy).toHaveBeenCalledWith(
        'Validation', 
        'Room room1, Player player1: invalidMove', 
        { reason: 'out of bounds' }
      );
    });

    test('logSocketEvent should use debug method', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const debugSpy = jest.spyOn(logger, 'debug');
      
      logger.logSocketEvent('connect', 'room1', 'player1', { socketId: '123' });
      
      expect(debugSpy).toHaveBeenCalledWith(
        'Socket', 
        'connect', 
        { room: 'room1', player: 'player1', data: { socketId: '123' } }
      );
    });
  });

  describe('Error Logging', () => {
    test('should log error with error details', () => {
      const logger = new (Object.getPrototypeOf(Logger).constructor)();
      const testError = new Error('Test error message');
      
      logger.error('Test', 'Error occurred', testError);
      
      expect(console.error).toHaveBeenCalledTimes(1);
      const errorLog = console.error.mock.calls[0][0];
      
      expect(errorLog).toMatch(/\[ERROR\] \[Test\] Error occurred/);
      expect(errorLog).toContain('Test error message');
      expect(errorLog).toMatch(/at Object\.<anonymous>/);
    });
  });
});