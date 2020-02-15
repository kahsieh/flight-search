/**
 * Save itinerary when button is pressed. Sends an http request to the backend to upload data to firebase.
 */
async function saveItinerary() {
  qs('#save-itinerary').classList.add('disabled');

  let fetches = prepareFetches();
  let res = await Promise.all(fetches)
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(bodies => bodies.flat())
    .catch(error => console.error(error));
  res.sort((a, b) => a.price - b.price);

  sendHttpRequest({
    price: res[0].price,
    itinerary: Itinerary.getAll()
  });

  // show that the itinerary was saved
  M.toast({
    html: 'Itinerary saved!',
    displayLength: 1500,
    completeCallback: () => { qs('#save-itinerary').classList.remove('disabled'); }
  });
}

/**
 * Sends HTTP request to backend.
 */
function sendHttpRequest(jsonData) {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/save-itinerary');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(jsonData));
}

/**
 * loads itinerary from encoded base64 string.
 *
 * @param {string} encoded JSON string encoded in base64.
 */
function loadItinerary(encoded) {
  let itinerary = decodeItinerary(encoded);
  
  for (let i = 0; i < itinerary.length; i++) {
    Itinerary.addFlight(itinerary[i]);
  }
}

/**
 * shares itinerary by copying url to clipboard
 */
function shareItinerary() {
  qs('#share-itinerary').classList.add('disabled');

  let itinerary = Itinerary.getAll();
  let url = window.location.href.split('?')[0] + '?itinerary=' + encodeItinerary(itinerary);
  let message;
  let color = '';
  if (url.length > 2048) {
    console.error(url + ' is too long.');
    message = 'Error: Itinerary is too long to be saved.';
    color += 'red';
  }
  else {
    let hiddenInput = qs('#share-itinerary-link');
    
    message = 'Copied to clipboard!';
    hiddenInput.value = url;
    hiddenInput.type = 'text';
    hiddenInput.select();
    document.execCommand('copy');
    hiddenInput.type = 'hidden';
  }

  // show that the itinerary was copied to clipboard
  M.toast({
    html: message,
    displayLength: 1500,
    classes: color,
    completeCallback: () => { qs('#share-itinerary').classList.remove('disabled'); }
  });
}

/**
 * @param {number} length The size of the key array generated.
 * 
 * @return {Array} Array of alphabetical keys, formatted as such: ['a', 'b', ... 'A', 'B', ... 'aa', 'bb', ...]
 * 
 * note: This is not an efficient way to encode a string, but it works for its purpose
 * right now, if the length > 52, the strings become like this: 'aa', 'bb', 'cc', ...
 * what we can do to change this would be to have it so it goes like: 'aa', 'ab', 'ac', ...
 * but this also means that the required_fields and optional_fields arrays would be > 104 in size,
 * which is not worth the extra effort.
 */
function createKeys(length) {
  let keys = [];
  let key = 'a';
  let offset = 0;
  for (let i = 0; i < length; i++) {
    if (i % 52 === 0 && i !== 0) {
      key = key.substring(0, key.length - 1) + key[key.length - 1].toLowerCase();
      key += 'a';
      offset += 26;
    }
    else if (i % 26 === 0 && i !== 0) {
      key = key.substring(0, key.length - 1) + key[key.length - 1].toUpperCase();
      offset += 26;
    }

    let string = '';
    for (let j = 0; j < key.length; j++) {
      string += String.fromCharCode(key[j].charCodeAt(0) + i - offset);
    }
    keys.push(string);
  }

  return keys;
}

/**
 * converts itinerary from JSON to base64. We change all property names first to be associated with smaller keys.
 * These keys are based on the alphabet so that the base64 string is not as big.
 * 
 * @param {Object} itinerary JSON object that will be minified, converted to a string, and then encoded to base64
 * 
 * @return {string} base64 string that encoded the JSON object
 */
function encodeItinerary(itinerary) {
  let encoded = [];
  let keys = createKeys(required_fields.length + optional_fields.length);

  for (let i = 0; i < itinerary.length; i++) {
    let flight = itinerary[i];
    let flightObj = {};
    let j = 0;
    for (; j < required_fields.length; j++) {
      let field = required_fields[j];
      if (typeof flight[field] !== 'undefined') {
        flightObj[keys[j]] = flight[field];
      }
    }

    for(; j < required_fields.length + optional_fields.length; j++) {
      let field = optional_fields[j - required_fields.length];
      if (typeof flight[field] !== 'undefined') {
        flightObj[keys[j]] = flight[field];
      }
    }

    encoded.push(flightObj);
  }

  return btoa(JSON.stringify(encoded));
}

/**
 * decodes itinerary from base64 to JSON. We change all property names from our smaller keys, to the actual display names.
 * 
 * @param {string} encoded base64 string that will be decoded and unminified
 * 
 * @return {Object} object containing flight info
 */
function decodeItinerary(encoded) {
  encoded = JSON.parse(atob((encoded)));
  let decoded = [];
  let keys = createKeys(required_fields.length + optional_fields.length);

  for (let i = 0; i < encoded.length; i++) {
    let flight = encoded[i];
    let flightObj = {};
    let j = 0;
    for (; j < required_fields.length; j++) {
      let key = keys[j];
      if (typeof flight[key] !== 'undefined') {
        flightObj[required_fields[j]] = flight[key];
      }
    }

    for (; j < required_fields.length + optional_fields.length; j++) {
      let key = keys[j];
      if (typeof flight[key] !== 'undefined') {
        flightObj[optional_fields[j - required_fields.length]] = flight[key];
      }
    }

    decoded.push(flightObj);
  }

  return decoded;
}