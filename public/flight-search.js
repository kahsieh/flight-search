/*
Five Peas Flight Search
flight-search.js

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * Function to run when main page loads.
 */
addEventListener("load", () => {
  // Initialize the ItineraryTable.
  itable = new ItineraryTable(
      qs("#itinerary-name"),
      qs("#filters"),
      qs("#itinerary"),
      qs("#remove-flight"),
      _ => new FlightTable(qs("#tabs"),
                           qs("#columns"),
                           qs("#tables"),
                           qs("#book")),
      i => ftables[i].remove()
  );

  // If no itinerary is specified in the URL, then load a default one.
  if (!itable.loadFromURL()) {
    let date1 = new Date();
    date1.setDate(date1.getDate() + 14);
    let date2 = new Date();
    date2.setDate(date2.getDate() + 21);
    itable.loadFromItinerary(new Itinerary([
      {
        "max_stopovers": 2,
        "date_from": date1.toISOString().substring(0, 10)
      },
      {
        "max_stopovers": 2,
        "date_from": date2.toISOString().substring(0, 10)
      },
    ]));
  }

  // Initialize Materialize selects.
  M.FormSelect.init(qsa("select"), {});
});

/**
 * Function to run when search button is pressed.
 */
async function search() {
  // Update UI.
  qs("#add-flight").classList.add("disabled");
  qs("#remove-flight").classList.add("disabled");
  qs("#search").classList.add("disabled");
  qs("#spinner").classList.remove("hide");
  qsa(".results-message").forEach(el => el.classList.add("hide"));
  qsa(".no-results-message").forEach(el => el.classList.add("hide"));
  ftables.forEach(ft => ft.clearSelection());

  // Execute fetches.
  let [res, single] = await kiwiSearch(itable.get());

  if (res) {
    // Display message.
    qsa(".results-message").forEach(e => e.classList.remove("hide"));

    // Display results.
    console.log("Response:");
    console.log(res);
    FlightTable.displayResults(res, single);
  }
  else {
    FlightTable.displayResults([], true);
    qsa(".no-results-message").forEach(e => e.classList.remove("hide"));
  }

  // Update UI.
  qs("#add-flight").classList.remove("disabled");
  qs("#remove-flight").classList.remove("disabled");
  qs("#search").classList.remove("disabled");
  qs("#spinner").classList.add("hide");
}

/**
 * Function to run when share button is pressed.
 */
function share() {
  shareItinerary(qs("#itinerary-name").value, table.get(), qs("#share"),
                 qs("#share-link"));
}

/**
 * Functions to collapse and expand the shrinkable sections
 */
function collapseSection(element) {
  // get the height of the element's inner content, regardless of its actual size
  var sectionHeight = element.scrollHeight;
  
  // temporarily disable all css transitions
  var elementTransition = element.style.transition;
  element.style.transition = '';
  
  // on the next frame (as soon as the previous style change has taken effect),
  // explicitly set the element's height to its current pixel height, so we 
  // aren't transitioning out of 'auto'
  requestAnimationFrame(function() {
    element.style.height = sectionHeight + 'px';
    element.style.transition = elementTransition;
    
    // on the next frame (as soon as the previous style change has taken effect),
    // have the element transition to height: 0
    requestAnimationFrame(function() {
      element.style.height = document.querySelector(`div.shrinkable#${element.id} table thead`).scrollHeight + document.querySelector(`div.shrinkable#${element.id} table tbody`).scrollHeight + 'px';
    });
  });
  
  // mark the section as "currently collapsed"
  element.setAttribute('data-collapsed', 'true');
}

function expandSection(element) {
  // get the height of the element's inner content, regardless of its actual size
  var sectionHeight = element.scrollHeight;
  
  // have the element transition to the height of its inner content
  element.style.height = sectionHeight + 'px';

  // when the next css transition finishes (which should be the one we just triggered)
  element.addEventListener('transitionend', function func(e) {
    // remove this event listener so it only gets triggered once
    element.removeEventListener('transitionend', func);
    
    // remove "height" from the element's inline styles, so it can return to its initial value
    element.style.height = null;
  });
}