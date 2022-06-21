const functions = require("firebase-functions");
const admin = require("firebase-admin");

// TODO: add your private generated key path => for example ("C:\\Users\\HP\\Desktop\\cloud_function_test\\key_name.json")
const keyPath = 'your_key_path.json';

admin.initializeApp(
    // TODO: remove this object when you finish and want to deploy to firebase
    {
            credential: admin.credential.cert(keyPath)
         }
    );


/**
 *  fire when new order created
 *  it will send FCM to all the users who have fcm_token
 * */
exports.onOrderCreated = functions.firestore.document(`orders/{id}`)
    .onCreate(async (change, context) => {
        // *) read all users collection
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.get();
        // *) hold users fcm tokens
        const usersFcmTokens = [];
        // *) loop on all users documents and check if each one has fcm token
        snapshot.forEach(doc => {
            if (doc.get('fcm_token') != null && doc.get('fcm_token').trim().length > 0) {
                usersFcmTokens.push(doc.get('fcm_token'));
            }
        });
        // *) fcm options:
        // IMPORTANT: priority is a must because android & ios kill background process so if the priority is normal
        // or low the notification will not be shown when the app is terminated
        const options = {
            priority: "high", timeToLive: 60 * 60 * 24
        };
        // *) title,body and data that will be sent with notification
        const payload = {
            notification: {
                title: 'Orders', body: 'There is a new order!',
            }, data: {
                'name': 'Emad Beltaje', 'Note': 'Dont forget to rate repository 🌟'
            }
        };
        // *) send notifications
        if (usersFcmTokens.length > 0) {
            await admin.messaging().sendToDevice(usersFcmTokens, payload, options);
        }

        // *) onWrite expect return of type promise
        // but because we don't want to perform extra actions just return null (its JS things)
        return null;
    });


/** fire when existing order updated */
exports.onOrderUpdated = functions.firestore.document('orders/{id}')
    .onUpdate((change, context) => {
        const oldDoc = change.before.data();
        const updatedDoc = change.after.data();
        //const name = newDoc.get('name'); // access field inside document
        return null;

        // example of return action instead of null
        // let count = oldDoc.doc_update_times_count;
        // if (!count) {
        //     count = 0;
        // }
        // return change.after.ref.set({
        //     doc_update_times_count: count + 1
        // }, {merge: true});
    });

/** fire when existing order deleted */
exports.onOrderDeleted = functions.firestore.document('orders/{id}')
    .onDelete((change, context) => {
        const deletedDoc = change.data(); // you can do backup
        return null;
    });

/** fire when existing order created, deleted or updated */
exports.onOrderStateChange = functions.firestore.document('orders/{id}')
    .onWrite((change, context) => {
        const oldDoc = change.before.exists ? change.before.data() : null; // only has value if its (update operation) otherwise it will be undefined
        const newDoc = change.after.data();
        return null;
    });



