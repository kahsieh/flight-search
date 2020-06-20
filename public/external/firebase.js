/*
Five Peas Flight Search
firebase.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Initializes the Firebase app for use.
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
 * Gets the Firebase ID token.
 *
 * @return {!Promise<string>} Promise for Firebase ID token.
 */
function getFirebaseIdToken() {
  const user = firebase.auth().currentUser;
  return new Promise((resolve, reject) => {
    if (user) {
      user.getIdToken(/* forceRefresh */ true).then(idToken => {
        resolve(idToken);
      }).catch(e => {
        reject(e);
      })
    }
    else {
      reject("Could not find authenticated Firebase user.");
    }
  });
}

/**
 * Creates preferences document in Firestore for new user.
 *
 * @param {string} uid Firebase user's ID.
 */
async function addPreferences(uid) {
  firebase
    .firestore()
    .collection("preferences")
    .doc(uid)
    .set({
      dAirport: "",
      airline: "",
      cabin: "M",
      dTime: "",
    });
}

/**
 * Saves preferences to Firebase.
 *
 * Specific to profile.html.
 */
async function savePreferences() {
  let user = checkAuth();

  if (!user || !user.uid) {
    console.error("User is not authenticated.");
    return;
  }
  qs("#save").classList.add("disabled");

  firebase.firestore().collection("preferences").doc(user.uid).set({
    dAirport: qs("#airport").value || "",
    airline: qs("#airline").value || "",
    cabin: qs("#cabin").value,
    dTime: qs("#time").value || "",
  }).then(() => {
    localStorage.setItem("auth", JSON.stringify({
      uid: user.uid,
      name: user.name,
      dAirport: qs("#airport").value || "",
      airline: qs("#airline").value || "",
      cabin: qs("#cabin").value,
      dTime: qs("#time").value || "",
    }));
    qs("#save").classList.remove("disabled");

    // Show that the preferences were saved.
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
 * Saves itinerary to Firebase.
 *
 * Specific to index.html.
 */
async function saveItinerary() {
  const user = checkAuth();
  if (!user || !user.uid) {
    console.error("User is not authenticated.");
    return;
  }

  // Prohibit excessively large itineraries (not encodable as a URL of ≤ 2,048
  // characters).
  const name = qs("#itinerary-name").value || "Untitled";
  if (itable.get().link(name).length > MAX_URL_SIZE) {
    M.toast({
      html: `<i class="material-icons left">error</i>
             <div>Error: Itinerary is too long to save.</div>`,
      displayLength: 1500,
      classes: "red"
    });
    return;
  }

  // Disable save button.
  const saveButton = event.currentTarget;
  saveButton.classList.add("disabled");

  // Prepare details, including price.
  let [res, _] = await kiwiSearch(itable.get());
  let currentDate = firebase.firestore.Timestamp.now();
  let dTime = null;
  let aTime = null;
  let flyFrom = null;
  let flyTo = null;
  let price = -1;
  if (res !== null &&
      typeof res[0] !== "undefined" &&
      typeof res[0].price !== "undefined") {
    dTime = res[0].route[0].dTime;
    aTime = res[0].route[res[0].route.length - 1].aTime;
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
    price = res[0].price;
  }

  // Send to Firebase.
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
    // Show that the itinerary was saved.
    console.log(`Document written by ${user.name} with ID: ${docRef.id}`);
    saveButton.classList.remove("disabled");
    M.toast({
      html: `<i class="material-icons left">star</i>
             <div>Itinerary saved!</div>`,
      displayLength: 1500
    });
  }).catch(e => {
    console.error("Error adding document:", e);
    saveButton.classList.remove("disabled");
    M.toast({
      html: `<i class="material-icons left">error</i>
             <div>Couldn't save itinerary.</div>`,
      displayLength: 1500,
      classes: "red"
    });
  });
}

/**
 * Returns preferences saved by the user.
 *
 * @param {string} uid UID of user.
 */
function getFirebasePreferences(uid) {
  return firebase.firestore()
    .collection("preferences")
    .doc(uid)
    .get()
    .then(doc => {
      return doc.data();
    });
}

/**
 * Returns all itineraries saved by the user.
 *
 * @param {string} uid UID of user.
 * @return {!Promise<Array<Object>>} Promise for saved itineraries.
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
 * Updates itinerary in Firebase.
 *
 * @param {string} docId Document ID to be updated.
 * @param {!Array} firebaseData Firebase data with itinerary, row to be updated.
 * @return {!Promise} Promise indicating success/failure of update action.
 */
async function updateFirebaseItinerary(docId, firebaseData) {
  const itinerary = firebaseData.itinerary;
  if (!Array.isArray(itinerary) || !Array.isArray(firebaseData.history)) {
    console.error("Bad input to updateFirebaseItinerary");
  }

  // Prepare details, including price.
  let [res, _] = await kiwiSearch(new Itinerary(itinerary));
  let currentDate = firebase.firestore.Timestamp.now();
  let dTime = null;
  let aTime = null;
  let flyFrom = null;
  let flyTo = null;
  let price = -1;
  if (res !== null &&
      typeof res[0] !== "undefined" &&
      typeof res[0].price !== "undefined") {
    dTime = res[0].route[0].dTime;
    aTime = res[0].route[res[0].route.length - 1].aTime;
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
    price = res[0].price;
  }

  // Send to Firebase.
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
 * @param {string} docId Document ID to be deleted.
 * @return {!Promise} Promise indicating success/failure of deletion action.
 */
function deleteFirebaseItinerary(docId) {
  return firebase.firestore()
    .collection("itineraries")
    .doc(docId)
    .delete();
}

/**
 * Identifies whether an object is a Firebase timestamp.
 *
 * @param {*} obj A JavaScript object.
 * @return {boolean} Whether the object is a Firebase timestamp.
 */
function isFirebaseTimestamp(obj) {
  return typeof obj === "object" &&
         Object.keys(obj).length === 2 &&
         typeof obj.nanoseconds === "number" &&
         typeof obj.seconds === "number";
}
