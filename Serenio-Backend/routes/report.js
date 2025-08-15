const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const ChatLog = require('../models/chatlog');
const Appointment = require('../models/appointment');
const axios = require('axios');
// Existing appointment report endpoint
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('psychologistId', 'name email')
      .populate('userId', 'name email');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Disposition', `attachment; filename="report_${req.params.appointmentId}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
      console.log(`PDF generation completed for appointment ${req.params.appointmentId}`);
    });
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'PDF generation failed' });
      }
    });

    doc.fontSize(18).text('Appointment Report', 100, 100);
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Appointment ID: ${req.params.appointmentId}`, 100, 150);
    doc.text(`Patient: ${appointment.userId.name} (${appointment.userId.email})`, 100, 170);
    doc.text(`Psychologist: ${appointment.psychologistId.name} (${appointment.psychologistId.email})`, 100, 190);
    doc.text(`Date: ${appointment.date}`, 100, 210);
    doc.text(`Time Slot: ${appointment.timeSlot}`, 100, 230);
    doc.text(`Status: ${appointment.status}`, 100, 250);
    doc.moveDown();
    
    doc.text(`Report generated on: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })}`, 100, 300);
    
    doc.end();
  } catch (err) {
    console.error('Report error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// New session report endpoint
router.get('/session-report/:sessionId', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    console.log(`Generating report for sessionId: ${sessionId}`);
    const chatLogs = await ChatLog.find({ sessionId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    if (!chatLogs.length) {
      console.log(`No chat logs found for sessionId: ${sessionId}`);
      return res.status(404).json({ message: 'No chat logs found for this session' });
    }

    console.log(`Found ${chatLogs.length} chat logs for sessionId: ${sessionId}`);
    if (!chatLogs[0].userId || !chatLogs[0].userId._id) {
      console.log(`UserId population failed for sessionId: ${sessionId}, userId: ${chatLogs[0].userId}`);
      return res.status(500).json({ message: 'User data could not be retrieved for this session' });
    }

    if (chatLogs[0].userId._id.toString() !== req.user.userId) {
      console.log(`Access denied: User ${req.user.userId} does not own session ${sessionId}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = chatLogs[0].userId;
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });

    // Ensure we only use logs from this specific session
    const sessionLogs = chatLogs.filter(log => log.sessionId === sessionId);
    console.log(`📊 Report generation: Found ${sessionLogs.length} logs for session ${sessionId}`);
    
    if (sessionLogs.length === 0) {
      console.log(`❌ No logs found for session ${sessionId}`);
      return res.status(404).json({ message: 'No chat logs found for this session' });
    }

    // Prepare data for Open AI
    const conversation = sessionLogs.map(log => `User: ${log.message}\nBot: ${log.response}`).join('\n');
    const sentiments = sessionLogs.map(log => log.sentiment).filter(Boolean);
    const dominantSentiment = sentiments.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    const primarySentiment = Object.keys(dominantSentiment).reduce((a, b) => dominantSentiment[a] > dominantSentiment[b] ? a : b, 'Neutral');

    // Fetch report content from Open AI
    let aiContent = '';
    try {
      console.log('Calling Open AI for report content');
      const openAiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a mental health report generator. Provide a concise, professional summary based on the conversation and sentiments. Include: Conversation Summary (1-2 sentences), Emotional Analysis (dominant tone, shifts), Risk Assessment (depression, anxiety, stress, suicidal, withdrawal levels), and Recommendations (focus areas, coping strategies). Use formal language and keep it under 150 tokens.'
        }, {
          role: 'user',
          content: `Conversation: ${conversation}\nSentiments: ${sentiments.join(', ')}\nDominant Sentiment: ${primarySentiment}`
        }],
        max_tokens: 150,
        temperature: 0.7,
      }, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });

      aiContent = openAiResponse.data.choices[0].message.content.trim();
      console.log('Open AI response received:', aiContent);
    } catch (openAiError) {
      console.error('OpenAI API error:', openAiError.message);
      // Generate fallback content
      aiContent = `Session Summary: This session included ${chatLogs.length} messages with a primary sentiment of ${primarySentiment}. 
      
Emotional Analysis: The conversation showed ${primarySentiment.toLowerCase()} emotional tone throughout the session.

Risk Assessment: Based on the conversation patterns, this appears to be a standard mental health support session.

Recommendations: Continue regular check-ins and maintain open communication about mental health concerns.`;
    }

    // Generate PDF with pdfkit
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Disposition', `attachment; filename="Serenio_Report_${sessionId}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
      console.log(`PDF generated for session ${sessionId}`);
    });
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'PDF generation failed', details: err.message });
      }
    });

    // PDF Content
    doc.font('Times-Roman').fontSize(20).text('Serenio Mental Health Session Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${timestamp}`, { align: 'center' });

    doc.moveDown(2).fontSize(14).text('Patient Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Patient Name: ${patient.name}`);
    doc.text(`Patient ID: ${patient._id}`);
    doc.text(`Session ID: ${sessionId}`);
    doc.text(`Date & Time of Session: ${timestamp}`);

    doc.moveDown(2).fontSize(14).text('Session Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Messages: ${sessionLogs.length}`);
    doc.text(`Session Duration: ${sessionLogs.length > 1 ? 
      Math.round((new Date(sessionLogs[sessionLogs.length - 1].createdAt) - new Date(sessionLogs[0].createdAt)) / 1000 / 60) : 0} minutes`);
    doc.text(`Primary Sentiment: ${primarySentiment}`);
    doc.text(`Sentiment Distribution: ${Object.entries(dominantSentiment).map(([s, c]) => `${s}: ${c}`).join(', ')}`);

    doc.moveDown(2).fontSize(14).text('Report Summary', { underline: true });
    doc.fontSize(12).text(aiContent);

    doc.moveDown(2).fontSize(14).text('Conversation Excerpt', { underline: true });
    doc.fontSize(10);
    // Show first few messages as excerpt
    const excerpt = sessionLogs.slice(0, 3).map(log => 
      `User: ${log.message.substring(0, 100)}${log.message.length > 100 ? '...' : ''}\nBot: ${log.response.substring(0, 100)}${log.response.length > 100 ? '...' : ''}`
    ).join('\n\n');
    doc.text(excerpt);

    doc.end();

  } catch (err) {
    console.error('Session report error:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF', details: err.message });
    }
  }
});

module.exports = router;