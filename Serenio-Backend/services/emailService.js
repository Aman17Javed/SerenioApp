const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email templates
const emailTemplates = {
  appointmentConfirmation: (appointmentData) => ({
    subject: `Appointment Confirmation - ${appointmentData.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Appointment Confirmed!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your mental health session has been successfully booked</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">📅 Appointment Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Date:</strong>
              <span style="color: #333;">${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Time:</strong>
              <span style="color: #333;">${appointmentData.timeSlot}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Psychologist:</strong>
              <span style="color: #333;">${appointmentData.psychologistName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Specialization:</strong>
              <span style="color: #333;">${appointmentData.psychologistSpecialization}</span>
            </div>
            ${appointmentData.reason ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Reason:</strong>
              <span style="color: #333;">${appointmentData.reason}</span>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin: 0 0 10px 0;">💡 What to expect:</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>Your session will be conducted online via our secure platform</li>
              <li>Please join 5 minutes before your scheduled time</li>
              <li>Find a quiet, private space for your session</li>
              <li>Have a stable internet connection ready</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ Important Reminders:</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>You can cancel or reschedule up to 24 hours before your appointment</li>
            <li>Payment is required to confirm your booking</li>
            <li>If you need to cancel, please do so through your dashboard</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="color: #666; margin: 0;">Need help? Contact us at support@serenio.com</p>
          <p style="color: #666; margin: 5px 0 0 0;">Thank you for choosing Serenio for your mental health journey 💚</p>
        </div>
      </div>
    `
  }),
  
  appointmentCancellation: (appointmentData) => ({
    subject: `Appointment Cancelled - ${appointmentData.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">❌ Appointment Cancelled</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your appointment has been successfully cancelled</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">📅 Cancelled Appointment Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Date:</strong>
              <span style="color: #333;">${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Time:</strong>
              <span style="color: #333;">${appointmentData.timeSlot}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #666;">Psychologist:</strong>
              <span style="color: #333;">${appointmentData.psychologistName}</span>
            </div>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin: 0 0 10px 0;">💡 What's next:</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>You can book a new appointment anytime through your dashboard</li>
              <li>If you had already paid, a refund will be processed within 5-7 business days</li>
              <li>We're here to support you whenever you're ready to reschedule</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="color: #666; margin: 0;">Need to reschedule? Visit your dashboard to book a new appointment</p>
          <p style="color: #666; margin: 5px 0 0 0;">We hope to see you again soon 💚</p>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send appointment confirmation email
  sendAppointmentConfirmation: async (userEmail, appointmentData) => {
    try {
      const template = emailTemplates.appointmentConfirmation(appointmentData);
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: userEmail,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Appointment confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending appointment confirmation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send appointment cancellation email
  sendAppointmentCancellation: async (userEmail, appointmentData) => {
    try {
      const template = emailTemplates.appointmentCancellation(appointmentData);
      
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: userEmail,
        subject: template.subject,
        html: template.html
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Appointment cancellation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending appointment cancellation email:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email service
  testEmailService: async () => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: process.env.EMAIL_USER || 'your-email@gmail.com',
        subject: 'Serenio Email Service Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from Serenio.</p>'
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Test email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending test email:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService; 