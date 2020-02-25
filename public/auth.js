/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

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
 * Registers a Google User and Firebase User with the backend.
 * 
 * @param {GoogleUser} googleUser Information about the signed-in user.
 */
function signup(googleUser) {
  auth(googleUser);
}

/**
 * Checks if the google user and the firebase user are equal.
 * 
 * @param {GoogleUser} googleUser Google user to be signed in.
 * @param {FirebaseUser} firebaseUser Firebase user to be signed in.
 */
function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    var providerData = firebaseUser.providerData;
    for (var i = 0; i < providerData.length; i++) {
      if (providerData[i].providerId ===
        firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
        providerData[i].uid === googleUser.getBasicProfile().getId()) {
        // We don't need to reauth the Firebase connection.
        return true;
      }
    }
  }
  return false;
}

/**
 * Creates an event listener that returns if the user is authenticated or not.
 * Also sets the local storage property to the user's display name/email.
 * 
 * @param {GoogleUser} googleUser Google user to check authentication state with
 * when called from signup()
 */
function auth(googleUser = undefined) {
  // Event listener that fires when the authentication state changes.
  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (typeof googleUser !== "undefined" && 
      !isUserEqual(googleUser, firebaseUser)) {
      let credential = firebase.auth.GoogleAuthProvider.credential(
        googleUser.getAuthResponse().id_token);
      
      firebase.auth().signInWithCredential(credential).catch(error => {
        console.error(error);
      });
    }

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

  // we assume that the user is authenticated here until 
  if (user) {
    qs("#greeting").classList.remove("hide");
    qs("#greeting").innerHTML = user.name;

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
    }
  }
  else {
    switch(window.location.pathname) {
      case "/saved-itineraries.html": {
        qs("#itineraries-unauthenticated").classList.remove("hide");
        break;
      }
    }
  }
}

/**
 * Returns if the user is currently authenticated or not.
 * 
 * @return {string} UID of authenticated user.
 */
function checkAuth() {
  let user = JSON.parse(localStorage.getItem("auth"));

  if (!user) {
    return;
  }
  else {
    let name = (user.displayName !== null) ? user.displayName : user.email;

    return user;
  }
}

/**
 * Signs out the user from both the Google client API and the Firebase auth API
 */
function signout() {
  let user = checkAuth();

  gapi.auth2.getAuthInstance().signOut().then(() => {
    firebase.auth().signOut().then(() => {
      console.log(`${user.name} signed out successfully.`);
      localStorage.removeItem("auth");
      location.reload();
    });
  }).catch(error => {
    console.error(error);
  });
}