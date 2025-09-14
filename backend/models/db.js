const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    stored_filename TEXT,
    topic TEXT,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtopics TEXT,
    difficulty TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT,
    sender TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    user_message TEXT,
    ai_response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    nickname TEXT,
    profile_photo TEXT,
    syllabus TEXT,
    study_stats TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  const users = [
    {username:'student1', password:'student1', role:'student'},
    {username:'monitor1', password:'monitor1', role:'monitor'},
    {username:'teacher1', password:'teacher1', role:'teacher'},
    {username:'moderator1', password:'moderator1', role:'moderator'},
    {username:'head1', password:'head1', role:'head'}
  ];
  users.forEach(u => {
    db.run("INSERT OR IGNORE INTO users(username,password,role) VALUES(?,?,?)",[u.username,u.password,u.role]);
  });
});

module.exports = db;
