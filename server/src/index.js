import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from 'dotenv';
import setupSocketHandlers from './socket/socketHandler.js';
import setupSocketHandlers, { games } from './socket/socketHandler.js';


// Chargement des variables d'environnement
config();

const app = express();
const httpServer = createServer(app);

// Configuration de Socket.io avec CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000
});

// Middleware
app.use(cors());
app.use(express.json());

// Route de base
app.get('/', (req, res) => {
  res.send('Red Tetris Server Running');
});

// Route pour valider une room
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const isSolo = roomId.startsWith('solo_');
  
  // Vérifie si la partie existe et peut être rejointe
  const game = games.get(roomId);
  if (game) {
    if (game.isRunning && !game.isSolo) {
      res.status(403).json({ error: 'Game is already in progress' });
    } else if (game.isSolo && game.players.size > 0) {
      res.status(403).json({ error: 'Solo game already has a player' });
    } else {
      res.json({ canJoin: true });
    }
  } else {
    res.json({ canJoin: true });
  }
});

// Configuration des gestionnaires Socket.io
setupSocketHandlers(io);

// Démarrage du serveur
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});