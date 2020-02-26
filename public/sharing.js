/*
Five Peas Flight Search
sharing.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

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
  let res = await Promise.all(prepareFetches())
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(bodies => bodies.flat())
    .catch(error => console.error(error));
  res.sort((a, b) => a.price - b.price);
  let price = -1;
  let dTime = null;
  let aTime = null;
  let flyFrom = null;
  let flyTo = null;
  let currentDate = new Date();

  // Reformat response for single-flight itineraries.
  if (res.length == 1 && Array.isArray(res[0])) {
    res = res[0];
  }

  if (typeof res[0] !== "undefined" && typeof res[0].route !== "undefined"
    && res[0]["route"].length == ItineraryTable.length) {
    price = res[0].price;
    dTime = localeString(res[0].route[0].dTime);
    aTime = localeString(res[0].route[res[0].route.length - 1].aTime);
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
  }

  
  firebase.firestore().collection("itineraries").add({
    uid: user.uid,
    name: qs("#itinerary-name").value || "Untitled",
    itinerary: ItineraryTable.getAll(),
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
 * Shares itinerary by copying URL to clipboard.
 * 
 * @param {string} name Name of itinerary.
 * @param {Object} itinerary Itinerary to be shared.
 * @param {string} button DOM element of share button.
 * @param {string} hiddenInput DOM element of input to use with clipboard.
 *   actions, with prepended "#".
 */
function shareItinerary(name = qs("#itinerary-name").value,
                        itinerary = ItineraryTable.getAll(),
                        button = qs("#share"),
                        hiddenInput = qs("#share-link")) {
  button.classList.add("disabled");

  // Copy URL to clipboard if possible and set the message.
  let url = getShareableLink(name, itinerary);
  let icon, message, color;
  if (url.length > 2048) {
    icon = "error";
    message = "Error: Itinerary is too long to share.";
    color = "red";
  }
  else {
    icon = "content_copy";
    message = "Link copied!";
    color = "";

    hiddenInput.value = url;
    hiddenInput.type = "text";
    hiddenInput.select();
    document.execCommand("copy");
    hiddenInput.type = "hidden";
  }

  // Display message.
  M.toast({
    html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
    displayLength: 1500,
    classes: color,
  });
  button.classList.remove("disabled");
}

/**
 * Loads itinerary from encoded base64 string.
 *
 * @param {string} encoded JSON string encoded in base64.
 */
function loadItinerary(name, encoded) {
  qs("#itinerary-name").value = name;
  for (let flight of decodeItinerary(encoded)) {
    ItineraryTable.addFlight(flight);
  }
}

/**
 * Gets shareable URL.
 * 
 * @param {string} name Name of itinerary.
 * @param {Object} itinerary Object with information about flights.
 */
function getShareableLink(name, itinerary) {
  const n = encodeURIComponent(name);
  const i = encodeItinerary(itinerary);
  return `${window.location.origin.split("?")[0]}?n=${n}&i=${i}`;
}

function encodeItinerary(itinerary) {
  return new Itinerary(itinerary).encoded();
}

function decodeItinerary(encoded) {
  return new Itinerary(encoded).raw();
}
