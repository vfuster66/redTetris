import {
    createPiece,
    movePiece,
    tryRotate,
    isValidPosition,
    canMoveDown,
    isGameOver,
    isLineFull,
    getRandomPieceType,
    placePieceOnGrid,
    TETRIMINOS
} from '../../src/models/Piece.js';

describe('Tetriminos', () => {
    let grid, piece;

    beforeEach(() => {
        // Crée une grille vide
        grid = Array(20).fill().map(() => Array(10).fill(0));
        // Crée une pièce dans la zone de spawn
        piece = createPiece('T'); // Type "T" choisi arbitrairement
        piece.y = 0; // Assure que la pièce est dans la zone de spawn
    });

    test('should create a piece with correct properties', () => {
        const piece = createPiece('T');
        expect(piece).toEqual({
            type: 'T',
            rotationIndex: 0,
            shape: TETRIMINOS['T'].rotations[0],
            color: TETRIMINOS['T'].color,
            x: TETRIMINOS['T'].startOffset.x,
            y: TETRIMINOS['T'].startOffset.y
        });
    });

    test('should throw error for invalid piece type', () => {
        expect(() => createPiece('X')).toThrow('Invalid piece type: X');
    });

    test('should move a piece correctly', () => {
        const piece = createPiece('I');
        const movedPiece = movePiece(piece, 1, -1);
        expect(movedPiece).toEqual({ ...piece, x: piece.x + 1, y: piece.y - 1 });
    });

    test('should validate position correctly', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        const piece = createPiece('O');
        expect(isValidPosition(piece, grid)).toBe(true);

        // Place a block on the grid to create collision
        grid[0][4] = 1;
        expect(isValidPosition(piece, grid)).toBe(false);
    });

    test('should detect if a piece can move down', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        const piece = createPiece('O');
        expect(canMoveDown(piece, grid)).toBe(true);

        // Place a block to block downward movement
        grid[1][4] = 1;
        expect(canMoveDown(piece, grid)).toBe(false);
    });

    function isGameOver(piece, grid) {
        const shape = TETRIMINOS[piece.type].rotations[piece.rotationIndex];
    
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;
    
                    // Si un bloc de la pièce est hors de la grille ou en collision
                    if (newX < 0 || newX >= 10 || newY < 0 || newY >= 20 || 
                        (newY < 2 && grid[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
    
        return false;
    }
    
    test('should detect full line correctly', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        grid[19] = Array(10).fill(1);
        expect(isLineFull(grid, 19)).toBe(true);
        expect(isLineFull(grid, 18)).toBe(false);
    });

    test('should place piece on grid correctly', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        const piece = createPiece('T');
        piece.x = 4;
        piece.y = 0;

        const updatedGrid = placePieceOnGrid(grid, piece);
        expect(updatedGrid[0][5]).toBe(1); // Top middle of 'T'
        expect(updatedGrid[1][4]).toBe(1); // Bottom left of 'T'
    });

    test('should rotate piece with wall kick correctly', () => {
        const grid = Array.from({ length: 20 }, () => Array(10).fill(0));
        const piece = createPiece('L');

        // Rotate clockwise
        const rotatedPiece = tryRotate(piece, grid, true);
        expect(rotatedPiece.rotationIndex).toBe(1);

        // Rotate counter-clockwise
        const revertedPiece = tryRotate(rotatedPiece, grid, false);
        expect(revertedPiece.rotationIndex).toBe(0);
    });

    test('should get a random piece type', () => {
        const pieceType = getRandomPieceType();
        expect(Object.keys(TETRIMINOS)).toContain(pieceType);
    });
});
