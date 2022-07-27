const router = require('express').Router()
const express = require("express");
const mail = require("@sendgrid/mail");
mail.setApiKey(process.env.sendgrid_api);
const profileSchema = require("../schemas/PSchema");
const stripe = require("stripe")('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')/*("sk_test_51L4kfuFc3s9j20gTBLkvLPHxCoHqzf6l7AcxAfjm8I1k3LX6blg0fO0zPXZFpPi75TgKtcOCOpVqO7ElYrYGUxoR00dV7tEAKR")*/
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

router.use("/", express.json(), async (req, res) => {
    let service = req.path.split("/")[1];
    let path = req.path.split("/")[2];
    let body = await req.body;

    if (service == "buy_premium") {
        let user = await profileSchema.findOne({ "account.jwtToken": body.jwt })
        if (path == "basic") {
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'VikkiVuk Premium: BASIC',
                            },
                            unit_amount: 299,
                            recurring: {
                                interval: 'month'
                            }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                cancel_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                customer_email: user.email,
                subscription_data: {
                    metadata: {
                        'jwtToken': body.jwt,
                        'product': 'basic_premium'
                    }
                }
            });

            res.status(200).send({message:'Generated link', link: session.url, code: 200})
        } else if (path == "mvp") {
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'VikkiVuk Premium: MVP',
                            },
                            unit_amount: 499,
                            recurring: {
                                interval: 'month'
                            }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                cancel_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                customer_email: user.email,
                subscription_data: {
                    metadata: {
                        'jwtToken': body.jwt,
                        'product': 'mvp_premium'
                    }
                }
            });

            res.status(200).send({message:'Generated link', link: session.url, code: 200})
        } else if (path == "elite") {
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'VikkiVuk Premium: ELITE',
                            },
                            unit_amount: 1499,
                            recurring: {
                                interval: 'month'
                            }
                        },
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                cancel_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
                customer_email: user.email,
                subscription_data: {
                    metadata: {
                        'jwtToken': body.jwt,
                        'product': 'elite_premium'
                    }
                }
            });

            res.status(200).send({message:'Generated link', link: session.url, code: 200})
        }
    } else if (service == "billing_portal") {
        let query = await req.query
        let user = await profileSchema.findOne({ "account.jwtToken": query.jwt })

        if (user) {
            const session = await stripe.billingPortal.sessions.create({
                customer: user.account.stripe.customer_id,
                return_url: 'https://accounts.vikkivuk.xyz/r/home?check=true',
            });

            res.status(200).send({message:"Success",code:200,url:session.url})
        } else {
            res.status(400).send({message:"Missing JWT", code: 400})
        }
    } else if (service == "buy_balance") {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Wallet Balance',
                        },
                        unit_amount: body.amount
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'https://accounts.vikkivuk.xyz/dashboard/wallet.html',
            cancel_url: 'https://accounts.vikkivuk.xyz/dashboard/wallet.html',
            payment_intent_data: {
                metadata: {
                    "jwtToken": body.jwt,
                    "product": "wallet_balance"
                }
            }
        });

        res.status(200).send({message:'Generated link', link: session.url, code: 200})
    }
})
router.post("/stripe_webhook", express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, "whsec_DEy3UVFItHTAGx5I4luIhbmF4CS7JuYF");
    } catch (err) {
        console.error(err.message)
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    const jwt = await event.data.object.metadata.jwtToken

    switch (event.type) {
        case 'payment_intent.succeeded':
            const item = event.data.object;
            if (item.metadata.product == 'wallet_balance') {
                let amnt = +item.amount / 100
                await profileSchema.updateOne({ "account.jwtToken": jwt }, { $inc: { "account.wallet.balance": amnt }})
            }

            break;
        case 'customer.subscription.created':
            const customer = await stripe.customers.retrieve(event.data.object.customer)
            const subscription = event.data.object;
            const product = await stripe.products.retrieve(subscription.plan.product)

            let plan = product.name
            let user = await profileSchema.findOne({ "account.jwtToken": jwt })

            try {
                if (user.account.stripe) {
                    if (user.account.stripe.subscription_id) {
                        await stripe.subscriptions.del(user.account.stripe.subscription_id)
                    }
                }
            } catch(e) {
                console.error(e)
            }

            await profileSchema.updateOne({ "account.jwtToken": jwt }, { "account.stripe.customer_id": customer.id, "account.stripe.subscription_id": subscription.id, "account.stripe.subscription_name": product.name })

            break;
        case 'customer.subscription.deleted':
            const subscriptionn = event.data.object;
            console.log(subscriptionn)
            await profileSchema.updateOne({ "account.stripe.subscription_id": subscriptionn.id }, { $unset: {"account.stripe": 1}})

            break;
        case 'customer.subscription.updated':
            const subscriptionnn = event.data.object;
            break;
        case 'order.payment_succeeded':
            const order = event.data.object;

            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
})

module.exports = router