async function saveItinerary() {
  let fetches = prepareFetches();
  let res = await Promise.all(fetches)
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(bodies => bodies.flat())
    .catch(error => console.log(error));
  res.sort((a, b) => a.price - b.price);

  sendHttpRequest({
    price: res[0].price,
    itinerary: Itinerary.getAll()
  });

  // show that the itinerary was saved
  M.toast({html: 'Itinerary saved!', displayLength: 1500});
}

function sendHttpRequest(jsonData) {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/save-itinerary');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(jsonData));
}