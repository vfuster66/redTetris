import setupSocketHandlers from '../../src/socket/socketHandler.js';
import GameManager from '../../src/managers/GameManager.js';
import GravityManager from '../../src/managers/GravityManager.js';
import PieceManager from '../../src/managers/PieceManager.js';
import Player from '../../src/models/Player.js';

jest.mock('../../src/managers/GameManager.js', () => {
  return jest.fn().mockImplementation((room, io) => ({
    room,
    isRunning: false,
    players: new Map(),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    getState: jest.fn(() => ({ roomState: 'mocked' })),
    start: jest.fn(),
    isEmpty: jest.fn(() => false),
    hasPlayer: jest.fn(() => false),
    handlePlayerLoss: jest.fn(),
    handleLinesClear: jest.fn(),
    checkWinCondition: jest.fn(),
  }));
});

jest.mock('../../src/managers/GravityManager.js', () => {
  return jest.fn().mockImplementation((room, io) => ({
    room,
    start: jest.fn(),
    cleanup: jest.fn(),
  }));
});

jest.mock('../../src/managers/PieceManager.js', () => {
  return jest.fn().mockImplementation((room) => ({
    room,
    generateNewBatch: jest.fn(),
    getNextPiece: jest.fn(() => ({ type: 'T', rotationIndex: 0 })),
    reset: jest.fn(),
  }));
});

describe('setupSocketHandlers', () => {
  let io, socket, mockEmit, mockTo, mockJoin, mockLeave, mockOn;

  beforeEach(() => {
    jest.clearAllMocks();
    io = { on: jest.fn(), to: jest.fn().mockReturnThis(), emit: jest.fn() };
    setupSocketHandlers(io);
    mockEmit = jest.fn();
    mockTo = jest.fn().mockReturnThis();
    mockJoin = jest.fn();
    mockLeave = jest.fn();
    mockOn = jest.fn();
    socket = {
      id: 'mock-socket-id',
      emit: mockEmit,
      join: mockJoin,
      leave: mockLeave,
      on: mockOn,
      to: mockTo,
    };
    const connectionCallback = io.on.mock.calls[0][1];
    connectionCallback(socket);
  });

  test('should register connection event', () => {
    expect(io.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  test('should handle joinRoom with valid data', () => {
    const joinRoomCallback = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'joinRoom'
    )[1];
    joinRoomCallback({ room: 'testRoom', playerName: 'Alice' });
    expect(GameManager).toHaveBeenCalledTimes(1);
    expect(GameManager).toHaveBeenCalledWith('testRoom', io);
    expect(mockJoin).toHaveBeenCalledWith('testRoom');
    const mockGameManagerInstance = GameManager.mock.results[0].value;
    expect(mockGameManagerInstance.addPlayer).toHaveBeenCalledTimes(1);
    expect(io.to).toHaveBeenCalledWith('testRoom');
    expect(io.emit).toHaveBeenCalledWith('gameState', { roomState: 'mocked' });
  });

  test('should handle joinRoom with missing data', () => {
    const joinRoomCallback = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'joinRoom'
    )[1];
    joinRoomCallback({ room: '', playerName: '' });
    expect(mockEmit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(GameManager).not.toHaveBeenCalled();
  });

  test('should handle startGame by leader', () => {
    const joinRoomCallback = mockOn.mock.calls.find(([evt]) => evt === 'joinRoom')[1];
    joinRoomCallback({ room: 'testRoom', playerName: 'Alice' });
  
    const mockGameManagerInstance = GameManager.mock.results[0].value;
    mockGameManagerInstance.isRunning = false;
  
    const mockPlayer = new Player(socket.id, 'Alice');
    mockPlayer.isLeader = true;
  
    mockGameManagerInstance.players.set(socket.id, mockPlayer);
  
    const startGameCallback = mockOn.mock.calls.find(([evt]) => evt === 'startGame')[1];
    startGameCallback('testRoom');
  
    expect(mockGameManagerInstance.start).toHaveBeenCalledTimes(1);
    expect(GravityManager).toHaveBeenCalledTimes(1);
    const mockGravityManagerInstance = GravityManager.mock.results[0].value;
    expect(mockGravityManagerInstance.start).toHaveBeenCalledTimes(1);
    expect(PieceManager).toHaveBeenCalledTimes(1);
    const mockPieceManagerInstance = PieceManager.mock.results[0].value;
    expect(mockPieceManagerInstance.generateNewBatch).toHaveBeenCalled();
    expect(io.to).toHaveBeenCalledWith('testRoom');
    expect(io.emit).toHaveBeenCalledWith(
      'gameStarted',
      expect.objectContaining({
        gameState: { roomState: 'mocked' },
        piece: { type: 'T', rotationIndex: 0 },
      })
    );
  });  

  test('should refuse startGame if player is not leader', () => {
    const startGameCallback = mockOn.mock.calls.find(
      ([eventName]) => eventName === 'startGame'
    )[1];
    startGameCallback('testRoom');
    expect(mockEmit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'Not authorized to start game' })
    );
  });
});
