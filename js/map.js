var map;
var markers = [];
var currentMarker;
var currentInfowindow;

// Style for markers
var defaultIcon;
var highlightedIcon;

// TODO: USE LAYERS for database
var locations = [
  {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
  {title: 'University of Washington', location: {lat: 47.6553, lng: -122.3035}},
  {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
  {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}},
  {title: 'Puget Sound', location: {lat: 47.7237, lng: -122.4713}},
  {title: 'Experience Music Project Museum', location: {lat: 47.6215, lng: -122.3481}}
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

    // Clear the infowindow to give streetview time to load.
    infowindow.setContent('');
    infowindow.marker = marker;

    // Make sure content is cleared when infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });

    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    
    // Using API get closest streetview image within 50 meters
    currentMarker = marker;
    currentInfowindow = infowindow;
    //streetViewService.getPanoramaByLocation(currentMarker.position, radius, getStreetView);
    currentInfowindow.setContent('<div>' + currentMarker.title + '</div><div id="pano"></div>');

    // Open infowindow on correct marker.
    currentInfowindow.open(map, currentMarker);
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