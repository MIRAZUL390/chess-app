/**
 * Chess Engine Module
 * Core chess game logic, move validation, and board state management
 */

class ChessEngine {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameStateHistory = [];
        this.isGameOver = false;
        this.gameWinner = null;
        this.pendingPromotion = null;
        
        // Castling rights tracking
        this.castlingRights = {
            white: { king: true, rookQueen: true, rookKing: true },
            black: { king: true, rookQueen: true, rookKing: true }
        };
        
        // FEN notation support
        this.fenCastling = { K: true, Q: true, k: true, q: true };
        this.fenEnPassant = '-';
        this.halfmoveClock = 0;
        this.positionHistory = [];
    }

    /**
     * Initialize the chess board with starting position
     */
    initializeBoard() {
        console.log('Initializing chess board...');
        
        // Create empty 8x8 board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Reset game state
        this.currentPlayer = 'white';
        this.isGameOver = false;
        this.gameWinner = null;
        this.moveHistory = [];
        this.selectedSquare = null;
        this.pendingPromotion = null;
        
        // Define piece positions
        const pieces = [
            // Black pieces (row 0)
            { pos: [0, 0], piece: { symbol: '♜', type: 'rook', color: 'black' } },
            { pos: [0, 1], piece: { symbol: '♞', type: 'knight', color: 'black' } },
            { pos: [0, 2], piece: { symbol: '♝', type: 'bishop', color: 'black' } },
            { pos: [0, 3], piece: { symbol: '♛', type: 'queen', color: 'black' } },
            { pos: [0, 4], piece: { symbol: '♚', type: 'king', color: 'black' } },
            { pos: [0, 5], piece: { symbol: '♝', type: 'bishop', color: 'black' } },
            { pos: [0, 6], piece: { symbol: '♞', type: 'knight', color: 'black' } },
            { pos: [0, 7], piece: { symbol: '♜', type: 'rook', color: 'black' } },
            
            // White pieces (row 7)
            { pos: [7, 0], piece: { symbol: '♖', type: 'rook', color: 'white' } },
            { pos: [7, 1], piece: { symbol: '♘', type: 'knight', color: 'white' } },
            { pos: [7, 2], piece: { symbol: '♗', type: 'bishop', color: 'white' } },
            { pos: [7, 3], piece: { symbol: '♕', type: 'queen', color: 'white' } },
            { pos: [7, 4], piece: { symbol: '♔', type: 'king', color: 'white' } },
            { pos: [7, 5], piece: { symbol: '♗', type: 'bishop', color: 'white' } },
            { pos: [7, 6], piece: { symbol: '♘', type: 'knight', color: 'white' } },
            { pos: [7, 7], piece: { symbol: '♖', type: 'rook', color: 'white' } }
        ];
        
        // Place pawns
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = { symbol: '♟', type: 'pawn', color: 'black' };
            this.board[6][i] = { symbol: '♙', type: 'pawn', color: 'white' };
        }
        
        // Place other pieces
        pieces.forEach(({ pos, piece }) => {
            this.board[pos[0]][pos[1]] = piece;
        });
        
        // Reset castling rights
        this.castlingRights = {
            white: { king: true, rookQueen: true, rookKing: true },
            black: { king: true, rookQueen: true, rookKing: true }
        };
        
        // Reset FEN notation tracking
        this.fenCastling = { K: true, Q: true, k: true, q: true };
        this.fenEnPassant = '-';
        this.halfmoveClock = 0;
        this.positionHistory = [];
        this.gameStateHistory = [];
        
        console.log('Chess board initialized successfully');
    }

    /**
     * Make a move on the board
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        if (this.pendingPromotion || this.isGameOver) {
            return false;
        }
        
        const piece = this.board[fromRow][fromCol];
        
        // Handle castling first (before validation)
        if (this.isCastlingMove(piece, fromRow, fromCol, toRow, toCol)) {
            console.log('Castling move detected:', fromRow, fromCol, 'to', toRow, toCol);
            const side = toCol === 6 ? 'kingside' : 'queenside';
            const canCastle = this.canCastle(piece.color, side);
            console.log('Can castle:', canCastle, 'side:', side, 'color:', piece.color);
            if (canCastle) {
                return this.handleCastling(side, this.deepCopyBoard(this.board));
            } else {
                console.log('Castling not allowed');
                return false;
            }
        }
        
        // Validate the move
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) {
            return false;
        }
        
        // Save game state for undo functionality
        this.saveGameState();
        
        const prevBoard = this.deepCopyBoard(this.board);
        
        // Handle castling
        if (this.isCastlingMove(piece, fromRow, fromCol, toRow, toCol)) {
            return this.handleCastling(toCol === 6 ? 'kingside' : 'queenside', prevBoard);
        }
        
        // Update castling rights
        this.updateCastlingRights(piece, fromRow, fromCol);
        
        // Handle en passant
        const isEnPassant = this.handleEnPassant(piece, fromRow, fromCol, toRow, toCol);
        
        // Update en passant target square
        this.updateEnPassantTarget(piece, fromRow, fromCol, toRow, toCol);
        
        // Check if move is a capture
        const isCapture = this.board[toRow][toCol] && this.board[toRow][toCol].color !== piece.color;
        
        // Update halfmove clock for 50-move rule
        if (piece.type === 'pawn' || isCapture || isEnPassant) {
            this.halfmoveClock = 0;
        } else {
            this.halfmoveClock++;
        }
        
        // Handle pawn promotion
        if (this.isPawnPromotion(fromRow, fromCol, toRow, toCol)) {
            this.pendingPromotion = { fromRow, fromCol, toRow, toCol, color: piece.color };
            return 'promotion';
        }
        
        // Execute the move
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Add move to history
        const algebraicNotation = this.getAlgebraicNotation(
            fromRow, fromCol, toRow, toCol, 
            { isCapture: isCapture || isEnPassant, prevBoard, isEnPassant }
        );
        this.moveHistory.push(algebraicNotation);
        
        // Switch current player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Track position for threefold repetition
        const positionKey = this.generatePositionKey();
        this.positionHistory.push(positionKey);
        
        // Check game ending conditions
        this.checkGameEndConditions();
        
        return true;
    }

    /**
     * Validate if a move is legal
     */
    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Basic bounds check
        if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
            toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
            return false;
        }
        
        const piece = this.board[fromRow][fromCol];
        
        // Check if there's a piece to move
        if (!piece) return false;
        
        // Check if it's the correct player's turn
        if (piece.color !== this.currentPlayer) return false;
        
        // Can't capture own piece
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) return false;
        
        // Check piece-specific movement rules
        if (!this.isValidPieceMove(piece, fromRow, fromCol, toRow, toCol)) {
            return false;
        }
        
        // Check if move would leave king in check
        const testBoard = this.deepCopyBoard(this.board);
        testBoard[toRow][toCol] = piece;
        testBoard[fromRow][fromCol] = null;
        
        if (this.isInCheckOnBoard(piece.color, testBoard)) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if a specific piece movement is valid
     */
    isValidPieceMove(piece, fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(piece, fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol) || 
                       this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(piece, fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }

    /**
     * Validate pawn movement
     */
    isValidPawnMove(piece, fromRow, fromCol, toRow, toCol) {
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Forward move
        if (colDiff === 0) {
            if (rowDiff === direction && !this.board[toRow][toCol]) {
                return true; // One square forward
            }
            if (fromRow === startRow && rowDiff === 2 * direction && !this.board[toRow][toCol] && !this.board[fromRow + direction][fromCol]) {
                return true; // Two squares forward from starting position
            }
        }
        
        // Diagonal capture
        if (colDiff === 1 && rowDiff === direction) {
            const targetPiece = this.board[toRow][toCol];
            if (targetPiece && targetPiece.color !== piece.color) {
                return true; // Regular capture
            }
            
            // En passant capture
            if (this.fenEnPassant !== '-') {
                const epFile = this.fenEnPassant.charCodeAt(0) - 97;
                const epRank = 8 - parseInt(this.fenEnPassant.charAt(1));
                if (toCol === epFile && toRow === epRank) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Validate rook movement
     */
    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    /**
     * Validate bishop movement
     */
    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    /**
     * Validate king movement
     */
    isValidKingMove(piece, fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // Normal king move (one square)
        if (rowDiff <= 1 && colDiff <= 1) return true;
        
        // Castling moves are not valid as regular king moves
        // They should only be handled through the castling mechanism
        return false;
    }

    /**
     * Check if path between two squares is clear
     */
    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (this.board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        
        return true;
    }

    /**
     * Check if a king is in check
     */
    isInCheck(color) {
        return this.isInCheckOnBoard(color, this.board);
    }

    /**
     * Check if a king is in check on a specific board state
     */
    isInCheckOnBoard(color, board) {
        // Find the king
        let kingRow = -1, kingCol = -1;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== -1) break;
        }
        
        if (kingRow === -1) return false; // No king found
        
        // Check if any opponent piece can attack the king
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.canPieceAttack(piece, row, col, kingRow, kingCol, board)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Check if a piece can attack a specific square
     */
    canPieceAttack(piece, fromRow, fromCol, targetRow, targetCol, board) {
        // Save current board and temporarily use the test board
        const originalBoard = this.board;
        this.board = board;
        
        const canAttack = this.isValidPieceMove(piece, fromRow, fromCol, targetRow, targetCol);
        
        // Restore original board
        this.board = originalBoard;
        
        return canAttack;
    }

    /**
     * Get all legal moves for current player
     */
    getAllLegalMoves() {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                moves.push({ from: [row, col], to: [toRow, toCol] });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    /**
     * Check for checkmate or stalemate
     */
    checkGameEndConditions() {
        const legalMoves = this.getAllLegalMoves();
        
        if (legalMoves.length === 0) {
            if (this.isInCheck(this.currentPlayer)) {
                this.isGameOver = true;
                this.gameWinner = this.currentPlayer === 'white' ? 'black' : 'white';
                return 'checkmate';
            } else {
                this.isGameOver = true;
                this.gameWinner = 'draw';
                return 'stalemate';
            }
        }
        
        // Check for other draw conditions
        if (this.halfmoveClock >= 100) { // 50-move rule
            this.isGameOver = true;
            this.gameWinner = 'draw';
            return 'fifty-moves';
        }
        
        if (this.isThreefoldRepetition()) {
            this.isGameOver = true;
            this.gameWinner = 'draw';
            return 'repetition';
        }
        
        return null;
    }

    /**
     * Helper methods for game state management
     */
    deepCopyBoard(board) {
        return board.map(row => row.map(piece => piece ? { ...piece } : null));
    }

    saveGameState() {
        this.gameStateHistory.push({
            board: this.deepCopyBoard(this.board),
            currentPlayer: this.currentPlayer,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            fenCastling: { ...this.fenCastling },
            fenEnPassant: this.fenEnPassant,
            halfmoveClock: this.halfmoveClock,
            moveHistory: [...this.moveHistory]
        });
    }

    /**
     * Check if a move is a castling move
     */
    isCastlingMove(piece, fromRow, fromCol, toRow, toCol) {
        return piece && piece.type === 'king' && 
               fromCol === 4 && (toCol === 6 || toCol === 2) && 
               fromRow === toRow && // Must stay on same rank
               ((piece.color === 'white' && fromRow === 7) || 
                (piece.color === 'black' && fromRow === 0));
    }

    /**
     * Handle castling move
     */
    handleCastling(side, prevBoard) {
        const row = this.currentPlayer === 'white' ? 7 : 0;
        const king = this.board[row][4];
        
        if (!this.canCastle(this.currentPlayer, side)) {
            return false;
        }
        
        if (side === 'kingside') {
            // Move king and rook for kingside castling
            this.board[row][6] = king;
            this.board[row][5] = this.board[row][7]; // Move rook
            this.board[row][4] = null;
            this.board[row][7] = null;
            
            this.moveHistory.push('O-O');
        } else {
            // Move king and rook for queenside castling
            this.board[row][2] = king;
            this.board[row][3] = this.board[row][0]; // Move rook
            this.board[row][4] = null;
            this.board[row][0] = null;
            
            this.moveHistory.push('O-O-O');
        }
        
        // Update castling rights
        if (this.currentPlayer === 'white') {
            this.castlingRights.white.king = false;
            this.castlingRights.white.rookQueen = false;
            this.castlingRights.white.rookKing = false;
            this.fenCastling.K = false;
            this.fenCastling.Q = false;
        } else {
            this.castlingRights.black.king = false;
            this.castlingRights.black.rookQueen = false;
            this.castlingRights.black.rookKing = false;
            this.fenCastling.k = false;
            this.fenCastling.q = false;
        }
        
        // Switch current player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        return true;
    }

    /**
     * Check if castling is allowed
     */
    canCastle(color, side) {
        const row = color === 'white' ? 7 : 0;
        
        // Check if king and rook haven't moved
        if (!this.castlingRights[color].king) return false;
        if (side === 'kingside' && !this.castlingRights[color].rookKing) return false;
        if (side === 'queenside' && !this.castlingRights[color].rookQueen) return false;
        
        // Check if king is in check (use non-recursive version)
        if (this.isInCheckSimple(color)) return false;
        
        // Check if squares between king and rook are empty and not under attack
        if (side === 'kingside') {
            // Check squares f1/f8 and g1/g8
            for (let col = 5; col <= 6; col++) {
                if (this.board[row][col]) return false;
                if (this.isSquareUnderAttackSimple(row, col, color)) return false;
            }
        } else {
            // Check squares d1/d8, c1/c8, and b1/b8
            for (let col = 1; col <= 3; col++) {
                if (this.board[row][col]) return false;
                if (col >= 2 && this.isSquareUnderAttackSimple(row, col, color)) return false;
            }
        }
        
        return true;
    }

    /**
     * Check if a square is under attack by the opponent
     */
    isSquareUnderAttack(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackerColor) {
                    if (this.canPieceAttack(piece, r, c, row, col, this.board)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Check if a king is in check (non-recursive version for castling)
     */
    isInCheckSimple(color) {
        // Find the king
        let kingRow = -1, kingCol = -1;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== -1) break;
        }
        
        if (kingRow === -1) return false; // No king found
        
        // Check if any opponent piece can attack the king (without recursion)
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    if (this.canPieceAttackSimple(piece, row, col, kingRow, kingCol)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Check if a piece can attack a specific square (non-recursive version)
     */
    canPieceAttackSimple(piece, fromRow, fromCol, targetRow, targetCol) {
        // Direct piece movement validation without recursion
        if (piece.type === 'pawn') {
            const direction = piece.color === 'white' ? -1 : 1;
            const rowDiff = targetRow - fromRow;
            const colDiff = Math.abs(targetCol - fromCol);
            
            // Pawn captures diagonally
            if (colDiff === 1 && rowDiff === direction) {
                return true;
            }
        } else if (piece.type === 'rook') {
            return (fromRow === targetRow || fromCol === targetCol) && 
                   this.isPathClear(fromRow, fromCol, targetRow, targetCol);
        } else if (piece.type === 'bishop') {
            return Math.abs(fromRow - targetRow) === Math.abs(fromCol - targetCol) && 
                   this.isPathClear(fromRow, fromCol, targetRow, targetCol);
        } else if (piece.type === 'queen') {
            return ((fromRow === targetRow || fromCol === targetCol) || 
                    Math.abs(fromRow - targetRow) === Math.abs(fromCol - targetCol)) && 
                   this.isPathClear(fromRow, fromCol, targetRow, targetCol);
        } else if (piece.type === 'king') {
            return Math.abs(fromRow - targetRow) <= 1 && Math.abs(fromCol - targetCol) <= 1;
        } else if (piece.type === 'knight') {
            const rowDiff = Math.abs(fromRow - targetRow);
            const colDiff = Math.abs(fromCol - targetCol);
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        }
        
        return false;
    }

    /**
     * Check if a square is under attack by the opponent (non-recursive version)
     */
    isSquareUnderAttackSimple(row, col, defenderColor) {
        const attackerColor = defenderColor === 'white' ? 'black' : 'white';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === attackerColor) {
                    if (this.canPieceAttackSimple(piece, r, c, row, col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Update castling rights when pieces move
     */
    updateCastlingRights(piece, fromRow, fromCol) {
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                this.castlingRights.white.king = false;
                this.fenCastling.K = false;
                this.fenCastling.Q = false;
            } else {
                this.castlingRights.black.king = false;
                this.fenCastling.k = false;
                this.fenCastling.q = false;
            }
        } else if (piece.type === 'rook') {
            if (piece.color === 'white') {
                if (fromCol === 0) {
                    this.castlingRights.white.rookQueen = false;
                    this.fenCastling.Q = false;
                } else if (fromCol === 7) {
                    this.castlingRights.white.rookKing = false;
                    this.fenCastling.K = false;
                }
            } else {
                if (fromCol === 0) {
                    this.castlingRights.black.rookQueen = false;
                    this.fenCastling.q = false;
                } else if (fromCol === 7) {
                    this.castlingRights.black.rookKing = false;
                    this.fenCastling.k = false;
                }
            }
        }
    }

    /**
     * Handle en passant capture
     */
    handleEnPassant(piece, fromRow, fromCol, toRow, toCol) {
        if (piece && piece.type === 'pawn' && !this.board[toRow][toCol] && Math.abs(toCol - fromCol) === 1) {
            if (this.fenEnPassant !== '-') {
                const epFile = this.fenEnPassant.charCodeAt(0) - 97;
                const epRank = 8 - parseInt(this.fenEnPassant.charAt(1));
                if (toCol === epFile && toRow === epRank) {
                    // Remove the captured pawn
                    const capturedPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
                    this.board[capturedPawnRow][toCol] = null;
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Update en passant target square
     */
    updateEnPassantTarget(piece, fromRow, fromCol, toRow, toCol) {
        this.fenEnPassant = '-';
        if (piece && piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            // Pawn double move
            const epCol = fromCol;
            const epRow = (fromRow + toRow) / 2;
            this.fenEnPassant = String.fromCharCode(97 + epCol) + (8 - epRow);
        }
    }

    /**
     * Check if a move results in pawn promotion
     */
    isPawnPromotion(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (piece && piece.type === 'pawn') {
            return (piece.color === 'white' && toRow === 0) || 
                   (piece.color === 'black' && toRow === 7);
        }
        return false;
    }

    /**
     * Get algebraic notation for a move
     */
    getAlgebraicNotation(fromRow, fromCol, toRow, toCol, options = {}) {
        const piece = this.board[fromRow][fromCol];
        const { isCapture, promotion, prevBoard, isEnPassant } = options;
        
        // If piece is null, try to get it from prevBoard (before the move)
        const actualPiece = piece || (prevBoard && prevBoard[fromRow] && prevBoard[fromRow][fromCol]);
        
        if (!actualPiece) {
            console.warn('No piece found for algebraic notation at', fromRow, fromCol);
            return '??'; // Return unknown move notation
        }
        
        const fromFile = String.fromCharCode(97 + fromCol);
        const fromRank = 8 - fromRow;
        const toFile = String.fromCharCode(97 + toCol);
        const toRank = 8 - toRow;
        
        let notation = '';
        
        if (actualPiece.type === 'pawn') {
            if (isCapture || isEnPassant) {
                notation = fromFile + 'x' + toFile + toRank;
            } else {
                notation = toFile + toRank;
            }
            
            if (promotion) {
                notation += '=' + promotion.toUpperCase();
            }
            
            if (isEnPassant) {
                notation += ' e.p.';
            }
        } else {
            const pieceSymbols = {
                'knight': 'N',
                'king': 'K',
                'queen': 'Q',
                'rook': 'R',
                'bishop': 'B'
            };
            const pieceSymbol = pieceSymbols[actualPiece.type] || actualPiece.type.charAt(0).toUpperCase();
            notation = pieceSymbol;
            
            // Add disambiguation if needed
            const disambiguation = this.getDisambiguation(actualPiece, fromRow, fromCol, toRow, toCol, prevBoard);
            notation += disambiguation;
            
            if (isCapture) {
                notation += 'x';
            }
            
            notation += toFile + toRank;
        }
        
        // Check for check/checkmate after the move
        const opponentColor = actualPiece.color === 'white' ? 'black' : 'white';
        if (this.isInCheck(opponentColor)) {
            const legalMoves = this.getAllLegalMovesForColor(opponentColor);
            if (legalMoves.length === 0) {
                notation += '#'; // Checkmate
            } else {
                notation += '+'; // Check
            }
        }
        
        return notation;
    }

    /**
     * Get disambiguation for algebraic notation
     */
    getDisambiguation(piece, fromRow, fromCol, toRow, toCol, prevBoard) {
        // Find other pieces of the same type that can move to the same square
        const sameTypePieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const otherPiece = prevBoard[row][col];
                if (otherPiece && 
                    otherPiece.type === piece.type && 
                    otherPiece.color === piece.color && 
                    (row !== fromRow || col !== fromCol)) {
                    
                    // Check if this piece can also move to the target square
                    const originalBoard = this.board;
                    this.board = prevBoard;
                    const canMove = this.isValidMove(row, col, toRow, toCol);
                    this.board = originalBoard;
                    
                    if (canMove) {
                        sameTypePieces.push({ row, col });
                    }
                }
            }
        }
        
        if (sameTypePieces.length === 0) {
            return ''; // No disambiguation needed
        }
        
        // Check if file disambiguation is sufficient
        const sameFile = sameTypePieces.filter(p => p.col === fromCol);
        if (sameFile.length === 0) {
            return String.fromCharCode(97 + fromCol); // File disambiguation
        }
        
        // Check if rank disambiguation is sufficient
        const sameRank = sameTypePieces.filter(p => p.row === fromRow);
        if (sameRank.length === 0) {
            return (8 - fromRow).toString(); // Rank disambiguation
        }
        
        // Use both file and rank
        return String.fromCharCode(97 + fromCol) + (8 - fromRow);
    }

    /**
     * Get all legal moves for a specific color
     */
    getAllLegalMovesForColor(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    for (let toRow = 0; toRow < 8; toRow++) {
                        for (let toCol = 0; toCol < 8; toCol++) {
                            if (this.isValidMove(row, col, toRow, toCol)) {
                                moves.push({ from: [row, col], to: [toRow, toCol] });
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    }

    /**
     * Generate a unique key for the current position (for repetition detection)
     */
    generatePositionKey() {
        let key = '';
        
        // Add board state
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                key += piece ? `${piece.color[0]}${piece.type[0]}` : '--';
            }
        }
        
        // Add current player
        key += this.currentPlayer[0];
        
        // Add castling rights
        key += (this.fenCastling.K ? 'K' : '') + (this.fenCastling.Q ? 'Q' : '') +
               (this.fenCastling.k ? 'k' : '') + (this.fenCastling.q ? 'q' : '');
        
        // Add en passant target
        key += this.fenEnPassant;
        
        return key;
    }

    /**
     * Check for threefold repetition
     */
    isThreefoldRepetition() {
        const currentPosition = this.generatePositionKey();
        let count = 0;
        
        for (const position of this.positionHistory) {
            if (position === currentPosition) {
                count++;
                if (count >= 3) return true;
            }
        }
        
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
} else {
    window.ChessEngine = ChessEngine;
} 