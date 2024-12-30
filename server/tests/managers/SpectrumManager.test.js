import SpectrumManager from '../../src/managers/SpectrumManager.js';
import { Server } from 'socket.io';
import { createServer } from 'http';

describe('SpectrumManager', () => {
    let spectrumManager;
    let io;
    let httpServer;

    beforeEach(() => {
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: '*',
            },
        });
        spectrumManager = new SpectrumManager(io);
    });

    afterEach(() => {
        spectrumManager.cleanup();
        io.close();
        httpServer.close();
    });

    test('should start tracking a room', () => {
        spectrumManager.startTracking('room1');
        expect(spectrumManager.spectrums.has('room1')).toBe(true);
        expect(spectrumManager.updateTimers.has('room1')).toBe(true);
    });

    test('should stop tracking a room', () => {
        spectrumManager.startTracking('room1');
        spectrumManager.stopTracking('room1');
        expect(spectrumManager.spectrums.has('room1')).toBe(false);
        expect(spectrumManager.updateTimers.has('room1')).toBe(false);
    });

    test('should update spectrum for a player', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        grid[19][0] = 1; // Place a block at the bottom-left corner

        spectrumManager.updateSpectrum('room1', 'player1', grid);

        const spectrum = spectrumManager.getPlayerSpectrum('room1', 'player1');
        expect(spectrum[0]).toBe(19); // The block at column 0 is at row 19
        expect(spectrum.every((height, index) => (index === 0 ? height === 19 : height === 20))).toBe(true);
    });

    test('should broadcast spectrums to the room', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        grid[19][0] = 1;
    
        const roomId = 'room1';
        const playerId = 'player1';
    
        // Mock d'emit
        const emitMock = jest.fn();
        io.to = jest.fn(() => ({ emit: emitMock }));
    
        spectrumManager.startTracking(roomId);
        spectrumManager.updateSpectrum(roomId, playerId, grid);
    
        spectrumManager.broadcastSpectrums(roomId);
    
        expect(emitMock).toHaveBeenCalledWith('spectrumUpdate', expect.objectContaining({
            spectrums: expect.any(Array),
            timestamp: expect.any(Number),
        }));
    });
    

    test('should remove a player from tracking', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        grid[19][0] = 1;

        spectrumManager.updateSpectrum('room1', 'player1', grid);
        spectrumManager.removePlayer('room1', 'player1');

        expect(spectrumManager.getPlayerSpectrum('room1', 'player1')).toBeUndefined();
    });

    test('should detect if a player is in danger', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        grid[3][0] = 1; // Block near the top in column 0

        spectrumManager.updateSpectrum('room1', 'player1', grid);

        const isInDanger = spectrumManager.isPlayerInDanger('room1', 'player1');
        expect(isInDanger).toBe(true);
    });

    test('should clean up all resources', () => {
        spectrumManager.startTracking('room1');
        spectrumManager.startTracking('room2');

        spectrumManager.cleanup();

        expect(spectrumManager.spectrums.size).toBe(0);
        expect(spectrumManager.updateTimers.size).toBe(0);
    });
});
