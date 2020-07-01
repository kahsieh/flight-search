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
  // Initialize the ItineraryTable.
  itable = new ItineraryTable(
      qs("#itinerary-name"),
      qs("#filters"),
      qs("#itinerary"),
      qs("#remove-flight"),
      _ => new FlightTable(qs("#tabs"),
                           qs("#columns"),
                           qs("#tables"),
                           qs("#book")),
      i => ftables[i].remove()
  );

  // Initialize Materialize selects (and fix iOS touch propagation bug).
  M.FormSelect.init(qsa("select"), {});
  for (const e of qsa("li[id^='select-options']")) {
    e.ontouchend = event => event.stopPropagation();
  }

  // Initialize Materialize tooltips.
  M.Tooltip.init(qsa("#title-tooltip"), {});

  // Add autocorrect event listener.
  qs("#itinerary-name").onblur = () => autocorrect["itinerary-name"]();

  // Load flights into the ItineraryTable.
  loadFlights();
});

/**
 * Loads the ItineraryTable based on user preferences.
 */
function loadFlights() {
  // Stop if the ItineraryTable isn't initialized yet.
  if (!itable) {
    return;
  }
  // Remove all flights.
  while (itable.length != 0) {
    itable.removeFlight();
  }
  // Try to populate the ItineraryTable from the URL.
  if (itable.loadFromURL()) {
    return;
  }

  // Create some dates for default flights.
  let date1 = new Date();
  date1.setDate(date1.getDate() + 14);
  let date2 = new Date();
  date2.setDate(date2.getDate() + 21);

  // Use user preferences if available.
  const user = checkAuth();
  if (user && user.uid) {
    // Hide the latest date column to save screen space if we're going to show
    // the airline, cabin, or earliest departure time columns.
    if (user.airline !== Itinerary.DEFAULTS["select_airlines"] ||
        user.cabin !== Itinerary.DEFAULTS["selected_cabins"]  ||
        user.dTime !== Itinerary.DEFAULTS["dtime_from"]) {
      qs("#filters option[value='date_to']").selected = false;
    }
    itable.loadFromItinerary(new Itinerary([
      {
        "fly_from": user.dAirport,
        "select_airlines": user.airline,
        "selected_cabins": user.cabin,
        "max_stopovers": 2,
        "dtime_from": user.dTime,
        "date_from": date1.toISOString().substring(0, 10),
      },
      {
        "select_airlines": user.airline,
        "selected_cabins": user.cabin,
        "max_stopovers": 2,
        "dtime_from": user.dTime,
        "date_from": date2.toISOString().substring(0, 10),
      },
    ]));
  }
  else {
    itable.loadFromItinerary(new Itinerary([
      {
        "max_stopovers": 2,
        "date_from": date1.toISOString().substring(0, 10),
      },
      {
        "max_stopovers": 2,
        "date_from": date2.toISOString().substring(0, 10),
      },
    ]));
  }
}

/**
 * Adds flight based on user preference.
 */
function addFlightWithPreferences() {
  let user = checkAuth();
  if (user && user.uid) {
    itable.addFlight(new Itinerary([
      {
        "select_airlines": user.airline,
        "selected_cabins": user.cabin,
        "max_stopovers": 2,
        "dtime_from": user.dTime,
      },
    ]));
  }
  else {
    itable.addFlight();
  }
}

/**
 * Function to run when search button is pressed.
 */
async function search() {
  // Update UI.
  qs("#add-flight").classList.add("disabled");
  qs("#remove-flight").classList.add("disabled");
  qs("#search").classList.add("disabled");
  qs("#spinner").classList.remove("hide");
  qsa(".results-message").forEach(e => e.classList.add("hide"));
  qsa(".no-results-message").forEach(e => e.classList.add("hide"));
  qsa(".suggestion").forEach(e => e.classList.add("hide"));
  ftables.forEach(ft => ft.clearSelection());

  // Execute fetches.
  let [res, single] = await kiwiSearch(itable.get());

  if (res && res.length > 0) {
    // Display message.
    qsa(".results-message").forEach(e => e.classList.remove("hide"));

    // Display results.
    console.log("Response:");
    console.log(res);
    FlightTable.displayResults(res, single);
  }
  else {
    FlightTable.displayResults([], true);
    qsa(".no-results-message").forEach(e => e.classList.remove("hide"));

    // Unhide the first applicable suggestion.
    let suggestion = Infinity;
    const itinerary = itable.get();
    for (let i = 0; i < itinerary.length; i++) {
      if (itinerary.get(i, "fly_from", false) === "" ||
          itinerary.get(i, "fly_to", false) === "") {
        suggestion = Math.min(suggestion, 0);
      }
      if (itinerary.get(i, "max_stopovers", false) === "0") {
        suggestion = Math.min(suggestion, 1);
      }
      if (itinerary.get(i, "selected_cabins", false) !== "M") {
        suggestion = Math.min(suggestion, 2);
      }
      if (itinerary.get(i, "date_to", false) === "") {
        suggestion = Math.min(suggestion, 3);
      }
    }
    if (suggestion !== Infinity) {
      qsa(".suggestion")[suggestion].classList.remove("hide");
    }
  }

  // Update UI.
  qs("#add-flight").classList.remove("disabled");
  qs("#remove-flight").classList.remove("disabled");
  qs("#search").classList.remove("disabled");
  qs("#spinner").classList.add("hide");
}

/**
 * Function to run when share button is pressed.
 */
function share() {
  shareItinerary(qs("#itinerary-name").value, itable.get(), qs("#share"),
                 qs("#share-link"));
}

/**
 * Function to collapse a shrinkable section.
 *
 * @param {Element} element Expanded element.
 * @param {function} func A function which changes the element's height.
 */
function collapseSection(element, func) {
  // Get the height of the element's inner content, regardless of its actual
  // size.
  const sectionHeight = element.scrollHeight;

  // Temporarily disable all CSS transitions.
  const elementTransition = element.style.transition;
  element.style.transition = "";

  // On the next frame (as soon as the previous style change has taken effect),
  // explicitly set the element's height to its current pixel height, so we
  // aren't transitioning out of "auto".
  requestAnimationFrame(() => {
    element.style.height = sectionHeight + "px";
    element.style.transition = elementTransition;

    // On the next frame (as soon as the previous style change has taken
    // effect), have the element transition to the smaller height.
    requestAnimationFrame(() => {
      func();
      element.style.height =
        (window.innerWidth < 993 ? 0 : element.querySelector("thead").scrollHeight) +
        element.querySelector("tbody").scrollHeight + "px";
    });
  });

  // Mark the section as "currently collapsed".
  element.setAttribute("data-collapsed", "true");
}

/**
 * Function to expand a shrinkable element.
 *
 * @param {Element} element Collapsed element.
 */
function expandSection(element) {
  // Get the height of the element's inner content, regardless of its actual
  // size.
  const sectionHeight = element.scrollHeight;

  // Have the element transition to the height of its inner content.
  element.style.height = sectionHeight + "px";

  // When the next CSS transition finishes (which should be the one we just
  // triggered):
  element.addEventListener("transitionend", function func(e) {
    // Remove this event listener so it only gets triggered once.
    element.removeEventListener("transitionend", func);
    // Remove "height" from the element's inline styles, so it can return to
    // its initial value.
    element.style.height = null;
  });

  // Mark the section as "currently expanded".
  element.setAttribute("data-collapsed", "false")
}
