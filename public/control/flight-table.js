/*
Five Peas Flight Search
flight-table.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Instances of FlightTable. Managed by the FlightTables themselves.
 */
let ftables = [];

class FlightTable {
  /**
   * Creates a new tab and table based on the given DOM elements, then
   * re-initializes tabs.
   *
   * @param {!Element} tabs <ul> element for tabs.
   * @param {!Element} columns <select> element for choosing columns.
   * @param {!Element} tables <div> element for flight tables.
   * @param {!Element} book <button> element for booking.
   */
  constructor(tabs, columns, tables, book) {
    this._tabs = tabs;
    this._columns = columns;
    this._tables = tables;
    this._book = book;

    // Destroy old instance and remove any indicators.
    if (FlightTable.tabsInstance) {
      FlightTable.tabsInstance.destroy();
    }
    this._tabs.querySelectorAll(".indicator").forEach(e => e.remove());

    // Save active tab.
    let active_tab = null;
    for (const [i, ft] of ftables.entries()) {
      if (ft._tab.firstElementChild.classList.contains("active")) {
        active_tab = i;
        break;
      }
    }

    // Set fields.
    this._i = ftables.length;
    this._tab = this._addTab();
    this._table = this._addTable();
    this._displayed = new Set();
    this._selected = null;

    // Update tabs instance.
    FlightTable.tabsInstance = M.Tabs.init(this._tabs, {});
    FlightTable.tabsInstance.select(`table${active_tab}`);
    ftables.push(this);
  }

  get selected() { return this._selected; }

  /**
   * Adds a tab to the UI.
   *
   * @return {Element} li element.
   */
  _addTab() {
    let tab = document.createElement("li");
    tab.classList.add("tab");
    tab.innerHTML = `
      <a href="#table${this._i}">
        Flight <span class="flight-index">${this._i + 1}</span>
        <span class="check hide">✓</span>
      </a>
    `;
    this._tabs.appendChild(tab);
    return tab;
  }

  /**
   * Adds a flight table to the UI and updates columns.
   *
   * @return {Element} div element.
   */
  _addTable() {
    let table = document.createElement("div");
    table.classList.add(["col", "s12"]);
    table.id = `table${this._i}`;
    table.innerHTML = `
      <table class="highlight">
        <thead><tr>
          ${Object.entries(FlightTable.DISPLAY_COLUMNS)
            .map(([k, v]) => `<th class="${k}">${v}</th>`).join("")}
        </tr></thead>
        <tbody></tbody>
      </table>
    `;
    this._tables.appendChild(table);
    FlightTable.updateColumns();
    return table;
  }

  /**
   * Adds a flight to table if it isn't displayed already.
   *
   * @param {Object} itinerary Itinerary returned by the API.
   * @param {object} flight Flight returned by the API. Same as itinerary for
   *   single flights.
   */
  addFlight(itinerary, flight) {
    // Check if the flight is already displayed in the table.
    if (this._displayed.has(flight.id)) {
      return;
    }
    else {
      this._displayed.add(flight.id);
    }

    // Populate cells.
    let cells = Array(FlightTable.COLUMNS.length).fill("");
    let i;
    for (const segment of flight.route) {
      // Flight.
      i = FlightTable.COLUMNS.indexOf("flight_no");
      let airline = segment.airline;
      let flight_no = segment.flight_no;
      // Use the operating carrier and flight number if they're available.
      if (segment.operating_carrier && segment.operating_flight_no) {
        airline = segment.operating_carrier;
        flight_no = segment.operating_flight_no;
      }
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += `
        <img src="https://images.kiwi.com/airlines/128/${airline}.png"
          class="airline-logo"></img> ${airline} ${flight_no}
      `;

      // Departure.
      i = FlightTable.COLUMNS.indexOf("dTime");
      let br_warning = segment.bags_recheck_required ? `
        <i class="material-icons tiny tooltipped red-text"
        data-position="bottom" data-tooltip="Bag recheck required">warning</i>
      ` : "";
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += `
        ${localeString(segment.dTime)} (${segment.flyFrom})${br_warning}
      `;

      // Arrival.
      i = FlightTable.COLUMNS.indexOf("aTime");
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += `${localeString(segment.aTime)} (${segment.flyTo})`;

      // Flight Time.
      i = FlightTable.COLUMNS.indexOf("flight_time");
      let duration = segment.aTimeUTC - segment.dTimeUTC;
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += `
        ${Math.floor(duration / 3600)}h ${Math.floor(duration % 3600 / 60)}m
      `;

      // Aircraft.
      i = FlightTable.COLUMNS.indexOf("equipment");
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += segment.equipment ? segment.equipment : "—";

      // Fare Class.
      i = FlightTable.COLUMNS.indexOf("fare_basis");
      if (cells[i]) {
        cells[i] += "<br>";
      }
      cells[i] += segment.fare_classes ? segment.fare_classes : "—";
      cells[i] += segment.fare_basis ? ` (${segment.fare_basis})` : "";
    }

    // Checked bag.
    i = FlightTable.COLUMNS.indexOf("hold_weight");
    let customary = "", metric = "";
    if (flight.baglimit.hold_weight) {
      customary += parseInt(kgToLb(flight.baglimit.hold_weight)) + " lb";
      metric += flight.baglimit.hold_weight + " kg";
    }
    if (flight.baglimit.hold_dimensions_sum) {
      if (customary) {
        customary += ", ";
      }
      customary += parseInt(cmToIn(flight.baglimit.hold_dimensions_sum))
                + " in total";
      if (metric) {
        metric += ", ";
      }
      metric += flight.baglimit.hold_dimensions_sum + " cm total";
    }
    cells[i] += `
      <div style="line-height: normal">
        ${customary}<br>
        <span class="note">${metric}</span>
      </div>
    `;

    // Carry-on bag.
    i = FlightTable.COLUMNS.indexOf("hand_weight");
    customary = "", metric = "";
    if (flight.baglimit.hand_weight) {
      customary += parseInt(kgToLb(flight.baglimit.hand_weight)) + " lb";
      metric += flight.baglimit.hand_weight + " kg";
    }
    if (flight.baglimit.hold_length && flight.baglimit.hold_height &&
        flight.baglimit.hold_width) {
      if (customary) {
        customary += ", ";
      }
      customary += `
        ${parseInt(cmToIn(flight.baglimit.hold_length))} ×
        ${parseInt(cmToIn(flight.baglimit.hold_height))} ×
        ${parseInt(cmToIn(flight.baglimit.hold_width))} in
      `;
      if (metric) {
        metric += ", ";
      }
      metric += `
        ${flight.baglimit.hold_length} ×
        ${flight.baglimit.hold_height} ×
        ${flight.baglimit.hold_width} cm
      `;
    }
    cells[i] += `
      <div style="line-height: normal">
        ${customary}<br>
        <span class="note">${metric}</span>
      </div>
    `;

    // PNR Count.
    i = FlightTable.COLUMNS.indexOf("pnr_count");
    cells[i] += `<div style="line-height: normal">${flight.pnr_count}</div>`;

    // Duration.
    i = FlightTable.COLUMNS.indexOf("fly_duration");
    cells[i] += `
      <div style="line-height: normal">
        ${flight.fly_duration}<br>
        <span class="note">${flight.flyFrom}–${flight.flyTo}</span>
      </div>
    `;

    // Stops.
    i = FlightTable.COLUMNS.indexOf("stops");
    let vi_warning = flight.virtual_interlining ? `
      <i class="material-icons tiny tooltipped red-text" data-position="bottom"
        data-tooltip="Self-connection">warning</i>
    ` : "";
    let ac_warning = flight.has_airport_change ? `
      <i class="material-icons tiny tooltipped red-text" data-position="bottom"
        data-tooltip="Airport change">warning</i>
    ` : "";
    let ta_warning = flight.throw_away_ticketing ? `
      <i class="material-icons tiny tooltipped red-text" data-position="bottom"
        data-tooltip="Throwaway ticketing">warning</i>
    ` : "";
    switch (flight.route.length) {
      case 1:
        cells[i] += `Nonstop${vi_warning}${ac_warning}${ta_warning}`;
        break;
      case 2:
        const duration = flight.route[1].dTimeUTC - flight.route[0].aTimeUTC;
        const duration_text = `
          ${Math.floor(duration / 3600)}h ${Math.floor(duration % 3600 / 60)}m
        `;
        cells[i] += `
          <div style="line-height: normal">
            1 stop${vi_warning}${ac_warning}${ta_warning}<br>
            <span class="note">${duration_text} ${flight.route[0].flyTo}</span>
          </div>
        `;
        break;
      default:
        let stops = flight.route.slice(0, -1).map(segment => segment.flyTo);
        cells[i] += `
          <div style="line-height: normal">
            ${stops.length} stops${vi_warning}${ac_warning}${ta_warning}<br>
            <span class="note">${stops.join(", ")}</span>
          </div>
        `;
        break;
    }

    // Price.
    i = FlightTable.COLUMNS.indexOf("price");
    cells[i] += `
      <div style="line-height: normal">
        ${localeStringUSD(itinerary.price)}<br>
        <span class="note">entire trip</span>
      </div>
    `;

    // Insert row.
    let row = this._table.lastElementChild.lastElementChild.insertRow();
    row.classList.add("clickable");
    if (flight.id === this._selected) {
      row.classList.add("selected");
    }

    row.onclick = () => {
      ftables[this._i]._selected =
        ftables[this._i]._selected ? null : flight.id;
      this._book.onclick = () => window.open(itinerary.deep_link);
      FlightTable.displayResults();
    };
    for (let [i, cell] of cells.entries()) {
      row.innerHTML += `<td class="${FlightTable.COLUMNS[i]}">${cell}</td>`;
    }
  }

  /**
   * Clears the contents of the table, but not the the selected flight ID, if
   * there is one.
   */
  clear() {
    this._table.lastElementChild.lastElementChild.innerHTML = "";
    this._displayed.clear();
  }

  /**
   * Clears the selected flight ID.
   */
  clearSelection() {
    this._selected = null;
  }

  /**
   * Removes a tab and table. Clears all other tables.
   */
  remove() {
    // Determine new length.
    const n = ftables.length - 1;

    // Remove existing tables.
    for (let ft of ftables) {
      ft._tab.remove();
      ft._table.remove();
    }
    ftables = [];

    // Clear static fields.
    FlightTable.res = [];
    FlightTable.single = null;

    // Create new tables.
    for (let i = 0; i < n; i++) {
      new FlightTable(this._tabs, this._columns, this._tables, this._book);
    }
    FlightTable.displayResults();
  }

  /**
   * Refreshes tables with the latest results.
   *
   * @param {?Response} res Results from Kiwi, if new.
   * @param {?boolean} single Whether the results are in single-flight format.
   */
  static displayResults(res = null, single = null) {
    // Update cached results.
    if (res) {
      this.res = res;
      this.single = single;
    }
    res = this.res;
    single = this.single;

    // Refresh tables.
    if (ftables.length === 0) {
      return;
    }
    ftables.forEach(ft => ft.clear());
    for (const itinerary of res) {
      if (single) {
        let ft = ftables[0];
        // If there's no selection, display all flights. Otherwise, display
        // only the selected flight.
        if (!ft.selected || itinerary.id === ft.selected) {
          ft.addFlight(itinerary, itinerary);
        }
      }
      // If there are no selections, process all itineraries. Otherwise,
      // process only itineraries that don't conflict with the selection.
      else if (itinerary.route.every((v, i) =>
               !ftables[i].selected || v.id === ftables[i].selected)) {
        for (const [i, segment] of itinerary.route.entries()) {
          ftables[i].addFlight(itinerary, segment);
        }
      }
    }
    this.updateColumns();

    // Initialize tooltips and format tabs.
    for (const ft of ftables) {
      M.Tooltip.init(ft._table.querySelectorAll(".tooltipped"), {});
      if (ft.selected) {
        ft._tab.querySelector(".check").classList.remove("hide");
      }
      else {
        ft._tab.querySelector(".check").classList.add("hide");
      }
    }

    // Format booking button.
    if (ftables.every(v => v.selected)) {
      ftables[0]._book.classList.remove("disabled");
    }
    else {
      ftables[0]._book.classList.add("disabled");
    }
  }

  /**
   * Shows or hides columns according to the user's selection.
   */
  static updateColumns() {
    if (ftables.length === 0) {
      return;
    }
    for (const column of ftables[0]._columns.children) {
      if (column.value === "") {
        continue;
      }
      ftables[0]._tables.querySelectorAll(`.${column.value}`)
          .forEach(e => e.style.display = column.selected ? "" : "none");
    }
  }
}

// -----------------------------------------------------------------------------
// STATIC FIELDS
// -----------------------------------------------------------------------------

/**
 * Cached response from Kiwi.
 */
FlightTable.res = [];
FlightTable.single = null;

/**
 * Materialize tabs instance.
 */
FlightTable.tabsInstance = null;

/**
 * Dictionary mapping supported column names to their display names.
 */
FlightTable.DISPLAY_COLUMNS = {
  "flight_no": "Flight",
  "dTime": "Departure",
  "aTime": "Arrival",
  "flight_time": "Flight time",
  "equipment": "Aircraft",
  "fare_basis": "Fare class/basis",
  "hold_weight": "Checked bag",
  "hand_weight": "Carry-on bag",
  "pnr_count": "Tickets",
  "fly_duration": "Duration",
  "stops": "Stops",
  "price": "Price",
};

/**
 * List of supported columns.
 */
FlightTable.COLUMNS = Object.keys(FlightTable.DISPLAY_COLUMNS);
