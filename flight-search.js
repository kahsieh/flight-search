/*
Five Peas Flight Search
flightsearch.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Raymond Phan, Quentin
Truong. All Rights Reserved.
*/

// -----------------------------------------------------------------------------
// GLOBALS
// -----------------------------------------------------------------------------

const app = {
  version: "v0.1.0",
};

let tabs_instance = null;

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

function id(str) {
  return document.getElementById(str);
}

function qs(query) {
  return document.querySelectorAll(query);
}

function kiwiDate(str) {
  return str ? new Date(str).toLocaleDateString("en-GB", {timeZone: "UTC"}) : "";
}

function localeDate(unix) {
  return new Date(unix * 1000).toLocaleString([], {
    timeZone: "UTC",
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timePart(unix) {
  return new Date(unix * 1000).toLocaleTimeString([], {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getInput(r, c) {
  return id("itinerary").children[r]  // tr
                        .children[c]  // td
                        .children[0]  // div
                        .children[0]  // div
                        .children[0]  // input
                        .value;
}

function setInput(r, c, v) {
  id("itinerary").children[r]  // tr
                 .children[c]  // td
                 .children[0]  // div
                 .children[0]  // div
                 .children[0]  // input
                 .value = v;
}

function startWorking() {
  id("search").disabled = true;
  id("spinner").classList.remove("hide");
  id("no-results-message").classList.add("hide");
}

function stopWorking() {
  id("search").disabled = false;
  id("spinner").classList.add("hide");
}

// -----------------------------------------------------------------------------
// APPLICATION
// -----------------------------------------------------------------------------

addEventListener("load", () => {
  id("app-version").innerText = app.version;
  addFlight();
  addFlight();
  // addFlight("LAX", "", "KHH", "JL", "2020-02-05", "2020-02-05");
  // addFlight("KHH", "", "NRT", "CI", "2020-02-12", "2020-02-12");
  // addFlight("KIX", "", "KHH", "CI", "2020-02-19", "2020-02-19");
  // addFlight("KHH", "", "LAX", "JL", "2020-02-26", "2020-02-26");
});

function addFlight(origin = "", 
                   transfer = "", 
                   destination = "",
                   airline = "",
                   earliest_departure = "",
                   latest_departure = "") {
  let last_flight = id("itinerary").childElementCount;

  // Save active tab.
  let active_tab = null;
  for (let e of qs("#tabs a")) {
    if (e.classList.contains("active")) {
      active_tab = e.href.split("#")[1];
      break;
    }
  }

  // Destroy old instance.
  if (tabs_instance) {
    tabs_instance.destroy();
  }
  qs("#tabs .indicator").forEach(e => e.remove());

  // Operate.
  id("itinerary").innerHTML += `
    <tr class="borderless">
      <td style="padding-right: 20px;">
        Flight&nbsp;${last_flight + 1}
      </td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" placeholder=" " value="${origin}">
        <label class="active">Origin</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" placeholder="No preference" value="${transfer}">
        <label class="active">Transfer</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" placeholder=" " value="${destination}">
        <label class="active">Destination</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" placeholder="No preference" value="${airline}">
        <label class="active">Airline</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="date" placeholder="" value="${earliest_departure}">
        <label class="active">Earliest departure</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="time" placeholder="" value="">
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="date" placeholder=" " value="${latest_departure}">
        <label class="active">Latest departure</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="time" placeholder=" " value="">
      </div></div></td>
    </tr>
  `;
  id("tabs").innerHTML += `
    <li class="tab">
      <a href="#table${last_flight + 1}">Flight ${last_flight + 1}</a>
    </li>
  `;
  id("tables").innerHTML += `
    <div id="table${last_flight + 1}" class="col s12">
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

  // Re-initialize tabs.
  tabs_instance = M.Tabs.init(id("tabs"), {});
  tabs_instance.select(active_tab);
}

function removeFlight() {
  let last_flight = id("itinerary").childElementCount;
  if (last_flight <= 1) {
    return;
  }

  // Save active tab.
  let active_tab = null;
  for (let e of qs("#tabs a")) {
    if (e.classList.contains("active")) {
      active_tab = e.href.split("#")[1];
      break;
    }
  }
  if (active_tab == `table${last_flight}`) {
    active_tab = `table${last_flight - 1}`;
  }

  // Destroy old instance.
  if (tabs_instance) {
    tabs_instance.destroy();
  }
  qs("#tabs .indicator").forEach(e => e.remove());

  // Operate.
  id("itinerary").lastElementChild.remove();
  id("tabs").lastElementChild.remove();
  id("tables").lastElementChild.remove();

  // Re-initialize tabs.
  tabs_instance = M.Tabs.init(id("tabs"), {});
  tabs_instance.select(active_tab);
}

function main() {
  startWorking();
  // Prepare request.
  let req = new XMLHttpRequest();
  req.open("POST", "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky");
  req.setRequestHeader("Content-Type", "application/json");
  let body = {"requests": []};
  for (let i = 0; i < id("itinerary").childElementCount; i++) {
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
    qs("#tables tbody").forEach(e => e.innerHTML = "");
    let res = JSON.parse(req.responseText);
    if (res.length == 0) {
      id("no-results-message").classList.remove("hide");
    }
    let single = false;
    if (res.length == 1) {
      res = res[0];
      single = true;
    }
    console.log("Response:");
    console.log(res);
    for (let itinerary of res.slice(0, 50)) {
      for (let i = 0; i < (single ? 1 : itinerary.route.length); i++) {
        let leg = single ? itinerary : itinerary.route[i];

        // Create cells for new row.
        let cells = [];
        for (let j = 0; j < 10; j++) {
          cells.push("");
        }

        // Populate cells.
        for (let segment of leg.route) {
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
          if (cells[1]) {
            cells[1] += "<br>";
          }
          cells[1] += `${localeDate(segment.dTime)} (${segment.flyFrom})`;
          if (cells[2]) {
            cells[2] += "<br>";
          }
          cells[2] += `${localeDate(segment.aTime)} (${segment.flyTo})`;
          if (cells[3]) {
            cells[3] += "<br>";
          }
          let duration = segment.aTimeUTC - segment.dTimeUTC;
          cells[3] += `${Math.floor(duration / 3600)}h ` +
                      `${Math.floor(duration % 3600 / 60)}m`
          if (cells[4]) {
            cells[4] += "<br>";
          }
          cells[4] += segment.equipment ? segment.equipment : "–";
          if (cells[5]) {
            cells[5] += "<br>";
          }
          cells[5] += segment.fare_classes ? segment.fare_classes : "–";
        }
        if (cells[6]) {
          cells[6] += "<br>";
        }
        cells[6] += `
          <div style="line-height: normal">
            ${leg.fly_duration}<br>
            <span class="note">${leg.flyFrom}–${leg.flyTo}</span>
          </div>
        `;
        cells[7] += leg.route.length == 1 ? "Nonstop" :
                    leg.route.length == 2 ? "1 stop" :
                    (leg.route.length - 1) + " stops";
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

        // Create and insert new row.
        let row = `<tr class="clickable" onclick="setInput(${i}, 6, '${timePart(leg.dTime)}'); setInput(${i}, 8, '${timePart(leg.dTime + 3600)}'); main()">`;
        for (let cell of cells) {
          row += `<td>${cell}</td>`;
        }
        row += `</tr>`;
        qs("#tables tbody")[i].innerHTML += row;
      }
    }
    stopWorking();
  }
  req.send(JSON.stringify(body)); 
}
