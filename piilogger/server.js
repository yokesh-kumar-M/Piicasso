const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const sessionMiddleware = session({
  secret: 'piicasso-secure-logger-key-8899',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 86400000 }
});
app.use(sessionMiddleware);

// Protect socket.io
io.engine.use(sessionMiddleware);
io.use((socket, next) => {
  if (socket.request.session && socket.request.session.authenticated) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

const db = new sqlite3.Database('./logs.db', (err) => {
  if (err) console.error(err.message);
  console.log('Connected to the logs database.');
});

db.run(`CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT,
  level TEXT,
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Auth Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'SEM8' && password === 'Thisisourteamproject') {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

app.post('/api/recover', async (req, res) => {
  console.log('Recovery requested. Send instructions to yokeshkumar1704@gmail.com');
  res.json({ success: true, message: 'Recovery instructions sent to yokeshkumar1704@gmail.com' });
});

// Logs ingestion (Internal, no auth required to write logs)
app.post('/logs', (req, res) => {
  const { service, level, message } = req.body;
  if (!service || !level || !message) return res.status(400).send('Missing fields');

  db.run(`INSERT INTO logs (service, level, message) VALUES (?, ?, ?)`, [service, level, message], function(err) {
    if (err) return res.status(500).send('DB error');
    const newLog = { id: this.lastID, service, level, message, timestamp: new Date().toISOString() };
    io.emit('new_log', newLog); // Emit to authed sockets
    res.status(201).send({ success: true, id: this.lastID });
  });
});

// Get logs (Protected)
app.get('/api/logs', (req, res) => {
  if (!req.session.authenticated) return res.status(401).send('Unauthorized');
  const limit = req.query.limit || 100;
  db.all(`SELECT * FROM logs ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.reverse());
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Piilogger server running on http://localhost:${PORT}`);
});
