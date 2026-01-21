const mongoose = require('mongoose');
require('dotenv').config();

async function fixTagIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const tagsCollection = db.collection('tags');

    // Drop the old index
    try {
      await tagsCollection.dropIndex('name_1');
      console.log('✅ Dropped old name_1 index');
    } catch (err) {
      console.log('ℹ️  Index name_1 does not exist or already dropped');
    }

    // Clear all tags to start fresh
    await tagsCollection.deleteMany({});
    console.log('✅ Cleared all existing tags');

    mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n🎯 Now run: npm run seed:tags');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTagIndex();
