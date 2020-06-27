/*
Five Peas Flight Search
globals.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

const app = {
  version: "v0.2.7",
};

const MAX_URL_SIZE = 2048;
const nbsp = "\u00a0";

/**
 * Function to run when any application page loads.
 */
addEventListener("load", () => {
  qs("#app-version").innerText = app.version;
});

/**
 * Function to run when any application page is resized.
 */
addEventListener("resize", () => {
  fixResponsiveTh();
});

/**
 * Fixes the issue where the header row of responsive tables doesn't space
 * properly.
 */
function fixResponsiveTh() {
  for (const table of qsa(".responsive-table")) {
    // Unset the minHeight of <th> and <td> elements.
    for (const cell of table.querySelectorAll("th, td")) {
      cell.style.minHeight = "";
    }
    // On medium and small screens, set the minHeight of <th> and <td> elements.
    if (innerWidth <= 992) {
      let maxHeights = {};
      // First traversal: collect height from all rows.
      for (const row of table.querySelectorAll("tr")) {
        for (let c = 0; c < row.childElementCount; c++) {
          maxHeights[c] = Math.max((maxHeights[c] || 0),
              row.children[c].getBoundingClientRect().height);
        }
      }
      // Second traversal: set minHeight on all rows.
      for (const row of table.querySelectorAll("tr")) {
        for (let c = 0; c < row.childElementCount; c++) {
          row.children[c].style.minHeight = maxHeights[c] + "px";
        }
      }
    }
  }
}

/**
 * Alias of document.querySelector(...).
 *
 * @param {string} str A query string.
 * @return {Element} A DOM element, or null if no matches.
 */
function qs(str) {
  return document.querySelector(str);
}

/**
 * Alias of document.querySelectorAll(...).
 *
 * @param {string} str A query string.
 * @return {NodeList} A list of DOM elements.
 */
function qsa(str) {
  return document.querySelectorAll(str);
}

/**
 * Converts a UNIX timestamp to a locale date string.
 *
 * @param {number} unix A UNIX timestamp.
 * @param {boolean} UTC Whether to treat the timestamp as UTC or local time.
 * @return {string} A locale string.
 */
function localeDate(unix, UTC = true) {
  // Pass strings through for backwards compatibility.
  if (typeof unix === "string") {
    return unix;
  }
  return new Date(unix * 1000).toLocaleString([], {
    timeZone: UTC ? "UTC" : undefined,
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats a numerical dollar amount into a USD currency string.
 *
 * @param {number} amt Numerical dollar amount.
 * @return {string} Formatted dollar amount.
 */
function localeCurrency(amt) {
  return amt.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Shares itinerary by copying URL to clipboard.
 *
 * @param {string} name Name of itinerary.
 * @param {!Itinerary} itinerary Itinerary to be shared.
 * @param {string} button <button> element of share button.
 * @param {string} hiddenInput <input> element for use with clipboard actions.
 */
function shareItinerary(name, itinerary, button, hiddenInput) {
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

/**
 * Converts a Materialize autocomplete data object to a datalist and appends it
 * to the current document body.
 *
 * @param {string} id id of the datalist.
 * @param {!Object<string, string>} autocomplete Materialize autocomplete data
 *     object.
 */
function addDatalist(id, obj) {
  let datalist = document.createElement("DATALIST");
  datalist.id = id;
  for (const key of Object.keys(obj)) {
    let option = document.createElement("OPTION");
    option.value = key;
    datalist.appendChild(option);
  }
  qs("body").appendChild(datalist);
}
