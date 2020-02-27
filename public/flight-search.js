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

  itable = new ItineraryTable(qs("#itinerary-name"),
                              qs("#filters"),
                              qs("#itinerary"),
                              qs("#remove-flight"));

  if (!itable.loadFromURL()) {
    let date1 = new Date();
    date1.setDate(date1.getDate() + 14);
    let date2 = new Date();
    date2.setDate(date1.getDate() + 21);
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
  FlightTable.tables.forEach(ft => ft.clearSelection());

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
 * Shares itinerary by copying URL to clipboard.
 * 
 * @param {string} name Name of itinerary.
 * @param {Object} itinerary Itinerary to be shared.
 * @param {string} button DOM element of share button.
 * @param {string} hiddenInput DOM element of input to use with clipboard.
 *   actions, with prepended "#".
 */
function shareItinerary(name = qs("#itinerary-name").value,
                        itinerary = itable.get(),
                        button = qs("#share"),
                        hiddenInput = qs("#share-link")) {
  button.classList.add("disabled");

  // Copy URL to clipboard if possible and set the message.
  let url = itinerary.link(name);
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

    hiddenInput.value = url;
    hiddenInput.type = "text";
    hiddenInput.select();
    document.execCommand("copy");
    hiddenInput.type = "hidden";
  }

  // Display message.
  M.toast({
    html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
    displayLength: 1500,
    classes: color,
  });
  button.classList.remove("disabled");
}
