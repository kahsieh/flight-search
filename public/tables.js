/*
Five Peas Flight Search
tables.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

const columns = [
  ["Flight", "flight_no"],
  ["Departure", "dTime"],
  ["Arrival", "aTime"],
  ["Flight time", "flight_time"],
  ["Aircraft", "equipment"],
  ["Fare class/basis", "fare_basis"],
  ["Checked bag", "hold_weight"],
  ["Carry-on bag", "hand_weight"],
  ["Tickets", "pnr_count"],
  ["Duration", "fly_duration"],
  ["Stops", "stops"],
  ["Price", "price"],
];

class FlightTable {
  /**
   * Creates a new tab and table, then re-initializes tabs.
   */
  constructor() {
    // Destroy old instance and remove any indicators.
    if (this.constructor.tabs_instance) {
      this.constructor.tabs_instance.destroy();
    }
    qsa("#tabs .indicator").forEach(e => e.remove());

    // Save active tab.
    let active_tab = null;
    for (const [i, ft] of this.constructor.tables.entries()) {
      if (ft._tab.firstElementChild.classList.contains("active")) {
        active_tab = i;
        break;
      }
    }

    // Set fields.
    this._i = this.constructor.tables.length;
    this._tab = this._addTab();
    this._table = this._addTable();
    this._displayed = {};
    this._selected = null;

    // Update static fields.
    this.constructor.tabs_instance = M.Tabs.init(qs("#tabs"), {});
    this.constructor.tabs_instance.select(`table${active_tab + 1}`);
    this.constructor.tables.push(this);
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
      <a href="#table${this._i + 1}">
        Flight <span class="flight-index">${this._i + 1}</span>
        <span class="check hide">✓</span>
      </a>
    `;
    qs("#tabs").appendChild(tab);
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
    table.id = `table${this._i + 1}`;
    table.innerHTML = `
      <table class="highlight">
        <thead><tr>
          ${columns.map(v => `<th class="${v[1]}">${v[0]}</th>`).join("")}
        </tr></thead>
        <tbody></tbody>
      </table>
    `;
    qs("#tables").appendChild(table);
    this.constructor.updateColumns();
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
    if (this._displayed[flight.id]) {
      return;
    }
    else {
      this._displayed[flight.id] = true;
    }

    // Populate cells.
    let cells = Array(columns.length).fill("");
    for (const segment of flight.route) {
      // Flight.
      let airline = segment.airline;
      let flight_no = segment.flight_no;
      if (segment.operating_carrier && segment.operating_flight_no) {
        airline = segment.operating_carrier;
        flight_no = segment.operating_flight_no;
      }
      if (cells[0]) {
        cells[0] += "<br>";
      }
      cells[0] += `
        <img src="https://images.kiwi.com/airlines/128/${airline}.png" class="airline-logo"></img>
        ${airline} ${flight_no}
      `;

      // Departure.
      if (cells[1]) {
        cells[1] += "<br>";
      }
      let br_warning = segment.bags_recheck_required ? `
        <i class="material-icons tiny tooltipped red-text" data-position="bottom"
          data-tooltip="Bag recheck required">warning</i>
      ` : "";
      cells[1] += `${localeString(segment.dTime)} (${segment.flyFrom})${br_warning}`;

      // Arrival.
      if (cells[2]) {
        cells[2] += "<br>";
      }
      cells[2] += `${localeString(segment.aTime)} (${segment.flyTo})`;

      // Flight Time.
      if (cells[3]) {
        cells[3] += "<br>";
      }
      let duration = segment.aTimeUTC - segment.dTimeUTC;
      cells[3] += `
        ${Math.floor(duration / 3600)}h ${Math.floor(duration % 3600 / 60)}m
      `;

      // Aircraft.
      if (cells[4]) {
        cells[4] += "<br>";
      }
      cells[4] += segment.equipment ? segment.equipment : "";

      // Fare Class.
      if (cells[5]) {
        cells[5] += "<br>";
      }
      cells[5] += segment.fare_classes ? segment.fare_classes : "";
      cells[5] += segment.fare_basis ? ` (${segment.fare_basis})` : "";
    }

    // Checked bag.
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
    cells[6] += `
      <div style="line-height: normal">
        ${customary}<br>
        <span class="note">${metric}</span>
      </div>
    `;

    // Checked bag.
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
    cells[7] += `
      <div style="line-height: normal">
        ${customary}<br>
        <span class="note">${metric}</span>
      </div>
    `;

    // PNR Count.
    cells[8] += `
      <div style="line-height: normal">${flight.pnr_count}</div>
    `;

    // Duration.
    cells[9] += `
      <div style="line-height: normal">
        ${flight.fly_duration}<br>
        <span class="note">${flight.flyFrom}–${flight.flyTo}</span>
      </div>
    `;

    // Stops.
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
        cells[10] += `Nonstop${vi_warning}${ac_warning}${ta_warning}`;
        break;
      case 2:
        const duration = flight.route[1].dTimeUTC - flight.route[0].aTimeUTC;
        const duration_text = `
          ${Math.floor(duration / 3600)}h ${Math.floor(duration % 3600 / 60)}m
        `;
        cells[10] += `
          <div style="line-height: normal">
            1 stop${vi_warning}${ac_warning}${ta_warning}<br>
            <span class="note">${duration_text} ${flight.route[0].flyTo}</span>
          </div>
        `;
        break;
      default:
        let stops = flight.route.slice(0, -1).map(segment => segment.flyTo);
        cells[10] += `
          <div style="line-height: normal">
            ${stops.length} stops${vi_warning}${ac_warning}${ta_warning}<br>
            <span class="note">${stops.join(", ")}</span>
          </div>
        `;
        break;
    }

    // Price.
    cells[11] += `
      <div style="line-height: normal">
        ${itinerary.price.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}<br>
        <span class="note">entire trip</span>
      </div>
    `;

    // Insert row.
    let row = this._table.lastElementChild.lastElementChild.insertRow();
    row.classList.add("clickable");
    if (flight.id == this._selected) {
      row.classList.add("selected");
    }

    row.onclick = () => {
      FlightTable.tables[this._i]._selected =
        FlightTable.tables[this._i]._selected ? null : flight.id;
      qs("#book").onclick = () => window.open(itinerary.deep_link);
      this.constructor.displayResults();
    };
    for (let [i, cell] of cells.entries()) {
      row.innerHTML += `<td class="${columns[i][1]}">${cell}</td>`;
    }
  }

  /**
   * Clears the contents of the table, but not the the selected flight ID, if
   * there is one.
   */
  clear() {
    this._table.lastElementChild.lastElementChild.innerHTML = "";
    this._displayed = {};
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
    // Remove old DOM elements.
    const n = this.constructor.tables.length - 1;
    for (let ft of this.constructor.tables) {
      ft._tab.remove();
      ft._table.remove();
    }

    // Clear static fields.
    this.constructor.res = [];
    this.constructor.single = null;
    this.constructor.tables = [];

    // Create new DOM elements.
    for (let i = 0; i < n; i++) {
      new FlightTable();
    }
    this.constructor.displayResults();
  }

  /**
   * Refreshes tables with the latest results.
   */
  static displayResults(res = null, single = null) {
    // Update cached results.
    if (res) {
      this.res = res;
      this.single = single;
    }

    // Refresh tables.
    this.tables.forEach(ft => ft.clear());
    for (const itinerary of this.res) {
      if (this.single) {
        let ft = this.tables[0];
        // If there's no selection, display all flights. Otherwise, display
        // only the selected flight.
        if (!ft.selected || itinerary.id == ft.selected) {
          ft.addFlight(itinerary, itinerary);
        }
      }
      // If there are no selections, process all itineraries. Otherwise,
      // process only itineraries that don't conflict with the selection.
      else if (itinerary.route.every((v, i) =>
               !this.tables[i].selected || v.id == this.tables[i].selected)) {
        for (const [i, segment] of itinerary.route.entries()) {
          this.tables[i].addFlight(itinerary, segment);
        }
      }
    }
    this.updateColumns();

    // Format tabs.
    for (let i = 0; i < this.tables.length; i++) {
      if (this.tables[i].selected) {
        qsa("#tabs .check")[i].classList.remove("hide");
      }
      else {
        qsa("#tabs .check")[i].classList.add("hide");
      }
    }

    // Format booking button.
    if (this.tables.every(v => v.selected)) {
      qs("#book").classList.remove("disabled");
    }
    else {
      qs("#book").classList.add("disabled");
    }
  }

  /**
   * Shows or hides columns according to the user's selection.
   */
  static updateColumns() {
    for (const column of qs("#columns").children) {
      if (!column.value) {
        continue;
      }
      if (column.selected) {
        qsa(`.${column.value}`).forEach(e => e.style.display = "");
      }
      else {
        qsa(`.${column.value}`).forEach(e => e.style.display = "none");
      }
    }
    M.Tooltip.init(qsa(".tooltipped"), {});
  }
}

// Cached response from server.
FlightTable.res = [];
FlightTable.single = null;

// State of tables.
FlightTable.tabs_instance = null;
FlightTable.tables = [];
