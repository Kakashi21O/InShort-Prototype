const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err,row) => {
    if (err) return res.status(500).json({ success:false, message: err.message });
    if (row) return res.json({ success:true, user: row });
    return res.json({ success:false, message: 'Invalid credentials' });
  });
});

module.exports = router;
