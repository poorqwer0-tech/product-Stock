const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sigma-lens-secret-key-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// SQLite Database
const dbPath = './data/sigma-lens.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('✓ Connected to SQLite Database');
});

// Initialize Database Tables
function initDatabase() {
  db.serialize(() => {
    // Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.log('Users table already exists');
    });

    // Links Table
    db.run(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category TEXT,
        description TEXT,
        icon_url TEXT,
        clicks INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.log('Links table already exists');
    });

    // Profile Table
    db.run(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        bio TEXT,
        avatar_url TEXT,
        banner_url TEXT,
        theme TEXT DEFAULT 'cyberpunk',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.log('Profile table already exists');
    });

    // Logs Table
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.log('Logs table already exists');
    });

    // Check and Insert Default Admin User
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(
          "INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
          ['admin', hashedPassword, 'admin@sigmalens.com', 'admin'],
          (err) => {
            if (!err) console.log('✓ Default admin user created (admin / admin123)');
          }
        );
      }
    });

    // Check and Insert Default Profile
    db.get("SELECT * FROM profile LIMIT 1", (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO profile (name, bio, theme) VALUES (?, ?, ?)",
          ['Sigma Lens Hub', 'Cyberpunk Dashboard & Link Control Panel', 'cyberpunk'],
          (err) => {
            if (!err) console.log('✓ Default profile created');
          }
        );
      }
    });
  });
}

initDatabase();

// Middleware: Verify JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) {
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
      success: true, 
      token, 
      user: { id: user.id, username: user.username, role: user.role } 
    });
  });
});

app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ==================== LINKS ROUTES ====================

app.get('/api/links', (req, res) => {
  db.all("SELECT * FROM links ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.get('/api/links/:id', (req, res) => {
  db.get("SELECT * FROM links WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Link not found' });
    res.json(row);
  });
});

app.post('/api/links', verifyToken, (req, res) => {
  const { title, url, category, description, icon_url } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL required' });
  }

  db.run(
    "INSERT INTO links (title, url, category, description, icon_url) VALUES (?, ?, ?, ?, ?)",
    [title, url, category || 'general', description || '', icon_url || '🔗'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get("SELECT * FROM links WHERE id = ?", [this.lastID], (err, row) => {
        res.status(201).json(row);
      });
    }
  );
});

app.put('/api/links/:id', verifyToken, (req, res) => {
  const { title, url, category, description, icon_url } = req.body;

  db.run(
    "UPDATE links SET title = ?, url = ?, category = ?, description = ?, icon_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [title, url, category, description, icon_url, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Link not found' });

      db.get("SELECT * FROM links WHERE id = ?", [req.params.id], (err, row) => {
        res.json(row);
      });
    }
  );
});

app.delete('/api/links/:id', verifyToken, (req, res) => {
  db.run("DELETE FROM links WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Link not found' });
    res.json({ success: true, message: 'Link deleted' });
  });
});

app.post('/api/links/:id/click', (req, res) => {
  db.run(
    "UPDATE links SET clicks = clicks + 1 WHERE id = ?",
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ==================== PROFILE ROUTES ====================

app.get('/api/profile', (req, res) => {
  db.get("SELECT * FROM profile LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.put('/api/profile', verifyToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), (req, res) => {
  const { name, bio, theme } = req.body;
  let avatar_url = req.body.avatar_url;
  let banner_url = req.body.banner_url;

  if (req.files && req.files.avatar) {
    avatar_url = '/uploads/' + req.files.avatar[0].filename;
  }

  if (req.files && req.files.banner) {
    banner_url = '/uploads/' + req.files.banner[0].filename;
  }

  db.run(
    "UPDATE profile SET name = ?, bio = ?, avatar_url = ?, banner_url = ?, theme = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
    [name, bio, avatar_url, banner_url, theme],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get("SELECT * FROM profile WHERE id = 1", (err, row) => {
        res.json(row);
      });
    }
  );
});

// ==================== LOGS ROUTES ====================

app.get('/api/logs', verifyToken, (req, res) => {
  db.all("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/logs', (req, res) => {
  const { action, details } = req.body;

  db.run(
    "INSERT INTO logs (action, details) VALUES (?, ?)",
    [action, details || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ success: true });
    }
  );
});

// ==================== STATS ROUTES ====================

app.get('/api/stats', (req, res) => {
  const stats = {};

  db.get("SELECT COUNT(*) as count FROM links", (err, result) => {
    stats.totalLinks = result?.count || 0;

    db.get("SELECT SUM(clicks) as total FROM links", (err, result) => {
      stats.totalClicks = result?.total || 0;

      db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
        stats.totalUsers = result?.count || 0;

        res.json(stats);
      });
    });
  });
});

// ==================== ROOT ROUTES ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║    🌌 SIGMA LENS HUB & CONTROL PANEL 🌌    ║
║          Cyberpunk Dashboard Live           ║
╚══════════════════════════════════════════════╝

🔗 Server running on: http://localhost:${PORT}
🔐 Admin: http://localhost:${PORT}/admin
📊 API Base: http://localhost:${PORT}/api

🎮 Default Credentials:
   Username: admin
   Password: admin123

💾 Database: ${dbPath}
  `);
});

module.exports = app;
