/*
Five Peas Flight Search
globals.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

const app = {
  version: "v0.2.69",
};

const nbsp = "\u00a0";

/**
 * Function to run when any application page loads.
 */
addEventListener("load", () => {
  qs("#app-version").innerText = app.version;
});

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
