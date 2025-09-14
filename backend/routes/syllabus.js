const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const db = require('../models/db');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'syllabus-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
  }
});

// Save syllabus
router.post('/save', (req, res) => {
  const { subject, level, topics, duration, username } = req.body;
  
  if (!subject || !level || !topics || !username) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  const syllabusData = {
    subject,
    level,
    topics: JSON.stringify(topics),
    duration,
    study_stats: JSON.stringify({
      completed_topics: [],
      in_progress_topics: [],
      total_topics: topics.length,
      study_hours: 0,
      last_updated: new Date().toISOString()
    })
  };
  
  // Check if user profile exists
  db.get("SELECT id FROM user_profiles WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (row) {
      // Update existing profile
      db.run(
        "UPDATE user_profiles SET syllabus = ?, study_stats = ? WHERE username = ?",
        [syllabusData.topics, syllabusData.study_stats, username],
        (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ success: true, message: 'Syllabus updated successfully' });
        }
      );
    } else {
      // Create new profile
      db.run(
        "INSERT INTO user_profiles(username, nickname, syllabus, study_stats) VALUES(?, ?, ?, ?)",
        [username, username, syllabusData.topics, syllabusData.study_stats],
        (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          res.json({ success: true, message: 'Syllabus saved successfully' });
        }
      );
    }
  });
});

// Get syllabus
router.get('/get/:username', (req, res) => {
  const username = req.params.username;
  
  db.get(
    "SELECT syllabus, study_stats FROM user_profiles WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!row) {
        return res.json({ success: true, syllabus: null });
      }
      
      try {
        const syllabus = {
          topics: JSON.parse(row.syllabus || '[]'),
          study_stats: JSON.parse(row.study_stats || '{}')
        };
        res.json({ success: true, syllabus });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.json({ success: true, syllabus: null });
      }
    }
  );
});

// Update study progress
router.post('/progress', (req, res) => {
  const { username, topic, status } = req.body;
  
  if (!username || !topic || !status) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  
  // Get current study stats
  db.get(
    "SELECT study_stats FROM user_profiles WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, message: 'User profile not found' });
      }
      
      try {
        const studyStats = JSON.parse(row.study_stats || '{}');
        
        // Update topic status
        if (status === 'completed') {
          if (!studyStats.completed_topics) studyStats.completed_topics = [];
          if (!studyStats.completed_topics.includes(topic)) {
            studyStats.completed_topics.push(topic);
          }
          // Remove from in-progress if it was there
          if (studyStats.in_progress_topics) {
            studyStats.in_progress_topics = studyStats.in_progress_topics.filter(t => t !== topic);
          }
        } else if (status === 'in-progress') {
          if (!studyStats.in_progress_topics) studyStats.in_progress_topics = [];
          if (!studyStats.in_progress_topics.includes(topic)) {
            studyStats.in_progress_topics.push(topic);
          }
          // Remove from completed if it was there
          if (studyStats.completed_topics) {
            studyStats.completed_topics = studyStats.completed_topics.filter(t => t !== topic);
          }
        }
        
        studyStats.last_updated = new Date().toISOString();
        
        // Update database
        db.run(
          "UPDATE user_profiles SET study_stats = ? WHERE username = ?",
          [JSON.stringify(studyStats), username],
          (err) => {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.json({ success: true, study_stats: studyStats });
          }
        );
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({ success: false, message: 'Data parsing error' });
      }
    }
  );
});

// Get study statistics
router.get('/stats/:username', (req, res) => {
  const username = req.params.username;
  
  db.get(
    "SELECT study_stats FROM user_profiles WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (!row) {
        return res.json({ success: true, stats: {} });
      }
      
      try {
        const stats = JSON.parse(row.study_stats || '{}');
        res.json({ success: true, stats });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.json({ success: true, stats: {} });
      }
    }
  );
});

// Analyze syllabus file with AI
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    
    // For now, we'll simulate AI analysis since we need to implement file reading
    // In a real implementation, you'd use libraries like pdf-parse for PDFs
    // and image processing libraries for images
    
    let fileContent = '';
    
    if (fileType === 'application/pdf') {
      // Simulate PDF content extraction
      fileContent = 'Mathematics 101 - Calculus and Algebra\n\nTopics:\n1. Limits and Continuity\n2. Derivatives\n3. Integration\n4. Differential Equations\n5. Linear Algebra\n6. Statistics\n\nDuration: 16 weeks\nLevel: Undergraduate';
    } else if (fileType.startsWith('image/')) {
      // Simulate image content extraction
      fileContent = 'Computer Science 201 - Data Structures\n\nTopics:\n1. Arrays and Linked Lists\n2. Stacks and Queues\n3. Trees and Graphs\n4. Sorting Algorithms\n5. Hash Tables\n6. Dynamic Programming\n\nDuration: 14 weeks\nLevel: Undergraduate';
    }

    // Use OpenAI to analyze the content
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Analyze this syllabus/course content and extract:
1. Subject name
2. Academic level (high-school, undergraduate, graduate, professional)
3. List of topics (one per line)
4. Duration in weeks

Return the response in JSON format:
{
  "subject": "Subject Name",
  "level": "academic-level",
  "topics": ["topic1", "topic2", "topic3"],
  "duration": number
}`
        },
        {
          role: "user",
          content: fileContent
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse AI response
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      analysisResult = {
        subject: "General Studies",
        level: "undergraduate",
        topics: ["Introduction", "Basic Concepts", "Advanced Topics"],
        duration: 12
      };
    }

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('File cleanup error:', err);
    });

    res.json({
      success: true,
      subject: analysisResult.subject,
      level: analysisResult.level,
      topics: analysisResult.topics,
      duration: analysisResult.duration
    });

  } catch (error) {
    console.error('Syllabus analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing file. Please try again.'
    });
  }
});

module.exports = router;
