'use strict';

const firebase = require('firebase');
const firebaseapp = firebase.initializeApp({
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

const authMap = {};

app.use(express.static("public"))

app.use(express.urlencoded())

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  
  app.post('/api/sign-up', (req, res) => {
    createUser(req.body.email, req.body.password).then(userCredential => {
      return userCredential.user.getIdTokenResult();
    }).then(idTokenResult => {
      res.cookie('access_token', 'Bearer ' + idTokenResult.token).redirect(303, "/")
    }).catch(error => {
      console.log(error);
    });
  })

  app.post('/api/auth', (req, res) => {
    res.send(isUserAuthenticated());
  })

  app.use(function(req, res) {
    res.status(404).sendFile(path.join(__dirname, "/public/404.html"))
  })

  firebaseapp.auth().onAuthStateChanged(user => {
    if (user) {
      user.getIdTokenResult().then(idTokenResult => {
        authMap[idTokenResult.token] = idTokenResult.expirationTime;
      })
    }
  });
  // [END server]
}

async function createUser(email, password) {
  return firebaseapp.auth().createUserWithEmailAndPassword(email, password);
}

function isUserAuthenticated() {
  return firebase.auth().currentUser !== null;  
}

module.exports = app;
