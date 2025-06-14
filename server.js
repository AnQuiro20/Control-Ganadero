const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    earTag TEXT UNIQUE,
    name TEXT,
    age INTEGER,
    birthDate TEXT,
    breed TEXT,
    gender TEXT,
    births INTEGER,
    notes TEXT,
    registrationDate TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS breeding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cowId INTEGER,
    bullId INTEGER,
    breedingDate TEXT,
    expectedBirthDate TEXT,
    registeredDate TEXT,
    birthRegistered INTEGER DEFAULT 0,
    actualBirthDate TEXT
  )`);
});

// CRUD endpoints for animals
app.get('/api/animals', (req, res) => {
  db.all('SELECT * FROM animals', (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/animals', (req, res) => {
  const a = req.body;
  const stmt = db.prepare(`INSERT INTO animals(type, earTag, name, age, birthDate, breed, gender, births, notes, registrationDate)
    VALUES(?,?,?,?,?,?,?,?,?,?)`);
  stmt.run(a.type, a.earTag, a.name, a.age, a.birthDate, a.breed, a.gender, a.births, a.notes, new Date().toISOString(), function(err){
    if (err) return res.status(500).json({error: err.message});
    db.get('SELECT * FROM animals WHERE id=?', this.lastID, (err, row) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(row);
    });
  });
});

app.delete('/api/animals/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM animals WHERE id=?', id, function(err){
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

// Breeding records
app.get('/api/breeding', (req, res) => {
  db.all('SELECT * FROM breeding_records', (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/breeding', (req, res) => {
  const r = req.body;
  const stmt = db.prepare(`INSERT INTO breeding_records(cowId, bullId, breedingDate, expectedBirthDate, registeredDate, birthRegistered)
    VALUES(?,?,?,?,?,0)`);
  stmt.run(r.cowId, r.bullId, r.breedingDate, r.expectedBirthDate, new Date().toISOString(), function(err){
    if (err) return res.status(500).json({error: err.message});
    db.get('SELECT * FROM breeding_records WHERE id=?', this.lastID, (err, row) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(row);
    });
  });
});

app.put('/api/breeding/:id/birth', (req, res) => {
  const { id } = req.params;
  const { actualBirthDate } = req.body;
  const query = actualBirthDate ?
    `UPDATE breeding_records SET birthRegistered=1, actualBirthDate=? WHERE id=?` :
    `UPDATE breeding_records SET birthRegistered=0, actualBirthDate=NULL WHERE id=?`;
  const params = actualBirthDate ? [actualBirthDate, id] : [id];
  db.run(query, params, function(err){
    if (err) return res.status(500).json({error: err.message});
    db.get('SELECT * FROM breeding_records WHERE id=?', id, (err, row) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(row);
    });
  });
});

app.delete('/api/breeding/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM breeding_records WHERE id=?', id, function(err){
    if (err) return res.status(500).json({error: err.message});
    res.json({ deleted: this.changes });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
