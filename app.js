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

    getUid(idToken).then(uid => {
      let promiseArray = [];
      docIds.forEach(id => {
        promiseArray.push(admin.firestore().collection("itineraries")
          .doc(id)
          .delete()
          .then(() => console.log(`${id} was successfully deleted.`))
          .catch(error => {
            console.error(error);
            response.status(400);
            status = false;
        }).then(() => {})); // resolves if error, so Promise.all still fires
      });
      if (docIds.length > 0) {
        Promise.all(promiseArray).then(() => {
          response.send({deleted: status});
        });
      }
    }).catch(error => {
        response = res.status(401);
        console.error(error);
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

/**
 * Gets the uid from the auth token specified
 * 
 * @param {string} idToken Auth token for user
 */
async function getUid(idToken) {
  return await admin.auth().verifyIdToken(idToken).uid;
}

module.exports = app;
