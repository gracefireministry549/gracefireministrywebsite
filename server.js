// =====================================================================
// GRACE FIRE DELIVERANCE HEALING GLOBAL WORLD MINISTRY — backend server
// A simple Express server that serves the website and saves
// Prayer Request / Contact form submissions to JSON files on disk.
// No database needed — great for a first website, free to run.
// =====================================================================

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const PRAYERS_FILE = path.join(DATA_DIR, 'prayers.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Make sure the data folder + files exist before the server starts
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(PRAYERS_FILE)) fs.writeFileSync(PRAYERS_FILE, '[]');
if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, '[]');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- helpers ----------
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------- Prayer Request API ----------
app.post('/api/prayer-request', (req, res) => {
  const { name, phone, email, request } = req.body || {};

  if (!name || !request) {
    return res.status(400).json({ error: 'Please tell us your name and your prayer request.' });
  }

  const entry = {
    id: Date.now(),
    name: String(name).slice(0, 200),
    phone: phone ? String(phone).slice(0, 50) : '',
    email: email ? String(email).slice(0, 200) : '',
    request: String(request).slice(0, 3000),
    submittedAt: new Date().toISOString()
  };

  const all = readJSON(PRAYERS_FILE);
  all.unshift(entry);
  writeJSON(PRAYERS_FILE, all);

  console.log('New prayer request received from:', entry.name);
  res.json({ success: true });
});

// ---------- General Contact API ----------
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Please fill in your name, email and message.' });
  }

  const entry = {
    id: Date.now(),
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    subject: subject ? String(subject).slice(0, 200) : '(No subject)',
    message: String(message).slice(0, 3000),
    submittedAt: new Date().toISOString()
  };

  const all = readJSON(CONTACTS_FILE);
  all.unshift(entry);
  writeJSON(CONTACTS_FILE, all);

  console.log('New contact message received from:', entry.name);
  res.json({ success: true });
});

// ---------- Simple admin views to read submissions ----------
// Visit /admin/prayers or /admin/contacts in your browser to see
// everything that has been submitted (protect this in production!).
app.get('/admin/prayers', (req, res) => {
  res.json(readJSON(PRAYERS_FILE));
});
app.get('/admin/contacts', (req, res) => {
  res.json(readJSON(CONTACTS_FILE));
});

// ---------- Fallback 404 ----------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Grace Fire Deliverance website running at http://localhost:${PORT}`);
});
