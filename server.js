require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
// If MySQL connection details are provided use MySQL, otherwise fall back to SQLite.
let db;
let mysqlPool;
const useMysql = process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE;

if (useMysql) {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE
  });
} else {
  db = new sqlite3.Database('./database.db');
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve index.html with configurable API base
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error loading page');
    const apiBase = process.env.API_BASE || '';
    res.send(html.replace('<meta name="api-base" content="">', `<meta name="api-base" content="${apiBase}">`));
  });
});

app.use(express.static(path.join(__dirname)));

// Initialize tables for either SQLite or MySQL
if (useMysql) {
  (async () => {
    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS animals (
      id INT AUTO_INCREMENT PRIMARY KEY,
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
    await mysqlPool.query(`CREATE TABLE IF NOT EXISTS breeding_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cowId INTEGER,
      bullId INTEGER,
      breedingDate TEXT,
      expectedBirthDate TEXT,
      registeredDate TEXT,
      birthRegistered BOOLEAN DEFAULT FALSE,
      actualBirthDate TEXT
    )`);
  })();
} else {
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
}

// CRUD endpoints for animals
app.get('/api/animals', (req, res) => {
  if (useMysql) {
    mysqlPool.query('SELECT * FROM animals')
      .then(([rows]) => res.json(rows))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    db.all('SELECT * FROM animals', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/animals', (req, res) => {
  const a = req.body;
  if (useMysql) {
    (async () => {
      const params = [a.type, a.earTag, a.name, a.age, a.birthDate, a.breed, a.gender, a.births, a.notes, new Date().toISOString()];
      const [result] = await mysqlPool.execute(
        `INSERT INTO animals(type, earTag, name, age, birthDate, breed, gender, births, notes, registrationDate)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        params
      );
      const [rows] = await mysqlPool.query('SELECT * FROM animals WHERE id=?', [result.insertId]);
      res.json(rows[0]);
    })().catch(err => res.status(500).json({ error: err.message }));
  } else {
    const stmt = db.prepare(`INSERT INTO animals(type, earTag, name, age, birthDate, breed, gender, births, notes, registrationDate)
      VALUES(?,?,?,?,?,?,?,?,?,?)`);
    stmt.run(a.type, a.earTag, a.name, a.age, a.birthDate, a.breed, a.gender, a.births, a.notes, new Date().toISOString(), function(err){
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM animals WHERE id=?', this.lastID, (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(row);
      });
    });
  }
});

app.delete('/api/animals/:id', (req, res) => {
  const { id } = req.params;
  if (useMysql) {
    mysqlPool.query('DELETE FROM animals WHERE id=?', [id])
      .then(([result]) => res.json({ deleted: result.affectedRows }))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    db.run('DELETE FROM animals WHERE id=?', id, function(err){
      if (err) return res.status(500).json({error: err.message});
      res.json({ deleted: this.changes });
    });
  }
});

// Breeding records
app.get('/api/breeding', (req, res) => {
  if (useMysql) {
    mysqlPool.query('SELECT * FROM breeding_records')
      .then(([rows]) => res.json(rows))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    db.all('SELECT * FROM breeding_records', (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(rows);
    });
  }
});

app.post('/api/breeding', (req, res) => {
  const r = req.body;
  if (useMysql) {
    (async () => {
      const params = [r.cowId, r.bullId, r.breedingDate, r.expectedBirthDate, new Date().toISOString()];
      const [result] = await mysqlPool.execute(
        `INSERT INTO breeding_records(cowId, bullId, breedingDate, expectedBirthDate, registeredDate, birthRegistered)
         VALUES (?,?,?,?,?,false)`,
        params
      );
      const [rows] = await mysqlPool.query('SELECT * FROM breeding_records WHERE id=?', [result.insertId]);
      res.json(rows[0]);
    })().catch(err => res.status(500).json({ error: err.message }));
  } else {
    const stmt = db.prepare(`INSERT INTO breeding_records(cowId, bullId, breedingDate, expectedBirthDate, registeredDate, birthRegistered)
      VALUES(?,?,?,?,?,0)`);
    stmt.run(r.cowId, r.bullId, r.breedingDate, r.expectedBirthDate, new Date().toISOString(), function(err){
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM breeding_records WHERE id=?', this.lastID, (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(row);
      });
    });
  }
});

app.put('/api/breeding/:id/birth', (req, res) => {
  const { id } = req.params;
  const { actualBirthDate } = req.body;
  const queryMysql = actualBirthDate ?
    `UPDATE breeding_records SET birthRegistered=1, actualBirthDate=? WHERE id=?` :
    `UPDATE breeding_records SET birthRegistered=0, actualBirthDate=NULL WHERE id=?`;
  const paramsMysql = actualBirthDate ? [actualBirthDate, id] : [id];
  const querySqlite = queryMysql;
  if (useMysql) {
    mysqlPool.query(queryMysql, paramsMysql)
      .then(() => mysqlPool.query('SELECT * FROM breeding_records WHERE id=?', [id]))
      .then(([rows]) => res.json(rows[0]))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    const params = actualBirthDate ? [actualBirthDate, id] : [id];
    db.run(querySqlite, params, function(err){
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM breeding_records WHERE id=?', id, (err, row) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(row);
      });
    });
  }
});

app.delete('/api/breeding/:id', (req, res) => {
  const { id } = req.params;
  if (useMysql) {
    mysqlPool.query('DELETE FROM breeding_records WHERE id=?', [id])
      .then(([result]) => res.json({ deleted: result.affectedRows }))
      .catch(err => res.status(500).json({ error: err.message }));
  } else {
    db.run('DELETE FROM breeding_records WHERE id=?', id, function(err){
      if (err) return res.status(500).json({error: err.message});
      res.json({ deleted: this.changes });
    });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
