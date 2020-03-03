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
  itable = new ItineraryTable(qs("#itinerary-name"),
                              qs("#filters"),
                              qs("#itinerary"),
                              qs("#remove-flight"),
                              _ => new FlightTable(qs("#tabs"),
                                                   qs("#columns"),
                                                   qs("#tables"),
                                                   qs("#book")),
                              i => ftables[i].remove());

  if (!itable.loadFromURL()) {
    let date1 = new Date();
    date1.setDate(date1.getDate() + 14);
    let date2 = new Date();
    date2.setDate(date2.getDate() + 21);
    itable.loadFromItinerary(new Itinerary([
      {
        "max_stopovers": 2,
        "date_from": date1.toISOString().substring(0, 10)
      },
      {
        "max_stopovers": 2,
        "date_from": date2.toISOString().substring(0, 10)
      },
    ]));
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
  ftables.forEach(ft => ft.clearSelection());

  // Execute fetches.
  let [res, single] = await kiwiSearch(itable.get());

  if (res) {
    // Display message.
    qsa(".results-message").forEach(el => el.classList.remove("hide"));

    // Display results.
    console.log("Response:");
    console.log(res);
    FlightTable.displayResults(res, single);
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
 * Shares itinerary currently in the ItineraryTable by copying URL to clipboard.
 */
function share() {
  shareItinerary(qs("#itinerary-name").value,
                 table.get(),
                 qs("#share"),
                 qs("#share-link"));
}

/**
 * Prevents the triggering block from shrinking.
 */
function stick() {
  const min_height = parseInt(event.currentTarget.style.minHeight);
  const height = event.currentTarget.getBoundingClientRect().height;
  if (!min_height || min_height < height) {
    event.currentTarget.style.minHeight = parseInt(height) + "px";
  }
}
