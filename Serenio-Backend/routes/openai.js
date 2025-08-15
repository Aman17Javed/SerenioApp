    const express = require('express');
    const router = express.Router();
    const authenticateToken = require('../middleware/authMiddleware');
    const { OpenAI } = require('openai');
    require('dotenv').config();

// 🔑 Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in .env
});

router.post('/sentiment', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;
    
    const systemPrompt = `You are an expert mental health analyst and sentiment analysis specialist. 
    Analyze the conversation and provide a comprehensive analysis in the following JSON format:
    
    {
      "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
      "confidence": 0.85,
      "emotions": {
        "joy": 0.3,
        "sadness": 0.1,
        "anger": 0.05,
        "fear": 0.1,
        "surprise": 0.05,
        "neutral": 0.4
      },
      "topics": [
        {"topic": "Mental Health", "confidence": 0.9},
        {"topic": "Relationships", "confidence": 0.7}
      ],
      "recommendation": "A single, actionable recommendation based on the analysis",
      "insights": [
        "Key insight 1 about the conversation",
        "Key insight 2 about emotional patterns",
        "Key insight 3 about topics discussed"
      ],
      "risk_level": "LOW|MEDIUM|HIGH",
      "suggested_actions": [
        "Specific action item 1",
        "Specific action item 2"
      ]
    }
    
    Focus on mental health context and provide empathetic, actionable insights.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    
    try {
      // Try to parse as JSON first
      const analysis = JSON.parse(content);
      res.status(200).json(analysis);
    } catch (parseError) {
      // Fallback to simple sentiment if JSON parsing fails
      const lines = content.split("\n").filter(line => line.trim());
      const sentiment = lines.find(line => line.toLowerCase().includes("sentiment"))?.split(":")[1]?.trim() || "NEUTRAL";
      const recommendation = lines.find(line => line.toLowerCase().includes("recommendation"))?.split(":")[1]?.trim() || "No recommendation available.";
      
      res.status(200).json({ 
        sentiment, 
        recommendation,
        confidence: 0.7,
        emotions: {
          joy: 0.2,
          sadness: 0.2,
          anger: 0.1,
          fear: 0.1,
          surprise: 0.1,
          neutral: 0.3
        },
        topics: [],
        insights: ["Analysis completed with basic sentiment detection"],
        risk_level: "LOW",
        suggested_actions: ["Consider starting a new conversation for more detailed analysis"]
      });
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      message: 'Error analyzing sentiment', 
      error: error.message,
      sentiment: "NEUTRAL",
      recommendation: "Unable to analyze at this time. Please try again.",
      confidence: 0.0,
      emotions: {
        joy: 0.0,
        sadness: 0.0,
        anger: 0.0,
        fear: 0.0,
        surprise: 0.0,
        neutral: 1.0
      },
      topics: [],
      insights: ["Analysis failed due to technical issues"],
      risk_level: "UNKNOWN",
      suggested_actions: ["Please try again later"]
    });
  }
});

// New endpoint for detailed conversation analysis
router.post('/conversation-analysis', authenticateToken, async (req, res) => {
  try {
    const { messages, sessionId } = req.body;
    
    const systemPrompt = `You are a mental health conversation analyst. Analyze this conversation and provide detailed insights about:
    
    1. Emotional progression throughout the conversation
    2. Key topics and themes discussed
    3. Potential mental health indicators
    4. Communication patterns
    5. Suggestions for follow-up actions
    
    Provide your analysis in a structured, empathetic format that would be helpful for both the user and mental health professionals.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    res.status(200).json({
      analysis: response.choices[0].message.content,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Conversation Analysis Error:', error);
    res.status(500).json({ 
      message: 'Error analyzing conversation', 
      error: error.message 
    });
  }
});

// New endpoint for emotion tracking over time
router.post('/emotion-timeline', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;
    
    const systemPrompt = `Analyze the emotional progression throughout this conversation. 
    For each message, identify the primary emotion and intensity level (0-1).
    Return a JSON array of objects with: message_index, emotion, intensity, and timestamp.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content;
    
    try {
      const timeline = JSON.parse(content);
      res.status(200).json(timeline);
    } catch (parseError) {
      // Fallback timeline
      const timeline = messages.map((msg, index) => ({
        message_index: index,
        emotion: "neutral",
        intensity: 0.5,
        timestamp: new Date().toISOString()
      }));
      res.status(200).json(timeline);
    }
  } catch (error) {
    console.error('Emotion Timeline Error:', error);
    res.status(500).json({ 
      message: 'Error generating emotion timeline', 
      error: error.message 
    });
  }
});

module.exports = router;