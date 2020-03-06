/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when profile.html loads.
 */
addEventListener("load", () => {
  // Initialize Materialize selects.
  M.FormSelect.init(qsa("select"), {});

  // Initialize Materialize autocompletes.
  const trim = e =>
    e.value = e.value.includes(" - ") ? e.value.split(" - ")[1] : e.value;
  const autocomplete_airline = qs("#airline")
  M.Autocomplete.init(autocomplete_airline, {
    data: airlines,
    onAutocomplete: () => trim(autocomplete_airline),
    limit: 5
  });
  let autocomplete_airport = qs("#airport");
  M.Autocomplete.init(autocomplete_airport, {
    data: airports,
    onAutocomplete: () => trim(autocomplete_airport),
    limit: 5
  });

  // Load field values based on pre-existing user preferences.
  loadPreferencePage();
});

/**
 * Loads preference fields based on user's previous preferences.
 */
function loadPreferencePage() {
  let user = checkAuth();
  if (!user || !user.uid) {
    console.error("User is not authenticated.");
    return;
  }

  qs("#airport").value = user.dAirport;
  qs("#airline").value = user.airline;
  qs("#time").value = user.dTime;
  if (["M", "W", "C", "F"].includes(user.cabin)) {
    qs(`#cabin [value=${user.cabin}]`).selected = true;
  }
}
