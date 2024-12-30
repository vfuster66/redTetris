import Player from '../../src/models/Player.js';

describe('Player', () => {
    let player;

    beforeEach(() => {
        player = new Player('player1', 'Player One');
    });

    test('should initialize with correct properties', () => {
        expect(player.id).toBe('player1');
        expect(player.name).toBe('Player One');
        expect(player.grid).toHaveLength(20);
        expect(player.grid[0]).toHaveLength(10);
        expect(player.score).toBe(0);
        expect(player.isPlaying).toBe(false);
        expect(player.isLeader).toBe(false);
        expect(player.piece).toBeNull();
        expect(player.gameOver).toBe(false);
        expect(player.isSoloMode).toBe(false);
        expect(player.nextPiece).toBeNull();
        expect(player.holdPiece).toBeNull();
        expect(player.canHold).toBe(true);
    });

    test('should reset player state', () => {
        player.score = 1000;
        player.isPlaying = true;
        player.isLeader = true;
        player.gameOver = true;

        player.reset(true); // Reset en mode solo
        expect(player.grid.every(row => row.every(cell => cell === 0))).toBe(true);
        expect(player.score).toBe(0);
        expect(player.isPlaying).toBe(false);
        expect(player.isLeader).toBe(true);
        expect(player.gameOver).toBe(false);
        expect(player.isSoloMode).toBe(true);
    });

    test('should calculate spectrum correctly', () => {
        player.grid[19][0] = 1;
        player.grid[18][1] = 1;

        const spectrum = player.getSpectrum();
        expect(spectrum[0]).toBe(19); // Première colonne
        expect(spectrum[1]).toBe(18); // Deuxième colonne
        expect(spectrum.slice(2).every(height => height === 20)).toBe(true);
    });

    test('should add penalty lines correctly', () => {
        player.grid[19] = Array(10).fill(1); // Une ligne complète
        const initialGrid = [...player.grid];

        player.addPenaltyLines(2);

        // Vérifie que 2 lignes de pénalité ont été ajoutées
        expect(player.grid[18]).toEqual(Array(10).fill(8));
        expect(player.grid[19]).toEqual(Array(10).fill(8));

        // Vérifie que les lignes supérieures ont été décalées
        expect(player.grid.slice(0, 18)).toEqual(initialGrid.slice(2));
    });

    test('should clear full lines and update score', () => {
        player.isSoloMode = true; // Mode solo pour plus de points
        player.grid[19] = Array(10).fill(1);
        player.grid[18] = Array(10).fill(1);

        const linesCleared = player.clearLines();

        expect(linesCleared).toBe(2);
        expect(player.grid[18]).toEqual(Array(10).fill(0)); // Nouvelle ligne vide
        expect(player.grid[19]).toEqual(Array(10).fill(0)); // Nouvelle ligne vide
        expect(player.score).toBe(200); // 100 points par ligne en solo
    });

    test('should hold current piece in solo mode', () => {
        player.isSoloMode = true;
        const piece = { type: 'T' };
        player.piece = piece;

        const heldPiece = player.holdCurrentPiece();

        expect(heldPiece).toBeNull(); // Pas de pièce dans holdPiece avant
        expect(player.holdPiece).toEqual(piece);
        expect(player.piece).toBeNull();
        expect(player.canHold).toBe(false);
    });

    test('should prevent hold if not solo mode or already held', () => {
        player.isSoloMode = false;
        expect(player.holdCurrentPiece()).toBeNull();

        player.isSoloMode = true;
        player.canHold = false;
        expect(player.holdCurrentPiece()).toBeNull();
    });

    test('should detect game over correctly', () => {
        player.grid[0][0] = 1; // Collision en zone de spawn
        expect(player.checkGameOver()).toBe(true);
        expect(player.gameOver).toBe(true);
        expect(player.isPlaying).toBe(false);
    });

    test('should return player state correctly', () => {
        const state = player.getState();
        expect(state).toEqual({
            id: 'player1',
            name: 'Player One',
            grid: player.grid,
            score: 0,
            isPlaying: false,
            isLeader: false,
            gameOver: false,
            isSoloMode: false,
            spectrum: player.getSpectrum()
        });
    });

    test('should set next piece in solo mode', () => {
        const piece = { type: 'T' };
        player.isSoloMode = true;
        player.setNextPiece(piece);

        expect(player.nextPiece).toEqual(piece);
    });

    test('should re-enable hold after new piece is placed in solo mode', () => {
        player.isSoloMode = true;
        player.newPiecePlaced();

        expect(player.canHold).toBe(true);
    });
});
