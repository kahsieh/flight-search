function auth() {
  let xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/auth');
  xhr.send();

  xhr.onload = () => {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      if (xhr.responseText === 'true') {
        // if on index page, make the button clickable
        if (qs('#save') !== null) {
          qs('#sign-in').style = "display: none;";
          qs('#sign-out').classList.remove("hide");
          qs('#saved-itineraries').classList.remove("hide");
          qs('#save').classList.remove('disabled');
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

function userSignOut() {
  signout();
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
  var res = document.cookie;
  var multiple = res.split(";");
  for(var i = 0; i < multiple.length; i++) {
      var key = multiple[i].split("=");
      document.cookie = key[0]+" =; expires = Thu, 01 Jan 1970 00:00:00 UTC";
  }
}
