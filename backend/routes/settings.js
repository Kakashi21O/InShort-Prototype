const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Update user settings
router.post('/update', (req, res) => {
  const { username, nickname } = req.body;
  
  if (!username || !nickname) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  // Check if user profile exists
  db.get("SELECT id FROM user_profiles WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (row) {
      // Update existing profile
      db.run(
        "UPDATE user_profiles SET nickname = ? WHERE username = ?",
        [nickname, username],
        (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ success: true, message: 'Settings updated successfully' });
        }
      );
    } else {
      // Create new profile
      db.run(
        "INSERT INTO user_profiles(username, nickname) VALUES(?, ?)",
        [username, nickname],
        (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ success: true, message: 'Settings saved successfully' });
        }
      );
    }
  });
});

// Get user settings
router.get('/get/:username', (req, res) => {
  const username = req.params.username;
  
  db.get(
    "SELECT nickname, syllabus, study_stats FROM user_profiles WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!row) {
        return res.json({ success: true, settings: { nickname: username } });
      }
      
      res.json({ 
        success: true, 
        settings: {
          nickname: row.nickname || username,
          has_syllabus: !!row.syllabus,
          has_study_stats: !!row.study_stats
        }
      });
    }
  );
});

module.exports = router;
