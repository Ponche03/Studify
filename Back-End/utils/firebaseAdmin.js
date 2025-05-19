var admin = require("firebase-admin");

var serviceAccount = require("../studify-5e81f-firebase-adminsdk-fbsvc-e821d8811e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.AUTH_DATABASE_URL
});
