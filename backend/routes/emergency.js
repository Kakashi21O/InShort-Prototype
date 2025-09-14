const express = require('express');
const router = express.Router();
const { emergencyLock, emergencyUnlock, getLockInfo } = require('../middleware/emergencyLock');

// Emergency lock endpoint (Head and Moderator only)
router.post('/lock', (req, res) => {
  const { reason, lockedBy } = req.body;
  
  if (!reason || !lockedBy) {
    return res.status(400).json({ 
      success: false, 
      message: 'Reason and lockedBy are required' 
    });
  }
  
  emergencyLock(reason, lockedBy);
  
  res.json({ 
    success: true, 
    message: 'Emergency lock activated',
    lockInfo: getLockInfo()
  });
});

// Emergency unlock endpoint (Head and Moderator only)
router.post('/unlock', (req, res) => {
  const { unlockedBy } = req.body;
  
  if (!unlockedBy) {
    return res.status(400).json({ 
      success: false, 
      message: 'unlockedBy is required' 
    });
  }
  
  emergencyUnlock(unlockedBy);
  
  res.json({ 
    success: true, 
    message: 'Emergency lock deactivated',
    lockInfo: getLockInfo()
  });
});

// Get lock status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    lockInfo: getLockInfo()
  });
});

module.exports = router;

