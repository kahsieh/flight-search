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
 * Gets the Firebase id token.
 */
function getFirebaseIdToken() {
  let user = firebase.auth().currentUser;
  return new Promise((resolve, reject) => {
    if (user) {
      user.getIdToken(/* forceRefresh */ true).then(idToken => {
        resolve(idToken);
      }).catch(error => {
        reject(error);
      })
    }
    else {
      reject("Could not find authenticated Firebase user.");
    }
  });
}

async function savePreferences() {
  let user = checkAuth();

  if (!user || !user.uid) {
    console.error("User is not authenticated.");
    return;
  }
  qs("#save").classList.add("disabled");

  console.log(qs("#airport").value);
  console.log(qs("#airline").value);
  console.log(qs("#cabin").value);
  console.log(qs("#time").value);

  firebase.firestore().collection("preferences").doc(user.uid).set({
    dAirport: qs("#airport").value || "",
    airline: qs("#airline").value || "",
    cabin: qs("#cabin").value || "",
    dTime: qs("#time").value || "",
  }).then(() => {
    qs("#save").classList.remove("disabled");
    qs("#airport").value = "";
    qs("#airline").value = "";
    qs("#cabin").children[0].selected = true;
    M.FormSelect.init(qsa("select"), {});
    qs("#time").value = "";

    // Show that the itinerary was saved.
    M.toast({
      html: `<i class="material-icons left">star</i>
      <div>Preferences saved!</div>`,
      displayLength: 1500
    });
  }).catch(error => {
    console.error("Error saving preferences:", error);
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
  let currentDate = firebase.firestore.Timestamp.now();

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

/**
 * Returns all itineraries saved by the user.
 * 
 * @param {string} uid UID of user
 */
function getFirebaseItineraries(uid) {
  return firebase.firestore()
    .collection("itineraries")
    .where("uid", "==", uid)
    .orderBy("created", "asc")
    .get()
    .then(querySnapshot => {
      let data = [];
      querySnapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return data;
    });
}

/**
 * Updates itinerary in firebase.
 * 
 * @param {string} docId Document id to be updated.
 * @param {array} firebaseData firebase data with itinerary, row to be updated.
 */
async function updateFirebaseItinerary(docId, firebaseData) {
  let itinerary = firebaseData.itinerary;
  if (!Array.isArray(itinerary)) {
    itinerary = [];
    console.error("No itinerary object was found.");
  }

  // Prepare details, including price.
  let [res, _] = await kiwiSearch(new Itinerary(itinerary));
  let dTime = null;
  let aTime = null;
  let flyFrom = null;
  let flyTo = null;
  let price = -1;
  let currentDate = firebase.firestore.Timestamp.now();

  if (res !== null && typeof res[0] !== "undefined" &&
    typeof res[0].price !== "undefined") {
    price = res[0].price;
    dTime = localeDate(res[0].route[0].dTime);
    aTime = localeDate(res[0].route[res[0].route.length - 1].aTime);
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
  }

  return firebase.firestore()
    .collection("itineraries")
    .doc(docId)
    .update({
      dTime: dTime,
      aTime: aTime,
      flyFrom: flyFrom,
      flyTo: flyTo,
      history: firebase.firestore.FieldValue.arrayUnion({
        price: price,
        retrieved: currentDate,
      }),
    }).then(() => {
      return new Promise((resolve, reject) => {
        if (!Array.isArray(firebaseData.history)) {
          firebaseData.history = [];
        }

        firebaseData.history.push({
          price: price,
          retrieved: currentDate,
        });
        firebaseData.dTime = dTime;
        firebaseData.aTime = aTime;
        firebaseData.flyFrom = flyFrom;
        firebaseData.flyTo = flyTo;

        if (price === -1) {
          reject("Could not update itinerary.");
        }
        else {
          resolve();
        }
      });
    });
}

/**
 * Deletes document in firebase.
 * 
 * @param {string} docId Document id to be deleted.
 */
function deleteFirebaseItinerary(docId) {
  return firebase.firestore()
    .collection("itineraries")
    .doc(docId)
    .delete();
}