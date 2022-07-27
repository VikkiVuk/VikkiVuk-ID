const router = require('express').Router()
const express = require("express")
const mail = require("@sendgrid/mail");mail.setApiKey(process.env.sendgrid_api);
const profileSchema = require("../schemas/PSchema");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.post("/account-settings", express.json(), async(req, res) => {
    let body = await req.body;

    try {
        let username = body.username;
        let email = body.email;
        let bday = body.bday;
        let gender = body.gender;

        let token = body.jwt;

        if (username && email && bday && gender) {
            await profileSchema.updateOne(
                { "account.jwtToken": token },
                {
                    $set: {
                        "profile.username": username,
                        "profile.birthday": new Date(bday),
                        "profile.gender": gender,
                    },
                    email: email,
                }
            );
            res.status(200).send({ msg: "Saved", code: 200 });
        } else {
            res.status(400).send({ msg: "Fields missing", code: 400 });
        }
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
})
router.post("/profile", async(req, res) => {
    let body = await req.body;
    try {
        let color = body.profileColor;
        let about = body.aboutme;
        let token = body.jwt;
        await profileSchema.updateOne(
            { "account.jwtToken": token },
            { $set: { "profile.color": color, "profile.about": about } }
        );
        res.status(200).send({ msg: "Saved", code: 200 });
    } catch (e) {
        console.error(e);
        res.status(500).send({ msg: "Internal Server Error", code: 500 });
    }
})

module.exports = router