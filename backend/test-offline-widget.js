const mongoose = require('mongoose');
const WidgetConfig = require('./src/models/WidgetConfig');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatframe');

async function setWidgetOffline() {
  try {
    const widget = await WidgetConfig.findOneAndUpdate(
      { widgetKey: 'cfwk_test123456789' },
      { isOnline: false },
      { new: true }
    );
    
    console.log('Widget set to offline:', widget);
  } catch (error) {
    console.error('Error setting widget offline:', error);
  } finally {
    mongoose.connection.close();
  }
}

setWidgetOffline();