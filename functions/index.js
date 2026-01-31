const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered when a patient's token status is updated.
 * If a token is marked as 'calling', we find the patient 2 steps ahead 
 * and mark their status as 'alerted'.
 */
exports.onTokenStatusUpdate = functions.firestore
    .document("hospitals/{hospitalId}/tokens/{tokenId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const oldValue = change.before.data();
        const hospitalId = context.params.hospitalId;

        // We only care if the status JUST changed to 'calling'
        if (newValue.status === 'calling' && oldValue.status !== 'calling') {
            const currentTokenNumber = newValue.tokenNumber;
            const targetTokenNumber = currentTokenNumber + 2;

            console.log(`Token #${currentTokenNumber} is being called. Looking for Token #${targetTokenNumber} to alert.`);

            const tokensRef = db.collection(`hospitals/${hospitalId}/tokens`);
            const querySnapshot = await tokensRef
                .where("tokenNumber", "==", targetTokenNumber)
                .limit(1)
                .get();

            if (!querySnapshot.empty) {
                const targetTokenDoc = querySnapshot.docs[0];
                const targetTokenId = targetTokenDoc.id;

                console.log(`Alerting patient with Token #${targetTokenNumber} (ID: ${targetTokenId})`);

                await tokensRef.doc(targetTokenId).update({
                    status: 'alerted',
                    alertTriggeredAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                console.log(`No patient found with Token #${targetTokenNumber}`);
            }
        }

        return null;
    });
