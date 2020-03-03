/*
Five Peas Flight Search
firebase.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

// Runs as soon as the document is loaded.
addEventListener("DOMContentLoaded", () => {
  onLoadAuth();
})

addEventListener("load", () => {
  initFirebase();

  auth();
});

/**
 * Initializes the firebase app for use.
 */
function initFirebase() {
  firebase.initializeApp({
    apiKey: "AIzaSyC26YKW4qgCCQhJSN_7ZzXsm_n5d_wx2j0",
    authDomain: "five-peas-flight-search.firebase.com",
    databaseURL: "https://five-peas-flight-search.firebaseio.com",
    projectId: "five-peas-flight-search",
    storageBucket: "five-peas-flight-search.appspot.com",
    messagingSenderId: "773049605239",
    appId: "1:773049605239:web:7ebbf6c1727bf904983a72",
    measurementId: "G-V2T9DGETMT"
  });
}

/**
 * Saves the itinerary. Uploads the data to Firebase.
 */
async function saveItinerary() {
  let user = checkAuth();

  if (!user || !user.uid) {
    console.error("User is not authenticated.");
    return;
  }
  qs("#save").classList.add("disabled");

  // Prepare details, including price.
  let [res, _] = await kiwiSearch(itable.get());
  let price = -1;
  let dTime = null;
  let aTime = null;
  let flyFrom = null;
  let flyTo = null;
  let currentDate = new Date();

  if (res !== null && typeof res[0] !== "undefined" &&
    typeof res[0].price !== "undefined") {
    price = res[0].price;
    dTime = localeDate(res[0].route[0].dTime);
    aTime = localeDate(res[0].route[res[0].route.length - 1].aTime);
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
  }


  firebase.firestore().collection("itineraries").add({
    uid: user.uid,
    name: qs("#itinerary-name").value || "Untitled",
    itinerary: itable.get().raw(),
    created: currentDate,
    history: [{
      price: price,
      retrieved: currentDate,
    }],
    dTime: dTime,
    aTime: aTime,
    flyFrom: flyFrom,
    flyTo: flyTo,
  }).then(docRef => {
    console.log(`Document written by ${user.name} with ID: ${docRef.id}`);
  }).then(() => {
    qs("#save").classList.remove("disabled");

    // Show that the itinerary was saved.
    M.toast({
      html: `<i class="material-icons left">star</i>
      <div>Itinerary saved!</div>`,
      displayLength: 1500
    });
  }).catch(error => {
    console.error("Error adding document:", error);
  });
}
