/*
Five Peas Flight Search
firebase.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

// Runs as soon as the document is loaded.
addEventListener("DOMContentLoaded", () => {
  onLoadAuth();
})

addEventListener("load", () => {
  initFirebase();

  // signup already calls auth, so we do not have to run it twice
  if (window.location.pathname !== "/") {
    auth();
  }
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