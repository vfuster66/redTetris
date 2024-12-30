import { isValidPosition, tryRotate } from '../models/Piece.js';

class MovementValidator {
	constructor() {
		this.VALID_MOVES = ['left', 'right', 'down', 'rotate', 'drop', 'hold'];
	}

	validateMove(movement, piece, grid) {
		if (!this.VALID_MOVES.includes(movement.type)) {
			throw new Error('Invalid movement type');
		}

		switch (movement.type) {
			case 'left':
				return isValidPosition(piece, grid, -1, 0);
			case 'right':
				return isValidPosition(piece, grid, 1, 0);
			case 'down':
				return isValidPosition(piece, grid, 0, 1);
			case 'rotate':
				const rotatedPiece = tryRotate(piece, grid, movement.clockwise);

				const canRotate = rotatedPiece !== null && (
					rotatedPiece.rotationIndex !== piece.rotationIndex ||
					rotatedPiece.x !== piece.x ||
					rotatedPiece.y !== piece.y
				);
				return canRotate;
			case 'drop':

				let dropDistance = 0;
				while (isValidPosition(piece, grid, 0, dropDistance + 1)) {
					dropDistance++;
				}
				return dropDistance > 0;
			case 'hold':
				return true;
			default:
				return false;
		}
	}

	// Valide une séquence de mouvements
	validateMoveSequence(movements, piece, grid) {
		let currentPiece = { ...piece };
		let currentGrid = grid.map(row => [...row]);

		for (const movement of movements) {
			if (!this.validateMove(movement, currentPiece, currentGrid)) {
				return false;
			}
			currentPiece = this.applyMove(movement, currentPiece, currentGrid);
		}

		return true;
	}

	// Applique un mouvement à une pièce pour la simulation
	applyMove(movement, piece, grid) {
		switch (movement.type) {
			case 'left':
				return { ...piece, x: piece.x - 1 };
			case 'right':
				return { ...piece, x: piece.x + 1 };
			case 'down':
				return { ...piece, y: piece.y + 1 };
			case 'rotate':
				return tryRotate(piece, grid, movement.clockwise);
			case 'drop':
				let y = piece.y;
				while (isValidPosition(piece, grid, 0, y - piece.y + 1)) {
					y++;
				}
				return { ...piece, y };
			default:
				return piece;
		}
	}

	// Vérifie si un mouvement est autorisé en fonction de l'état du jeu
	isAllowedMove(movement, gameState, playerId) {
		const player = gameState.players.get(playerId);
	
		if (!player || !gameState.isRunning || player.gameOver) {
			console.log(`Move not allowed: gameRunning=${gameState.isRunning}, playerGameOver=${player?.gameOver}`);
			return false;
		}
	
		switch (movement.type) {
			case 'hold':
				if (!player.canHold || player.hasHeldThisTurn) {
					console.log('Hold move not allowed');
					return false;
				}
				return true;
			case 'drop':
				if (player.hasDroppedPiece) {
					console.log('Drop move not allowed');
					return false;
				}
				return true;
			default:
				return true;
		}
	}	

}

export default new MovementValidator();