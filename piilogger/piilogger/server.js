const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Setup
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

// API Endpoint to receive logs
app.post('/logs', (req, res) => {
  const { service, level, message } = req.body;
  if (!service || !level || !message) {
    return res.status(400).send('Missing required fields');
  }

  const sql = `INSERT INTO logs (service, level, message) VALUES (?, ?, ?)`;
  db.run(sql, [service, level, message], function(err) {
    if (err) {
      console.error('Error inserting log:', err);
      return res.status(500).send('Database error');
    }
    
    // Broadcast to all connected clients
    const newLog = {
      id: this.lastID,
      service,
      level,
      message,
      timestamp: new Date().toISOString()
    };
    io.emit('new_log', newLog);
    res.status(201).send({ success: true, id: this.lastID });
  });
});

// API Endpoint to get historical logs
app.get('/logs', (req, res) => {
  const limit = req.query.limit || 100;
  db.all(`SELECT * FROM logs ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.reverse()); // Return in chronological order
  });
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Piilogger server running on http://localhost:${PORT}`);
});
