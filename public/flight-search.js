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
      let curr_num_airports = Math.max(Itinerary.get(i, 1).split("|").length, Itinerary.get(i, 4).split("|").length);
      if (num_airports > 1 && curr_num_airports > 1 && num_airports != curr_num_airports){
        // Error
        return [];
      }
      else{
        num_airports = Math.max(num_airports, curr_num_airports);
      }
      
      let flight = {
        "fly_from": "airport:" + Itinerary.get(i, 1).split("|")[Math.min(Itinerary.get(i, 1).split("|").length - 1, a)],
        "fly_to": "airport:" + Itinerary.get(i, 4).split("|")[Math.min(Itinerary.get(i, 4).split("|").length - 1, a)],
        "date_from": kiwiDate(Itinerary.get(i, 6)),
        "date_to": kiwiDate(Itinerary.get(i, 8)) || kiwiDate(Itinerary.get(i, 6)),
        "adults": 1,
      };
      if (Itinerary.get(i, 2)) {
        flight["max_stopovers"] = Itinerary.get(i, 2);
      }
      if (Itinerary.get(i, 3)) {
        flight["select_stop_airport"] = Itinerary.get(i, 3);
      }
      if (Itinerary.get(i, 5)) {
        flight["select_airlines"] = Itinerary.get(i, 5);
      }
      if (Itinerary.get(i, 8)) {
        flight["dtime_from"] = Itinerary.get(i, 8);
      }
      if (Itinerary.get(i, 9)) {
        flight["dtime_to"] = Itinerary.get(i, 9);
      }
      if (Itinerary.get(i, 10)) {
        flight["atime_from"] = Itinerary.get(i, 10);
      }
      if (Itinerary.get(i, 11)) {
        flight["atime_to"] = Itinerary.get(i, 11);
      }
      if (Itinerary.get(i, 12)) {
        flight["max_fly_duration"] = Itinerary.get(i, 12);
      }
      if (Itinerary.get(i, 13)) {
        flight["adult_hold_bag"] = Itinerary.get(i, 13);
      }
      if (Itinerary.get(i, 14)) {
        flight["adult_hand_bag"] = Itinerary.get(i, 14);
      }
      if (Itinerary.get(i, 15)) {
        flight["selected_cabins"] = Itinerary.get(i, 15);
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
    "origin": "LAX",
    "max-stops": 1,
    "destination": "KHH",
    "earliest-date": "2020-05-15",
  });
  Itinerary.addFlight({
    "origin": "KHH",
    "max-stops": 0,
    "destination": "NRT|KIX",
    "earliest-date": "2020-05-22",
  });
  Itinerary.addFlight({
    "origin": "KIX|NRT",
    "max-stops": 0,
    "destination": "KHH",
    "earliest-date": "2020-05-29",
  });
  Itinerary.addFlight({
    "origin": "KHH",
    "max-stops": 1,
    "destination": "LAX",
    "earliest-date": "2020-06-05",
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
