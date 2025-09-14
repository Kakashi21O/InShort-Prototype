// admin.js - handles admin panel functionality
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Check if user has admin privileges
  if (!['head', 'moderator'].includes(user.role)) {
    showNotification('Access denied. Admin privileges required.', 'error');
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  // Load initial data
  loadLockStatus();
  loadUsers();
  loadSystemStats();

  // Emergency lock form
  document.getElementById('emergencyLockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await activateEmergencyLock();
  });

  // Unlock button
  document.getElementById('unlockBtn').addEventListener('click', async () => {
    await deactivateEmergencyLock();
  });

  // Refresh data every 30 seconds
  setInterval(() => {
    loadLockStatus();
    loadSystemStats();
  }, 30000);
});

async function loadLockStatus() {
  try {
    const response = await fetch('/emergency/status');
    const data = await response.json();
    
    const lockStatus = document.getElementById('lockStatus');
    const lockBtn = document.getElementById('lockBtn');
    const unlockBtn = document.getElementById('unlockBtn');
    
    if (data.lockInfo.isLocked) {
      lockStatus.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i> 
          <strong>System is LOCKED</strong><br>
          <small>Reason: ${data.lockInfo.reason}</small><br>
          <small>Locked by: ${data.lockInfo.lockedBy}</small><br>
          <small>Time: ${new Date(data.lockInfo.lockTime).toLocaleString()}</small>
        </div>
      `;
      lockBtn.disabled = true;
      unlockBtn.disabled = false;
    } else {
      lockStatus.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i> 
          <strong>System is OPERATIONAL</strong><br>
          <small>All services are running normally</small>
        </div>
      `;
      lockBtn.disabled = false;
      unlockBtn.disabled = true;
    }
  } catch (error) {
    console.error('Error loading lock status:', error);
    document.getElementById('lockStatus').innerHTML = `
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i> 
        Unable to load system status
      </div>
    `;
  }
}

async function activateEmergencyLock() {
  const reason = document.getElementById('lockReason').value.trim();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!reason) {
    showNotification('Please enter a reason for the emergency lock', 'error');
    return;
  }
  
  try {
    const response = await fetch('/emergency/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: reason,
        lockedBy: user.username
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Emergency lock activated successfully', 'success');
      document.getElementById('lockReason').value = '';
      loadLockStatus();
    } else {
      showNotification('Failed to activate emergency lock: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error activating emergency lock:', error);
    showNotification('Error activating emergency lock', 'error');
  }
}

async function deactivateEmergencyLock() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!confirm('Are you sure you want to deactivate the emergency lock?')) {
    return;
  }
  
  try {
    const response = await fetch('/emergency/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unlockedBy: user.username
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Emergency lock deactivated successfully', 'success');
      loadLockStatus();
    } else {
      showNotification('Failed to deactivate emergency lock: ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Error deactivating emergency lock:', error);
    showNotification('Error deactivating emergency lock', 'error');
  }
}

async function loadUsers() {
  try {
    // For now, use sample data
    const users = [
      { username: 'student1', role: 'student', level: 3, xp: 150 },
      { username: 'student2', role: 'student', level: 2, xp: 80 },
      { username: 'teacher1', role: 'teacher', level: 8, xp: 500 },
      { username: 'monitor1', role: 'monitor', level: 5, xp: 300 },
      { username: 'moderator1', role: 'moderator', level: 10, xp: 800 },
      { username: 'head1', role: 'head', level: 15, xp: 1200 }
    ];
    
    const usersTable = document.getElementById('usersTable');
    usersTable.innerHTML = '';
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <i class="fas fa-user"></i> ${user.username}
        </td>
        <td>
          <span class="badge badge-${getRoleColor(user.role)}">${user.role}</span>
        </td>
        <td>Level ${user.level}</td>
        <td>${user.xp} XP</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user.username}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning" onclick="editUser('${user.username}')">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
      usersTable.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function getRoleColor(role) {
  const colors = {
    'head': 'danger',
    'moderator': 'warning',
    'teacher': 'info',
    'monitor': 'success',
    'student': 'primary'
  };
  return colors[role] || 'secondary';
}

async function loadSystemStats() {
  try {
    // Simulate system stats
    const stats = {
      totalUsers: Math.floor(Math.random() * 100) + 50,
      activeUsers: Math.floor(Math.random() * 20) + 10,
      totalFiles: Math.floor(Math.random() * 500) + 200
    };
    
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeUsers').textContent = stats.activeUsers;
    document.getElementById('totalFiles').textContent = stats.totalFiles;
  } catch (error) {
    console.error('Error loading system stats:', error);
  }
}

function viewUser(username) {
  showNotification(`Viewing user: ${username}`, 'info');
  // Implement user view functionality
}

function editUser(username) {
  showNotification(`Editing user: ${username}`, 'info');
  // Implement user edit functionality
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert">
      <span>&times;</span>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

