function displayItineraries() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/display-itineraries');
  xhr.send();

  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE) {
      let response = JSON.parse(xhr.responseText);

      if (xhr.status === 200 && response.length !== 0) {
        new SavedItineraries(response);
      }
      else {
        qs('#itineraries-authenticated').style = 'display: none;';
        qs('#itineraries-none').style = 'display: block;';
      }
    }
  }
}

class SavedItineraries {
  constructor(firebaseData) {
    this.firebaseData = firebaseData;
    this.createItineraryTable();
  }

  get length() { return qs("#saved-itineraries").childElementCount; }

  createItineraryTable() {
    this.firebaseData.forEach(data => {
      this.createRow(data);
    });

    this.createHeader();
  }

  loadLink(index) {
    let data = this.firebaseData[index];

    window.location = getShareableLink(data.name, data.itinerary);
  }

  shareLink(index) {
    let data = this.firebaseData[index];

    shareItinerary(data.name, data.itinerary, `#share${index}`, `#share-link${index}`);
  }

  deleteRow(index) {
    qs(`#delete${index}`).classList.add('disabled');
    qs('#saved-itineraries').rows[index].hidden = true;
    let confirm = true;

    M.toast({
      html: `<div>Itinerary deleted</div><button class="btn-flat toast-action undoButton${index}">Undo</button>`,
      displayLength: 1500,
      completeCallback: () => { (confirm) ? this.deleteItinerary(index) : this.undoDeleteItinerary(index) }
    });

    qs(`.undoButton${index}`).onclick = () => {
      confirm = false;
      M.Toast.getInstance(qs('.toast')).dismiss();
    }
  }

  deleteItinerary(index) {
    
  }

  undoDeleteItinerary(index) {
    qs(`#delete${index}`).classList.remove('disabled');
    qs('#saved-itineraries').rows[index].hidden = false;
  }

  createRow(row) {
    let itineraryRow = qs('#saved-itineraries').insertRow();
    let index = this.length - 1;
    itineraryRow.classList.add('clickable');

    itineraryRow.innerHTML = `
      <td style="padding-right: 20px">
        ${this.length}: ${row.name}
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="load${index}">
          <i class="material-icons">restore</i>
        </button>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="share${index}">
          <i class="material-icons">share</i>
          <input type="hidden" id="share-link${index}">
        </button>
      </td>
      <td>
        <button class="btn-floating waves-effect waves-light" id="delete${index}">
          <i class="material-icons red">delete</i>
        </button>
      </td>
      <td>
        ${row.dTime} (${row.flyFrom})
      </td>
      <td>
        ${row.aTime} (${row.flyTo})
      </td>
      <td>
        ${this.getFlightPath(index)}
      </td>
    `;

    qs(`#load${index}`).onclick = () => {
      this.loadLink(index);
    }
    qs(`#share${index}`).onclick = () => {
      this.shareLink(index);
    }
    qs(`#delete${index}`).onclick = () => {
      this.deleteRow(index);
    }
  }

  createHeader() {
    let headerRow = qs('#saved-itineraries-table').createTHead().insertRow();

    headerRow.innerHTML = `
      <th>Itineraries</th>
      <th>Load</th>
      <th>Share</th>
      <th>Delete</th>
      <th>Departure</th>
      <th>Arrival</th>
      <th>Flight Path</th>
    `;
  }

  getFlightPath(index) {
    let itinerary = this.firebaseData[index].itinerary;

    return itinerary.map(flight => {
      let src = (typeof flight.fly_from !== 'undefined') ? flight.fly_from : 'NONE';
      let dest = (typeof flight.fly_to !== 'undefined') ? flight.fly_to : 'NONE';

      return `${src}🡒${dest}`;
    }).join(', ');
  }
}