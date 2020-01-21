/*
Five Peas Flight Search
flightsearch.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

// -----------------------------------------------------------------------------
// GLOBALS
// -----------------------------------------------------------------------------

const app = {
  version: "v0.1.0",
};

const flights_api = "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky";

const columns = [
  "Flight",
  "Departure",
  "Arrival",
  "Flight Time",
  "Aircraft",
  "Fare Class",
  "Duration",
  "Stops",
  "Price",
];

// Stored response from server.
let single = null;
let res = null;

// State of tables.
let tabs_instance = null;
let displayed_flights = [];
let selected_flights = [];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Wrapper for document.querySelector(...).
 * 
 * @param {string} str A query string.
 * @return {Element} A DOM element, or null if no matches.
 */
function qs(str) {
  return document.querySelector(str);
}

/**
 * Wrapper for document.querySelectorAll(...).
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
 * Retrieves the value from a cell in the input table.
 * 
 * @param {number} row Row number.
 * @param {number} col Column number.
 * @return {string} Current value of cell.
 */
function getInput(row, col) {
  return qs("#itinerary").children[row]  // tr
                         .children[col]  // td
                         .children[0]  // div
                         .children[0]  // div
                         .children[0]  // input
                         .value;
}

/**
 * Sets the value of a cell in the put table.
 * 
 * @param {number} row Row number.
 * @param {number} col Column number.
 * @param {any} val New value for cell.
 */
function setInput(row, col, val) {
  qs("#itinerary").children[r]  // tr
                  .children[c]  // td
                  .children[0]  // div
                  .children[0]  // div
                  .children[0]  // input
                  .value = val;
}

/**
 * Disables the search button, shows the spinner, and hides any messages.
 */
function startWorking() {
  qs("#search").disabled = true;
  qs("#spinner").classList.remove("hide");
  qs("#results-message").classList.add("hide");
  qs("#no-results-message").classList.add("hide");
}

/**
 * Enables the search button and hides the spinner.
 */
function stopWorking() {
  qs("#search").disabled = false;
  qs("#spinner").classList.add("hide");
}

// -----------------------------------------------------------------------------
// APPLICATION
// -----------------------------------------------------------------------------

/**
 * Function to run when application loads.
 */
addEventListener("load", () => {
  qs("#app-version").innerText = app.version;
  addFlight(["LAX", "", "NYC", "", "2020-04-24", "", "2020-04-24", ""]);
  addFlight(["NYC", "", "LAX", "", "2020-04-27", "", "2020-04-27", ""]);
});

/**
 * Adds a flight to the itinerary.
 * 
 * @param {Array<string>} cells Optional. Values to pre-populate the row with.
 */
function addFlight(cells = null) {
  if (!cells) {
    cells = [];
    for (let i = 0; i < columns.length; i++) {
      cells.push("");
    }
  }
  let last_index = qs("#itinerary").childElementCount;

  // Save active tab.
  let active_tab = -1;
  for (const [i, e] of qsa("#tabs a").entries()) {
    if (e.classList.contains("active")) {
      active_tab = i;
      break;
    }
  }

  // Destroy old instance and remove any indicators.
  if (tabs_instance) {
    tabs_instance.destroy();
  }
  qsa("#tabs .indicator").forEach(e => e.remove());

  // Operate.
  let row = qs("#itinerary").insertRow();
  row.style.border = 0;
  row.innerHTML += `
    <td style="padding-right: 20px">
      Flight&nbsp;${last_index + 1}
    </td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" " value="${cells[0]}">
      <label class="active">Origin</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder="No preference" value="${cells[1]}">
      <label class="active">Transfer</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" " value="${cells[2]}">
      <label class="active">Destination</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder="No preference" value="${cells[3]}">
      <label class="active">Airline</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="date" placeholder="" value="${cells[4]}">
      <label class="active">Earliest departure</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="time" placeholder="" value="${cells[5]}">
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="date" placeholder=" " value="${cells[6]}">
      <label class="active">Latest departure</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="time" placeholder=" " value="${cells[7]}">
    </div></div></td>
  `;
  qs("#tabs").innerHTML += `
    <li class="tab">
      <a href="#table${last_index + 1}">Flight ${last_index + 1}</a>
    </li>
  `;
  qs("#tables").innerHTML += `
    <div id="table${last_index + 1}" class="col s12">
      <table class="highlight">
        <thead><tr>
          <th>Flight</th>
          <th>Departure</th>
          <th>Arrival</th>
          <th>Flight Time</th>
          <th>Aircraft</th>
          <th>Fare Class</th>
          <th>Duration</th>
          <th>Stops</th>
          <th>Price</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  displayed_flights.push({});
  selected_flights.push(null);

  // Re-initialize tabs.
  tabs_instance = M.Tabs.init(qs("#tabs"), {});
  tabs_instance.select(`flight${active_tab}`);
}

/**
 * Removes a flight from the itinerary.
 */
function removeFlight() {
  let last_index = qs("#itinerary").childElementCount;
  if (last_index <= 1) {
    return;
  }

  // Save active tab (or the second-to-last tab, if the last tab was active).
  let active_tab = -1;
  for (const [i, e] of qsa("#tabs a").entries()) {
    if (e.classList.contains("active")) {
      active_tab = i;
      break;
    }
  }
  if (active_tab == last_index) {
    active_tab = last_index - 1;
  }

  // Destroy old instance and remove any indicators.
  if (tabs_instance) {
    tabs_instance.destroy();
  }
  qsa("#tabs .indicator").forEach(e => e.remove());

  // Operate.
  qs("#itinerary").lastElementChild.remove();
  qs("#tabs").lastElementChild.remove();
  qs("#tables").lastElementChild.remove();
  displayed_flights.pop();
  selected_flights.pop();

  // Re-initialize tabs.
  tabs_instance = M.Tabs.init(qs("#tabs"), {});
  tabs_instance.select(`flight${active_tab}`);
}

/**
 * Adds a candidate flight to the user interface if it isn't displayed already.
 * 
 * @param {number} index Index of the flight in the itinerary.
 * @param {Object} itinerary Itinerary returned by the API.
 * @param {object} flight Flight returned by the API. Same as itinerary for
 *   single flights.
 */
function displayFlight(index, itinerary, flight) {
  if (displayed_flights[index][flight.id]) {
    return;
  }
  else {
    displayed_flights[index][flight.id] = true;
  }

  let cells = [];
  for (let i = 0; i < columns.length; i++) {
    cells.push("");
  }

  // Populate cells.
  for (let segment of flight.route) {
    // Flight.
    let airline = segment.airline;
    let flight_no = segment.flight_no;
    if (segment.operating_carrier && segment.operating_flight_no) {
      airline = segment.operating_carrier;
      flight_no = segment.operating_flight_no;
    }
    if (cells[0]) {
      cells[0] += "<br>";
    }
    cells[0] += `
      <img src="https://images.kiwi.com/airlines/128/${airline}.png" class="airline-logo"></img>
      ${airline} ${flight_no}
    `;

    // Departure.
    if (cells[1]) {
      cells[1] += "<br>";
    }
    cells[1] += `${localeString(segment.dTime)} (${segment.flyFrom})`;

    // Arrival.
    if (cells[2]) {
      cells[2] += "<br>";
    }
    cells[2] += `${localeString(segment.aTime)} (${segment.flyTo})`;

    // Flight Time.
    if (cells[3]) {
      cells[3] += "<br>";
    }
    let duration = segment.aTimeUTC - segment.dTimeUTC;
    cells[3] += `${Math.floor(duration / 3600)}h ` +
                `${Math.floor(duration % 3600 / 60)}m`
    
    // Aircraft.
    if (cells[4]) {
      cells[4] += "<br>";
    }
    cells[4] += segment.equipment ? segment.equipment : "–";

    // Fare Class.
    if (cells[5]) {
      cells[5] += "<br>";
    }
    cells[5] += segment.fare_classes ? segment.fare_classes : "–";
  }

  // Duration.
  if (cells[6]) {
    cells[6] += "<br>";
  }
  cells[6] += `
    <div style="line-height: normal">
      ${flight.fly_duration}<br>
      <span class="note">${flight.flyFrom}–${flight.flyTo}</span>
    </div>
  `;

  // Stops.
  cells[7] += flight.route.length == 1 ? "Nonstop" :
              flight.route.length == 2 ? "1 stop" :
              (flight.route.length - 1) + " stops";
  
  // Price.
  cells[8] += `
    <a target="_blank" href="${itinerary.deep_link}">
      ${itinerary.price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}
    </a>
  `;

  // Create new row.
  let row = qsa("#tables tbody")[index].insertRow();
  row.classList.add("clickable");
  row.onclick = () => {
    selected_flights[index] = selected_flights[index] ? null : flight.id;
    displayResults();
  };
  for (let cell of cells) {
    row.innerHTML += `<td>${cell}</td>`;
  }
}

/**
 * Refreshes the tables with the latest results.
 */
function displayResults() {
  // Clear tables.
  qsa("#tables tbody").forEach(e => e.innerHTML = "");
  for (let i = 0; i < displayed_flights.length; i++) {
    displayed_flights[i] = {};
  }

  for (const itinerary of res) {
    if (single) {
      if (!selected_flights[0] || itinerary.id == selected_flights[0]) {
        displayFlight(0, itinerary, itinerary);
      }
    }
    else if (itinerary.route.every((v, i, _) =>
             !selected_flights[i] || v.id == selected_flights[i])) {
      for (const [i, segment] of itinerary.route.entries()) {
        displayFlight(i, itinerary, segment);
      }
    }
  }
}

function main() {
  startWorking();

  // Prepare request.
  let req = new XMLHttpRequest();
  req.open("POST", flights_api);
  req.setRequestHeader("Content-Type", "application/json");
  let body = {"requests": []};
  for (let i = 0; i < qs("#itinerary").childElementCount; i++) {
    body["requests"].push({
      "fly_from": getInput(i, 1),
      "select_stop_airport": getInput(i, 2),
      "fly_to": getInput(i, 3),
      "select_airlines": getInput(i, 4),
      "date_from": kiwiDate(getInput(i, 5)),
      "dtime_from": getInput(i, 6),
      "date_to": kiwiDate(getInput(i, 7)),
      "dtime_to": getInput(i, 8),
      "adults": 1,
    })
  }
  console.log("Request:");
  console.log(body);

  // Handle response.
  req.onreadystatechange = () => {
    if (!(req.readyState == 4 && (!req.status || req.status == 200))) {
      return;
    }
    res = JSON.parse(req.responseText);
    if (res.length > 0) {
      qs("#results-message").classList.remove("hide");
    }
    else {
      qs("#no-results-message").classList.remove("hide");
    }

    // Reformat response for single-flight itineraries.
    if (res.length == 1) {
      res = res[0];
      single = true;
    }
    else {
      single = false;
    }

    // Display results.
    console.log("Response:");
    console.log(res);
    for (let i = 0; i < selected_flights.length; i++) {
      selected_flights[i] = null;
    }
    displayResults();
    stopWorking();
  }
  req.send(JSON.stringify(body)); 
}
