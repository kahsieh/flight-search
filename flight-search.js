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
  return new Date(str).toLocaleDateString("en-GB", {timeZone: "UTC"});
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
  addFlight();
});

function addFlight() {
  let row = id("itinerary").insertRow();
  row.className = "borderless";
  row.innerHTML = `
    <td style="padding-right: 20px;">
      <h6>Flight&nbsp;${id("itinerary").childElementCount}</h6>
    </td>
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
  let fly_from = input(0, 1);
  let fly_to = input(0, 3);
  let date_from = kiwiDate(input(0, 4));
  let date_to = kiwiDate(input(0, 5));
  let partner = "picky";
  let currency = "USD";
  let url = `https://api.skypicker.com/flights?fly_from=${fly_from}&fly_to=${fly_to}&date_from=${date_from}&date_to=${date_to}&partner=${partner}&curr=${currency}`;
  req.open("GET", url);
  req.setRequestHeader("Content-Type", "application/json");

  // Handle response.
  req.onreadystatechange = () => {
    if (req.readyState == 4 && req.status == 200) {
      id("flights").innerHTML = "";
      let res = JSON.parse(req.responseText);
      // console.log("Response:");
      console.log(res);
      if (res.data.length == 0) {
        id("results-message").classList.add("hide");
        id("no-results-message").classList.remove("hide");
      }
      for (let i = 0; i < res.data.length; i++) {
        let itinerary = id("flights").insertRow();
        itinerary.className = "clickable";
        itinerary.onclick = () => window.open(res.data[i].deep_link);
        for (let c = 0; c < 6; c++) {
          itinerary.insertCell();
        }

        for (let j = 0; j < res.data[i].route.length; j++) {
          itinerary.cells[0].innerHTML += `<img src="https://images.kiwi.com/airlines/128/${res.data[i].route[j].airline}.png" class="airline-logo"></img>`;
        }
        itinerary.cells[1].innerHTML = `${localeDate(res.data[i].route[0].dTime)} (${res.data[i].route[0].flyFrom})`;
        itinerary.cells[2].innerHTML = `${localeDate(res.data[i].route[res.data[i].route.length - 1].aTime)} (${res.data[i].route[res.data[i].route.length - 1].flyTo})`;
        itinerary.cells[3].innerHTML = `${moment.duration(res.data[i].route[res.data[i].route.length - 1].aTimeUTC - res.data[i].route[0].dTimeUTC, 'seconds').hours()}h ${moment.duration(res.data[i].route[res.data[i].route.length - 1].aTime - res.data[i].route[0].dTime, 'seconds').minutes()}m`;
        itinerary.cells[4].innerHTML = `${(res.data[i].route.length - 1 == 0) ? 'Nonstop' : (res.data[i].route.length - 1)}`
        itinerary.cells[5].innerHTML = `$${res.data[i].price}`;
      }
      stopWorking();
    }
  }
  req.send();
}