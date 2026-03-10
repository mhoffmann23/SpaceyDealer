const fs = require('fs');
const path = require('path');

const gameHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elite Vector Space</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #ffffff; /* White background */
            color: #000000; /* Black text */
            font-family: 'Courier New', Courier, monospace; /* Retro font */
        }
        canvas {
            display: block;
        }
        #ui-layer {
            position: absolute;
            top: 10px;
            left: 10px;
            pointer-events: none;
            text-transform: uppercase;
        }
        #message-area {
            position: absolute;
            top: 20%;
            width: 100%;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            display: none;
            text-shadow: 1px 1px 0 #fff;
        }
        #hangar-menu {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid black;
            padding: 20px;
            text-align: center;
            pointer-events: auto;
            box-shadow: 5px 5px 0px rgba(0,0,0,0.2);
            min-width: 300px;
        }
        .btn {
            background: white;
            color: black;
            border: 2px solid black;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            font-family: inherit;
            font-size: 16px;
            font-weight: bold;
            display: block;
            width: 100%;
            box-sizing: border-box;
        }
        .btn:hover {
            background: #000;
            color: white;
        }
        .hud-text {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        #controls-hint {
            position: absolute;
            bottom: 10px;
            left: 10px;
            font-size: 12px;
            opacity: 0.7;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div id="ui-layer">
        <div class="hud-text">SPEED: <span id="speed">0</span> M/S</div>
        <div class="hud-text">POS: <span id="coords">0, 0</span></div>
        <div class="hud-text">TARGET: <span id="target-dist">N/A</span></div>
        <div class="hud-text" style="color:red" id="warning"></div>
    </div>
    
    <div id="message-area"></div>

    <div id="hangar-menu">
        <h2>STATION SERVICES</h2>
        <div style="margin-bottom: 15px; border-bottom: 1px solid black;">Welcome, Commander.</div>
        <button class="btn" id="refuel-btn">REFUEL / REPAIR</button>
        <button class="btn" id="trade-btn">MARKET</button>
        <button class="btn" id="launch-btn">LAUNCH (30s)</button>
    </div>

    <div id="controls-hint">
        WASD / ARROWS to Fly | SPACE to Brake (Stabilize) | SHIFT to Boost
    </div>

    <canvas id="gameCanvas"></canvas>
    <script src="game.js"></script>
</body>
</html>`;

const gameJs = `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Konfigurace ---
const CONFIG = {
    thrustPower: 400,        // Acceleration force
    rotationSpeed: 3.5,      // Rotation speed (rad/s)
    friction: 0.0,           // Newtonian physics (0 friction)
    stabilizerFriction: 0.8, // Friction when "Space" is held
    zoomSpeed: 0.1,          // FOV change speed
    baseScale: 1.5,          // Base zoom
    minScale: 0.3,           // Min zoom at high speed
    starCount: 2000,
    worldSize: 30000,        // Universe size
    landingMaxSpeed: 80,     // Max speed for landing collision
    landingRadius: 60        // Pad detection radius
};

// --- Stav Hry ---
let game = {
    running: true,
    lastTime: 0,
    state: 'flying', // flying, docked
    messageTimer: 0
};

// --- Loď ---
let ship = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: 15,
    thrusting: false,
    reversing: false, // "Space" brake
    rotatingLeft: false,
    rotatingRight: false
};

// --- Svět ---
let stars = [];
let stations = [];
let particles = []; // For exhaust trails

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    // Generate Stars
    for (let i = 0; i < CONFIG.starCount; i++) {
        stars.push({
            x: (Math.random() - 0.5) * CONFIG.worldSize,
            y: (Math.random() - 0.5) * CONFIG.worldSize,
            size: Math.random() * 2 + 0.5
        });
    }

    // Create Station (The "Interest Point")
    stations.push({
        id: 'alpha',
        name: 'STATION ALPHA',
        x: 2000,
        y: -1500,
        width: 600,
        height: 400,
        angle: 0,
        pads: [
            { id: 1, relX: -150, relY: 0, w: 120, h: 120, occupied: false }, // Player pad
            { id: 2, relX: 150, relY: 0, w: 120, h: 120, occupied: true, npcColor: '#333' }    // NPC pad
        ]
    });
    
    // Create Distant Station
    stations.push({
        id: 'beta',
        name: 'OUTPOST BETA',
        x: -8000,
        y: 5000,
        width: 400,
        height: 400,
        angle: Math.PI / 4,
        pads: [
            { id: 1, relX: 0, relY: 0, w: 100, h: 100, occupied: false }
        ]
    });

    setupInputs();
    requestAnimationFrame(loop);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setupInputs() {
    window.addEventListener('keydown', (e) => {
        if (game.state !== 'flying') return;
        switch(e.key) {
            case 'w': case 'ArrowUp': ship.thrusting = true; break;
            case 'a': case 'ArrowLeft': ship.rotatingLeft = true; break;
            case 'd': case 'ArrowRight': ship.rotatingRight = true; break;
            case ' ': ship.reversing = true; break; // Stabilize/Brake
        }
    });

    window.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'w': case 'ArrowUp': ship.thrusting = false; break;
            case 'a': case 'ArrowLeft': ship.rotatingLeft = false; break;
            case 'd': case 'ArrowRight': ship.rotatingRight = false; break;
            case ' ': ship.reversing = false; break;
        }
    });

    document.getElementById('launch-btn').addEventListener('click', launchShip);
}

// --- Physics Engine ---
function update(dt) {
    if (game.state === 'flying') {
        // Rotation
        if (ship.rotatingLeft) ship.angle -= CONFIG.rotationSpeed * dt;
        if (ship.rotatingRight) ship.angle += CONFIG.rotationSpeed * dt;

        // Thrust
        if (ship.thrusting) {
            ship.vx += Math.cos(ship.angle) * CONFIG.thrustPower * dt;
            ship.vy += Math.sin(ship.angle) * CONFIG.thrustPower * dt;
            
            // Particles
            for(let i=0; i<3; i++) {
                particles.push({
                    x: ship.x - Math.cos(ship.angle) * 20,
                    y: ship.y - Math.sin(ship.angle) * 20,
                    vx: ship.vx - Math.cos(ship.angle) * (Math.random() * 100 + 50),
                    vy: ship.vy - Math.sin(ship.angle) * (Math.random() * 100 + 50),
                    life: 0.5 + Math.random() * 0.5
                });
            }
        }

        // Stabilizer (Spacebar) - Artificial friction to help landing
        if (ship.reversing) {
            ship.vx -= ship.vx * CONFIG.stabilizerFriction * dt;
            ship.vy -= ship.vy * CONFIG.stabilizerFriction * dt;
        }

        // Move
        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;

        // Particles update
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx * dt;
            particles[i].y += particles[i].vy * dt;
            particles[i].life -= dt;
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        checkLanding();
    }
}

function checkLanding() {
    const speed = Math.sqrt(ship.vx*ship.vx + ship.vy*ship.vy);
    
    // Warning if too fast near station
    const nearest = getNearestStation();
    if (nearest && nearest.dist < 1000 && speed > CONFIG.landingMaxSpeed) {
        document.getElementById('warning').innerText = "SLOW DOWN";
    } else {
        document.getElementById('warning').innerText = "";
    }

    if (nearest && nearest.dist < 800) {
        const station = nearest.station;
        station.pads.forEach(pad => {
            if (pad.occupied) return;

            // Pad world position (simplified rotation for now assumes station angle 0 or handled by world transform if we rotate stations)
            // Assuming non-rotated stations for simplicity of collision box logic first
            const padX = station.x + pad.relX;
            const padY = station.y + pad.relY;
            
            const distToPad = Math.sqrt((ship.x - padX)**2 + (ship.y - padY)**2);

            if (distToPad < 40) {
                if (speed < CONFIG.landingMaxSpeed) {
                    dockShip(station, pad);
                } else {
                    // Crash? Or just bounce? For now just don't dock.
                }
            }
        });
    }
}

function getNearestStation() {
    let minDist = Infinity;
    let nearest = null;
    stations.forEach(st => {
        const d = Math.sqrt((ship.x - st.x)**2 + (ship.y - st.y)**2);
        if (d < minDist) {
            minDist = d;
            nearest = st;
        }
    });
    return nearest ? { station: nearest, dist: minDist } : null;
}

function dockShip(station, pad) {
    game.state = 'docked';
    ship.vx = 0;
    ship.vy = 0;
    ship.x = station.x + pad.relX;
    ship.y = station.y + pad.relY;
    
    // UI
    document.getElementById('hangar-menu').style.display = 'block';
    showMessage(\`DOCKED AT \${station.name}\`);
    setTimeout(hideMessage, 3000);
}

function launchShip() {
    document.getElementById('hangar-menu').style.display = 'none';
    game.state = 'flying';
    
    // Launch boost
    ship.thrusting = false; // Reset input
    ship.vx = Math.cos(ship.angle) * 200;
    ship.vy = Math.sin(ship.angle) * 200;
    
    showMessage("LAUNCH SEQUENCE INITIATED");
    setTimeout(hideMessage, 2000);
}

function showMessage(text) {
    const el = document.getElementById('message-area');
    el.innerText = text;
    el.style.display = 'block';
}
function hideMessage() {
    document.getElementById('message-area').style.display = 'none';
}

// --- Rendering ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const speed = Math.sqrt(ship.vx*ship.vx + ship.vy*ship.vy);
    let targetScale = Math.max(CONFIG.minScale, CONFIG.baseScale - (speed / 1500));
    
    // Smooth zoom
    // currentScale = currentScale * 0.9 + targetScale * 0.1 (simplified)
    // We'll just use targetScale directly for responsiveness

    ctx.save();
    
    // Camera Transform
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(targetScale, targetScale);
    ctx.translate(-ship.x, -ship.y);

    // 1. Stars
    ctx.fillStyle = 'black';
    stars.forEach(star => {
        // Optimization: Only draw if roughly on screen
        const dx = Math.abs(star.x - ship.x);
        const dy = Math.abs(star.y - ship.y);
        if (dx < (canvas.width/targetScale)*0.6 && dy < (canvas.height/targetScale)*0.6) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 2. Stations
    stations.forEach(station => {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        
        ctx.save();
        ctx.translate(station.x, station.y);
        ctx.rotate(station.angle);
        
        // Station Body
        ctx.strokeRect(-station.width/2, -station.height/2, station.width, station.height);
        
        // Pads
        station.pads.forEach(pad => {
            ctx.strokeStyle = pad.occupied ? '#555' : 'black';
            ctx.strokeRect(pad.relX - pad.w/2, pad.relY - pad.h/2, pad.w, pad.h);
            
            // X Marker
            ctx.beginPath();
            ctx.moveTo(pad.relX - pad.w/2, pad.relY - pad.h/2);
            ctx.lineTo(pad.relX + pad.w/2, pad.relY + pad.h/2);
            ctx.moveTo(pad.relX + pad.w/2, pad.relY - pad.h/2);
            ctx.lineTo(pad.relX - pad.w/2, pad.relY + pad.h/2);
            ctx.stroke();

            if (pad.occupied) {
                // Draw NPC Ship
                drawVectorShip(pad.relX, pad.relY, -Math.PI/2, pad.npcColor || '#333', false);
            }
        });

        // Station Name
        ctx.fillStyle = 'black';
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(station.name, 0, -station.height/2 - 20);

        ctx.restore();
    });

    // 3. Particles
    ctx.fillStyle = 'black';
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
    });

    // 4. Player Ship
    if (game.state !== 'docked') {
        drawVectorShip(ship.x, ship.y, ship.angle, 'black', ship.thrusting);
    } else {
        // Draw player docked (faded)
        ctx.globalAlpha = 0.5;
        drawVectorShip(ship.x, ship.y, ship.angle, 'black', false);
        ctx.globalAlpha = 1.0;
    }

    // 5. Directions (HUD overlay in world space)
    drawWaypoints(targetScale);

    ctx.restore();

    // UI Updates
    document.getElementById('speed').innerText = Math.floor(speed);
    document.getElementById('coords').innerText = \`\${Math.floor(ship.x)}, \${Math.floor(ship.y)}\`;
    
    const nearest = getNearestStation();
    if (nearest) {
        document.getElementById('target-dist').innerText = \`\${nearest.station.name}: \${Math.floor(nearest.dist)}m\`;
    }
}

function drawVectorShip(x, y, angle, color, thrusting) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Cobra MkIII shapeish
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, 15);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-15, -15);
    ctx.closePath();
    ctx.stroke();

    // Cockpit line
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, -5);
    ctx.stroke();

    if (thrusting) {
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-12, -8);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawWaypoints(currentScale) {
    // Arrow pointing to nearest station
    const nearest = getNearestStation();
    if (nearest && nearest.dist > 500) {
        const dx = nearest.station.x - ship.x;
        const dy = nearest.station.y - ship.y;
        const angle = Math.atan2(dy, dx);
        
        const orbitDist = 200; // Distance from ship to draw arrow
        
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(angle);
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(orbitDist, 0);
        ctx.lineTo(orbitDist - 15, 8);
        ctx.lineTo(orbitDist - 15, -8);
        ctx.fill();
        
        // Distance text
        // ctx.rotate(-angle); // Reset rotation to draw text upright? No, keep it aligned with arrow maybe.
        // ctx.fillText(Math.floor(nearest.dist), orbitDist - 40, 0);

        ctx.restore();
    }
}

function loop(timestamp) {
    const dt = (timestamp - game.lastTime) / 1000;
    game.lastTime = timestamp;

    if (dt < 0.1) {
        update(dt);
        draw();
    }
    requestAnimationFrame(loop);
}

// Start
init();`;

fs.writeFileSync(path.join(__dirname, 'public/game.html'), gameHtml);
fs.writeFileSync(path.join(__dirname, 'public/game.js'), gameJs);
console.log('Files updated successfully.');
