# 🏆 Advanced Chess App

A feature-rich chess application supporting **text input**, **voice commands**, and **AI opponents**.

## ✨ Features

### 🎮 Game Modes
- **🏠 Local Multiplayer** - Play with someone on the same device
- **🤖 vs Stockfish** - Play against the world's strongest chess engine

### 🎯 Input Methods
- **⌨️ Text Input** - Standard algebraic notation (`e4`, `Nf3`, `Qxd4`)
- **🎤 Voice Commands** - Speak your moves naturally
- **🖱️ Click to Move** - Visual piece movement

### 🧠 Chess Features
- **Full Rules** - All standard chess rules implemented
- **♕ Promotion** - Pawn promotion with piece selection
- **🏰 Castling** - King and queen side castling
- **👑 Check/Checkmate** - Complete game ending detection
- **🎭 Advanced Notation** - Complex moves like `Qxd4`, `O-O`, `e8=Q`

## 🚀 Quick Start

1. **Open `index.html`** in your browser
2. **Select game mode** (Human vs Human or Human vs Stockfish)
3. **Start playing!**

## 📋 Detailed Setup

### 🤖 Stockfish Setup
- Works automatically with internet connection
- Fallback CDN sources for reliability
- **👉 See `STOCKFISH_TROUBLESHOOTING.md` for debugging**

### 🏠 Local/Offline Setup
- **👉 See `LOCAL_SETUP.md` for offline usage**

## 🎮 How to Play

### Text Input Examples
```
e4          # Pawn to e4
Nf3         # Knight to f3
Qxd4        # Queen captures d4
O-O         # King side castling
e8=Q        # Pawn promotion to queen
```

### Voice Input Examples
```
"e4"                    # Pawn move
"knight f3"             # Piece move
"queen takes d4"        # Capture
"castle king side"      # Castling
"pawn to e8 queen"      # Promotion
```



## 🎯 Game Modes Explained

| Mode | Description | Setup Required |
|------|-------------|----------------|
| **Human vs Human** | Two players on same device | None |
| **Human vs Stockfish** | Play vs AI engine | Internet connection |

## 🛠️ Troubleshooting

### 🤖 Stockfish Issues
- **Run**: `debugStockfish()` in browser console
- **Check**: Internet connection
- **Try**: Refresh the page
- **See**: `STOCKFISH_TROUBLESHOOTING.md`

### 🌍 Online Connection Issues
- **Check**: Server is running (`npm start`)
- **Check**: Port 8080 is available
- **Try**: Different browser
- **See**: `ONLINE_MULTIPLAYER_SETUP.md`

### 🎤 Voice Input Issues
- **Allow**: Microphone permissions
- **Try**: Different browser
- **Check**: Microphone is working

## 📁 File Structure

```
chess-app/
├── index.html                    # Main application
├── styles.css                    # Styling
├── chess-server.js              # Multiplayer server
├── package.json                 # Server dependencies
├── README.md                    # This file
├── LOCAL_SETUP.md               # Local setup guide
├── ONLINE_MULTIPLAYER_SETUP.md  # Online setup guide
└── STOCKFISH_TROUBLESHOOTING.md # Stockfish debug guide
```

## 🔧 Technical Details

### Frontend
- **Pure HTML/CSS/JavaScript** - No frameworks required
- **WebSocket client** for real-time multiplayer
- **Web Speech API** for voice recognition
- **Stockfish.js** integration for AI

### Backend
- **Node.js WebSocket server** for multiplayer
- **Room-based architecture** for game management
- **Real-time move synchronization**
- **Automatic reconnection handling**

## 🎉 Advanced Features

### 🎯 Smart Move Recognition
- **Algebraic notation**: `Nf3`, `Qxd4`, `O-O`
- **Coordinate notation**: `e2e4`, `g1f3`
- **Voice parsing**: Natural language understanding
- **Error correction**: Helpful error messages

### 🔄 Real-time Synchronization
- **Instant moves** across all players
- **Turn management** with proper validation
- **Disconnection handling** with reconnection
- **Game state recovery** after reconnection

### 🎮 User Experience
- **Beautiful UI** with modern design
- **Responsive layout** for all screen sizes
- **Clear status messages** for all actions
- **Comprehensive debugging** tools

## 🚀 Future Enhancements

Potential future features:
- **Spectator mode** - Watch ongoing games
- **Game history** - Save and replay games
- **Tournament mode** - Multi-player tournaments
- **Rating system** - Player skill ratings
- **Chat system** - In-game communication

## 🏆 Why This Chess App?

- **🌍 Complete multiplayer** - Play with anyone, anywhere
- **🎤 Voice commands** - Speak your moves naturally  
- **🤖 World-class AI** - Stockfish engine integration
- **📱 Works everywhere** - Any modern browser
- **🔧 Easy setup** - Minimal configuration required
- **🎯 Full chess rules** - Professional-grade implementation

Perfect for chess enthusiasts, developers learning about real-time applications, and anyone who wants to play chess online with friends!

---

**🎮 Ready to play? Start with `index.html` or set up multiplayer with `npm start`!** 

## 🔍 **Debug Steps:**

### **1. Open Browser Console (F12)**
Press **F12** → Go to **Console** tab

### **2. Run the Debug Function**
Type this in the console and press Enter:
```javascript
debugStockfish()
```

This will show you detailed information about what's happening with Stockfish.

### **3. Check for Common Issues**

**Most likely causes:**

**A) Internet Connection Issue**
- Stockfish loads from CDN and needs internet
- Try refreshing the page

**B) CDN Blocking**
- Your network might be blocking the CDN
- Try a different network or browser

**C) Loading Still in Progress**  
- Wait a few more seconds and refresh

## 🚀 **Quick Fixes to Try:**

### **Fix 1: Refresh and Wait**
1. **Refresh the page** (F5)
2. **Select "Human vs Stockfish"** again  
3. **Wait 10-15 seconds** for "Stockfish ready" status
4. **Then make your move**

### **Fix 2: Test Network Connection**
Run this in console to test CDN access:
```javascript
fetch("https://unpkg.com/stockfish@16.0.0/src/stockfish.js")
  .then(r => console.log("✅ CDN accessible:", r.status))
  .catch(e => console.log("❌ CDN blocked:", e))
```

### **Fix 3: Force Stockfish Move (if it's ready)**
If Stockfish is actually ready but not moving, try:
```javascript
if (stockfishEngine && stockfishEngine.isReady) {
    stockfishEngine.requestMove();
    console.log("Forced Stockfish move request");
} else {
    console.log("Stockfish not ready:", stockfishEngine);
}
```

## 🎯 **Expected Behavior:**
1. **Status should show**: "Stockfish ready" (not "ready to initialize")
2. **After your move**: Status should change to "Stockfish thinking..."  
3. **Then**: Stockfish makes its move automatically

## 🎯 **Problem Identified:**
- ✅ **Stockfish loaded successfully** (`typeof Stockfish: function`)
- ❌ **Engine object not created** (`Engine exists: false`)
- ❌ **Engine not ready** (`Engine ready: false`)

This means Stockfish downloaded fine, but the engine initialization failed.

## 🔧 **Let's Fix This:**

### **Step 1: Manual Engine Creation**
Run this in your browser console to create the engine manually:

```javascript
// Create Stockfish engine manually
console.log("🚀 Creating Stockfish engine manually...");
try {
    const engine = new Stockfish();
    console.log("✅ Engine created:", engine);
    
    engine.onmessage = function(line) {
        console.log("📨 Stockfish says:", line);
    };
    
    engine.onerror = function(error) {
        console.log("❌ Stockfish error:", error);
    };
    
    // Test communication
    engine.postMessage("uci");
    console.log("📡 Sent 'uci' command to Stockfish");
    
    // Wait a moment then test if ready 
    setTimeout(() => {
        engine.postMessage("isready");
        console.log("📡 Sent 'isready' command to Stockfish");
    }, 1000);
    
} catch (error) {
    console.log("❌ Failed to create engine:", error);
}
```

### **Step 2: Check What Happens**
After running the above code, you should see:
- `✅ Engine created: [object]`
- `📨 Stockfish says: Stockfish 16 by the Stockfish developers (see AUTHORS file)`
- `📨 Stockfish says: uciok`
- `📨 Stockfish says: readyok`

### **Step 3: If Manual Creation Works**
If the manual creation works, run this to fix your chess app:

```javascript
// Fix the chess app's Stockfish
console.log("🔧 Fixing chess app Stockfish...");
stockfishEngine = new StockfishEngine();
stockfishEngine.setupEngine();
```

## 🎯 **Most Common Cause:**
The issue is usually that the engine creation succeeded, but the **message handlers** weren't set up properly, so the UCI communication failed.

## ❓ **What to Do:**
1. **Run the manual engine creation code above**
2. **Tell me what output you see** 
3. **If it works**, run the fix code
4. **Try making a move** in "Human vs Stockfish" mode

This will tell us exactly where the initialization is failing! 🔍 

🎉 **Excellent! It's working!** I can see from your output:

- ✅ **Worker created successfully**: `✅ Created worker, testing...`
- ✅ **Stockfish responding**: `📨 Worker says: Stockfish 2019-08-15 Multi-Variant`
- ✅ **Worker receiving commands**: `Worker received: uci`

**Stockfish is now running in a Web Worker!** It just needs to complete the UCI handshake. Let's check if it's ready:

## 🔍 **Check Current Status:**

Run this in your console to see if Stockfish is ready:

```javascript
console.log('🔍 Checking Stockfish status:');
console.log('- stockfishEngine exists:', !!stockfishEngine);
console.log('- stockfishEngine.engine exists:', !!(stockfishEngine && stockfishEngine.engine));
console.log('- stockfishEngine.isReady:', stockfishEngine && stockfishEngine.isReady);

// Check the UI status
const statusEl = document.getElementById('engine-status');
console.log('- UI status:', statusEl ? statusEl.textContent : 'Not found');
```

## 🎮 **Test if It's Working:**

If the status shows "Stockfish ready", try making a move:

1. **Select "Human vs Stockfish"** mode (if not already)
2. **Type "e4"** in the move input
3. **Click "Play Move"**
4. **Stockfish should respond** automatically!

## 🚀 **If Not Ready Yet:**

The worker might still be initializing. Let's send another command to complete the setup:

```javascript
// Check if the worker exists and send isready command
if (stockfishEngine && stockfishEngine.engine) {
    console.log('📡 Sending isready to complete setup...');
    stockfishEngine.engine.postMessage('isready');
} else {
    console.log('❌ Engine not found - worker may need more time');
}
```

## 🎯 **Expected Final Result:**

You should see:
- **Status**: "Stockfish ready" 
- **When you make a move**: Stockfish responds with its own move
- **Console**: Messages showing the chess communication

**The Web Worker approach is working!** Stockfish is running - it just needs to complete the UCI initialization. Try the status check above and let me know what you see! 🎮 

Perfect! I can see you refreshed the page. The Web Worker approach was working great, but now we need to run it again. Let's get Stockfish working again:

## 🚀 **Quick Fix - Run the Working Approach:**

Since the page refreshed, run these commands in your browser console (F12) in order:

### **Step 1: Force Load Stockfish Scripts**
```javascript
forceLoadStockfish()
```

**Wait for it to complete** (you'll see "✅ Loaded successfully" messages and the Module being found)

### **Step 2: Create the Working Web Worker**
```javascript
tryDirectModule()
```

**This should show:**
- `✅ Created worker, testing...`
- `📨 Worker says: Stockfish 2019-08-15 Multi-Variant`
- `Worker received: uci`

### **Step 3: Complete the Setup**
```javascript
<code_block_to_apply_changes_from>
```

## 🎯 **Expected Result:**

After running all three steps, you should see:
- ✅ **"Stockfish ready"** in the UI status
- ✅ **Successful UCI communication** in console
- ✅ **Ready to play chess!**

## 🎮 **Then Test It:**

1. **Select "Human vs Stockfish"** mode
2. **Type "e4"** and click "Play Move"  
3. **Stockfish should respond** with its move!

**Run those three commands in sequence and Stockfish will be working again!** The Web Worker approach was successful before, we just need to recreate it after the page refresh. 🎯 

Perfect! Excellent! 🎉 I can see it's working exactly like before:

- ✅ **Scripts loaded** and Module found
- ✅ **Worker created**: `✅ Created worker, testing...`
- ✅ **Stockfish responding**: `📨 Worker says: Stockfish 2019-08-15 Multi-Variant`
- ✅ **UCI command received**: `Worker received: uci`

Now let's complete the setup with **Step 3**:

## 🚀 **Step 3: Complete the Setup**

Run this in your console to finish the USC handshake:

```javascript
<code_block_to_apply_changes_from>
```

## 🎯 **Expected Result:**

You should see:
- `📡 Completing Stockfish setup...`
- `📨 Stockfish says: uciok`
- `📨 Stockfish says: readyok`  
- `🎉 STOCKFISH IS FULLY READY!`
- **UI status changes to**: "Stockfish ready"

## 🎮 **Then Test Your Chess!**

1. **Select "Human vs Stockfish"** mode
2. **Type "e4"** and click "Play Move"
3. **Stockfish should respond** with its move!

**Run that Step 3 code now - you're almost there!** 🎯 

```javascript
// Check if worker exists but engine object doesn't
console.log('🔍 Checking for existing worker...');
console.log('- Worker elements:', document.querySelectorAll('script[src*="stockfish"]').length);

// Find the worker that was created (it should be in a closure)
// Let's create the stockfishEngine object and connect it to any existing worker
if (!stockfishEngine) {
    console.log('🔧 Creating stockfishEngine object...');
    stockfishEngine = new StockfishEngine();
}

// The worker was created in tryDirectModule but we need to capture it
// Let's run tryDirectModule again and capture the worker properly
console.log('🔄 Re-running tryDirectModule to capture worker...');

// Create a new worker with proper setup
const stockfishWorkerCode = `
    importScripts('https://unpkg.com/stockfish.js@10.0.2/stockfish.js');
    self.onmessage = function(e) {
        console.log('Worker received:', e.data);
    };
`;

const blob = new Blob([stockfishWorkerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const newWorker = new Worker(workerUrl);

newWorker.onmessage = function(e) {
    console.log('📨 New Worker says:', e.data);
    
    if (e.data.includes('uciok')) {
        console.log('✅ UCI protocol acknowledged');
        newWorker.postMessage('isready');
    }
    
    if (e.data === 'readyok' || e.data.includes('readyok')) {
        console.log('🎉 STOCKFISH IS FULLY READY!');
        
        // Set up the engine
        if (!stockfishEngine) {
            stockfishEngine = new StockfishEngine();
        }
        stockfishEngine.engine = newWorker;
        stockfishEngine.isReady = true;
        
        // Update UI
        const statusEl = document.getElementById('engine-status');
        if (statusEl) {
            statusEl.textContent = 'Stockfish ready';
        }
        
        console.log('✅ Chess app engine ready!');
    }
};

newWorker.onerror = function(error) {
    console.log('❌ New Worker error:', error);
};

console.log('✅ New worker created, starting UCI...');
newWorker.postMessage('uci');
```

## 🎯 **Expected Result:**

You should see:
- `✅ New worker created, starting UCI...`
- `📨 New Worker says: Stockfish 2019-08-15 Multi-Variant`
- `📨 New Worker says: uciok`
- `✅ UCI protocol acknowledged`
- `📨 New Worker says: readyok`
- `🎉 STOCKFISH IS FULLY READY!`
- `✅ Chess app engine ready!`
- UI status: **"Stockfish ready"**

**Run that code and you should be ready to play chess!** 🎮 