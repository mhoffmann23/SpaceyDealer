const fs = require('fs');
const path = require('path');

// 1. Create public directory if not exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✓ Created public directory');
}

// 2. Create public/game.html
const gameHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpaceyMiner - Game</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: white; font-family: 'Courier New', Courier, monospace; }
        canvas { display: block; }
        #ui { position: absolute; top: 10px; left: 10px; color: black; pointer-events: none; }
        #status { font-weight: bold; }
        #controls-hint { position: absolute; bottom: 10px; left: 10px; color: #555; }
        .hidden { display: none; }
        #garage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid black;
            padding: 20px;
            text-align: center;
            display: none; 
            box-shadow: 5px 5px 0px black;
        }
        button {
            background: white;
            border: 2px solid black;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            margin: 5px;
        }
        button:hover { background: #eee; }
    </style>
</head>
<body>
    <div id="ui">
        <div>SPEED: <span id="speed">0</span> m/s</div>
        <div>FUEL: <span id="fuel">100</span>%</div>
        <div id="status">STATUS: CRUISING</div>
    </div>
    <div id="garage">
        <h2>STATION DOCK</h2>
        <p>Welcome, pilot.</p>
        <button id="refuelBtn">REFUEL</button>
        <button id="undockBtn">UNDOCK (30s)</button>
    </div>
    <div id="controls-hint">
        WASD / ARROWS to Thrust & Turn | SPACE to Brake (Stabilize)
    </div>
    <canvas id="gameCanvas"></canvas>
    <script src="game.js"><\/script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'game.html'), gameHtmlContent);
console.log('✓ Created public/game.html');

// 3. Create public/game.js with basic game loop
const gameJsContent = `// SpaceyMiner Game Loop
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.initGame();
    this.startGameLoop();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  initGame() {
    this.speed = 0;
    this.fuel = 100;
    this.status = 'CRUISING';
    this.docked = false;
  }

  update() {
    // Game update logic will go here
    this.updateUI();
  }

  updateUI() {
    document.getElementById('speed').textContent = Math.round(this.speed);
    document.getElementById('fuel').textContent = Math.round(this.fuel);
    document.getElementById('status').textContent = 'STATUS: ' + this.status;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game elements
    this.drawBackground();
  }

  drawBackground() {
    // Draw a simple starfield background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  startGameLoop() {
    const gameLoop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});`;

fs.writeFileSync(path.join(publicDir, 'game.js'), gameJsContent);
console.log('✓ Created public/game.js');

// 4. Move index.html to public/index.html if it exists
const indexPath = path.join(process.cwd(), 'index.html');
const publicIndexPath = path.join(publicDir, 'index.html');
if (fs.existsSync(indexPath)) {
  fs.renameSync(indexPath, publicIndexPath);
  console.log('✓ Moved index.html to public/index.html');
} else {
  console.log('ℹ index.html not found (skipped move)');
}

console.log('\n✓ All tasks completed successfully!');
