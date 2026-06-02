require('dotenv').config();
const mongoose = require('mongoose');
const WidgetConfig = require('./src/models/WidgetConfig');
const Tenant = require('./src/models/Tenant');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "chatframe" });
    console.log('✅ Connected to DB');
    
    const configs = await WidgetConfig.find({});
    console.log('--- Widget Configs ---');
    console.log(JSON.stringify(configs, null, 2));

    const tenants = await Tenant.find({});
    console.log('--- Tenants ---');
    console.log(JSON.stringify(tenants, null, 2));

    const Ticket = require('./src/models/Ticket').Ticket || require('./src/models/Ticket');
    const Message = require('./src/models/Message');

    const tickets = await Ticket.find({});
    console.log('--- All Tickets ---');
    console.log(JSON.stringify(tickets, null, 2));

    const messages = await Message.find({});
    console.log('--- All Messages ---');
    console.log(JSON.stringify(messages, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

check();
