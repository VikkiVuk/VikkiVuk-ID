const router = require('express').Router()
const express = require("express")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get("/home", express.json(), async (req, res) => {
  if ((await req.query.check) == "true") {
    res.redirect("/dashboard/my-account.html");
  } else {
    res.redirect("/");
  }
});

module.exports = router