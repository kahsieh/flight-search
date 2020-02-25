/*
Five Peas Flight Search
sharing.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

/**
 * Saves the itinerary. Uploads the data to Firebase.
 */
async function saveItinerary() {
  qs("#save").classList.add("disabled");

  // Prepare details, including price.
  let res = await Promise.all(prepareFetches())
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(bodies => bodies.flat())
    .catch(error => console.error(error));
  res.sort((a, b) => a.price - b.price);
  let price = -1;
  let dTime = "NONE";
  let aTime = "NONE";
  let flyFrom = "NONE";
  let flyTo = "NONE";
  let currentDate = new Date();

  // Reformat response for single-flight itineraries.
  if (res.length == 1 && Array.isArray(res[0])) {
    res = res[0];
  }

  if (typeof res[0] !== "undefined" && typeof res[0].route !== "undefined") {
    price = res[0].price;
    dTime = localeString(res[0].route[0].dTime);
    aTime = localeString(res[0].route[res[0].route.length - 1].aTime);
    flyFrom = res[0].route[0].flyFrom;
    flyTo = res[0].route[res[0].route.length - 1].flyTo;
  }

  let [uid, name] = checkAuth();

  if (uid) {
    firebase.firestore().collection("itineraries").add({
      uid: uid,
      name: qs("#itinerary-name").value || "Untitled",
      itinerary: Itinerary.getAll(),
      created: currentDate,
      updated: currentDate,
      price: price,
      dTime: dTime,
      aTime: aTime,
      flyFrom: flyFrom,
      flyTo: flyTo,
    }).then(docRef => {
      console.log(`Document written by ${name} with ID: ${docRef.id}`);
    }).catch(error => {
      console.error("Error adding document:", error);
    }).then(() => {
      qs("#save").classList.remove("disabled");

      // Show that the itinerary was saved.
      M.toast({
        html: `<i class="material-icons left">star</i>
          <div>Itinerary saved!</div>`,
        displayLength: 1500
      });
    });
  }
}

/**
 * Shares itinerary by copying URL to clipboard.
 * 
 * @param {string} name Name of itinerary.
 * @param {Object} itinerary Itinerary to be shared.
 * @param {string} button_id id of share button with prepended "#".
 * @param {string} hidden_input_id id of hidden input to use with clipboard
 *   actions, with prepended "#".
 */
function shareItinerary(name = qs("#itinerary-name").value,
                        itinerary = Itinerary.getAll(),
                        button_id = "#share",
                        hidden_input_id = "#share-link") {
  qs(button_id).classList.add("disabled");

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

    let hidden_input = qs(hidden_input_id);
    hidden_input.value = url;
    hidden_input.type = "text";
    hidden_input.select();
    document.execCommand("copy");
    hidden_input.type = "hidden";
  }

  // Display message.
  M.toast({
    html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
    displayLength: 1500,
    classes: color
  });
  qs(button_id).classList.remove("disabled")
}

/**
 * Loads itinerary from encoded base64 string.
 *
 * @param {string} encoded JSON string encoded in base64.
 */
function loadItinerary(name, encoded) {
  qs("#itinerary-name").value = name;
  for (let flight of decodeItinerary(encoded)) {
    Itinerary.addFlight(flight);
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


/**
 * Generates an array of small keys.
 * 
 * @param {number} length The size of the key array to be generated.
 * @return {Array} Array of alphabetical keys ordered as:
 *   ["a", "b", ..., "A", "B", ..., "aa", "bb", ...]
 * 
 * Note: This is not the most efficient sequence of keys, but it works for its
 * purpose right now. If the length > 52, the strings become like this: "aa",
 * "bb", "cc", ... and what we can do to change this would be to have it so it
 * goes like: "aa", "ab", "ac", ... but this also means there would have to be
 * > 104 fields, so it's not worth the extra effort.
 */
function createKeys(length) {
  let keys = [];
  let key = "a";
  let offset = 0;
  for (let i = 0; i < length; i++) {
    if (i % 52 === 0 && i !== 0) {
      key = key.substring(0, key.length - 1)
          + key[key.length - 1].toLowerCase() + "a";
      offset += 26;
    }
    else if (i % 26 === 0 && i !== 0) {
      key = key.substring(0, key.length - 1)
          + key[key.length - 1].toUpperCase();
      offset += 26;
    }

    let string = "";
    for (let j = 0; j < key.length; j++) {
      string += String.fromCharCode(key[j].charCodeAt(0) + i - offset);
    }
    keys.push(string);
  }
  return keys;
}

/**
 * Converts itinerary from objects to base64. We change all property names
 * first to be associated with smaller keys. These keys are based on the
 * alphabet so that the base64 string is not as big.
 * 
 * @param {Array} itinerary Array of objects that will be minified, converted
 *   to a string, and then encoded to base64.
 * @return {string} base64 string that encodes the JSON object.
 */
function encodeItinerary(itinerary) {
  const keys = createKeys(required_fields.length + optional_fields.length);
  let encoded = [];
  for (const flight of itinerary) {
    let minified = {};
    // Shrink required field names.
    let j = 0;
    for (; j < required_fields.length; j++) {
      const field = required_fields[j];
      if (flight[field] !== undefined) {
        minified[keys[j]] = flight[field];
      }
    }
    // Shrink optional field names.
    for (; j < required_fields.length + optional_fields.length; j++) {
      const field = optional_fields[j - required_fields.length];
      if (flight[field] !== undefined) {
        minified[keys[j]] = flight[field];
      }
    }
    encoded.push(minified);
  }
  return btoa(JSON.stringify(encoded));
}

/**
 * Decodes itinerary from base64 to objects. We change all property names from
 * our smaller keys to the actual display names.
 * 
 * @param {string} encoded base64 string that will be decoded and unminified.
 * @return {Array} Array of objects containing flight info.
 */
function decodeItinerary(encoded) {
  const keys = createKeys(required_fields.length + optional_fields.length);
  let decoded = [];
  for (const minified of JSON.parse(atob((encoded)))) {
    let flight = {};
    // Expand required field names.
    let j = 0;
    for (; j < required_fields.length; j++) {
      const key = keys[j];
      if (minified[key] !== undefined) {
        flight[required_fields[j]] = minified[key];
      }
    }
    // Expand optional field names.
    for (; j < required_fields.length + optional_fields.length; j++) {
      const key = keys[j];
      if (minified[key] !== undefined) {
        flight[optional_fields[j - required_fields.length]] = minified[key];
      }
    }
    decoded.push(flight);
  }
  return decoded;
}
