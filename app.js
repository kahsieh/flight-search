'use strict';

const express = require('express');
const path = require("path");
const app = express();

app.use(express.static('public'))
app.use(function(req, res) {
  res.status(404).sendFile(path.join(__dirname, "/public/404.html"))
})

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 8080, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;
