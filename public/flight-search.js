/*
Five Peas Flight Search
flight-search.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when main page loads.
 */
addEventListener("load", () => {
  // If we're not on the main page, immediately break out of the function.
  if (window.location.pathname !== "/") {
    return;
  }

  // Decode URL parameters.
  let url_params = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    (_, key, value) => url_params[key] = decodeURIComponent(value));

  // Load the itinerary if one is specified via URL parameters, otherwise load
  // a default itinerary.
  if ("n" in url_params && "i" in url_params) {
    loadItinerary(url_params["n"], url_params["i"]);
  }
  else {
    let date = new Date();
    date.setDate(date.getDate() + 14);
    ItineraryTable.addFlight({
      "date_from": date.toISOString().substring(0, 10)
    });
    date.setDate(date.getDate() + 7);
    ItineraryTable.addFlight({
      "date_from": date.toISOString().substring(0, 10)
    });
    // ItineraryTable.addFlight({
    //   "fly_from": "LAX",
    //   "max_stopovers": 1,
    //   "fly_to": "KHH",
    //   "date_from": "2020-05-15",
    // });
    // ItineraryTable.addFlight({
    //   "fly_from": "KHH",
    //   "max_stopovers": 0,
    //   "fly_to": "NRT|KIX",
    //   "date_from": "2020-05-22",
    // });
    // ItineraryTable.addFlight({
    //   "fly_from": "KIX|NRT",
    //   "max_stopovers": 0,
    //   "fly_to": "KHH",
    //   "date_from": "2020-05-29",
    // });
    // ItineraryTable.addFlight({
    //   "fly_from": "KHH",
    //   "max_stopovers": 1,
    //   "fly_to": "LAX",
    //   "date_from": "2020-06-05",
    // });
  }

  // Initialize Materialize elements.
  M.FormSelect.init(qsa("select"), {});
});

/**
 * Function to run when search button is pressed.
 */
async function search() {
  // Update UI.
  qs("#add-flight").classList.add("disabled");
  qs("#remove-flight").classList.add("disabled");
  qs("#search").classList.add("disabled");
  qs("#spinner").classList.remove("hide");
  qsa(".results-message").forEach(el => el.classList.add("hide"));
  qsa(".no-results-message").forEach(el => el.classList.add("hide"));
  FlightTable.tables.forEach(ft => ft.clearSelection());

  // Execute fetches.
  let res = await Promise.all(prepareFetches())
    .then((responses) => {
      return Promise.all(responses.map((res) => {
        if (!res){
          throw new Error("Error with fetches");
        }
        return res.json();
      }))
    })
    .then(bodies => bodies.flat())
    .catch((error) => {
      console.error(error);
    });

  if (res) {
    // Reformat response for single-flight itineraries.
    let single = false;
    if (res.length == 1 && Array.isArray(res[0])) {
      res = res[0];
      single = true;
    }

    if (single ||
        res.length > 0 && typeof res[0]["route"] !== "undefined" &&
        res[0]["route"].length == ItineraryTable.length) {
      // Display message.
      qsa(".results-message").forEach(el => el.classList.remove("hide"));  

      // Display results.
      res.sort((a, b) => a.price - b.price);
      console.log("Response:");
      console.log(res);
      FlightTable.displayResults(res, single);
    }
    else {
      FlightTable.displayResults([], true);
      qsa(".no-results-message").forEach(el => el.classList.remove("hide"));
    }
  }
  else {
    FlightTable.displayResults([], true);
    qsa(".no-results-message").forEach(el => el.classList.remove("hide"));
  }

  // Update UI.
  qs("#add-flight").classList.remove("disabled");
  qs("#remove-flight").classList.remove("disabled");
  qs("#search").classList.remove("disabled");
  qs("#spinner").classList.add("hide");
}

/**
 * Prepares Promises for calls to the Kiwi API based on the input.
 *
 * @return {Array} Array of Promises.
 */
function prepareFetches(itineraries = ItineraryTable.getAll(true)) {
  // num_airports is dynamically updated when we discover a pipe-separated
  // airport list.
  let num_airports = 1;
  let promises = [];
  for (let a = 0; a < num_airports; a++) {
    let body = {"requests": []};
    for (let i = 0; i < itineraries.length; i++) {
      let curr_num_airports = Math.max(
        itineraries[i]["fly_from"].split("|").length,
        itineraries[i]["fly_to"].split("|").length
      );
      if (num_airports > 1 && curr_num_airports > 1 &&
          num_airports != curr_num_airports) {
        // Error: pipe-separated airport lists have inconsistent length.
        return [];
      }
      else {
        num_airports = Math.max(num_airports, curr_num_airports);
      }

      let fly_from = itineraries[i]["fly_from"].split("|");
      let fly_to = itineraries[i]["fly_to"].split("|");
      let flight = {
        "fly_from": fly_from[Math.min(fly_from.length - 1, a)],
        "fly_to": fly_to[Math.min(fly_to.length - 1, a)],
        "date_from": kiwiDate(itineraries[i]["date_from"]),
        "date_to": kiwiDate(itineraries[i]["date_to"]) ||
                   kiwiDate(itineraries[i]["date_from"]),
        "adults": 1,
      };
      for (const field of optional_fields) {
        if (field == "conn_on_diff_airport") {
          if (!itineraries[i][field]) {
            flight[field] = 0;
          }
        }
        else if (itineraries[i][field]) {
          // This won't automatically add falsy values to the request.
          flight[field] = itineraries[i][field];
        }
      }
      body["requests"].push(flight);
    }
    console.log(`Request ${a}:`);
    console.log(body);

    promises.push(fetch("https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    .catch((error) => {
      console.error(error);
    }));
  }
  return promises;
}
