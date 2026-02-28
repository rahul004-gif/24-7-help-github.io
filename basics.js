const express = require('express');
const session = require('express-session');
const argon2 = require('argon2');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // CRITICAL: This "links" your HTML and script.js

// Security: Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100 
});
app.use(limiter);

// Session Config
app.use(session({
    secret: 'my-secret-key', 
    resave: false,
    saveUninitialized: false
}));

// Database Initialization
let db;
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    await db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)');
    console.log("✅ Database Ready");
})();

// Route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Registration Route
app.post('/register', 
    body('username').isLength({ min: 3 }), 
    body('password').isLength({ min: 8 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).send("Validation failed (Min: 3 user, 8 pass)");

        try {
            const { username, password } = req.body;
            const hashedPassword = await argon2.hash(password);
            await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
            res.send("Account created successfully!");
        } catch (err) {
            res.status(500).send("Database error");
        }
});

// Login Route
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (user && await argon2.verify(user.password, password)) {
            req.session.userId = user.id;
            res.send(`Welcome back, ${username}!`);
        } else {
            res.status(401).send("Invalid username or password");
        }
    } catch (err) {
        res.status(500).send("Login failed");
    }
});

app.listen(3000, () => console.log('🚀 Server active at http://localhost:3000'));
// Add this to basics.js
app.get('/me', (req, res) => {
    if (req.session.userId) {
        res.send(`<h1>User Details</h1>
                  <p>User ID: ${req.session.userId}</p>
                  <p>Status: You are currently logged in.</p>`);
    } else {
        res.status(401).send("You are not logged in.");
    }
});