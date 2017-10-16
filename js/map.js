var map;
var markers = [];

// Ensures that only 1 polygon is enabled at a time.
var polygon = null;

var placeMarkers = [];
var drawingManager;

// Options Bindings
var availableDurations = [
  new Duration("10 min", 10),
  new Duration("15 min", 15),
  new Duration("30 min", 30),
  new Duration("1 hour", 60)
];

var availableModes = [
  new Mode("drive", "DRIVING"),
  new Mode("walk", "WALKING"),
  new Mode("bike", "BIKING"),
  new Mode("transit ride", "TRANSIT")
];

// TODO: USE LAYERS for database
var locations = [
  {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
  {title: 'University of Washington', location: {lat: 47.6553, lng: -122.3035}},
  {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
  {title: 'Pochi Lifestyle', location: {lat: 47.8502, lng: -122.2503}},
  {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}}
];


// Initialize the map
function initMap() {

  // Custom styling
  var styles = [
    {
        "featureType": "administrative",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#444444"
            }
        ]
    },
    {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "color": "#f2f2f2"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "all",
        "stylers": [
            {
                "saturation": -100
            },
            {
                "lightness": 45
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#46bcec"
            },
            {
                "visibility": "on"
            }
        ]
    }
  ];

  // Constructor to create new JS object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.6062, lng: -122.3321},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });

  // This autocomplete is for use in the search within time entry box.
  var timeAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('search-within-time-text'));
  // This autocomplete is for use in the geocoder entry box.
  var zoomAutocomplete = new google.maps.places.Autocomplete(
      document.getElementById('zoom-to-area-text'));

  // Bias the boundaries within the map for the zoom to area text.
  zoomAutocomplete.bindTo('bounds', map);

  // Create a searchbox in order to execute a places search
  var searchBox = new google.maps.places.SearchBox(
      document.getElementById('places-search'));
  // Bias the searchbox to within the bounds of the map.
  searchBox.setBounds(map.getBounds());

  var largeInfowindow = new google.maps.InfoWindow();

  // Initialize the drawing manager
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    }
  });

  // Style markers
  var defaultIcon = makeMarkerIcon('0091FF');
  var highlightedIcon = makeMarkerIcon('FFFF24');


  // Use locations array to create array of markers.
  for (var i = 0; i< locations.length; i++) {
    // Get position of location
    var position = locations[i].location;
    var title = locations[i].title;

    // Create a marker for each location
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      icon: defaultIcon,
      animation: google.maps.Animation.DROP,
      id: i
    });

    // Add marker to the markers array.
    markers.push(marker);

    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });

    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });

    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
  }

  // Listen for the event fired when the user selects a prediction from the
  // picklist and retrieve more details for that place.
  searchBox.addListener('places_changed', function() {
    searchBoxPlaces(this);
  });

  drawingManager.addListener('overlaycomplete', function(event) {
    // Check if a polygon exists
    if (polygon) {
      polygon.setMap(null);
      hideMarkers(markers);;
    }

    // Switch back to the hand after the polygon is made.
    drawingManager.setDrawingMode(null);

    // Create a editable polygon from overlay.
    polygon = event.overlay;
    polygon.setEditable(true);

    // Search for markers within the polygon.
    searchWithinPolygon();

    // Redo search if polygon is changed.
    polygon.getPath().addListener('set_at', searchWithinPolygon);
    polygon.getPath().addListener('insert_at', searchWithinPolygon);
  });

}


function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}


function populateInfoWindow(marker, infowindow) {
  // Check if infowindow is already open.
  if (infowindow.marker != marker) {

    // Clear the infowindow to give streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;

    // Make sure content is cleared when infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });

    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;

    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
        infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 30
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }
    
    // Using API get closest streetview image within 50 meters
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

    // Open infowindow on correct marker.
    infowindow.open(map, marker);
  }
}


// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}


function searchWithinPolygon() {
  for (var i = 0; i < markers.length; i++) {
    if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
      markers[i].setMap(map);
    } else {
      // Hide markers outside polygon.
      markers[i].setMap(null);
    }
  }
}


function searchWithinTime(address, duration, mode) {
  // Initialize distance matrix service
  var distanceMatrixService = new google.maps.DistanceMatrixService;

  if (address == '') {
    window.alert('You must enter an address.');
  } else {
    hideMarkers(markers);

    var origins = [];
    for (var i = 0; i < markers.length; i++) {
      origins[i] = markers[i].position;
    }
    var destination = address;
    // Now that both the origins and destination are defined, get all the
    // info for the distances between them.
    distanceMatrixService.getDistanceMatrix({
      origins: origins,
      destinations: [destination],
      travelMode: google.maps.TravelMode[mode],
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, function(response, status) {
      if (status !== google.maps.DistanceMatrixStatus.OK) {
        window.alert('Error was: ' + status);
      } else {
        displayMarkersWithinTime(response, duration, mode, destination);
      }
    });
  }
}


// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response, duration, mode, address) {
  var maxDuration = duration;
  var origins = response.originAddresses;
  var destinations = response.destinationAddresses;
  // Parse through the results, and get the distance and duration of each.
  // Because there might be  multiple origins and destinations we have a nested loop
  // Then, make sure at least 1 result was found.
  var atLeastOne = false;
  for (var i = 0; i < origins.length; i++) {
    var results = response.rows[i].elements;
    for (var j = 0; j < results.length; j++) {
      var element = results[j];
      if (element.status === "OK") {
        // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
        // the function to show markers within a user-entered DISTANCE, we would need the
        // value for distance, but for now we only need the text.
        var distanceText = element.distance.text;
        // Duration value is given in seconds so we make it MINUTES. We need both the value
        // and the text.
        var duration = element.duration.value / 60;
        var durationText = element.duration.text;
        if (duration <= maxDuration) {
          //the origin [i] should = the markers[i]
          markers[i].setMap(map);
          atLeastOne = true;
          // Create a mini infowindow to open immediately and contain the
          // distance and duration
          var infowindow = new google.maps.InfoWindow({
            content: durationText + ' away, ' + distanceText +
              '<div><input type=\"button\" value=\"View Route\" onclick=' +
              '\"displayDirections(&quot;' + origins[i] + '&quot;, &quot;' + 
              mode + '&quot;, &quot;' + address + '&quot;);\"></input></div>'
          });
          infowindow.open(map, markers[i]);
          // Put this in so that this small window closes if the user clicks
          // the marker, when the big infowindow opens
          markers[i].infowindow = infowindow;
          google.maps.event.addListener(markers[i], 'click', function() {
            this.infowindow.close();
          });
        }
      }
    }
  }
  if (!atLeastOne) {
    window.alert('We could not find any locations within that distance!');
  }
}


function displayDirections(origin, mode, address) {
  hideMarkers(markers);
  var directionsService = new google.maps.DirectionsService;
  // Get the destination address from the user entered value.
  var destinationAddress = address;

  directionsService.route({
    // The origin is the passed in marker's position.
    origin: origin,
    // The destination is user entered address.
    destination: destinationAddress,
    travelMode: google.maps.TravelMode[mode]
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map,
        directions: response,
        draggable: true,
        polylineOptions: {
          strokeColor: 'green'
        }
      });
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}


// This function fires when the user selects a searchbox picklist item.
// It will do a nearby search using the selected query string or place.
function searchBoxPlaces(searchBox) {
  hideMarkers(placeMarkers);
  var places = searchBox.getPlaces();
  // For each place, get the icon, name and location.
  createMarkersForPlaces(places);
  if (places.length == 0) {
    window.alert('We did not find any places matching that search!');
  }
}


// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };
    // Create a marker for each place.
    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id
    });

    // Infowindow with place detail.
    var placeInfoWindow = new google.maps.InfoWindow();

    // If a marker is clicked, do a place details search on it.
    marker.addListener('click', function() {
      if (placeInfoWindow.marker == this) {
        console.log("This infowindow is already opened.");
      } else {
        getPlacesDetails(this, placeInfoWindow);
      }
    });
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
}


// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      var innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.formatted_phone_number) {
        innerHTML += '<br>' + place.formatted_phone_number;
      }
      if (place.opening_hours) {
        innerHTML += '<br><br><strong>Hours:</strong><br>' +
            place.opening_hours.weekday_text[0] + '<br>' +
            place.opening_hours.weekday_text[1] + '<br>' +
            place.opening_hours.weekday_text[2] + '<br>' +
            place.opening_hours.weekday_text[3] + '<br>' +
            place.opening_hours.weekday_text[4] + '<br>' +
            place.opening_hours.weekday_text[5] + '<br>' +
            place.opening_hours.weekday_text[6];
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
  });
}

function Duration(timeString, timeVal) {
  var self = this;
  self.durationTime = ko.observable(timeString);
  self.timeValue = ko.observable(timeVal);
}

function Mode(ride, rideMode) {
  var self = this;
  self.modeString = ko.observable(ride);
  self.mode = ko.observable(rideMode);
}

function AppViewModel() {
  var self = this;

  // Option bindings.
  self.selectedDuration = ko.observable(availableDurations[0]);
  self.selectedMode = ko.observable(availableModes[0]);

  // Text Bindings
  self.zoom_text = ko.observable("");
  self.search_text = ko.observable("");
  self.places_text = ko.observable("");

  // Click Bindings
  self.show = function () {
    var bounds = new google.maps.LatLngBounds();

    // Extend boundaries and displays each marker.
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
  };

  self.hide = function() {
    hideMarkers(markers);
  }

  self.draw = function() {
    if (drawingManager.map) {
      drawingManager.setMap(null);
      // If user drew something, undo the drawing.
      if (polygon) {
        polygon.setMap(null);
      }
    } else {
      drawingManager.setMap(map);
    }
  };

  self.zoom = function() {
    var address = self.zoom_text();
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();

    // Get the address from input.
    var address = self.zoom_text();

    // Check for blank address.
    if (address == '') {
      window.alert('You must enter an address.');
    } else {
      geocoder.geocode(
        {
         address: address,
         componentRestrictions: {locality: 'Seattle'},
        }, function(result, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(result[0].geometry.location);
            map.setZoom(15);
          } else {
            window.alert('Could not find that location. Enter a more specific location.');
          }
        });
    }
  };

  self.search = function() {
    var address = self.search_text();
    var maxDuration = self.selectedDuration().timeValue();
    var methodOfTravel = self.selectedMode().mode();
    searchWithinTime(address, maxDuration, methodOfTravel);
  };

  self.places = function() {
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
      query: self.places_text(),
      bounds: bounds
    }, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        createMarkersForPlaces(results);
      }
    });
  };
}


ko.applyBindings(new AppViewModel());
