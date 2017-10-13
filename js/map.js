var map;

// Initialize the map
function initMap() {
  // Constructor to create new JS object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.6062, lng: -122.3321},
    zoom: 13
  });

  var spaceNeedle = { lat: 47.6205, lng: -122.3493};
  var marker = new google.maps.Marker({
    position: spaceNeedle,
    map: map,
    title: 'First Marker!'
  });
 }