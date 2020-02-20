/*
Five Peas Flight Search
globals.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

const app = {
  version: "v0.1.0",
};

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
 * Converts a date from ISO format to en-GB format.
 *
 * @param {string} str An ISO date.
 * @return {string} An en-GB date.
 */
function kiwiDate(str) {
  if (!str) {
    return "";
  }
  return new Date(str).toLocaleDateString("en-GB", {timeZone: "UTC"});
}

/**
 * Converts a UTC UNIX timestamp to a locale string.
 *
 * @param {number} unix A UTC UNIX timestamp.
 * @return {string} A locale string.
 */
function localeString(unix) {
  return new Date(unix * 1000).toLocaleString([], {
    timeZone: "UTC",
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Extracts the time in HH:MM format from a UTC UNIX time stamp.
 *
 * @param {number} unix A UTC UNIX timestamp.
 * @return {string} A time in HH:MM format.
 */
function isoTime(unix) {
  return new Date(unix * 1000).toLocaleString([], {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Converts centimeters to inches.
 *
 * @param {number} cm A length in centimeters.
 * @return {number} A length in inches.
 */
function cmToIn(cm) {
  return cm / 2.54;
}

/**
 * Converts kilograms to pounds.
 *
 * @param {number} kg A mass in kilograms.
 * @return {number} A mass in pounds.
 */
function kgToLb(kg) {
  return kg / 0.45359237;
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
