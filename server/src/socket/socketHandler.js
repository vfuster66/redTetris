import GameManager from '../managers/GameManager.js';
import GravityManager from '../managers/GravityManager.js';
import PieceManager from '../managers/PieceManager.js';
import Player from '../models/Player.js';
import { isValidPosition, movePiece, tryRotate } from '../models/Piece.js';
import MovementValidator from '../validators/MovementValidator.js';
import SpectrumManager from '../managers/SpectrumManager.js';

const games = new Map();
const players = new Map();
const gameManagers = new Map();
const gravityManagers = new Map();
const pieceManagers = new Map();

export { games };

function updateSpectrumsForRoom(io, gameManager) {
    gameManager.players.forEach(player => {
        spectrumManager.updateSpectrum(gameManager.room, player.id, player.grid);
    });
}

export default function setupSocketHandlers(io) {

    const spectrumManager = new SpectrumManager(io);

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('joinRoom', ({ room, playerName }) => {
            try {
                if (!room || !playerName) {
                    throw new Error('Invalid room or player name');
                }

                console.log(`[INFO] Player ${playerName} is trying to join room ${room}`);

                if (!games.has(room)) {
                    const gameManager = new GameManager(room, io);
                    const gravityManager = new GravityManager(room, io);
                    const pieceManager = new PieceManager(room);

                    gameManagers.set(room, gameManager);
                    gravityManagers.set(room, gravityManager);
                    pieceManagers.set(room, pieceManager);

                    spectrumManager.startTracking(room);

                    games.set(room, gameManager);
                }

                const gameManager = gameManagers.get(room);
                const pieceManager = pieceManagers.get(room);

                if (gameManager.isRunning) {
                    socket.emit('error', { message: 'Game is already in progress' });
                    console.warn(`[WARN] Player ${playerName} tried to join running game in room ${room}`);
                    return;
                }

                if (!gameManager || !GravityManager || !pieceManager || !spectrumManager) {
                    throw new Error('Required services not found');
                }

                const player = new Player(socket.id, playerName);
                players.set(socket.id, player);
                gameManager.addPlayer(player);
                socket.join(room);

                console.log(`[INFO] Player ${playerName} joined room ${room}`);

                io.to(room).emit('gameState', gameManager.getState());
            } catch (error) {
                console.error(`[ERROR] joinRoom: ${error.message}`);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('startGame', (room) => {
            try {
                console.log(`[INFO] Room ${room}: Start game requested`);

                const gameManager = gameManagers.get(room);
                const gravityManager = gravityManagers.get(room);
                const pieceManager = pieceManagers.get(room);
                const player = players.get(socket.id);

                if (!gameManager || !player || !player.isLeader) {
                    socket.emit('error', { message: 'Not authorized to start game' });
                    console.warn(`[WARN] Unauthorized startGame attempt by player ${socket.id} in room ${room}`);
                    return;
                }

                gameManager.start();
                gravityManager.start();
                pieceManager.generateNewBatch();

                const firstPiece = pieceManager.getNextPiece();
                io.to(room).emit('gameStarted', {
                    gameState: gameManager.getState(),
                    piece: firstPiece,
                });
                console.log(`[INFO] Room ${room}: Game started`);
            } catch (error) {
                console.error(`[ERROR] startGame: ${error.message}`);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('requestPiece', (room) => {

            try {
                console.log(`[INFO] Player ${socket.id} requested a new piece in room ${room}`);
                const pieceManager = pieceManagers.get(room);
                const piece = pieceManager.getNextPiece();
                socket.emit('nextPiece', { piece });
            } catch (error) {
                console.error(`[ERROR] requestPiece: ${error.message}`);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('movePiece', ({ room, movement }) => {
            try {
                if (!movement || typeof movement !== 'object') {
                    throw new Error('Invalid movement data');
                }

                const gameManager = gameManagers.get(room);
                const gravityManager = gravityManagers.get(room);
                const player = players.get(socket.id);
        
                if (!gameManager || !player || !gameManager.isRunning || !player.isPlaying) {
                    throw new Error('Invalid game or player state');
                }

                const currentPiece = player.piece;
                if (!currentPiece) {
                    throw new Error('No active piece to move');
                }

                const validator = new MovementValidator();
                if (!validator.validateMove(movement, currentPiece, player.grid)) {
                    throw new Error('Invalid movement');
                }
        
                let newPiece = currentPiece;
                switch (movement.type) {
                    case 'move':
                        newPiece = movePiece(currentPiece, movement.offsetX, movement.offsetY);
                        break;
                    case 'rotate':
                        newPiece = tryRotate(currentPiece, player.grid, movement.clockwise);
                        break;
                    case 'drop':
                        let dropDistance = 0;
                        while (isValidPosition(newPiece, player.grid, 0, dropDistance + 1)) {
                            dropDistance++;
                        }
                        newPiece = movePiece(currentPiece, 0, dropDistance);
                        break;
                    case 'hold':
                        if (!player.canHold) {
                            throw new Error('Cannot hold piece now');
                        }
                        newPiece = player.holdCurrentPiece();
                        if (!newPiece) {
                            const pieceManager = pieceManagers.get(room);
                            newPiece = pieceManager.getNextPiece().piece;
                        }
                        player.canHold = false;
                        break;
                    default:
                        throw new Error('Unknown movement type');
                }

                if (!isValidPosition(newPiece, player.grid)) {
                    throw new Error('Invalid position after movement');
                }

                player.piece = newPiece;
                console.log(`[INFO] Player ${player.id} moved piece in room ${room}`, movement.type);

                socket.to(room).emit('playerMoved', {
                    playerId: player.id,
                    movement,
                    piecePosition: {
                        x: newPiece.x,
                        y: newPiece.y,
                        rotation: newPiece.rotationIndex
                    }
                });
        
                const canMoveDown = isValidPosition(newPiece, player.grid, 0, 1);
                if (!canMoveDown) {
                    player.grid = placePieceOnGrid(player.grid, newPiece);
                    player.piece = null;

                    spectrumManager.updateSpectrum(room, player.id, player.grid);
                    
                    const completedLines = checkCompletedLines(player.grid);
                    if (completedLines.length > 0) {
                        socket.emit('linesCompleted', {
                            numLines: completedLines.length,
                            lines: completedLines
                        });
                    }
        
                    io.to(room).emit('piecePlaced', { 
                        playerId: player.id, 
                        grid: player.grid,
                        spectrum: spectrumManager.getPlayerSpectrum(room, player.id)
                    });
        
                    if (player.checkGameOver()) {
                        gameManager.handlePlayerLoss(player.id);
                    }
                }
        
            } catch (error) {
                console.error(`[ERROR] movePiece: ${error.message}`);
                socket.emit('error', { 
                    message: error.message,
                    type: 'MOVEMENT_ERROR'
                });
            }
        });

        socket.on('linesCleared', ({ room, numLines }) => {
            try {
                const gameManager = gameManagers.get(room);
                const player = players.get(socket.id);
        
                if (!gameManager || !player) {
                    throw new Error('Game manager or player not found');
                }
        
                gameManager.handleLinesClear(player.id, numLines);
        
                if (numLines > 1) {
                    const penaltyLines = numLines - 1;
        
                    for (const [playerId, otherPlayer] of gameManager.players) {
                        if (playerId !== player.id) {
                            const gameOver = otherPlayer.addPenaltyLines(penaltyLines);
        
                            io.to(otherPlayer.id).emit('addPenaltyLines', {
                                numLines: penaltyLines,
                                grid: otherPlayer.grid,
                            });
        
                            if (gameOver) {
                                console.log(`[INFO] Player "${otherPlayer.id}" is out of the game`);
                                otherPlayer.isPlaying = false;
        
                                const winner = gameManager.checkWinCondition();
                                if (winner) {
                                    io.to(room).emit('gameOver', { winner: winner.getState() });
                                    return;
                                }
                            }
                        }
                        spectrumManager.updateSpectrum(room, playerId, otherPlayer.grid);
                    }
                }
        
                io.to(room).emit('gameState', gameManager.getState());
            } catch (error) {
                console.error(`[ERROR] linesCleared: ${error.message}`);
                socket.emit('error', { message: error.message });
            }
        });        

        socket.on('updateSpectrum', ({ room }) => {
            try {
                const gameManager = gameManagers.get(room);
                const player = players.get(socket.id);
        
                if (!gameManager || !player) return;
        
                spectrumManager.updateSpectrum(room, player.id, player.grid);
                
                if (spectrumManager.isPlayerInDanger(room, player.id)) {
                    io.to(room).emit('playerInDanger', {
                        playerId: player.id,
                        spectrum: spectrumManager.getPlayerSpectrum(room, player.id)
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('leaveRoom', (room) => {
            try {
                const gameManager = gameManagers.get(room);
                const player = players.get(socket.id);

                if (!gameManager || !player) {
                    socket.emit('error', { message: 'Invalid room or player' });
                    return;
                }

                gameManager.removePlayer(player.id);
                socket.leave(room);
                io.to(room).emit('gameState', gameManager.getState());

                if (gameManager.isEmpty()) {

                    spectrumManager.stopTracking(room);

                    gameManagers.delete(room);
                    if (gravityManagers.has(room)) {
                        gravityManagers.get(room).cleanup();
                        gravityManagers.delete(room);
                    }
                    if (pieceManagers.has(room)) {
                        pieceManagers.get(room).reset();
                        pieceManagers.delete(room);
                    }
                }

                spectrumManager.removePlayer(room, player.id);

                players.delete(socket.id);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Gestion de la déconnexion
        socket.on('disconnect', () => {
            try {
                const player = players.get(socket.id);
                if (!player) return;

                console.log(`[INFO] Player ${player.id} disconnected`);

                for (const [room, gameManager] of gameManagers) {
                    if (gameManager.hasPlayer(player.id)) {
                        gameManager.removePlayer(player.id);
                        io.to(room).emit('gameState', gameManager.getState());

                        if (gameManager.isEmpty()) {
                            spectrumManager.stopTracking(room);
                            gameManagers.delete(room);
                            if (gravityManagers.has(room)) {
                                gravityManagers.get(room).cleanup();
                                gravityManagers.delete(room);
                            }
                            if (pieceManagers.has(room)) {
                                pieceManagers.get(room).reset();
                                pieceManagers.delete(room);
                            }
                            console.log(`[INFO] Room ${room} deleted after last player disconnected`);
                        }
                        spectrumManager.removePlayer(room, player.id);
                        break;
                    }
                }

                players.delete(socket.id);
            } catch (error) {
                console.error('Error on disconnect:', error.message);
            }
        });
    });
}
