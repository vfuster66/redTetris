const TETRIMINOS = {
    I: {
        rotations: [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0]
            ]
        ],
        color: "cyan",
        startOffset: { x: 3, y: -1 }
    },
    O: {
        rotations: [
            [
                [1, 1],
                [1, 1]
            ]
        ],
        color: "yellow",
        startOffset: { x: 4, y: 0 }
    },
    T: {
        rotations: [
            [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ],
        color: "purple",
        startOffset: { x: 3, y: 0 }
    },
    S: {
        rotations: [
            [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 0, 0],
                [0, 1, 1],
                [1, 1, 0]
            ],
            [
                [1, 0, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ],
        color: "green",
        startOffset: { x: 3, y: 0 }
    },
    Z: {
        rotations: [
            [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 0, 1],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0]
            ]
        ],
        color: "red",
        startOffset: { x: 3, y: 0 }
    },
    J: {
        rotations: [
            [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 1],
                [0, 1, 0],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [1, 1, 0]
            ]
        ],
        color: "blue",
        startOffset: { x: 3, y: 0 }
    },
    L: {
        rotations: [
            [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [1, 0, 0]
            ],
            [
                [1, 1, 0],
                [0, 1, 0],
                [0, 1, 0]
            ]
        ],
        color: "orange",
        startOffset: { x: 3, y: 0 }
    }
};

// Vérifie si la position est valide (pas de collision avec les murs ou d'autres pièces)
function isValidPosition(piece, grid, offsetX = 0, offsetY = 0) {
    const shape = TETRIMINOS[piece.type].rotations[piece.rotationIndex];

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;

                // Vérifie si la position est hors des limites
                if (newX < 0 || newX >= grid[0].length || newY >= grid.length) {
                    console.log(`Position out of bounds at (${newX}, ${newY})`);
                    return false;
                }

                // Ignore les blocs au-dessus de la grille
                if (newY < 0) {
                    continue;
                }

                // Vérifie les collisions
                if (grid[newY][newX] !== 0) {
                    console.log(`Collision detected at grid[${newY}][${newX}]`);
                    return false;
                }
            }
        }
    }

    return true;
}

// Système de wall kick basé sur les règles officielles du SRS (Super Rotation System)
const WALL_KICK_DATA = {
    'JLSTZ': [ // Pour les pièces J, L, S, T, Z
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 0->R
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],     // R->0
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],     // R->2
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 2->R
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],    // 2->L
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],  // L->2
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],  // L->0
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]     // 0->L
    ],
    'I': [ // Pour la pièce I
        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
    ]
};

// Tente de faire tourner une pièce avec wall kick
function tryRotate(piece, grid, clockwise = true) {
    const currentRotationIndex = piece.rotationIndex;
    const totalRotations = TETRIMINOS[piece.type].rotations.length;
    const newRotationIndex = clockwise
        ? (currentRotationIndex + 1) % totalRotations
        : (currentRotationIndex + totalRotations - 1) % totalRotations;

    const kickData = WALL_KICK_DATA[piece.type === 'I' ? 'I' : 'JLSTZ'];
    const testIndex = 2 * currentRotationIndex + (clockwise ? 0 : 1);
    const tests = kickData[testIndex];

    for (const [offsetX, offsetY] of tests) {
        const rotatedPiece = {
            ...piece,
            rotationIndex: newRotationIndex,
            x: piece.x + offsetX,
            y: piece.y + offsetY,
        };

        if (isValidPosition(rotatedPiece, grid)) {
            console.log('Rotation successful with offset:', offsetX, offsetY);
            return rotatedPiece;
        }
    }

    console.log('Rotation blocked.');
    return piece; // La rotation est bloquée
}

// Vérifie si une ligne est complétée
function isLineFull(grid, y) {
    return grid[y].every(cell => cell !== 0);
}

// Vérifie si la pièce peut descendre
function canMoveDown(piece, grid) {
    return isValidPosition(piece, grid, 0, 1);
}

// Vérifie si c'est game over (collision dans la zone de spawn)
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

function createPiece(type) {
    if (!TETRIMINOS[type]) {
        throw new Error(`Invalid piece type: ${type}`);
    }

    return {
        type,
        rotationIndex: 0,
        shape: TETRIMINOS[type].rotations[0],
        color: TETRIMINOS[type].color,
        x: TETRIMINOS[type].startOffset.x,
        y: TETRIMINOS[type].startOffset.y
    };
}

function movePiece(piece, deltaX, deltaY) {
    return {
        ...piece,
        x: piece.x + deltaX,
        y: piece.y + deltaY
    };
}

function getRandomPieceType() {
    const types = Object.keys(TETRIMINOS);
    return types[Math.floor(Math.random() * types.length)];
}

function placePieceOnGrid(grid, piece) {
    const shape = TETRIMINOS[piece.type].rotations[piece.rotationIndex];

    shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const gridX = piece.x + x;
                const gridY = piece.y + y;
                if (gridY >= 0 && gridY < grid.length && gridX >= 0 && gridX < grid[0].length) {
                    grid[gridY][gridX] = value;
                }
            }
        });
    });

    return grid;
}

export {
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
};