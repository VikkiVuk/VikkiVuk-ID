require("dotenv").config({ path: "./.env" })
const express = require("express");
const mongoose = require("mongoose");
const app = express();
let mongopath = process.env.MONGOPATH;

mongoose.connect(mongopath, {keepAlive: true, useNewUrlParser: true, useUnifiedTopology: true});

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
