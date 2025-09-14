const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/add', (req,res) => {
  const { username, xp } = req.body;
  db.get("SELECT xp FROM users WHERE username=?", [username], (err,row) => {
    if (err) return res.status(500).json({ success:false, message: err.message });
    if (!row) return res.json({ success:false, message: 'User not found' });
    const newXP = (row.xp||0) + parseInt(xp);
    const level = Math.floor(newXP / 100) + 1;
    db.run("UPDATE users SET xp=?, level=? WHERE username=?", [newXP, level, username]);
    res.json({ success:true, xp:newXP, level });
  });
});

module.exports = router;
