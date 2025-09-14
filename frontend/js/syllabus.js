// syllabus.js - handles syllabus setup and management
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  // Load existing syllabus if available
  loadExistingSyllabus();

  // Handle PDF upload
  setupSyllabusUpload();

  // Handle form submission
  document.getElementById('syllabusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const subject = document.getElementById('subject').value.trim();
    const level = document.getElementById('level').value;
    const topicsText = document.getElementById('topics').value.trim();
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!subject || !level || !topicsText) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    const topics = topicsText.split('\n')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
    
    if (topics.length === 0) {
      showNotification('Please enter at least one topic', 'error');
      return;
    }
    
    const syllabusData = {
      subject,
      level,
      topics,
      duration,
      username: user.username
    };
    
    try {
      const response = await fetch('/syllabus/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syllabusData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Syllabus saved successfully!', 'success');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showNotification('Error saving syllabus: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('Error saving syllabus:', error);
      showNotification('Error saving syllabus. Please try again.', 'error');
    }
  });
});

async function loadExistingSyllabus() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await fetch(`/syllabus/get/${user.username}`);
    const result = await response.json();
    
    if (result.success && result.syllabus) {
      const syllabus = result.syllabus;
      document.getElementById('subject').value = syllabus.subject || '';
      document.getElementById('level').value = syllabus.level || '';
      document.getElementById('topics').value = syllabus.topics ? syllabus.topics.join('\n') : '';
      document.getElementById('duration').value = syllabus.duration || 12;
      
      // Update form title
      document.querySelector('.card-title').innerHTML = '<i class="fas fa-graduation-cap"></i> Update Your Syllabus';
    }
  } catch (error) {
    console.error('Error loading existing syllabus:', error);
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

// Setup syllabus PDF upload
function setupSyllabusUpload() {
  const fileInput = document.getElementById('syllabusFileInput');
  const uploadArea = document.getElementById('syllabusUploadArea');
  const uploadProgress = document.getElementById('syllabusUploadProgress');

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
    if (files.length > 0) {
      handleSyllabusFile(files[0]);
    }
  });

  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleSyllabusFile(e.target.files[0]);
    }
  });
}

async function handleSyllabusFile(file) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    showNotification('Please upload a PDF or image file', 'error');
    return;
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('File size must be less than 10MB', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('username', user.username);

  uploadProgress.style.display = 'block';
  const progressBar = uploadProgress.querySelector('.progress-bar');

  try {
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      progressBar.style.width = progress + '%';
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);

    const response = await fetch('/syllabus/analyze', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    clearInterval(interval);
    progressBar.style.width = '100%';

    if (result.success) {
      // Auto-fill form with AI-generated data
      document.getElementById('subject').value = result.subject || '';
      document.getElementById('level').value = result.level || '';
      document.getElementById('topics').value = result.topics ? result.topics.join('\n') : '';
      document.getElementById('duration').value = result.duration || 12;
      
      showNotification('Syllabus analyzed successfully! Please review and save.', 'success');
      
      setTimeout(() => {
        uploadProgress.style.display = 'none';
        progressBar.style.width = '0%';
      }, 2000);
    } else {
      showNotification('Error analyzing file: ' + result.message, 'error');
      uploadProgress.style.display = 'none';
    }
  } catch (error) {
    console.error('Error uploading syllabus file:', error);
    showNotification('Error uploading file. Please try again.', 'error');
    uploadProgress.style.display = 'none';
  }
}
