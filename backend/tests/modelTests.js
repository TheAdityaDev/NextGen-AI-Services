/**
 * ChatFrame Model Unit Test Suite
 * Runs validations, hook triggers, and constraints on all 10 schemas.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

// Import models
const { User } = require("../src/models/User");
const { Ticket } = require("../src/models/Ticket");
const Message = require("../src/models/Message");
const AIConfig = require("../src/models/AIConfig");
const CSAT = require("../src/models/CSAT");
const FAQ = require("../src/models/FAQ");
const { Notification } = require("../src/models/Notification");
const SupportConfig = require("../src/models/SupportConfig");
const Tenant = require("../src/models/Tenant");
const WidgetConfig = require("../src/models/WidgetConfig");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/chatframe_test";

async function runTests() {
  console.log("🚀 Starting Model Test Suite...");
  console.log(`Connecting to: ${MONGO_URI.substring(0, 50)}...`);

  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to database.\n");

  // Keep track of test IDs to clean up
  const testUsers = [];
  const testTickets = [];
  const testMessages = [];
  const testConfigs = [];
  const testCSATs = [];
  const testFAQs = [];
  const testNotifications = [];
  const testSupportConfigs = [];
  const testTenants = [];
  const testWidgetConfigs = [];

  try {
    const tenantId = "test_tenant_" + Date.now();

    // ────────────────────────────────────────────────────────────────
    // 1. USER MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("1. Testing User Model...");
    
    // Test validation: invalid email
    try {
      await User.create({
        firstName: "Alice",
        lastName: "Smith",
        email: "invalid-email",
        password: "password123",
        tenantId,
      });
      assert.fail("Should have failed on invalid email format");
    } catch (err) {
      assert.ok(err.errors.email, "Expected validation error on email field");
    }

    // Test validation: short password
    try {
      await User.create({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@test.com",
        password: "short",
        tenantId,
      });
      assert.fail("Should have failed on short password");
    } catch (err) {
      assert.ok(err.errors.password, "Expected validation error on password length");
    }

    // Test success & password hashing
    const user = await User.create({
      firstName: "Bob",
      lastName: "Builder",
      email: `bob-${Date.now()}@test.com`,
      password: "securePassword123",
      role: "company_admin",
      tenantId,
    });
    testUsers.push(user._id);
    assert.strictEqual(user.firstName, "Bob");
    assert.strictEqual(user.fullName, "Bob Builder"); // Virtual check
    assert.notStrictEqual(user.password, "securePassword123", "Password should be hashed");
    
    // Compare password check
    const isMatch = await user.comparePassword("securePassword123");
    assert.ok(isMatch, "Password comparison failed");
    console.log("   ✅ User validation & password hashing verified.");

    // ────────────────────────────────────────────────────────────────
    // 2. TENANT MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("2. Testing Tenant Model...");
    const tenant = await Tenant.create({
      tenantId,
      companyName: "Test Corporation",
      inviteCode: "TEST-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdBy: user._id, // Tenant requires createdBy
    });
    testTenants.push(tenant._id);
    assert.strictEqual(tenant.companyName, "Test Corporation");
    assert.ok(tenant.inviteCode);
    console.log("   ✅ Tenant created successfully.");

    // ────────────────────────────────────────────────────────────────
    // 3. TICKET MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("3. Testing Ticket Model...");
    
    // Create first ticket
    const ticket1 = await Ticket.create({
      tenantId,
      title: "First Issue",
      description: "My login does not work.",
      status: "open",
      priority: "high",
      customerName: "John Doe",
      customerEmail: "john@doe.com",
    });
    testTickets.push(ticket1._id);
    assert.ok(ticket1.ticketNumber, "Ticket number should be generated");
    assert.strictEqual(ticket1.ticketNumber, 1001, "First ticket number should start at 1001");

    // Create second ticket to verify auto-increment
    const ticket2 = await Ticket.create({
      tenantId,
      title: "Second Issue",
      description: "Broken checkout.",
      status: "open",
      priority: "urgent",
      customerName: "Jane Doe",
    });
    testTickets.push(ticket2._id);
    assert.strictEqual(ticket2.ticketNumber, 1002, "Second ticket should increment to 1002");
    console.log("   ✅ Ticket pre-save auto-increment verified.");

    // ────────────────────────────────────────────────────────────────
    // 4. MESSAGE MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("4. Testing Message Model...");
    
    // Save customer message
    const msgCustomer = await Message.create({
      tenantId,
      ticketId: ticket1._id,
      senderType: "customer",
      content: "Hello, please help!",
    });
    testMessages.push(msgCustomer._id);
    assert.strictEqual(msgCustomer.senderType, "customer");
    assert.strictEqual(msgCustomer.isRead, false);

    // Save agent message
    const msgAgent = await Message.create({
      tenantId,
      ticketId: ticket1._id,
      senderId: user._id,
      senderType: "agent",
      content: "Sure, let me check that.",
    });
    testMessages.push(msgAgent._id);
    assert.strictEqual(msgAgent.senderType, "agent");
    console.log("   ✅ Message schema & references verified.");

    // ────────────────────────────────────────────────────────────────
    // 5. AI CONFIG MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("5. Testing AIConfig Model...");
    const aiConfig = await AIConfig.create({
      tenantId,
      isEnabled: true,
      confidenceThreshold: 0.8,
      responseTone: "friendly",
    });
    testConfigs.push(aiConfig._id);
    assert.strictEqual(aiConfig.confidenceThreshold, 0.8);
    assert.strictEqual(aiConfig.responseTone, "friendly");
    console.log("   ✅ AIConfig settings validated.");

    // ────────────────────────────────────────────────────────────────
    // 6. CSAT MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("6. Testing CSAT Model...");
    
    // Test negative CSAT calculation (Rating <= 2 is negative)
    const csat1 = await CSAT.create({
      tenantId,
      ticketId: ticket1._id,
      rating: 2,
      feedback: "Bad service",
      agentId: user._id,
    });
    testCSATs.push(csat1._id);
    assert.strictEqual(csat1.isNegative, true, "Rating of 2 should flag as negative");

    // Test positive CSAT calculation (Rating > 2 is positive)
    const csat2 = await CSAT.create({
      tenantId,
      ticketId: ticket2._id,
      rating: 5,
      feedback: "Amazing!",
      agentId: user._id,
    });
    testCSATs.push(csat2._id);
    assert.strictEqual(csat2.isNegative, false, "Rating of 5 should NOT flag as negative");
    console.log("   ✅ CSAT bounds & pre-save hook verified.");

    // ────────────────────────────────────────────────────────────────
    // 7. FAQ MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("7. Testing FAQ Model...");
    const faq = await FAQ.create({
      tenantId,
      question: "How do I reset my password?",
      answer: "Click on forgot password link on the login page.",
      category: "Account",
    });
    testFAQs.push(faq._id);
    assert.strictEqual(faq.isActive, true, "Default isActive should be true");
    assert.strictEqual(faq.aiUsageCount, 0, "Default aiUsageCount should be 0");
    console.log("   ✅ FAQ schema validated successfully.");

    // ────────────────────────────────────────────────────────────────
    // 8. NOTIFICATION MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("8. Testing Notification Model...");
    const notification = await Notification.create({
      tenantId,
      userId: user._id,
      type: "ticket_assigned",
      title: "New Ticket Assigned",
      message: "Ticket #1001 has been assigned to you.",
      metadata: { ticketId: ticket1._id },
    });
    testNotifications.push(notification._id);
    assert.strictEqual(notification.isRead, false, "Default isRead should be false");
    console.log("   ✅ Notification model validated successfully.");

    // ────────────────────────────────────────────────────────────────
    // 9. SUPPORT CONFIG MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("9. Testing SupportConfig Model...");
    const supportConfig = await SupportConfig.create({
      tenantId,
      supportHoursOpen: "09:00",
      supportHoursClose: "18:00",
      timezone: "EST",
    });
    testSupportConfigs.push(supportConfig._id);
    assert.strictEqual(supportConfig.supportHoursOpen, "09:00");
    assert.strictEqual(supportConfig.supportHoursClose, "18:00");
    console.log("   ✅ SupportConfig schema validated successfully.");

    // ────────────────────────────────────────────────────────────────
    // 10. WIDGET CONFIG MODEL TESTS
    // ────────────────────────────────────────────────────────────────
    console.log("10. Testing WidgetConfig Model...");
    const widgetConfig = await WidgetConfig.create({
      tenantId,
      primaryColor: "#FF5733",
      headerText: "Need Help?",
      isOnline: true,
    });
    testWidgetConfigs.push(widgetConfig._id);
    assert.strictEqual(widgetConfig.primaryColor, "#FF5733");
    console.log("   ✅ WidgetConfig schema validated successfully.");

    console.log("\n🎉 ALL 10 MODELS PASSED SCHEMA VALIDATIONS!");

  } catch (error) {
    console.error("\n❌ Test Suite Failed:", error);
    process.exitCode = 1;
  } finally {
    // ────────────────────────────────────────────────────────────────
    // CLEAN UP TEST RECORDS
    // ────────────────────────────────────────────────────────────────
    console.log("\n🧹 Cleaning up test records...");
    await Promise.all([
      User.deleteMany({ _id: { $in: testUsers } }),
      Ticket.deleteMany({ _id: { $in: testTickets } }),
      Message.deleteMany({ _id: { $in: testMessages } }),
      AIConfig.deleteMany({ _id: { $in: testConfigs } }),
      CSAT.deleteMany({ _id: { $in: testCSATs } }),
      FAQ.deleteMany({ _id: { $in: testFAQs } }),
      Notification.deleteMany({ _id: { $in: testNotifications } }),
      SupportConfig.deleteMany({ _id: { $in: testSupportConfigs } }),
      Tenant.deleteMany({ _id: { $in: testTenants } }),
      WidgetConfig.deleteMany({ _id: { $in: testWidgetConfigs } }),
    ]);
    console.log("🧹 Cleanup complete.");
    
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database.");
  }
}

runTests();
