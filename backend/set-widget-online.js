const mongoose = require('mongoose');
const WidgetConfig = require('./src/models/WidgetConfig');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatframe';

mongoose.connect(MONGO_URI);

async function setWidgetOnline() {
  try {
    const widget = await WidgetConfig.findOneAndUpdate(
      { widgetKey: 'cfwk_test123456789' },
      { isOnline: true },
      { new: true }
    );
    
    console.log('Widget set to online:', widget.isOnline);
  } catch (error) {
    console.error('Error setting widget online:', error);
  } finally {
    mongoose.connection.close();
  }
}

setWidgetOnline();