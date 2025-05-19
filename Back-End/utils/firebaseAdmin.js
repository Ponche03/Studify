var admin = require("firebase-admin");

var serviceAccount = require("../studify-5e81f-firebase-adminsdk-fbsvc-e821d8811e.json");


console.log("Is object:", typeof serviceAccount === 'object');
console.log("Client Email exists:", 'client_email' in serviceAccount);
console.log("Private Key starts with '-----BEGIN':", serviceAccount.private_key.startsWith('-----BEGIN'));


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.AUTH_DATABASE_URL
});
