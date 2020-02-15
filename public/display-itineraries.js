function displayItineraries() {
  // let xhr = new XMLHttpRequest();
  // xhr.open('POST', '/api/display-itineraries');
  // xhr.send();

  // xhr.onload = () => {
  //   if (xhr.readyState === xhr.DONE) {
  //     let response = JSON.parse(xhr.responseText);

  //     if (xhr.status === 200 && response.length !== 0) {
  //       new SavedItineraries(response);
  //     }
  //     else {
  //       qs('#itineraries-authenticated').style = 'display: none;';
  //       qs('#itineraries-none').style = 'display: block;';
  //     }
  //   }
  // }

  new SavedItineraries();
}

class SavedItineraries {
  constructor(response) {
    response = JSON.parse('[{"created_at":{"seconds":1581757495,"nanoseconds":962000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581757495,"nanoseconds":962000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581758326,"nanoseconds":625000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581758326,"nanoseconds":625000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581758409,"nanoseconds":32000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581758409,"nanoseconds":32000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581761277,"nanoseconds":893000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581761277,"nanoseconds":893000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581761440,"nanoseconds":851000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581761440,"nanoseconds":851000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581761580,"nanoseconds":522000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"}],"name":"Untitled Itinerary","price_history":[{"price":1232,"time":{"seconds":1581761580,"nanoseconds":522000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"},{"created_at":{"seconds":1581763318,"nanoseconds":837000000},"itinerary":[{"conn_on_diff_airport":false,"date_from":"2020-05-15","fly_from":"LAX","fly_to":"KHH","max_stopovers":"1"},{"conn_on_diff_airport":false,"date_from":"2020-05-22","fly_from":"KHH","fly_to":"NRT|KIX","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-05-29","fly_from":"KIX|NRT","fly_to":"KHH","max_stopovers":"0"},{"conn_on_diff_airport":false,"date_from":"2020-06-05","fly_from":"KHH","fly_to":"LAX","max_stopovers":"1"},{"conn_on_diff_airport":false,"fly_from":"asdfasdgadf"},{"conn_on_diff_airport":false,"date_from":"1232-03-23","fly_to":"gdagdfsdsfasdfdasf","max_stopovers":"4"},{"conn_on_diff_airport":false,"select_airlines_exclude":true}],"name":"Untitled Itinerary","price_history":[{"price":-1,"time":{"seconds":1581763318,"nanoseconds":837000000}}],"uid":"31hb8bpX3jZwQwlvJCilcQJGHnW2"}]');
    this.response = response;
    this.createItineraryTable(response);
  }

  get length() { return qs("#saved-itineraries").childElementCount; }

  /**
   * get longest flight path from responses
   */
  longestFlightPath() {
    return Math.max.apply(Math, this.response.map(obj => { return obj.itinerary.length; }));
  }

  createItineraryTable(response) {

    response.forEach(data => {
      this.createRow(data);
    });

    this.createHeader();
  }

  loadLink(index) {
    let data = this.response[index];

    window.location = getShareableLink(data.name, data.itinerary);
  }

  shareLink(index) {
    let data = this.response[index];

    shareItinerary(data.name, data.itinerary, `#share${index}`, `#share-link${index}`);
  }

  checkPrice(index) {

  }

  createRow(row) {
    let itineraryRow = qs('#saved-itineraries').insertRow();
    let index = this.length - 1;
    itineraryRow.style.border = 0;

    itineraryRow.innerHTML = `
      <td style="padding-right: 20px">
        ${this.length}: ${row.name}
      </td>
      <td style="padding-right: 20px">
        <button class="btn-floating waves-effect waves-light" id="load${index}">
          <i class="material-icons">restore</i>
        </button>
      </td>
      <td style="padding-right: 20px">
        <button class="btn-floating waves-effect waves-light" id="share${index}">
          <i class="material-icons">share</i>
          <input type="hidden" id="share-link${index}">
        </button>
      </td>
      <td style="padding-right: 20px">
        <button class="btn-floating waves-effect waves-light" id="price${index}">
          <i class="material-icons">attach_money</i>
        </button>
      </td>
      ${this.flights(row.itinerary)}
    `;

    qs(`#load${index}`).onclick = () => {
      this.loadLink(index);
    }
    qs(`#share${index}`).onclick = () => {
      this.shareLink(index);
    }
    qs(`#price${index}`).onclick = () => {
      this.checkPrice(index);
    }
  }

  createHeader() {
    let headerRow = qs('#saved-itineraries-table').createTHead().insertRow();

    headerRow.insertCell(0).innerHTML = 'Itineraries';
    headerRow.insertCell(1).innerHTML = 'Load';
    headerRow.insertCell(2).innerHTML = 'Share';
    headerRow.insertCell(3).innerHTML = 'Price';

    for (let i = 0; i < this.longestFlightPath(); i++) {
      headerRow.insertCell(i + 4).innerHTML = 'Flight ' + (i + 1);
    }
  }

  flights(itinerary) {
    let flights = '';
    for (let i = 0; i < this.longestFlightPath(); i++) {
      let content = '';
      if (typeof itinerary[i] !== 'undefined') {
        let src = (typeof itinerary[i].fly_from !== 'undefined') ? itinerary[i].fly_from : 'NONE';
        let dest = (typeof itinerary[i].fly_to !== 'undefined') ? itinerary[i].fly_to : 'NONE';

        content = `${src}🡒${dest}`;
      }
      flights += `<td class='itineraries-flights'>${content}</td>`;
    }

    return flights;
  }
}