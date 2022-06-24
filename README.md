## Idea
#### Test and try cloud functions with FCM locally and for free without upgrade to firebase blaze plan 🔥

## What you will learn 🧑‍💻
- Setup NodeJs for cloud functions development 💚
- Test Cloud Functions loclly (without deploy and pay for blaze plan) ❤️‍🔥
- Firestore triggers 🔥
- Send fcm (notifications) 🔔
- Modifiy documents on cloud function 📄
- Read collections/documents 📖
- Test our cloud functions with client side in my case (Flutter App) 📱

## What do you need
- Install [NodeJs](https://nodejs.org/en/download/) must be version(10,12,14,16) to support firebase cli
- Install [Java](https://www.java.com/download/ie_manual.jsp) needed to start the local emulators
- Now run this command to install Firebase CLI & tools

    ```bash
    npm install -g firebase-tools
    ```

## Setup project
- Before we start go to [firebase console](https://firebase.google.com/) and create firebase project
- Login to your firebase account, in cmd run

  ```bash
  firebase login
  ```
  If it says already logged in run this command (just to make sure your credintials are valid and you agreed to the latest firebase cli terms)

  ```bash
  firebase login --reauth
  ```
- Create folder for your cloud functions project (there must be no spacebars in path) for example:
  ```bash
  C:\Users\USERNAME\Desktop\cloud_function_test
  ```
- Cd to your project folder and run

  ```bash
  firebase init
  ```
  (follow the video)
  
    https://user-images.githubusercontent.com/64028200/174799383-1319b807-dbcf-494b-b550-575276b4a8c4.mp4


  
- Now lets setup FCM things so we can test it locally (download key and paste it on your folder project)

    https://user-images.githubusercontent.com/64028200/174799403-3c0802a6-f7e5-4291-a459-3f2d6c6fb2a4.mp4



## Coding
##### Open your functions/index.js file and remove all the code and let us start from the zero
- Import firebase functions modules to access triggers functions & admin modules to access database(firestore) & cloud messaging
  ```js
  const functions = require("firebase-functions");
  const admin = require("firebase-admin");
  ```
- Initialize your admin sdk with your key credentail that you just download it
  ```js
  // for example ("C:\\Users\\HP\\Desktop\\cloud_function_test\\key_name.json")
  const keyPath = 'key_path';
  
  admin.initializeApp(
      // TODO: remove this object when you finish and want to deploy to firebase
      { credential: admin.credential.cert(keyPath) }
  );
  ```
- Write our first trigger function (onOrderCreated) you can name it whatever you want
  ```js
  /** fire when new document added to orders collection */
  exports.onOrderCreated = functions.firestore.document('orders/{id}')
  .onCreate((change, context) => {
      /** do something here */
      return null;
  });
  // firestore have 4 triggers and they all have same syntax
  // onCreate => Fire whenever new document added
  // onUpdate => Fire when existing document modified
  // onDelete => Fire when deleting document
  // onWrite => Fire When create,update,delete document
  ```
- Explore params (change,context) with simple example: of changing any order name that gets created and add emoje next to it
  ```js
  exports.onOrderCreated = functions.firestore.document('orders/{id}')
    .onCreate((change, context) => {
        // id is identical to orders/{id} which mean if it was orders/{oId} it would be context.params.oId
        const createdDocumentId = context.params.id;
        // data of the created document
        const createdDocument = change.data();
        // access field from document, if the field doesnt exist value will be undifined
        const orderName = createdDocument.name;
        // check if the field viewTimes defined (exist)
        if(orderName){
            // modify document before saving it to firebase
            return change.ref.update({name: orderName + ' 📦'});
        }else {
            // return null means you dont want to return any promise/action its (JS) thing
            // but do i have to return null in all triggers? actully yes, bcz by default
            // it will return (undifned) and that can cause some problems!
            return null;
        }
    });
  ```
- Lets run our code and see how far we got 🦅
  ```bash
  firebase emulators:start
  ```
  

    https://user-images.githubusercontent.com/64028200/174799487-939dce32-fe2d-49b1-83dd-03785eee2e11.mp4


- Other triggers have different way to get data
  ```js
  /** onUpdate trigger */
  exports.onOrderUpdated = functions.firestore.document('orders/{id}')
    .onUpdate((change, context) => {
        const oldDoc = change.before.data(); // before the edit
        const updatedDoc = change.after.data(); // after the edit
        return null;
    });
  
  /** onDelete trigger */
  exports.onOrderDeleted = functions.firestore.document('orders/{id}')
    .onDelete((change, context) => {
        const deletedDoc = change.data(); // you can do backup
        return null;
    });
  
  /** onWrite trigger (fire when document update,delete,create) */
  exports.onOrderStateChange = functions.firestore.document('orders/{id}')
    .onWrite((change, context) => {
         // only has value if its (update operation) otherwise it will be undefined
        const oldDoc = change.before.exists ? change.before.data() : null;
        const newDoc = change.after.data();
        return null;
    });
  ```
  
## FCM (send notificaitons)
- Now after we took a quick look of how things work on cloud function lets make some actions, we will send fcm to all users collection (who have fcm_token) whenever new order is created
  ```js
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
                title: 'Orders',
                body: 'There is a new order!',
            }, data: {
                'name': 'Emad Beltaje', 
                'Note': 'Dont forget to rate repository 🌟'
            }
        };
        // *) send notifications
        if (usersFcmTokens.length > 0) {
            await admin.messaging().sendToDevice(usersFcmTokens, payload, options);
        }
        return null;
    });
  ```

## lets test it with client side (in my case Flutter app)
- first run this command to start your cloud functions emulators
    ```
    firebase emulators:start
    ```
- You can use my [Flutter Repo](https://github.com/EmadBeltaje/flutter_getx_template) for quick start  

    - Go to lib/utils/fcm_helper.dart  
    
    - Now print the generated fcm token  
    
        ```
        static _sendFcmTokenToServer(){
            var token = MySharedPref.getFcmToken();
            Logger().e(token); // just print the token
        }
        ```
        
    - add it to one of users in users collection (field name must be fcm_token)  
    
    - create new order to trigger (onOrderCreated) function  
    

You can follow the video


https://user-images.githubusercontent.com/64028200/175286984-f56c0feb-ab5f-453d-b75e-d1e9ba4e1e57.mp4



## Support

For support, email emadbeltaje@gmail.com or Facebook [Emad Beltaje](https://www.facebook.com/EmadBeltaje/).  
Dont Forget to star the repo 🌟  
