require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root
app.use(express.static('public')); // Serve files from public folder

app.use(session({
    secret: 'secret-key', // Change this in production
    resave: false,
    saveUninitialized: false
}));

// Database Setup
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

// Helper for async queries
function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Create tables on startup
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    );
`;

dbRun(createTableQuery)
    .then(() => console.log('Users table ready'))
    .catch(err => console.error('Error creating table', err));

// Routes
app.get('/', (req, res) => {
    // Check if index.html exists in public folder
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    if (require('fs').existsSync(publicIndex)) {
        res.sendFile(publicIndex);
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.redirect('/?message=Registration successful! Please login.');
    } catch (e) {
        console.error(e);
        res.redirect('/?error=User already exists or error occurred.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/game.html');
        } else {
            res.redirect('/?error=Invalid credentials');
        }
    } catch (e) {
        console.error(e);
        res.redirect('/?error=Login error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
