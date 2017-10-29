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

function insertPhotoCallback(result) {
  if (result.meta.code != 200) {
    console.log("Failed to complete getting photos. ERROR: " + result.meta.code);
  } else {
    // Checks if there are photos.
    console.log("getting photos")
    if (result.response.photos.count >= 1) {
      var elem = document.createElement("img");
      elem.src = result.response.photos.items[0].prefix + 'height200' +
                 result.response.photos.items[0].suffix;
      document.getElementById("photogallery").appendChild(elem);
      console.log("added photos");
    }
    console.log("finished adding photos");
    // TODO: No photo photo input
  }
  console.log("finished callback");
}
// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
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
    var displayHTML = '</div><div id="photogallery"></div>';

    currentInfowindow.setContent(innerHTML + displayHTML);

    var photoURL = 'https://api.foursquare.com/v2/venues/' +
                   result.response.venues[0].id +
                   '/photos';
    var data = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      v: version
    }

    var jsonHandler = $.getJSON(photoURL, data, function(dataRes) {
      insertPhotoCallback(dataRes);
    })
      .fail(function() {
        console.log( "Error attempting photo AJAX call to Foursquare." );
      });


    infowindow.open(map, currentMarker);
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

  map.setCenter(marker.position);
  var jqxhr = $.getJSON(foursquareAPI, data, function(result) {
    searchPlaceCallback(result, marker, infowindow);
  })
    .fail(function() {
      console.log( "Error attempting AJAX call to Foursquare." );
    });
}

// TODO: USE LAYERS for database
var locations = [
  {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
  {title: 'Smith Tower', location: {lat: 47.6034317, lng: -122.3317931}},
  {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
  {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}},
  {title: 'Seattle Aquarium', location: {lat: 47.6076966, lng: -122.3431277}}
];

// Create marker colors
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
  }
}

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
    zoom: 10,
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
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

function AppViewModel() {
  var self = this;

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
  };
}

ko.applyBindings(new AppViewModel());