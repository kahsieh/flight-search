"use strict";

const fire = require("firebase");
const firebase = require("firebase").initializeApp({
  apiKey: "AIzaSyC26YKW4qgCCQhJSN_7ZzXsm_n5d_wx2j0",
  authDomain: "five-peas-flight-search.firebase.com",
  databaseURL: "https://five-peas-flight-search.firebaseio.com",
  projectId: "five-peas-flight-search",
  storageBucket: "five-peas-flight-search.appspot.com",
  messagingSenderId: "773049605239",
  appId: "1:773049605239:web:7ebbf6c1727bf904983a72",
  measurementId: "G-V2T9DGETMT"
});
require("firebase/firestore");
let firestore = firebase.firestore();
const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const CLIENT_ID = 
  "773049605239-i20d5b73br9717fipmm8896s5cqpa4s0.apps.googleusercontent.com";

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
  
  /**
   * Listener that signs user up after using Google Sign-in
   */
  app.post("/api/sign-up", (req, res) => {
    let response = res;

    const token = req.body.idtoken;
    const {OAuth2Client} = require("google-auth-library");
    const client = new OAuth2Client(CLIENT_ID);

    verify(client, token)  
      .then(() => {
        var credential = fire.auth.GoogleAuthProvider.credential(token);

        firebase.auth().signInWithCredential(credential)
            .catch(function(error) { console.error(error) })
            .then((userCredential) => { 
              return userCredential.user.getIdTokenResult();
            })
            .then(idTokenResult => {
              authMap[idTokenResult.token] = idTokenResult.expirationTime;
              response = res.cookie("AuthToken", idTokenResult.token);
              response.sendStatus("303");
            });
      })
      .catch(error => console.error(error));
  })

  /**
   * Listener that checks if user is authenticated and returns user's 
   * displayName or email
   */
  app.post("/api/auth", (req, res) => {
    let response = res;
    let authenticated = isUserAuthenticated(findAuthToken(req));
    response.contentType = res.type("application/json");
    
    if (!authenticated) {
      response = res.clearCookie("AuthToken");
    }

    let user = firebase.auth().currentUser;
    let name =  (user === null) ? null :
                  ((user.displayName !== null) ? user.displayName : user.email);

    var body = [
      {authenticated: authenticated, name: name}
    ]
    var jsonbody = JSON.stringify(body);
    response.send(jsonbody);
  });

  /**
   * Listener that signs user out of Firebase
   */
  app.post("/api/sign-out", (req, res) => {
    let user = firebase.auth().currentUser;
    let name = "";
    let token = findAuthToken(req);
    if (user !== null) {
      name = (user.displayName !== null) ? user.displayName : user.email;
    }
    
    firebase.auth().signOut().then(() => {
      console.log(name + " signed out succesfully.")
    }).catch(error => {
      console.error(error);
    });

    if (typeof token !== "undefined" && typeof authMap[token] !== "undefined") {
        delete authMap[token];
    }

    res.clearCookie("AuthToken").sendStatus(200);
  });

  /**
   * Listener that saves user's itinerary
   */
  app.post("/api/save-itinerary", (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));

    if (!authenticated) {
      res.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;

      firestore.collection("itineraries").add({
        uid: user.uid,
        name: req.body.name,
        created: new Date(req.body.created),
        updated: new Date(req.body.updated),
        price: req.body.price,
        itinerary: req.body.itinerary,
        dTime: req.body.dTime,
        aTime: req.body.aTime,
        flyFrom: req.body.flyFrom,
        flyTo: req.body.flyTo,
      }).then(docRef => {
        console.log(`Document written by ${(user.displayName !== null) 
          ? user.displayName : user.email}, ${user.uid} with ID: ${docRef.id}`);
      }).catch(error => {
        console.error("Error adding document:", error);
      });
      res.sendStatus(200);
    }
  });

  /**
   * Listener that displays user's itineraries
   */
  app.post("/api/display-itineraries", (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));
    let response = res.type("application/json");

    if (!authenticated) {
      response.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let data = [];
      response = res.status(200);

      firestore.collection("itineraries")
        .where("uid", "==", user.uid)
        .orderBy("created", "asc")
        .get()
        .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          data.push({
            id: doc.id,
            ...doc.data()
          });
        });
      }).catch(error => {
        console.error(error);
        response.status(500);
      }).then(() => {
        response.send(JSON.stringify(data));
      });
    }
  });

  /**
   * Listener that deletes itinerary for user
   */
  app.post("/api/delete-itinerary", (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));
    let response = res.type("application/json");

    if (!authenticated) {
      response.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let status = true;
      response = res.status(200);

      let docIds = req.body.docId;
      if (typeof req.body.docId === "string") {
        docIds = [req.body.docId];
      }

      if (typeof docIds === "undefined") {
        response.status(400);
        status = false;
        response.send({deleted: status});
      }
      else {
        let promiseArray = [];
        docIds.forEach(id => {
          promiseArray.push(firestore.collection("itineraries")
            .doc(id)
            .delete()
            .then(() => console.log(`${id} was successfully deleted.`))
            .catch(error => {
              console.error(error);
              response.status(400);
              status = false;
          }).then(() => {})); // resolves if error, so Promise.all still fires
        });
        Promise.all(promiseArray).then(() => {
          response.send({deleted: status});
        });
      }
    }
  });

  /**
   * Listener that updates itinerary for user
   */
  app.post("/api/update-itinerary", (req, res) => {
    let authenticated = isUserAuthenticated(findAuthToken(req));
    let response = res.type("application/json");

    if (!authenticated) {
      response.sendStatus(401);
    }
    else {
      let user = firebase.auth().currentUser;
      let status = true;
      response = res.status(200);

      if (typeof req.body.docId === "undefined") {
        response.status(400);
        status = false;
        response.send({updated: status});
      }
      else {
        let updateObj = req.body.update;

        firestore.collection("itineraries").doc(req.body.docId)
          .update({
            price: updateObj.price,
            updated: new Date(updateObj.updated),
          })
          .then(() => console.log(`${req.body.docId} successfully updated.`))
          .catch(error => {
            console.error(error);
            response.status(400);
            updated = false;
          }).then(() => {
            response.send({updated: status});
          });
      }
    }
  });

  /**
   * Listener that redirects user to 404 page when trying to access
   * an unknown page
   */
  app.use(function(req, res) {
    res.sendStatus(404);
  });
}

/**
 * Checks that user's token is registered in our authMap and also checks to
 * see if token has expired
 */
function isUserAuthenticated(token) {
  let expireTime = new Date();
  expireTime.setTime(Date.parse(authMap[token]));

  return (typeof authMap[token] !== "undefined") && ((new Date()) < expireTime);
}

/**
 * Returns Auth token if there is one, otherwise returns nothing
 */
function findAuthToken(req) {
  if (typeof req.headers.cookie === "undefined") {
    return;
  }

  let cookies = req.headers.cookie.split(";");
  let authTokenString = "AuthToken";
  if (cookies.length > 1) {
    authTokenString = " " + authTokenString;
  }
  let find = cookies.find(cookie => {
    return cookie.startsWith(authTokenString);
  });

  if (typeof find !== "undefined") {
    return find.substring((authTokenString + "=").length);
  }
  else {
    return;
  }
}

/**
 * Verifies the idtoken provided by the client to make sure it is valid
 */
async function verify(client, token) {
  await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
  });
}

module.exports = app;
