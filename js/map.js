var map;
var markers = [];

// Ensures that only 1 polygon is enabled at a time.
var polygon = null;

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

 // TODO: USE LAYERS for database
  var locations = [
    {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
    {title: 'University of Washington', location: {lat: 47.6553, lng: -122.3035}},
    {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
    {title: 'Pochi Lifestyle', location: {lat: 47.8502, lng: -122.2503}},
    {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}}
  ];

  var largeInfowindow = new google.maps.InfoWindow();

  // Initialize the drawing manager
  var drawingManager = new google.maps.drawing.DrawingManager({
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

  document.getElementById('show').addEventListener('click', showLoc);
  document.getElementById('hide').addEventListener('click', hideLoc);

  document.getElementById('toggle-drawing').addEventListener('click', function() {
    toggleDrawing(drawingManager);
  });

  drawingManager.addListener('overlaycomplete', function(event) {
    // Check if a polygon exists
    if (polygon) {
      polygon.setMap(null);
      hideLoc();
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

function showLoc() {
  var bounds = new google.maps.LatLngBounds();

  // Extend boundaries and displays each marker.
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

function hideLoc() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

function toggleDrawing(drawingManager) {
  if (drawingManager.map) {
    drawingManager.setMap(null);
    // If user drew something, undo the drawing.
    if (polygon) {
      polygon.setMap(null);
    }
  } else {
    drawingManager.setMap(map);
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
