import GravityManager from '../../src/managers/GravityManager.js';
import { jest } from '@jest/globals';

describe('GravityManager', () => {
    let gravityManager;
    const mockRoom = 'testRoom';
    const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    };

    beforeEach(() => {
        gravityManager = new GravityManager(mockRoom, mockIo);
    });

    afterEach(() => {
        jest.clearAllMocks();
        gravityManager.cleanup();
    });

    test('should initialize with default properties', () => {
        expect(gravityManager.room).toBe(mockRoom);
        expect(gravityManager.io).toBe(mockIo);
        expect(gravityManager.timers.size).toBe(0);
        expect(gravityManager.defaultInterval).toBe(1000);
        expect(gravityManager.isRunning).toBe(false);
    });

    test('should start gravity for a specific player', () => {
        jest.useFakeTimers();
        const playerId = 'player1';

        gravityManager.startForPlayer(playerId);
        expect(gravityManager.timers.has(playerId)).toBe(true);

        jest.advanceTimersByTime(1000);
        expect(mockIo.to).toHaveBeenCalledWith(mockRoom);
        expect(mockIo.emit).toHaveBeenCalledWith('gravity', {
            playerId,
            timestamp: expect.any(Number),
        });

        gravityManager.stopForPlayer(playerId);
        jest.useRealTimers();
    });

    test('should stop gravity for a specific player', () => {
        jest.useFakeTimers();
        const playerId = 'player1';

        gravityManager.startForPlayer(playerId);
        gravityManager.stopForPlayer(playerId);

        expect(gravityManager.timers.has(playerId)).toBe(false);
        jest.useRealTimers();
    });

    test('should start gravity for all players', () => {
        gravityManager.start();
        expect(gravityManager.isRunning).toBe(true);
    });

    test('should stop gravity for all players and clear all timers', () => {
        jest.useFakeTimers();
        const player1 = 'player1';
        const player2 = 'player2';

        gravityManager.startForPlayer(player1);
        gravityManager.startForPlayer(player2);

        gravityManager.stop();

        expect(gravityManager.isRunning).toBe(false);
        expect(gravityManager.timers.size).toBe(0);

        jest.useRealTimers();
    });

    test('should change gravity interval and restart timers', () => {
        jest.useFakeTimers();
        const player1 = 'player1';
        const player2 = 'player2';

        gravityManager.startForPlayer(player1);
        gravityManager.startForPlayer(player2);

        const initialTimerCount = gravityManager.timers.size;
        expect(initialTimerCount).toBe(2);

        gravityManager.setInterval(500);
        expect(gravityManager.defaultInterval).toBe(500);

        jest.advanceTimersByTime(500);
        expect(mockIo.emit).toHaveBeenCalledWith('gravity', expect.objectContaining({
            playerId: expect.any(String),
            timestamp: expect.any(Number),
        }));

        gravityManager.cleanup();
        jest.useRealTimers();
    });

    test('should clean up all resources', () => {
        const player1 = 'player1';
        const player2 = 'player2';

        gravityManager.startForPlayer(player1);
        gravityManager.startForPlayer(player2);

        gravityManager.cleanup();
        expect(gravityManager.timers.size).toBe(0);
        expect(gravityManager.isRunning).toBe(false);
    });
});
