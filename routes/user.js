const router = require('express').Router()
const express = require("express")
const mail = require("@sendgrid/mail");
mail.setApiKey(process.env.sendgrid_api);
const profileSchema = require("../schemas/PSchema");
const bcrypt = require("bcrypt");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs')

router.post("/delete-jwt", express.json(), async(req, res) => {
  let body = await req.body;
  try {
    let user = await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { "account.jwtToken": "INVALID" })
    res.send({ msg: "Success", code: 200 })
  } catch(e) {
    res.status(500).send({ msg: "Internal Server Error", code: 500})
  }
})

router.post("/verify-email", express.json(), async(req, res) => {
    let body = await req.body;

    try {
        if (!profileSchema.findOne({ id: body.uuid })) {
            res.status(400).send({ msg: "Token is invalid.", code: 400 });
            return;
        }
        const code = body.code;

        let user = await profileSchema.findOne({ id: body.uuid });
        let corCode = user.account.corCode;
        if (corCode == code) {
            await profileSchema.updateOne(
                { id: body.uuid },
                { $set: { "account.corCode": "INVALID", "account.verified": true } }
            );
            res
                .status(200)
                .send({ msg: "Code is correct!", code: 200, token: user.id });
        } else {
            res.status(401).send({ msg: "Code is incorrect", code: 401 });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
})
router.post("/authorize", express.json(), async(req, res) => {
    let body = await req.body;

    if (req.user) {
        let callback = await req.query.callback;
        if (callback) {
            let user = await req.user;
            if (await bcrypt.compare(req.body.password, user.password)) {
                let showID = await req.body.idOnly;
                let userid = user.toJSON().id;
                let params = new URLSearchParams();
                params.append("uuid", userid);

                if (callback.includes("https") || callback.includes("http")) {
                    let url = new URL(callback);
                    url.search = params;

                    res.redirect(url);
                } else {
                    let url = new URL("http://" + callback);
                    url.search = params;

                    res.redirect(url);
                }
            } else {
                res.redirect(req.url);
            }
        } else {
            res.send("No callback/redirectUrl, please go back to the site.");
        }
    } else {
        res.redirect("/login?goto=/authorize?callback=" + req.query.callback);
    }
})
router.post("/reset-password", express.json(), async(req, res) => {
    let body = await req.body;

    try {
        const email = await body.email;

        let user = await profileSchema.findOne({ email: email });
        if (user) {
            let passwordRT = await bcrypt.hash(
                "reset-password+" + email + "+" + user.password,
                10
            );
            await profileSchema.updateOne(
                { email: email },
                { $set: { "account.passwordResetToken": passwordRT } }
            );
            const msg = {
                to: email,
                from: "no-reply@vikkivuk.xyz",
                subject: "Password Reset",
                text:
                    "You or someone else may have requested a password reset, go to this link to reset the password https://accounts.vikkivuk.xyz/password/change-password.html?token=" +
                    passwordRT,
            };

            mail.send(msg);
            res
                .status(200)
                .send({ msg: "Link Sent!", code: 200, token: user.uuid });
        } else {
            res.status(404).send({ msg: "User not found!", code: 404 });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
})
router.post("/change-password", express.json(), async(req, res) => {
    let body = await req.body;

    try {
        const password = await body.password;
        const token = await body.token;

        if (token == "INVALID") {
            res.status(404).send({ msg: "User not found!", code: 404 });
        } else {
            let user = await profileSchema.findOne({
                "account.passwordResetToken": token,
            });
            let hashedPassword = await bcrypt.hash(password, 10);
            if (user) {
                await profileSchema.updateOne(
                    { "account.passwordResetToken": token },
                    {
                        $set: { "account.passwordResetToken": "INVALID" },
                        password: hashedPassword,
                    }
                );
                const msg = {
                    to: user.email,
                    from: "no-reply@vikkivuk.xyz",
                    subject: "Account Update",
                    text: "Hello, It seems that you or someone else has changed the password on your VikkiVuk Account, if this wasn't you please change your password or contact customer support.",
                };

                mail.send(msg);
                res.status(200).send({ msg: "Password changed!", code: 200 });
            } else {
                res.status(404).send({ msg: "User not found!", code: 404 });
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
})
router.post("/jwtGet", express.json(), async(req, res) => {
    let body = await req.body;
    let jwt = await body.jwt;
    if (jwt) {
        if (jwt !== "INVALID") {
            let user = await profileSchema.findOne({ "account.jwtToken": jwt });
            if (user) {
                res.status(200).send(user);
            } else {
                res.status(404).send({ msg: "User not found!", code: 404 });
            }
        } else {
            res.status(404).send({ msg: "User not found!", code: 404 });
        }
    } else {
        res.status(404).send({ msg: "User not found!", code: 404 });
    }
})

module.exports = router