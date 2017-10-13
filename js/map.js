var map;
var markers = [];

// Initialize the map
function initMap() {
  // Constructor to create new JS object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.6062, lng: -122.3321},
    zoom: 13
  });

 // TODO: USE LAYERS for database
  var locations = [
    {title: 'Space Needle', location: {lat:47.6205, lng: -122.3493}},
    {title: 'University of Washington', location: {lat: 47.6553, lng: -122.3035}},
    {title: 'Pike Place Market', location: {lat: 47.6101, lng: -122.3421}},
    {title: 'Pochi Lifestyle', location: {lat: 47.8502, lng: -122.2503}},
    {title: 'Gas Works', location: {lat: 47.6456, lng: -122.3344}}
  ];

  var bounds = new google.maps.LatLngBounds();
  var largeInfowindow = new google.maps.InfoWindow();

  // Use locations array to create array of markers.
  for (var i = 0; i< locations.length; i++) {
    // Get position of location
    var position = locations[i].location;
    var title = locations[i].title;

    // Create a marker for each location
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });

    // Add marker to the markers array.
    markers.push(marker);

    // Extend boundary for every marker.
    bounds.extend(markers[i].position);

    // Create onclick even for each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
  }

  map.fitBounds(bounds);
}

function populateInfowWindow(marker, infowindow) {
  // Check if infowindow is already open.
  if (infowindow.marker != marker) {
    infowindow.marker = marker;
    infowindow.setContent('<div>' + marker.title + '</div>');
    infowindow.open(map, marker);

    // Make sure content is cleared when infowindow is closed.
    infowindow.addListener('closeclick', function() {
      infowindow.setMarker(null);
    });
  }
}
