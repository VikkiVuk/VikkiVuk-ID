const router = require('express').Router()
const express = require("express")
const mail = require("@sendgrid/mail");mail.setApiKey(process.env.sendgrid_api);
const uuid = require("uuid");
const profileSchema = require("../schemas/PSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.get("/", express.json(), async (req, res) => {
  res.sendFile("/app/webpages/home.html");
});

router.post("/login", express.json(), async (req, res, next) => {
    let body = await req.body;
    if (body.password && body.email) {
        let user = await profileSchema.findOne({ email: body.email });
        if (user) {
            let truePass = await bcrypt.compare(body.password, user.password);
            if (truePass) {
                if (user.account.verified == true) {
                    let jwtToken = jwt.sign(
                        { alg: "HS256", typ: "JWT", secret: "vikkivuk-accounts-jwting" },
                        JSON.stringify({
                            iss: "vikkivuk-accounts",
                            name: user.name,
                            email: user.email,
                            isHuman: true,
                        })
                    );
                    await profileSchema.updateOne(
                        { email: body.email },
                        { $set: { "account.jwtToken": jwtToken } }
                    );
                    res.status(200).send({
                        msg: "User found, password correct.",
                        code: 200,
                        jwtToken: jwtToken,
                    });
                } else {
                    res.status(400).send({
                        msg: "Account is still awaiting verification.",
                        code: 400,
                    });
                }
            } else {
                res
                    .status(403)
                    .send({ msg: "User found, password incorrect.", code: 403 });
            }
        } else {
            res.status(404).send({ msg: "User not found!", code: 404 });
        }
    } else {
        res.status(400).send({ msg: "Missing Fields!", code: 400 });
    }
});

router.post("/register", express.json(), async (req, res, next) => {
    try {
        let body = await req.body;
        if (await profileSchema.findOne({ email: body.email })) {
            res.status(409).send({ msg: "Email already taken!", code: 409 });
            return;
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        let uuidd = uuid.v4();
        let code = Math.round(Math.random() * 999999);
        const msg = {
            to: req.body.email,
            from: "hello@vikkivuk.xyz",
            subject: "Your VikkiVuk Account.",
            text:
                "Hello, it seems like you made an account @ VikkiVuk, if this wasnt you dont worry, you can safely ignore this email. If this was you please enter this code: " +
                code,
        };

        mail.send(msg);

        await new profileSchema({
            id: uuidd,
            email: body.email,
            password: hashedPassword,
            account: {
                verified: false,
                corCode: code,
                passwordResetToken: "INVALID",
                jwtToken: "INVALID",
                analytics: {
                  share_storage_data: true,
                  usage_statistics: true
                }
            },
            profile: {
                name: body.name,
                birthday: new Date(body.birthday),
                username: body.email,
            },
        }).save();
        res
            .status(200)
            .send({ msg: "User has been registered!", code: 200, token: uuidd });
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
});

module.exports = router