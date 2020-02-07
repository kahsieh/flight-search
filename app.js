'use strict';

let firebase = require('firebase');
let firebaseapp = firebase.initializeApp({
  apiKey: "AIzaSyC26YKW4qgCCQhJSN_7ZzXsm_n5d_wx2j0",
  authDomain: "five-peas-flight-search.firebaseapp.com",
  databaseURL: "https://five-peas-flight-search.firebaseio.com",
  projectId: "five-peas-flight-search",
  storageBucket: "five-peas-flight-search.appspot.com",
  messagingSenderId: "773049605239",
  appId: "1:773049605239:web:7ebbf6c1727bf904983a72",
  measurementId: "G-V2T9DGETMT"})
const express = require("express");
const path = require("path");
const app = express();

app.use(express.static("public"))

app.use(express.urlencoded())

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  
  app.post('/submit-form', (req, res) => {
    createUser(req.body.FirstName, req.body.Password)
    res.redirect(303, "/")
  })

  app.use(function(req, res) {
    res.status(404).sendFile(path.join(__dirname, "/public/404.html"))
  })
  // [END server]
}

function createUser(email, password) {
  firebaseapp.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
    console.log(error.message)
  })
}

module.exports = app;
