require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

let server;

if (
  !process.env.DB_CONNECTION_STRING ||
  !process.env.DB_CONNECTION_STRING.length
) {
  console.error("DB_CONNECTION_STRING is required!");
  process.exit(1);
}
const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const routes = require("./routes");

app.use(routes);

mongoose.connection.on("connected", () => {
  console.log("DB connected");
  server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.error("Database connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Database disconnected");
});

process.on("SIGINT", async () => {
  if (server) {
    server.close(async () => {
      console.log("Express server closed");
      if (mongoose.connection.readyState === 1) {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed");
        } catch (err) {
          console.error("Error closing MongoDB connection:", err);
        }
      }
      process.exit(0);
    });
  }
});
