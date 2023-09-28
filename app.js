require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

if (
  !process.env.DB_CONNECTION_STRING ||
  !process.env.DB_CONNECTION_STRING.length
) {
  console.log("DB_CONNECTION_STRING is required!");
  process.exit(1);
}
const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model("User", {
  email: String,
  createdAt: Date,
  loginInfo: {
    loginCount: Number,
    lastLogin: Date,
  },
});

const Mail = mongoose.model("Mail", {
  sender: String,
  receiver: [String],
  cc: [String],
  createdAt: Date,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  const apiEndpoints = [
    {
      queryParametersForAllApis: [
        {
          name: "startDate*",
          type: "Date",
          description: "MM-DD-YYYY | MM-DD-YY",
        },
        {
          name: "endDate",
          type: "Date",
          description: "MM-DD-YYYY | MM-DD-YY",
        },
        {
          name: "limit",
          type: "Number",
        },
      ],
      endpoint: [
        "/new-users",
        "/all-login-users",
        "/old-active-users",
        "/mails-sent",
      ],
      example: `http://localhost:${port}/new-users?startDate=09-25-2022&limit=10`,
    },
  ];

  res.json(apiEndpoints);
});

app.get("/new-users", async (req, res) => {
  try {
    if (!req.query.startDate) return res.send("startDate is required");
    if (!isValidDate(new Date(req.query.startDate)))
      return res.send("invalid startDate");

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate ?? Date.now());
    if (startDate > endDate)
      return res.send("Start date is more then end date");

    let users;
    if (req.query.limit && parseInt(req.query.limit)) {
      users = await User.find({
        createdAt: { $gte: startDate, $lte: endDate },
      }).limit(parseInt(req.query.limit));
    } else {
      users = await User.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });
    }

    const result = users.map((user) => {
      return {
        email: user.email,
        loginCount: user.loginInfo.loginCount,
        createdAt: user.createdAt,
      };
    });

    res.json({ total: result.length, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/all-login-users", async (req, res) => {
  try {
    if (!req.query.startDate) return res.send("startDate is required");
    if (!isValidDate(new Date(req.query.startDate)))
      return res.send("invalid startDate");

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate ?? Date.now());
    if (startDate > endDate)
      return res.send("Start date is more then end date");

    let users;
    if (req.query.limit && parseInt(req.query.limit)) {
      users = await User.find({
        "loginInfo.lastLogin": { $gte: startDate, $lte: endDate },
      }).limit(parseInt(req.query.limit));
    } else {
      users = await User.find({
        "loginInfo.lastLogin": { $gte: startDate, $lte: endDate },
      });
    }

    const result = users.map((user) => {
      console.log();
      console.log("user.createdAt: ", user);
      return {
        email: user.email,
        loginCount: user.loginInfo.loginCount,
        createdAt: user.createdAt,
        lastLogin: user.loginInfo.lastLogin,
      };
    });

    res.json({ total: result.length, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/old-active-users", async (req, res) => {
  try {
    if (!req.query.startDate) return res.send("startDate is required");
    if (!isValidDate(new Date(req.query.startDate)))
      return res.send("invalid startDate");

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate ?? Date.now());
    if (startDate > endDate)
      return res.send("Start date is more then end date");

    let users;
    if (req.query.limit && parseInt(req.query.limit)) {
      users = await User.find({
        $and: [
          { "loginInfo.lastLogin": { $gte: startDate, $lte: endDate } },
          { createdAt: { $lte: startDate } },
        ],
      }).limit(parseInt(req.query.limit));
    } else {
      users = await User.find({
        $and: [
          { "loginInfo.lastLogin": { $gte: startDate, $lte: endDate } },
          { createdAt: { $lte: startDate } },
        ],
      });
    }

    const result = users.map((user) => {
      console.log();
      console.log("user.createdAt: ", user);
      return {
        email: user.email,
        loginCount: user.loginInfo.loginCount,
        createdAt: user.createdAt,
        lastLogin: user.loginInfo.lastLogin,
      };
    });

    res.json({ total: result.length, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

app.get("/mails-sent", async (req, res) => {
  try {
    if (!req.query.startDate) return res.send("startDate is required");
    if (!isValidDate(new Date(req.query.startDate)))
      return res.send("invalid startDate");

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate ?? Date.now());
    if (startDate > endDate)
      return res.send("Start date is more then end date");

    const aggregate = [
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: "$sender", mailsSent: { $sum: 1 } } },
      { $project: { _id: 0, sender: "$_id", mailsSent: 1 } },
    ];

    if (req.query.limit && parseInt(req.query.limit)) {
      aggregate["$limit"] = parseInt(req.query.limit);
    }
    const result = await Mail.aggregate(aggregate);

    res.json({ total: result.length, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
