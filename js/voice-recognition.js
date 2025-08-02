/**
 * Voice Recognition Module
 * Handles speech-to-text input for chess moves
 */

class VoiceRecognition {
    constructor() {
        this.recognition = null;
        this.isSupported = false;
        this.permissionGranted = false;
        this.isListening = false;
        this.callbacks = {};
        
        this.initializeSpeechRecognition();
    }

    /**
     * Initialize speech recognition API
     */
    async initializeSpeechRecognition() {
        try {
            // Check for Web Speech API support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                console.warn('Speech recognition not supported in this browser');
                this.isSupported = false;
                return;
            }

            this.recognition = new SpeechRecognition();
            this.setupRecognitionSettings();
            this.setupRecognitionEvents();
            this.isSupported = true;
            
            // Test microphone permission
            await this.requestMicrophonePermission();
            
            console.log('Voice recognition initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            this.isSupported = false;
        }
    }

    /**
     * Configure speech recognition settings
     */
    setupRecognitionSettings() {
        if (!this.recognition) return;
        
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
    }

    /**
     * Set up speech recognition event handlers
     */
    setupRecognitionEvents() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.triggerCallback('onStart');
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            this.triggerCallback('onEnd');
        };

        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleSpeechError(event);
        };

        this.recognition.onnomatch = () => {
            console.log('No speech match found');
            this.triggerCallback('onNoMatch');
        };
    }

    /**
     * Handle speech recognition results
     */
    handleSpeechResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        console.log('Speech result:', { finalTranscript, interimTranscript });

        // Process the speech if we have a final result
        if (finalTranscript) {
            const chessMoves = this.parseChessNotation(finalTranscript);
            this.triggerCallback('onResult', {
                transcript: finalTranscript,
                moves: chessMoves,
                confidence: event.results[0][0].confidence
            });
        }

        // Update UI with interim results
        if (interimTranscript) {
            this.triggerCallback('onInterim', interimTranscript);
        }
    }

    /**
     * Handle speech recognition errors
     */
    handleSpeechError(event) {
        console.error('Speech recognition error:', event.error);
        
        const errorMessages = {
            'network': 'Network error occurred during voice recognition',
            'not-allowed': 'Microphone access denied. Please allow microphone access.',
            'no-speech': 'No speech detected. Please try again.',
            'aborted': 'Voice recognition was aborted',
            'audio-capture': 'Audio capture failed. Check your microphone.',
            'bad-grammar': 'Speech recognition grammar error'
        };

        const message = errorMessages[event.error] || `Voice recognition error: ${event.error}`;
        this.triggerCallback('onError', { error: event.error, message });
    }

    /**
     * Parse chess notation from speech text
     */
    parseChessNotation(text) {
        console.log('Parsing chess notation from:', text);
        
        const moves = [];
        const normalizedText = text.toLowerCase().trim();
        
        // Try different parsing approaches (phonetic first to handle speech recognition errors)
        const parsedMove = this.tryParsePhoneticNotation(normalizedText) ||
                          this.tryParseStandardNotation(normalizedText) ||
                          this.tryParseNaturalLanguage(normalizedText) ||
                          this.tryParseCoordinateNotation(normalizedText);
        
        if (parsedMove) {
            moves.push(parsedMove);
        }
        
        return moves;
    }

    /**
     * Try to parse standard algebraic notation
     */
    tryParseStandardNotation(text) {
        // Standard moves like "e4", "Nf3", "Qxd4", "O-O"
        const standardPatterns = [
            /\b([a-h][1-8])\b/g,                    // Pawn moves: e4, d5
            /\b([QKRBN][a-h][1-8])\b/g,            // Piece moves: Nf3, Bb5
            /\b([QKRBN]x[a-h][1-8])\b/g,           // Captures: Qxd4, Nxe5
            /\b(O-O|o-o|0-0)\b/g,                  // Kingside castling
            /\b(O-O-O|o-o-o|0-0-0)\b/g,           // Queenside castling
            /\b([a-h]x[a-h][1-8])\b/g              // Pawn captures: exd5
        ];

        for (const pattern of standardPatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                return this.normalizeMove(matches[0]);
            }
        }

        return null;
    }

    /**
     * Try to parse natural language chess commands
     */
    tryParseNaturalLanguage(text) {
        const naturalPatterns = {
            // Piece movements
            'pawn to ([a-h])([1-8])': (file, rank) => `${file}${rank}`,
            'pawn ([a-h])([1-8])': (file, rank) => `${file}${rank}`,
            
            'knight to ([a-h])([1-8])': (file, rank) => `N${file}${rank}`,
            'knight ([a-h])([1-8])': (file, rank) => `N${file}${rank}`,
            'knight,? ([a-h])([1-8])': (file, rank) => `N${file}${rank}`,
            'knight ([a-h]) ([a-h])([1-8])': (fromFile, toFile, rank) => `N${fromFile}${toFile}${rank}`,
            'knight ([1-8]) ([a-h])([1-8])': (fromRank, toFile, rank) => `N${fromRank}${toFile}${rank}`,
            
            // Knight moves with "to" keyword
            'knight ([a-h]) to ([a-h])([1-8])': (fromFile, toFile, rank) => `N${fromFile}${toFile}${rank}`,
            'knight ([1-8]) to ([a-h])([1-8])': (fromRank, toFile, rank) => `N${fromRank}${toFile}${rank}`,
            
            // Knight moves with "2" (phonetic "to")
            'knight ([a-h]) 2 ([a-h])([1-8])': (fromFile, toFile, rank) => `N${fromFile}${toFile}${rank}`,
            'knight ([1-8]) 2 ([a-h])([1-8])': (fromRank, toFile, rank) => `N${fromRank}${toFile}${rank}`,
            
            // Knight captures with disambiguation
            'knight takes ([a-h])([1-8])': (file, rank) => `Nx${file}${rank}`,
            'knight ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `N${fromFile}x${toFile}${rank}`,
            'knight ([1-8]) takes ([a-h])([1-8])': (fromRank, toFile, rank) => `N${fromRank}x${toFile}${rank}`,
            
            'bishop to ([a-h])([1-8])': (file, rank) => `B${file}${rank}`,
            'bishop ([a-h])([1-8])': (file, rank) => `B${file}${rank}`,
            'bishop,? ([a-h])([1-8])': (file, rank) => `B${file}${rank}`,
            'bishop ([a-h]) ([a-h])([1-8])': (fromFile, toFile, rank) => `B${fromFile}${toFile}${rank}`,
            'bishop ([1-8]) ([a-h])([1-8])': (fromRank, toFile, rank) => `B${fromRank}${toFile}${rank}`,
            
            // Bishop moves with "to" keyword
            'bishop ([a-h]) to ([a-h])([1-8])': (fromFile, toFile, rank) => `B${fromFile}${toFile}${rank}`,
            'bishop ([1-8]) to ([a-h])([1-8])': (fromRank, toFile, rank) => `B${fromRank}${toFile}${rank}`,
            
            // Bishop moves with "2" (phonetic "to")
            'bishop ([a-h]) 2 ([a-h])([1-8])': (fromFile, toFile, rank) => `B${fromFile}${toFile}${rank}`,
            'bishop ([1-8]) 2 ([a-h])([1-8])': (fromRank, toFile, rank) => `B${fromRank}${toFile}${rank}`,
            
            // Bishop captures with disambiguation
            'bishop takes ([a-h])([1-8])': (file, rank) => `Bx${file}${rank}`,
            'bishop ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `B${fromFile}x${toFile}${rank}`,
            'bishop ([1-8]) takes ([a-h])([1-8])': (fromRank, toFile, rank) => `B${fromRank}x${toFile}${rank}`,
            
            'rook to ([a-h])([1-8])': (file, rank) => `R${file}${rank}`,
            'rook ([a-h])([1-8])': (file, rank) => `R${file}${rank}`,
            'rook,? ([a-h])([1-8])': (file, rank) => `R${file}${rank}`,
            'rook ([a-h]) ([a-h])([1-8])': (fromFile, toFile, rank) => `R${fromFile}${toFile}${rank}`,
            'rook ([1-8]) ([a-h])([1-8])': (fromRank, toFile, rank) => `R${fromRank}${toFile}${rank}`,
            
            // Rook moves with "to" keyword
            'rook ([a-h]) to ([a-h])([1-8])': (fromFile, toFile, rank) => `R${fromFile}${toFile}${rank}`,
            'rook ([1-8]) to ([a-h])([1-8])': (fromRank, toFile, rank) => `R${fromRank}${toFile}${rank}`,
            
            // Rook moves with "2" (phonetic "to")
            'rook ([a-h]) 2 ([a-h])([1-8])': (fromFile, toFile, rank) => `R${fromFile}${toFile}${rank}`,
            'rook ([1-8]) 2 ([a-h])([1-8])': (fromRank, toFile, rank) => `R${fromRank}${toFile}${rank}`,
            
            // Rook captures with disambiguation
            'rook takes ([a-h])([1-8])': (file, rank) => `Rx${file}${rank}`,
            'rook ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `R${fromFile}x${toFile}${rank}`,
            'rook ([1-8]) takes ([a-h])([1-8])': (fromRank, toFile, rank) => `R${fromRank}x${toFile}${rank}`,
            
            'queen to ([a-h])([1-8])': (file, rank) => `Q${file}${rank}`,
            'queen ([a-h])([1-8])': (file, rank) => `Q${file}${rank}`,
            'queen,? ([a-h])([1-8])': (file, rank) => `Q${file}${rank}`,
            'queen ([a-h]) ([a-h])([1-8])': (fromFile, toFile, rank) => `Q${fromFile}${toFile}${rank}`,
            'queen ([1-8]) ([a-h])([1-8])': (fromRank, toFile, rank) => `Q${fromRank}${toFile}${rank}`,
            
            // Queen moves with "to" keyword
            'queen ([a-h]) to ([a-h])([1-8])': (fromFile, toFile, rank) => `Q${fromFile}${toFile}${rank}`,
            'queen ([1-8]) to ([a-h])([1-8])': (fromRank, toFile, rank) => `Q${fromRank}${toFile}${rank}`,
            
            // Queen moves with "2" (phonetic "to")
            'queen ([a-h]) 2 ([a-h])([1-8])': (fromFile, toFile, rank) => `Q${fromFile}${toFile}${rank}`,
            'queen ([1-8]) 2 ([a-h])([1-8])': (fromRank, toFile, rank) => `Q${fromRank}${toFile}${rank}`,
            
            // Queen captures with disambiguation
            'queen takes ([a-h])([1-8])': (file, rank) => `Qx${file}${rank}`,
            'queen ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `Q${fromFile}x${toFile}${rank}`,
            'queen ([1-8]) takes ([a-h])([1-8])': (fromRank, toFile, rank) => `Q${fromRank}x${toFile}${rank}`,
            
            'king to ([a-h])([1-8])': (file, rank) => `K${file}${rank}`,
            'king ([a-h])([1-8])': (file, rank) => `K${file}${rank}`,
            'king,? ([a-h])([1-8])': (file, rank) => `K${file}${rank}`,
            'king ([a-h]) ([a-h])([1-8])': (fromFile, toFile, rank) => `K${fromFile}${toFile}${rank}`,
            'king ([1-8]) ([a-h])([1-8])': (fromRank, toFile, rank) => `K${fromRank}${toFile}${rank}`,
            
            // King moves with "to" keyword
            'king ([a-h]) to ([a-h])([1-8])': (fromFile, toFile, rank) => `K${fromFile}${toFile}${rank}`,
            'king ([1-8]) to ([a-h])([1-8])': (fromRank, toFile, rank) => `K${fromRank}${toFile}${rank}`,
            
            // King moves with "2" (phonetic "to")
            'king ([a-h]) 2 ([a-h])([1-8])': (fromFile, toFile, rank) => `K${fromFile}${toFile}${rank}`,
            'king ([1-8]) 2 ([a-h])([1-8])': (fromRank, toFile, rank) => `K${fromRank}${toFile}${rank}`,
            
            // King captures with disambiguation
            'king takes ([a-h])([1-8])': (file, rank) => `Kx${file}${rank}`,
            'king ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `K${fromFile}x${toFile}${rank}`,
            'king ([1-8]) takes ([a-h])([1-8])': (fromRank, toFile, rank) => `K${fromRank}x${toFile}${rank}`,
            
            // Piece captures (CHECK FIRST)
            'queen takes ([a-h])([1-8])': (file, rank) => `Qx${file}${rank}`,
            'knight takes ([a-h])([1-8])': (file, rank) => `Nx${file}${rank}`,
            'bishop takes ([a-h])([1-8])': (file, rank) => `Bx${file}${rank}`,
            'rook takes ([a-h])([1-8])': (file, rank) => `Rx${file}${rank}`,
            'king takes ([a-h])([1-8])': (file, rank) => `Kx${file}${rank}`,
            
            // Generic captures
            '([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `${fromFile}x${toFile}${rank}`,
            '([a-h]) takes ([a-h]) ([1-8])': (fromFile, toFile, rank) => `${fromFile}x${toFile}${rank}`,
            'take ([a-h])([1-8])': (file, rank) => `x${file}${rank}`,
            'takes ([a-h])([1-8])': (file, rank) => `x${file}${rank}`,
            
            // Pawn captures with "pawn" keyword
            'pawn ([a-h]) takes ([a-h])([1-8])': (fromFile, toFile, rank) => `${fromFile}x${toFile}${rank}`,
            'pawn takes ([a-h])([1-8])': (toFile, rank) => `x${toFile}${rank}`,
            
            // Specific pawn captures
            'g takes ([a-h])([1-8])': (toFile, rank) => `gx${toFile}${rank}`,
            'f takes ([a-h])([1-8])': (toFile, rank) => `fx${toFile}${rank}`,
            'e takes ([a-h])([1-8])': (toFile, rank) => `ex${toFile}${rank}`,
            'd takes ([a-h])([1-8])': (toFile, rank) => `dx${toFile}${rank}`,
            'c takes ([a-h])([1-8])': (toFile, rank) => `cx${toFile}${rank}`,
            'b takes ([a-h])([1-8])': (toFile, rank) => `bx${toFile}${rank}`,
            'a takes ([a-h])([1-8])': (toFile, rank) => `ax${toFile}${rank}`,
            
            // Castling
            'castle king side|castle kingside|short castle': () => 'O-O',
            'castle queen side|castle queenside|long castle': () => 'O-O-O',
            
            // Special moves
            'en passant': () => 'ep' // Will need special handling
        };

        for (const [pattern, converter] of Object.entries(naturalPatterns)) {
            const regex = new RegExp(pattern, 'i');
            const match = text.match(regex);
            
            if (match) {
                try {
                    const result = converter(...match.slice(1));
                    if (result) return result;
                } catch (error) {
                    console.warn('Error in natural language conversion:', error);
                }
            }
        }

        return null;
    }

    /**
     * Try to parse coordinate notation (e.g., "e2 to e4", "e2e4")
     */
    tryParseCoordinateNotation(text) {
        // Patterns for coordinate notation
        const coordinatePatterns = [
            /([a-h])([1-8])\s*(?:to|2)\s*([a-h])([1-8])/i,  // "e2 to e4" or "e2 2 e4"
            /([a-h])([1-8])([a-h])([1-8])/i                   // "e2e4"
        ];

        for (const pattern of coordinatePatterns) {
            const match = text.match(pattern);
            if (match) {
                const fromFile = match[1].toLowerCase();
                const fromRank = match[2];
                const toFile = match[3].toLowerCase();
                const toRank = match[4];
                
                return `${fromFile}${fromRank}${toFile}${toRank}`;
            }
        }

        return null;
    }

    /**
     * Try to parse phonetic notation (accounting for speech recognition errors)
     */
    tryParsePhoneticNotation(text) {
        console.log('Trying phonetic parsing for:', text);
        
        // Common phonetic misinterpretations
        const phoneticMappings = {
            // Files
            'ay': 'a', 'bee': 'b', 'see': 'c', 'sea': 'c', 'dee': 'd', 
            'eee': 'e', 'eff': 'f', 'gee': 'g', 'aitch': 'h',
            
            // Ranks (numbers)
            'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
            'won': '1', 'for': '4', 'ate': '8',
            
            // Pieces
            'night': 'knight', 'nite': 'knight', 'net': 'knight', 'bishop': 'bishop',
            'ruke': 'rook', 'brook': 'rook', 'queen': 'queen', 'king': 'king'
        };

        let normalizedText = text;
        
        // Apply phonetic mappings
        for (const [phonetic, correct] of Object.entries(phoneticMappings)) {
            const regex = new RegExp(`\\b${phonetic}\\b`, 'gi');
            normalizedText = normalizedText.replace(regex, correct);
        }
        
        console.log('After phonetic normalization:', normalizedText);

        // Try parsing the normalized text (natural language first for piece moves)
        const result = this.tryParseNaturalLanguage(normalizedText) ||
               this.tryParseStandardNotation(normalizedText) ||
               this.tryParseCoordinateNotation(normalizedText);
               
        console.log('Phonetic parsing result:', result);
        return result;
    }

    /**
     * Normalize move notation
     */
    normalizeMove(move) {
        if (!move) return null;
        
        // Convert to standard format
        return move.toLowerCase()
                  .replace(/o/g, '0')    // Convert O to 0 in castling
                  .replace(/\s+/g, '');  // Remove spaces
    }

    /**
     * Request microphone permission
     */
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
            this.permissionGranted = true;
            console.log('Microphone permission granted');
        } catch (error) {
            console.warn('Microphone permission denied:', error);
            this.permissionGranted = false;
            throw error;
        }
    }

    /**
     * Start voice recognition
     */
    start() {
        if (!this.isSupported) {
            this.triggerCallback('onError', { 
                error: 'not-supported', 
                message: 'Speech recognition is not supported in this browser' 
            });
            return false;
        }

        if (!this.permissionGranted) {
            this.triggerCallback('onError', { 
                error: 'no-permission', 
                message: 'Microphone permission is required' 
            });
            return false;
        }

        if (this.isListening) {
            console.log('Voice recognition is already active');
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.triggerCallback('onError', { error: 'start-failed', message: error.message });
            return false;
        }
    }

    /**
     * Stop voice recognition
     */
    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Set callback functions
     */
    setCallback(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * Trigger callback functions
     */
    triggerCallback(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    /**
     * Check if voice recognition is supported
     */
    isVoiceSupported() {
        return this.isSupported;
    }

    /**
     * Check if currently listening
     */
    isCurrentlyListening() {
        return this.isListening;
    }

    /**
     * Get permission status
     */
    hasPermission() {
        return this.permissionGranted;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceRecognition;
} else {
    window.VoiceRecognition = VoiceRecognition;
} 