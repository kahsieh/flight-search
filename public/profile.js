/*
Five Peas Flight Search
auth.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when Profile.html loads.
 */
addEventListener("load", () => {
  // Initialize Materialize selects.
  M.FormSelect.init(qsa("select"), {});

  //Initialize autocompletes
  const trim = e =>
      e.value = e.value.includes(" - ") ? e.value.split(" - ")[1] : e.value;
  let autocomplete_airline =
    qs("#airline")
  M.Autocomplete.init(autocomplete_airline, {
      data: airlines,
      onAutocomplete: () => trim(autocomplete_airline),
      limit: 5
  });
  let autocomplete_airport =
    qs("#airport");
  M.Autocomplete.init(autocomplete_airport, {
    data: airports,
    onAutocomplete: () => trim(autocomplete_airport),
    limit: 5
  });
});