/*
Five Peas Flight Search
app.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://five-peas-flight-search.firebaseio.com"
});

const CronJob = require("cron").CronJob;
const firebase = require("./public/external/firebase.js");

const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.text());

if (module === require.main) {
  const server = app.listen(process.env.PORT || 8080, () => {
    console.log(`App listening on port ${server.address().port}`);

    // Set up cron job for refreshing saved itineraries.
    firebase.setFirebase(admin);
    new CronJob("0 0 0,12 * * *", async () => {
      // Query for all itineraries having names starting with *.
      const querySnapshot = await firebase.getFirebase().firestore()
        .collection("itineraries")
        .where("name", ">=", "*")
        .where("name", "<", String.fromCharCode("*".charCodeAt(0) + 1))
        .get();
      // Call updateFirebaseItinerary on each match.
      querySnapshot.forEach(doc => {
        firebase.updateFirebaseItinerary(doc.id, doc.data())
                .then(() => console.log(doc.id + " was successfully updated."))
                .catch(e => console.error(e));
      });
    }).start();
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
   * Listener that redirects user to 404 page when trying to access an unknown
   * page.
   */
  app.use(function(req, res) {
    res.sendStatus(404);
  });
}

module.exports = app;
