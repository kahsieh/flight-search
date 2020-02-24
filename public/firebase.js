/*
Five Peas Flight Search
firebase.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

// Runs as soon as the document is loaded.
addEventListener("DOMContentLoaded", () => {
  auth();
})

addEventListener("load", () => {
  initFirebase();
});

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
 * Function to run when Google Sign-in library loads.
 */
function gapiInit() {
  gapi.load("auth2", () => {
    gapi.auth2.init({
      client_id: "773049605239-i20d5b73br9717fipmm8896s5cqpa4s0",
      scope: "profile email",
    });
    gapi.signin2.render("sign-in", {
      "theme": "dark",
      "onsuccess": signup,
    });
  });
}

/**
 * Registers a Google User with the backend.
 * 
 * @param {GoogleUser} googleUser Information about the signed-in user.
 */
function signup(googleUser) {
  /**
   * 
   * @param {GoogleUser} googleUser 
   * @param {FirebaseUser} firebaseUser 
   */
  function isUserEqual(googleUser, firebaseUser) {
    if (firebaseUser) {
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
            providerData[i].uid === googleUser.getBasicProfile().getId()) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  }
  
  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (!isUserEqual(googleUser, firebaseUser)) {
      var credential = firebase.auth.GoogleAuthProvider.credential(
        googleUser.getAuthResponse().id_token);
      
      firebase.auth().signInWithCredential(credential).catch(error => {
        console.error(error);
      });
    }

    if (firebaseUser) {
      let name = (typeof firebaseUser.displayName !== "undefined") ?
        firebaseUser.displayName : firebaseUser.email;

      console.log(`${name} signed in successfully.`);

      localStorage.setItem("auth", JSON.stringify({
        authenticated: true,
        name: name,
      }));
      auth();
    }
    else {
      localStorage.removeItem("auth");
    }
  });
}

function auth() {
  let authStorage = JSON.parse(localStorage.getItem("auth"));

  if (authStorage) {
    qs("#greeting").classList.remove("hide");
    qs("#greeting").innerHTML = authStorage.name;

    switch(window.location.pathname) {
      case "/": {
        qs("#sign-in").classList.add("hide");
        qs("#saved-itineraries").classList.remove("hide");
        qs("#sign-out").classList.remove("hide");
        qs("#save").classList.remove("disabled");
        break;
      }
      case "/saved-itineraries.html": {
        qs("#itineraries-unauthenticated").classList.add("hide");
        qs("#itineraries-authenticated").classList.remove("hide");

        // loads itinerary table (found in saved-itineraries.js)
        displayItineraries();
        break;
      }
    }
  }
}

function signout() {
  let authStorage = JSON.parse(localStorage.getItem("auth"));

  gapi.auth2.getAuthInstance().signOut().then(() => {
    firebase.auth().signOut().then(() => {
      console.log(`${authStorage.name} signed out successfully.`);
      localStorage.removeItem("auth");
      location.reload();
    });
  }).catch(error => {
    console.error(error);
  });
}