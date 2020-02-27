/*
Five Peas Flight Search
itinerary.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

"use strict";

class Itinerary {
  /**
   * Constructs an Itinerary from a matrix representation.
   * 
   * @param {!Array<Object<string, *>>|string} raw Matrix representation of 
   *     itinerary with rows indexed by flight index and columns indexed by
   *     field name. The representation may be in base64-encoded form.
   */
  constructor(raw) {
    if (typeof raw === "string") {
      raw = Itinerary._decoded(raw);
    }
    this._raw = filterEntries(raw, ([k, v]) =>
        k in Itinerary.DEFAULTS && v !== Itinerary.DEFAULTS[k]);
  }

  get length() { return this._raw.length; }

  /**
   * Retrieves a value from the itinerary.
   * 
   * @param {number} i Flight index.
   * @param {string} field Field name.
   * @param {boolean=} escaped Escape non-default values.
   * @return {any} Field value.
   */
  get(i, field, escaped = true) {
    return field in this._raw[i]
         ? (escaped ? escape(this._raw[i][field]) : this._raw[i][field])
         : Itinerary.DEFAULTS[field];
  }

  /**
   * Finds names of fields containing non-default values in this Itinerary.
   * 
   * @return {!Set<string>} Set of fields with non-default values.
   */
  usedFields() {
    let fields = new Set();
    for (const flight of this._raw) {
      for (const k in flight) {
        fields.add(k);
      }
    }
    return fields;
  }

  /**
   * Returns the Itinerary's matrix representation.
   * 
   * @return {!Array<Object<string, *>>} Matrix representation as Object.
   */
  raw() {
    return this._raw;
  }

  /**
   * Encodes the Itinerary's matrix representation in base64 with minified keys.
   * 
   * @return {string} Matrix representation in base64.
   */
  encoded() {
    const keys = createKeys(Itinerary.FIELDS.length);
    let minified = mapEntries(this._raw, ([k, v]) =>
        [keys[Itinerary.FIELDS.indexOf(k)], v]);
    return btoa(JSON.stringify(minified));
  }

  /**
   * Gets a sharable URL for the itinerary.
   * 
   * @param {string} name Name for this Itinerary.
   */
  link(name) {
    return `${location.origin.split("?")[0]}?n=${name}&i=${this.encoded()}`;
  }

  /**
   * Decodes a base64-encoded matrix representation into Object form.
   *
   * @param {string} str Matrix representation in base64.
   * @return {Array<Object<string, *>>} Matrix representation in Object form.
   */
  static _decoded(str) {
    const keys = createKeys(Itinerary.FIELDS.length);
    let minified = JSON.parse(atob(str));
    return mapEntries(minified, ([k, v]) =>
        [Itinerary.FIELDS[keys.indexOf(k)], v]);
  }
}

// -----------------------------------------------------------------------------
// STATIC FIELDS
// -----------------------------------------------------------------------------

/**
 * Dictionary mapping supported field names to their default values on Kiwi.
 * Non-default values should be explicitly specified in requests to Kiwi.
 */
Itinerary.DEFAULTS = {
  "fly_from": "",
  "fly_to": "",
  "date_from": "",
  "date_to": "",
  "select_airlines": "",
  "select_airlines_exclude": false,
  "adult_hold_bag": "0",
  "adult_hand_bag": "0",
  "selected_cabins": "M",
  "mix_with_cabins": "",
  "price_from": "",
  "price_to": "",
  "select_stop_airport": "",
  "select_stop_airport_exclude": false,
  "max_stopovers": "",
  "stopover_from": "",
  "stopover_to": "",
  "conn_on_diff_airport": true,
  "fly_days": "0,1,2,3,4,5,6",
  "dtime_from": "",
  "dtime_to": "",
  "atime_from": "",
  "atime_to": "",
  "max_fly_duration": "",
};

/**
 * List of supported fields.
 */
Itinerary.FIELDS = Object.keys(Itinerary.DEFAULTS);

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Generates an array of lexicographically increasing strings.
 * 
 * @param {number} length The number of strings to be generated.
 * @return {Array<string>} Array of lexicographically increasing strings:
 *     ["a", "b", ..., "A", "B", ..., "aa", "ab", ...]
 */
function createKeys(length) {
  // Represent a string as a reversed sequence of indices into an alphabet.
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sequence = [];

  let keys = [];
  for (let i = 0; i < length; i++) {
    // Increment the string.
    for (let j = 0; j <= sequence.length; j++) {
      // Increment the jth character and if it doesn't carry, then break.
      if (j < sequence.length) {
        sequence[j] = (sequence[j] + 1) % alphabet.length;
        if (sequence[j] !== 0) {
          break;
        }
      }
      // If there's nothing left to increment, then push a new character.
      else {
        sequence.push(0);
        break;
      }
    }
    // Convert sequence into an actual string and add it to keys.
    keys.push(sequence.map(i => alphabet[i]).reverse().join(""));
  }
  return keys;
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
 * Calls filter on each entry of objects in an array.
 *
 * @param {!Array<Object>} arr An array of Objects.
 * @param {function} f Filtering function.
 * @return {!Array<Object>} Result.
 */
function filterEntries(arr, f) {
  return arr.map(obj => Object.fromEntries(Object.entries(obj).filter(f)));
}

/**
 * Calls map on each entry of objects in an array.
 *
 * @param {!Array<Object>} arr An array of Objects.
 * @param {function} f Mapping function.
 * @return {!Array<Object>} Result.
 */
function mapEntries(arr, f) {
  return arr.map(obj => Object.fromEntries(Object.entries(obj).map(f)));
}
