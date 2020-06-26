/*
Five Peas Flight Search
airlines.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * KV of airlines and their logos for autocomplete.
 */
let airlines = {};
fetch("https://api.skypicker.com/carriers")
  .then(res => res.json())
  .then(arr => {
    for (const entry of arr) {
      if (entry.id.length == 2 && !entry.name.includes("cargo") &&
          entry.type === "airline") {
        airlines[`${entry.name} - ${entry.id}`] =
          `https://images.kiwi.com/airlines/64/${entry.id}.png`;
      }
    }

    // Append to document as a datalist.
    if (document.readyState === "complete") {
      addDatalist("airlines", airlines)
    }
    else {
      addEventListener("DOMContentLoaded",
                       () => addDatalist("airlines", airlines));
    }
  });
