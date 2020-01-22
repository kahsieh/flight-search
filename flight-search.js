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
  ["Flight", "flight"],
  ["Departure", "departure"],
  ["Arrival", "arrival"],
  ["Flight Time", "flight-time"],
  ["Aircraft", "aircraft"],
  ["Fare Class", "fare-class"],
  ["Duration", "duration"],
  ["Stops", "stops"],
  ["Price", "price"],
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
  addFlight({
    "origin": "LAX",
    "destination": "EWR",
    "earliest-departure-date": "2020-04-24",
  });
  addFlight({
    "origin": "EWR",
    "destination": "LAX",
    "earliest-departure-date": "2020-04-27",
  });
});

/**
 * Shows or hides filter columns according to the user's selection.
 */
function updateFilters() {
  for (const filter of qs("#filters").children) {
    if (!filter.value) {
      continue;
    }
    if (filter.selected) {
      qsa(`.${filter.value}`).forEach(e => e.style.display = "");
    }
    else {
      qsa(`.${filter.value}`).forEach(e => e.style.display = "none");
    }
  }
}

/**
 * Shows or hides flight data columns according to the user's selection.
 */
function updateColumns() {
  for (const column of qs("#columns").children) {
    if (!column.value) {
      continue;
    }
    if (column.selected) {
      qsa(`.${column.value}`).forEach(e => e.style.display = "");
    }
    else {
      qsa(`.${column.value}`).forEach(e => e.style.display = "none");
    }
  }
}

/**
 * Adds a flight to the itinerary.
 * 
 * @param {object} cells Optional. Values to pre-populate the row with.
 */
function addFlight(cells = {}) {
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
    <td class="origin"><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" " value="${cells["origin"] || ""}">
      <label class="active">Origin</label>
    </div></div></td>
    <td class="transfer"><div class="row"><div class="input-field col s12">
      <input type="number" placeholder="No limit" min="0" value="${cells["max-stops"] || ""}">
      <label class="active">Max stops</label>
    </div></div></td>
    <td class="transfer"><div class="row"><div class="input-field col s12">
      <input type="text" placeholder="No preference" value="${cells["transfer"] || ""}">
      <label class="active">Transfer airport</label>
    </div></div></td>
    <td class="destination"><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" " value="${cells["destination"] || ""}">
      <label class="active">Destination</label>
    </div></div></td>
    <td class="airline"><div class="row"><div class="input-field col s12">
      <input type="text" placeholder="No preference" value="${cells["airline"] || ""}">
      <label class="active">Airline</label>
    </div></div></td>
    <td class="earliest-departure"><div class="row"><div class="input-field col s12">
      <input type="date" placeholder="" value="${cells["earliest-departure-date"] || ""}">
      <label class="active">Earliest departure</label>
    </div></div></td>
    <td class="earliest-departure"><div class="row"><div class="input-field col s12">
      <input type="time" placeholder="" value="${cells["earliest-departure-time"] || ""}">
    </div></div></td>
    <td class="latest-departure"><div class="row"><div class="input-field col s12">
      <input type="date" placeholder=" " value="${cells["latest-departure-date"] || ""}">
      <label class="active">Latest departure</label>
    </div></div></td>
    <td class="latest-departure"><div class="row"><div class="input-field col s12">
      <input type="time" placeholder=" " value="${cells["latest-departure-time"] || ""}">
    </div></div></td>
    <td class="earliest-arrival"><div class="row"><div class="input-field col s12">
      <input type="time" placeholder="" value="${cells["earliest-arrival-time"] || ""}">
      <label class="active">Earliest arrival</label>
    </div></div></td>
    <td class="latest-arrival"><div class="row"><div class="input-field col s12">
      <input type="time" placeholder=" " value="${cells["latest-arrival-time"] || ""}">
      <label class="active">Latest arrival</label>
    </div></div></td>
  `;
  updateFilters();
  qs("#remove-flight").classList.remove("disabled");
  qs("#tabs").innerHTML += `
    <li class="tab">
      <a href="#table${last_index + 1}">
        Flight ${last_index + 1}
        <span class="check hide">✓</span>
      </a>
    </li>
  `;
  qs("#tables").innerHTML += `
    <div id="table${last_index + 1}" class="col s12">
      <table class="highlight">
        <thead><tr></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  for (const column of columns) {
    qs(`#table${last_index + 1} tr`).innerHTML +=
      `<th class="${column[1]}">${column[0]}</th>`
  }
  updateColumns();
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
  if (last_index == 2) {
    qs("#remove-flight").classList.add("disabled");
  }
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
  if (flight.route.length == 1) {
    cells[7] += "Nonstop";
  }
  else if (flight.route.length == 2) {
    let duration = flight.route[1].dTimeUTC - flight.route[0].aTimeUTC;
    let duration_text = `${Math.floor(duration / 3600)}h ` +
                        `${Math.floor(duration % 3600 / 60)}m`;
    cells[7] += `
      <div style="line-height: normal">
        1 stop<br>
        <span class="note">${duration_text} ${flight.route[0].flyTo}</span>
      </div>
    `;
  }
  else {
    let stops = flight.route.slice(0, -1).map(segment => segment.flyTo);
    cells[7] += `
      <div style="line-height: normal">
        ${stops.length} stops<br>
        <span class="note">${stops.join(", ")}</span>
      </div>
    `;
  }

  // Price.
  cells[8] += `
    <div style="line-height: normal">
      ${itinerary.price.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}<br>
      <span class="note">entire trip</span>
    </div>
  `;

  // Create new row.
  let row = qsa("#tables tbody")[index].insertRow();
  row.classList.add("clickable");
  if (selected_flights.includes(flight.id)) {
    row.classList.add("selected");
  }
  row.onclick = () => {
    selected_flights[index] = selected_flights[index] ? null : flight.id;
    qs("#book").onclick = () => window.open(itinerary.deep_link);
    displayResults();
  };
  for (let [i, cell] of cells.entries()) {
    row.innerHTML += `<td class="${columns[i][1]}">${cell}</td>`;
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
    else if (itinerary.route.every((v, i) =>
             !selected_flights[i] || v.id == selected_flights[i])) {
      for (const [i, segment] of itinerary.route.entries()) {
        displayFlight(i, itinerary, segment);
      }
    }
  }
  updateColumns();

  // Handle selected flights.
  for (let i = 0; i < selected_flights.length; i++) {
    if (selected_flights[i]) {
      qsa("#tabs .check")[i].classList.remove("hide");
    }
    else {
      qsa("#tabs .check")[i].classList.add("hide");
    }
  }
  if (selected_flights.every(v => v)) {
    qs("#book").classList.remove("disabled");
  }
  else {
    qs("#book").classList.add("disabled");
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
    let flight = {
      "fly_from": "airport:" + getInput(i, 1),
      "fly_to": "airport:" + getInput(i, 4),
      "date_from": kiwiDate(getInput(i, 6)),
      "date_to": kiwiDate(getInput(i, 8)) || kiwiDate(getInput(i, 6)),
      "adults": 1,
    };
    if (getInput(i, 2)) {
      flight["max_stopovers"] = getInput(i, 2);
    }
    if (getInput(i, 3)) {
      flight["select_stop_airport"] = getInput(i, 3);
    }
    if (getInput(i, 5)) {
      flight["select_airlines"] = getInput(i, 5);
    }
    if (getInput(i, 7)) {
      flight["dtime_from"] = getInput(i, 7);
    }
    if (getInput(i, 9)) {
      flight["dtime_to"] = getInput(i, 9);
    }
    if (getInput(i, 10)) {
      flight["atime_from"] = getInput(i, 10);
    }
    if (getInput(i, 11)) {
      flight["atime_to"] = getInput(i, 11);
    }
    body["requests"].push(flight);
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
