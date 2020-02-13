let xhr = new XMLHttpRequest();
xhr.open('POST', '/api/auth');
xhr.send();

xhr.onload = () => {
  if (xhr.readyState === xhr.DONE && xhr.status === 200) {
    if (xhr.responseText === 'true') {
      document.getElementById('signin').style = "display: none;";
      document.getElementById('signout').style = "display: inline; cursor: pointer";
    }
  }
};

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