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
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_from" placeholder=" "
          value="${cells["fly_from"] || ""}">
        <label class="active">Origin</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_to" placeholder=" "
          value="${cells["fly_to"] || ""}">
        <label class="active">Destination</label>
      </div></div></td>

      <td class="select_airlines"><div class="row"><div class="input-field col s12">
        <div class="right-align" style="position: absolute; right: 15px"><p><label>
          <input type="checkbox" name="select_airlines_exclude" class="filled-in">
          <span style="padding-left: 25px">Not</span>
        </label></p></div>
        <input type="text" name="select_airlines" placeholder="Any"
          value="${cells["select_airlines"] || ""}">
        <label class="active">Airline</label>
      </div></div></td>
      <td class="adult_hold_bag"><div class="row"><div class="col s12 input-field">
        <select name="adult_hold_bag">
          <option value="0" selected>0</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
        <label>Checked&nbsp;bags</label>
      </div></div></td>
      <td class="adult_hold_bag"><div class="row"><div class="col s12 input-field">
        <select name="adult_hand_bag">
          <option value="0" selected>0</option>
          <option value="1">1</option>
        </select>
        <label>Carry-on&nbsp;bags</label>
      </div></div></td>
      <td class="selected_cabins"><div class="row"><div class="col s12 input-field">
        <select name="selected_cabins">
          <option value="M" selected>Economy</option>
          <option value="W">Premium Economy</option>
          <option value="C">Business</option>
          <option value="F">First</option>
        </select>
        <label>Cabin</label>
      </div></div></td>
      <td class="selected_cabins"><div class="row"><div class="col s12 input-field">
        <select name="mix_with_cabins">
          <option value="" selected disabled></option>
          <option value="M">Economy</option>
          <option value="W">Premium Economy</option>
          <option value="C">Business</option>
          <option value="F">First</option>
        </select>
        <label>Mixed&nbsp;with</label>
      </div></div></td>
      <td class="hide adults"><div class="row"><div class="input-field col s12">
        <input type="number" name="adults" placeholder="1" min="0" max="9"
          value="${cells["adults"] || ""}">
        <label class="active">Passengers</label>
      </div></div></td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_from" placeholder="0" min="0"
          value="${cells["price_from"] || ""}">
        <label class="active">Min&nbsp;price&nbsp;($)</label>
      </div></div></td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_to" placeholder="∞" min="0"
          value="${cells["price_to"] || ""}">
        <label class="active">Max&nbsp;price&nbsp;($)</label>
      </div></div></td>

      <td class="select_stop_airport"><div class="row"><div class="input-field col s12">
        <div class="right-align" style="position: absolute; right: 15px"><p><label>
          <input type="checkbox" name="select_stop_airport_exclude" class="filled-in">
          <span style="padding-left: 25px">Not</span>
        </label></p></div>
        <input type="text" name="select_stop_airport" placeholder="Any"
          value="${cells["select_stop_airport"] || ""}">
        <label class="active">Stop&nbsp;airport</label>
      </div></div></td>
      <td class="max_stopovers"><div class="row"><div class="input-field col s12">
        <input type="number" name="max_stopovers" placeholder="∞" min="0"
          value="${cells["max_stopovers"] !== undefined ? cells["max_stopovers"] : 2}">
        <label class="active">Max&nbsp;stops</label>
      </div></div></td>
      <td class="stopover_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="stopover_from" placeholder="0" min="0"
          value="${cells["stopover_from"] || ""}">
        <label class="active">Min&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
      </div></div></td>
      <td class="stopover_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="stopover_to" placeholder="∞" min="0"
          value="${cells["stopover_to"] || ""}">
        <label class="active">Max&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
      </div></div></td>
      <td class="conn_on_diff_airport"><div class="row"><div class="input-field col s12">
        <p><label>
          <input type="checkbox" name="conn_on_diff_airport" class="filled-in" checked>
          <span style="padding-left: 25px">Allowed</span>
        </label></p>
        <label class="active">Inter&#8209;airport&nbsp;</label>
      </div></div></td>

      <td><div class="row"><div class="input-field col s12">
        <input type="date" name="date_from" placeholder=""
          value="${cells["date_from"] || ""}">
        <label class="active">Earliest&nbsp;date</label>
      </div></div></td>
      <td class="date_to"><div class="row"><div class="input-field col s12">
        <input type="date" name="date_to" placeholder=" "
          value="${cells["date_to"] || ""}">
        <label class="active">Latest&nbsp;date</label>
      </div></div></td>
      <td class="fly_days"><div class="row"><div class="col s12 input-field">
        <select name="fly_days" multiple>
          <option value="0" selected>Sunday</option>
          <option value="1" selected>Monday</option>
          <option value="2" selected>Tuesday</option>
          <option value="3" selected>Wednesday</option>
          <option value="4" selected>Thursday</option>
          <option value="5" selected>Friday</option>
          <option value="6" selected>Saturday</option>
        </select>
        <label>Day&nbsp;of&nbsp;week</label>
      </div></div></td>
      <td class="dtime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="dtime_from" placeholder="" step="3600"
          value="${cells["dtime_from"] || ""}">
        <label class="active">Earliest&nbsp;dep.</label>
      </div></div></td>
      <td class="dtime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="dtime_to" placeholder=" " step="3600"
          value="${cells["dtime_to"] || ""}">
        <label class="active">Latest&nbsp;dep.</label>
      </div></div></td>
      <td class="atime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="atime_from" placeholder="" step="3600"
          value="${cells["atime_from"] || ""}">
        <label class="active">Earliest&nbsp;arr.</label>
      </div></div></td>
      <td class="atime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="atime_to" placeholder=" " step="3600"
          value="${cells["atime_to"] || ""}">
        <label class="active">Latest&nbsp;arr.</label>
      </div></div></td>
      <td class="max_fly_duration"><div class="row"><div class="input-field col s12">
        <input type="number" name="max_fly_duration" placeholder="∞" min="0"
          value="${cells["max_fly_duration"] || ""}">
        <label class="active">Max&nbsp;duration&nbsp;(hrs)</label>
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
   * @param {string} col Column name.
   * @return {string} Current value of cell.
   */
  static get(row, col) {
    let cell = qs("#itinerary").children[row].querySelector(`[name=${col}]`);
    if (!cell) {
      return;
    }
    if (cell.nodeName == "SELECT") {
      return Array.from(cell)
                  .filter(opt => opt.selected)
                  .map(opt => opt.value)
                  .join();
    }
    if (cell.type == "checkbox") {
      return cell.checked;
    }
    return cell.value;
  }

  /**
   * Shows or hides filter columns according to the user's selection.
   */
  static updateFilters() {
    for (const filter of qsa("#filters option")) {
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
    M.FormSelect.init(qsa("#itinerary select"), {});
  }
}
