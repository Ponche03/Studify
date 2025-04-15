
const admin = require("firebase-admin");
const serviceAccount = require("../config/studify-707e5-firebase-adminsdk-fbsvc-2b13869dae.json"); // tu ruta real

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "studify-707e5" // OJO: termina en `.appspot.com`, no `.firebasestorage.app`
});

const bucket = admin.storage().bucket();

module.exports = { bucket };
