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
  M.toast({html: 'Itinerary saved!', displayLength: 1500, completeCallback: () => {qs('#save-itinerary').classList.remove('disabled');}});
}

function sendHttpRequest(jsonData) {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/save-itinerary');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(jsonData));
}

function loadItinerary(encoded) {
  let encodedObj = JSON.parse(atob((encoded)));

  console.log(encodedObj);
  // run decodeItinerary on this
  // then have the flow so that the changes are pushed to flight-search.js
}

function shareItinerary() {
  let itinerary = Itinerary.getAll();

  console.log(window.location.href + '?itinerary=' + encodeItinerary(itinerary));
}

/*
  this is not an efficient way to encode a string, but it works for its purpose
  right now, if the length > 52, the strings become like this: 'aa', 'bb', 'cc', ...
  what we can do to change this would be to have it so it goes like: 'aa', 'ab', 'ac', ...
  but this also means that the required_fields and optional_fields arrays would be > 104 in size,
  which is not worth the extra effort.
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
      let field = optional_fields[j];
      if (typeof flight[field] !== 'undefined') {
        flightObj[keys[j]] = flight[field];
      }
    }

    encoded.push(flightObj);
  }

  return btoa(JSON.stringify(encoded));
}

function decodeItinerary() {
  
}