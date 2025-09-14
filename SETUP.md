# InShort - AI-Powered Study Platform

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. OpenAI API Setup

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set the environment variable:

**Windows:**
```cmd
set OPENAI_API_KEY=your-api-key-here
```

**Linux/Mac:**
```bash
export OPENAI_API_KEY=your-api-key-here
```

### 3. Start the Server

```bash
cd backend
node server.js
```

The application will be available at `http://localhost:3000`

### 4. Default Login Credentials

- **Student:** `student1` / `student1`
- **Teacher:** `teacher1` / `teacher1`
- **Monitor:** `monitor1` / `monitor1`
- **Moderator:** `moderator1` / `moderator1`
- **Head:** `head1` / `head1`

## Features

### ✅ Fixed Issues
- **Materials Loading:** Fixed error loading materials
- **Chat Duplicates:** Fixed duplicate message display in chat
- **Message Persistence:** Messages now persist correctly

### 🚀 New Features

#### 1. AI Study Assistant
- OpenAI GPT-3.5 integration for doubt resolution
- Context-aware responses based on uploaded materials
- Real-time chat interface with loading indicators
- XP rewards for asking AI questions

#### 2. Syllabus Tracking
- Personal syllabus setup for students
- Topic progress tracking (completed, in-progress, pending)
- Study statistics and analytics
- Personalized study recommendations

#### 3. Enhanced User Experience
- **Nickname System:** Students can set display names
- **Role-based UI:** Different colors and styling for each role
- **Settings Page:** Manage profile and preferences
- **Modern Sidebar:** Attractive, animated navigation

#### 4. Improved Dashboard
- Real-time study statistics
- Syllabus-based progress tracking
- Welcome messages for new users
- Enhanced visual design

## Project Structure

```
InShort-Prototype/
├── backend/
│   ├── routes/
│   │   ├── ai.js          # OpenAI integration
│   │   ├── syllabus.js    # Syllabus management
│   │   └── settings.js    # User settings
│   ├── models/
│   │   └── db.js          # Database schema
│   └── server.js          # Main server file
├── frontend/
│   ├── ai-chat.html       # AI Assistant page
│   ├── syllabus.html      # Syllabus setup
│   ├── settings.html      # User settings
│   └── js/
│       ├── ai-chat.js     # AI chat functionality
│       ├── syllabus.js    # Syllabus management
│       └── settings.js    # Settings management
└── README.md
```

## API Endpoints

### AI Assistant
- `POST /ai/chat` - Send message to AI
- `GET /ai/history/:username` - Get AI conversation history

### Syllabus
- `POST /syllabus/save` - Save user syllabus
- `GET /syllabus/get/:username` - Get user syllabus
- `POST /syllabus/progress` - Update topic progress
- `GET /syllabus/stats/:username` - Get study statistics

### Settings
- `POST /settings/update` - Update user settings
- `GET /settings/get/:username` - Get user settings

## Database Schema

### New Tables
- `ai_conversations` - AI chat history
- `user_profiles` - User settings and syllabus data

## Technologies Used

- **Backend:** Node.js, Express.js, SQLite
- **Frontend:** HTML5, CSS3, JavaScript, AdminLTE
- **AI:** OpenAI GPT-3.5-turbo
- **Real-time:** Socket.io
- **Styling:** Bootstrap 4, Custom CSS

## For OpenAI Academy x NxtWave Buildathon

This project demonstrates:
- AI integration for educational purposes
- Student progress tracking
- Collaborative learning features
- Modern, responsive UI/UX
- Role-based access control
- Real-time communication

## Notes

- Make sure to set your OpenAI API key before using AI features
- The AI assistant works best when students have uploaded materials
- All user data is stored locally in SQLite database
- The platform supports multiple user roles with different permissions
