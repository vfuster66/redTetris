import Game from '../../src/models/Game.js';

jest.mock('../../src/models/Piece.js', () => ({
    createPiece: jest.fn((type) => ({ type, rotation: 0, x: 3, y: 0 })),
    getRandomPieceType: jest.fn(() => 'T')
}));

describe('Game', () => {
    let game;

    beforeEach(() => {
        game = new Game('testRoom', true); // Partie solo
    });

    test('should initialize with default properties', () => {
        expect(game.roomId).toBe('testRoom');
        expect(game.players.size).toBe(0);
        expect(game.pieceSequence).toEqual([]);
        expect(game.nextPieceIndex).toBe(0);
        expect(game.isRunning).toBe(false);
        expect(game.isSolo).toBe(true);
        expect(game.dropInterval).toBe(1000);
        expect(game.level).toBe(1);
    });

    test('should generate a new piece sequence', () => {
        game.generatePieceSequence();
        expect(game.pieceSequence.length).toBe(50);
        expect(game.pieceSequence.every(type => type === 'T')).toBe(true);
    });

    test('should get the next piece', () => {
        game.generatePieceSequence();
        const piece = game.getNextPiece();
        expect(piece).toEqual({ type: 'T', rotation: 0, x: 3, y: 0 });
        expect(game.nextPieceIndex).toBe(1);
    });

    test('should add a player', () => {
        const mockPlayer = {
            id: 'player1',
            reset: jest.fn(),
            setNextPiece: jest.fn(),
            isPlaying: false,
            getState: jest.fn(() => ({ id: 'player1', state: 'mockState' }))
        };
        game.addPlayer(mockPlayer);

        expect(game.players.size).toBe(1);
        expect(game.players.get('player1')).toBe(mockPlayer);
        expect(mockPlayer.reset).toHaveBeenCalledWith(true);
        expect(mockPlayer.setNextPiece).toHaveBeenCalledWith({ type: 'T', rotation: 0, x: 3, y: 0 });
    });

    test('should throw error when adding a second player in solo mode', () => {
        const mockPlayer1 = { id: 'player1', reset: jest.fn(), setNextPiece: jest.fn() };
        const mockPlayer2 = { id: 'player2', reset: jest.fn(), setNextPiece: jest.fn() };
        game.addPlayer(mockPlayer1);

        expect(() => game.addPlayer(mockPlayer2)).toThrow('Solo game already has a player');
    });

    test('should start the game', () => {
        const mockPlayer = {
            id: 'player1',
            reset: jest.fn(),
            setNextPiece: jest.fn(),
            isPlaying: false
        };
        game.addPlayer(mockPlayer);
        game.start();

        expect(game.isRunning).toBe(true);
        expect(game.pieceSequence.length).toBeGreaterThan(0);
        expect(game.nextPieceIndex).toBe(1);
        expect(mockPlayer.reset).toHaveBeenCalledWith(true);
        expect(mockPlayer.isPlaying).toBe(true);
        expect(mockPlayer.setNextPiece).toHaveBeenCalled();
    });

    test('should stop the game', () => {
        const mockPlayer = {
            id: 'player1',
            isPlaying: true,
            reset: jest.fn(),
            setNextPiece: jest.fn()
        };
        game.addPlayer(mockPlayer);
        game.start();
        game.stop();

        expect(game.isRunning).toBe(false);
        expect(game.nextPieceIndex).toBe(0);
        expect(game.pieceSequence).toEqual([]);
        expect(mockPlayer.isPlaying).toBe(false);
    });

    test('should handle lines cleared in solo mode', () => {
        const mockPlayer = {
            id: 'player1',
            score: 500,
            reset: jest.fn(),
            setNextPiece: jest.fn()
        };
        game.addPlayer(mockPlayer);
        game.handleLinesClear('player1', 2);

        expect(game.level).toBe(1);
        expect(game.dropInterval).toBe(1000);
    });

    test('should get game state', () => {
        const mockPlayer = {
            id: 'player1',
            getState: jest.fn(() => ({ id: 'player1', state: 'mockState' })),
            reset: jest.fn(),
            setNextPiece: jest.fn()
        };
        game.addPlayer(mockPlayer);
        const state = game.getState();

        expect(state).toEqual({
            roomId: 'testRoom',
            isRunning: false,
            isSolo: true,
            players: [{ id: 'player1', state: 'mockState' }],
            level: 1,
            dropInterval: 1000
        });
    });
});
