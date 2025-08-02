/**
 * UI Manager Module
 * Handles all user interface interactions, rendering, and DOM manipulation
 */

class UIManager {
    constructor() {
        this.gameEngine = null;
        this.selectedSquare = null;
        this.keyboardSelectedSquare = null;
        this.messageTimeout = null;
        this.callbacks = {};
        this.currentSection = 'home';
        this.currentBoardId = 'chess-board';
    }

    /**
     * Initialize the UI manager with DOM elements and event listeners
     */
    initialize(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupEventListeners();
        console.log('UI Manager initialized');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Move input (AI mode)
        const submitBtn = document.getElementById('submit-move');
        const moveInput = document.getElementById('move-input');
        
        if (submitBtn && moveInput) {
            submitBtn.onclick = () => this.handleMoveSubmit();
            moveInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.handleMoveSubmit();
            };
        }

        // Move input (Local mode)
        const localSubmitBtn = document.getElementById('local-submit-move');
        const localMoveInput = document.getElementById('local-move-input');
        
        if (localSubmitBtn && localMoveInput) {
            localSubmitBtn.onclick = () => this.handleLocalMoveSubmit();
            localMoveInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.handleLocalMoveSubmit();
            };
        }

        // Game controls (AI mode)
        const newGameBtn = document.getElementById('new-game');
        const undoBtn = document.getElementById('undo-move');
        
        if (newGameBtn) newGameBtn.onclick = () => this.resetGame();
        if (undoBtn) undoBtn.onclick = () => this.undoMove();

        // Game controls (Local mode)
        const localNewGameBtn = document.getElementById('local-new-game');
        const localUndoBtn = document.getElementById('local-undo-move');
        const flipBoardBtn = document.getElementById('flip-board');
        
        if (localNewGameBtn) localNewGameBtn.onclick = () => this.resetLocalGame();
        if (localUndoBtn) localUndoBtn.onclick = () => this.undoLocalMove();
        if (flipBoardBtn) flipBoardBtn.onclick = () => this.flipBoard();

        // Voice controls (AI mode) - will be handled by the main app
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.onclick = () => {
                if (this.callbacks.onVoiceToggle) {
                    this.callbacks.onVoiceToggle();
                }
            };
        }

        // Voice controls (Local mode) - will be handled by the main app
        const localVoiceBtn = document.getElementById('local-voice-btn');
        if (localVoiceBtn) {
            localVoiceBtn.onclick = () => {
                if (this.callbacks.onLocalVoiceToggle) {
                    this.callbacks.onLocalVoiceToggle();
                }
            };
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboardInput(e));

        // Game mode selection
        const modeRadios = document.getElementsByName('game-mode');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.callbacks.onGameModeChange) {
                    this.callbacks.onGameModeChange(radio.value);
                }
            });
        });

        // AI difficulty selection  
        const aiLevelRadios = document.getElementsByName('ai-level');
        aiLevelRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.callbacks.onAIDifficultyChange) {
                    this.callbacks.onAIDifficultyChange(radio.value);
                }
            });
        });

        // Promotion modal
        this.setupPromotionModal();
    }

    /**
     * Render the chess board
     */
    renderBoard() {
        console.log('Rendering chess board...');
        this.renderBoardToElement(this.currentBoardId);
        console.log('Chess board rendered successfully');
    }

    /**
     * Create a square element for the chess board (legacy method - calls new version)
     */
    createSquareElement(row, col, piece, boardId = this.currentBoardId) {
        return this.createSquareElementForBoard(row, col, piece, boardId);
    }

    /**
     * Create a square element for a specific board
     */
    createSquareElementForBoard(row, col, piece, boardId) {
        const square = document.createElement('div');
        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.dataset.board = boardId;
        square.setAttribute('role', 'gridcell');
        
        if (piece) {
            square.textContent = piece.symbol;
            square.title = `${piece.color} ${piece.type} at ${String.fromCharCode(97 + col)}${8 - row}`;
            square.setAttribute('aria-label', `${piece.color} ${piece.type} on ${String.fromCharCode(97 + col)}${8 - row}`);
            
            // Highlight king if in check
            if (piece.type === 'king' && this.gameEngine.isInCheck(piece.color)) {
                square.classList.add('in-check');
            }
        } else {
            square.setAttribute('aria-label', `empty ${String.fromCharCode(97 + col)}${8 - row}`);
        }
        
        // Add click handler
        square.onclick = () => this.handleSquareClick(row, col);
        
        // Keyboard navigation
        if (this.keyboardSelectedSquare && 
            this.keyboardSelectedSquare.row === row && 
            this.keyboardSelectedSquare.col === col) {
            square.classList.add('keyboard-selected');
            square.tabIndex = 0;
            square.focus();
        } else {
            square.tabIndex = -1;
        }
        
        // Highlight selected square
        if (this.selectedSquare && 
            this.selectedSquare.row === row && 
            this.selectedSquare.col === col) {
            square.classList.add('selected');
        }
        
        return square;
    }

    /**
     * Handle square click events
     */
    handleSquareClick(row, col) {
        console.log(`Square clicked: ${row},${col}`);
        
        // Sync keyboard selection with mouse click
        this.keyboardSelectedSquare = { row, col };
        
        // Clear previous highlights
        this.clearHighlights();
        
        const piece = this.gameEngine.board[row][col];
        console.log('Piece at square:', piece);
        
        if (this.selectedSquare) {
            // Try to move
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                // Deselect
                this.selectedSquare = null;
                this.showMessage('Piece deselected');
            } else {
                // Attempt move
                console.log(`Attempting move from ${this.selectedSquare.row},${this.selectedSquare.col} to ${row},${col}`);
                const result = this.gameEngine.makeMove(
                    this.selectedSquare.row, 
                    this.selectedSquare.col, 
                    row, 
                    col
                );
                console.log('Move result:', result);
                
                if (result === true) {
                    this.selectedSquare = null;
                    this.renderBoard();
                    
                    // Update moves list after successful move
                    this.updateLocalGameStatus();
                    
                    // Trigger AI move if applicable
                    if (this.callbacks.onMoveComplete) {
                        this.callbacks.onMoveComplete();
                    }
                } else if (result === 'promotion') {
                    this.showPromotionModal();
                } else {
                    this.showMessage('Invalid move!', 'error');
                    // Clear selection on invalid move so user can select a different piece
                    this.selectedSquare = null;
                }
            }
        } else if (piece && piece.color === this.gameEngine.currentPlayer) {
            // Select piece
            this.selectedSquare = { row, col };
            this.highlightSquare(row, col);
            this.highlightLegalMoves(row, col);
            this.showMessage(`Selected ${piece.type} at ${String.fromCharCode(97 + col)}${8 - row}`);
        } else if (piece && piece.color !== this.gameEngine.currentPlayer) {
            // Clicked on opponent's piece - clear selection
            this.selectedSquare = null;
            this.showMessage(`That's ${piece.color}'s ${piece.type}`, 'info');
        } else {
            // Clicked on empty square - clear selection
            this.selectedSquare = null;
            this.showMessage(`Select a ${this.gameEngine.currentPlayer} piece first`, 'info');
        }
    }

    /**
     * Handle move input submission (AI mode)
     */
    handleMoveSubmit() {
        const moveInput = document.getElementById('move-input');
        if (!moveInput) return;
        
        const move = moveInput.value.trim();
        if (!move) return;
        
        try {
            const result = this.parseAndExecuteMove(move);
            if (result) {
                moveInput.value = '';
                this.renderBoard();
                
                if (this.callbacks.onMoveComplete) {
                    this.callbacks.onMoveComplete();
                }
            } else {
                this.showMessage('Invalid move notation', 'error');
            }
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle move input submission (Local mode)
     */
    handleLocalMoveSubmit() {
        const moveInput = document.getElementById('local-move-input');
        if (!moveInput) return;
        
        const move = moveInput.value.trim();
        if (!move) return;
        
        try {
            const result = this.parseAndExecuteMove(move);
            if (result) {
                moveInput.value = '';
                this.renderBoard();
                
                // Update local game status
                this.updateLocalGameStatus();
            } else {
                this.showMessage('Invalid move notation', 'error');
            }
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Parse algebraic notation and execute move
     */
    parseAndExecuteMove(notation) {
        const move = notation.trim().toLowerCase();
        
        // Handle coordinate notation (e.g., "e2e4")
        const coordinateMatch = move.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
        if (coordinateMatch) {
            const fromSquare = coordinateMatch[1];
            const toSquare = coordinateMatch[2];
            const promotion = coordinateMatch[3];
            
            const fromRow = 8 - parseInt(fromSquare[1]);
            const fromCol = fromSquare.charCodeAt(0) - 97;
            const toRow = 8 - parseInt(toSquare[1]);
            const toCol = toSquare.charCodeAt(0) - 97;
            
            return this.gameEngine.makeMove(fromRow, fromCol, toRow, toCol);
        }
        
        // Handle standard algebraic notation (e.g., "e4", "Nf3", "O-O")
        return this.parseAlgebraicNotation(move);
    }

    /**
     * Parse standard algebraic notation
     */
    parseAlgebraicNotation(move) {
        const board = this.gameEngine.board;
        const currentPlayer = this.gameEngine.currentPlayer;
        
        console.log('Parsing algebraic notation:', move);
        
        // Handle castling
        if (move === 'o-o' || move === '0-0') {
            console.log('Castling move detected: kingside');
            return this.handleCastlingMove('kingside');
        }
        if (move === 'o-o-o' || move === '0-0-0') {
            console.log('Castling move detected: queenside');
            return this.handleCastlingMove('queenside');
        }
        
        // Handle piece moves (e.g., "Nf3", "Bxe4", "Qd1") - CHECK FIRST
        const pieceMatch = move.match(/^([kqrbn])([a-h]?[1-8]?)?x?([a-h][1-8])(?:=([qrbn]))?$/);
        if (pieceMatch) {
            console.log('Piece move detected:', pieceMatch);
            return this.handlePieceMove(pieceMatch);
        }
        
        // Handle pawn moves (e.g., "e4", "exd5")
        const pawnMatch = move.match(/^([a-h])?x?([a-h][1-8])(?:=([qrbn]))?$/);
        if (pawnMatch) {
            console.log('Pawn move detected:', pawnMatch);
            return this.handlePawnMove(pawnMatch);
        }
        
        // Handle simple pawn moves (e.g., "e4", "d5")
        const simplePawnMatch = move.match(/^([a-h][1-8])$/);
        if (simplePawnMatch) {
            console.log('Simple pawn move detected:', simplePawnMatch[1]);
            return this.handleSimplePawnMove(simplePawnMatch[1]);
        }
        
        console.log('No move pattern matched for:', move);
        return false;
    }

    /**
     * Handle simple pawn moves (e.g., "e4", "d5")
     */
    handleSimplePawnMove(toSquare) {
        const toRow = 8 - parseInt(toSquare[1]);
        const toCol = toSquare.charCodeAt(0) - 97;
        
        // Find the pawn that can make this move
        const currentPlayer = this.gameEngine.currentPlayer;
        const pawnRow = currentPlayer === 'white' ? toRow + 1 : toRow - 1;
        const fromCol = toCol; // Same file for simple pawn moves
        
        // Check if the move is valid
        if (this.gameEngine.isValidMove(pawnRow, fromCol, toRow, toCol)) {
            const result = this.gameEngine.makeMove(pawnRow, fromCol, toRow, toCol);
            
            if (result === true) {
                // Update moves list after successful move
                this.updateLocalGameStatus();
            }
            
            return result;
        }
        
        return false;
    }

    /**
     * Handle castling moves
     */
    handleCastlingMove(side) {
        const currentPlayer = this.gameEngine.currentPlayer;
        const row = currentPlayer === 'white' ? 7 : 0;
        
        if (side === 'kingside') {
            const result = this.gameEngine.makeMove(row, 4, row, 6); // King to g1/g8
            if (result === true) {
                this.updateLocalGameStatus();
            }
            return result;
        } else {
            const result = this.gameEngine.makeMove(row, 4, row, 2); // King to c1/c8
            if (result === true) {
                this.updateLocalGameStatus();
            }
            return result;
        }
    }

    /**
     * Handle pawn moves
     */
    handlePawnMove(match) {
        const file = match[1]; // Optional file (e.g., "e" in "exd5")
        const toSquare = match[2];
        const promotion = match[3];
        
        console.log('handlePawnMove called with:', match);
        console.log('file:', file, 'toSquare:', toSquare);
        
        const toRow = 8 - parseInt(toSquare[1]);
        const toCol = toSquare.charCodeAt(0) - 97;
        
        console.log('toRow:', toRow, 'toCol:', toCol);
        
        // Find the pawn that can make this move
        // Try both possible starting positions for pawns
        const fromCol = file ? file.charCodeAt(0) - 97 : toCol;
        
        console.log('toRow:', toRow, 'toCol:', toCol);
        console.log('currentPlayer:', this.gameEngine.currentPlayer);
        
        // Try both possible pawn starting positions
        const possiblePawnRows = this.gameEngine.currentPlayer === 'white' 
            ? [toRow + 1, toRow + 2]  // Try 1 and 2 rows ahead
            : [toRow - 1, toRow - 2]; // Try 1 and 2 rows behind
            
        for (const pawnRow of possiblePawnRows) {
            if (pawnRow >= 0 && pawnRow < 8) {
                const sourcePiece = this.gameEngine.board[pawnRow][fromCol];
                console.log('Checking pawn at', pawnRow, fromCol, ':', sourcePiece);
                
                if (sourcePiece && sourcePiece.type === 'pawn' && sourcePiece.color === this.gameEngine.currentPlayer) {
                    console.log('Found pawn at', pawnRow, fromCol);
                    
                    // Check if it's a capture
                    if (match[0].includes('x')) {
                        console.log('Pawn capture move');
                        
                        // Check what's on the target square
                        const targetPiece = this.gameEngine.board[toRow][toCol];
                        console.log('Target square piece:', targetPiece);
                        
                        if (targetPiece) {
                            console.log('Capturing piece:', targetPiece.symbol, targetPiece.color);
                        } else {
                            console.log('No piece to capture on target square');
                        }
                        
                        const result = this.gameEngine.makeMove(pawnRow, fromCol, toRow, toCol);
                        
                        if (result === 'promotion') {
                            console.log('Pawn promotion detected!');
                            this.showPromotionModal();
                        } else if (result === true) {
                            // Update moves list after successful move
                            this.updateLocalGameStatus();
                        }
                        
                        return result;
                    } else {
                        console.log('Pawn regular move');
                        
                        // Check if the move is valid
                        const isValid = this.gameEngine.isValidMove(pawnRow, fromCol, toRow, toCol);
                        console.log('Move valid:', isValid);
                        
                        const result = this.gameEngine.makeMove(pawnRow, fromCol, toRow, toCol);
                        console.log('Pawn move result:', result);
                        
                        if (result === true) {
                            // Update moves list after successful move
                            this.updateLocalGameStatus();
                        }
                        
                        return result;
                    }
                }
            }
        }
        
        console.log('No valid pawn found for move');
        return false;
    }

    /**
     * Handle piece moves
     */
    handlePieceMove(match) {
        const pieceType = match[1];
        const disambiguation = match[2]; // Optional file/rank for disambiguation
        const toSquare = match[3];
        const promotion = match[4];
        
        const toRow = 8 - parseInt(toSquare[1]);
        const toCol = toSquare.charCodeAt(0) - 97;
        
        console.log('handlePieceMove:', {
            pieceType,
            disambiguation,
            toSquare,
            toRow,
            toCol
        });
        
        // Find the piece that can make this move
        const piece = this.findPieceForMove(pieceType, disambiguation, toRow, toCol);
        console.log('Found piece:', piece);
        
        if (piece) {
            const result = this.gameEngine.makeMove(piece.row, piece.col, toRow, toCol);
            console.log('Piece move result:', result);
            
            if (result === true) {
                // Update moves list after successful move
                this.updateLocalGameStatus();
            }
            
            return result;
        }
        
        console.log('No valid piece found for move');
        return false;
    }

    /**
     * Find the piece that can make the specified move
     */
    findPieceForMove(pieceType, disambiguation, toRow, toCol) {
        const board = this.gameEngine.board;
        const currentPlayer = this.gameEngine.currentPlayer;
        
        console.log('findPieceForMove:', {
            pieceType,
            disambiguation,
            toRow,
            toCol,
            currentPlayer
        });
        
        const pieceSymbols = {
            'k': currentPlayer === 'white' ? '♔' : '♚',
            'q': currentPlayer === 'white' ? '♕' : '♛', 
            'r': currentPlayer === 'white' ? '♖' : '♜',
            'b': currentPlayer === 'white' ? '♗' : '♝',
            'n': currentPlayer === 'white' ? '♘' : '♞',
            'p': currentPlayer === 'white' ? '♙' : '♟'
        };
        
        const targetSymbol = pieceSymbols[pieceType];
        if (!targetSymbol) {
            console.log('No symbol found for piece type:', pieceType);
            return null;
        }
        
        console.log('Looking for symbol:', targetSymbol);
        
        // Find all pieces of this type for the current player
        let candidates = [];
        console.log('Searching for', targetSymbol, 'pieces for', currentPlayer);
        console.log('Current board state:');
        for (let row = 0; row < 8; row++) {
            let rowStr = '';
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    rowStr += piece.symbol + ' ';
                    if (piece.color === currentPlayer && piece.symbol === targetSymbol) {
                        candidates.push({ row, col, piece });
                        console.log('Found candidate at', row, col, ':', piece);
                    }
                } else {
                    rowStr += '. ';
                }
            }
            console.log(`${8-row}: ${rowStr}`);
        }
        
        console.log('Total candidates:', candidates.length);
        
        // Filter by disambiguation if provided
        if (disambiguation) {
            if (disambiguation.length === 1) {
                // File disambiguation (e.g., "Nf3" with "f")
                const file = disambiguation.charCodeAt(0) - 97;
                candidates = candidates.filter(c => c.col === file);
            } else {
                // Rank disambiguation (e.g., "N1f3" with "1")
                const rank = 8 - parseInt(disambiguation);
                candidates = candidates.filter(c => c.row === rank);
            }
        }
        
        // Find the piece that can legally move to the target square
        for (const candidate of candidates) {
            console.log('Testing candidate at', candidate.row, candidate.col, 'to', toRow, toCol);
            
            // Check if target square has a piece
            const targetPiece = this.gameEngine.board[toRow][toCol];
            console.log('Target square piece:', targetPiece);
            
            // Check if it's a capture move
            if (targetPiece) {
                console.log('Target square occupied by:', targetPiece.symbol, targetPiece.color);
                if (targetPiece.color === currentPlayer) {
                    console.log('Cannot capture own piece');
                    continue;
                }
            }
            
            if (this.gameEngine.isValidMove(candidate.row, candidate.col, toRow, toCol)) {
                console.log('Valid move found!');
                return candidate;
            } else {
                console.log('Invalid move for candidate');
            }
        }
        
        console.log('No valid piece found');
        return null;
    }

    /**
     * Highlight a square
     */
    highlightSquare(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"][data-board="${this.currentBoardId}"]`);
        if (square) {
            square.classList.add('selected');
        }
    }

    /**
     * Highlight legal moves for a piece
     */
    highlightLegalMoves(row, col) {
        const piece = this.gameEngine.board[row][col];
        console.log('Highlighting moves for piece:', piece);
        
        for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
                let isValidMove = false;
                
                // Check if it's a castling move
                if (this.gameEngine.isCastlingMove(piece, row, col, toRow, toCol)) {
                    const side = toCol === 6 ? 'kingside' : 'queenside';
                    isValidMove = this.gameEngine.canCastle(piece.color, side);
                    if (isValidMove) {
                        console.log('Castling move valid:', side, 'from', row, col, 'to', toRow, toCol);
                    }
                } else {
                    // Regular move validation
                    isValidMove = this.gameEngine.isValidMove(row, col, toRow, toCol);
                    if (isValidMove) {
                        console.log('Regular move valid: from', row, col, 'to', toRow, toCol);
                    }
                }
                
                if (isValidMove) {
                    const square = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"][data-board="${this.currentBoardId}"]`);
                    if (square) {
                        square.classList.add('highlighted');
                        if (this.gameEngine.board[toRow][toCol]) {
                            square.classList.add('occupied');
                        }
                    }
                }
            }
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        document.querySelectorAll(`.square[data-board="${this.currentBoardId}"]`).forEach(square => {
            square.classList.remove('highlighted', 'selected', 'occupied')
        });
    }

    /**
     * Clear the current piece selection
     */
    clearSelection() {
        this.selectedSquare = null;
        this.clearHighlights();
    }

    /**
     * Update game status display
     */
    updateGameStatus() {
        const statusElements = document.querySelectorAll('.game-status, #current-turn, #game-status');
        const currentPlayer = this.gameEngine.currentPlayer;
        const isGameOver = this.gameEngine.isGameOver;
        const gameWinner = this.gameEngine.gameWinner;
        
        let statusText = '';
        let statusClass = '';
        
        if (isGameOver) {
            if (gameWinner === 'draw') {
                statusText = 'Game Over - Draw';
                statusClass = 'game-over';
            } else {
                statusText = `Game Over - ${gameWinner} wins!`;
                statusClass = 'game-over';
            }
        } else {
            const inCheck = this.gameEngine.isInCheck(currentPlayer);
            statusText = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to move`;
            if (inCheck) statusText += ' (in check)';
            statusClass = `${currentPlayer}-turn`;
        }
        
        statusElements.forEach(element => {
            if (element) {
                element.textContent = statusText;
                element.className = `game-status ${statusClass}`;
            }
        });
    }

    /**
     * Update moves list display
     */
    updateMovesList(movesListElement = null) {
        if (!movesListElement) {
            movesListElement = document.getElementById('moves-list');
        }
        
        if (!movesListElement) {
            return;
        }
        
        const moves = this.gameEngine.moveHistory;
        
        if (moves.length === 0) {
            movesListElement.textContent = 'No moves yet';
            return;
        }
        
        let movesHtml = '';
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i] || '';
            const blackMove = moves[i + 1] || '';
            movesHtml += `<div>${moveNumber}. ${whiteMove} ${blackMove}</div>`;
        }
        
        movesListElement.innerHTML = movesHtml;
        movesListElement.scrollTop = movesListElement.scrollHeight;
    }

    /**
     * Show notification message
     */
    showMessage(text, type = 'info') {
        console.log(`Message (${type}): ${text}`);
        
        // Clear existing message
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Remove existing message elements
        document.querySelectorAll('.message').forEach(el => el.remove());
        
        // Create new message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = text;
        document.body.appendChild(messageEl);
        
        // Auto-remove after 3 seconds
        this.messageTimeout = setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    /**
     * Setup promotion modal
     */
    setupPromotionModal() {
        const promotionButtons = document.querySelectorAll('.promotion-btn');
        promotionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pieceType = btn.dataset.piece;
                this.executePromotion(pieceType);
            });
        });
    }

    /**
     * Show promotion modal
     */
    showPromotionModal() {
        const modal = document.getElementById('promotion-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Hide promotion modal
     */
    hidePromotionModal() {
        const modal = document.getElementById('promotion-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Execute pawn promotion
     */
    executePromotion(pieceType) {
        if (!this.gameEngine.pendingPromotion) return;
        
        const promotion = this.gameEngine.pendingPromotion;
        const piece = this.gameEngine.board[promotion.fromRow][promotion.fromCol];
        
        // Update piece type and symbol
        const symbols = {
            queen: piece.color === 'white' ? '♕' : '♛',
            rook: piece.color === 'white' ? '♖' : '♜',
            bishop: piece.color === 'white' ? '♗' : '♝',
            knight: piece.color === 'white' ? '♘' : '♞'
        };
        
        // Complete the move with promotion
        this.gameEngine.board[promotion.toRow][promotion.toCol] = {
            symbol: symbols[pieceType],
            type: pieceType,
            color: piece.color
        };
        this.gameEngine.board[promotion.fromRow][promotion.fromCol] = null;
        
        // Add move to history
        const notation = this.getPromotionNotation(promotion, pieceType);
        this.gameEngine.moveHistory.push(notation);
        
        // Switch players and update game state
        this.gameEngine.currentPlayer = this.gameEngine.currentPlayer === 'white' ? 'black' : 'white';
        this.gameEngine.pendingPromotion = null;
        
        // Check game end conditions
        this.gameEngine.checkGameEndConditions();
        
        this.hidePromotionModal();
        this.renderBoard();
        
        // Update moves list after promotion
        this.updateLocalGameStatus();
        
        if (this.callbacks.onMoveComplete) {
            this.callbacks.onMoveComplete();
        }
    }

    /**
     * Handle keyboard input for navigation
     */
    handleKeyboardInput(e) {
        if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
        
        let newRow = this.keyboardSelectedSquare?.row ?? 0;
        let newCol = this.keyboardSelectedSquare?.col ?? 0;
        
        switch (e.key) {
            case 'ArrowUp':
                newRow = Math.max(0, newRow - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(7, newRow + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, newCol - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(7, newCol + 1);
                break;
            case 'Enter':
            case ' ':
                if (this.keyboardSelectedSquare) {
                    this.handleSquareClick(this.keyboardSelectedSquare.row, this.keyboardSelectedSquare.col);
                }
                e.preventDefault();
                return;
            case 'Escape':
                this.selectedSquare = null;
                this.clearHighlights();
                return;
            default:
                return;
        }
        
        this.keyboardSelectedSquare = { row: newRow, col: newCol };
        this.renderBoard();
        e.preventDefault();
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.gameEngine.initializeBoard();
        this.selectedSquare = null;
        this.keyboardSelectedSquare = null;
        this.renderBoard();
        this.showMessage('New game started!', 'success');
    }

    /**
     * Undo last move
     */
    undoMove() {
        // Implementation would restore previous game state
        // This requires the game engine to support undo functionality
        this.showMessage('Undo functionality needs to be implemented', 'info');
    }

    /**
     * Reset the local game
     */
    resetLocalGame() {
        this.gameEngine.initializeBoard();
        this.selectedSquare = null;
        this.keyboardSelectedSquare = null;
        this.renderBoard();
        this.updateLocalGameStatus();
        this.showMessage('New local game started!', 'success');
    }

    /**
     * Undo last move in local game
     */
    undoLocalMove() {
        // Implementation would restore previous game state
        // This requires the game engine to support undo functionality
        this.showMessage('Undo functionality needs to be implemented', 'info');
    }

    /**
     * Flip the board orientation
     */
    flipBoard() {
        // Implementation would flip the board view
        // This requires the UI to support board flipping
        this.showMessage('Board flip functionality needs to be implemented', 'info');
    }

    /**
     * Update local game status
     */
    updateLocalGameStatus() {
        const currentTurnEl = document.getElementById('local-current-turn');
        const gameStatusEl = document.getElementById('local-game-status');
        const movesListEl = document.getElementById('local-moves-list');
        
        if (currentTurnEl) {
            const player = this.gameEngine.currentPlayer;
            currentTurnEl.textContent = `${player.charAt(0).toUpperCase() + player.slice(1)} to move`;
            currentTurnEl.className = `game-status ${player}-turn`;
        }
        
        if (gameStatusEl) {
            const gameEndCondition = this.gameEngine.checkGameEndConditions();
            if (gameEndCondition === 'checkmate') {
                const winner = this.gameEngine.currentPlayer === 'white' ? 'Black' : 'White';
                gameStatusEl.textContent = `Checkmate! ${winner} wins!`;
                gameStatusEl.className = 'game-status checkmate';
            } else if (gameEndCondition === 'stalemate') {
                gameStatusEl.textContent = 'Stalemate!';
                gameStatusEl.className = 'game-status stalemate';
            } else if (this.gameEngine.isInCheck(this.gameEngine.currentPlayer)) {
                gameStatusEl.textContent = 'Check!';
                gameStatusEl.className = 'game-status check';
            } else {
                gameStatusEl.textContent = 'Game in progress';
                gameStatusEl.className = 'game-status';
            }
        }
        
        if (movesListEl) {
            this.updateMovesList(movesListEl);
        }
    }



    /**
     * Show a specific section of the app
     */
    showSection(section) {
        console.log('Navigating to section:', section);
        
        // Hide all sections
        const sections = document.querySelectorAll('.home-page, .game-section');
        sections.forEach(el => {
            el.style.display = 'none';
        });
        
        // Show target section
        if (section === 'home') {
            document.getElementById('home-page').style.display = 'block';
            this.currentSection = 'home';
        } else {
            const targetPage = document.getElementById(section + '-page');
            if (targetPage) {
                targetPage.style.display = 'block';
                this.currentSection = section;
                
                // Notify app of section change
                if (this.callbacks.onSectionChange) {
                    this.callbacks.onSectionChange(section);
                }
                
                // Initialize section-specific functionality
                this.initializeSection(section);
            } else {
                console.error('Section not found:', section);
                this.showSection('home'); // Fallback to home
            }
        }
    }

    /**
     * Initialize section-specific functionality
     */
    initializeSection(section) {
        console.log('Initializing section:', section);
        
        switch (section) {
            case 'play-ai':
                this.currentBoardId = 'chess-board';
                this.renderBoard();
                console.log('AI section initialized');
                break;
            case 'analysis':
                this.currentBoardId = 'analysis-chess-board';
                this.renderAnalysisBoard();
                console.log('Analysis section initialized');
                break;
            case 'play-in-person':
                this.currentBoardId = 'local-chess-board';
                this.renderLocalBoard();
                console.log('Local section initialized');
                break;
            default:
                console.log('No special initialization for section:', section);
                break;
        }
    }

    /**
     * Render the analysis board
     */
    renderAnalysisBoard() {
        this.renderBoardToElement('analysis-chess-board');
    }

    /**
     * Render the local multiplayer board
     */
    renderLocalBoard() {
        this.renderBoardToElement('local-chess-board');
    }

    /**
     * Render board to a specific element
     */
    renderBoardToElement(boardId) {
        console.log('Rendering board to element:', boardId);
        const boardEl = document.getElementById(boardId);
        
        if (!boardEl) {
            console.error('Chess board element not found:', boardId);
            return;
        }
        
        if (!this.gameEngine) {
            console.error('Game engine not available for rendering');
            return;
        }
        
        // Only clear and re-render if the board doesn't exist yet
        if (boardEl.children.length === 0) {
            boardEl.innerHTML = '';
            boardEl.setAttribute('role', 'grid');
            
            const board = this.gameEngine.board;
            console.log('Board state for rendering:', board[6][4]); // Check e2 square
            
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const square = this.createSquareElementForBoard(row, col, board[row][col], boardId);
                    boardEl.appendChild(square);
                }
            }
        } else {
            // Update existing squares instead of re-rendering
            this.updateBoardSquares(boardId);
        }
        
        this.updateGameStatus();
        this.updateMovesList();
    }

    /**
     * Update board squares without re-rendering the entire board
     */
    updateBoardSquares(boardId) {
        const boardEl = document.getElementById(boardId);
        if (!boardEl || !this.gameEngine) return;
        
        const board = this.gameEngine.board;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const squareIndex = row * 8 + col;
                const squareEl = boardEl.children[squareIndex];
                
                if (squareEl) {
                    const piece = board[row][col];
                    
                    // Update piece display
                    if (piece) {
                        squareEl.textContent = piece.symbol;
                        squareEl.title = `${piece.color} ${piece.type} at ${String.fromCharCode(97 + col)}${8 - row}`;
                        squareEl.setAttribute('aria-label', `${piece.color} ${piece.type} on ${String.fromCharCode(97 + col)}${8 - row}`);
                        
                        // Update check status
                        if (piece.type === 'king' && this.gameEngine.isInCheck(piece.color)) {
                            squareEl.classList.add('in-check');
                        } else {
                            squareEl.classList.remove('in-check');
                        }
                    } else {
                        squareEl.textContent = '';
                        squareEl.title = '';
                        squareEl.setAttribute('aria-label', `empty ${String.fromCharCode(97 + col)}${8 - row}`);
                        squareEl.classList.remove('in-check');
                    }
                }
            }
        }
    }



    /**
     * Load starting position for analysis
     */
    loadStartingPosition() {
        this.gameEngine.initializeBoard();
        if (this.currentSection === 'analysis') {
            this.renderAnalysisBoard();
        } else {
            this.renderBoard();
        }
        this.showMessage('Starting position loaded', 'success');
    }

    /**
     * Load current game position for analysis
     */
    loadCurrentGamePosition() {
        // Copy current game state to analysis
        if (this.currentSection === 'analysis') {
            this.renderAnalysisBoard();
        } else {
            this.renderBoard();
        }
        this.showMessage('Current position loaded', 'success');
    }

    /**
     * Set the game engine for this UI manager
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
        console.log('UI Manager: Game engine updated for current section');
        
        // Test that the game engine is working
        if (gameEngine) {
            console.log('Game engine test - current player:', gameEngine.currentPlayer);
            console.log('Game engine test - board state:', gameEngine.board[6][4]); // e2 square
        }
    }

    /**
     * Set callback functions
     */
    setCallback(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * Get promotion notation for move history
     */
    getPromotionNotation(promotion, pieceType) {
        const fromFile = String.fromCharCode(97 + promotion.fromCol);
        const toFile = String.fromCharCode(97 + promotion.toCol);
        const toRank = 8 - promotion.toRow;
        
        const pieceSymbols = {
            queen: 'Q',
            rook: 'R',
            bishop: 'B',
            knight: 'N'
        };
        
        return `${fromFile}${toFile}${toRank}=${pieceSymbols[pieceType]}`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
} 