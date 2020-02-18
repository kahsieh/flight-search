function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/auth');
  xhr.send();

  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      if (xhr.responseText === 'true') {
        // if on index page, make the button clickable
        if (qs('#save-itinerary') !== null) {
          qs('#signin').style = "display: none;";
          qs('#signout').style = "display: inline; cursor: pointer";
          qs('#itineraries').style = "display: inline;";
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

function onSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/sign-up');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.onload = function(response) {
    console.log(response);
    auth();
  };
  xhr.send('idtoken=' + id_token);
}

function signout() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/sign-out');
  xhr.send();
  
  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      window.location = '/';
    }
  }
}