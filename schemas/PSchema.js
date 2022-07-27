const mongoose = require("mongoose");

const pschema = mongoose.Schema({
  id: String,
  email: String,
  password: String,
  account: Object,
  profile: Object,
  connections: Object
});

module.exports = mongoose.model("users", pschema);
