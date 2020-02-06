/*
Five Peas Flight Search
itinerary.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

class Itinerary {
  static get length() { return qs("#itinerary").childElementCount; }

  /**
   * Adds a flight to the itinerary.
   *
   * @param {object} cells Optional. Values to pre-populate the row with.
   */
  static addFlight(cells = {}) {
    let row = qs("#itinerary").insertRow();
    row.style.border = 0;
    row.innerHTML = `
      <td style="padding-right: 20px">
        Flight&nbsp;${this.length}
      </td>
      <td class="origin"><div class="row"><div class="input-field col s12">
        <input type="text" placeholder=" " value="${cells["origin"] || ""}">
        <label class="active">Origin</label>
      </div></div></td>
      <td class="transfer"><div class="row"><div class="input-field col s12">
        <input type="number" placeholder="No limit" min="0" value="${cells["max-stops"] || 2}">
        <label class="active">Max stops</label>
      </div></div></td>
      <td class="transfer"><div class="row"><div class="input-field col s12">
        <input type="text" placeholder="No preference" value="${cells["transfer"] || ""}">
        <label class="active">Transfer airport</label>
      </div></div></td>
      <td class="destination"><div class="row"><div class="input-field col s12">
        <input type="text" placeholder=" " value="${cells["destination"] || ""}">
        <label class="active">Destination</label>
      </div></div></td>
      <td class="airline"><div class="row"><div class="input-field col s12">
        <input type="text" placeholder="No preference" value="${cells["airline"] || ""}">
        <label class="active">Airline</label>
      </div></div></td>
      <td class="earliest-date"><div class="row"><div class="input-field col s12">
        <input type="date" placeholder="" value="${cells["earliest-date"] || ""}">
        <label class="active">Earliest date</label>
      </div></div></td>
      <td class="latest-date"><div class="row"><div class="input-field col s12">
        <input type="date" placeholder=" " value="${cells["latest-date"] || ""}">
        <label class="active">Latest date</label>
      </div></div></td>
      <td class="departure-time"><div class="row"><div class="input-field col s12">
        <input type="time" placeholder="" value="${cells["earliest-departure-time"] || ""}">
        <label class="active">Earliest dep.</label>
      </div></div></td>
      <td class="departure-time"><div class="row"><div class="input-field col s12">
        <input type="time" placeholder=" " value="${cells["latest-departure-time"] || ""}">
        <label class="active">Latest dep.</label>
      </div></div></td>
      <td class="arrival-time"><div class="row"><div class="input-field col s12">
        <input type="time" placeholder="" value="${cells["earliest-arrival-time"] || ""}">
        <label class="active">Earliest arr.</label>
      </div></div></td>
      <td class="arrival-time"><div class="row"><div class="input-field col s12">
        <input type="time" placeholder=" " value="${cells["latest-arrival-time"] || ""}">
        <label class="active">Latest arr.</label>
      </div></div></td>
      <td class="cabin"><div class="row"><div class="col s12 input-field">
        <select>
          <option value="M" selected>Economy</option>
          <option value="W">Premium Economy</option>
          <option value="C">Business</option>
          <option value="F">First</option>
        </select>
        <label>Cabin</label>
      </div></div></td>
    `;
    this.updateFilters();
    qs("#remove-flight").classList.remove("disabled");
    new FlightTable();
  }

  /**
   * Removes a flight from the itinerary.
   */
  static removeFlight() {
    let i = qs("#itinerary").childElementCount - 1;
    switch (i) {
      case 0:
        return;
      case 1:
        qs("#remove-flight").classList.add("disabled");
        // fallthrough
      default:
        qs("#itinerary").lastElementChild.remove();
        FlightTable.tables[i].remove();
        break;
    }
  }

  /**
   * Retrieves the value from a cell.
   *
   * @param {number} row Row number.
   * @param {number} col Column number.
   * @return {string} Current value of cell.
   */
  static get(row, col) {
    let cell = qs("#itinerary").children[row].children[col];
    // Special handling for cabin dropdown.
    if (cell.classList.contains("cabin")) {
      for (const cabin of cell.querySelector("select")) {
        if (cabin.selected) {
          return cabin.value;
        }
      }
    }
    return cell.children[0]  // div
               .children[0]  // div
               .children[0]  // input
               .value;
  }

  /**
   * Sets the value of a cell.
   *
   * @param {number} row Row number.
   * @param {number} col Column number.
   * @param {any} val New value for cell.
   */
  static set(row, col, val) {
    qs("#itinerary").children[r]  // tr
                    .children[c]  // td
                    .children[0]  // div
                    .children[0]  // div
                    .children[0]  // input
                    .value = val;
  }

  /**
   * Shows or hides filter columns according to the user's selection.
   */
  static updateFilters() {
    for (const filter of qs("#filters").children) {
      if (!filter.value) {
        continue;
      }
      if (filter.selected) {
        qsa(`.${filter.value}`).forEach(e => e.style.display = "");
      }
      else {
        qsa(`.${filter.value}`).forEach(e => e.style.display = "none");
      }
    }
    M.FormSelect.init(qsa(".cabin select"), {});
  }
}
