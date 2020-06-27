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
  // Initialize Materialize selects (and fix iOS touch propagation bug).
  M.FormSelect.init(qsa("select"), {});
  for (const e of qsa("li[id^='select-options']")) {
    e.ontouchend = event => event.stopPropagation();
  }

  // Initialize Materialize autocompletes.
  const airlineInput = qs("#airline");
  const trim = e =>
    e.value = e.value.includes(" - ") ? e.value.split(" - ")[1] : e.value;
  M.Autocomplete.init(airlineInput, {
    data: airlines,
    onAutocomplete: () => trim(airlineInput),
    limit: 5
  });

  // Add autocorrect event listeners.
  qs("#airport").onblur = () => autocorrect["airports"]();
  airlineInput.onblur = () => autocorrect["airlines"]();

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
