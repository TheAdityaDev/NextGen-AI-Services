require('dotenv').config();
const mongoose = require('mongoose');
const WidgetConfig = require('./src/models/WidgetConfig');

const MONGO_URI = process.env.MONGO_URI;

async function createProductionWidget() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if widget already exists
    const existingWidget = await WidgetConfig.findOne({ widgetKey: 'cfwk_84e6fbc99ebd4174859a' });
    
    if (existingWidget) {
      console.log('✅ Widget already exists:');
      console.log(JSON.stringify(existingWidget, null, 2));
      return existingWidget;
    }

    // Create the production widget configuration
    const productionWidget = await WidgetConfig.create({
      tenantId: 'production-tenant',
      widgetKey: 'cfwk_84e6fbc99ebd4174859a',
      primaryColor: '#494955',
      welcomeMessage: '👋 Hi there! How can we help you today?',
      widgetPosition: 'bottom-right',
      isOnline: true,
      offlineMessage: 'We are currently offline. Leave us a message and we will get back to you.',
      companyName: 'dev Support',
      showBranding: true
    });

    console.log('✅ Production widget created successfully:');
    console.log(JSON.stringify(productionWidget, null, 2));
    return productionWidget;
  } catch (error) {
    // console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createProductionWidget();
