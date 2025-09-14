// chat.js - uses socket.io
const socket = io();

const messages = document.getElementById("messages");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, who, isOwn = false) {
  const div = document.createElement("div");
  div.className = `message ${isOwn ? 'own' : ''} fade-in-up`;
  
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isCurrentUser = who === user.username;
  
  div.innerHTML = `
    <div class="d-flex ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}">
      <div class="message-content" style="max-width: 70%;">
        <div class="d-flex align-items-center mb-1">
          <strong class="text-primary">${who || 'Anonymous'}</strong>
          <small class="text-muted ml-2">${time}</small>
        </div>
        <div class="message-text">${text}</div>
      </div>
    </div>
  `;
  
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!sendBtn) return;
  const user = JSON.parse(localStorage.getItem('user')||'{}');
  
  // Update user level display
  document.getElementById('userLevel').textContent = `Level ${user.level || 1}`;
  
  // Show/hide level chat button based on level
  const levelChatBtn = document.getElementById('levelChatBtn');
  if (user.level < 30) {
    levelChatBtn.style.display = 'none';
  }
  
  // Current chat room
  let currentRoom = 'global';
  
  // Join global room by default
  socket.emit('joinRoom', 'global');
  
  // Load chat history
  loadChatHistory('global');
  
  // Chat room switching
  document.getElementById('globalChatBtn').addEventListener('click', () => {
    switchToRoom('global');
  });
  
  document.getElementById('levelChatBtn').addEventListener('click', () => {
    const level = user.level || 1;
    if (level >= 30) {
      switchToRoom(`level-${level}`);
    } else {
      showNotification('You need to be at least Level 30 to access Level Chat!', 'warning');
    }
  });
  
  const sendMessage = async () => {
    const txt = input.value.trim();
    if (!txt) return;
    
    const user = JSON.parse(localStorage.getItem('user')||'{}');
    const payload = { room: currentRoom, sender:user.username, message: txt };
    
    // Add message immediately for better UX
    addMessage(txt, user.username, true);
    input.value='';
    
    // Send to server
    socket.emit('message', payload);
    await fetch('/chat/save', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify(payload) 
    });
    
    // Award XP for asking questions (if message contains ?)
    if (txt.includes('?')) {
      await addXP(user.username, 2);
      showNotification('+2 XP for asking a question!', 'success');
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  
  // Add Enter key support
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Update online count (simplified)
  let onlineCount = 1;
  document.getElementById('onlineCount').textContent = `${onlineCount} online`;
  
  // Simulate online count updates
  setInterval(() => {
    onlineCount = Math.max(1, onlineCount + Math.floor(Math.random() * 3) - 1);
    document.getElementById('onlineCount').textContent = `${onlineCount} online`;
  }, 10000);
});

socket.on('message', (data) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Only add message if it's not from current user (to avoid duplicates)
  if (data.sender !== user.username) {
    addMessage(data.message, data.sender, false);
  }
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

// Room switching functions
function switchToRoom(room) {
  currentRoom = room;
  
  // Update UI
  document.getElementById('globalChatBtn').classList.toggle('active', room === 'global');
  document.getElementById('levelChatBtn').classList.toggle('active', room.startsWith('level-'));
  
  // Leave current room and join new room
  socket.emit('leaveRoom', currentRoom);
  socket.emit('joinRoom', room);
  
  // Clear messages and load new history
  messages.innerHTML = '';
  loadChatHistory(room);
  
  // Update room indicator
  const roomName = room === 'global' ? 'Global Chat' : `Level ${room.split('-')[1]} Chat`;
  showNotification(`Switched to ${roomName}`, 'info');
}

function loadChatHistory(room) {
  fetch(`/chat/${room}`).then(r=>r.json()).then(rows=>{
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    rows.forEach(rw=> addMessage(rw.message, rw.sender, rw.sender === user.username));
  }).catch(err => {
    console.error('Error loading chat history:', err);
    // If level room doesn't exist, show empty state
    if (room.startsWith('level-')) {
      messages.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-users fa-3x mb-3"></i><p>No messages in this level chat yet. Be the first to start a conversation!</p></div>';
    }
  });
}
