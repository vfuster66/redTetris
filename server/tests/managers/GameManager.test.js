import GameManager from '../../src/managers/GameManager.js';
import { createPiece } from '../../src/models/Piece.js';
import { jest } from '@jest/globals';

describe('GameManager', () => {
    let gameManager;
    const mockRoom = 'testRoom';
    const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    };

    beforeEach(() => {
        gameManager = new GameManager(mockRoom, mockIo, true); // Mode solo pour les tests
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with an empty piece sequence and no players', () => {
        expect(gameManager.pieceSequence).toHaveLength(50); // Première génération de pièces
        expect(gameManager.playerPieceIndices.size).toBe(0);
    });

    test('should generate more pieces when needed', () => {
        gameManager.generateMorePieces();
        expect(gameManager.pieceSequence).toHaveLength(100); // 50 initial + 50 générées
    });

    test('should add a player and initialize their piece index', () => {
        const playerId = 'player1';
        gameManager.addPlayer(playerId);
        expect(gameManager.playerPieceIndices.has(playerId)).toBe(true);
        expect(gameManager.playerPieceIndices.get(playerId)).toBe(0);
    });

    test('should remove a player and clear their piece index', () => {
        const playerId = 'player1';
        gameManager.addPlayer(playerId);
        gameManager.removePlayer(playerId);
        expect(gameManager.playerPieceIndices.has(playerId)).toBe(false);
    });

    test('should return the next piece for a player', () => {
        const playerId = 'player1';
        gameManager.addPlayer(playerId);
        const nextPiece = gameManager.getNextPiece(playerId);
        expect(nextPiece.piece).toMatchObject({
            type: expect.any(String),
            x: 3,
            y: 0,
            rotation: 0,
        });
        expect(nextPiece.index).toBe(0);
        expect(gameManager.playerPieceIndices.get(playerId)).toBe(1);
    });

    test('should get a piece at a specific index', () => {
        const pieceAtIndex = gameManager.getPieceAtIndex(0);
        expect(pieceAtIndex).toMatchObject({
            type: expect.any(String),
            x: 3,
            y: 0,
            rotation: 0,
        });
    });

    test('should start gravity and emit gravity events', () => {
        jest.useFakeTimers();
        gameManager.startGravity();
        expect(gameManager.isRunning).toBe(true);

        jest.advanceTimersByTime(1000);
        expect(mockIo.to).toHaveBeenCalledWith(mockRoom);
        expect(mockIo.emit).toHaveBeenCalledWith('gravity', expect.objectContaining({
            timestamp: expect.any(Number),
            interval: 1000,
        }));

        gameManager.stopGravity();
        jest.useRealTimers();
    });

    test('should pause and resume gravity', () => {
        jest.useFakeTimers();
        gameManager.startGravity();

        gameManager.pauseGravity();
        expect(gameManager.isRunning).toBe(false);

        gameManager.resumeGravity();
        expect(gameManager.isRunning).toBe(true);

        gameManager.stopGravity();
        jest.useRealTimers();
    });

    test('should stop gravity and clear interval', () => {
        jest.useFakeTimers();
        gameManager.startGravity();
        gameManager.stopGravity();
        expect(gameManager.isRunning).toBe(false);
        expect(gameManager.gravityInterval).toBeNull();
        jest.useRealTimers();
    });

    test('should set gravity speed and restart interval', () => {
        jest.useFakeTimers();
        gameManager.startGravity();

        gameManager.setGravitySpeed(500);
        expect(gameManager.baseGravitySpeed).toBe(500);

        jest.advanceTimersByTime(500);
        expect(mockIo.emit).toHaveBeenCalledWith('gravity', expect.objectContaining({
            timestamp: expect.any(Number),
            interval: 500,
        }));

        gameManager.stopGravity();
        jest.useRealTimers();
    });

    test('should clean up all resources', () => {
        gameManager.cleanup();
        expect(gameManager.pieceSequence).toHaveLength(0);
        expect(gameManager.playerPieceIndices.size).toBe(0);
        expect(gameManager.isRunning).toBe(false);
    });
});
