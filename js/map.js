var map;
var markers = [];
var currentMarker;
var currentInfowindow;

// Style for markers
var defaultIcon;
var highlightedIcon;

// Foursquare API data
var foursquareAPI = 'https://api.foursquare.com/v2/venues/search';
var CLIENT_ID = 'TLH5X52P2I1BLQ2Q0VK0YH52YCNBV0HD1LKLBZQWU55FOL4M';
var CLIENT_SECRET = '1G20HS0BA5QHRZDECBHN5FFJTRJTIGO0V0XNPHGIO1M2ICXO';
var version = "20170801";

// TODO: USE LAYERS for database
var locations = [
  {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
  {title: 'Smith Tower', location: {lat: 47.6034317, lng: -122.3317931}},
  {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
  {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}},
  {title: 'Seattle Aquarium', location: {lat: 47.6076966, lng: -122.3431277}}
];

///////////////////////////////
///// Helper Methods //////////
///////////////////////////////
function clean() {
  // Clear infowindows
  if(currentInfowindow) {
    currentInfowindow.setMap(null);
  }

  // Get rid of highlight on markers
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].getIcon() !== defaultIcon) {
      markers[i].setIcon(defaultIcon);
    }
  }
}


///////////////////////////////
///// Infowindow Content //////
///////////////////////////////
function searchPlaceCallback(result, marker, infowindow) {
  if (result.meta.code != 200) {
    console.log("Failed to complete search. ERROR: " + result.meta.code);
  } else {
    currentMarker = marker;
    currentInfowindow = infowindow;
    var innerHTML = '<div>';
    innerHTML += '<strong>' + marker.title + '</strong>';
    
    if (result.response.venues[0].contact.formattedPhone) {
      innerHTML += '<br>' + result.response.venues[0].contact.formattedPhone;
    }
    if (result.response.venues[0].location.formattedAddress) {
      innerHTML += '<br>' + result.response.venues[0].location.formattedAddress;
    }

    if (result.response.venues[0].url) {
      innerHTML += '<br><a href="' + result.response.venues[0].url + '">Website</a>';
    }

    innerHTML += '</div>';
    var displayHTML = '<div id="photogallery">';

    var photoURL = 'https://api.foursquare.com/v2/venues/' +
                   result.response.venues[0].id +
                   '/photos';
    var data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      v: version
    };

    var jsonHandler = $.getJSON(photoURL, data, function(dataRes) {

      if (dataRes.meta.code != 200) {
        console.log("Failed to complete getting photos. ERROR: " + dataRes.meta.code);
      } else {
        // Checks if there are photos.
        //TODO: Some kind of data structure storage to hold multiple urls
        if (dataRes.response.photos.count >= 1) {
          displayHTML += '<img src="';
          displayHTML += dataRes.response.photos.items[0].prefix;
          displayHTML += 'height200';
          displayHTML += dataRes.response.photos.items[0].suffix;
          displayHTML += '" alt="Picture of location">';
        } 
        // TODO: No photo photo input
      }
      displayHTML += '</div>';
      currentInfowindow.setContent(innerHTML + displayHTML);
      infowindow.open(map, currentMarker);
    })
      .fail(function() {
        console.log( "Error attempting photo AJAX call to Foursquare." );
        window.alert("Check for internet connection errors. Trying to get location data from Foursquare.");
      });
  }
}

function getPlacesDetails(marker, infowindow) {
  var latlng = marker.position.lat() + ',' + marker.position.lng();
  var data = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    v: version,
    ll: latlng,
    intent: "match",
    limit: 1,
    query: marker.title
  };

  var offsetLat = {lat: marker.position.lat() + 0.025, lng: marker.position.lng()};
  map.setCenter(offsetLat);
  var jqxhr = $.getJSON(foursquareAPI, data, function(result) {
    searchPlaceCallback(result, marker, infowindow);
  })
    .fail(function() {
      console.log( "Error attempting AJAX call to Foursquare." );
      window.alert("Check for internet connection errors. Trying to get location data from Foursquare.");
    });
}

function populateInfoWindow(marker, infowindow) {
  // Check if infowindow is already open.
  if (infowindow.marker != marker) {
    infowindow.setContent('');
    infowindow.marker = marker;

    // Make sure content is cleared when infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });

    currentMarker = marker;
    currentInfowindow = infowindow;

    // If a marker is clicked, do a place details search on it.
    getPlacesDetails(currentMarker, currentInfowindow);
  } else {
    infowindow.setMap(map);
  }
}


///////////////////////////////
///// Marker Properties ///////
///////////////////////////////
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

// Add locations to markers array
function addToMarkers(marker, infowindow) {
  // Add marker to the markers array.
  markers.push(marker);

  // Create an onclick event to open the large infowindow at each marker.
  marker.addListener('click', function() {
    populateInfoWindow(marker, infowindow);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() { marker.setAnimation(null); }, 1000);
  });
  

  marker.addListener('mouseover', function() {
    this.setIcon(highlightedIcon);
  });

  marker.addListener('mouseout', function() {
    this.setIcon(defaultIcon);
  });
}

function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function selectMarker(markerTitle) {
  //TODO: AutoComplete
  //TODO: Recommendations
  //TODO: Allow for incomplete searches
  var found = false;
  var largeInfowindow = new google.maps.InfoWindow();

  for (var i = 0; i < markers.length; i++) {
    if (markerTitle === markers[i].title.toLowerCase()) {
      markers[i].setMap(map);
      var offsetLat = {lat: markers[i].position.lat() + 0.025, lng: markers[i].position.lng()};
      map.setCenter(offsetLat);
      found = true;


      clean();
      populateInfoWindow(markers[i], largeInfowindow);

      break;
    }
  }

  if (!found) {
    window.alert("Query for specified location has failed, try again.");
  }
}

///////////////////////////////
///// Map Initialization //////
///////////////////////////////
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
    zoom: 12,
    styles: styles,
    mapTypeControl: false
  });

  defaultIcon = makeMarkerIcon('0091FF');
  highlightedIcon = makeMarkerIcon('FFFF24');

  var largeInfowindow = new google.maps.InfoWindow();

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

    addToMarkers(marker, largeInfowindow);
  }

  var bounds = new google.maps.LatLngBounds();

  // Extend boundaries and displays each marker.
  for (var j = 0; j < markers.length; j++) {
    markers[j].setMap(map);
    bounds.extend(markers[j].position);
  }
  google.maps.event.addDomListener(window, 'resize', function() {
    map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
  });
}

mapError = () => {
  // Error handling
  window.alert("Could not load the Google Maps. Sorry!");
};

///////////////////////////////
//////// Knockout Model ///////
///////////////////////////////
function AppViewModel() {
  var self = this;
  self.wantsFilter = ko.observable(true);
  self.locations = ko.observableArray(['Space Needle', 'Smith Tower', 'Pike Place Market', 
                                                'Gas Works', 'Seattle Aquarium']);

  // Text Bindings
  self.search_text = ko.observable("");

  // Click Bindings
  self.reset = function () {
    // Resets the infowindow
    clean();

    var bounds = new google.maps.LatLngBounds();
    // Extend boundaries and displays each marker.
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      if (markers[i].getAnimation() !== null) {
        markers[i].setAnimation(null);
      }
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
  };

  self.hide = function() {
    hideMarkers(markers);
  };

  self.search = function() {
    var searchValue = self.search_text().toString().toLowerCase();
    selectMarker(searchValue);
  };

  self.toggleShow = function(location) {
    
    clean();

    // Apply changes
    for (var i = 0; i < markers.length; i++) {
      // Find marker to enable or disable
      if(markers[i].title === location) {
        if (markers[i].getMap() === null) {
          markers[i].setMap(map);
        } else {
          markers[i].setMap(null);
        }
        break;
      }
    }
    return true;
  };

  self.select = function(location) {
    // If unchecked throw error
    clean();

    for (var i = 0; i < markers.length; i++) {
      if (markers[i].title === location) {
        if (markers[i].getMap() === null) {
          window.alert("You must check the locations checkbox in the filter before accessing location info.");
        } else {
          selectMarker(location.toString().toLowerCase());
        }
      } 
    }
  };


}

ko.applyBindings(new AppViewModel());