const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
});

// Create profiles directory if it doesn't exist
const profilesDir = 'uploads/profiles';
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Upload profile photo
router.post('/upload', upload.single('profilePhoto'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const username = req.body.username;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username required' });
    }

    const profilePhotoPath = `/uploads/profiles/${req.file.filename}`;

    // Update user profile
    db.get("SELECT id FROM user_profiles WHERE username = ?", [username], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (row) {
        // Update existing profile
        db.run(
          "UPDATE user_profiles SET profile_photo = ? WHERE username = ?",
          [profilePhotoPath, username],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.json({ success: true, profilePhoto: profilePhotoPath });
          }
        );
      } else {
        // Create new profile
        db.run(
          "INSERT INTO user_profiles(username, profile_photo) VALUES(?, ?)",
          [username, profilePhotoPath],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.json({ success: true, profilePhoto: profilePhotoPath });
          }
        );
      }
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get profile photo
router.get('/photo/:username', (req, res) => {
  const username = req.params.username;
  
  db.get(
    "SELECT profile_photo FROM user_profiles WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!row || !row.profile_photo) {
        // Generate default avatar
        const defaultAvatar = generateDefaultAvatar(username);
        return res.json({ success: true, profilePhoto: defaultAvatar, isDefault: true });
      }
      
      res.json({ success: true, profilePhoto: row.profile_photo, isDefault: false });
    }
  );
});

// Generate default avatar (like ChatGPT)
function generateDefaultAvatar(username) {
  const firstLetter = username.charAt(0).toUpperCase();
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const colorIndex = username.charCodeAt(0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Return SVG data URL
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="${backgroundColor}"/>
      <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${firstLetter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

module.exports = router;
