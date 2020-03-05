/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * We run onLoadAuth() and assume the user is still authenticated from
 * localStorage. This is to prevent buggy behavior with the Google SignIn
 * button showing up and then the authenticated buttons appearing, by just
 * having the authenticated buttons appearing instead.
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
                  .then((userCredential) => {
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
 * Firebase auth state changes.
 */
function auth() {
  firebase.auth().onAuthStateChanged(firebaseUser => {
    // If the user is authenticated, upload the local storage item.
    if (firebaseUser) {
      let name = firebaseUser.displayName || firebaseUser.email;
      console.log(`${name} signed in successfully.`);
      
      getFirebasePreferences(firebaseUser.uid).then(data => {
        localStorage.setItem("auth", JSON.stringify({
          uid: firebaseUser.uid,
          name: name,
          dAirport: data.dAirport,
          airline: data.airline,
          cabin: data.cabin,
          dtime: data.dTime,
        }));
        onLoadAuth();
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
 *  1) After sign in/sign out in.
 *  2) Right after DOMContentLoaded fires.
 */
function onLoadAuth() {
  const user = checkAuth();

  // We assume that the user is authenticated if the local storage auth item is
  // set.
  if (user && user.uid) {
    qs("#profile").classList.remove("hide");
    qs("#profile").textContent = user.name;
    switch (window.location.pathname) {
      case "/":
      case "/index.html":
        qs("#sign-in").classList.add("hide");
        qs("#saved-itineraries").classList.remove("hide");
        qs("#sign-out").classList.remove("hide");
        qs("#save").classList.remove("disabled");
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
      localStorage.removeItem("auth");
      console.log(`${user.name} signed out successfully.`);
      onLoadAuth();
    });
  }).catch(e => console.error(e));
}
