// materials.js - handles file upload and material management
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  // Load user settings and setup sidebar
  loadUserSettings(user);

  // File upload handling
  const fileInput = document.getElementById('fileInput');
  const uploadArea = document.getElementById('uploadArea');
  const uploadProgress = document.getElementById('uploadProgress');

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-primary');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-primary');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-primary');
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', user.username);

    uploadProgress.style.display = 'block';
    const progressBar = uploadProgress.querySelector('.progress-bar');

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          progressBar.style.width = progress + '%';
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              uploadProgress.style.display = 'none';
              loadMaterials();
            }, 500);
          }
        }, 100);

        // Add XP for uploading
        await addXP(user.username, 5);
        showNotification('File uploaded successfully! +5 XP', 'success');
      } else {
        showNotification('Upload failed: ' + result.message, 'error');
        uploadProgress.style.display = 'none';
      }
    } catch (error) {
      showNotification('Upload error: ' + error.message, 'error');
      uploadProgress.style.display = 'none';
    }
  }

  // Load materials
  loadMaterials();
});

async function loadMaterials() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await fetch(`/upload/materials?username=${user.username}`);
    const materials = await response.json();
    
    const materialsList = document.getElementById('materialsList');
    materialsList.innerHTML = '';

    if (materials.length === 0) {
      materialsList.innerHTML = '<div class="col-12"><p class="text-muted text-center">No materials uploaded yet. Upload your first file to get started!</p></div>';
      return;
    }

    materials.forEach(material => {
      const materialCard = createMaterialCard(material);
      materialsList.appendChild(materialCard);
    });
  } catch (error) {
    console.error('Error loading materials:', error);
    const materialsList = document.getElementById('materialsList');
    materialsList.innerHTML = '<div class="col-12"><p class="text-danger text-center">Error loading materials. Please try again.</p></div>';
  }
}

function createMaterialCard(material) {
  const col = document.createElement('div');
  col.className = 'col-md-4 mb-3';

  const fileIcon = getFileIcon(material.filename);
  const fileSize = formatFileSize(material.size);
  const uploadDate = new Date(material.uploaded_at).toLocaleDateString();

  col.innerHTML = `
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex align-items-center mb-2">
          <i class="${fileIcon} fa-2x text-primary mr-3"></i>
          <div>
            <h6 class="card-title mb-0">${material.filename}</h6>
            <small class="text-muted">${fileSize} • ${uploadDate}</small>
          </div>
        </div>
        <p class="card-text">
          <span class="badge badge-info">${material.topic || 'Unassigned'}</span>
          <span class="badge badge-secondary">${material.file_type}</span>
          <span class="badge badge-${material.difficulty === 'beginner' ? 'success' : material.difficulty === 'advanced' ? 'danger' : 'warning'}">${material.difficulty || 'intermediate'}</span>
        </p>
        ${material.subtopics && material.subtopics.length > 0 ? `
          <div class="subtopics mt-2">
            <small class="text-muted">Subtopics:</small>
            <div class="d-flex flex-wrap">
              ${material.subtopics.slice(0, 3).map(subtopic => 
                `<span class="badge badge-light mr-1 mb-1">${subtopic}</span>`
              ).join('')}
              ${material.subtopics.length > 3 ? `<span class="badge badge-light">+${material.subtopics.length - 3} more</span>` : ''}
            </div>
          </div>
        ` : ''}
        <div class="d-flex justify-content-between">
          <a href="/uploads/${material.filename}" target="_blank" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-eye"></i> View
          </a>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteMaterial('${material.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `;

  return col;
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const iconMap = {
    'pdf': 'fas fa-file-pdf',
    'doc': 'fas fa-file-word',
    'docx': 'fas fa-file-word',
    'txt': 'fas fa-file-alt',
    'jpg': 'fas fa-file-image',
    'jpeg': 'fas fa-file-image',
    'png': 'fas fa-file-image',
    'mp4': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio'
  };
  return iconMap[ext] || 'fas fa-file';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function deleteMaterial(materialId) {
  if (!confirm('Are you sure you want to delete this material?')) return;

  try {
    const response = await fetch(`/upload/delete/${materialId}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    if (result.success) {
      showNotification('Material deleted successfully', 'success');
      loadMaterials();
    } else {
      showNotification('Delete failed: ' + result.message, 'error');
    }
  } catch (error) {
    showNotification('Delete error: ' + error.message, 'error');
  }
}

function showNotification(message, type) {
  // Create notification element
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
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load user settings and setup sidebar (ChatGPT style)
async function loadUserSettings(user) {
  try {
    const response = await fetch(`/settings/get/${user.username}`);
    const result = await response.json();
    
    let displayName = user.username;
    if (result.success && result.settings && result.settings.nickname) {
      displayName = result.settings.nickname;
    }
    
    // Update sidebar user info
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
  } catch (error) {
    console.error('Error loading user settings:', error);
    // Fallback
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    if (sidebarUserName) sidebarUserName.textContent = user.username;
    if (sidebarUserRole) sidebarUserRole.textContent = user.role;
    setupSidebarToggle();
  }
}

// Setup sidebar toggle functionality (ChatGPT style)
function setupSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const mainSidebar = document.getElementById('mainSidebar');
  
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
