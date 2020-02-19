/*
Five Peas Flight Search
flightsearch.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

// -----------------------------------------------------------------------------
// GLOBALS
// -----------------------------------------------------------------------------

const app = {
  version: "v0.1.0",
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Disables the search button, shows the spinner, and hides any messages.
 */
function startWorking() {
  qs("#search").disabled = true;
  qs("#spinner").classList.remove("hide");
  qsa(".results-message").forEach(el => el.classList.add("hide"));
  qsa(".no-results-message").forEach(el => el.classList.add("hide"));
}

/**
 * Enables the search button and hides the spinner.
 */
function stopWorking() {
  qs("#search").disabled = false;
  qs("#spinner").classList.add("hide");
}

/**
 * Prepares Promises for calls to the Kiwi API based on the input.
 *
 * @return {Array} Array of Promises.
 */
function prepareFetches() {
  // num_airports is dynamically updated when we discover a pipe-separated
  // airport list.
  let num_airports = 1;
  let promises = [];
  for (let a = 0; a < num_airports; a++) {
    let body = {"requests": []};
    for (let i = 0; i < Itinerary.length; i++) {
      let curr_num_airports = Math.max(
        Itinerary.get(i, "fly_from").split("|").length,
        Itinerary.get(i, "fly_to").split("|").length
      );
      if (num_airports > 1 && curr_num_airports > 1 &&
          num_airports != curr_num_airports) {
        // Error: pipe-separated airport lists have inconsistent length.
        return [];
      }
      else {
        num_airports = Math.max(num_airports, curr_num_airports);
      }

      let fly_from = Itinerary.get(i, "fly_from").split("|");
      let fly_to = Itinerary.get(i, "fly_to").split("|");
      let flight = {
        "fly_from": "airport:" + fly_from[Math.min(fly_from.length - 1, a)],
        "fly_to": "airport:" + fly_to[Math.min(fly_to.length - 1, a)],
        "date_from": kiwiDate(Itinerary.get(i, "date_from")),
        "date_to": kiwiDate(Itinerary.get(i, "date_to")) ||
                   kiwiDate(Itinerary.get(i, "date_from")),
        "adults": 1,
      };
      for (const field of optional_fields) {
        // "" won't be added, but be careful of 0 and false.
        if (field == "conn_on_diff_airport") {
          if (!Itinerary.get(i, field)) {
            flight[field] = 0;
          }
        }
        else if (Itinerary.get(i, field)) {
          flight[field] = Itinerary.get(i, field);
        }
      }
      body["requests"].push(flight);
    }
    console.log(`Request ${a}:`);
    console.log(body);

    promises.push(fetch("https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }));
  }

  return promises;
}

// -----------------------------------------------------------------------------
// APPLICATION
// -----------------------------------------------------------------------------

function gapi_init() {
  const client_id_dev = "773049605239-66ll1k7igb4fre0n1ounatv5ruj7bvfi";
  const client_id_prod = "773049605239-i20d5b73br9717fipmm8896s5cqpa4s0";
  gapi.load("auth2", () => {
    gapi.auth2.init({
      client_id: window.location == "localhost"
               ? `${client_id_dev}.apps.googleusercontent.com`
               : `${client_id_prod}.apps.googleusercontent.com`,
      scope: "profile email"
    });
    gapi.signin2.render("sign-in", {
      "theme": "dark",
      "onsuccess": onSignIn
    });
  });
}

/**
 * Function to run when application loads.
 */
addEventListener("load", () => {
  qs("#app-version").innerText = app.version;

  let urlParams = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (match, key, value) => {
    urlParams[key] = decodeURIComponent(value);
  });

  if (Object.entries(urlParams).length !== 0) {
    loadItinerary(urlParams['n'], urlParams['i']);
  }
  else { // load default itinerary if none specified, could change/delete this later
    Itinerary.addFlight({
      "fly_from": "LAX",
      "max_stopovers": 1,
      "fly_to": "KHH",
      "date_from": "2020-05-15",
    });
    Itinerary.addFlight({
      "fly_from": "KHH",
      "max_stopovers": 0,
      "fly_to": "NRT|KIX",
      "date_from": "2020-05-22",
    });
    Itinerary.addFlight({
      "fly_from": "KIX|NRT",
      "max_stopovers": 0,
      "fly_to": "KHH",
      "date_from": "2020-05-29",
    });
    Itinerary.addFlight({
      "fly_from": "KHH",
      "max_stopovers": 1,
      "fly_to": "LAX",
      "date_from": "2020-06-05",
    });
  }
  
  M.FormSelect.init(qsa("select"), {});
});

/**
 * Function to run when search button is pressed.
 */
async function search() {
  startWorking();

  // Execute fetches.
  let fetches = prepareFetches();
  let res = await Promise.all(fetches)
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(bodies => bodies.flat())
    .catch(error => console.error(error));

  // Reformat response for single-flight itineraries.
  let single = false;
  if (res.length == 1 && Array.isArray(res[0])) {
    res = res[0];
    single = true;
  }

  // Display message.
  if (res.length > 0) {
    qsa(".results-message").forEach(el => el.classList.remove("hide"));
  }
  else {
    qsa(".no-results-message").forEach(el => el.classList.remove("hide"));
  }

  // Display results.
  res.sort((a, b) => a.price - b.price);
  console.log("Response:");
  console.log(res);
  FlightTable.tables.forEach(ft => ft.clearSelection());
  FlightTable.displayResults(res, single);
  stopWorking();
}
