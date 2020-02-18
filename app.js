'use strict';

const fire = require('firebase');
const firebase = require('firebase').initializeApp({
  apiKey: "AIzaSyC26YKW4qgCCQhJSN_7ZzXsm_n5d_wx2j0",
  authDomain: "five-peas-flight-search.firebase.com",
  databaseURL: "https://five-peas-flight-search.firebaseio.com",
  projectId: "five-peas-flight-search",
  storageBucket: "five-peas-flight-search.appspot.com",
  messagingSenderId: "773049605239",
  appId: "1:773049605239:web:7ebbf6c1727bf904983a72",
  measurementId: "G-V2T9DGETMT"
});
require('firebase/firestore');
let firestore = firebase.firestore();
const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const sanitizeHtml = require("sanitize-html");
//For development purposes on localhost:8080, use 773049605239-i20d5b73br9717fipmm8896s5cqpa4s0.apps.googleusercontent.com
const CLIENT_ID = "773049605239-66ll1k7igb4fre0n1ounatv5ruj7bvfi.apps.googleusercontent.com";

const authMap = {};

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true}));

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });

  app.use(bodyParser.json());
  
  app.post('/api/sign-up', (req, res) => {
    let response = res;

    const token = req.body.idtoken;
    const {OAuth2Client} = require('google-auth-library');
    const client = new OAuth2Client(CLIENT_ID);

    verify(client, token)  
      .then(() => {
        // Build Firebase credential with the Google ID token.
        //console.log(fire.auth.GoogleAuthProvider);
        var credential = fire.auth.GoogleAuthProvider.credential(token);

        // Sign in with credential from the Google user.
        firebase.auth().signInWithCredential(credential)
            .catch(function(error) { console.log(error) })
            .then((userCredential) => { 
              return userCredential.user.getIdTokenResult();
            })
            .then(idTokenResult => {
              authMap[idTokenResult.token] = idTokenResult.expirationTime;
              response = res.cookie('AuthToken', idTokenResult.token);
              response.sendStatus("303");
            });
      })
      .catch(error => console.error(error));
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
    let user = firebase.auth().currentUser;
    let name = '';
    let token = findAuthToken(req);
    if (user !== null) {
      name = (user.displayName !== null) ? user.displayName : user.email;
    }
    
    firebase.auth().signOut().then(() => {
      console.log(name + ' signed out succesfully.')
    }).catch(error => {
      console.error(error);
    });

    if (typeof token !== undefined && typeof authMap[token] !== 'undefined') {
        delete authMap[token];
    }

    res.clearCookie('AuthToken').sendStatus(200);
  });

  app.post('/api/save-itinerary', (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));

    if (!authenticated) {
      res.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let currentDate = new Date();

      // sanitize all input before we store it in firebase
      let sanitizedObj = {};
      let sanitized = true;
      
      for (const [key, value] of Object.entries(req.body)) {
        if (key === 'itinerary') {
          sanitizedObj.itinerary = [];
          for (const flight of req.body.itinerary) {
            let itineraryObj = {};
            for (const [flightKey, flightValue] of Object.entries(flight)) {
              if (typeof flightValue !== 'string') {
                sanitized = false;
                break;
              }
              itineraryObj[flightKey] = sanitizeText(flightValue);
            }
            if (!sanitized) {
              break;
            }
            sanitizedObj.itinerary.push(itineraryObj);
          }
        }
        else {
          if (typeof value !== 'string' || !sanitized) {
            sanitized = false;
            break;
          }
          sanitizedObj[key] = sanitizeText(value);
        }
      }

      if (sanitized) {
        firestore.collection('itineraries').add({
          uid: user.uid,
          name: sanitizedObj.name,
          created_at: currentDate,
          price_history: [{
            time: currentDate,
            price: sanitizedObj.price,
          }],
          itinerary: sanitizedObj.itinerary,
          dTime: sanitizedObj.dTime,
          aTime: sanitizedObj.aTime,
          flyFrom: sanitizedObj.flyFrom,
          flyTo: sanitizedObj.flyTo,
        }).then(docRef => {
          console.log(`Document written by ${(user.displayName !== null) ? user.displayName : user.email}, ${user.uid} with ID: ${docRef.id}`);
        }).catch(error => {
          console.error("Error adding document:", error);
        });
        res.sendStatus(200);
      }
      else {
        res.sendStatus(401);
      }
    }
  });

  app.post('/api/display-itineraries', (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));
    let response = res.type('application/json');

    if (!authenticated) {
      response.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let data = [];
      response = res.status(200);

      firestore.collection("itineraries").where('uid', '==', user.uid).orderBy('created_at', 'asc').get().then(querySnapshot => {
        querySnapshot.forEach(doc => {
          data.push(doc.data());
        });
      }).catch(error => {
        console.error(error);
        response.status(500);
      }).then(() => {
        response.send(JSON.stringify(data));
      });
    }
  });

  app.post('/api/delete-itinerary', (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));
    let response = res.type('application/json');

    if (!authenticated) {
      response.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let data = [];
      response = res.status(200);

      // firestore.collection("itineraries").where('uid', '==', user.uid).orderBy('created_at', 'asc').get().then(querySnapshot => {
      //   querySnapshot.forEach(doc => {
      //     data.push(doc.data());
      //   });
      // }).catch(error => {
      //   console.error(error);
      //   response.status(500);
      // }).then(() => {
      //   response.send(JSON.stringify(data));
      // });
    }
  });

  app.use(function(req, res) {
    res.sendStatus(404);
  });
}

function sanitizeText(text) {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

function isUserAuthenticated(token) {
  let expireTime = new Date();
  expireTime.setTime(Date.parse(authMap[token]));

  return (typeof authMap[token] !== 'undefined') && ((new Date()) < expireTime);
}

// returns auth token cookie if found
// else returns undefined
function findAuthToken(req) {
  if (typeof req.headers.cookie === 'undefined') {
    return;
  }

  let cookies = req.headers.cookie.split(';');
  let authTokenString = 'AuthToken';
  if (cookies.length > 1) {
    authTokenString = ' ' + authTokenString;
  }
  let find = cookies.find(cookie => {
    return cookie.startsWith(authTokenString);
  });

  if (typeof find !== 'undefined') {
    return find.substring((authTokenString + '=').length); // cookie after AuthToken
  }
  else {
    return;
  }
}

async function verify(client, token) {
  await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });
}

module.exports = app;
