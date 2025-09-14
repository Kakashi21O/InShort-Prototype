const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and media files are allowed.'));
    }
  }
});

// AI-powered topic assignment using OpenAI
async function assignTopicWithAI(filename, fileType, fileContent = '') {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    });

    const prompt = `Analyze this file and determine its educational subject and subtopics:
Filename: ${filename}
File Type: ${fileType}
Content Preview: ${fileContent.substring(0, 500)}

Please provide a JSON response with:
{
  "subject": "main subject (e.g., Mathematics, Physics, Computer Science)",
  "subtopics": ["subtopic1", "subtopic2", "subtopic3"],
  "difficulty": "beginner|intermediate|advanced",
  "type": "document|visual|multimedia|audio"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert at categorizing educational materials. Analyze files and provide accurate subject classification." },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0].message.content;
    const result = JSON.parse(aiResponse);
    
    return {
      subject: result.subject || 'General',
      subtopics: result.subtopics || [],
      difficulty: result.difficulty || 'intermediate',
      type: result.type || 'document',
      confidence: 0.9
    };
  } catch (error) {
    console.error('AI topic assignment error:', error);
    // Fallback to basic assignment
    return assignTopicBasic(filename, fileType);
  }
}

// Basic topic assignment (fallback)
function assignTopicBasic(filename, fileType) {
  const filename_lower = filename.toLowerCase();
  
  // Subject keywords mapping
  const subjectKeywords = {
    'mathematics': ['math', 'algebra', 'calculus', 'geometry', 'trigonometry', 'statistics', 'probability'],
    'physics': ['physics', 'mechanics', 'kinematics', 'thermodynamics', 'optics', 'electricity', 'magnetism'],
    'chemistry': ['chemistry', 'organic', 'inorganic', 'biochemistry', 'molecular', 'atomic', 'reaction'],
    'biology': ['biology', 'anatomy', 'physiology', 'genetics', 'evolution', 'ecology', 'botany', 'zoology'],
    'english': ['english', 'literature', 'grammar', 'writing', 'essay', 'poetry', 'novel'],
    'history': ['history', 'historical', 'ancient', 'medieval', 'modern', 'world', 'civilization'],
    'computer_science': ['programming', 'coding', 'computer', 'software', 'algorithm', 'data', 'structure'],
    'general': ['general', 'mixed', 'various', 'study', 'notes', 'material']
  };
  
  // File type based assignment
  const typeMapping = {
    'image': 'visual_learning',
    'video': 'multimedia',
    'audio': 'audio_learning',
    'application/pdf': 'document',
    'text': 'text_notes'
  };
  
  // Find matching subject
  for (const [subject, keywords] of Object.entries(subjectKeywords)) {
    if (keywords.some(keyword => filename_lower.includes(keyword))) {
      return {
        subject: subject,
        subtopics: [],
        difficulty: 'intermediate',
        type: typeMapping[fileType] || 'document',
        confidence: 0.7
      };
    }
  }
  
  // Default assignment
  return {
    subject: 'general',
    subtopics: [],
    difficulty: 'intermediate',
    type: typeMapping[fileType] || 'document',
    confidence: 0.5
  };
}

// Upload single file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const filename = req.file.originalname;
    const uploaded_by = req.body.username || 'unknown';
    const fileType = req.file.mimetype.split('/')[0];
    const fileSize = req.file.size;
    
    // AI topic assignment
    const topicData = await assignTopicWithAI(filename, fileType);
    
    // Save to database with enhanced data
    db.run(
      "INSERT INTO files(filename, stored_filename, topic, file_type, file_size, uploaded_by, uploaded_at, subtopics, difficulty) VALUES(?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)",
      [filename, req.file.filename, topicData.subject, fileType, fileSize, uploaded_by, JSON.stringify(topicData.subtopics), topicData.difficulty],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          // Try fallback without new columns
          db.run(
            "INSERT INTO files(filename, stored_filename, topic, file_type, file_size, uploaded_by, uploaded_at) VALUES(?, ?, ?, ?, ?, ?, datetime('now'))",
            [filename, req.file.filename, topicData.subject, fileType, fileSize, uploaded_by],
            function(err2) {
              if (err2) {
                console.error('Fallback database error:', err2);
                return res.status(500).json({ success: false, message: 'Database error' });
              }
              
              res.json({ 
                success: true, 
                topic: topicData.subject,
                subtopics: topicData.subtopics || [],
                difficulty: topicData.difficulty || 'intermediate',
                type: topicData.type,
                confidence: topicData.confidence,
                fileId: this.lastID
              });
            }
          );
          return;
        }
        
        res.json({ 
          success: true, 
          topic: topicData.subject,
          subtopics: topicData.subtopics,
          difficulty: topicData.difficulty,
          type: topicData.type,
          confidence: topicData.confidence,
          fileId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all materials for a user
router.get('/materials', (req, res) => {
  const username = req.query.username;
  
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username required' });
  }
  
  db.all(
    "SELECT id, filename, topic, file_type, file_size, uploaded_at, subtopics, difficulty FROM files WHERE uploaded_by = ? ORDER BY uploaded_at DESC",
    [username],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        // Try fallback query without new columns
        db.all(
          "SELECT id, filename, topic, file_type, file_size, uploaded_at FROM files WHERE uploaded_by = ? ORDER BY uploaded_at DESC",
          [username],
          (err2, rows2) => {
            if (err2) {
              console.error('Fallback database error:', err2);
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            const materials = rows2.map(row => ({
              ...row,
              subtopics: [],
              difficulty: 'intermediate'
            }));
            
            res.json(materials);
          }
        );
        return;
      }
      
      // Parse subtopics JSON
      const materials = rows.map(row => ({
        ...row,
        subtopics: row.subtopics ? JSON.parse(row.subtopics) : [],
        difficulty: row.difficulty || 'intermediate'
      }));
      
      res.json(materials);
    }
  );
});

// Delete material
router.delete('/delete/:id', (req, res) => {
  const fileId = req.params.id;
  
  db.get("SELECT stored_filename FROM files WHERE id = ?", [fileId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Delete file from filesystem
    const filePath = path.join('uploads', row.stored_filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('File deletion error:', err);
    });
    
    // Delete from database
    db.run("DELETE FROM files WHERE id = ?", [fileId], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      res.json({ success: true });
    });
  });
});

module.exports = router;
