import admin from "firebase-admin";

import { Preference, Payment } from "mercadopago";

import client from "../services/mercadoPagoService.js";

import { db } from "../firebase/firebaseAdmin.js";

export async function createPreference(
    req,
    res
) {
    try {
        console.log(
            "MP TOKEN:",
            process.env.MP_ACCESS_TOKEN
        );

        console.log(
            "FRONTEND_URL:",
            process.env.FRONTEND_URL
        );

        console.log(
            "REQ USER:",
            req.user
        );
        const {
            uid,
            email,
        } = req.user;

        const preference = new Preference(client);

        const result =
            await preference.create({
                body: {
                    external_reference: uid,

                    statement_descriptor: "SELECCIONA2",

                    items: [
                        {
                            id: "pro-access",
                            title: "Selecciona2 PRO",
                            quantity: 1,
                            currency_id: "ARS",
                            unit_price: 3000.00,
                        },
                    ],

                    payer: {
                        email,
                    },

                    metadata: {
                        uid,
                    },

                    back_urls: {
                        success:
                            `${process.env.FRONTEND_URL}/payment/success`,
                        pending:
                            `${process.env.FRONTEND_URL}/payment/pending`,
                        failure:
                            `${process.env.FRONTEND_URL}/payment/failure`,
                    },

                    auto_return: "approved",

                    notification_url:
                        "https://selecciona2-api-1001848154161.southamerica-east1.run.app/api/payments/webhook",
                },
            });

            
                console.log(result.init_point);

        return res.json({
            init_point:
                result.init_point,
        });
    } catch (error) {
        console.error(
            JSON.stringify(error, null, 2)
        );

        return res.status(500).json({
            message:
                "Error creating preference",
        });
    }
}

export async function mercadopagoWebhook(
    req,
    res
) {
    try {
        const paymentId =
            req.query["data.id"];

        if (!paymentId) {
            return res.sendStatus(200);
        }

        const paymentClient =
            new Payment(client);

        const payment =
            await paymentClient.get({
                id: paymentId,
            });

        if (
            payment.status !==
            "approved"
        ) {
            return res.sendStatus(200);
        }

        const uid =
            payment.metadata?.uid;

        if (!uid) {
            return res.sendStatus(200);
        }

        const userRef = db
            .collection("users")
            .doc(uid);

        const paymentRef = db
            .collection("payments")
            .doc(String(payment.id));

        const paymentDoc =
            await paymentRef.get();

        if (paymentDoc.exists) {
            return res.sendStatus(200);
        }

        await userRef.update({
            isPro: true,

            proSince:
                admin.firestore.FieldValue.serverTimestamp(),

            proUntil:
                admin.firestore.Timestamp.fromDate(
                    new Date(
                        "2026-07-26T23:59:59"
                    )
                ),

            proPaymentId:
                payment.id,
        });

        await db
            .collection("payments")
            .doc(String(payment.id))
            .set({
                uid,

                paymentId: payment.id,

                status: payment.status,

                amount:
                    payment.transaction_amount,

                createdAt:
                    admin.firestore.FieldValue.serverTimestamp(),
            });

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);

        return res.sendStatus(500);
    }
}