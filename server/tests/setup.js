// tests/setup.js

// Chargement des variables d'environnement
import { config } from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
config();

// Moquer certaines fonctions globales ou configurations
global.console = {
    log: jest.fn(), // Moquer console.log pour éviter un affichage excessif
    error: jest.fn(), // Moquer console.error pour capturer les erreurs dans les tests
    warn: jest.fn(), // Moquer console.warn
    info: jest.fn(), // Moquer console.info
    debug: jest.fn(), // Moquer console.debug
};

// Utilisation d'une base de données temporaire si nécessaire
// Exemple avec SQLite pour un backend qui utilise une base relationnelle
process.env.DB_URL = process.env.TEST_DB_URL || 'sqlite::memory:';

// Configuration pour éviter les erreurs non gérées
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    throw reason;
});

// Exécution de hooks pour nettoyer l'état entre les tests (si nécessaire)
beforeEach(() => {
    jest.clearAllMocks(); // Réinitialise les mocks avant chaque test
});

// Exemple de moquer certaines dépendances si elles sont courantes dans le projet
jest.mock('../src/utils/logger.js', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));
