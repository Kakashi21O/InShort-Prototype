// Emergency Lock Middleware
let isLocked = false;
let lockReason = '';
let lockedBy = '';
let lockTime = null;

function emergencyLock(reason, lockedByUser) {
  isLocked = true;
  lockReason = reason;
  lockedBy = lockedByUser;
  lockTime = new Date();
  console.log(`🚨 EMERGENCY LOCK ACTIVATED by ${lockedByUser}: ${reason}`);
}

function emergencyUnlock(unlockedByUser) {
  isLocked = false;
  lockReason = '';
  lockedBy = '';
  lockTime = null;
  console.log(`🔓 EMERGENCY LOCK DEACTIVATED by ${unlockedByUser}`);
}

function isEmergencyLocked() {
  return isLocked;
}

function getLockInfo() {
  return {
    isLocked,
    reason: lockReason,
    lockedBy,
    lockTime
  };
}

// Middleware to check emergency lock
function checkEmergencyLock(req, res, next) {
  if (isLocked) {
    return res.status(503).json({
      success: false,
      message: 'System is currently locked due to emergency',
      lockInfo: {
        reason: lockReason,
        lockedBy,
        lockTime
      }
    });
  }
  next();
}

module.exports = {
  emergencyLock,
  emergencyUnlock,
  isEmergencyLocked,
  getLockInfo,
  checkEmergencyLock
};

