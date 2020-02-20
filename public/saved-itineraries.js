/*
Five Peas Flight Search
saved-itineraries.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

/**
 * Function to run when the saved itineraries page loads.
 */
addEventListener("load", () => {
  auth();
})

/**
 * Checks if the user is authenticated and updates the UI accordingly.
 */
function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/auth");
  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200 &&
        xhr.responseText === "true") {
      qs("#itineraries-unauthenticated").classList.add("hide");
      qs("#itineraries-authenticated").classList.remove("hide");
    }
    displayItineraries();
  }
  xhr.send();
}

function displayItineraries() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/display-itineraries");
  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE) {
      let response = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && response.length !== 0) {
        new SavedItineraries(response);
      }
      else {
        qs("#itineraries-authenticated").classList.add("hide");
        qs("#itineraries-none").classList.remove("hide");
      }
    }
  }
  xhr.send();
}

class SavedItineraries {
  constructor(firebaseData) {
    this.firebaseData = firebaseData;
    this.createItineraryTable();
  }

  get length() { return qs("#saved-itineraries").childElementCount; }

  createItineraryTable() {
    this.firebaseData.forEach(data => {
      this.createRow(data);
    });

    this.createHeader();
  }

  loadLink(index) {
    let data = this.firebaseData[index];

    window.location = getShareableLink(data.name, data.itinerary);
  }

  shareLink(index) {
    let data = this.firebaseData[index];

    shareItinerary(data.name, data.itinerary, `#share${index}`, `#share-link${index}`);
  }

  deleteRow(index) {
    qs(`#delete${index}`).classList.add("disabled");
    qs("#saved-itineraries").rows[index].hidden = true;
    let confirm = true;

    M.toast({
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action undoButton${index}">Undo</button>`,
      displayLength: 5000,
      completeCallback: () => { (confirm) ? this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    qs(`.undoButton${index}`).onclick = () => {
      confirm = false;
      M.Toast.getInstance(qs(".toast")).dismiss();
    }
  }

  deleteItinerary(index) {

  }

  undoDeleteItinerary(index) {
    qs(`#delete${index}`).classList.remove("disabled");
    qs("#saved-itineraries").rows[index].hidden = false;
  }

  createRow(row) {
    let itineraryRow = qs("#saved-itineraries").insertRow();
    let index = this.length - 1;
    itineraryRow.classList.add("clickable");

    itineraryRow.innerHTML = `
      <td style="padding-right: 20px">
        <b>${this.length}&nbsp;|&nbsp;</b><div style="display: inline;" id="name${index}"></div>
        <br>
        <span class="note" id="created${index}"></span>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="load${index}">
          <i class="material-icons">restore</i>
        </button>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="share${index}">
          <i class="material-icons">share</i>
          <input type="hidden" id="share-link${index}">
        </button>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="delete${index}">
          <i class="material-icons red">delete</i>
        </button>
      </td>
      <td>
        <div id="price${index}"></div>
        <span class="note" id="retrieved${index}"></span>
      </td>
      <td id="departure${index}"></td>
      <td id="arrival${index}"></td>
      <td id="flight-path${index}"></td>
    `;

    qs(`#name${index}`).textContent = row.name;
    qs(`#created${index}`).textContent = `Created: ${this.printDate(row.created.seconds)}`;
    qs(`#price${index}`).textContent = '$' + row.history[row.history.length - 1].price;
    qs(`#retrieved${index}`).textContent = `Retrieved: ${this.printDate(row.history[row.history.length - 1].time.seconds)}`;
    qs(`#departure${index}`).textContent = `${row.dTime} (${row.flyFrom})`;
    qs(`#arrival${index}`).textContent = `${row.aTime} (${row.flyTo})`;
    qs(`#flight-path${index}`).textContent = this.getFlightPath(index);

    qs(`#load${index}`).onclick = () => {
      this.loadLink(index);
    }
    qs(`#share${index}`).onclick = () => {
      this.shareLink(index);
    }
    qs(`#delete${index}`).onclick = () => {
      this.deleteRow(index);
    }
  }

  printDate(seconds) {
    return new Date(seconds * 1000).toLocaleString([], {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  createHeader() {
    let headerRow = qs("#saved-itineraries-table").createTHead().insertRow();

    headerRow.innerHTML = `
      <th>Itineraries</th>
      <th>Load</th>
      <th>Share</th>
      <th>Delete</th>
      <th>Latest Price</th>
      <th>Departure</th>
      <th>Arrival</th>
      <th>Flight Path</th>
    `;
  }

  getFlightPath(index) {
    let itinerary = this.firebaseData[index].itinerary;

    return itinerary.map(flight => {
      let src = (typeof flight.fly_from !== "undefined") ? flight.fly_from : "NONE";
      let dest = (typeof flight.fly_to !== "undefined") ? flight.fly_to : "NONE";

      return `${src}🡒${dest}`;
    }).join(", ");
  }
}