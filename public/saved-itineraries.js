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
  const user = checkAuth();
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
      sitable = new SavedItinerariesTable(data);
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
  if (sitable) {
    navigator.sendBeacon("/api/delete-itinerary",
      JSON.stringify({
        idToken: sitable._idToken,
        deletedProcessing: sitable._deletedProcessing,
      })
    );
  }
});

/**
 * This only fires once if screen width < 992 and it is not horizontal, or if
 * screen width > 992 and it is horizontal.
 */
addEventListener("resize", () => {
  if (sitable) {
    if ((innerWidth <= 992 && !sitable._horizontal) ||
      (innerWidth > 992 && sitable._horizontal)) {
      sitable._horizontal = !sitable._horizontal;
      sitable.resizeFlightPath();

      // Hide all charts, then re-show the first one that was expanded, if
      // one was expanded.
      const index = Array.from(qsa(".itinerary")).findIndex(
                        div => !div.classList.contains("hide") &&
                                div.classList.contains("expanded"));
      sitable.hideAllCharts();
      if (index !== -1) {
        sitable.showHistory(index);
      }
    }
  }
});

/**
 * Instance of SavedItinerariesTable. Should be managed by client code.
 */
let sitable;

/**
 * SavedItinerariesTable is a class that renders the saved itinerary table.
 *
 * Specific to saved-itineraries.html.
 */
class SavedItinerariesTable {
  /**
   * Populates the saved itineraries table based on a user's Firebase data.
   *
   * @param {object} firebaseData Data pulled from Firebase.
   */
  constructor(firebaseData) {
    this._firebaseData = firebaseData.filter(this.verifyDocument);
    this._docIds = [];
    this._deletedProcessing = [];
    this._charts = {};
    this._horizontal = innerWidth <= 992;
    getFirebaseIdToken().then(idToken => {
      this._idToken = idToken;
    }).catch(e => {
      console.error(e);
    });
    this.createItineraryTable();
  }

  get length() { return qsa(".itinerary").length; }

  /**
   * Creates table header and rows.
   */
  createItineraryTable() {
    this.createHeader();
    for (const data of this._firebaseData) {
      // Keep track of what row corresponds to what docId (used for deletion).
      this._docIds.push(data.id);
      this.createItineraryRow();
      this.createChartRow();
    }
    // Responsive table fix.
    fixResponsiveTh();
  }

  /**
   * Creates table header.
   */
  createHeader() {
    const headerRow = qs("#saved-itineraries-table").createTHead().insertRow();
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
   * Verifies that the Firebase document represents a usable itinerary.
   *
   * @param {!Object<string, *>} doc A Firebase document.
   * @return {boolean} Whether the document represents a usable itinerary.
   */
  verifyDocument(doc) {
    const knownKeys = new Set(["id", "uid", "name", "created",
                               "dTime", "aTime", "flyFrom", "flyTo",
                               "history", "itinerary"]);
    // Prohibit unknown keys.
    if (typeof doc !== "object" ||
        Object.keys(doc).filter(k => !knownKeys.has(k)).length > 0) {
      console.warn("Firebase document contains unknown key");
      return false;
    }
    // name: must be trimmed string of size [1, 100].
    if (typeof doc.name !== "string" || doc.name.length > 100 ||
        !/^\S.*$/.test(doc.name) || !/^.*\S$/.test(doc.name)) {
      console.warn("Firebase document contains corrupt name");
      return false;
    }
    // created: must be Firebase timestamp.
    if (!isFirebaseTimestamp(doc.created)) {
      console.warn("Firebase document contains corrupt created");
      return false;
    }
    // dTime, aTime: must be null or UNIX timestamp (number).
    if (doc.dTime !== null && typeof doc.dTime !== "number"  ||
        doc.aTime !== null && typeof doc.aTime !== "number") {
      console.warn("Firebase document contains corrupt dTime or aTime");
      return false;
    }
    // flyFrom, flyTo: must be null or string matching [A-Z]{3}.
    if (doc.flyFrom !== null && !/[A-Z]{3}/.test(doc.flyFrom) ||
        doc.flyTo !== null && !/[A-Z]{3}/.test(doc.flyTo)) {
      console.warn("Firebase document contains corrupt flyFrom or flyTo");
      return false;
    }
    // history: must be array of objects mapping "price" to a number and
    // "retrieved" to a Firebase timestamp.
    if (!Array.isArray(doc.history)) {
      console.warn("Firebase document contains corrupt history");
      return false;
    }
    for (const record of doc.history) {
      if (typeof record !== "object" || Object.keys(record).length !== 2 ||
          typeof record.price !== "number" ||
          !isFirebaseTimestamp(record.retrieved)) {
        console.warn("Firebase document contains corrupt history");
        return false;
      }
    }
    // Prohibit excessively large itineraries (not encodable as a URL of
    // ≤ 2,048 characters). Invalid values within the itinerary field may cause
    // subfields to be discarded, but the document is still usable.
    if (new Itinerary(doc.itinerary).link(doc.name).length > MAX_URL_SIZE) {
      console.warn("Firebase document contains oversized itinerary");
      return false;
    }
    return true;
  }

  /**
   * Creates the row to be displayed in the saved itineraries table.
   */
  createItineraryRow() {
    const itineraryRow = qs("#saved-itineraries").insertRow();
    itineraryRow.classList.add("itinerary", "clickable");
    let index = this.length - 1;

    // Write and update HTML template for each row.
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
          <i class="small material-icons">expand_more</i>
        </button>
      </td>
    `;
    this.updateRow(index);

    // Add onclick function for the row.
    itineraryRow.onclick = () => {
      this.loadLink(index);
    }

    // Add onclick functions for each button.
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
    const colSpan = qs("#saved-itineraries tr").children.length;

    // Create new row in table.
    const chartRow = qs("#saved-itineraries").insertRow();
    chartRow.classList.add("chart", "clickable", "hide");
    let index = this.length - 1;

    // HTML template to be rendered for each chart row.
    chartRow.innerHTML = `
      <td colspan="${colSpan}">
        <p class="chart-none hide center-align"
          >Price history could not be created.</p>
        <div class="chart-history hide">
          <canvas class="chart-canvas"></canvas>
        </div>
      </td>
    `;

    // Add hover class so that itinerary is also highlighted on hover.
    chartRow.onmouseout = chartRow.onmouseover = _ => {
      qsa(".itinerary")[index].classList.toggle("hover");
    }
  }

  /**
   * Populates fields in the saved itineraries table.
   *
   * @param {number} index Row number to update.
   * @param {?Object} update Object to update fields with, otherwise used
   *   Firebase data corresponding to index.
   */
  updateRow(index, update = this._firebaseData[index]) {
    let price = -1;
    let retrieved;
    if (Array.isArray(update.history) && update.history.length > 0) {
      price = update.history[update.history.length - 1].price;
      retrieved = update.history[update.history.length - 1].retrieved;
    }

    // Set name column.
    qsa(".name")[index].textContent = update.name || "Untitled";
    qsa(".created")[index].textContent = "Created: " +
      typeof update.created !== "undefined" &&
        typeof update.created.seconds === "number" ?
      localeDate(update.created.seconds, false) : "Unknown";

    // Set departure column.
    if ((typeof update.dTime === "undefined" || update.dTime === null) &&
        (typeof update.flyFrom === "undefined" || update.flyFrom === null)) {
      qsa(".departure")[index].textContent = "No results";
    }
    else {
      qsa(".departure")[index].textContent =
        `${typeof update.dTime !== "undefined" ? localeDate(update.dTime)
                                               : "None"}${nbsp}(${
          typeof update.flyFrom !== "undefined" ? update.flyFrom : "None"})`;
    }

    // Set return column.
    if ((typeof update.aTime === "undefined" || update.aTime === null) &&
        (typeof update.flyTo === "undefined" || update.flyTo === null)) {
      qsa(".arrival")[index].textContent = "No results";
    }
    else {
      qsa(".arrival")[index].textContent =
        `${typeof update.aTime !== "undefined" ? localeDate(update.aTime)
                                               : "None"}${nbsp}(${
           typeof update.flyTo !== "undefined" ? update.flyTo : "None"})`;
    }

    // Set flight path column.
    this.getFlightPath(index);

    // Set price column.
    qsa(".price")[index].textContent =
      typeof price === "number" && price !== -1 ?
      localeCurrency(price) : "No results";
    qsa(".retrieved")[index].textContent =
      typeof retrieved !== "undefined" &&
        typeof retrieved.seconds === "number" ?
      localeDate(retrieved.seconds, false) : "";
  }

  /**
   * Populates the overall flight path of the itinerary.
   *
   * @param {number} index Row number to update.
   */
  getFlightPath(index) {
    let itinerary = this._firebaseData[index].itinerary;

    // Display "No results" if itinerary is invalid.
    if (!Array.isArray(itinerary)) {
      qsa(".flight-path-none")[index].classList.remove("hide");
      return;
    }

    // Arrange strings.
    const flyFromStr = [];
    const arrowStr = [];
    const flyToStr = [];

    // If _horizontal, we take the longestFlightPath instead
    const length = (this._horizontal) ? this.longestFlightPath :
      itinerary.length;
    for (let i = 0; i < length; i++) {
      // populate with blanks if _horizontal = true;
      let flight = (typeof itinerary[i] !== "undefined") ? itinerary[i] :
        { fly_from: ' ', fly_to: ' ' };

      flyFromStr.push(flight.fly_from || "Any");
      arrowStr.push((typeof itinerary[i] !== "undefined") ? "→" : ' ');
      flyToStr.push(flight.fly_to || "Any");
    }

    // Write to document.
    qsa(".fly-from")[index].textContent = flyFromStr.join("\n");
    qsa(".arrow")[index].textContent = arrowStr.join("\n");
    qsa(".fly-to")[index].textContent = flyToStr.join("\n");
  }

  get longestFlightPath() {
    return this._firebaseData.reduce((acc, {itinerary}, index) => {
      return itinerary.length > acc ? itinerary.length : acc;
    }, 0);
  }

  /**
   * Resizes the flight path table cell.
   */
  resizeFlightPath() {
    for (let i = 0; i < this.length; i++) {
      this.getFlightPath(i);
    }
  }

  /**
   * Loads itinerary by redirecting to the main page.
   *
   * @param {number} index Row number to load.
   */
  loadLink(index) {
    const data = this._firebaseData[index];
    window.location = new Itinerary(data.itinerary).link(data.name);
  }

  /**
   * Updates the itinerary in the row.
   *
   * @param {number} index Row number to update.
   */
  updateItinerary(index) {
    const user = checkAuth();
    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }

    qsa(".update")[index].classList.add("disabled");
    let docId = this._docIds[index];
    let icon, message, color;

    updateFirebaseItinerary(docId, this._firebaseData[index]).then(() => {
      console.log(`${this._firebaseData[index].name} was succesfully updated`);

      icon = "done";
      message = "Itinerary updated!";
      color = "";
    }).catch(e => {
      console.error(e);

      icon = "error";
      message = "Error: Itinerary could not be updated.";
      color = "red";
    }).then(() => {
      // Update UI, but don't create a new chart if none is displayed.
      qsa(".update")[index].classList.remove("disabled");
      this.updateRow(index);
      if (this._horizontal) {
        this.showHistory(index, false);
      }
      else {
        this.updateChart(index, false);
      }

      // Display message.
      M.toast({
        html: `<i class="material-icons left">${icon}</i><div>${message}</div>`,
        displayLength: 1500,
        classes: color,
      });
    });
  }

  /**
   * Shares itinerary by copying URL to clipboard.
   *
   * @param {number} index Row number to load.
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

    shareItinerary(data.name,
                   new Itinerary(data.itinerary),
                   qsa(".share")[index],
                   qsa(".share-link")[index]);
  }

  /**
   * Hides the row from the table and prepares for itinerary deletion.
   *
   * @param {number} index Row number to hide.
   */
  deleteRow(index) {
    const physicalIndex = this._horizontal ? this._docIds.length : index;
    qsa(".itinerary")[index].classList.add("hide");
    qsa(".chart")[physicalIndex].classList.add("hide");
    this.updateRowNumbers();
    this._deletedProcessing.push(this._docIds[index]);

    // Dismiss previous toast, if one exists.
    let toastElement = qs(".toast");
    if (toastElement !== null) {
      M.Toast.getInstance(toastElement).dismiss();
    }

    // Make toast with undo button for deletion.
    let confirm = true;
    M.toast({
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action"
             id="undoButton${index}">Undo</button>`,
      displayLength: 5000,
      completeCallback: () => { confirm ?
        this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    // Reverse deletion if undo button is clicked, also dismiss toast that was
    // previously generated.
    qs(`#undoButton${index}`).onclick = () => {
      confirm = false;
      M.Toast.getInstance(qs(".toast")).dismiss();
    }
  }

  /**
   * Deletes the itinerary by sending a POST request to the backend.
   *
   * @param {number} index Row number to delete.
   */
  deleteItinerary(index) {
    const user = checkAuth();
    if (!user || !user.uid) {
      console.error("User is not authenticated.");
      return;
    }

    const docId = this._docIds[index];
    deleteFirebaseItinerary(docId).then(() => {
      console.log(`${this._firebaseData[index].name} was succesfully deleted`);
      this._deletedProcessing.splice(this._deletedProcessing.indexOf(docId), 1);
    }).catch(e => console.error(e));
  }

  /**
   * Unhides the row and cancels the deletion of the Firebase document.
   *
   * @param {number} index Row number to undelete.
   */
  undoDeleteItinerary(index) {
    this._deletedProcessing.splice(
      this._deletedProcessing.indexOf(this._docIds[index]), 1);
    let itineraryClassList = qsa(".itinerary")[index].classList;
    itineraryClassList.remove("hide");
    // Show the chart if the itinerary row is expanded.
    if (itineraryClassList.contains("expanded")) {
      const physicalIndex = this._horizontal ? this._docIds.length : index;
      qsa(".chart")[physicalIndex].classList.remove("hide");
    }
    this.updateRowNumbers();
  }

  /**
   * Updates all the row numbers if a row was deleted.
   */
  updateRowNumbers() {
    qsa("tr:not([hidden]) .row-number").forEach((node, index) => {
      node.textContent = `${index + 1}${nbsp}|${nbsp}`;
    });
  }

  /**
   * Shows the price history chart for the given itinerary.
   *
   * @param {number} index Row number to show chart for.
   * @param {boolean=} toggle If already shown, hide the history instead.
   */
  showHistory(index, toggle = true) {
    // In the horizontal layout, only one chart can be viewed at once, so
    // unless we're trying to toggle the current chart, hide any chart that
    // might be on the screen.
    if (this._horizontal &&
        !(toggle && qsa(".itinerary")[index].classList.contains("expanded"))) {
      this.hideAllCharts(index);
    }

    // In the horizontal layout, divert update to external chart.
    const physicalIndex = this._horizontal ? this._docIds.length : index;
    if (toggle) {
      qsa(".itinerary")[index].classList.toggle("expanded");
      qsa(".chart")[physicalIndex].classList.toggle("hide");
    }
    else {
      qsa(".itinerary")[index].classList.add("expanded");
      qsa(".chart")[physicalIndex].classList.remove("hide");
    }
    this.updateChart(index);

    // Update button icon.
    const icon = qsa(".history")[index].firstElementChild;
    switch (icon.textContent) {
      case "expand_more":
        icon.textContent = "expand_less";
        break;
      case "expand_less":
        icon.textContent = "expand_more";
        break;
    }
  }

  /**
   * Hides all charts and restores "show history" buttons.
   */
  hideAllCharts() {
    qsa(".itinerary").forEach(div => div.classList.remove("expanded"));
    qsa(".history").forEach(
        button => button.firstElementChild.innerText = "expand_more");
    qsa(".chart").forEach(div => div.classList.add("hide"));
    qsa(".chart-none").forEach(div => div.classList.add("hide"));
    qsa(".chart-history").forEach(div => div.classList.add("hide"));
  }

  /**
   * Updates or creates a chart based on firebase data.
   *
   * @param {number} index Row number to update chart for.
   * @param {boolean} create Specifies whether to create a new chart or not.
   *   This is mainly so that if the itinerary is updated, we do not create a
   *   new chart if one has not been made yet.
   */
  updateChart(index, create = true) {
    const data = this._firebaseData[index];

    // Divert update to external chart in horizontal layout.
    const physicalIndex = this._horizontal ? this._docIds.length : index;

    // Do not display chart if history is not an array.
    if (!Array.isArray(data.history)) {
      qsa(".chart-none")[physicalIndex].classList.remove("hide");
      return;
    }

    // Removes all entries in the array where the price === -1.
    const reduced = data.history.reduce((acc, {price, retrieved}) => {
      if (price !== -1) {
        acc.push({
          retrieved: retrieved.seconds,
          price: price,
        });
      }
      return acc;
    }, []);

    // Transforms data so that it can be used with Chart.js.
    const history = reduced.map(({price, retrieved}) => {
      return {
        x: new Date(retrieved * 1000),
        y: price,
      };
    });

    // Do not display chart if we have no data to display.
    if (history.length === 0) {
      qsa(".chart-none")[physicalIndex].classList.remove("hide");
      return;
    }
    else {
      qsa(".chart-history")[physicalIndex].classList.remove("hide");
    }

    // Looks for the maximum/minimum price and returns it as an object,
    // formatted as: { price, index }.
    const max = history.reduce((acc, {y}, index) => {
      return y > acc.price ? { price: y, index: index } : acc;
    }, {price: -Infinity});
    const min = history.reduce((acc, {y}, index) => {
      return y < acc.price ? { price: y, index: index } : acc;
    }, {price: Infinity});

    // Specify properties of points on the chart.
    const pointProps = {
      radius: ctx => {
        return this.ifMaxOrMin(ctx, max, min) ? 5 : 0;
      },
      hoverRadius: ctx => {
        return this.ifMaxOrMin(ctx, max, min) ? 7 : 0;
      },
      backgroundColor: ctx => {
        return this.ifMaxOrMin(ctx, max, min) ?
          "rgb(39, 166, 154)" : // green
          "rgb(238, 110, 115)"; // red
      },
      borderWidth: _ => {
        return 1;
      },
      borderColor: ctx => {
        return this.ifMaxOrMin(ctx, max, min) ?
          "rgb(39, 166, 154)" :  // green
          "rgb(238, 110, 115)";  // red
      },
    };

    // Create a new chart. x is the date, y is the price.
    if (!(physicalIndex in this._charts) && create) {
      const context = qsa(".chart-canvas")[physicalIndex].getContext("2d");

      this._charts[physicalIndex] = new Chart(context, {
        type: "line",
        data: {
          datasets: [{
            label: data.name || "Untitled",
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
            point: pointProps,
          },
        }
      });
    }
    // Update the old chart, if it exists.
    else if (typeof this._charts[physicalIndex] !== "undefined") {
      const chart = this._charts[physicalIndex];
      const config = this._charts[physicalIndex].config;

      // Update the history object displayed.
      config.data.datasets[0].label = data.name || "Untitled";
      config.data.datasets[0].data = history;
      config.options.scales.xAxes[0].scaleLabel.labelString = `${localeDate(
        reduced[0].retrieved, false)}–${localeDate(
          reduced[reduced.length - 1].retrieved, false)}`;
      config.options.elements.point = pointProps;
      chart.update();
    }
  }

  /**
   * Updates the max/min price and returns if the index is equal to the new
   * max/min price.
   *
   * @param {!Object} context Canvas context object, used for data retrieval.
   * @param {!Object} max Max value of dataset.
   * @param {!Object} min Min value of dataset.
   * @param {boolean} latest Whether we care about latest result.
   * @returns {string} "Max: " or "Min: " if true, for use in label.
   *                   "" if false, to validate if index is max/min.
   */
  ifMaxOrMin(context, max, min, latest = true) {
    const index = context.dataIndex;
    const data = context.dataset.data;
    const length = data.length;

    // Update the current min/max values if needed.
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

    // Return a string if the index is the index of the max value, or if we do
    // not care about the latest index, just return if it is equal to the max
    // price. The same logic applies for min as well.
    if (index === max.index || (!latest && data[index].y === max.price)) {
      return "Max: ";
    }
    if (index === min.index || (!latest && data[index].y === min.price)) {
      return "Min: ";
    }
    return "";
  }
}
