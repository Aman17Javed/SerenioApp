const mongoose = require('mongoose');
const Appointment = require('./models/appointment');
require('dotenv').config();

async function testAppointmentFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test appointment model validation
    console.log('\n🧪 Testing appointment model validation...');
    
    // Test valid appointment data
    const validAppointment = new Appointment({
      userId: new mongoose.Types.ObjectId(),
      psychologistId: new mongoose.Types.ObjectId(),
      date: '2025-12-15',
      timeSlot: '10:00',
      reason: 'Test appointment',
      status: 'Booked'
    });

    try {
      await validAppointment.validate();
      console.log('✅ Valid appointment data passes validation');
    } catch (error) {
      console.log('❌ Valid appointment validation failed:', error.message);
    }

    // Test invalid date (past date)
    const invalidDateAppointment = new Appointment({
      userId: new mongoose.Types.ObjectId(),
      psychologistId: new mongoose.Types.ObjectId(),
      date: '2020-01-15',
      timeSlot: '10:00',
      reason: 'Test appointment',
      status: 'Booked'
    });

    try {
      await invalidDateAppointment.validate();
      console.log('❌ Invalid date should have failed validation');
    } catch (error) {
      console.log('✅ Invalid date correctly rejected:', error.message);
    }

    // Test invalid time slot
    const invalidTimeAppointment = new Appointment({
      userId: new mongoose.Types.ObjectId(),
      psychologistId: new mongoose.Types.ObjectId(),
      date: '2025-12-15',
      timeSlot: '20:00',
      reason: 'Test appointment',
      status: 'Booked'
    });

    try {
      await invalidTimeAppointment.validate();
      console.log('❌ Invalid time should have failed validation');
    } catch (error) {
      console.log('✅ Invalid time correctly rejected:', error.message);
    }

    console.log('\n🎉 Appointment functionality tests completed!');
    console.log('\n📋 Available appointment endpoints:');
    console.log('- POST /api/appointments/book - Book a new appointment');
    console.log('- GET /api/appointments/available-slots?psychologistId=ID&date=YYYY-MM-DD - Get available slots');
    console.log('- GET /api/appointments/my-appointments - Get user appointments');
    console.log('- PUT /api/appointments/cancel/:id - Cancel an appointment');
    console.log('- GET /api/appointments/:id - Get specific appointment');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAppointmentFunctionality(); 