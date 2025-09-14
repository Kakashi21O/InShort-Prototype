// settings.js - handles user settings and profile management
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  // Load current settings
  loadUserSettings();

  // Setup profile photo upload
  setupProfilePhotoUpload();

  // Handle form submission
  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nickname = document.getElementById('nickname').value.trim();
    
    if (!nickname) {
      showNotification('Please enter a display name', 'error');
      return;
    }
    
    try {
      const response = await fetch('/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: user.username,
          nickname: nickname
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local storage
        user.nickname = nickname;
        localStorage.setItem('user', JSON.stringify(user));
        
        showNotification('Settings saved successfully!', 'success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showNotification('Error saving settings: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('Error saving settings. Please try again.', 'error');
    }
  });
});

async function loadUserSettings() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Set current values
    document.getElementById('currentUsername').value = user.username;
    document.getElementById('role').value = user.role;
    document.getElementById('nickname').value = user.nickname || user.username;
    
    // Try to load from server
    const response = await fetch(`/settings/get/${user.username}`);
    const result = await response.json();
    
    if (result.success && result.settings) {
      const settings = result.settings;
      document.getElementById('nickname').value = settings.nickname || user.username;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
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

// Setup profile photo upload
function setupProfilePhotoUpload() {
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const currentProfilePhoto = document.getElementById('currentProfilePhoto');
  const removePhotoBtn = document.getElementById('removePhotoBtn');

  // Load current profile photo
  loadCurrentProfilePhoto();

  // Handle file selection
  profilePhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadProfilePhoto(file);
    }
  });

  // Handle remove photo
  removePhotoBtn.addEventListener('click', () => {
    removeProfilePhoto();
  });
}

// Load current profile photo
async function loadCurrentProfilePhoto() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await fetch(`/profile/photo/${user.username}`);
    const result = await response.json();
    
    const currentProfilePhoto = document.getElementById('currentProfilePhoto');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    
    if (result.success) {
      currentProfilePhoto.src = result.profilePhoto;
      if (!result.isDefault) {
        removePhotoBtn.style.display = 'inline-block';
      }
    }
  } catch (error) {
    console.error('Error loading profile photo:', error);
    // Generate default avatar
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentProfilePhoto = document.getElementById('currentProfilePhoto');
    if (currentProfilePhoto) {
      currentProfilePhoto.src = generateDefaultAvatar(user.username);
    }
  }
}

// Upload profile photo
async function uploadProfilePhoto(file) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    showNotification('Please select an image file', 'error');
    return;
  }

  // Validate file size (2MB limit)
  if (file.size > 2 * 1024 * 1024) {
    showNotification('File size must be less than 2MB', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('profilePhoto', file);
  formData.append('username', user.username);

  try {
    const response = await fetch('/profile/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      // Update the displayed photo
      const currentProfilePhoto = document.getElementById('currentProfilePhoto');
      const removePhotoBtn = document.getElementById('removePhotoBtn');
      
      currentProfilePhoto.src = result.profilePhoto;
      removePhotoBtn.style.display = 'inline-block';
      
      showNotification('Profile photo updated successfully!', 'success');
      
      // Update sidebar photo
      const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
      if (sidebarPhoto) {
        sidebarPhoto.src = result.profilePhoto;
      }
    } else {
      showNotification('Error uploading photo: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    showNotification('Error uploading photo. Please try again.', 'error');
  }
}

// Remove profile photo
async function removeProfilePhoto() {
  if (!confirm('Are you sure you want to remove your profile photo?')) {
    return;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // For now, we'll just show the default avatar
    // In a real implementation, you'd call a delete endpoint
    const currentProfilePhoto = document.getElementById('currentProfilePhoto');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    
    currentProfilePhoto.src = generateDefaultAvatar(user.username);
    removePhotoBtn.style.display = 'none';
    
    showNotification('Profile photo removed', 'success');
    
    // Update sidebar photo
    const sidebarPhoto = document.getElementById('sidebarProfilePhoto');
    if (sidebarPhoto) {
      sidebarPhoto.src = generateDefaultAvatar(user.username);
    }
  } catch (error) {
    console.error('Error removing profile photo:', error);
    showNotification('Error removing photo. Please try again.', 'error');
  }
}

// Generate default avatar (client-side)
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
    <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="${backgroundColor}"/>
      <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" fill="white">${firstLetter}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
