const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const db = require('../models/db');

// Initialize OpenAI (you'll need to set OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// AI Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, username, materials } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Get user's materials for context
    const userMaterials = materials || await getUserMaterials(username);
    
    // Create context from materials
    const materialsContext = userMaterials.map(m => 
      `Topic: ${m.topic}, Type: ${m.file_type}, Filename: ${m.filename}`
    ).join('\n');

    // Create system prompt for educational AI assistant
    const systemPrompt = `You are an AI study assistant for InShort, an educational platform. 
    Your role is to help students with their academic questions based on their uploaded materials.
    
    Student's Materials Context:
    ${materialsContext}
    
    Guidelines:
    1. Provide clear, educational explanations
    2. Reference their materials when relevant
    3. Encourage critical thinking
    4. Be supportive and encouraging
    5. If you don't have enough context, ask for clarification
    6. Suggest related topics from their materials
    7. Keep responses concise but comprehensive
    8. Use examples when helpful
    
    Respond as a helpful study assistant.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    // Save the conversation to database
    await saveAIConversation(username, message, aiResponse);

    res.json({ 
      success: true, 
      response: aiResponse,
      materials_referenced: userMaterials.length
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'AI service temporarily unavailable. Please try again later.' 
    });
  }
});

// Get AI conversation history
router.get('/history/:username', (req, res) => {
  const username = req.params.username;
  
  db.all(
    "SELECT * FROM ai_conversations WHERE username = ? ORDER BY timestamp DESC LIMIT 20",
    [username],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Helper function to get user materials
async function getUserMaterials(username) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT filename, topic, file_type FROM files WHERE uploaded_by = ? ORDER BY uploaded_at DESC LIMIT 10",
      [username],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Helper function to save AI conversation
async function saveAIConversation(username, userMessage, aiResponse) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO ai_conversations(username, user_message, ai_response, timestamp) VALUES(?, ?, ?, datetime('now'))",
      [username, userMessage, aiResponse],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

module.exports = router;
