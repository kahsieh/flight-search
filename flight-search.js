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

function europeanDate(str) {
  let date = new Date(str);
  return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}

function localDate(unix) {
  let date = new Date(unix * 1000);
  return date.toLocaleDateString([], {timeZone: "UTC"}) + " " + date.toLocaleTimeString([], {timeZone: "UTC", hour: "numeric", minute: "2-digit"});
}

// -----------------------------------------------------------------------------
// APPLICATION
// -----------------------------------------------------------------------------

addEventListener("load", () => {
  id("app-version").innerText = app.version;
});

function test() {
  alert("test");
}

function main() {
  id("search").disabled = true;
  let req = new XMLHttpRequest();
  req.open("POST", "https://api.skypicker.com/flights_multi?locale=us&curr=USD&partner=picky");
  req.onreadystatechange = () => {
    if (!(req.readyState == 4 && (!req.status || req.status == 200))) {
      return;
    }
    const res = JSON.parse(req.responseText);
    id("flights").innerHTML = "";
    for (let itinerary of res) {
      for (let flight of itinerary) {
        console.log(flight);
        let row = id("flights").insertRow();
        row.className = "clickable";
        row.onclick = () => window.open(flight.deep_link);
        let flight_cell = row.insertCell();
        let departure_cell = row.insertCell();
        let arrival_cell = row.insertCell();
        let aircraft_cell = row.insertCell();
        let fareclass_cell = row.insertCell();
        let price_cell = row.insertCell();
        for (let segment of flight.route) {
          flight_cell.innerHTML += `<img src="https://images.kiwi.com/airlines/128/${segment.operating_carrier}.png" width=32></img>`
            + segment.operating_carrier + " " + segment.operating_flight_no;
          departure_cell.innerHTML += localDate(segment.dTime) + "<br>" + segment.flyFrom;
          arrival_cell.innerHTML += localDate(segment.aTime) + "<br>" + segment.flyTo;
          aircraft_cell.innerHTML += segment.equipment;
          fareclass_cell.innerHTML += segment.fare_classes;
        }
        price_cell.innerHTML = "$" + flight.price;
      }
    }
    id("search").disabled = false;
  }
  req.setRequestHeader("Content-Type", "application/json");
  req.send(JSON.stringify({
    "requests": [
      {
        "fly_from": id("origin").value,
        "fly_to": id("destination").value,
        "date_from": europeanDate(id("departure-date").value),
        "date_to": europeanDate(id("departure-date").value),
        "direct_flights": 1,
        "passengers": 1,
        "adults": 1,
        "infants": 0,
        "children": 0
      }
    ]
  })); 
}
