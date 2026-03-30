import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initDB } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'challenge45-quinton-hardlock-2026';

// --- Auth middleware ---
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Routes ---

// Check if PIN has been set up
app.get('/api/status', (_req, res) => {
  const user = db.prepare('SELECT id FROM users LIMIT 1').get();
  res.json({ setup: !!user });
});

// First-time setup: set PIN
app.post('/api/setup', (req, res) => {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (existing) return res.status(400).json({ error: 'Already set up' });

  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN must be at least 4 digits' });

  const hash = bcrypt.hashSync(pin, 10);
  const result = db.prepare('INSERT INTO users (pin_hash) VALUES (?)').run(hash);
  const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '90d' });
  res.json({ token });
});

// Login with PIN
app.post('/api/login', (req, res) => {
  const user = db.prepare('SELECT * FROM users LIMIT 1').get();
  if (!user) return res.status(400).json({ error: 'Not set up yet' });

  const { pin } = req.body;
  if (!bcrypt.compareSync(pin || '', user.pin_hash)) {
    return res.status(401).json({ error: 'Wrong PIN' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '90d' });
  res.json({ token });
});

// Get all completions
app.get('/api/completions', auth, (_req, res) => {
  const rows = db.prepare('SELECT key FROM completions').all();
  const obj = {};
  for (const r of rows) obj[r.key] = true;
  res.json(obj);
});

// Sync completions (full replace)
app.post('/api/completions', auth, (req, res) => {
  const { completions } = req.body;
  const del = db.prepare('DELETE FROM completions');
  const ins = db.prepare('INSERT OR REPLACE INTO completions (key) VALUES (?)');

  db.transaction(() => {
    del.run();
    for (const [key, val] of Object.entries(completions)) {
      if (val) ins.run(key);
    }
  })();

  res.json({ ok: true });
});

// Toggle a single completion (more efficient for real-time)
app.put('/api/completions/:key', auth, (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value) {
    db.prepare('INSERT OR REPLACE INTO completions (key) VALUES (?)').run(key);
  } else {
    db.prepare('DELETE FROM completions WHERE key = ?').run(key);
  }
  res.json({ ok: true });
});

// Get all photos (with data for vault grid)
app.get('/api/photos', auth, (_req, res) => {
  const photos = db.prepare('SELECT day, data_url, timestamp FROM photos ORDER BY day').all();
  res.json(photos);
});

// Get single photo
app.get('/api/photos/:day', auth, (req, res) => {
  const photo = db.prepare('SELECT day, data_url, timestamp FROM photos WHERE day = ?').get(+req.params.day);
  res.json(photo || null);
});

// Save photo for a day
app.post('/api/photos/:day', auth, (req, res) => {
  const { dataUrl } = req.body;
  db.prepare('INSERT OR REPLACE INTO photos (day, data_url, timestamp) VALUES (?, ?, ?)').run(
    +req.params.day, dataUrl, Date.now()
  );
  res.json({ ok: true });
});

// Delete photo
app.delete('/api/photos/:day', auth, (req, res) => {
  db.prepare('DELETE FROM photos WHERE day = ?').run(+req.params.day);
  res.json({ ok: true });
});

// --- Serve frontend in production ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- Start ---
const PORT = process.env.PORT || 3001;
initDB();
app.listen(PORT, () => {
  console.log(`Challenge 45 server running on port ${PORT}`);
});
