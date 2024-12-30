import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { games } from '../src/socket/socketHandler.js'; // Importation de l'objet games
import setupSocketHandlers from '../src/socket/socketHandler.js';

describe('Red Tetris Server', () => {
    let app;
    let httpServer;
    let io;

    beforeAll(() => {
        app = express();
        httpServer = createServer(app);
        io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000
        });

        app.use(express.json());

        // Middleware
        app.get('/', (req, res) => {
            res.send('Red Tetris Server Running');
        });

        app.get('/api/rooms/:roomId', (req, res) => {
            const { roomId } = req.params;
            const isSolo = roomId.startsWith('solo_');
            const room = games.get(roomId); // Utilisation de l'objet global `games`

            if (room) {
                if (room.isRunning && !room.isSolo) {
                    res.status(403).json({ error: 'Game is already in progress' });
                } else if (room.isSolo && room.players.size > 0) {
                    res.status(403).json({ error: 'Solo game already has a player' });
                } else {
                    res.json({ canJoin: true });
                }
            } else {
                res.json({ canJoin: true });
            }
        });

        setupSocketHandlers(io);
    });

    afterAll(() => {
        httpServer.close();
    });

    afterEach(() => {
        // Nettoyer l'objet `games` après chaque test
        games.clear();
    });

    test('GET / should return server status', async () => {
        const response = await request(httpServer).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('Red Tetris Server Running');
    });

    test('GET /api/rooms/:roomId should validate room join status', async () => {
        const roomId = 'solo_123';

        games.set(roomId, {
            isRunning: false,
            isSolo: true,
            players: new Map(),
        });

        const response = await request(httpServer).get(`/api/rooms/${roomId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ canJoin: true });
    });

    test('GET /api/rooms/:roomId should prevent joining an in-progress game', async () => {
        const roomId = 'multi_123';

        games.set(roomId, {
            isRunning: true,
            isSolo: false,
            players: new Map(),
        });

        const response = await request(httpServer).get(`/api/rooms/${roomId}`);
        expect(response.statusCode).toBe(403);
        expect(response.body).toEqual({ error: 'Game is already in progress' });
    });
});
