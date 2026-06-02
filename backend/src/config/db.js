const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "chatframe",
    });

    isConnected = true;


    mongoose.connection.on("disconnected", () => {
      isConnected = false;
    });

    mongoose.connection.on("error", (err) => {
      throw err;
    });
  } catch (error) {
    process.exit(1);
  }
};

module.exports = connectDB;