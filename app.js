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
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.text());

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });

  /**
   * Listener that deletes itineraries for user after page unloads.
   */
  app.post("/api/delete-itinerary", (req, res) => {
    let response = res.type("application/json");

    let body = JSON.parse(req.body);
    let idToken = body.idToken;
    let docIds = body.deletedProcessing;
    let status = true;
    if (typeof docIds === "undefined" || docIds.length === 0) {
      response.status(400);
      status = false;
      response.send({ deleted: status });
    }

    // verify the id token so that it is a valid uid
    admin.auth().verifyIdToken(idToken).then(async decodedToken => {
      let uid = decodedToken.uid;

      const querySnapshot = await admin.firestore()
        .collection("itineraries")
        .where("uid", "==", uid)
        .get();
      let promiseArray = [];
      promiseArray.push(new Promise(resolve => {
        querySnapshot.forEach(doc => {
          if (docIds.includes(doc.id)) {
            doc.ref.delete().then(() => {
              console.log(`${doc.id} was successfully deleted.`);
            }).catch(error => {
              console.error(error);
              response.status(400);
              status = false;
            }).then(() => { // resolve regardless of error so the array resolves
              resolve();
            });
          }
        });
      }));
      Promise.all(promiseArray).then(() => {
        response.send({ deleted: status });
      });
    }).catch(error => { // if we get an error from verifying or querying
      console.error(error);
      response = res.status(401);
      status = false;
      response.send({ deleted: status });
    });
  });

  /**
   * Listener that redirects user to 404 page when trying to access
   * an unknown page
   */
  app.use(function(req, res) {
    res.sendStatus(404);
  });
}

module.exports = app;
