/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * We run onLoadAuth() as soon as possible, which assumes the user is still
 * authenticated as long as auth is present in localStorage. This is to prevent
 * the behavior where the Google  sign-in button from shows up on page load and
 * then immediately changes to the authenticated buttons.
 */
addEventListener("DOMContentLoaded", () => {
  onLoadAuth();
});

addEventListener("load", () => {
  initFirebase();
  auth();
});

// -----------------------------------------------------------------------------
// SIGN-IN FLOW
// -----------------------------------------------------------------------------

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
    // If we're already signed into Firebase with the correct user, stop.
    if (isUserEqual(googleUser, firebaseUser)) {
      return;
    }

    // Build Firebase credential with the Google ID token.
    let credential = firebase.auth.GoogleAuthProvider.credential(
        googleUser.getAuthResponse().id_token);
    // Sign in with credential from the Google user.
    firebase.auth().signInWithCredential(credential)
                   .then(userCredential => {
                     if (userCredential.additionalUserInfo.isNewUser) {
                       addPreferences(userCredential.user.uid);
                     }
                   })
                   .catch(e => console.error(e));
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

// -----------------------------------------------------------------------------
// REAUTH FLOW
// -----------------------------------------------------------------------------

/**
 * Creates an event listener that sets the local storage auth item when the
 * Firebase auth state changes, then updates the UI.
 */
function auth() {
  firebase.auth().onAuthStateChanged(firebaseUser => {
    // If the user is authenticated, update the local storage item.
    if (firebaseUser) {
      let name = firebaseUser.displayName || firebaseUser.email;
      console.log(`${name} signed in successfully.`);

      getFirebasePreferences(firebaseUser.uid).then(data => {
        const latestPrefs = JSON.stringify({
          uid: firebaseUser.uid,
          name: name,
          airline: Itinerary.VERIFIERS.select_airlines(data.airline)
                   ? data.airline : "",
          cabin: Itinerary.VERIFIERS.selected_cabins(data.cabin)
                 ? data.cabin : "M",
          dAirport: Itinerary.VERIFIERS.fly_from(data.dAirport)
                    ? data.dAirport : "",
          dTime: Itinerary.VERIFIERS.dtime_from(data.dTime)
                 ? data.dTime : "",
        });
        if (latestPrefs !== localStorage.getItem("auth")) {
          localStorage.setItem("auth", latestPrefs);
          onLoadAuth();
        }
      });
    }
    // Otherwise, remove the authentication state from local storage.
    else {
      localStorage.removeItem("auth");
      onLoadAuth();
    }
  });
}

/**
 * Makes page-specific UI changes after authentication. This function runs:
 *  1) On DOMContentLoaded, and
 *  2) On sign in/sign out.
 */
function onLoadAuth() {
  const user = checkAuth();

  // We assume that the user is authenticated if the local storage auth item is
  // set.
  if (user && user.uid) {
    qs("#profile").classList.remove("hide");
    qs("#profile").textContent = user.name;
    switch (window.location.pathname.replace(/\/{2,}/g, _ => "/")) {
      case "/":
      case "/index.html":
        qs("#sign-in").classList.add("hide");
        qs("#saved-itineraries").classList.remove("hide");
        qs("#sign-out").classList.remove("hide");
        qs("#save").classList.remove("disabled");
        loadFlights();
        break;
      case "/saved-itineraries.html":
        qs("#itineraries-authenticated").classList.remove("hide");
        break;
      case "/profile.html":
        qs("#preferences-authenticated").classList.remove("hide");
        break;
    }
  }
  else {  // user not authenticated
    qs("#profile").classList.add("hide");
    switch (window.location.pathname) {
      case "/":
      case "/index.html":
        qs("#sign-in").classList.remove("hide");
        qs("#saved-itineraries").classList.add("hide");
        qs("#sign-out").classList.add("hide");
        qs("#save").classList.add("disabled");
        loadFlights();
        break;
      case "/saved-itineraries.html":
        qs("#itineraries-unauthenticated").classList.remove("hide");
        break;
      case "/profile.html":
        qs("#preferences-unauthenticated").classList.remove("hide");
        break;
    }
  }
}

/**
 * Returns the local storage auth item.
 *
 * @return {?Object<string, string>} Local storage auth item containing UID and
 *   name of authenticated user. Returns null if not found.
 */
function checkAuth() {
  const localAuth = localStorage.getItem("auth");
  return localAuth ? JSON.parse(localAuth) : null;
}

// -----------------------------------------------------------------------------
// SIGN-OUT FLOW
// -----------------------------------------------------------------------------

/**
 * Signs out the user from both the Google OAuth API and the Firebase Auth API.
 */
function signOut() {
  const user = checkAuth();
  gapi.auth2.getAuthInstance().signOut().then(() => {
    firebase.auth().signOut().then(() => {
      console.log(`${user.name} signed out successfully.`);
    });
  }).catch(e => console.error(e));
}
