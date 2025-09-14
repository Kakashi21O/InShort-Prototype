const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const xpRoutes = require('./routes/xp');
const emergencyRoutes = require('./routes/emergency');
const aiRoutes = require('./routes/ai');
const syllabusRoutes = require('./routes/syllabus');
const settingsRoutes = require('./routes/settings');
const profileRoutes = require('./routes/profile');

app.use(bodyParser.json());
app.use(cors());

// API routes
app.use('/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);
app.use('/xp', xpRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/ai', aiRoutes);
app.use('/syllabus', syllabusRoutes);
app.use('/settings', settingsRoutes);
app.use('/profile', profileRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinRoom', (room) => {
    socket.leaveAll();
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('leaveRoom', (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });
  
  socket.on('message', (data) => {
    io.to(data.room).emit('message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
