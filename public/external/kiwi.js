/*
Five Peas Flight Search
kiwi.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

const KIWI_API_URL =
  "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky";

/**
 * Node-specific behaviors.
 */
if (typeof process !== "undefined" && process.release.name === "node") {
  global.fetch = require("node-fetch");
  module.exports = { kiwiSearch };
}

/**
 * Executes a search via Kiwi.
 *
 * @param {!Itinerary} itinerary Itinerary to execute search for.
 * @return {?Array<Object>, ?boolean} Response from Kiwi and boolean indicating
 *     whether the response is in single-flight format, or nulls if the search
 *     failed.
 */
async function kiwiSearch(itinerary) {
  let res = await Promise.all(prepareFetches(itinerary))
    .then(responses =>
      Promise.all(responses.map(res => {
        // Fail all requests if any one fails.
        if (!res){
          throw new Error("Error with fetches");
        }
        return res.json();
      })))
    .then(bodies => bodies.flat())
    .catch(e => console.error(e));

  // If one or more request fails, then return null.
  if (!res) {
    return [null, null];
  }

  // Reformat response for single-flight itineraries.
  if (res.length > 0 && Array.isArray(res[0])) {
    return [res.flat(), true];
  }

  // If the response is empty, improperly formatted, or doesn't have the
  // expected number of flights, then return null.
  if (res.length === 0 ||
      !("route" in res[0]) ||
      res[0]["route"].length !== itinerary.length) {
    return [null, null];
  }

  res.sort((a, b) => a.price - b.price);
  return [res, false];
}

/**
 * Prepares Promises for a search via Kiwi.
 *
 * @param {!Itinerary} Itinerary to execute search for.
 * @return {!Array<Pronise>} Array of Promises.
 */
function prepareFetches(itinerary) {
  // num_airports is dynamically updated when we discover a pipe-separated
  // airport list.
  let num_airports = 1;
  let promises = [];
  for (let a = 0; a < num_airports; a++) {
    let body = {"requests": []};
    for (let i = 0; i < itinerary.length; i++) {
      // Remove whitespace and parse pipes.
      let fly_from = itinerary.get(i, "fly_from", false)
                              .replace(/\s+/g, "").split("|");
      let fly_to = itinerary.get(i, "fly_to", false)
                            .replace(/\s+/g, "").split("|");

      if ((num_airports > 1 && fly_from.length > 1 &&
           num_airports != fly_from.length) ||
          (num_airports > 1 && fly_to.length > 1 &&
           num_airports != fly_to.length)) {
        // Error: pipe-separated airport lists have inconsistent length.
        console.error("Pipe-separated airport lists have inconsistent length")
        return [];
      }
      else {
        num_airports = Math.max(num_airports, fly_from.length, fly_to.length);
      }

      let flight = {
        "fly_from": fly_from[Math.min(fly_from.length - 1, a)],
        "fly_to": fly_to[Math.min(fly_to.length - 1, a)],
        "date_from": kiwiDate(itinerary.get(i, "date_from", false)),
        "date_to": kiwiDate(itinerary.get(i, "date_to", false)) ||
                   kiwiDate(itinerary.get(i, "date_from", false)),
        "adults": 1,
      };
      for (const field of itinerary.usedFields()) {
        if (!(field in flight)) {
          flight[field] = itinerary.get(i, field, false);
        }
      }
      body["requests"].push(flight);
    }
    if (typeof process === "undefined" || process.release.name !== "node") {
      console.log(`Request ${a}:`);
      console.log(body);
    }

    promises.push(fetch(KIWI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
    .catch((error) => {
      console.error(error);
    }));
  }
  return promises;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

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
