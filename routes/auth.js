const router = require('express').Router()
const express = require("express")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fido2 = require("@simplewebauthn/server")
const profileSchema = require("../schemas/PSchema.js")
const uuid = require('uuid')
const speakeasy = require('speakeasy')
const qrcode = require('qrcode')

router.post("/change-status", express.json(), async(req, res) => {
  try {
    let body = await req.body
    const user = await profileSchema.findOne({ "account.jwtToken": body.jwt })
    const method = body.method
    let enable = body.enable
    
    if (method == "authenticator-app") {
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.security.authenticator.isEnabled": enable })
    } else if (method == "onetap-auth") {
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.security.onetap.isEnabled": enable })
    } else if (method == "email") {
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.security.email": enable })
    } else if (method == "share_storage_data") {
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.analytics.share_storage_data": enable })
    } else if (method == "usage_statistics") {
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.analytics.usage_statistics": enable })
    }
    
    res.send("Success")
  } catch(e) {
    res.status(500).json({error: e})
  }
})

router.post("/authenticator-app", express.json(), async(req, res) => {
  try {
    let body = await req.body
    const user = await profileSchema.findOne({ "account.jwtToken": body.jwt })

    let secret;
    let isEnabled = false;
    if (user.account.security) {
      if (user.account.security.authenticator) {
        secret = user.account.security.authenticator.secret
        isEnabled = user.account.security.authenticator.isEnabled || false
      }
    }

    if (secret == undefined) {
      secret = await speakeasy.generateSecret({ name: "VikkiAcc: " + user.profile.username })
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.security.authenticator.secret": secret, "account.security.authenticator.isEnabled": false })
    }

    await qrcode.toDataURL(secret.otpauth_url, function(err, data_url) {
      res.send({qrcode: data_url, isEnabled: isEnabled})
    })
  } catch(e) {
    console.log(e)
    res.status(500).json({qrcode: "https://play.teleporthq.io/static/svg/default-img.svg", isEnabled: false, error: e})
  }
})

router.post("/securitykey", express.json(), async(req, res) => {
    let body = await req.body
    let credential = JSON.parse(body.credential)
    const expectedOrigin = "https://id.vikkivuk.xyz";
    const expectedRPID = "id.vikkivuk.xyz";
    const user = await profileSchema.findOne({ "account.jwtToken": body.jwt })
    const challenge = user.account.security.keys.currentChallenge

    try {
      const verification = await fido2.verifyRegistrationResponse({
        credential: credential,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID
      });

      const { verified, registrationInfo } = verification;
      if (!verified) {
        return res.status(400).json({ error: "User verification failed" });
      }
      
      if (!body.name) {
        return res.status(400).json({ error: "No name provided!" })
      }
      
      const { credentialPublicKey, credentialID } = registrationInfo;
      const newCredential = {
        publicKey: credentialPublicKey,
        credId: credentialID,
        name: body.name,
        creationDate: Date.now()
      };
      
      let keys = user.account.security.keys
      for (const bruh in keys) {
        if (keys[bruh].publicKey == newCredential.publicKey) {
          return res.status(400).json({ error: "Key already registered!" });
        }
      }
      
      keys[body.name] = newCredential
      
      await profileSchema.updateOne({ "account.jwtToken": body.jwt }, {$set: {"account.security.keys": keys}})
      res.send("Success")
    } catch (e) {
      console.log(e.message)
      res.status(400).json({ error: e.message });
    }
})

router.post("/securitykey-options", express.json(), async (req, res) => {
    try {
      let body = await req.body
      let jwt = body.jwt
      let user = await profileSchema.findOne({ "account.jwtToken": jwt })
      
      const excludeCredentials = [];
      let challenge;
      
      if (user.account.security) {
        for (const cred in user.account.security.keys) {
          if (cred == "currentChallenge") {
            //challenge = user.account.security.keys.currentChallenge
          } else {
            let key = user.account.security.keys[cred]
          }
        }
      }
      
      const options = fido2.generateRegistrationOptions({
        rpName: "VikkiVuk ID",
        rpID: "id.vikkivuk.xyz",
        userID: user.id,
        userName: user.profile.username,
        excludeCredentials,
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform",
          residentKey: "preferred",
          requireResidentKey: false,
          userVerification: "preferred"
        }
      });
      
      await profileSchema.updateOne({ "account.jwtToken": jwt }, { "account.security.keys.currentChallenge": options.challenge})
      res.status(200).send(options);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

router.post("/securitykey-remove", express.json(), async (req, res) => {
    try {
      let body = await req.body
      let jwt = body.jwt
      let user = await profileSchema.findOne({ "account.jwtToken": jwt })
      let keys = user.account.security.keys
      delete keys[body.name]
      
      await profileSchema.updateOne({ "account.jwtToken": jwt }, { $set: {"account.security.keys": keys}})
      res.status(200).send();
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

module.exports = router