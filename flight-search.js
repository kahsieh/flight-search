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

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

function id(str) {
  return document.getElementById(str);
}

function kiwiDate(str) {
  return new Date(input(0, 4)).toLocaleDateString("en-GB", {timeZone: "UTC"});
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

function input(r, c) {
  return id("itinerary").children[r]  // tr
                        .children[c]  // td
                        .children[0]  // div
                        .children[0]  // div
                        .children[0]  // input
                        .value;
}

function startWorking() {
  id("search").disabled = true;
  id("results").classList.remove("hide");
  id("results-message").classList.remove("hide");
  id("no-results-message").classList.add("hide");
  id("spinner").classList.remove("hide");
  id("flights-table").classList.add("hide");
}

function stopWorking() {
  id("search").disabled = false;
  id("results").classList.remove("hide");
  id("spinner").classList.add("hide");
  id("flights-table").classList.remove("hide");
}

// -----------------------------------------------------------------------------
// APPLICATION
// -----------------------------------------------------------------------------

addEventListener("load", () => {
  id("app-version").innerText = app.version;
  addFlight();
});

function addFlight() {
  let row = id("itinerary").insertRow();
  row.className = "borderless";
  row.innerHTML = `
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" ">
      <label class="active">Origin</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" ">
      <label class="active">Transfer</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="text" placeholder=" ">
      <label class="active">Destination</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="date" placeholder=" ">
      <label class="active">Earliest departure</label>
    </div></div></td>
    <td><div class="row"><div class="input-field col s12">
      <input type="date" placeholder=" ">
      <label class="active">Latest departure</label>
    </div></div></td>
  `;
}

function removeFlight() {
  if (id("itinerary").childElementCount > 1) {
    id("itinerary").lastChild.remove();
  }
}

function main() {
  startWorking();
  // Prepare request.
  let req = new XMLHttpRequest();
  req.open("POST", "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky");
  req.setRequestHeader("Content-Type", "application/json");
  let body = {
    "requests": [
      {
        "fly_from": input(0, 0),
        "fly_to": input(0, 2),
        "date_from": kiwiDate(input(0, 3)),
        "date_to": kiwiDate(input(0, 4)),
        "direct_flights": 1,
        "adults": 1,
      }
    ]
  };
  console.log("Request:");
  console.log(body);

  // Handle response.
  req.onreadystatechange = () => {
    if (!(req.readyState == 4 && (!req.status || req.status == 200))) {
      return;
    }
    id("flights").innerHTML = "";
    console.log("Response:");
    let res = JSON.parse(req.responseText)
    if (res.length == 0) {
      id("results-message").classList.add("hide");
      id("no-results-message").classList.remove("hide");
    }
    for (let itinerary of res) {
      for (let flight of itinerary) {
        console.log(flight);
        let row = id("flights").insertRow();
        row.className = "clickable";
        row.onclick = () => window.open(flight.deep_link);
        let cells = [];
        for (let i = 0; i < 6; i++) {
          cells.push(row.insertCell());
        }
        for (let segment of flight.route) {
          let airline = segment.airline;
          let flight_no = segment.flight_no;
          if (segment.operating_carrier && segment.operating_flight_no) {
            airline = segment.operating_carrier;
            flight_no = segment.operating_flight_no;
          }
          cells[0].innerHTML += `<img src="https://images.kiwi.com/airlines/128/${airline}.png" class="airline-logo"></img>
            ${airline} ${flight_no}`;
          cells[1].innerHTML += `${localeDate(segment.dTime)} (${segment.flyFrom})`;
          cells[2].innerHTML += `${localeDate(segment.aTime)} (${segment.flyTo})`;
          if (segment.equipment) {
            cells[3].innerHTML += segment.equipment;
          }
          if (segment.fare_classes) {
            cells[4].innerHTML += segment.fare_classes;
          }
        }
        cells[5].innerHTML = flight.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      }
    }
    stopWorking();
  }
  req.send(JSON.stringify(body)); 
}
