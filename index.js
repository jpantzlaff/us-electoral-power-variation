var statesSearch = new Fuse(statesList, {
    shouldSort: true,
    threshold: 0.1,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['n', 'a']
});

var districtsSearch = new Fuse(districtsList, {
    shouldSort: true,
    tokenize: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['a', 's', 'n']
});

function headerHeight(padding=0) {
    return document.querySelector('header').clientHeight + padding;
}
function footerHeight(padding=0) {
    return document.querySelector('footer').clientHeight + padding;
}

function updateLegend(high, mid, low, text) {
    $('#highVal').html(high);
    $('#midVal').html(mid);
    $('#lowVal').html(low);
    $('legendTitle').html('Representation strength <small>(persons/' + text + ')</small>');
}

function toggleLayer(layer, feature) {
    if (layer === 'electoral') {
        map.setLayoutProperty('house', 'visibility', 'none');
        map.setLayoutProperty('house-outline', 'visibility', 'none');
        map.setLayoutProperty('senate', 'visibility', 'none');
        map.setLayoutProperty('electoral', 'visibility', 'visible');
        updateLegend('677k', '581k', '188k', 'elector');
    } else if (layer === 'house') {
        map.setLayoutProperty('electoral', 'visibility', 'none');
        map.setLayoutProperty('senate', 'visibility', 'none');
        map.setLayoutProperty('house-outline', 'visibility', 'visible');
        map.setLayoutProperty('house', 'visibility', 'visible');
        updateLegend('989k', '719k', '526k', 'representative');
    } else if (layer === 'senate') {
        map.setLayoutProperty('electoral', 'visibility', 'none');
        map.setLayoutProperty('house', 'visibility', 'none');
        map.setLayoutProperty('house-outline', 'visibility', 'none');
        map.setLayoutProperty('senate', 'visibility', 'visible');
        updateLegend('18.6M', '3.1M', '282k', 'senator');
    }
    if (feature) {
        map.fitBounds(JSON.parse(feature.b), {
            padding: {
                top: headerHeight(25),
                bottom: footerHeight(20),
                left: 0,
                right: 0
            }
        });
        $('#searchInput').val('');
        $('#layerSelect').val(layer);
    }
}

function updateQueryInfo(layer, feature) {
    if (layer === 'electoral') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'name', feature]});
        var props = queried[0].properties;
        var powerDec = 581499 / props.persons_elector;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        $('#title').html(props.name);
        $('#narrative').html('Home to ' + props.population.toLocaleString() + ' residents, ' + props.name + ' is able to send ' +  props.electors.toLocaleString() + ' presidential electors to represent it in the Electoral College. This provides it one elector for every ' + props.persons_elector.toLocaleString() + ' residents. When compared to the national average of one elector per 581,499 people, a resident of ' + props.name + ' has <b>' + powerPct + ' power</b> to choose the president than the average American.');
        $('#queryInfo').css('display', 'block');
    } else if (layer === 'house') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'abbreviation', feature]});
        var props = queried[0].properties;
        var powerDec = 719187 / props.population;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        $('#title').html(props.abbreviation);
        $('#narrative').html(props.state + ' ' + props.name + ' is home to ' + props.population.toLocaleString() + ' residents. When compared to the national average of one representative per 719,187 people, a resident of this district has <b>' + powerPct + ' power</b> to choose a representative than the average American.');
        $('#queryInfo').css('display', 'block');
    } else if (layer === 'senate') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'name', feature]});
        var props = queried[0].properties;
        var powerDec = 3128465 / props.persons_sen;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        $('#title').html(props.name);
        $('#narrative').html('Home to ' + props.population.toLocaleString() + ' residents, ' + props.name + ' has one U.S. senator for every ' + props.persons_sen.toLocaleString() + ' of its inhabitants. When compared to the national average of one senator per 3,128,465 people, a resident of ' + props.name + ' has <b>' + powerPct + ' power</b> to choose a senator than the average American.');
        $('#queryInfo').css('display', 'block');
    }
}

function geocode(input) {
    $.get({
        url: 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=1&sourceCountry=USA&langCode=en&category=City&singleLine=' + input,
        dataType: 'json',
        success: function(data) {
            if (!map.isMoving() && data.candidates) {
                var candidate = data.candidates[0];
                try {
                    $('#result0')
                      .html('<b>Place</b>: ' + candidate.address)
                      .css('display', 'block')
                      .on('click', function() {
                          clearResults();
                          map.flyTo({
                              center: [candidate.location.x, candidate.location.y],
                              zoom: 11
                          });
                          $('#searchInput').val('');
                      });
                } catch(err) {
                    $('#result0')
                      .css('display', 'none')
                      .off('click');
                }
            } else {
                $('#result0')
                  .css('display', 'none')
                  .off('click');
            }
        }
    });
}

function clearResults() {
    $('.result').css('display', 'none');
}

function search(input) {
    clearResults();
    if (input !== '') {
        var inputText = input.substring(0, 31);
        geocode(input);

        var stateResults = statesSearch.search(inputText);
        var countStateResults = stateResults.length;
        if (countStateResults > 0) {
            $('#result1')
              .html('<b>State</b>: ' + stateResults[0].n)
              .css('display', 'block')
              .on('click', function() {
                  $('#queryInfo').css('display', 'none');
                  toggleLayer('electoral', stateResults[0]);
                  clearResults();
              });
            if (countStateResults > 1) {
                $('#result2')
                  .html('<b>State</b>: ' + stateResults[1].n)
                  .css('display', 'block')
                  .on('click', function() {
                      $('#queryInfo').css('display', 'none');
                      toggleLayer('electoral', stateResults[1]);
                      clearResults();
                  });
            }
        }
        var districtResults = districtsSearch.search(inputText);
        var countDistrictResults = districtResults.length;
        if (countDistrictResults > 0) {
            $('#result3')
              .html('<b>District</b>: ' + districtResults[0].a)
              .css('display', 'block')
              .on('click', function() {
                  $('#queryInfo').css('display', 'none');
                  toggleLayer('house', districtResults[0]);
                  clearResults();
              });
            if (countDistrictResults > 1) {
                $('#result4')
                  .html('<b>District</b>: ' + districtResults[1].a)
                  .css('display', 'block')
                  .on('click', function() {
                      $('#queryInfo').css('display', 'none');
                      toggleLayer('house', districtResults[1]);
                      clearResults();
                  });
            }
        }
    }
}

mapboxgl.accessToken = 'pk.eyJ1IjoicGFudHplciIsImEiOiJjaXNna2wxbm0wMXc2MnludmJxc3QxanE5In0.z4TQn08v14lHWSgDJnWcDQ';

var map = new mapboxgl.Map({
    container: 'map',
    minZoom: 1.5,
    maxZoom: 11,
    style: 'mapbox://styles/mapbox/streets-v9',
    hash: true,
    attributionControl: false
});

map.fitBounds([[-128, 25], [-65, 50]], {
    padding: {
        top: headerHeight(25),
        bottom: footerHeight(15),
        left: 0,
        right: 0
    }
});

map.on('load', function() {
    $.get({
        url: 'features.topojson',
        dataType: 'json',
        success: function(d) {
            statesData = topojson.feature(d, d.objects.states);
            districtsData = topojson.feature(d, d.objects.districts);
            map.addSource('states', {
                'type': 'geojson',
                'data': statesData
            });
            map.addSource('districts', {
                'type': 'geojson',
                'data': districtsData
            });
            map.addLayer({
                'id': 'electoral',
                'type': 'fill',
                'source': 'states',
                'layout': {
                    visibility: 'visible'
                },
                'paint': {
                    'fill-opacity': 0.55,
                    'fill-color': {
                        'property': 'persons_elector',
                        'stops': [[187875, '#f1a340'], [581499, '#ebdddd'], [677344, '#998ec3']]
                    }
                }
            });
            map.addLayer({
                'id': 'house',
                'type': 'fill',
                'source': 'districts',
                'layout': {
                    visibility: 'none'
                },
                'paint': {
                    'fill-opacity': 0.47,
                    'fill-color': {
                        'property': 'population',
                        'stops': [[526284, '#f1a340'], [719187, '#ebdddd'], [989414, '#998ec3']]
                    }
                }
            });
            map.addLayer({
                'id': 'house-outline',
                'type': 'line',
                'source': 'districts',
                'layout': {
                    visibility: 'none'
                },
                'paint': {
                    'line-opacity': {'stops': [[4, 0.15], [11, 0.5]]},
                    'line-color': '#444444',
                    'line-width': {'stops': [[4, 0.3], [11, 1]]}
                }
            });
            map.addLayer({
                'id': 'senate',
                'type': 'fill',
                'source': 'states',
                'layout': {
                    visibility: 'none'
                },
                'paint': {
                    'fill-opacity': 0.47,
                    'fill-color': {
                        'property': 'persons_sen',
                        'stops': [[281813, '#f1a340'], [3128465, '#ebdddd'], [18626978, '#998ec3']]
                    }
                },
                'filter' : ['!=', 'geoid', '11']
            });
        }
    });
    ['electoral', 'house', 'senate'].forEach(function(layer) {
        map.on('click', layer, function(e) {
            if (map.getLayoutProperty(layer, 'visibility') === 'visible') {
                updateQueryInfo(layer, (layer === 'house' ? e.features[0].properties.abbreviation : e.features[0].properties.name));
            }
        });
        map.on('mouseenter', layer, function() {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'electoral', function() {
            map.getCanvas().style.cursor = '';
        });
    });
});
