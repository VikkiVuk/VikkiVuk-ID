const router = require('express').Router()
const express = require("express")
const profileSchema = require("../schemas/PSchema");
const codeSchema = require("../schemas/CSchema");
const oauthSchema = require("../schemas/SSchema");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.use("/getUser", express.json(), async(req, res) => {
    let id = await req.path.split("/")[1];
    if (id) {
        let user = await profileSchema.findOne({ id: id });
        if (user) {
            let sendObject = {
                uuid: user.id,
                email: user.email,
                profile: user.profile
            }

            res.send(sendObject);
        } else {
            res.sendStatus(404);
        }
    } else {
        res.status(400).send({ message: "Invalid request path", status: 400 });
    }
})
router.use("/cards", express.json(), async (req, res) => {
    let td = await req.path.split("/")[1];
    if (td == "add") {
        let query = await req.query;
        if (query.auth == "bruhstagledasovomrshodbij") {
            await profileSchema.updateOne(
                { id: query.uuid },
                {
                    $set: {
                        "account.wallet.card": {
                            number: query.num,
                            exp: query.expires,
                            cvc: query.cvc,
                        },
                    },
                }
            );
            res.status(200).send({ message: "Card added." });
        } else {
            res.sendStatus(401);
        }
    } else if (td == "hasCard") {
        let query = await req.query;
        let user = await profileSchema.findOne({ id: query.id });
        if (user) {
            if (user.account.wallet.card) {
                res.status(200).send({ hasCard: true });
            } else {
                res.status(200).send({ hasCard: false });
            }
        } else {
            res.status(404).send({ message: "The user does not exist." });
        }
    }
})
router.use("/exchange_token", express.json(), async (req, res) => {
    if (req.method !== "POST") {
        res.status(409).send({message:"Method not supported", statuscode: 409})
    } else {
        let token = await req.body.token
        let clientsecret = await req.body.secret
        let clientid = await req.body.client_id

        if (token && clientsecret && clientid) {
            let ccs = await codeSchema.findOne({ token: token, clientid: clientid })
            if (ccs) {
                let service = await oauthSchema.findOne({ id: clientid })
                if (service) {
                    if (clientsecret == service.secret) {
                        res.status(200).send({message:"Success", statuscode: 200, uuid: ccs.userid})
                    } else {
                        res.status(400).send({message:"Bad Request", statuscode: 400})
                    }
                } else {
                    res.status(400).send({message:"Bad Request", statuscode: 400})
                }
            } else {
                res.status(400).send({message:"Bad Request", statuscode: 400})
            }
        } else {
            res.status(400).send({message:"Bad Request", statuscode: 400})
        }
    }
})

module.exports = router