addEventListener("load", () => {
  auth();
});

function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/auth');
  xhr.send();

  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      if (xhr.responseText === 'true') {
        qs('#signin').style = "display: none;";
        qs('#signout').style = "display: inline; cursor: pointer";
        qs('#flights').style = "display: inline;";

        // if on index page, make the button clickable
        if (qs('#save-itinerary') !== null) {
          qs('#save-itinerary').classList.remove('disabled');
        }

        // if on itineraries page, display if authenitcated
        if (qs('#itineraries-unauthenticated') !== null && qs('#itineraries-authenticated') !== null) {
          qs('#itineraries-unauthenticated').style = 'display: none;';
          qs('#itineraries-authenticated').style = 'display: block;';
        }
      }
    }
  }
}

function signout() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', 'api/sign-out');
  xhr.send();
  
  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      window.location = '/';
    }
  }
}