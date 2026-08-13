const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sigma-lens-secret-key-2088-cyberpunk';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const db = new sqlite3.Database('./sigma.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT '',
    icon TEXT DEFAULT 'link',
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Sigma Operator',
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    title TEXT DEFAULT 'System Admin',
    status TEXT DEFAULT 'online'
  )`);

  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(
    `INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'admin', ?, 'admin')`,
    [hashedPassword]
  );

  db.run(
    `INSERT OR IGNORE INTO profile (id, name, bio, avatar, title, status) VALUES (1, 'Sigma Operator', 'Cybernetics Specialist & System Architect', '', 'Root Access', 'online')`
  );

  db.get(`SELECT COUNT(*) as count FROM links`, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (row.count === 0) {
      const sampleLinks = [
        ['GitHub', 'https://github.com', 'development', 'github', 1],
        ['Twitter / X', 'https://twitter.com', 'social', 'twitter', 2],
        ['Discord', 'https://discord.com', 'social', 'discord', 3],
        ['Portfolio', 'https://example.com', 'personal', 'globe', 4],
        ['LinkedIn', 'https://linkedin.com', 'professional', 'linkedin', 5],
        ['YouTube', 'https://youtube.com', 'media', 'youtube', 6]
      ];
      const stmt = db.prepare(`INSERT INTO links (title, url, category, icon, order_index) VALUES (?, ?, ?, ?, ?)`);
      sampleLinks.forEach(link => stmt.run(link));
      stmt.finalize();
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/links', (req, res) => {
  db.all(`SELECT * FROM links ORDER BY order_index ASC, id ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/links', authenticateToken, (req, res) => {
  const { title, url, category, icon, order_index } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }
  db.run(
    `INSERT INTO links (title, url, category, icon, order_index) VALUES (?, ?, ?, ?, ?)`,
    [title, url, category || '', icon || 'link', order_index || 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, message: 'Link created successfully' });
    }
  );
});

app.put('/api/links/:id', authenticateToken, (req, res) => {
  const { title, url, category, icon, order_index } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }
  db.run(
    `UPDATE links SET title = ?, url = ?, category = ?, icon = ?, order_index = ? WHERE id = ?`,
    [title, url, category || '', icon || 'link', order_index || 0, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Link not found' });
      }
      res.json({ message: 'Link updated successfully' });
    }
  );
});

app.delete('/api/links/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM links WHERE id = ?`, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }
    res.json({ message: 'Link deleted successfully' });
  });
});

app.get('/api/profile', (req, res) => {
  db.get(`SELECT * FROM profile WHERE id = 1`, [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row || {});
  });
});

app.put('/api/profile', authenticateToken, upload.single('avatar'), (req, res) => {
  const { name, bio, title, status } = req.body;
  const avatar = req.file ? '/uploads/' + req.file.filename : (req.body.avatar || '');
  db.run(
    `UPDATE profile SET name = ?, bio = ?, avatar = ?, title = ?, status = ? WHERE id = 1`,
    [name || '', bio || '', avatar, title || '', status || 'online'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

app.get('/api/stats', (req, res) => {
  db.get(`SELECT COUNT(*) as totalLinks FROM links`, [], (err, linksRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get(`SELECT COUNT(*) as totalUsers FROM users`, [], (err, usersRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const uptime = process.uptime();
      const memory = process.memoryUsage();
      res.json({
        totalLinks: linksRow.totalLinks || 0,
        totalUsers: usersRow.totalUsers || 0,
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        memoryUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        memoryTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
        cpuLoad: Math.round(Math.random() * 100 * 100) / 100,
        networkTx: Math.round(Math.random() * 5000 * 100) / 100,
        networkRx: Math.round(Math.random() * 3000 * 100) / 100,
        timestamp: new Date().toISOString()
      });
    });
  });
});

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SIGMA LENS HUB & CONTROL PANEL v1.0.0                  ║');
  console.log('║     Cyberpunk Dashboard System Online                      ║');
  console.log(`║     Running on port: ${PORT}                                  ║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
});