const router = require('express').Router()
const express = require("express")
const uuid = require("uuid")
const oauthSchema = require("../schemas/SSchema");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get("/oauth/new", express.json(), (req, res) => {
  res.send(`
    <form action="/developers/oauth/new" method="POST">
      Enter the required details to add an oauth service<br><br>
      <input type="text" id="name" name="name" placeholder="Service Name"><br><br>
      <input type="text" id="scopes" name="scopes" placeholder="Scopes (s1+s2...)"><br><br>
      <input type="text" id="redirects" name="redirects" placeholder="Redirect URI (r1+r2...)"><br><br>
      <button type="submit">Submit</button>
    </form>
  `);
});

router.post("/oauth/new", express.json(), async (req, res) => {
  let body = await req.body;
  console.log(body);
  if (body.name && body.scopes && body.redirects) {
    let id = uuid.v4();
    let secret = uuid.v4();
    await new oauthSchema({
      name: body.name,
      redirects: body.redirects.split("+"),
      scopes: body.scopes.split("+"),
      id: id,
      secret: secret,
    }).save();
    res.send(`
      OAuth Service Added, details:
      <br>
      client_id: ${id}<br>
      secret: ${secret}
    `);
  } else {
    res.send("Fill out all the fields please.");
  }
});

module.exports = router