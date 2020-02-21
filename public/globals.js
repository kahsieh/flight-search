/*
Five Peas Flight Search
globals.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

const app = {
  version: "v0.1.0",
};

const required_fields = [
  "fly_from",
  "fly_to",
  "date_from",
  "date_to",
];

const optional_fields = [
  "select_airlines",
  "select_airlines_exclude",
  "adult_hold_bag",
  "adult_hand_bag",
  "selected_cabins",
  "mix_with_cabins",
  "adults",
  "price_from",
  "price_to",
  "select_stop_airport",
  "select_stop_airport_exclude",
  "max_stopovers",
  "stopover_from",
  "stopover_to",
  "conn_on_diff_airport",
  "fly_days",
  "dtime_from",
  "dtime_to",
  "atime_from",
  "atime_to",
  "max_fly_duration",
  "nights_in_dst_from",
  "nights_in_dst_to",
];

// list of default values (that are not empty strings)
// to be used for select/checkbox inputs.
// you can also specify default values for text inputs as well
const default_values = {
  "select_airlines_exclude": false,
  "adult_hold_bag": "0",
  "adult_hand_bag": "0",
  "selected_cabins": "M",
  "mix_with_cabins": "", // this is a select option, not input
  "select_stop_airport_exclude": false,
  "max_stopovers": "2",
  "conn_on_diff_airport": true,
  "fly_days": "0,1,2,3,4,5,6",
}

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

/**
 * Escapes a string so that it can be used as HTML attribute content.
 * 
 * @param {string} str An untrusted string.
 * @return {string} A string suitable for use as HTML attribute content.
 */
function escape(str) {
  switch (typeof str) {
    case "string":
      return str.replace(/./g, c => `&#${c.charCodeAt(0)};`);
    case "number":
      return str;
    case "boolean":
      return str;
    default:
      return "";
  }
}

/**
 * Dismisses previous toast, if there is one.
 */
function dismissToast() {
  let toastElement = qs(".toast");
  if (toastElement !== null) {
    M.Toast.getInstance(toastElement).dismiss();
  }
}