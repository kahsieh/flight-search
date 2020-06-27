/*
Five Peas Flight Search
itinerary-table.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Instance of ItineraryTable. Should be managed by client code.
 */
let itable;

class ItineraryTable {
  /**
   * Constructs an ItineraryTable instance based on the given DOM elements.
   *
   * @param {!Element} name <input> element for name.
   * @param {!Element} filters <select> element for filters.
   * @param {!Element} table <tbody> element for itinerary body.
   * @param {!Element} removeFlight <button> element for remove flight button.
   * @param {function} addFlightCallback Callback after addFlight.
   * @param {function} removeFlightCallback Callback after removeFlight.
   */
  constructor(name, filters, table, removeFlight,
              addFlightCallback, removeFlightCallback) {
    this._name = name;
    this._filters = filters;
    this._table = table;
    this._removeFlight = removeFlight;
    this._addFlightCallback = addFlightCallback;
    this._removeFlightCallback = removeFlightCallback;
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
    if (window.location.toString().length > MAX_URL_SIZE) {
      M.toast({
        html: `<i class="material-icons left">error</i>
               <div>Error: Itinerary is too long to load.</div>`,
        displayLength: 1500,
        classes: "red"
      });
      return false;
    }
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (_, k, v) =>
        urlParams[k] = decodeURIComponent(v));
    if ("n" in urlParams && "i" in urlParams) {
      // Decode name from base64 encoding.
      try {
        this._name.value = atob(urlParams["n"]).trim().substring(0, 100);
      }
      catch (error) {
        console.error(error);
        this._name.value = "";
      }
      this.loadFromItinerary(new Itinerary(urlParams["i"]));
      if (this.length === 0) {
        return false;
      }
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
      <td>
        <a class="red-text" onclick="itable.removeFlight()">×</a>
        Flight <span class="flight-index">${this.length}</span>
      </td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_from" class="autocomplete_airport"
          list="airports" placeholder="Any"
          value="${itinerary.get(i, "fly_from")}">
        <label class="active">
          Origin
          <i class="material-icons tiny tooltipped" data-position="top"
            data-tooltip="${ItineraryTable.AIRPORT_TOOLTIP}<br><br>
            ${ItineraryTable.ORDER_FLEX_TOOLTIP}">info_outline</i>
        </label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_to" class="autocomplete_airport"
          list="airports" placeholder="Any"
          value="${itinerary.get(i, "fly_to")}">
        <label class="active">
          Destination
          <i class="material-icons tiny tooltipped" data-position="top"
            data-tooltip="${ItineraryTable.AIRPORT_TOOLTIP}<br><br>
            ${ItineraryTable.ORDER_FLEX_TOOLTIP}">info_outline</i>
        </label>
      </div></div></td>

      <td class="select_airlines">
        <div class="row"><div class="input-field col s12">
          <div class="embedded-checkbox">
            <p><label>
              <input type="checkbox" name="select_airlines_exclude"
                class="filled-in" ${itinerary.get(i, "select_airlines_exclude")
                                    === true ? "checked" : ""}>
              <span class="checkbox-label">Not</span>
            </label></p>
          </div>
          <input type="text" name="select_airlines"
            class="autocomplete_select_airlines" placeholder="Any"
            value="${itinerary.get(i, "select_airlines")}">
          <label class="active">
            Airline
            <i class="material-icons tiny tooltipped" data-position="top"
            data-tooltip="${ItineraryTable.AIRLINE_TOOLTIP}">info_outline</i>
          </label>
        </div></div>
      </td>
      <td class="adult_hold_bag">
        <div class="row"><div class="col s12 input-field">
          <select name="adult_hold_bag">
            ${generateSelectOptions(["0", "1", "2"],
              itinerary.get(i, "adult_hold_bag"))}
          </select>
          <label>Checked&nbsp;bags</label>
        </div></div>
      </td>
      <td class="adult_hold_bag">
        <div class="row"><div class="col s12 input-field">
          <select name="adult_hand_bag">
            ${generateSelectOptions(["0", "1"],
              itinerary.get(i, "adult_hand_bag"))}
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
            }], itinerary.get(i, "selected_cabins"))}
          </select>
          <label>Cabin</label>
        </div></div>
      </td>
      <td class="mix_with_cabins">
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
            }], itinerary.get(i, "mix_with_cabins"))}
          </select>
          <label>Mixed&nbsp;with</label>
        </div></div>
      </td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_from" placeholder="0" min="0"
          max="999999" value="${itinerary.get(i, "price_from")}">
        <label class="active">Min&nbsp;price&nbsp;($)</label>
      </div></div></td>
      <td class="price_from"><div class="row"><div class="input-field col s12">
        <input type="number" name="price_to" placeholder="∞" min="0"
          max="999999" value="${itinerary.get(i, "price_to")}">
        <label class="active">Max&nbsp;price&nbsp;($)</label>
      </div></div></td>
      <td class="select_stop_airport">
        <div class="row"><div class="input-field col s12">
          <div class="embedded-checkbox">
            <p><label>
              <input type="checkbox" name="select_stop_airport_exclude"
                class="filled-in" ${itinerary.get(i,
                  "select_stop_airport_exclude") === true ? "checked" : ""}>
              <span class="checkbox-label">Not</span>
            </label></p>
          </div>
          <input type="text" name="select_stop_airport"
            class="autocomplete_airport" list="airlines" placeholder="Any"
            value="${itinerary.get(i, "select_stop_airport")}"
          <label class="active">
            Stop&nbsp;airport
            <i class="material-icons tiny tooltipped" data-position="top"
              data-tooltip="${ItineraryTable.AIRPORT_TOOLTIP}">info_outline</i>
          </label>
        </div></div>
      </td>
      <td class="max_stopovers">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="max_stopovers" placeholder="∞" min="0"
            max="999999" value="${itinerary.get(i, "max_stopovers")}">
          <label class="active">Max&nbsp;stops</label>
        </div></div>
      </td>
      <td class="stopover_from">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="stopover_from" placeholder="0" min="0"
            max="999999" value="${itinerary.get(i, "stopover_from")}">
          <label class="active">Min&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
        </div></div>
      </td>
      <td class="stopover_from">
        <div class="row"><div class="input-field col s12">
          <input type="number" name="stopover_to" placeholder="∞" min="0"
            max="999999" value="${itinerary.get(i, "stopover_to")}">
          <label class="active">Max&nbsp;stop&nbsp;dur.&nbsp;(hrs)</label>
        </div></div>
      </td>
      <td class="conn_on_diff_airport">
        <div class="row"><div class="input-field col s12">
          <p><label>
            <input type="checkbox" name="conn_on_diff_airport" class="filled-in"
              ${itinerary.get(i, "conn_on_diff_airport") === true
                ? "checked" : ""}>
            <span class="checkbox-label">Allowed</span>
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
          }], itinerary.get(i, "fly_days"))}
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
            max="999999" value="${itinerary.get(i, "max_fly_duration")}">
          <label class="active">Max&nbsp;duration&nbsp;(hrs)</label>
        </div></div>
      </td>
    `;
    this.updateFilters();
    this._removeFlight.classList.remove("disabled");
    this._addFlightCallback(this.length - 1);
  }

  /**
   * Removes a flight from the itinerary. The flight removed depends on the
   * triggering event.
   */
  removeFlight() {
    let row = !event ||
              event.type !== "click" ||
              event.currentTarget.nodeName === "BUTTON"
      ? this.length - 1
      : [...this._table.children].indexOf(event.target.parentNode.parentNode)
    switch (this.length) {
      case 1:
        // Don't allow the last flight to be removed by the user.
        if (event && event.type === "click") {
          return;
        }
        // fallthrough
      case 2:
        this._removeFlight.classList.add("disabled");
        // fallthrough
      default:
        this._table.querySelectorAll("tr")[row].remove();
        for (const [i, e] of
             this._table.querySelectorAll(".flight-index").entries()) {
          e.textContent = i + 1;
        }
        this._removeFlightCallback(row);
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

    // Re-initialize Materialize selects (and fix iOS touch propagation bug).
    M.FormSelect.init(this._table.querySelectorAll("select"), {});
    for (const e of qsa("li[id^='select-options']")) {
      e.ontouchend = event => event.stopPropagation();
    }

    // Re-initialize Materialize tooltips.
    M.Tooltip.init(this._table.querySelectorAll(".tooltipped"), {});

    // Re-initialize Materialize autocompletes.
    const airlineInputs =
      this._table.querySelectorAll(".autocomplete_select_airlines");
    const trim = e =>
      e.value = e.value.includes(" - ") ? e.value.split(" - ")[1] : e.value;
    M.Autocomplete.init(airlineInputs, {
      data: airlines,
      onAutocomplete: () => airlineInputs.forEach(trim),
      limit: 5
    });

    // Add autocorrect event listeners.
    for (const e of
         this._table.querySelectorAll(".autocomplete_airport")) {
      e.onblur = () => autocorrect["airports"](e);
    }
    for (const e of
         this._table.querySelectorAll(".autocomplete_select_airlines")) {
      e.onblur = () => autocorrect["airlines"](e);
    }
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
    if (cell.nodeName === "SELECT") {
      return Array.from(cell)
                  .filter(opt => opt.selected)
                  .map(opt => opt.value)
                  .join();
    }
    if (cell.type === "checkbox") {
      return cell.checked;
    }
    return cell.value;
  }

  /**
   * Selects filter options if itinerary uses non-default options.
   *
   * @param {!Itinerary} itinerary Itinerary to check for non-default options.
   */
  _selectFilters(itinerary) {
    // Some fields are shown by selecting a different filtering option. This
    // maps the names of those fields to the appropriate options.
    const filterMap = {
      "select_airlines_exclude": "select_airlines",
      "adult_hand_bag": "adult_hold_bag",
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
// STATIC FIELDS
// -----------------------------------------------------------------------------

ItineraryTable.AIRPORT_TOOLTIP = `Enter multiple airport codes by separating
  them with commas.`;

ItineraryTable.ORDER_FLEX_TOOLTIP = `Or, create a flexible-order itinerary by
  separating airport codes with a | (vertical bar). Then, selecting a flight
  that uses an airport from a |-separated list will require that all other
  |-separated lists use the airport in the same list position.`;

ItineraryTable.AIRLINE_TOOLTIP = `Enter multiple airline codes by separating
  them with commas.`;

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

/**
 * Autocorrect functions for use with the onblur event of form fields.
 */
const autocorrect = {
  "itinerary-name": (target = event.target) => {
    target.value = target.value.trim();
  },
  "airports": (target = event.target) => {
    // Remove autocomplete phrase.
    if (target.value.includes(" - ")) {
      target.value = target.value.split(" - ")[0].replace("↳", "");
    }

    // Use a DFA. The state represents how many letters of the current airport
    // code have been seen. -1 represents an error state. count indicates how
    // many airport codes have been seen.
    let corrected = "", tentative = "";
    let state = 0, count = 0;
    // Remove whitespace from the string and convert it to uppercase.
    for (const c of target.value.replace(/\s+/g, "").toUpperCase()) {
      switch (state) {
        // Error state. Don't do anything.
        case -1:
          break;
        // Expecting letter states. If a letter is found, append it to
        // tentative and increment the state. Otherwise, go to the error state.
        case 0:
        case 1:
        case 2:
          if (c.match(/[A-Z]/)) {
            tentative += c;
            state++;
          }
          else {
            state = -1;  // error: unexpected character
          }
          break;
        // Complete state. Append tentative to corrected and clear tentative.
        // If a pipe or comma is found, append it to tentative and expect 3
        // more letters. Otherwise, go to the error state.
        case 3:
          corrected += tentative;
          tentative = "";
          count++;
          if (count == 100) {
            state = -1;  // error: too many codes
          }
          else if (c == "|") {
            tentative += " | ";
            state = 0;
          }
          else if (c == ",") {
            tentative += ",";
            state = 0;
          }
          else {
            state = -1;  // error: unexpected character
          }
          break;
      }
    }

    // When ending on the complete state, append tentative to corrected and
    // clear tentative.
    if (state == 3) {
      corrected += tentative;
      tentative = "";
      count++;
    }

    // Update the value to corrected. Ignore tentative characters that didn't
    // lead to the complete state.
    target.value = corrected;
  },
  "airlines": (target = event.target) => {
    // Use a DFA. The state represents how many letters of the current airline
    // code have been seen. -1 represents an error state. count indicates how
    // many airline codes have been seen.
    let corrected = "", tentative = "";
    let state = 0, count = 0;
    // Remove whitespace from the string and convert it to uppercase.
    for (const c of target.value.replace(/\s+/g, "").toUpperCase()) {
      switch (state) {
        // Error state. Don't do anything.
        case -1:
          break;
        // Expecting letter states. If a letter is found, append it to
        // tentative and increment the state. Otherwise, go to the error state.
        case 0:
        case 1:
          if (c.match(/[A-Z\d]/)) {
            tentative += c;
            state++;
          }
          else {
            state = -1;  // error: unexpected character
          }
          break;
        // Complete state. Append tentative to corrected and clear tentative.
        // If a comma is found, append it to tentative and expect 2 more
        // letters. Otherwise, go to the error state.
        case 2:
          corrected += tentative;
          tentative = "";
          count++;
          if (count == 100) {
            state = -1;  // error: too many codes
          }
          else if (c == ",") {
            tentative += ",";
            state = 0;
          }
          else {
            state = -1;  // error: unexpected character
          }
          break;
      }
    }

    // When ending on the complete state, append tentative to corrected and
    // clear tentative.
    if (state == 2) {
      corrected += tentative;
      tentative = "";
      count++;
    }

    // Update the value to corrected. Ignore tentative characters that didn't
    // lead to the complete state.
    target.value = corrected;
  }
};
