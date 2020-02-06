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
    "destination": "NRT",
    "earliest-date": "2020-05-22",
  });
  Itinerary.addFlight({
    "origin": "KIX",
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
function main() {
  startWorking();

  // Prepare request.
  let req = new XMLHttpRequest();
  req.open("POST", "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky");
  req.setRequestHeader("Content-Type", "application/json");
  let body = {"requests": []};
  for (let i = 0; i < Itinerary.length; i++) {
    let flight = {
      "fly_from": "airport:" + Itinerary.get(i, 1),
      "fly_to": "airport:" + Itinerary.get(i, 4),
      "date_from": kiwiDate(Itinerary.get(i, 6)),
      "date_to": kiwiDate(Itinerary.get(i, 7)) || kiwiDate(Itinerary.get(i, 6)),
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
    if (Itinerary.get(i, 7)) {
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
      flight["selected_cabins"] = Itinerary.get(i, 12);
    }
    body["requests"].push(flight);
  }
  console.log("Request:");
  console.log(body);

  // Handle response.
  req.onreadystatechange = () => {
    if (!(req.readyState == 4 && (!req.status || req.status == 200))) {
      return;
    }
    res = JSON.parse(req.responseText);
    if (res.length > 0) {
      qsa(".results-message").forEach(el => el.classList.remove("hide"));
    }
    else {
      qsa(".no-results-message").forEach(el => el.classList.remove("hide"));
    }

    // Reformat response for single-flight itineraries.
    if (res.length == 1 && Array.isArray(res[0])) {
      console.log("test");
      res = res[0];
      single = true;
    }
    else {
      single = false;
    }

    // Display results.
    console.log("Response:");
    console.log(res);
    FlightTable.tables.forEach(ft => ft.clearSelection());
    FlightTable.displayResults(res, single);
    stopWorking();
  }
  req.send(JSON.stringify(body));
}
