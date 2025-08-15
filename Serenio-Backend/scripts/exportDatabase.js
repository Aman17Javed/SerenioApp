require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import all your models
const User = require('../models/user');
const Psychologist = require('../models/psychologist');
const Appointment = require('../models/appointment');
const MoodLog = require('../models/moodlog');
const ChatLog = require('../models/chatlog');
const Feedback = require('../models/feedback');
const Payment = require('../models/payment');
const Transaction = require('../models/transaction');
const Recommendation = require('../models/recommendation');

async function exportDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create export directory
    const exportDir = path.join(__dirname, '../database_export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export each collection
    const collections = [
      { name: 'users', model: User },
      { name: 'psychologists', model: Psychologist },
      { name: 'appointments', model: Appointment },
      { name: 'moodlogs', model: MoodLog },
      { name: 'chatlogs', model: ChatLog },
      { name: 'feedbacks', model: Feedback },
      { name: 'payments', model: Payment },
      { name: 'transactions', model: Transaction },
      { name: 'recommendations', model: Recommendation }
    ];

    // Object to store all data for the comprehensive dump
    const completeDatabase = {
      exportDate: new Date().toISOString(),
      databaseName: 'serenio_database',
      collections: {}
    };

    for (const collection of collections) {
      try {
        console.log(`📤 Exporting ${collection.name}...`);
        const data = await collection.model.find({});
        
        // Save individual file
        const filePath = path.join(exportDir, `${collection.name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        // Add to comprehensive database object
        completeDatabase.collections[collection.name] = {
          count: data.length,
          data: data
        };
        
        console.log(`✅ Exported ${data.length} ${collection.name} to ${filePath}`);
      } catch (error) {
        console.error(`❌ Error exporting ${collection.name}:`, error.message);
      }
    }

    // Save the complete database dump
    const completeDumpPath = path.join(exportDir, 'complete_database_dump.json');
    fs.writeFileSync(completeDumpPath, JSON.stringify(completeDatabase, null, 2));
    console.log(`\n📦 Complete database dump saved to: ${completeDumpPath}`);

    // Create a summary file
    const summary = {
      exportDate: completeDatabase.exportDate,
      totalCollections: Object.keys(completeDatabase.collections).length,
      collectionSummary: Object.keys(completeDatabase.collections).map(name => ({
        collection: name,
        recordCount: completeDatabase.collections[name].count
      })),
      totalRecords: Object.values(completeDatabase.collections).reduce((sum, col) => sum + col.count, 0)
    };

    const summaryPath = path.join(exportDir, 'export_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Export summary saved to: ${summaryPath}`);

    console.log(`\n🎉 Database export completed! Check the 'database_export' folder in your backend directory.`);
    console.log(`📁 Export location: ${exportDir}`);
    console.log(`📦 Complete dump: complete_database_dump.json`);
    console.log(`📊 Summary: export_summary.json`);

  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the export
exportDatabase(); 