import PieceManager from '../../src/managers/PieceManager.js';

describe('PieceManager', () => {
    let pieceManager;

    beforeEach(() => {
        pieceManager = new PieceManager('testGame');
    });

    test('should initialize with default properties', () => {
        expect(pieceManager.gameId).toBe('testGame');
        expect(pieceManager.sequence).toEqual([]);
        expect(pieceManager.currentIndex).toBe(0);
        expect(pieceManager.seedValue).toBeDefined();
    });

    test('should generate a new batch of pieces', () => {
        pieceManager.generateNewBatch();
        expect(pieceManager.sequence.length).toBe(100);
        expect(pieceManager.sequence.every(piece => ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].includes(piece.type))).toBe(true);
    });

    test('should generate unique sequences on multiple calls', () => {
        pieceManager.generateNewBatch();
        const firstBatch = [...pieceManager.sequence];
    
        pieceManager.generateNewBatch();
        const secondBatch = [...pieceManager.sequence.slice(100)];
    
        expect(firstBatch).not.toEqual(secondBatch);
    });
    

    test('should get the next piece and advance the index', () => {
        pieceManager.generateNewBatch();
        const initialIndex = pieceManager.currentIndex;

        const nextPiece = pieceManager.getNextPiece();
        expect(nextPiece).toHaveProperty('type');
        expect(nextPiece).toHaveProperty('startX', 3);
        expect(nextPiece).toHaveProperty('startY', 0);
        expect(nextPiece).toHaveProperty('rotation', 0);
        expect(nextPiece.index).toBe(initialIndex);
        expect(pieceManager.currentIndex).toBe(initialIndex + 1);
    });

    test('should generate a new batch if sequence is low', () => {
        pieceManager.generateNewBatch();
        pieceManager.currentIndex = 95;

        const nextPiece = pieceManager.getNextPiece();
        expect(nextPiece).toBeDefined();
        expect(pieceManager.sequence.length).toBeGreaterThan(100); // Nouvelle batch ajoutée
    });

    test('should get a piece by index', () => {
        pieceManager.generateNewBatch();
        const piece = pieceManager.getPieceAtIndex(10);

        expect(piece).toBeDefined();
        expect(piece).toHaveProperty('type');
        expect(piece).toHaveProperty('startX', 3);
        expect(piece).toHaveProperty('startY', 0);
        expect(piece).toHaveProperty('rotation', 0);
    });

    test('should sync player to sequence', () => {
        pieceManager.generateNewBatch();
        pieceManager.currentIndex = 20;

        const syncedPieces = pieceManager.syncPlayerToSequence(15);
        expect(syncedPieces.length).toBe(4);
        expect(syncedPieces[0].index).toBe(16);
    });

    test('should reset the sequence and reinitialize', () => {
        pieceManager.generateNewBatch();
        expect(pieceManager.sequence.length).toBe(100);

        pieceManager.reset();
        expect(pieceManager.sequence.length).toBe(100); // Réinitialisé avec une nouvelle batch
        expect(pieceManager.currentIndex).toBe(0);
        expect(pieceManager.seedValue).toBeDefined();
    });
});
