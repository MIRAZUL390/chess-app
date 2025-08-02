/**
 * Main Chess Application
 * Coordinates all modules and manages the overall game flow
 */

class ChessApp {
    constructor() {
        this.gameEngines = {};  // Separate engines for each section
        this.currentGameEngine = null;
        this.uiManager = null;
        this.voiceRecognition = null;
        this.gameMode = 'human-vs-human';
        this.stockfish = null;
        this.stockfishReady = false;
        this.aiColor = 'black';
        this.aiDifficulty = 'medium';
        this.isInitialized = false;
        this.currentSection = 'home';
    }

    /**
     * Initialize the chess application
     */
    async initialize() {
        console.log('Initializing Chess Application...');

        try {
            // Initialize separate game engines for each section
            this.gameEngines = {
                'play-ai': new ChessEngine(),
                'analysis': new ChessEngine(),
                'play-in-person': new ChessEngine()
            };
            
            // Initialize all game engines
            Object.values(this.gameEngines).forEach(engine => {
                engine.initializeBoard();
            });
            
            // Set default current engine
            this.currentGameEngine = this.gameEngines['play-ai'];
            
            // Initialize UI manager
            this.uiManager = new UIManager();
            this.uiManager.initialize(this.currentGameEngine);
            
            // Set up UI callbacks
            this.setupUICallbacks();
            
            // Initialize voice recognition
            await this.initializeVoiceRecognition();
            
            // Initialize Stockfish for AI games
            this.initializeStockfish();
            
            // Render initial board
            this.uiManager.renderBoard();
            
            // Set up global event listeners
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            console.log('Chess Application initialized successfully');
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('Failed to initialize Chess Application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Set up UI callback functions
     */
    setupUICallbacks() {
        this.uiManager.setCallback('onMoveComplete', () => {
            this.handleMoveComplete();
        });

        this.uiManager.setCallback('onGameModeChange', (mode) => {
            this.handleGameModeChange(mode);
        });

        this.uiManager.setCallback('onVoiceToggle', () => {
            this.toggleVoiceRecognition();
        });

        this.uiManager.setCallback('onLocalVoiceToggle', () => {
            this.toggleLocalVoiceRecognition();
        });

        this.uiManager.setCallback('onAIDifficultyChange', (difficulty) => {
            this.handleAIDifficultyChange(difficulty);
        });

        this.uiManager.setCallback('onSectionChange', (section) => {
            this.handleSectionChange(section);
        });

        this.uiManager.setCallback('onMoveComplete', () => {
            this.handleMoveComplete();
        });
    }

    /**
     * Initialize voice recognition
     */
    async initializeVoiceRecognition() {
        try {
            this.voiceRecognition = new VoiceRecognition();
            
            // Set up voice recognition callbacks
            this.voiceRecognition.setCallback('onStart', () => {
                this.updateVoiceButton(true);
                this.uiManager.showMessage('Listening for chess move...', 'info');
            });

            this.voiceRecognition.setCallback('onEnd', () => {
                this.updateVoiceButton(false);
            });

            this.voiceRecognition.setCallback('onResult', (result) => {
                this.handleVoiceResult(result);
            });

            this.voiceRecognition.setCallback('onError', (error) => {
                this.handleVoiceError(error);
            });

            this.voiceRecognition.setCallback('onInterim', (transcript) => {
                this.updateVoiceFeedback(`Hearing: "${transcript}"`);
            });

            console.log('Voice recognition initialized');
            
        } catch (error) {
            console.warn('Voice recognition initialization failed:', error);
        }
    }

    /**
     * Initialize Stockfish AI engine
     */
    initializeStockfish() {
        try {
            // Try to create Stockfish worker
            this.stockfish = new Worker('stockfish.js');
            
            this.stockfish.onmessage = (event) => {
                this.handleStockfishMessage(event.data);
            };

            this.stockfish.onerror = (error) => {
                console.error('Stockfish error:', error);
            };

            // Initialize UCI protocol
            this.stockfish.postMessage('uci');
            
            console.log('Stockfish initialization started');
            
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
        }
    }

    /**
     * Handle Stockfish messages
     */
    handleStockfishMessage(message) {
        console.log('Stockfish:', message);

        if (message === 'uciok') {
            this.stockfish.postMessage('isready');
        } else if (message === 'readyok') {
            this.stockfishReady = true;
            console.log('Stockfish is ready');
            this.uiManager.showMessage('Stockfish AI ready!', 'success');
        } else if (message.startsWith('bestmove')) {
            this.handleStockfishBestMove(message);
        }
    }

    /**
     * Handle Stockfish best move response
     */
    handleStockfishBestMove(message) {
        const parts = message.split(' ');
        const bestMove = parts[1];
        
        if (bestMove && bestMove !== '(none)') {
            this.executeStockfishMove(bestMove);
        } else {
            console.log('Stockfish found no valid moves');
        }
    }

    /**
     * Execute a move from Stockfish
     */
    executeStockfishMove(move) {
        console.log('Executing Stockfish move:', move);
        
        // Parse UCI move format (e.g., "e2e4" or "e7e8q" for promotion)
        if (move.length < 4) {
            console.error('Invalid move format:', move);
            return;
        }
        
        const fromFile = move[0];
        const fromRank = move[1];
        const toFile = move[2];
        const toRank = move[3];
        const promotionPiece = move.length > 4 ? move[4] : null; // e.g., 'q' for queen promotion
        
        const fromRow = 8 - parseInt(fromRank);
        const fromCol = fromFile.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(toRank);
        const toCol = toFile.charCodeAt(0) - 97;
        
        console.log(`Parsed move: from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
        console.log('Promotion piece:', promotionPiece);
        console.log('Current player:', this.currentGameEngine.currentPlayer);
        console.log('AI color:', this.aiColor);
        
        // Check if it's a castling move first
        const piece = this.currentGameEngine.board[fromRow][fromCol];
        if (this.currentGameEngine.isCastlingMove(piece, fromRow, fromCol, toRow, toCol)) {
            console.log('Stockfish castling move detected');
            const side = toCol === 6 ? 'kingside' : 'queenside';
            const canCastle = this.currentGameEngine.canCastle(this.currentGameEngine.currentPlayer, side);
            console.log('Can castle:', canCastle, 'side:', side);
            
            if (canCastle) {
                const result = this.currentGameEngine.handleCastling(side, this.currentGameEngine.deepCopyBoard(this.currentGameEngine.board));
                if (result) {
                    this.uiManager.renderBoard();
                    this.uiManager.showMessage(`Stockfish played: ${move} (castling)`, 'info');
                    console.log('Stockfish castling executed successfully');
                    return;
                }
            } else {
                console.error('Stockfish castling not allowed:', move);
                this.uiManager.showMessage(`Invalid Stockfish castling: ${move}`, 'error');
                return;
            }
        }
        
        // Check if the move is valid before executing
        const isValid = this.currentGameEngine.isValidMove(fromRow, fromCol, toRow, toCol);
        console.log('Move valid:', isValid);
        
        if (!isValid) {
            console.error('Stockfish move is invalid:', move);
            this.uiManager.showMessage(`Invalid Stockfish move: ${move}`, 'error');
            return;
        }
        
        const result = this.currentGameEngine.makeMove(fromRow, fromCol, toRow, toCol);
        
        if (result === 'promotion') {
            console.log('Stockfish promotion detected!');
            // Use the promotion piece specified by Stockfish, or default to queen
            const promotionType = promotionPiece || 'queen';
            const pieceNames = { 'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight' };
            const finalPromotionType = pieceNames[promotionType] || 'queen';
            
            this.uiManager.executePromotion(finalPromotionType);
            this.uiManager.renderBoard();
            this.uiManager.showMessage(`Stockfish played: ${move} (promoted to ${finalPromotionType})`, 'info');
            console.log('Stockfish promotion executed successfully');
        } else if (result) {
            this.uiManager.renderBoard();
            this.uiManager.showMessage(`Stockfish played: ${move}`, 'info');
            console.log('Stockfish move executed successfully');
        } else {
            console.error('Failed to execute Stockfish move:', move);
            this.uiManager.showMessage(`Failed to execute Stockfish move: ${move}`, 'error');
        }
    }

    /**
     * Request move from Stockfish
     */
    requestStockfishMove() {
        if (!this.stockfishReady || !this.isStockfishTurn()) {
            return;
        }

        this.uiManager.showMessage('Stockfish is thinking...', 'info');
        
        // Send current position to Stockfish
        const fen = this.generateFEN();
        this.stockfish.postMessage(`position fen ${fen}`);
        
        // Use configurable AI settings
        const thinkTime = this.aiThinkTime || 1500;
        const depth = this.aiDepth || 12;
        
        this.stockfish.postMessage(`go movetime ${thinkTime} depth ${depth}`);
    }

    /**
     * Check if it's Stockfish's turn
     */
    isStockfishTurn() {
        return this.gameMode === 'human-vs-stockfish' && 
               this.currentGameEngine.currentPlayer === this.aiColor && 
               !this.currentGameEngine.isGameOver && 
               !this.currentGameEngine.pendingPromotion;
    }

    /**
     * Handle completion of a move
     */
    handleMoveComplete() {
        // Check for game end conditions
        const gameEnd = this.currentGameEngine.checkGameEndConditions();
        
        if (gameEnd) {
            this.handleGameEnd(gameEnd);
        } else if (this.isStockfishTurn()) {
            // Request AI move after a short delay
            setTimeout(() => {
                this.requestStockfishMove();
            }, 500);
        }
    }

    /**
     * Handle game mode changes
     */
    handleGameModeChange(mode) {
        this.gameMode = mode;
        console.log('Game mode changed to:', mode);
        
        if (mode === 'human-vs-stockfish') {
            this.aiColor = 'black';
            if (!this.stockfishReady) {
                this.uiManager.showMessage('Initializing Stockfish...', 'info');
            } else if (this.isStockfishTurn()) {
                this.requestStockfishMove();
            }
        }
        
        this.uiManager.showMessage(`Game mode: ${mode.replace('-', ' vs ')}`, 'info');
    }

    /**
     * Handle AI difficulty changes
     */
    handleAIDifficultyChange(difficulty) {
        this.aiDifficulty = difficulty;
        console.log('AI difficulty changed to:', difficulty);
        
        const difficultySettings = {
            easy: { thinkTime: 500, depth: 8 },
            medium: { thinkTime: 1500, depth: 12 },
            hard: { thinkTime: 3000, depth: 16 },
            master: { thinkTime: 5000, depth: 20 }
        };
        
        const settings = difficultySettings[difficulty] || difficultySettings.medium;
        this.aiThinkTime = settings.thinkTime;
        this.aiDepth = settings.depth;
        
        this.uiManager.showMessage(`AI difficulty: ${difficulty} (${settings.thinkTime}ms, depth ${settings.depth})`, 'info');
    }

    /**
     * Handle section changes
     */
    handleSectionChange(section) {
        console.log('Section changed to:', section);
        this.currentSection = section;
        
        // Switch to appropriate game engine
        if (this.gameEngines[section]) {
            this.currentGameEngine = this.gameEngines[section];
            this.uiManager.setGameEngine(this.currentGameEngine);
        }
        
        // Set appropriate game mode
        if (section === 'play-ai') {
            this.gameMode = 'human-vs-stockfish';
            this.aiColor = 'black'; // AI plays black, human plays white
            console.log('AI mode activated - Stockfish ready:', this.stockfishReady);
            console.log('AI color set to:', this.aiColor);
            this.uiManager.showMessage('Playing against Stockfish AI', 'info');
            
            // If it's AI's turn, request move
            if (this.isStockfishTurn()) {
                setTimeout(() => {
                    this.requestStockfishMove();
                }, 1000);
            }
        } else if (section === 'play-in-person') {
            this.gameMode = 'human-vs-human';
            this.uiManager.showMessage('Local multiplayer mode', 'info');
        } else if (section === 'analysis') {
            this.gameMode = 'analysis';
            this.uiManager.showMessage('Analysis mode', 'info');
        }
    }

    /**
     * Handle voice recognition results
     */
    handleVoiceResult(result) {
        const { transcript, moves, confidence } = result;
        
        console.log('Voice result:', result);
        
        if (moves && moves.length > 0) {
            const move = moves[0];
            this.updateVoiceFeedback(`Recognized: "${transcript}" → ${move}`, 'success');
            
            // Check which section is active to determine voice feedback target
            const currentSection = this.uiManager.currentSection;
            const isLocalMode = currentSection === 'play-in-person';
            
            // Try to execute the move
            const success = this.executeVoiceMove(move);
            
            if (success) {
                this.uiManager.showMessage(`Voice move executed: ${move}`, 'success');
                
                // Update local game status if in local mode
                if (isLocalMode) {
                    this.uiManager.updateLocalGameStatus();
                }
            } else {
                this.uiManager.showMessage(`Invalid voice move: ${move}`, 'error');
            }
        } else {
            this.updateVoiceFeedback(`Could not parse chess move from: "${transcript}"`, 'error');
        }
    }

    /**
     * Execute a move from voice recognition
     */
    executeVoiceMove(move) {
        console.log('Executing voice move:', move);
        
        if (!this.currentGameEngine || !this.uiManager) {
            console.error('Game engine or UI manager not available');
            return false;
        }
        
        // Use the UI manager's move parsing functionality
        try {
            const result = this.uiManager.parseAndExecuteMove(move);
            if (result) {
                // Move was successful, trigger board update
                this.uiManager.renderBoard();
                
                // Trigger AI move if applicable
                this.handleMoveComplete();
                
                return true;
            } else {
                console.log('Move parsing failed for:', move);
                return false;
            }
        } catch (error) {
            console.error('Error executing voice move:', error);
            return false;
        }
    }

    /**
     * Handle voice recognition errors
     */
    handleVoiceError(error) {
        console.error('Voice recognition error:', error);
        this.updateVoiceButton(false);
        this.updateVoiceFeedback(error.message, 'error');
    }

    /**
     * Update voice button appearance
     */
    updateVoiceButton(listening) {
        // Update AI mode voice button
        const voiceBtn = document.getElementById('voice-btn');
        const voiceIcon = document.getElementById('voice-icon');
        const voiceText = document.getElementById('voice-text');

        if (voiceBtn && voiceIcon && voiceText) {
            if (listening) {
                voiceBtn.classList.add('listening');
                voiceIcon.textContent = '🔴';
                voiceText.textContent = 'Listening...';
            } else {
                voiceBtn.classList.remove('listening');
                voiceIcon.textContent = '🎤';
                voiceText.textContent = 'Voice Input';
            }
        }

        // Update local mode voice button
        const localVoiceBtn = document.getElementById('local-voice-btn');
        const localVoiceIcon = document.getElementById('local-voice-icon');
        const localVoiceText = document.getElementById('local-voice-text');

        if (localVoiceBtn && localVoiceIcon && localVoiceText) {
            if (listening) {
                localVoiceBtn.classList.add('listening');
                localVoiceIcon.textContent = '🔴';
                localVoiceText.textContent = 'Listening...';
            } else {
                localVoiceBtn.classList.remove('listening');
                localVoiceIcon.textContent = '🎤';
                localVoiceText.textContent = 'Voice Input';
            }
        }
    }

    /**
     * Update voice feedback display
     */
    updateVoiceFeedback(message, type = 'info') {
        // Update AI mode voice feedback
        const feedbackEl = document.getElementById('voice-feedback');
        if (feedbackEl) {
            feedbackEl.textContent = message;
            feedbackEl.className = `voice-feedback ${type}`;
        }

        // Update local mode voice feedback
        const localFeedbackEl = document.getElementById('local-voice-feedback');
        if (localFeedbackEl) {
            localFeedbackEl.textContent = message;
            localFeedbackEl.className = `voice-feedback ${type}`;
        }
    }

    /**
     * Toggle voice recognition
     */
    toggleVoiceRecognition() {
        if (!this.voiceRecognition) {
            this.uiManager.showMessage('Voice recognition not available', 'error');
            return;
        }

        if (this.voiceRecognition.isCurrentlyListening()) {
            this.voiceRecognition.stop();
        } else {
            if (!this.voiceRecognition.start()) {
                this.uiManager.showMessage('Failed to start voice recognition', 'error');
            }
        }
    }

    /**
     * Toggle local voice recognition
     */
    toggleLocalVoiceRecognition() {
        if (!this.voiceRecognition) {
            this.uiManager.showMessage('Voice recognition not available', 'error');
            return;
        }

        if (this.voiceRecognition.isCurrentlyListening()) {
            this.voiceRecognition.stop();
        } else {
            if (!this.voiceRecognition.start()) {
                this.uiManager.showMessage('Failed to start voice recognition', 'error');
            }
        }
    }

    /**
     * Handle game end
     */
    handleGameEnd(gameEndType) {
        let message = '';
        
        switch (gameEndType) {
            case 'checkmate':
                message = `Checkmate! ${this.currentGameEngine.gameWinner} wins!`;
                break;
            case 'stalemate':
                message = 'Stalemate! The game is a draw.';
                break;
            case 'fifty-moves':
                message = 'Draw by fifty-move rule.';
                break;
            case 'repetition':
                message = 'Draw by threefold repetition.';
                break;
            default:
                message = 'Game over.';
        }
        
        this.uiManager.showMessage(message, 'info');
        console.log('Game ended:', gameEndType);
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't interfere with input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case ' ': // Spacebar for voice input
                    e.preventDefault();
                    this.toggleVoiceRecognition();
                    break;
                case 'n':
                case 'N':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetGame();
                    }
                    break;
                default:
                    break;
            }
        });
    }

    /**
     * Generate FEN notation for current position
     */
    generateFEN() {
        // Basic FEN generation using current game engine
        if (!this.currentGameEngine) {
            return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        }
        
        // Generate FEN from actual board state
        let fen = '';
        const board = this.currentGameEngine.board;
        
        // Board position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    const symbol = piece.type === 'pawn' ? 'p' : 
                                  piece.type === 'knight' ? 'n' :
                                  piece.type === 'bishop' ? 'b' :
                                  piece.type === 'rook' ? 'r' :
                                  piece.type === 'queen' ? 'q' :
                                  piece.type === 'king' ? 'k' : piece.type.charAt(0);
                    fen += piece.color === 'white' ? symbol.toUpperCase() : symbol.toLowerCase();
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            if (row < 7) fen += '/';
        }
        
        // Active color
        fen += ' ' + (this.currentGameEngine.currentPlayer === 'white' ? 'w' : 'b');
        
        // Castling rights (simplified)
        fen += ' KQkq';
        
        // En passant target
        fen += ' -';
        
        // Halfmove clock and fullmove number
        fen += ' 0 1';
        
        console.log('Generated FEN from board state:', fen);
        console.log('Current player:', this.currentGameEngine.currentPlayer);
        return fen;
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.currentGameEngine.initializeBoard();
        this.uiManager.renderBoard();
        this.uiManager.showMessage('New game started!', 'success');
        
        // If AI game and AI plays white, request move
        if (this.gameMode === 'human-vs-stockfish' && this.aiColor === 'white') {
            setTimeout(() => {
                this.requestStockfishMove();
            }, 500);
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const protocol = window.location.protocol;
        
        if (protocol === 'file:') {
            this.uiManager.showMessage(
                '💡 For better voice experience, run from a web server', 
                'info'
            );
        } else {
            this.uiManager.showMessage(
                'Ready to play! Try typing moves or click the microphone 🎤', 
                'success'
            );
        }
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Chess App initialization error:', error);
        
        // Show error to user
        const errorContainer = document.createElement('div');
        errorContainer.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                margin: 50px auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                color: #742a2a;
            ">
                <h2>⚠️ Initialization Error</h2>
                <p>Failed to load the chess application. Please refresh the page.</p>
                <p><small>Error: ${error.message}</small></p>
                <button onclick="window.location.reload()" style="
                    padding: 12px 24px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 20px;
                ">
                    Refresh Page
                </button>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
    }

    /**
     * Public API methods
     */
    getGameEngine() {
        return this.currentGameEngine;
    }

    getUIManager() {
        return this.uiManager;
    }

    getVoiceRecognition() {
        return this.voiceRecognition;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing Chess App...');
    
    // Check for required dependencies
    if (typeof ChessEngine === 'undefined') {
        console.error('ChessEngine not loaded');
        return;
    }
    
    if (typeof UIManager === 'undefined') {
        console.error('UIManager not loaded');
        return;
    }
    
    if (typeof VoiceRecognition === 'undefined') {
        console.warn('VoiceRecognition not loaded');
    }
    
    // Create and initialize the app
    window.chessApp = new ChessApp();
    await window.chessApp.initialize();
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessApp;
} else {
    window.ChessApp = ChessApp;
} 