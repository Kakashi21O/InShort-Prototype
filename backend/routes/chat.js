const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.post('/save', (req,res) => {
  const { room, sender, message } = req.body;
  db.run("INSERT INTO chats(room,sender,message) VALUES(?,?,?)", [room, sender, message]);
  res.json({ success:true });
});

router.get('/:room', (req,res) => {
  const room = req.params.room;
  db.all("SELECT * FROM chats WHERE room=? ORDER BY timestamp ASC",[room], (err, rows) => {
    if (err) return res.status(500).json([]);
    res.json(rows);
  });
});

module.exports = router;
