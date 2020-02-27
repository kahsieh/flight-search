/*
Five Peas Flight Search
itinerary-table.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/

"use strict";

/**
 * Instance of ItineraryTable. Should be initialized by client code.
 */
let itable;

class ItineraryTable {
  /**
   * Constructs an ItineraryTable instance based on the given DOM elements.
   * 
   * @param {Element} name <input> element for name.
   * @param {Element} filters <select> element for filters.
   * @param {Element} table <tbody> element for itinerary body.
   * @param {Element} removeFlight <button> element for remove button.
   */
  constructor(name, filters, table, removeFlight) {
    this._name = name;
    this._filters = filters;
    this._table = table;
    this._removeFlight = removeFlight;
  }

  get length() { return this._table.childElementCount; }

  /**
   * Retrieves the entire itinerary.
   * 
   * @return {!Itinerary} The contents of the ItineraryTable.
   */
  get() {
    let raw = [];
    for (let i = 0; i < this.length; i++) {
      raw.push(Object.fromEntries(Itinerary.FIELDS.map(field =>
        [field, this._getCell(i, field)])));
    }
    return new Itinerary(raw);
  }

  /**
   * Loads the itinerary from the current URL.
   *
   * @return {boolean} Whether the load was successful or not.
   */
  loadFromURL() {
    let urlParams = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (_, k, v) =>
        urlParams[k] = decodeURIComponent(v));
    if ("n" in urlParams && "i" in urlParams) {
      this._name.value = urlParams["n"];
      this.loadFromItinerary(new Itinerary(urlParams["i"]));
      return true;
    }
    return false;
  }

  /**
   * Loads the itinerary from an Itinerary object.
   * 
   * @param {!Itinerary} itinerary Itinerary object.
   */
  loadFromItinerary(itinerary) {
    this._selectFilters(itinerary);
    for (let i = 0; i < itinerary.length; i++) {
      this.addFlight(itinerary, i);
    }
  }

  /**
   * Adds a flight to the itinerary.
   *
   * @param {!Itinerary=} itinerary Itinerary to load fields from.
   * @param {number=} i Flight index in Itinerary.
   */
  addFlight(itinerary = new Itinerary([{"max_stopovers": 2}]), i = 0) {
    let row = this._table.insertRow();
    row.style.border = 0;
    row.innerHTML = `
      <td style="padding-right: 20px; white-space: nowrap;">
        <a class="red-text" onclick="itable.removeFlight()">×</a>
        Flight <span class="flight-index">${this.length}</span>
      </td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_from" class="autocomplete_airport"
          placeholder="Any" value="${itinerary.get(i, "fly_from")}">
        <label class="active">Origin</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_to" class="autocomplete_airport"
          placeholder="Any" value="${itinerary.get(i, "fly_to")}">
        <label class="active">Destination</label>
      </div></div></td>

      <td class="select_airlines">
        <div class="row"><div class="input-field col s12">
          <div class="right-align" style="position: absolute; right: 15px;">
            <p><label>
              <input type="checkbox" name="select_airlines_exclude"
                class="filled-in" ${itinerary.get(i, "select_airlines_exclude")
                                    === true ? "checked" : ""}>
              <span style="padding-left: 25px;">Not</span>
            </label></p>
          </div>
          <input type="text" name="select_airlines"
            class="autocomplete_select_airlines" placeholder="Any"
            value="${itinerary.get(i, "select_airlines")}">
          <label class="active">Airline</label>
        </div></div>
      </td>
      <td class="adult_hold_bag">
        <div class="row"><div class="col s12 input-field">
          <select name="adult_hold_bag">
            ${generateSelectOptions(["0", "1", "2"],
              itinerary.get(i, "adult_hold_bag"), "adult_hold_bag")}
          </select>
          <label>Checked&nbsp;bags</label>
        </div></div>
      </td>
      <td class="adult_hold_bag">
        <div class="row"><div class="col s12 input-field">
          <select name="adult_hand_bag">
            ${generateSelectOptions(["0", "1"],
              itinerary.get(i, "adult_hand_bag"), "adult_hand_bag")}
          </select>
          <label>Carry-on&nbsp;bags</label>
        </div></div>
      </td>
      <td class="selected_cabins">
        <div class="row"><div class="col s12 input-field">
          <select name="selected_cabins">
            ${generateSelectOptions([{
              display: "Economy",
              value: "M",
            },
            {
              display: "Premium Economy",
              value: "W",
            },
            {
              display: "Business",
              value: "C",
            },
            {
              display: "First",
              value: "F",
            }], itinerary.get(i, "selected_cabins"), "selected_cabins")}
          </select>
          <label>Cabin</label>
        </div></div>
      </td>
      <td class="selected_cabins">
        <div class="row"><div class="col s12 input-field">
          <select name="mix_with_cabins">
            ${generateSelectOptions([{
              value: "",
            },
            {
              display: "Economy",
              value: "M",
            },
            {
              display: "Premium Economy",
              value: "W",
            },
            {
              display: "Business",
              value: "C",
            },
            {
              display: "First",
              value: "F",
            }], itinerary.get(i, "mix_with_cabins"), "mix_with_cabins")}
          </select>
          <label>Mixed&nbsp;with</label>
        </div></div>
      </td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_from" placeholder="0" min="0"
          value="${itinerary.get(i, "price_from")}">
        <label class="active">Min&nbsp;price&nbsp;($)</label>
      </div></div></td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_to" placeholder="∞" min="0"
          value="${itinerary.get(i, "price_to")}">
        <label class="active">Max&nbsp;price&nbsp;($)</label>
      </div></div></td>
      <td class="select_stop_airport">
        <div class="row"><div class="input-field col s12">
          <div class="right-align" style="position: absolute; right: 15px;">
            <p><label>
              <input type="checkbox" name="select_stop_airport_exclude"
                class="filled-in" ${itinerary.get(i,
                  "select_stop_airport_exclude") === true ? "checked" : ""}>
              <span style="padding-left: 25px">Not</span>
            </label></p>
          </div>
          <input type="text" name="select_stop_airport"
            class="autocomplete_airport" placeholder="Any"
            value="${itinerary.get(i, "select_stop_airport")}">
          <label class="active">Stop&nbsp;airport</label>
        </div></div>
      </td>
      <td class="max_stopovers">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="max_stopovers" placeholder="∞" min="0"
            value="${itinerary.get(i, "max_stopovers")}">
          <label class="active">Max&nbsp;stops</label>
        </div></div>
      </td>
      <td class="stopover_from">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="stopover_from" placeholder="0" min="0"
            value="${itinerary.get(i, "stopover_from")}">
          <label class="active">Min&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
        </div></div>
      </td>
      <td class="stopover_from">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="stopover_to" placeholder="∞" min="0"
            value="${itinerary.get(i, "stopover_to")}">
          <label class="active">Max&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
        </div></div>
      </td>
      <td class="conn_on_diff_airport">
        <div class="row"><div class="input-field col s12">
          <p><label>
            <input type="checkbox" name="conn_on_diff_airport" class="filled-in"
              ${itinerary.get(i, "conn_on_diff_airport") === true
                ? "checked" : ""}>
            <span style="padding-left: 25px">Allowed</span>
          </label></p>
          <label class="active">Inter&#8209;airport&nbsp;</label>
        </div></div>
      </td>
      <td><div class="row"><div class="input-field col s12">
        <input type="date" name="date_from" placeholder=""
          value="${itinerary.get(i, "date_from")}">
        <label class="active">Earliest&nbsp;date</label>
      </div></div></td>
      <td class="date_to"><div class="row"><div class="input-field col s12">
        <input type="date" name="date_to" placeholder=" "
          value="${itinerary.get(i, "date_to")}">
        <label class="active">Latest&nbsp;date</label>
      </div></div></td>
      <td class="fly_days"><div class="row"><div class="col s12 input-field">
        <select name="fly_days" multiple>
          ${generateSelectOptions([{
            display: "Sunday",
            value: "0",
          },
          {
            display: "Monday",
            value: "1",
          },
          {
            display: "Tuesday",
            value: "2",
          },
          {
            display: "Wednesday",
            value: "3",
          },
          {
            display: "Thursday",
            value: "4",
          },
          {
            display: "Friday",
            value: "5",
          },
          {
            display: "Saturday",
            value: "6",
          }], itinerary.get(i, "fly_days"), "fly_days", true)}
        </select>
        <label>Day&nbsp;of&nbsp;week</label>
      </div></div></td>
      <td class="dtime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="dtime_from" placeholder="" step="3600"
          value="${itinerary.get(i, "dtime_from")}">
        <label class="active">Earliest&nbsp;dep.</label>
      </div></div></td>
      <td class="dtime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="dtime_to" placeholder=" " step="3600"
          value="${itinerary.get(i, "dtime_to")}">
        <label class="active">Latest&nbsp;dep.</label>
      </div></div></td>
      <td class="atime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="atime_from" placeholder="" step="3600"
          value="${itinerary.get(i, "atime_from")}">
        <label class="active">Earliest&nbsp;arr.</label>
      </div></div></td>
      <td class="atime_from"><div class="row"><div class="input-field col s12">
        <input type="time" name="atime_to" placeholder=" " step="3600"
          value="${itinerary.get(i, "atime_to")}">
        <label class="active">Latest&nbsp;arr.</label>
      </div></div></td>
      <td class="max_fly_duration">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="max_fly_duration" placeholder="∞" min="0"
            value="${itinerary.get(i, "max_fly_duration")}">
          <label class="active">Max&nbsp;duration&nbsp;(hrs)</label>
        </div></div>
      </td>
    `;
    this.updateFilters();
    this._removeFlight.classList.remove("disabled");
    new FlightTable();
  }

  /**
   * Removes a flight from the itinerary. The flight removed depends on the
   * triggering event.
   */
  removeFlight() {
    let row = event.currentTarget.nodeName == "BUTTON" ? this.length - 1
      : [...this._table.children].indexOf(event.target.parentNode.parentNode)
    switch (this.length) {
      case 1:
        return;
      case 2:
        this._removeFlight.classList.add("disabled");
        // fallthrough
      default:
        this._table.querySelectorAll("tr")[row].remove();
        FlightTable.tables[row].remove();
        for (const [i, e] of
             this._table.querySelectorAll(".flight-index").entries()) {
          e.textContent = i + 1;
        }
        break;
    }
  }

  /**
   * Shows or hides filter columns according to the user's selection.
   */
  updateFilters() {
    for (const filter of this._filters.querySelectorAll("option")) {
      if (filter.value === "") {
        continue;
      }
      this._table.querySelectorAll(`.${filter.value}`)
                 .forEach(e => e.style.display = filter.selected ? "" : "none");
    }

    // Re-initialize Materialize selects and autocompletes. 
    M.FormSelect.init(this._table.querySelectorAll("select"), {});
    const trim = e =>
      e.value = e.value.includes(" - ") ? e.value.split(" - ")[1] : e.value;
    let autocomplete_select_airlines =
      this._table.querySelectorAll(".autocomplete_select_airlines")
    M.Autocomplete.init(autocomplete_select_airlines, {
        data: airlines, 
        onAutocomplete: () => autocomplete_select_airlines.forEach(trim),
        limit: 5
    });
    let autocomplete_airport =
      this._table.querySelectorAll(".autocomplete_airport");
    M.Autocomplete.init(autocomplete_airport, {
      data: airports, 
      onAutocomplete: () => autocomplete_airport.forEach(trim),
      limit: 5
    });
  }

  /**
   * Retrieves the value from a cell.
   *
   * @param {number} i Flight index.
   * @param {string} field Field name.
   * @return {string} Current value of cell.
   */
  _getCell(i, field) {
    let cell = this._table.children[i].querySelector(`[name=${field}]`);
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
   * Selects filter options if itinerary uses non-default options. 
   * 
   * @param {Itinerary} itinerary Itinerary to check for non-default options.
   */
  _selectFilters(itinerary) {
    // Some fields are shown by selecting a different filtering option. This
    // maps the names of those fields to the appropriate options.
    const filterMap = {
      "select_airlines_exclude": "select_airlines",
      "adult_hand_bag": "adult_hold_bag",
      "mix_with_cabins": "selected_cabins",
      "price_to": "price_from",
      "select_stop_airport_exclude": "select_stop_airport",
      "stopover_to": "stopover_from",
      "dtime_to": "dtime_from",
      "atime_to": "atime_from",
    }
    for (let k of itinerary.usedFields()) {
      k = k in filterMap ? filterMap[k] : k;
      let filter = this._filters.querySelector(`option[value=${k}]`);
      if (filter !== null) {
        filter.selected = true;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

/**
 * Generates HTML select options.
 * 
 * @param {!Array<string>|Array<Object<string, string>>} options Array of
 *    possible options. The following formats are acceptable:
 *      ["value1", "value2", ...]
 *        Creates options with display and value set to the same string.
 *      [{ display: "display1", value: "value1" }, ...]
 *        Creates options with display and value set to different strings.
 *        display may be omitted to use the same string as value.
 * @param {?string} value Default option. May contain comma-separated options
 *     in the case of a multiple select.
 * @return {string} HTML string that contains all generated options with display
 *      and values.
 */
function generateSelectOptions(options, value) {
  // Normalize options to an Array<Object<string, string>>.
  options = options.map(option =>
    typeof option === "string" ? {value: option} : option);
  // Normalize value to an Array<string>.
  if (value.includes(",")) {
    value = value.split(",");
  }

  return options.map(option => `
    <option value="${option.value}"
      ${value.includes(escape(option.value)) ? "selected" : ""}
      ${option.value === "" ? "disabled" : ""}
      >${typeof option.display !== "undefined" ?
      option.display : option.value}</option>
  `).join("");
}
