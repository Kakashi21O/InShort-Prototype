# 📚 InShort Prototype

> **OpenAI Academy x NxtWave Buildathon Project**  
> An interactive learning management system that combines **role-based dashboards**, **XP gamification**, **real-time chat**, and **file sharing** in one platform.

---

## 🚀 Features

- 🔑 **User Authentication**
  - Role-based accounts: **Student, Monitor, Teacher, Moderator, Head**
  - Predefined demo accounts for testing

- 📊 **Gamification**
  - XP & Level system to encourage engagement
  - Custom role-based dashboards

- 💬 **Real-time Chat**
  - Powered by **Socket.IO**
  - Room-based communication

- 📂 **File Upload & Sharing**
  - Upload & share study resources
  - Organize files with topic tags

- 🎨 **Frontend (AdminLTE v3)**
  - Responsive **login page**
  - Interactive **dashboards**
  - Clean **chat interface**

---

## 📂 Project Structure

```
InShort-Prototype/
│
├── backend/                 # Node.js + Express + SQLite backend
│   ├── models/              # Database models
│   ├── routes/              # Authentication, upload, chat, XP routes
│   ├── server.js            # Main server file
│   └── db.sqlite            # SQLite database
│
├── frontend/                # AdminLTE-based frontend
│   ├── index.html           # Login page
│   ├── dashboard.html       # Role-based dashboard
│   ├── chat.html            # Real-time chat page
│   ├── js/                  # Custom JS scripts
│   └── css/                 # Custom stylesheets
│
└── README.md                # Project documentation
```

---

## ⚙️ Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/InShort-Prototype.git
   cd InShort-Prototype/backend
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Run the server**
   ```sh
   npm start
   ```

   Server will run on 👉 [http://localhost:3000](http://localhost:3000)

4. **Open the frontend**
   - Navigate to `frontend/index.html` in your browser
   - Login using demo credentials

---

## 🔑 Demo Accounts

| Role       | Username   | Password   |
|------------|-----------|-----------|
| Student    | student1  | student1  |
| Monitor    | monitor1  | monitor1  |
| Teacher    | teacher1  | teacher1  |
| Moderator  | moderator1| moderator1|
| Head       | head1     | head1     |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, SQLite3, Multer, Socket.IO  
- **Frontend**: HTML5, CSS3, AdminLTE v3, Vanilla JS  
- **Other Tools**: XP Gamification, Real-time chat

---

## 📌 Future Improvements

✅ AI-powered study recommendations  
✅ Improved UI for chat & dashboard  
✅ JWT-based authentication  
✅ Cloud deployment (Heroku / Vercel)  

---

## 🤝 Contributing

Pull requests are welcome!  
For major changes, please open an **issue** first to discuss your ideas.

---

### 👨‍💻 Author
**Mantu Yadav**
