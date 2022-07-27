const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session")
const MongoStore = require('connect-mongo');
const app = express();
let mongopath = process.env.mongopath;

mongoose.connect(mongopath, {keepAlive: true, useNewUrlParser: true, useUnifiedTopology: true});
app.use(session({
  secret: 'kurac cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
  store: MongoStore.create({mongoUrl: mongopath, autoRemove: 'native', ttl: 1 * 24 * 60 * 60, dbName: "sessions"})
}))
app.use(express.static(__dirname + "/webpages/dashboard"));
app.use(express.static(__dirname + "/webpages"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

app.use("/", require("./routes/main"))
app.use("/auth", require("./routes/auth"))
app.use("/user", require("./routes/user"))
app.use("/api", require("./routes/api"))
app.use("/connections", require("./routes/connections"))
app.use("/developers", require("./routes/developers"))
app.use("/payments", require("./routes/payments"))
app.use("/personalization", require("./routes/personalization"))
app.use("/r", require("./routes/r"))

app.listen(process.env.PORT || 5000, () => console.log(`>>> Server online`));
