// ai-chat.js - handles AI chat functionality
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  const messages = document.getElementById("aiMessages");
  const input = document.getElementById("aiInput");
  const sendBtn = document.getElementById("aiSendBtn");
  const materialsCount = document.getElementById("materialsCount");
  const aiStatus = document.getElementById("aiStatus");

  // Load user materials count
  loadMaterialsCount();

  function addAIMessage(text, isUser = false, isLoading = false) {
    const div = document.createElement("div");
    div.className = `ai-message ${isUser ? 'user-message' : 'ai-message-content'} fade-in-up`;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (isLoading) {
      div.innerHTML = `
        <div class="d-flex justify-content-start">
          <div class="message-content" style="max-width: 70%;">
            <div class="d-flex align-items-center mb-1">
              <i class="fas fa-robot text-primary mr-2"></i>
              <strong class="text-primary">AI Assistant</strong>
              <small class="text-muted ml-2">${time}</small>
            </div>
            <div class="message-text">
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary mr-2" role="status">
                  <span class="sr-only">Loading...</span>
                </div>
                Thinking...
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (isUser) {
      div.innerHTML = `
        <div class="d-flex justify-content-end">
          <div class="message-content" style="max-width: 70%;">
            <div class="d-flex align-items-center mb-1">
              <small class="text-muted mr-2">${time}</small>
              <strong class="text-primary">You</strong>
            </div>
            <div class="message-text">${text}</div>
          </div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="d-flex justify-content-start">
          <div class="message-content" style="max-width: 70%;">
            <div class="d-flex align-items-center mb-1">
              <i class="fas fa-robot text-primary mr-2"></i>
              <strong class="text-primary">AI Assistant</strong>
              <small class="text-muted ml-2">${time}</small>
            </div>
            <div class="message-text">${text}</div>
          </div>
        </div>
      `;
    }
    
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function loadMaterialsCount() {
    try {
      const response = await fetch(`/upload/materials?username=${user.username}`);
      const materials = await response.json();
      materialsCount.textContent = `${materials.length} materials`;
    } catch (error) {
      console.error('Error loading materials count:', error);
    }
  }

  const sendAIMessage = async () => {
    const txt = input.value.trim();
    if (!txt) return;
    
    // Add user message
    addAIMessage(txt, true);
    input.value = '';
    
    // Add loading message
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "ai-message ai-message-content fade-in-up";
    loadingDiv.innerHTML = `
      <div class="d-flex justify-content-start">
        <div class="message-content" style="max-width: 70%;">
          <div class="d-flex align-items-center mb-1">
            <i class="fas fa-robot text-primary mr-2"></i>
            <strong class="text-primary">AI Assistant</strong>
            <small class="text-muted ml-2">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
          </div>
          <div class="message-text">
            <div class="d-flex align-items-center">
              <div class="spinner-border spinner-border-sm text-primary mr-2" role="status">
                <span class="sr-only">Loading...</span>
              </div>
              Thinking...
            </div>
          </div>
        </div>
      </div>
    `;
    messages.appendChild(loadingDiv);
    messages.scrollTop = messages.scrollHeight;
    
    try {
      // Get user materials for context
      const materialsResponse = await fetch(`/upload/materials?username=${user.username}`);
      const materials = await materialsResponse.json();
      
      const response = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: txt, 
          username: user.username,
          materials: materials
        })
      });
      
      const data = await response.json();
      
      // Remove loading message
      loadingDiv.remove();
      
      if (data.success) {
        addAIMessage(data.response, false);
        aiStatus.textContent = 'AI Ready';
        aiStatus.className = 'badge badge-success';
        
        // Award XP for asking AI questions
        await addXP(user.username, 3);
        showNotification('+3 XP for asking AI!', 'success');
      } else {
        addAIMessage('Sorry, I encountered an error. Please try again later.', false);
        aiStatus.textContent = 'AI Error';
        aiStatus.className = 'badge badge-danger';
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      loadingDiv.remove();
      addAIMessage('Sorry, I\'m having trouble connecting right now. Please try again later.', false);
      aiStatus.textContent = 'AI Offline';
      aiStatus.className = 'badge badge-warning';
    }
  };

  sendBtn.addEventListener('click', sendAIMessage);
  
  // Add Enter key support
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendAIMessage();
    }
  });
});

// Notification function
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
