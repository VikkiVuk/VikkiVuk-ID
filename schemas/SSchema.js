const mongoose = require("mongoose");

const schema = mongoose.Schema({
  id: String,
  secret: String,
  name: String,
  scopes: Array,
  redirects: Array
});

module.exports = mongoose.model("oauth-apps", schema);