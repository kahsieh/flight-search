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

  getFirebaseItineraries(user.uid).then(data => {
    if (data.length === 0) {
      qs("#itineraries-authenticated").classList.add("hide");
      qs("#itineraries-none").classList.remove("hide");
    }
    else {
      Itineraries = new SavedItineraries(data);
    }
  }).catch(error => {
    console.error(error);
    qs("#itineraries-authenticated").classList.add("hide");
    qs("#itineraries-none").classList.remove("hide");
  });
});

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
   * @member {array} docIds Array of firebase doc IDs, indexed based on row.
   * @member {objects} charts Map of indexes to chart references.
   */
  constructor(firebaseData) {
    this._firebaseData = firebaseData;
    this.docIds = [];
    this.deletedProcessing = [];
    this.charts = {};
    this.createItineraryTable();

    getFirebaseIdToken().then(idToken => {
      this.idToken = idToken;
    }).catch(error => {
      console.error(error);
    });
  }

  /**
   * returns the length of the itinerary table
   */
  get length() { return qsa(".itinerary").length; }

  /**
   * Creates the itinerary rows and header
   */
  createItineraryTable() {
    this._firebaseData.forEach(data => {
      this.createItineraryRow(data);
      this.createChartRow(data.history);
    });

    this.createHeader();
  }

  /**
   * Creates the row to be displayed in the itinerary table.
   *
   * @param {object} row Row that contains itinerary object, along with name,
   * price, created timestamp, and updated timestamp
   */
  createItineraryRow(row) {
    // keep track of what row belongs to what id, used for deletion
    this.docIds.push(row.id);

    let itineraryRow = qs("#saved-itineraries").insertRow();
    itineraryRow.classList.add("itinerary", "clickable");
    let index = this.length - 1;

    // HTML template to be rendered for each row
    itineraryRow.innerHTML = `
      <td class="label">
        <b class="row-number no-wrap">${this.length}&nbsp;|&nbsp;</b><div
          class="name truncate no-wrap"></div>
        <br>
        <span class="created note"></span>
      </td>
      <td class="departure"></td>
      <td class="arrival"></td>
      <td class="flight-path">
        <div class="flight-path-none no-wrap hide">No results</div>
        <div class="fly-from flight-path-col truncate"></div>
        <div class="arrow flight-path-col truncate"></div>
        <div class="fly-to flight-path-col truncate"></div>
      </td>
      <td>
        <div class="price"></div>
        <span class="retrieved note"></span>
      </td>
      <td class="no-wrap">
        <button class="update btn-floating waves-effect waves-light">
          <i class="material-icons">refresh</i>
        </button>
        <button class="share btn-floating waves-effect waves-light">
          <i class="material-icons">share</i>
          <input type="hidden" class="share-link">
        </button>
        <button class="delete btn-floating waves-effect waves-light trash">
          <i class="material-icons">delete</i>
        </button>
        ${nbsp}
        <button class="history btn-flat waves-effect waves-light circle">
          <i class="small material-icons expand_more">expand_more</i>
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
      this.showHistory(index);
    }
  }

  /**
   * Creates the chart history row for use in showHistory().
   */
  createChartRow() {
    let colSpan = qs("#saved-itineraries tr").children.length;

    let chartRow = qs("#saved-itineraries").insertRow();
    chartRow.classList.add("chart", "clickable", "hide");
    let index = this.length - 1;

    chartRow.innerHTML = `
      <td colspan="${colSpan}">
        <p class="chart-none hide center-align"
          >Price history could not be created.</p>
        <canvas class="chart-history hide"></canvas>
      </td>
    `;

    // add hover class so that itinerary is also highlighted on hover
    chartRow.onmouseout = chartRow.onmouseover = event => {
      qsa(".itinerary")[index].classList.toggle("hover");
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
    `;
  }

  /**
   * Gets the overall flight path of the itinerary
   *
   * @param {number} index index of row
   */
  getFlightPath(index) {
    let itinerary = this._firebaseData[index].itinerary;
    let flightPath = qsa(".flight-path")[index];
    // display No results if itinerary is not an object
    if (!Array.isArray(itinerary)) {
      qsa(".flight-path-none")[index].classList.remove("hide");
      return;
    }

    let flyFromStr = [];
    let arrowStr = [];
    let flyToStr = [];

    itinerary.forEach(flight => {
      let src = (typeof flight.fly_from !== "undefined" && flight.fly_from) ?
        flight.fly_from : "Any";
      let dest = (typeof flight.fly_to !== "undefined" && flight.fly_to) ?
        flight.fly_to : "Any";

      flyFromStr.push(src);
      arrowStr.push("→");
      flyToStr.push(dest);
    });

    qsa(".fly-from")[index].textContent = flyFromStr.join("\n");
    qsa(".arrow")[index].textContent = arrowStr.join("\n");
    qsa(".fly-to")[index].textContent = flyToStr.join("\n");
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
      localeDate(update.created.seconds, false) : ""}`;
    qsa(".price")[index].textContent =
      (typeof price === "number" && price !== -1) ?
      localeCurrency(price) : "No results";
    qsa(".retrieved")[index].textContent =
      (typeof retrieved !== "undefined" &&
      typeof retrieved.seconds === "number") ?
      localeDate(retrieved.seconds, false) : "";
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
  updateItinerary(index) {
    let user = checkAuth();

    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }
    qsa(".update")[index].classList.add("disabled");

    let docId = this.docIds[index];
    let icon, message, color;

    updateFirebaseItinerary(docId, this._firebaseData[index]).then(() => {
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
        classes: color,
      });

      this.updateRow(index);
      // do not create a new chart if none is displayed
      this.updateChart(index, false);
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

    shareItinerary(data.name, new Itinerary(data.itinerary),
      qsa(".share")[index], qsa(".share-link")[index]);
  }

  /**
   * Hides the row from the table.
   *
   * @param {number} index index of row
   */
  deleteRow(index) {
    qsa(".delete")[index].classList.add("disabled");
    qsa(".itinerary")[index].classList.add("hide");
    qsa(".chart")[index].classList.add("hide");
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

    let docId = this.docIds[index];
    deleteFirebaseItinerary(docId).then(() => {
      console.log(`${this._firebaseData[index].name} was succesfully deleted`);
      this.deletedProcessing.splice(this.deletedProcessing.indexOf(docId), 1);
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
    let itineraryClass = qsa(".itinerary")[index].classList;
    itineraryClass.remove("hide");
    if (itineraryClass.contains("expanded")) {
      // show the chart if the itinerary row is expanded
      qsa(".chart")[index].classList.remove("hide");
    }
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

  /**
   * Shows the price history for the given itinerary.
   *
   * @param {number} index index of row
   */
  showHistory(index) {
    qsa(".itinerary")[index].classList.toggle("expanded");
    qsa(".chart")[index].classList.toggle("hide");
    this.updateChart(index);
  }

  /**
   * Updates or creates a chart based on firebase data.
   *
   * @param {number} index index of row
   * @param {boolean} create specifies whether to create a new chart or not.
   * this is mainly so that if the itinerary is updated, we do not create a new
   * chart if one has not been made yet.
   */
  updateChart(index, create = true) {
    const data = this._firebaseData[index];

    // Do not display chart if history is not an array.
    if (!Array.isArray(data.history)) {
      qsa(".chart-none")[index].classList.remove("hide");
      return;
    }

    // removes all entries in the array where the price === -1.
    const reduced = data.history.reduce((acc, {price, retrieved}) => {
      if (price !== -1) {
        acc.push({
          retrieved: retrieved.seconds,
          price: price,
        });
      }
      return acc;
    }, []);

    // transformed data so that it can be used with Chart.js
    const history = reduced.map(({price, retrieved}) => {
      return {
        x: new Date(retrieved * 1000),
        y: price,
      }
    });

    // Do not display chart if we have no data to display.
    if (history.length === 0) {
      qsa(".chart-none")[index].classList.remove("hide");
      return;
    }
    else {
      qsa(".chart-history")[index].classList.remove("hide");
    }

    // looks for the maximum price and returns it as an object, formatted as:
    // { price, index }.
    // x is the date, y is the price
    const max = history.reduce((acc, {y}, index) => {
      let currentMax = acc.price;
      return currentMax > y ? acc : { price: y, index: index };
    }, {});

    // does same as above, but finds minimum instead
    const min = history.reduce((acc, {y}, index) => {
      let currentMin = acc.price;
      return currentMin < y ? acc : { price: y, index: index };
    }, {});

    // create a new chart
    if (!(index in this.charts) && create) {
      const context = qsa(".chart-history")[index].getContext("2d");

      this.charts[index] = new Chart(context, {
        type: "line",
        data: {
          datasets: [{
            label: (typeof data.name !== "undefined") ?
              data.name : "Untitled",
            data: history,
            borderColor: "rgb(238, 110, 115)",
            fill: false,
            lineTension: 0,
          }]
        },
        options: {
          scales: {
            xAxes: [{
              type: "time",
              scaleLabel: {
                display: true,
                labelString: `${localeDate(
                  reduced[0].retrieved, false)}–${localeDate(
                  reduced[reduced.length - 1].retrieved, false)}`,
              },
              offset: true,
              ticks: {
                autoSkip: true,
                autoSkipPadding: 75,
                maxRotation: 0,
              },
            }],
            yAxes: [{
              type: "linear",
              gridLines: {
                drawBorder: false,
              },
              scaleLabel: {
                display: true,
                labelString: "Price",
              },
              offset: true,
              ticks: {
                stepSize: 10,
                maxTicksLimit: 7,
                autoSkip: true,
                autoSkipPadding: 75,
                maxRotation: 0,
              },
            }],
          },
          tooltips: {
            intersect: false,
            mode: "index",
            callbacks: {
            	label: (tooltip, data) => {
                let label =  "";
                let value = parseFloat(tooltip.value);

                label += this.ifMaxOrMin({
                  dataIndex: tooltip.index,
                  dataset: {
                    data: data.datasets[0].data,
                  },
                }, max, min, false);

            		label += localeCurrency(value);
            		return label;
              },
            },
          },
          elements: {
            point: {
              radius: (ctx) => {
                return this.ifMaxOrMin(ctx, max, min) ? 5 : 0;
              },
              hoverRadius: (ctx) => {
                return this.ifMaxOrMin(ctx, max, min) ? 7 : 0;
              },
              backgroundColor: (ctx) => {
                return this.ifMaxOrMin(ctx, max, min) ?
                  "rgb(39, 166, 154)" : // green
                  "rgb(238, 110, 115)"; // red
              },
              borderWidth: (ctx) => {
                return 1;
              },
              borderColor: (ctx) => {
                return this.ifMaxOrMin(ctx, max, min) ?
                  "rgb(39, 166, 154)" : // green
                  "rgb(238, 110, 115)"; // red
              },
            }
          },
        }
      });
    }
    // update the old chart, if it exists
    else if (typeof this.charts[index] !== "undefined") {
      const chart = this.charts[index];
      const config = this.charts[index].config;

      // update the history object displayed
      config.data.datasets[0].data = history;
      config.options.scales.xAxes[0].scaleLabel.labelString = `${localeDate(
        reduced[0].retrieved, false)}–${localeDate(
          reduced[reduced.length - 1].retrieved, false)}`;
      chart.update();
    }
  }

  /**
   * Updates the max/min price and returns if the index is equal to the new
   * max/min price.
   *
   * @param {object} context canvas context object, used for data retrieval
   * @param {object} max max value of dataset
   * @param {object} min min value of dataset
   * @param {boolean} latest true if we care about latest result
   *
   * @returns {string} "Max: " or "Min: " if true, for use in label
   *                   "" if false, to validate if index is max/min
   */
  ifMaxOrMin(context, max, min, latest = true) {
    let index = context.dataIndex;
    let data = context.dataset.data;
    let length = data.length;
    // update the current min/max values if needed
    if (data[length - 1].y >= max.price) {
      max = {
        retrieved: data[length - 1].x,
        price: data[length - 1].y,
        index: length - 1,
      };
    }
    if (data[length - 1].y <= min.price) {
      min = {
        retrieved: data[length - 1].x,
        price: data[length - 1].y,
        index: length - 1,
      };
    }

    // If max and min are the same, return empty string, regardless of latest.
    if (max.index === min.index) {
      return "";
    }

    // Return a string if the index is the index of the max value, or if
    // we do not care about the latest index, just return if it is equal to the
    // max price. The same logic applies for min as well.
    if (index === max.index || (!latest && data[index].y === max.price)) {
      return "Max: ";
    }
    if (index === min.index || (!latest && data[index].y === min.price)) {
      return "Min: ";
    }
    return "";
  }
}
