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
    this.selectFilters(cells);

    // populate default values
    Object.entries(default_values).forEach(([key, value]) => {
      if (typeof cells[key] === "undefined") {
        cells[key] = value;
      }
    });

    // sanitize input
    Object.entries(cells).forEach(([key, value]) => {
      cells[key] = escape(value);
    });

    let row = qs("#itinerary").insertRow();
    row.style.border = 0;
    row.innerHTML = `
      <td style="padding-right: 20px; white-space: nowrap;">
        <a class="red-text" onclick="Itinerary.removeFlight()">×</a>
        Flight <span class="flight-index">${this.length}</span>
      </td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_from" class="autocomplete_airport" placeholder=" "
          value="${cells["fly_from"] || ""}">
        <label class="active">Origin</label>
      </div></div></td>
      <td><div class="row"><div class="input-field col s12">
        <input type="text" name="fly_to" class="autocomplete_airport" placeholder=" "
          value="${cells["fly_to"] || ""}">
        <label class="active">Destination</label>
      </div></div></td>

      <td class="select_airlines"><div class="row"><div class="input-field col s12">
        <div class="right-align" style="position: absolute; right: 15px"><p><label>
          <input type="checkbox" name="select_airlines_exclude" class="filled-in" ${cells["select_airlines_exclude"] === true ? "checked" : ""}>
          <span style="padding-left: 25px">Not</span>
        </label></p></div>
        <input type="text" name="select_airlines" class="autocomplete_select_airlines" placeholder="Any"
          value="${cells["select_airlines"] || ""}">
        <label class="active">Airline</label>
      </div></div></td>
      <td class="adult_hold_bag"><div class="row"><div class="col s12 input-field">
        <select name="adult_hold_bag">
          ${this.generateSelectOptions(["0", "1", "2"], cells["adult_hold_bag"], "adult_hold_bag")}
        </select>
        <label>Checked&nbsp;bags</label>
      </div></div></td>
      <td class="adult_hold_bag"><div class="row"><div class="col s12 input-field">
        <select name="adult_hand_bag">
          ${this.generateSelectOptions(["0", "1"], cells["adult_hand_bag"], "adult_hand_bag")}
        </select>
        <label>Carry-on&nbsp;bags</label>
      </div></div></td>
      <td class="selected_cabins"><div class="row"><div class="col s12 input-field">
        <select name="selected_cabins">
          ${this.generateSelectOptions([{
            name: "Economy",
            value: "M",
          },
          {
            name: "Premium Economy",
            value: "W",
          },
          {
            name: "Business",
            value: "C",
          },
          {
            name: "First",
            value: "F",
          }], cells["selected_cabins"], "selected_cabins")}
        </select>
        <label>Cabin</label>
      </div></div></td>
      <td class="selected_cabins"><div class="row"><div class="col s12 input-field">
        <select name="mix_with_cabins">
          ${this.generateSelectOptions([{
            value: "",
          },
          {
            name: "Economy",
            value: "M",
          },
          {
            name: "Premium Economy",
            value: "W",
          },
          {
            name: "Business",
            value: "C",
          },
          {
            name: "First",
            value: "F",
          }], cells["mix_with_cabins"], "mix_with_cabins")}
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
          <input type="checkbox" name="select_stop_airport_exclude" class="filled-in" ${cells["select_stop_airport_exclude"] === true ? "checked" : ""}>
          <span style="padding-left: 25px">Not</span>
        </label></p></div>
        <input type="text" name="select_stop_airport" class="autocomplete_airport" placeholder="Any"
          value="${cells["select_stop_airport"] || ""}">
        <label class="active">Stop&nbsp;airport</label>
      </div></div></td>
      <td class="max_stopovers"><div class="row"><div class="input-field col s12">
        <input type="number" name="max_stopovers" placeholder="∞" min="0"
          value="${typeof cells["max_stopovers"] !== "undefined" ? cells["max_stopovers"] : 2}">
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
          <input type="checkbox" name="conn_on_diff_airport" class="filled-in" ${cells["conn_on_diff_airport"] === true ? "checked" : ""}>
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
          ${this.generateSelectOptions([{
            name: "Sunday",
            value: "0",
          },
          {
            name: "Monday",
            value: "1",
          },
          {
            name: "Tuesday",
            value: "2",
          },
          {
            name: "Wednesday",
            value: "3",
          },
          {
            name: "Thursday",
            value: "4",
          },
          {
            name: "Friday",
            value: "5",
          },
          {
            name: "Saturday",
            value: "6",
          }], cells["fly_days"], "fly_days", true)}
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
   * generate select options for the itinerary based on value given. If value is invalid, uses value found in default_values.
   * 
   * @param {Object} options array of possible options. the following formats are acceptable:
   *    ["value1", "value2", ...]                                         creates an option with value and name set to string
   *    [{ value: "value1"}, { value: "value2"}, ...]                     creates an option with value set to value1, name set to value1
   *    [{ name: name1, value: value1 }, { name: name2, value: value2 }]  creates an option with name set to name1, value set to value1
   * @param {string} value string containing default values to fill the select with
   *    can either be a string, or a comma separated string if select is multiple
   * @param {string} field name of field being changed
   * @param {boolean} multiple OPTIONAL boolean that checks if select is multiple. If it is, value becomes an array
   * 
   * @return {string} HTML string that contains all generated options with name and values
   */
  static generateSelectOptions(options, value, field, multiple = false) {
    if (typeof value === "undefined") {
      value = "";
    }
    // if select is multiple, create an array from the string.
    // otherwise, we just encapsulate value into an array (in case the string has a comma and we want to keep it as one)
    value = (multiple ? value.split(",") : [value]);
    // list of all possible values the string can be
    let possibleValues = [];
    options = options.map(option => {
      let obj = option;
      // if the options specified is just a string, we create an object with value set to that string
      if (typeof option === "string") {
        obj = {value: option};
      }
      
      possibleValues.push(obj.value);
      return obj;
    });

    // defaultValue specifies if we should use the default values or not, based on if the value is invalid or not
    let defaultValue = false;
    value.forEach(value => {
      if (!possibleValues.includes(value)) {
        defaultValue = true;
      }
    });

    if (defaultValue) {
      // if there is no default value found in default_values, value = ""
      if (typeof default_values[field] === "undefined") {
        value = "";
      }
      else {
        // otherwise, we do the same as before and split it up/put it in an array
        value = (multiple ? default_values[field].split(",") : [default_values[field]]);
      }
    }

    return options.map(option => {
      let selected = false;
      // if value is the current option, we select it
      if (value.includes(option.value)) {
        selected = true;
      }

      return `<option value="${option.value}" ${selected ? "selected" : ""} ${option.value === "" ? "disabled" : ""}>${typeof option.name !== "undefined" ? option.name : option.value}</option>`;
    }).join("");
  }

  /**
   * Removes a flight from the itinerary.
   */
  static removeFlight() {
    let row = event.currentTarget.nodeName == "BUTTON"
            ? qs("#itinerary").childElementCount - 1
            : [...qs("#itinerary").children]
                .indexOf(event.target.parentNode.parentNode)
    switch (qs("#itinerary").childElementCount) {
      case 1:
        return;
      case 2:
        qs("#remove-flight").classList.add("disabled");
        // fallthrough
      default:
        qsa("#itinerary tr")[row].remove();
        FlightTable.tables[row].remove();
        for (const [i, el] of qsa("#itinerary .flight-index").entries()) {
          el.textContent = i + 1;
        }
        for (const [i, el] of qsa("#tabs .flight-index").entries()) {
          el.textContent = i + 1;
        }
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
   * Retrieves all nonempty, nondefault values from the itinerary
   * 
   * @param {boolean} includeDefaults specify whether or not to include default values in the itinerary
   * @return {array} Array with all nonempty, nondefault values in the itinerary
   */
  static getAll(includeDefaults = false) {
    let length = this.length;
    let array = [];
    for (let i = 0; i < length; i++) {
      let obj = {};
      let value;
      for (let j = 0; j < required_fields.length; j++) {
        value = this.get(i, required_fields[j]);
        if (typeof value !== "undefined") {
          if (includeDefaults || (value !== "" && default_values[required_fields[j]] !== value)) {
            obj[required_fields[j]] = value;
          }
        }
      }
      for (let j = 0; j < optional_fields.length; j++) {
        value = this.get(i, optional_fields[j]);
        if (typeof value !== "undefined") {
          if (includeDefaults || (value !== "" && default_values[optional_fields[j]] !== value)) {
            obj[optional_fields[j]] = value;
          }
        }
      }
      array.push(obj);
    }

    return array;
  }

  /**
   * Selects filter options if cells contains non-default options. 
   * 
   * @param {Object} cells Object that contains filterable properties
   */
  static selectFilters(cells) {
    // some properties do not have entries in the table, but are related to another entry and may not be default
    let filterMap = {
      "fly_from": undefined,
      "fly_to": undefined,
      "date_from": undefined,
      "select_airlines_exclude": "select_airlines",
      "adult_hand_bag": "adult_hold_bag",
      "mix_with_cabins": "selected_cabins",
      "price_to": "price_from",
      "select_stop_airport_exclude": "select_stop_airport",
      "stopover_to": "stopover_from",
      "dtime_to": "dtime_from",
      "atime_to": "atime_from",
    }

    Object.entries(cells).forEach(([key, value]) => {
      if (typeof value !== "undefined" && default_values[key] !== value) {
        let filterKey = ((typeof filterMap[key] !== "undefined") ? filterMap[key] : key);
        let filter = qs(`#filters option[value=${filterKey}]`);
        if (filter !== null) {
          filter.selected = true;
        }
      }
    });
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
 
    var autocomplete_select_airlines = document.querySelectorAll(".autocomplete_select_airlines");
    M.Autocomplete.init(autocomplete_select_airlines, {
      data: airlines, 
      onAutocomplete: () => {
        const trim = (el) => {el.value = el.value.search(" - ") != -1 ? el.value.split(" - ")[1] : el.value};
        qsa("[name=select_airlines]").forEach(trim);
      },
      limit: 10
    });

    var autocomplete_airport = document.querySelectorAll(".autocomplete_airport");
    M.Autocomplete.init(autocomplete_airport, {
      data: airports, 
      onAutocomplete: () => {
        const trim = (el) => {el.value = el.value.search(" - ") != -1 ? el.value.split(" - ")[1] : el.value};
        qsa("[name=fly_from]").forEach(trim);
        qsa("[name=fly_to]").forEach(trim);
        qsa("[name=select_stop_airport]").forEach(trim);
      },
      limit: 10
    });
  }
}