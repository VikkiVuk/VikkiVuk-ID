const router = require('express').Router()
const express = require("express")
const profileSchema = require("../schemas/PSchema");
const SteamAuth = require("node-steam-openid");
const bcrypt = require("bcrypt");
const oauthSchema = require("../schemas/SSchema");
const uuid = require("uuid");
const codeSchema = require("../schemas/CSchema");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.use("/", express.json(), async (req, res) => {
    let service = req.path.split("/")[1];
    let path = req.path.split("/")[2];
    let body = await req.body;

    if (service == "facebook") {
        try {
            await profileSchema.updateOne(
                { "account.jwtToken": body.jwt },
                {
                    $set: {
                        "connections.facebook": {
                            name: body.name,
                            id: body.id,
                            appicon:
                                "https://www.socialmediabutterflyblog.com/wp-content/uploads/sites/567/2021/01/Facebook-logo-500x350-1.png",
                        },
                    },
                }
            );
            res.status(200).send({ msg: "Saved", code: 200 });
        } catch (e) {
            res.status(500).send({ msg: "Internal Server Error", code: 500 });
        }
    } else if (service == "github") {
        try {
            if (path == "callback") {
                let code = await req.query.code;
                let nres = await fetch("https://github.com/login/oauth/access_token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        client_id: "da3e1df049fa4a8a931a",
                        client_secret: "94f180852be5f2f2947fb13c941ae7d729da7e9e",
                        code: code,
                    }),
                });
                let njson = await nres.json();
                let jwt = await req.query.state;
                let at = await njson.access_token;

                let ndres = await fetch("https://api.github.com/user", {
                    method: "GET",
                    headers: { Authorization: "token " + at },
                });
                let loga = await ndres.json();

                await profileSchema.updateOne(
                    { "account.jwtToken": jwt },
                    {
                        $set: {
                            "connections.github": {
                                name: loga.login,
                                id: loga.id,
                                appicon:
                                    "https://cdn.glitch.global/ff3fc2c0-c60a-47f0-a6a1-d1932dbc2a03/github.png?v=1652550848213",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            }
        } catch (e) {
            res.sendStatus(500);
        }
    } else if (service == "reddit") {
        try {
            if (path == "callback") {
                let code = await req.query.code;
                let nres = await fetch("https://www.reddit.com/api/v1/access_token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Authorization: `Basic ${btoa(
                            unescape(
                                encodeURIComponent(
                                    "wsMh_rtkmOE3YjLbaiBdAg" +
                                    ":" +
                                    "4_Dt3HYP-CnnvDKU_qwMHMIC_AvZZg"
                                )
                            )
                        )}`,
                    },
                    body: `grant_type=authorization_code&code=${code}&redirect_uri=https://accounts.vikkivuk.xyz/connections/reddit/callback`,
                });

                let njson = await nres.json();
                let jwt = await req.query.state;
                let at = await njson.access_token;

                let ndres = await fetch("https://oauth.reddit.com/api/v1/me", {
                    method: "GET",
                    headers: { Authorization: "bearer " + at },
                });
                let loga = await ndres.json();

                await profileSchema.updateOne(
                    { "account.jwtToken": jwt },
                    {
                        $set: {
                            "connections.reddit": {
                                name: loga.name,
                                id: loga.id,
                                appicon:
                                    "https://www.iconpacks.net/icons/2/free-reddit-logo-icon-2436-thumb.png",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            }
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    } else if (service == "steam") {
        try {
            const steam = new SteamAuth({
                realm: "https://accounts.vikkivuk.xyz",
                returnUrl:
                    "https://accounts.vikkivuk.xyz/connections/steam/callback?jwt=" +
                    (await req.query.jwt),
                apiKey: "339A551B10175DC8FCB9FBA021A45BD7",
            });

            if (path == "callback") {
                const user = await steam.authenticate(req);
                const q = await req.query;
                const jwt = q.jwt;

                await profileSchema.updateOne(
                    { "account.jwtToken": jwt },
                    {
                        $set: {
                            "connections.steam": {
                                name: user.username,
                                id: user.steamid,
                                appicon:
                                    "https://cdn.glitch.global/ff3fc2c0-c60a-47f0-a6a1-d1932dbc2a03/steam.png?v=1652550856148",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            } else {
                res.redirect(await steam.getRedirectUrl());
            }
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    } else if (service == "google") {
        try {
            if (path == "callback") {
                let code = await req.query.code;
                let nres = await fetch("https://oauth2.googleapis.com/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `code=${code}&client_id=435554639611-veb22lbqgkcaf40bmrfqo29qv4psf0si.apps.googleusercontent.com&client_secret=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&redirect_uri=https://id.vikkivuk.xyz/connections/google/callback&grant_type=authorization_code`,
                });

                let njson = await nres.json();

                let ndres = await fetch(
                    "https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2CbrandingSettings&mine=true&key=AIzaSyAADZHWdLvCS3UUMzom7X_Pe-OmNill6Co",
                    {
                        method: "GET",
                        headers: { Authorization: "Bearer " + njson.access_token },
                    }
                );

                let loga = await ndres.json();

                await profileSchema.updateOne(
                    { "account.jwtToken": await req.query.state },
                    {
                        $set: {
                            "connections.youtube": {
                                name: loga["items"][0]["snippet"]["title"],
                                id: loga["items"][0]["id"],
                                appicon:
                                    "https://cdn.glitch.global/ff3fc2c0-c60a-47f0-a6a1-d1932dbc2a03/youtube.png?v=1652550860224",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            }
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    } else if (service == "twitch") {
        try {
            if (path == "callback") {
                let code = await req.query.code;
                let nres = await fetch("https://id.twitch.tv/oauth2/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `client_id=o93fsppxqbsfoefl0oaep323mlqn5l&client_secret=43qxj7t3ll1eop4aokc63nq5u54fqs&&code=${code}&grant_type=authorization_code&redirect_uri=https://accounts.vikkivuk.xyz/connections/twitch/callback`,
                });

                let njson = await nres.json();

                let ndres = await fetch("https://id.twitch.tv/oauth2/userinfo", {
                    method: "GET",
                    headers: { Authorization: "Bearer " + njson.access_token },
                });

                let loga = await ndres.json();

                await profileSchema.updateOne(
                    { "account.jwtToken": await req.query.state },
                    {
                        $set: {
                            "connections.twitch": {
                                name: loga["preferred_username"],
                                id: loga["sub"],
                                appicon:
                                    "https://cdn.glitch.global/ff3fc2c0-c60a-47f0-a6a1-d1932dbc2a03/twitch.png?v=1652550942504",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            }
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    } else if (service == "discord") {
        try {
            if (path == "callback") {
                let code = await req.query.code;
                let nres = await fetch("https://discord.com/api/oauth2/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `client_id=975161504703840258&client_secret=kC1qt1p5cK8OyeoQkOdp4mB-CnRMdGGZ&&code=${code}&grant_type=authorization_code&redirect_uri=https://accounts.vikkivuk.xyz/connections/discord/callback`,
                });

                let njson = await nres.json();

                let ndres = await fetch("https://discord.com/api/users/@me", {
                    method: "GET",
                    headers: { Authorization: "Bearer " + njson.access_token },
                });

                let loga = await ndres.json();

                await profileSchema.updateOne(
                    { "account.jwtToken": await req.query.state },
                    {
                        $set: {
                            "connections.discord": {
                                name: loga["username"],
                                id: loga["id"],
                                appicon:
                                    "https://cdn.glitch.global/ff3fc2c0-c60a-47f0-a6a1-d1932dbc2a03/discord.png?v=1652550843864",
                            },
                        },
                    }
                );

                res.redirect("../../dashboard/connections.html");
            }
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    } else if (service == "authorize") {
        let user = await profileSchema.findOne({ "account.jwtToken": body.jwt });
        if (user) {
            if (await bcrypt.compare(body.password, user.password)) {
                let service = await oauthSchema.findOne({
                    id: body["service[client_id]"],
                });
                if (service) {
                    let token = uuid.v4()
                    await new codeSchema({ clientid: body["service[client_id]"], userid: user.id, token: token, scopes: body["service[scopes]"]}).save()
                    if (!user.connections.authorized_apps) {
                        await profileSchema.updateOne({ "account.jwtToken": body.jwt }, {$set: {"connections.authorized_apps": [{id: service.id,name: service.name,picture: "placeholder",},],},});
                        res.status(200).send({msg: "Server-side Authorization Complete",statuscode: 200,code: token});
                    } else {
                        user.connections.authorized_apps.forEach(async(i, id) => {
                            
                            if (i.id == service.id) {
                                res.status(200).send({msg: "Server-side Authorization Complete",statuscode: 200,code: token});
                            } else {
                                await profileSchema.updateOne(
                                    { "account.jwtToken": body.jwt },
                                    {
                                        $push: {
                                            "connections.authorized_apps": {
                                                id: service.id,
                                                name: service.name,
                                                picture: "placeholder",
                                            },
                                        },
                                    }
                                );
                                res.status(200).send({msg: "Server-side Authorization Complete",statuscode: 200,code: token });
                            }
                        })
                    }
                } else {
                    res
                        .status(400)
                        .send({
                            msg: "Service doesnt exist",
                            statuscode: 400,
                            servicecode: 2,
                        });
                }
            } else {
                res
                    .status(401)
                    .send({ msg: "Incorrect Password", statuscode: 200, servicecode: 0 });
            }
        } else {
            res
                .status(400)
                .send({ msg: "Invalid JWT Token", statuscode: 400, servicecode: 0 });
        }
    } else if (service == "deauthorize") {
        let user = await profileSchema.findOne({ "account.jwtToken": body.jwt });
        if (user) {
            let service = await oauthSchema.findOne({id: body.client_id});
            if (service) {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $pull: {"connections.authorized_apps": {id: service.id}}})
                res.status(200).send({ msg: "Service Pulled",statuscode: 200, servicecode: 0 });
            } else {
                res.status(400).send({ msg: "Service doesnt exist",statuscode: 400, servicecode: 2,});
            }
        } else {
            res.status(400).send({ msg: "Invalid JWT Token", statuscode: 400, servicecode: 0 });
        }
    } else if (service == "delete") {
        let user = await profileSchema.findOne({ "account.jwtToken": body.jwt });
        if (user) {
            let con = body.connection
            if (con == "facebook") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.facebook": 1}})
            } else if (con == "github") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.github": 1}})
            } else if (con == "reddit") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.reddit": 1}})
            } else if (con == "steam") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.steam": 1}})
            } else if (con == "youtube") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.youtube": 1}})
            } else if (con == "twitch") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.twitch": 1}})
            } else if (con == "discord") {
                await profileSchema.updateOne({ "account.jwtToken": body.jwt }, { $unset: {"connections.discord": 1}})
            }

            res.status(200).send({ msg: "Service Pulled",statuscode: 200, servicecode: 0 });
        } else {
            res.status(400).send({ msg: "Invalid JWT Token", statuscode: 400, servicecode: 0 });
        }
    }
});

module.exports = router