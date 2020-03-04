/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when Google OAuth library loads.
 */
function gapiInit() {
  gapi.load("auth2", () => {
    gapi.auth2.init({
      client_id: "773049605239-i20d5b73br9717fipmm8896s5cqpa4s0",
      scope: "profile email",
    });
    gapi.signin2.render("sign-in", {
      "theme": "dark",
      "onsuccess": signUp,
    });
  });
}
  
/**
 * Registers a Google user with the backend.
 * 
 * @param {GoogleUser} googleUser Information about the signed-in user.
 */
function signUp(googleUser) {
  qs("#sign-out").classList.remove("disabled");

  // We need to register an Observer on Firebase Auth to make sure auth
  // is initialized.
  let unsubscribe = firebase.auth().onAuthStateChanged(firebaseUser => {
    unsubscribe();

    // Check if we are already signed into Firebase with the correct user.
    if (!isUserEqual(googleUser, firebaseUser)) {
      // Build Firebase credential with the Google ID token.
      let credential = firebase.auth.GoogleAuthProvider.credential(
          googleUser.getAuthResponse().id_token);
      
      // Sign in with credential from the Google user.
      firebase.auth().signInWithCredential(credential)
                     .catch(e => console.error(e));
    }
  });
}

/**
 * Checks if the Google user and the Firebase user are equal.
 * 
 * @param {GoogleUser} googleUser Google user to be signed in.
 * @param {FirebaseUser} firebaseUser Firebase user to be signed in.
 */
function isUserEqual(googleUser, firebaseUser) {
  if (!googleUser || !firebaseUser) {
    return false;
  }
  for (const profile of firebaseUser.providerData) {
    if (profile.providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
        profile.uid === googleUser.getBasicProfile().getId()) {
      // We don't need to reauth the Firebase connection.
      return true;
    }
  }
  return false;
}

/**
 * Creates an event listener that returns if the user is authenticated or not.
 * Also sets the local storage property to the user's display name/email.
 */
function auth() {
  // Event listener that fires when the authentication state changes.
  firebase.auth().onAuthStateChanged(firebaseUser => {
    // if the user was authenticated
    if (firebaseUser) {
      let name = (firebaseUser.displayName !== null) ?
        firebaseUser.displayName : firebaseUser.email;

      console.log(`${name} signed in successfully.`);

      localStorage.setItem("auth", JSON.stringify({
        uid: firebaseUser.uid,
        name: name,
      }));
    }
    else {
      // remove the authentication state from local storage
      localStorage.removeItem("auth");
    }
    onLoadAuth();
  });
}

/**
 * Calls page specific functions after authentication.
 * onLoadAuth() runs either when:
 *  1) on DOMContentLoaded, right after the document is parsed
 *  2) after signing in, to update the index page
 */
function onLoadAuth() {
  let user = checkAuth();

  // We assume that the user is authenticated through localStorage here until we
  // authenticate with firebase. 
  if (user) {
    qs("#profile").classList.remove("hide");
    qs("#profile").innerHTML = user.name;

    // Switch statement based on what location the window is currently in.
    switch(window.location.pathname) {
      case "/": {
        qs("#sign-in").classList.add("hide");
        qs("#saved-itineraries").classList.remove("hide");
        qs("#sign-out").classList.remove("hide");
        qs("#save").classList.remove("disabled");
        break;
      }
      case "/saved-itineraries.html": {
        qs("#itineraries-authenticated").classList.remove("hide");
        break;
      }
      case "/profile.html": {
        qs("#preferences-authenticated").classList.remove("hide");
        break;
      }
    }
  }
  else { // user is not authenticated
    qs("#profile").classList.add("hide");

    switch(window.location.pathname) {
      case "/": {
        qs("#sign-in").classList.remove("hide");
        qs("#saved-itineraries").classList.add("hide");
        qs("#sign-out").classList.add("hide");
        qs("#save").classList.add("disabled");
        break;
      }
      case "/saved-itineraries.html": {
        qs("#itineraries-unauthenticated").classList.remove("hide");
        break;
      }
      case "/profile.html": {
        qs("#preferences-unauthenticated").classList.remove("hide");
        break;
      }
    }
  }
}

/**
 * Returns if the user is currently authenticated or not.
 * 
 * @return {object} UID and name of authenticated user. Returns null if not
 * found.
 */
function checkAuth() {
  const localAuth = localStorage.getItem("auth");
  return localAuth ? JSON.parse(localAuth) : null;
}

/**
 * Signs out the user from both the Google OAuth API and the Firebase Auth API.
 */
function signOut() {
  const user = checkAuth();
  gapi.auth2.getAuthInstance().signOut().then(() => {
    firebase.auth().signOut().then(() => {
      localStorage.removeItem("auth");
      console.log(`${user.name} signed out successfully.`);
      onLoadAuth();
    });
  }).catch(e => console.error(e));
}
