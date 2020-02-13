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
  
  app.post('/api/sign-in', (req, res) => {
    let response = res;

    createUser(req.body.email_address, req.body.password).then(userCredential => {
      return userCredential.user.getIdTokenResult();
    }).then(idTokenResult => {
      response = res.cookie('AuthToken', idTokenResult.token);
    }).catch(error => {
      console.error(error);
    }).then(() => {
      response.redirect(303, '/');
    });
  })

  app.post('/api/auth', (req, res) => {
    let response = res;

    let authenticated = isUserAuthenticated(findAuthToken(req));

    if (!authenticated) {
      response = res.clearCookie('AuthToken');
    }
    response.send(authenticated);
  });

  app.post('/api/sign-out', (req, res) => {
    let user = firebaseapp.auth().currentUser;
    let email = '';
    let token = findAuthToken(req);
    if (user !== null) {
      email = firebaseapp.auth().currentUser.email;
    }
    
    firebaseapp.auth().signOut().then(() => {
      console.log(email + ' signed out succesfully.')
    }).catch(error => {
      console.error(error);
    });

    if (typeof token !== undefined && typeof authMap[token] !== 'undefined') {
        delete authMap[token];
    }

    res.clearCookie('AuthToken').sendStatus(200);
  });

  app.use(function(req, res) {
    res.status(404).sendFile(path.join(__dirname, "/public/404.html"))
  });

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

function isUserAuthenticated(token) {
  return (typeof authMap[token] !== undefined) && ((new Date()) < Date.parse(authMap[token]));
}

// returns auth token cookie if found
// else returns undefined
function findAuthToken(req) {
  let cookies = req.headers.cookie.split(';');
  let find = cookies.find(cookie => {
    return cookie.startsWith(' AuthToken');
  });

  if (typeof find !== 'undefined') {
    return find.substring(' AuthToken='.length); // cookie after AuthToken
  }
  else {
    return;
  }
}

module.exports = app;
