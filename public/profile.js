/*
Five Peas Flight Search
profile.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when the saved itineraries page loads.
 */
addEventListener("load", () => {
  auth();
});

function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/auth");
  xhr.onload = () => {
    let body = JSON.parse(xhr.responseText);
    if (xhr.readyState === xhr.DONE && xhr.status === 200 &&
        body.authenticated) {
      
    }
    else {
      
    }
  }
  xhr.send();
}