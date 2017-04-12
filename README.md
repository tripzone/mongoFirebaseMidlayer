# mongoFirebaseMidlayer

This app is a Node midlayer than exposes apis which can be used to update a firebase and a mongodb database simultinously.

To run:
node midlayer.js

Make sure to update:
var serviceAccount = require("./secret.json"); // path to your firebase secret file
const dbUrl = 'https://YOUR DATABASE.firebaseio.com/';
const authId = 'YOUR DATABASE AUTH ID, different than api key';
mongoose.connect('mongodb://localhost/YOURDATABASENAME');

