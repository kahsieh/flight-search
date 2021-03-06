#!/usr/bin/env bash

# Five Peas Flight Search
# gen-airports.sh

# Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
# All Rights Reserved.

echo '/*
Five Peas Flight Search
airports.js (generated by gen-airports.sh)

Copyright (c) 2020 Derek Chu, Kevin Hsieh, Leo Liu, Quentin Truong.
All Rights Reserved.
*/
"use strict";

/**
 * KV of airports for autocomplete.
 */
let airports = {'
(cat airports.csv 2>/dev/null || curl -s https://ourairports.com/data/airports.csv) |
  # (1) Convert all but the last column to TSV.
  # (2) Convert the last column to TSV.
  # (3) Replace "" with \".
  sed -E 's/("(([^"]|"")*)")?,/\2\t/g; s/("(([^"]|"")*)")?$/\2/; s/""/\\"/g' |
  # Sort by type (large_airport < medium_airport < small_airport).
  sort -t $'\t' -k 3 |
  # Print out rows that:
  # (1) are airports,
  # (2) have scheduled flights, and
  # (3) have an IATA code.
  # BER, EPA, PKX, and XCR are exempt from these filters.
  awk -F '\t' '{
    if (($3 ~ /airport/ && $12 == "yes" && $14 != "") ||
        $14 == "BER" || $14 == "EPA" || $14 == "PKX" || $14 == "XCR") {
      print "  \""$14" - "$4", "($11 == "" ? "" : $11", ")$9"\": null,";
    }
  }'
echo '  "MLH - EuroAirport Basel-Mulhouse-Freiburg Airport, Bâle/Mulhouse, CH": null,'
echo '};

/**
 * Metro area airport groups. Sources:
 * - https://wikitravel.org/en/Metropolitan_Area_Airport_Codes
 * - https://en.wikivoyage.org/wiki/Metropolitan_area_airport_codes
 * - http://milesglu.blogspot.com/2014/07/metropolitan-area-airport-codes.html
 */
const metros = {
  // Asia
  "BKK - Bangkok (all airports), TH":
    ["BKK", "DMK"],
  "BJS - Beijing (all airports), CN":
    ["PEK", "PKX"],  // no scheduled flights: NAY
  "JKT - Jakarta (all airports), ID":
    ["CGK", "HLP"],
  "KUL - Kuala Lumpur (all airports), MY":
    ["KUL", "SZB"],
  "NGO - Nagoya (all airports), JP":
    ["NGO", "NKM"],
  "OSA,UKB - Osaka (all airports), JP":
    ["KIX", "ITM", "UKB"],
  "SPK - Sapporo (all airports), JP":
    ["CTS", "OKD"],
  "SEL - Seoul (all airports), KR":
    ["ICN", "GMP"],
  "SHA - Shanghai (all airports), CN":
    ["PVG", "SHA"],
  "TPE - Taipei (all airports), TW":
    ["TPE", "TSA"],
  "TYO - Tokyo (all airports), JP":
    ["NRT", "HND"],
  "THR - Tehran (all airports), IR":
    ["IKA", "THR"],  // Kiwi does not show THR flights

  // Europe
  "BER - Berlin (all airports), DE":
    ["TXL", "SXF", "BER"],
  "BUH - Bucharest (all airports), RO":
    ["OTP"],  // no scheduled flights: BBU
  "EAP - EuroAirport Basel-Mulhouse-Freiburg Airport":
    ["BSL", "MLH"],
  "BRU - Brussels (all airports), BE":
    ["BRU", "CRL"],
  "IST - Istanbul (all airports), TR":
    ["IST", "SAW"],
  "LON - London (all airports), GB":
    ["LHR", "LTN", "LGW", "STN", "LCY", "SEN"],  // no scheduled flights: BQH
  "MIL,PMF - Milan (all airports), IT":
    ["MXP", "BGY", "LIN", "PMF"],
  "MOW - Moscow (all airports), RU":
    ["VKO", "DME", "SVO", "ZIA"],  // no scheduled flights: BKA
  "OSL - Oslo (all airports), NO":
    ["OSL", "TRF"],  // no scheduled flights: RYG
  "PAR - Paris (all airports), FR":
    ["CDG", "ORY", "BVA", "XCR"],  // no scheduled flights: LBG
  "REK - Reykjavik (all airports), ID":
    ["KEF", "RKV"],
  "ROM - Rome (all airports), IT":
    ["FCO", "CIA"],
  "STO - Stockholm (all airports), SE":
    ["ARN", "NYO", "VST", "BMA"],
  "TCI - Tenerife (all airports), ES":
    ["TFS", "TFN"],
  "WAW - Warsaw (all airports), PL":
    ["WAW", "WMI"],

  // North America
  "CHI - Chicago (all airports), US":
    ["ORD", "MDW", "RFD"],
  "DFW - Dallas (all airports), US":  // ITA: QDF
    ["DFW", "DAL"],
  "DTT - Detroit (all airports), US":
    ["DTW"],  // no scheduled flights: DET, YIP
  "YEA - Edmonton (all airports), CA":
    ["YEG"],
  "HOU - Houston (all airports), US":  // ITA: QHO
    ["IAH", "HOU"],
  "LAX,ONT,SNA,BUR,LGB - Los Angeles (all airports), US":  // ITA: QLA
    ["LAX", "ONT", "SNA", "BUR", "LGB"],
  "MIA,FLL,PBI - Miami (all airports), US":  // ITA: QMI
    ["MIA", "FLL", "PBI"],
  "YMQ - Montreal (all airports), CA":
    ["YUL", "YHU"],  // no scheduled flights: YMY
  "NYC,HPN - New York City (all airports), US":
    ["EWR", "JFK", "LGA", "SWF", "HPN"],
  "SFO,OAK,SJC - San Francisco (all airports), US":  // ITA: QSF
    ["SFO", "OAK", "SJC"],
  "YTO,YKF - Toronto (all airports), CA":
    ["YYZ", "YTZ", "YKF"],
  "WAS - Washington DC (all airports), US":
    ["BWI", "IAD", "DCA"],

  // South America
  "BHZ - Belo Horizonte (all airports), BR":
    ["CNF"],  // no scheduled flights: PLU
  "BUE - Buenos Aires (all airports), AR":
    ["EZE", "EPA", "AEP"],
  "RIO - Rio de Janeiro (all airports), BR":
    ["GIG", "SDU"],
  "SAO - São Paulo (all airports), BR":
    ["GRU", "VCP", "CGH"],
};

// Apply metro areas.
{
  // Create a temporary object which will replace the airports object.
  let temp = {};

  // Create a dictionary mapping airport codes to full keys.
  const codeLookup = Object.fromEntries(Object.keys(airports)
      .map(key => [key.slice(0, 3), key]));

  // Add airports which are part of metros.
  let metroAirports = new Set();
  for (const [metro, airports] of Object.entries(metros)) {
    // Add the metro itself.
    temp[metro] = null;
    for (let airport of airports) {
      // Expand the airport code into a full key.
      if (!(airport in codeLookup)) {
        console.warn(`Unknown airport ${airport} discarded`);
        continue;
      }
      airport = codeLookup[airport];
      // If the metro name is not part of the full key, append it.
      const metroName = metro.split(" - ")[1]
                             .replace(/ \(all airports\), ../, "");
      if (!airport.includes(metroName)) {
        airport += ` (near ${metroName})`;
      }
      // Add the full key of the airport with a ↳ in front to indicate that it
      // is part of a metro.
      temp["↳ " + airport] = null;
      // Record the fact that this airport is part of a metro.
      metroAirports.add(airport.slice(0, 3));
    }
  }

  // Add airports which are not part of metros.
  for (const key of Object.keys(airports)) {
    if (!metroAirports.has(key.slice(0, 3))) {
      temp[key] = null;
    }
  }

  // Replace airports object.
  airports = temp;
}

// Append to document as a datalist.
addEventListener("DOMContentLoaded", () => addDatalist("airports", airports));'
