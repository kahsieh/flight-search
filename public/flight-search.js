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
 *
 */
function prepareFetches() {
  let num_airports = 1; // Notice that num_airports is dynamically updated as we discover additional airports
  let promises = [];
  for (let a = 0; a < num_airports; a++) {
    let body = {"requests": []};
    for (let i = 0; i < Itinerary.length; i++) {
      let curr_num_airports = Math.max(Itinerary.get(i, "fly_from").split("|").length, Itinerary.get(i, "fly_to").split("|").length);
      if (num_airports > 1 && curr_num_airports > 1 && num_airports != curr_num_airports){
        // Error
        return [];
      }
      else{
        num_airports = Math.max(num_airports, curr_num_airports);
      }

      let flight = {
        "fly_from": "airport:" + Itinerary.get(i, "fly_from").split("|")[Math.min(Itinerary.get(i, "fly_from").split("|").length - 1, a)],
        "fly_to": "airport:" + Itinerary.get(i, "fly_to").split("|")[Math.min(Itinerary.get(i, "fly_to").split("|").length - 1, a)],
        "date_from": kiwiDate(Itinerary.get(i, "date_from")),
        "date_to": kiwiDate(Itinerary.get(i, "date_to")) || kiwiDate(Itinerary.get(i, "date_from")),
        "adults": 1,
      };
      const optional_fields = [
        "max_stopovers",
        "stopover_from",
        "stopover_to",
        "select_stop_airport",
        "select_stop_airport_exclude",
        "select_airlines",
        "select_airlines_exclude",
        "dtime_from",
        "dtime_to",
        "atime_from",
        "atime_to",
        "max_fly_duration",
        "adult_hold_bag",
        "adult_hand_bag",
        "selected_cabins",
      ];
      for (const field of optional_fields) {
        if (Itinerary.get(i, field)) {
          flight[field] = Itinerary.get(i, field);
        }
      }
      body["requests"].push(flight);
    }
    console.log("Request:");
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

/**
 * Function to run when application loads.
 */
addEventListener("load", () => {
  qs("#app-version").innerText = app.version;
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
});

/**
 * Function to run when search button is pressed.
 */
async function main() {
  startWorking();

  // Prepare fetches
  let fetches = prepareFetches();

  // Execute fetches
  let res = await Promise.all(fetches)
  .then(values => {
    let res = [];
    values.forEach(value => res = res.concat(value.json()));
    return Promise.all(res);
  }).then(values => {
    let res = [];
    values.forEach(value => res = res.concat(value));
    return res;
  }).catch(function(error) {
    console.error(error);
  });

  // Reformat response for single-flight itineraries.
  if (res.length == 1 && Array.isArray(res[0])) {
    res = res[0];
    single = true;
  }
  else {
    single = false;
  }

  // Display results
  if (res.length > 0) {
    qsa(".results-message").forEach(el => el.classList.remove("hide"));
  }
  else {
    qsa(".no-results-message").forEach(el => el.classList.remove("hide"));
  }

  console.log("Response:");
  console.log(res);
  FlightTable.tables.forEach(ft => ft.clearSelection());
  FlightTable.displayResults(res, single);
  stopWorking();
}
