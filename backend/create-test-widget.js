const mongoose = require('mongoose');
require('dotenv').config()
const WidgetConfig = require('./src/models/WidgetConfig');

// Use production MongoDB from .env
const MONGO_URI = process.env.MONGO_URI;
// Connect to MongoDB
mongoose.connect(MONGO_URI);

async function createProductionWidget() {
  try {
    // Check if production widget already exists
    const existingWidget = await WidgetConfig.findOne({ widgetKey: 'cfwk_dc3036804f3148338990' });
    
    if (existingWidget) {
      // console.log('Production widget already exists:', existingWidget);
      return existingWidget;
    }

    // Create the production widget configuration
    const productionWidget = await WidgetConfig.create({
      tenantId: 'chatframe-production',
      widgetKey: 'cfwk_dc3036804f3148338990',
      primaryColor: '#494955',
      welcomeMessage: '👋 Hi there! How can we help you today?',
      widgetPosition: 'bottom-right',
      isOnline: true,
      offlineMessage: 'We are currently offline. Leave us a message and we will get back to you.',
      companyName: 'NextGen AI Services',
      showBranding: true
    });

    // console.log('Production widget created successfully:', productionWidget);
    return productionWidget;
  } catch (error) {
    // console.error('Error creating production widget:', error);
  } finally {
    mongoose.connection.close();
  }
}

createProductionWidget();