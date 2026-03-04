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
<<<<<<< Updated upstream
// app.use(express.static('public')); // Removed because public folder creation failed
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
=======
app.use(express.static(path.join(__dirname, 'public')));

>>>>>>> Stashed changes
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

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// Routes
<<<<<<< Updated upstream
=======
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

>>>>>>> Stashed changes
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
            if (err) {
                return res.status(400).send('User already exists or error occurred.');
            }
            res.redirect('/?message=Registration successful! Please login.');
        });
    } catch (e) {
        res.status(500).send('Error registering user.');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
<<<<<<< Updated upstream
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (err || !row) {
            return res.redirect('/?error=Invalid credentials');
        }
        if (await bcrypt.compare(password, row.password)) {
            req.session.userId = row.id;
            req.session.username = row.username;
            res.send(`<h1>Login successful!</h1><p>Welcome, ${row.username}.</p><a href="/logout">Logout</a>`);
=======
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/game'); // Redirect to game after login
>>>>>>> Stashed changes
        } else {
            res.redirect('/?error=Invalid credentials');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
