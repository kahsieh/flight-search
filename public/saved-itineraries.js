/*
Five Peas Flight Search
saved-itineraries.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

/**
 * Function that displays the itinerary table after authentication
 */
addEventListener("load", () => {
  // loads itinerary table
  displayItineraries();
})

/**
 * Function that sends the itineraries to be deleted if the user unloads the
 * page before the toast is dismissed.
 */
addEventListener("unload", () => {
  if (Itineraries) {
    navigator.sendBeacon("/api/delete-itinerary",
      JSON.stringify({
        idToken: Itineraries.idToken,
        deletedProcessing: Itineraries.deletedProcessing,
      })
    );
  }
})

let Itineraries;

// when using text content, we cannot use &nbsp; so we must escape it instead
const nbsp = "\u00a0";

/**
 * Renders the itinerary table to be displayed.
 * Otherwise, we hide the authenticated div and display the unauthenticated one
 */
function displayItineraries() {
  let user = checkAuth();
  if (!user || !user.uid) {
    qs("#itineraries-unauthenticated").classList.remove("hide");
    console.error("User is not authenticated.");
    return;
  }

  let data = [];

  firebase.firestore()
    .collection("itineraries")
    .where("uid", "==", user.uid)
    .orderBy("created", "asc")
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        data.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }).then(() => {
      Itineraries = new SavedItineraries(data);
    }).catch(error => {
      console.error(error);
      qs("#itineraries-authenticated").classList.add("hide");
      qs("#itineraries-none").classList.remove("hide");
    });
}

/**
 * SavedItineraries is a class that renders the itinerary table.
 */
class SavedItineraries {
  /**
   * @param {object} firebaseData Data pulled from firebase to be stored.
   * 
   * @member {object} firebaseData Firebase data for easy access.
   * @member {array} docIds Array of firebase doc IDs, indexed based on row
   */
  constructor(firebaseData) {
    this.firebaseData = firebaseData;
    this.docIds = [];
    this.deletedProcessing = [];
    this.createItineraryTable();

    let user = firebase.auth().currentUser;
    if (user) {
      user.getIdToken().then(idToken => {
        this.idToken = idToken;
      });
    }
  }

  /**
   * returns the length of the itinerary table
   */
  get length() { return qs("#saved-itineraries").childElementCount; }

  /**
   * Creates the itinerary rows and header
   */
  createItineraryTable() {
    this.firebaseData.forEach(data => {
      this.createRow(data);
    });
    
    this.createHeader();
  }

  /**
   * Creates the row to be displayed in the itinerary table.
   * 
   * @param {object} row Row that contains itinerary object, along with name,
   * price, created timestamp, and updated timestamp
   */
  createRow(row) {
    // keep track of what row belongs to what id, used for deletion
    this.docIds.push(row.id);

    let itineraryRow = qs("#saved-itineraries").insertRow();
    let index = this.length - 1;
    itineraryRow.classList.add("clickable");
    itineraryRow.style = "cursor: pointer;";

    // HTML template to be rendered for each row
    itineraryRow.innerHTML = `
      <td>
        <b class="row-number">${this.length}&nbsp;|&nbsp;</b><div
          style="display: inline;" class="truncate" id="name${index}"></div>
        <br>
        <span class="note" id="created${index}"></span>
      </td>
      <td id="departure${index}"></td>
      <td id="arrival${index}"></td>
      <td id="flight-path${index}"></td>
      <td>
        <div id="price${index}"></div>
        <span class="note" id="retrieved${index}"></span>
      </td>
      <td style="white-space: nowrap;">
        <button class="btn-floating waves-effect waves-light"
          id="refresh${index}">
          <i class="material-icons">refresh</i>
        </button>
        <button class="btn-floating waves-effect waves-light"
          id="share${index}">
          <i class="material-icons">share</i>
          <input type="hidden" id="share-link${index}">
        </button>
        <button class="btn-floating waves-effect waves-light red"
          id="delete${index}">
          <i class="material-icons">delete  </i>
        </button>
      </td>
      <td>
        <button class="btn-flat waves-effect waves-light"
          id="history${index}" style="width: 40px; height: 40px;
          border-radius: 50%; padding: 0;">
          <i class="small material-icons"
            style="font-size: 2rem; line-height: 40px;">expand_more</i>
        </button>
      </td>
    `;
    let price = -1;
    let retrieved;
    if (Array.isArray(row.history)) {
      retrieved = row.history[row.history.length - 1].retrieved;
      price = row.history[row.history.length - 1].price;
    }

    // sets text content for each element to be rendered
    qs(`#name${index}`).textContent =
      (typeof row.name !== "undefined") ? row.name : "NONE";
    qs(`#created${index}`).textContent = 
      `Created: ${(typeof row.created !== "undefined" &&
      typeof row.created.seconds === "number") ?
      this.printDate(row.created.seconds) : "NONE"}`;
    qs(`#price${index}`).textContent =
      (typeof price === "number" && price !== -1) ?
      this.printPrice(price) : "NONE";
    qs(`#retrieved${index}`).textContent =
      (typeof retrieved !== "undefined" &&
      typeof retrieved.seconds === "number") ?
      this.printDate(retrieved.seconds) : "NONE";
    qs(`#departure${index}`).textContent =
      `${(typeof row.dTime !== "undefined") ?
      row.dTime : "NONE"}${nbsp}(${(typeof row.flyFrom !== "undefined") ?
      row.flyFrom : "NONE"})`;
    qs(`#arrival${index}`).textContent =
      `${(typeof row.aTime !== "undefined") ?
      row.aTime : "NONE"}${nbsp}(${(typeof row.flyTo !== "undefined") ?
      row.flyTo : "NONE"})`;
    this.getFlightPath(index);

    // add onclick function for the row
    itineraryRow.onclick = () => {
      this.loadLink(index);
    }

    // add onclick functions for each button
    qs(`#refresh${index}`).onclick = event => {
      event.stopPropagation();
      this.refreshPrice(index);
    }
    qs(`#share${index}`).onclick = event => {
      event.stopPropagation();
      this.shareLink(index);
    }
    qs(`#delete${index}`).onclick = event => {
      event.stopPropagation();
      this.deleteRow(index);
    }
    qs(`#history${index}`).onclick = event => {
      event.stopPropagation();
    }
  }
  
  /**
   * Create table header to be rendered
   */
  createHeader() {
    let headerRow = qs("#saved-itineraries-table").createTHead().insertRow();

    headerRow.innerHTML = `
      <th>Itineraries</th>
      <th>Departure</th>
      <th>Return</th>
      <th>Flight&nbsp;Path</th>
      <th>Latest&nbsp;Price</th>
      <th></th>
      <th></th>
    `;
  }

  /**
   * @param {number} seconds number of seconds in UTC time
   * @return {string} date formatted local time
   */
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

  /**
   * @param {number} price price to be formatted
   * @return {string} USD formatted price
   */
  printPrice(price) {
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Gets the overall flight path of the itinerary
   * 
   * @param {number} index index of row
   */
  getFlightPath(index) {
    let itinerary = this.firebaseData[index].itinerary;
    // display NONE if itinerary is not an object
    if (!Array.isArray(itinerary)) {
      let div = document.createElement("div");
      div.textContent = "NONE";
      qs(`#flight-path${index}`).appendChild(div);
      return;
    }

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
  
  /**
   * Refreshes the price of the given itinerary in the row
   * 
   * @param {number} index index of row
   */
  async refreshPrice(index) {
    let user = checkAuth();

    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }
    qs(`#refresh${index}`).classList.add("disabled");

    let itinerary = this.firebaseData[index].itinerary;
    if (!Array.isArray(itinerary)) {
      qs(`#refresh${index}`).classList.remove("disabled");
      console.error("No itinerary object was found.");
      return;
    }
    
    // Add default values to the flight.
    itinerary.forEach(flight => {
      Object.entries(default_values).forEach(([key, value]) => {
        if (typeof flight[key] === "undefined") {
          flight[key] = default_values[key];
        }
      });

      required_fields.forEach(field => {
        if (typeof flight[field] === "undefined") {
          flight[field] = "";
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

    if (typeof res[0] !== "undefined" && typeof res[0].price !== "undefined") {
      price = res[0].price;
    }

    let icon, message, color;
    let docId = this.docIds[index];
    let currentDate = new Date();

    new Promise((resolve, reject) => {
      if (price === -1) {
        reject("Could not retrieve price.");
      }
      else {
        resolve();
      }
    }).then(() => {
      return firebase.firestore()
        .collection("itineraries")
        .doc(docId)
        .update({
          history: firebase.firestore.FieldValue.arrayUnion({
            price: price,
            retrieved: currentDate,
          }),
        });
    }).then(() => {
      console.log(`${this.firebaseData[index].name} was succesfully updated`);

      icon = "attach_money";
      message = "Price refreshed!";
      color = "";
    }).catch(error => {
      console.error(error);

      icon = "error";
      message = "Error: Price could not be refreshed.";
      color = "red";
    }).then(() => {
      qs(`#refresh${index}`).classList.remove("disabled");
      
      // Display message.
      M.toast({
        html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
        displayLength: 1500,
        classes: color
      });

      // Update the price on our front end
      qs(`#price${index}`).textContent = price !== -1 ?
        this.printPrice(price) : "NONE";
      qs(`#retrieved${index}`).textContent =
        this.printDate(currentDate.getTime() / 1000);
    });
  }

  /**
   * Loads itinerary by redirecting to the main page.
   * 
   * @param {number} index index of row
   */
  loadLink(index) {
    let data = this.firebaseData[index];

    window.location = getShareableLink(data.name, data.itinerary);
  }

  /**
   * Shares itinerary by copying URL to clipboard.
   * 
   * @param {number} index index of row
   */
  shareLink(index) {
    let data = this.firebaseData[index];
    if (typeof data.name === "undefined") {
      data.name = "NONE";
    }

    if (!Array.isArray(data.itinerary)) {
      console.error("No itinerary object was found.");
      return;
    }

    shareItinerary(data.name, data.itinerary,
      `#share${index}`,`#share-link${index}`);
  }

  /**
   * Hides the row from the table.
   * 
   * @param {number} index index of row
   */
  deleteRow(index) {
    qs(`#delete${index}`).classList.add("disabled");
    qs("#saved-itineraries").rows[index].hidden = true;
    let confirm = true;
    this.updateRowNumbers();
    this.deletedProcessing.push(this.docIds[index]);

    // dismiss previous toast, if one exists
    let toastElement = qs(".toast");
    if (toastElement !== null) {
      M.Toast.getInstance(toastElement).dismiss();
    }

    // toast with undo button for deletion
    M.toast({
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action
        undoButton${index}">Undo</button>`,
      displayLength: 5000,
      completeCallback: () => { (confirm) ?
        this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    // Reverse deletion if undo button is clicked, also dismiss toast that was
    // previously generated
    qs(`.undoButton${index}`).onclick = () => {
      confirm = false;
      M.Toast.getInstance(qs(".toast")).dismiss();
    }
  }

  /**
   * Deletes the itinerary by sending a post request to the bakend.
   * 
   * @param {number} index index of row
   */
  deleteItinerary(index) {
    let user = checkAuth();

    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }
    qs(`#delete${index}`).classList.remove("disabled");

    let id = this.docIds[index];
    firebase.firestore().collection("itineraries").doc(id).delete().then(() => {
      console.log(`${this.firebaseData[index].name} was succesfully deleted`);
      this.deletedProcessing.splice(this.deletedProcessing.indexOf(id), 1);
    }).catch(error => {
      console.error(error);
    });
  }

  /**
   * Unhides the row and cancels the deletion of the Firebase document
   * 
   * @param {number} index index of row
   */
  undoDeleteItinerary(index) {
    this.deletedProcessing.splice(
      this.deletedProcessing.indexOf(this.docIds[index]), 1);
    qs(`#delete${index}`).classList.remove("disabled");
    qs("#saved-itineraries").rows[index].hidden = false;
    this.updateRowNumbers();
  }

  /**
   * Updates all the row numbers if a row was deleted.
   */
  updateRowNumbers() {
    qsa("tr:not([hidden]).clickable .row-number").forEach((node, index) => {
      node.textContent = `${index + 1}${nbsp}|${nbsp}`;
    });
  }
}