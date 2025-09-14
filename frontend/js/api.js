// api.js - handles login, xp, and UI updates
const API_BASE = "";

document.addEventListener("DOMContentLoaded", () => {
  // login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      if (!username) return;
      // call backend
      try {
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = 'dashboard.html';
        } else {
          document.getElementById('loginMsg').innerText = data.message || 'Login failed';
        }
      } catch (err) {
        document.getElementById('loginMsg').innerText = 'Server error';
      }
    });
  }

  // Dashboard init
  if (window.location.pathname.endsWith('dashboard.html')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) window.location.href = 'index.html';
    
    // Load user settings and display name
    loadUserSettings(user);
    updateXPUI(user);
    
    // Show admin link for head and moderator roles
    const adminLink = document.getElementById('adminLink');
    if (adminLink && ['head', 'moderator'].includes(user.role)) {
      adminLink.style.display = 'block';
    }
    document.getElementById('addXpBtn').addEventListener('click', async () => {
      await addXP(user.username, 10);
    });
    loadTopics();
    loadStudyStats(user);
    document.getElementById('logoutLink').addEventListener('click', () => { localStorage.removeItem('user'); window.location.href='index.html'; });
  }

  // Chat page init
  if (window.location.pathname.endsWith('chat.html')) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) window.location.href = 'index.html';
    document.getElementById('logoutLink2').addEventListener('click', () => { localStorage.removeItem('user'); window.location.href='index.html'; });
  }
});

async function addXP(username, xp) {
  const res = await fetch('/xp/add', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username, xp })
  });
  const data = await res.json();
  if (data.success) {
    const user = JSON.parse(localStorage.getItem('user')||'{}');
    user.xp = data.xp; user.level = data.level;
    localStorage.setItem('user', JSON.stringify(user));
    updateXPUI(user);
  }
}

function updateXPUI(user) {
  const xp = user.xp || 0;
  const level = user.level || 1;
  document.getElementById('xpValue').innerText = xp;
  document.getElementById('levelValue').innerText = level;
  
  // Update level badge
  const levelBadge = document.getElementById('levelBadge');
  if (levelBadge) {
    levelBadge.textContent = `Level ${level}`;
    levelBadge.className = `badge ${level >= 5 ? 'badge-success' : level >= 3 ? 'badge-warning' : 'badge-info'} pulse`;
  }
  
  // Calculate XP progress for current level
  const xpForCurrentLevel = (level - 1) * 100;
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const pct = Math.min((xpInCurrentLevel / 100) * 100, 100);
  
  const bar = document.getElementById('xpBar');
  if (bar) { 
    bar.style.width = pct + '%'; 
    bar.innerText = Math.round(pct) + '%';
  }
}

async function loadTopics() {
  // Enhanced topics with more details
  const topics = JSON.parse(localStorage.getItem('topics')||'[]');
  if (topics.length === 0) {
    // Add some sample topics
    const sampleTopics = [
      { name: 'Algebra Basics', status: 'completed', xp: 25, difficulty: 'Easy' },
      { name: 'Physics: Kinematics', status: 'in-progress', xp: 15, difficulty: 'Medium' },
      { name: 'Chemistry: Organic', status: 'pending', xp: 0, difficulty: 'Hard' }
    ];
    localStorage.setItem('topics', JSON.stringify(sampleTopics));
    loadTopics();
    return;
  }
  
  const el = document.getElementById('topicList');
  const topicCount = document.getElementById('topicCount');
  el.innerHTML = '';
  
  if (topicCount) {
    topicCount.textContent = `${topics.length} topics`;
  }
  
  topics.forEach(topic => {
    const col = document.createElement('div');
    col.className = 'col-md-6 mb-3';
    
    const statusClass = topic.status === 'completed' ? 'success' : 
                       topic.status === 'in-progress' ? 'warning' : 'secondary';
    const statusIcon = topic.status === 'completed' ? 'check-circle' : 
                      topic.status === 'in-progress' ? 'clock' : 'circle';
    
    col.innerHTML = `
      <div class="card h-100 material-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-title mb-0">${topic.name}</h6>
            <span class="badge badge-${statusClass}">
              <i class="fas fa-${statusIcon}"></i> ${topic.status}
            </span>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="fas fa-star text-warning"></i> ${topic.xp} XP
            </small>
            <small class="text-muted">
              <i class="fas fa-signal"></i> ${topic.difficulty}
            </small>
          </div>
          <div class="progress mt-2" style="height: 6px;">
            <div class="progress-bar bg-${statusClass}" style="width: ${topic.status === 'completed' ? '100' : topic.status === 'in-progress' ? '60' : '0'}%"></div>
          </div>
        </div>
      </div>
    `;
    
    el.appendChild(col);
  });
}

// Load user settings and display name
async function loadUserSettings(user) {
  try {
    const response = await fetch(`/settings/get/${user.username}`);
    const result = await response.json();
    
    let displayName = user.username;
    if (result.success && result.settings && result.settings.nickname) {
      displayName = result.settings.nickname;
      // Update local storage
      user.nickname = result.settings.nickname;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Update display with role-based colors
    const roleColors = {
      'student': 'text-success',
      'teacher': 'text-primary', 
      'monitor': 'text-warning',
      'moderator': 'text-info',
      'head': 'text-danger'
    };
    
    const roleColor = roleColors[user.role] || 'text-secondary';
    document.getElementById('userNameDisplay').innerHTML = 
      `<span class="${roleColor}">${displayName}</span> <small class="text-muted">(${user.role})</small>`;
    document.getElementById('roleName').innerText = displayName;
    
    // Update sidebar user info (ChatGPT style)
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    if (sidebarUserName) {
      sidebarUserName.textContent = displayName;
    }
    if (sidebarUserRole) {
      sidebarUserRole.textContent = user.role;
    }
    
    // Load profile photo
    loadProfilePhoto(user.username);
    
    // Setup sidebar toggle functionality
    setupSidebarToggle();
    
    // Show welcome message for new users
    if (result.success && result.settings && !result.settings.has_syllabus) {
      const welcomeMessage = document.getElementById('welcomeMessage');
      if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error loading user settings:', error);
    // Fallback to username
    document.getElementById('userNameDisplay').innerText = user.username + ' (' + user.role + ')';
    document.getElementById('roleName').innerText = user.role;
  }
}

// Load study statistics
async function loadStudyStats(user) {
  try {
    const response = await fetch(`/syllabus/stats/${user.username}`);
    const result = await response.json();
    
    if (result.success && result.stats) {
      const stats = result.stats;
      
      // Update study stats display
      const completedTopics = stats.completed_topics ? stats.completed_topics.length : 0;
      const inProgressTopics = stats.in_progress_topics ? stats.in_progress_topics.length : 0;
      const totalTopics = stats.total_topics || 0;
      
      // Update the stats display
      const studyTimeElement = document.querySelector('.stat-item:nth-child(1) .text-primary');
      const questionsElement = document.querySelector('.stat-item:nth-child(2) .text-info');
      const materialsElement = document.querySelector('.stat-item:nth-child(3) .text-success');
      const chatElement = document.querySelector('.stat-item:nth-child(4) .text-warning');
      
      if (studyTimeElement) {
        const studyHours = Math.floor((stats.study_hours || 0) / 60);
        const studyMinutes = (stats.study_hours || 0) % 60;
        studyTimeElement.textContent = `${studyHours}h ${studyMinutes}m`;
      }
      
      if (questionsElement) {
        questionsElement.textContent = completedTopics + inProgressTopics;
      }
      
      if (materialsElement) {
        // This will be updated by materials count
        materialsElement.textContent = 'Loading...';
      }
      
      if (chatElement) {
        chatElement.textContent = '0'; // Will be updated by chat stats
      }
      
      // Update topic count
      const topicCountElement = document.getElementById('topicCount');
      if (topicCountElement) {
        topicCountElement.textContent = `${totalTopics} topics`;
      }
    }
  } catch (error) {
    console.error('Error loading study stats:', error);
  }
}

// Setup sidebar toggle functionality (ChatGPT style)
function setupSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainSidebar = document.getElementById('mainSidebar');
  const contentWrapper = document.querySelector('.content-wrapper');
  
  if (sidebarToggle && mainSidebar) {
    sidebarToggle.addEventListener('click', () => {
      mainSidebar.classList.toggle('sidebar-collapsed');
      
      // Update toggle button icon
      const icon = sidebarToggle.querySelector('i');
      if (mainSidebar.classList.contains('sidebar-collapsed')) {
        icon.className = 'fas fa-chevron-right';
      } else {
        icon.className = 'fas fa-bars';
      }
      
      // Store preference in localStorage
      localStorage.setItem('sidebarCollapsed', mainSidebar.classList.contains('sidebar-collapsed'));
    });
    
    // Load saved preference
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
      mainSidebar.classList.add('sidebar-collapsed');
      const icon = sidebarToggle.querySelector('i');
      icon.className = 'fas fa-chevron-right';
    }
  }
}

// Load profile photo (ChatGPT style)
async function loadProfilePhoto(username) {
  try {
    const response = await fetch(`/profile/photo/${username}`);
    const result = await response.json();
    
    const profilePhoto = document.getElementById('sidebarProfilePhoto');
    if (profilePhoto && result.success) {
      profilePhoto.src = result.profilePhoto;
      profilePhoto.alt = username;
    }
  } catch (error) {
    console.error('Error loading profile photo:', error);
    // Generate default avatar on client side as fallback
    const profilePhoto = document.getElementById('sidebarProfilePhoto');
    if (profilePhoto) {
      profilePhoto.src = generateDefaultAvatar(username);
    }
  }
}

// Generate default avatar (client-side fallback)
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
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
