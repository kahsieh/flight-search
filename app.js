/*
Five Peas Flight Search
app.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

// Import Firebase Admin library and FPFS Firebase library.
const admin = require("firebase-admin");
const firebase = require("./public/external/firebase.js");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://five-peas-flight-search.firebaseio.com"
});
firebase.setFirebase(admin);

// Set up Express server.
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(express.static("public"));
app.use(bodyParser.text());

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`App listening on port ${server.address().port}`);
  });

  /**
   * Listener that deletes itineraries for user after page unloads.
   */
  app.post("/api/delete-itinerary", (req, res) => {
    let response = res.type("application/json");
    let body = JSON.parse(req.body);
    let idToken = body.idToken;
    let docIds = body.deletedProcessing;

    if (typeof docIds === "undefined" || docIds.length === 0) {
      response.status(400);
      response.send({ deleted: false });
    }
    else {
      // verify the id token so that it is a valid uid
      admin.auth().verifyIdToken(idToken).then(async decodedToken => {
        const querySnapshot = await admin.firestore()
          .collection("itineraries")
          .where("uid", "==", decodedToken.uid)
          .get();
        let promiseArray = [];
        let status = true;
        promiseArray.push(new Promise(resolve => {
          querySnapshot.forEach(doc => {
            if (docIds.includes(doc.id)) {
              doc.ref.delete().then(() => {
                console.log(`${doc.id} was successfully deleted.`);
              }).catch(e => {
                console.error(e);
                response.status(400);
                status = false;
              }).then(() => {  // resolve regardless of error so array resolves
                resolve();
              });
            }
          });
        }));
        Promise.all(promiseArray).then(() => {
          response.send({ deleted: status });
        });
      }).catch(e => {  // if we get an error from verifying or querying
        console.error(e);
        response = res.status(401);
        response.send({ deleted: false });
      });
    }
  });

  /**
   * Listener that handles the cron job for refreshing saved itineraries.
   */
  app.get("/api/refresh-saved-itineraries", async (req, res) => {
    if (!req.header("X-Appengine-Cron")) {
      return res.sendStatus(403);
    }
    const querySnapshot = await firebase.getFirebase().firestore()
      .collection("itineraries")
      .where("created", ">=", new Date("2020-06-01"))
      .get();
    // Call updateFirebaseItinerary on each match.
    querySnapshot.forEach(doc => {
      firebase.updateFirebaseItinerary(doc.id, doc.data())
              .then(() => console.log(doc.id + " was successfully updated."))
              .catch(e => console.error(e));
    });
    res.sendStatus(200);
  });

  /**
   * Listener that redirects user to 404 page when trying to access an unknown
   * page.
   */
  app.use(function(req, res) {
    res.sendStatus(404);
  });
}

module.exports = app;
