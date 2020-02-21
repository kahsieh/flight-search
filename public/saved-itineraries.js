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
});

addEventListener("unload", () => {
  navigator.sendBeacon('/api/delete-itinerary', DeletedProcessing);
})

// stores the saved itineraries
let DeletedProcessing = [];

// when using text content, we cannot use &nbsp; so we must escape it instead
const nbsp = "\u00a0";

/**
 * Checks if the user is authenticated and updates the UI accordingly.
 */
function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/auth");
  xhr.onload = () => {
    let body = JSON.parse(xhr.responseText)[0];
    if (xhr.readyState === xhr.DONE && xhr.status === 200 &&
        body.authenticated) {
      qs("#itineraries-authenticated").classList.remove("hide");
      qs("#greeting").classList.remove("hide");
      qs("#greeting").innerHTML = body.name;

      // load itinerary table
      displayItineraries();
    }
    else {
      qs("#itineraries-unauthenticated").classList.remove("hide");
    }
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
        Itineraries = new SavedItineraries(response);
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
    this.docIds = [];
    this.createItineraryTable();
  }

  get length() { return qs("#saved-itineraries").childElementCount; }

  createItineraryTable() {
    this.firebaseData.forEach(data => {
      this.createRow(data);
    });

    this.createHeader();
  }

  // loadLink(index) {
  //   let data = this.firebaseData[index];

  //   window.location = getShareableLink(data.name, data.itinerary);
  // }

  async updatePrice(index) {
    qs(`#refresh${index}`).classList.add("disabled");
    let itinerary = this.firebaseData[index].itinerary;

    // Add default values to the flight.
    itinerary.forEach(flight => {
      Object.entries(default_values).forEach(([key, value]) => {
        if (typeof flight[key] === "undefined") {
          flight[key] = default_values[key];
        }
      });
    });

    // Prepare details, including price.
    let res = await Promise.all(prepareFetches(itinerary))
      .then(responses => Promise.all(responses.map(res => res.json())))
      .then(bodies => bodies.flat())
      .catch(error => console.error(error));
    res.sort((a, b) => a.price - b.price);
    let price = -1;

    if (res[0] !== undefined) {
      price = res[0].price;
    }
    let currentDate = new Date();
    
    // Send an XHR to our backend to update the firebase data.
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/update-itinerary");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      let body = JSON.parse(xhr.responseText);
      if (xhr.readyState === xhr.DONE && xhr.status === 200 &&
        body.updated) {
        console.log(`${this.firebaseData[index].name} was succesfully updated`);
      }
      else {
        console.error(`${this.firebaseData[index].name} could not be updated`);
      }
      qs(`#refresh${index}`).classList.remove("disabled");
    }
    xhr.send(JSON.stringify({
      docId: this.docIds[index],
      update: {
        price: price,
        updated: currentDate.getTime(),
      }
    }));

    qs(`#price${index}`).textContent = price !== -1 ?
      this.printPrice(price) : "NONE";
    qs(`#updated${index}`).textContent =
      this.printDate(currentDate.getTime() / 1000);
  }

  shareLink(index) {
    let data = this.firebaseData[index];

    shareItinerary(data.name, data.itinerary,
      `#share${index}`,`#share-link${index}`);
  }

  deleteRow(index) {
    qs(`#delete${index}`).classList.add("disabled");
    qs("#saved-itineraries").rows[index].hidden = true;
    let confirm = true;
    this.updateRowNumbers();
    DeletedProcessing.push(index);

    let toastElement = qs(".toast");
    if (toastElement !== null) {
      M.Toast.getInstance(toastElement).dismiss();
    }

    M.toast({
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action
        undoButton${index}">Undo</button>`,
      displayLength: 5000,
      completeCallback: () => { (confirm) ?
        this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    qs(`.undoButton${index}`).onclick = () => {
      confirm = false;
      M.Toast.getInstance(qs(".toast")).dismiss();
    }
  }

  deleteItinerary(index) {
    qs(`#delete${index}`).classList.remove("disabled");

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/delete-itinerary");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      let body = JSON.parse(xhr.responseText);
      if (xhr.readyState === xhr.DONE && xhr.status === 200 &&
        body.deleted) {
        console.log(`${this.firebaseData[index].name} was succesfully deleted`);
        
        DeletedProcessing.splice(DeletedProcessing.indexOf(index), 1);
      }
      else {
        console.error(`${this.firebaseData[index].name} could not be deleted`);
      }
    }
    xhr.send(JSON.stringify({
      docId: this.docIds[index],
    }));
  }

  undoDeleteItinerary(index) {
    DeletedProcessing.splice(DeletedProcessing.indexOf(index), 1);
    qs(`#delete${index}`).classList.remove("disabled");
    qs("#saved-itineraries").rows[index].hidden = false;
    this.updateRowNumbers();
  }

  updateRowNumbers() {
    qsa('tr:not([hidden]).clickable .row-number').forEach((node, index) => {
      node.textContent = `${index + 1}${nbsp}|${nbsp}`;
    });
  }

  createRow(row) {
    // keep track of what row belongs to what id, used for deletion
    this.docIds.push(row.id);

    let itineraryRow = qs("#saved-itineraries").insertRow();
    let index = this.length - 1;
    itineraryRow.classList.add("clickable");

    itineraryRow.innerHTML = `
      <td>
        <b class="row-number">${this.length}&nbsp;|&nbsp;</b><div style="display: inline;"
          class="truncate" id="name${index}"></div>
        <br>
        <span class="note" id="created${index}"></span>
      </td>
      <td id="departure${index}"></td>
      <td id="arrival${index}"></td>
      <td id="flight-path${index}"></td>
      <td>
        <div id="price${index}"></div>
        <span class="note" id="updated${index}"></span>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light"
          id="refresh${index}">
          <i class="material-icons">refresh</i>
        </button>
        &nbsp;
        <button class="btn-floating waves-effect waves-light"
          id="share${index}">
          <i class="material-icons">share</i>
          <input type="hidden" id="share-link${index}">
        </button>
        &nbsp;
        <button class="btn-floating waves-effect waves-light red"
          id="delete${index}">
          <i class="material-icons">delete</i>
        </button>
      </td>
    `;

    qs(`#name${index}`).textContent = row.name;
    qs(`#created${index}`).textContent = 
      `Created: ${this.printDate(row.created.seconds)}`;
    qs(`#price${index}`).textContent =
      row.price !== -1 ? this.printPrice(row.price) : "NONE";
    qs(`#updated${index}`).textContent =
      this.printDate(row.updated.seconds);
    qs(`#departure${index}`).textContent = `${row.dTime} (${row.flyFrom})`;
    qs(`#arrival${index}`).textContent = `${row.aTime} (${row.flyTo})`;
    this.getFlightPath(index);

    qs(`#refresh${index}`).onclick = () => {
      this.updatePrice(index);
    }
    qs(`#share${index}`).onclick = () => {
      this.shareLink(index);
    }
    qs(`#delete${index}`).onclick = () => {
      this.deleteRow(index);
    }
  }

  printDate(seconds) {
    let date = new Date(seconds * 1000);

    return date.toLocaleString([], {
      weekday: "short",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  printPrice(price) {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  createHeader() {
    let headerRow = qs("#saved-itineraries-table").createTHead().insertRow();

    headerRow.innerHTML = `
      <th>Itineraries</th>
      <th>Departure</th>
      <th>Return</th>
      <th>Flight&nbsp;Path</th>
      <th>Latest&nbsp;Price</th>
      <th></th>
    `;
  }

  getFlightPath(index) {
    let itinerary = this.firebaseData[index].itinerary;

    itinerary.forEach(flight => {
      let div = document.createElement("div");

      let src = (typeof flight.fly_from !== "undefined") ?
        flight.fly_from : "NONE";
      let dest = (typeof flight.fly_to !== "undefined") ?
        flight.fly_to : "NONE";

      div.textContent = `${src}${nbsp}→${nbsp}${dest}`;

      qs(`#flight-path${index}`).appendChild(div);
    });
  }
}