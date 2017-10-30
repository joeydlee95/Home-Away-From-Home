# Trip Travel App
## Going to Seattle

## Introduction
This is an application utilizing Google Map APIs and Foursquare API of tourist places to go in Seattle.

Some of the functionalities include: 
- View or hide these locations/markers.
- View infowindows by clicking markers on the map.
- Filter to view a selection of these locations

## Features
Clicking a location 
  * Opens an infowindow with data retrieved through AJAX calls with the Foursquare API. It contains information such as the location, phone number, website, and a photo of the place.
Filtering
  * Clicking on the checkbox next to the location name will toggle them visible on the map.
  * Clicking on the location names on the filter will select that particular location and open its infowindow.


## How to run
1. git clone https://github.com/joeydlee95/trip-travel
2. Using your favorite browser, open index.html.
3. That's IT!


## Improvements to come:
- Data layer for locations
- Ability to add/remove locations
- Scrollable filter
- able to see more photos(scrollable)
- Better centering between devices

## Bugs
- Adds more and more pictures when you search a place and click search

## Sources
http://api.jquery.com/jquery.getjson/
  - Assigning ajax callback handlers.
https://codepen.io/anon/pen/gXbmLY
  - Example for bad Google Map loading error handling.