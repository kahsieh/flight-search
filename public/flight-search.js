/*
Five Peas Flight Search
flight-search.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

/**
 * Function to run when main page loads.
 */
addEventListener("load", () => {
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

  // Execute fetches.
  let res = await Promise.all(prepareFetches())
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
        if (field == "conn_on_diff_airport") {
          if (!Itinerary.get(i, field)) {
            flight[field] = 0;
          }
        }
        else if (Itinerary.get(i, field)) {
          // This won't automatically add falsy values to the request.
          flight[field] = Itinerary.get(i, field);
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
    }));
  }
  return promises;
}
