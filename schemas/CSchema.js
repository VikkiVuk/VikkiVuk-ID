const mongoose = require("mongoose");

const schema = mongoose.Schema({
  clientid: String,
  userid: String,
  token: String,
  scopes: Array
});

module.exports = mongoose.model("oauth-codes", schema);