/*
Five Peas Flight Search
saved-itineraries.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

"use strict";

/**
 * Function that displays the itinerary table after authentication.
 */
addEventListener("load", () => {
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

/**
 * SavedItineraries is a class that renders the saved itinerary table.
 */
class SavedItineraries {
  /**
   * @param {object} firebaseData Data pulled from firebase to be stored.
   * 
   * @member {object} firebaseData Firebase data for easy access.
   * @member {array} docIds Array of firebase doc IDs, indexed based on row
   */
  constructor(firebaseData) {
    this._firebaseData = firebaseData;
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
    this._firebaseData.forEach(data => {
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
          style="display: inline;" class="name truncate"></div>
        <br>
        <span class="created note"></span>
      </td>
      <td class="departure"></td>
      <td class="arrival"></td>
      <td class="flight-path"></td>
      <td>
        <div class="price"></div>
        <span class="retrieved note"></span>
      </td>
      <td style="white-space: nowrap;">
        <button class="update btn-floating waves-effect waves-light">
          <i class="material-icons">refresh</i>
        </button>
        <button class="share btn-floating waves-effect waves-light">
          <i class="material-icons">share</i>
          <input type="hidden" class="share-link">
        </button>
        <button class="delete btn-floating waves-effect waves-light red">
          <i class="material-icons">delete</i>
        </button>
      </td>
      <td>
        <button class="history btn-flat waves-effect waves-light"
          style="width: 40px; height: 40px;
          border-radius: 50%; padding: 0;">
          <i class="small material-icons"
            style="font-size: 2rem; line-height: 40px;">expand_more</i>
        </button>
      </td>
    `;
    
    this.updateRow(index);

    // add onclick function for the row
    itineraryRow.onclick = () => {
      this.loadLink(index);
    }

    // add onclick functions for each button
    qsa(".update")[index].onclick = event => {
      event.stopPropagation();
      this.updateItinerary(index);
    }
    qsa(".share")[index].onclick = event => {
      event.stopPropagation();
      this.shareLink(index);
    }
    qsa(".delete")[index].onclick = event => {
      event.stopPropagation();
      this.deleteRow(index);
    }
    qsa(".history")[index].onclick = event => {
      event.stopPropagation();
      this.showHistory(index, chartRow);
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
   * Gets the overall flight path of the itinerary
   * 
   * @param {number} index index of row
   */
  getFlightPath(index) {
    let itinerary = this._firebaseData[index].itinerary;
    // display No results if itinerary is not an object
    if (!Array.isArray(itinerary)) {
      qsa(".flight-path")[index].textContent = "No results";
      return;
    }

    // clear content of flight path before we proceed
    qsa(".flight-path")[index].textContent = "";

    itinerary.forEach(flight => {
      let div = document.createElement("div");

      let src = (typeof flight.fly_from !== "undefined" && flight.fly_from) ?
        flight.fly_from : "Any";
      let dest = (typeof flight.fly_to !== "undefined" && flight.fly_to) ?
        flight.fly_to : "Any";

      div.textContent = `${src}${nbsp}→${nbsp}${dest}`;

      qsa(".flight-path")[index].appendChild(div);
    });
  }

  /**
   * Populates given fields in the saved itineraries table.
   * 
   * @param {number} index row number to update.
   * @param {object} update object to update fields, otherwise based on index.
   */
  updateRow(index, update = this._firebaseData[index]) {
    let price = -1;
    let retrieved;
    if (Array.isArray(update.history) && update.history.length > 0) {
      retrieved = update.history[update.history.length - 1].retrieved;
      price = update.history[update.history.length - 1].price;
    }

    // sets text content for each element to be rendered
    qsa(".name")[index].textContent =
      (typeof update.name !== "undefined") ? update.name : "Untitled";
    qsa(".created")[index].textContent = 
      `Created: ${(typeof update.created !== "undefined" &&
      typeof update.created.seconds === "number") ?
      localeString(update.created.seconds, false) : ""}`;
    qsa(".price")[index].textContent =
      (typeof price === "number" && price !== -1) ?
      localeStringUSD(price) : "No results";
    qsa(".retrieved")[index].textContent =
      (typeof retrieved !== "undefined" &&
      typeof retrieved.seconds === "number") ?
      localeString(retrieved.seconds, false) : "";
    if ((typeof update.dTime === "undefined" || update.dTime === null) &&
      typeof update.flyFrom === "undefined" || update.flyFrom === null) {
      qsa(".departure")[index].textContent = "No results";
    }
    else {
      qsa(".departure")[index].textContent =
        `${(typeof update.dTime !== "undefined") ?
        update.dTime : "None"}${nbsp}(${(typeof update.flyFrom !== "undefined")
        ? update.flyFrom : "None"})`;
    }
    if ((typeof update.aTime === "undefined" || update.aTime === null) &&
      typeof update.flyTo === "undefined" || update.flyTo === null) {
        qsa(".arrival")[index].textContent = "No results";
    }
    else {    
      qsa(".arrival")[index].textContent =
        `${(typeof update.aTime !== "undefined") ?
        update.aTime : "None"}${nbsp}(${(typeof update.flyTo !== "undefined") ?
        update.flyTo : "None"})`;
    }
    this.getFlightPath(index);
  }
  
  /**
   * Updates the given itinerary in the row
   * 
   * @param {number} index index of row
   */
  async updateItinerary(index) {
    let user = checkAuth();

    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }
    qsa(".update")[index].classList.add("disabled");

    let itinerary = this._firebaseData[index].itinerary;
    if (!Array.isArray(itinerary)) {
      qsa(".update")[index].classList.remove("disabled");
      console.error("No itinerary object was found.");
      return;
    }
    
    // Prepare details, including price.
    let res = await Promise.all(prepareFetches(new Itinerary(itinerary)))
      .then(responses => Promise.all(responses.map(res => res.json())))
      .then(bodies => bodies.flat())
      .catch(error => console.error(error));
    res.sort((a, b) => a.price - b.price);
    let price = -1;
    let dTime = null;
    let aTime = null;
    let flyFrom = null;
    let flyTo = null;

    if (typeof res[0] !== "undefined" && typeof res[0].price !== "undefined"
      && res[0]["route"].length === itinerary.length) {
      price = res[0].price;
      dTime = localeString(res[0].route[0].dTime);
      aTime = localeString(res[0].route[res[0].route.length - 1].aTime);
      flyFrom = res[0].route[0].flyFrom;
      flyTo = res[0].route[res[0].route.length - 1].flyTo;
    }

    let icon, message, color;
    let docId = this.docIds[index];
    let currentDate = new Date();

    firebase.firestore()
      .collection("itineraries")
      .doc(docId)
      .update({
        dTime: dTime,
        aTime: aTime,
        flyFrom: flyFrom,
        flyTo: flyTo,
        history: firebase.firestore.FieldValue.arrayUnion({
          price: price,
          retrieved: currentDate,
        }),
      }).then(() => {
        return new Promise((resolve, reject) => {
          if (price === -1) {
            reject("Could not update itinerary.");
          }
          else {
            resolve();
          }
        });
      }).then(() => {
        console.log(`${this._firebaseData[index].name} was succesfully updated`);

        icon = "done";
        message = "Itinerary updated!";
        color = "";
      }).catch(error => {
        console.error(error);

        icon = "error";
        message = "Error: Itinerary could not be updated.";
        color = "red";
      }).then(() => {
        qsa(".update")[index].classList.remove("disabled");
        
        // Display message.
        M.toast({
          html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
          displayLength: 1500,
          classes: color
        });

        let row = this._firebaseData[index];
        row.history.push({
          price: price,
          retrieved: {
            seconds: Date.parse(currentDate) / 1000,
          },
        });
        row.dTime = dTime;
        row.aTime = aTime;
        row.flyFrom = flyFrom;
        row.flyTo = flyTo;

        this.updateRow(index);
      });
  }

  /**
   * Loads itinerary by redirecting to the main page.
   * 
   * @param {number} index index of row
   */
  loadLink(index) {
    let data = this._firebaseData[index];

    window.location = new Itinerary(data.itinerary).link(data.name);
  }

  /**
   * Shares itinerary by copying URL to clipboard.
   * 
   * @param {number} index index of row
   */
  shareLink(index) {
    let data = this._firebaseData[index];
    if (typeof data.name === "undefined") {
      data.name = "Untitled";
    }

    if (!Array.isArray(data.itinerary)) {
      console.error("No itinerary object was found.");
      return;
    }

    shareItinerary(data.name, data.itinerary,
      qsa(".share")[index], qsa(".share-link")[index]);
  }

  /**
   * Hides the row from the table.
   * 
   * @param {number} index index of row
   */
  deleteRow(index) {
    qsa(".delete")[index].classList.add("disabled");
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
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action"
        id="undoButton${index}">Undo</button>`,
      displayLength: 5000,
      completeCallback: () => { (confirm) ?
        this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    // Reverse deletion if undo button is clicked, also dismiss toast that was
    // previously generated
    qs(`#undoButton${index}`).onclick = () => {
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
    qsa(".delete")[index].classList.remove("disabled");

    let id = this.docIds[index];
    firebase.firestore().collection("itineraries").doc(id).delete().then(() => {
      console.log(`${this._firebaseData[index].name} was succesfully deleted`);
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
    qsa(".delete")[index].classList.remove("disabled");
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