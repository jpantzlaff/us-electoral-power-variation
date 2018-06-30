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

for (var i = 0; i < 5; i++) {
    window['result' + i] = document.getElementById('result' + i);
} 

mapboxgl.accessToken = 'pk.eyJ1IjoicGFudHplciIsImEiOiJjaXNna2wxbm0wMXc2MnludmJxc3QxanE5In0.z4TQn08v14lHWSgDJnWcDQ';

var map = new mapboxgl.Map({
    container: 'map',
    minZoom: 3,
    maxZoom: 11,
    style: 'mapbox://styles/mapbox/streets-v9',
    hash: true,
    attributionControl: false
});

var headerHeight = document.querySelector('header').clientHeight + 25;
var footerHeight = document.querySelector('footer').clientHeight + 15;

map.fitBounds([[-128, 25], [-65, 50]], {
    padding: {
        top: headerHeight,
        bottom: footerHeight,
        left: 0,
        right: 0
    }
});

map.on('load', function() {
    map.addSource('states', {
        'type': 'vector',
        'url': 'mapbox://pantzer.avtg8bc5'
    });
    map.addSource('districts', {
        'type': 'vector',
        'url': 'mapbox://pantzer.btv1xx5n'
    });
    map.addLayer({
        'id': 'electoral',
        'type': 'fill',
        'source': 'states',
        'source-layer': 'states-5es6xp',
        'layout': {
            visibility: 'visible'
        },
        'paint': {
            'fill-opacity': 0.5,
            'fill-color': {
                'property': 'persons_el',
                'stops': [[187875, '#f1a340'], [581499, '#f7f7f7'], [677344, '#998ec3']]
            }
        }
    });
    map.addLayer({
        'id': 'house',
        'type': 'fill',
        'source': 'districts',
        'source-layer': 'districts-7hbquq',
        'layout': {
            visibility: 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': {
                'property': 'population',
                'stops': [[526284, '#f1a340'], [719187, '#f7f7f7'], [989414, '#998ec3']]
            }
        }
    });
    map.addLayer({
        'id': 'house-outline',
        'type': 'line',
        'source': 'districts',
        'source-layer': 'districts-7hbquq',
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
        'source-layer': 'states-5es6xp',
        'layout': {
            visibility: 'none'
        },
        'paint': {
            'fill-opacity': 0.4,
            'fill-color': {
                'property': 'persons_se',
                'stops': [[281813, '#f1a340'], [3128465, '#f7f7f7'], [18626978, '#998ec3']]
            }
        },
        'filter' : ['!=', 'geoid', '11']
    });
});

map.on('click', 'electoral', function(e) {
    if (map.getLayoutProperty('electoral', 'visibility') === 'visible') {
        updateQueryInfo('electoral', e.features[0].properties.name);
    }
});
map.on('click', 'house', function(e) {
    if (map.getLayoutProperty('house', 'visibility') === 'visible') {
        updateQueryInfo('house', e.features[0].properties.abbreviati);
    }
});
map.on('click', 'senate', function(e) {
    if (map.getLayoutProperty('senate', 'visibility') === 'visible') {
        updateQueryInfo('senate', e.features[0].properties.name);
    }
});

function updateLegend(high, mid, low, text) {
    document.getElementById('highVal').innerHTML = high;
    document.getElementById('midVal').innerHTML = mid;
    document.getElementById('lowVal').innerHTML = low;
    document.getElementById('legendTitle').innerHTML = 'Representation strength <small>(persons/' + text + ')</small>';
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
                top: headerHeight,
                bottom: footerHeight,
                left: 0,
                right: 0
            }
        });
        document.getElementById('searchInput').value = '';
        document.getElementById('layerSelect').value = layer;
    }
}

function updateQueryInfo(layer, feature) {
    if (layer === 'electoral') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'name', feature]});
        var props = queried[0].properties;
        var powerDec = 581499 / props.persons_el;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        document.getElementById('title').innerHTML = props.name;
        document.getElementById('narrative').innerHTML = 'Home to ' + props.population.toLocaleString() + ' residents, ' + props.name + ' is able to send ' +  props.electors.toLocaleString() + ' presidential electors to represent it in the Electoral College. This provides it one elector for every ' + props.persons_el.toLocaleString() + ' residents. When compared to the national average of one elector per 581,499 people, a resident of ' + props.name + ' has <b>' + powerPct + ' power</b> to choose the president than the average American.';
        document.getElementById('queryInfo').style.display = 'block';
    } else if (layer === 'house') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'abbreviati', feature]});
        var props = queried[0].properties;
        var powerDec = 719187 / props.population;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        document.getElementById('title').innerHTML = props.abbreviati;
        document.getElementById('narrative').innerHTML = props.state + ' ' + props.name + ' is home to ' + props.population.toLocaleString() + ' residents. When compared to the national average of one representative per 719,187 people, a resident of this district has <b>' + powerPct + ' power</b> to choose a representative than the average American.';
        document.getElementById('queryInfo').style.display = 'block';
    } else if (layer === 'senate') {
        var queried = map.queryRenderedFeatures({filter: ['==', 'name', feature]});
        var props = queried[0].properties;
        var powerDec = 3128465 / props.persons_se;
        if (powerDec >= 1) {
            var powerPct = (Math.round((powerDec - 1) * 100)).toString() + '% more';
        } else {
            var powerPct = (Math.round(Math.abs(powerDec - 1) * 100)).toString() + '% less';
        }
        document.getElementById('title').innerHTML = props.name;
        document.getElementById('narrative').innerHTML = 'Home to ' + props.population.toLocaleString() + ' residents, ' + props.name + ' has one U.S. senator for every ' + props.persons_se.toLocaleString() + ' of its inhabitants. When compared to the national average of one senator per 3,128,465 people, a resident of ' + props.name + ' has <b>' + powerPct + ' power</b> to choose a senator than the average American.';
        document.getElementById('queryInfo').style.display = 'block';
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
                    result0.innerHTML =  '<b>Place</b>: ' + candidate.address;
                    result0.style.display = 'block';
                    result0.onclick = function() {
                        clearResults();
                        map.flyTo({
                            center: [candidate.location.x, candidate.location.y],
                            zoom: 11
                        });
                        document.getElementById('searchInput').value = '';
                    };
                } catch(err) {
                    result0.style.display = 'none';
                    result0.onclick = null;
                }
            } else {
                result0.style.display = 'none';
                result0.onclick = null;
            }
        }
    });
}

function clearResults() {
    for (var i = 0; i < 5; i++) {
        window['result' + i].style.display = 'none';
    }
}

function search(input) {
    clearResults();
    if (input !== '') {
        var inputText = input.substring(0, 31);
        geocode(input);

        var stateResults = statesSearch.search(inputText);
        var countStateResults = stateResults.length;
        if (countStateResults > 0) {
            result1.innerHTML = '<b>State</b>: ' + stateResults[0].n;
            result1.style.display = 'block';
            result1.onclick = function() {
                toggleLayer('electoral', stateResults[0]);
                clearResults();
                document.getElementById('queryInfo').style.display = 'none';
            }
            if (countStateResults > 1) {
                result2.innerHTML = '<b>State</b>: ' + stateResults[1].n;
                result2.style.display = 'block';
                result2.onclick = function() {
                    toggleLayer('electoral', stateResults[1]);
                    clearResults();
                    document.getElementById('queryInfo').style.display = 'none';
                }
            }
        }
        var districtResults = districtsSearch.search(inputText);
        var countDistrictResults = districtResults.length;
        if (countDistrictResults > 0) {
            result3.innerHTML = '<b>District</b>: ' + districtResults[0].a;
            result3.style.display = 'block';
            result3.onclick = function() {
                toggleLayer('house', districtResults[0]);
                clearResults();
                document.getElementById('queryInfo').style.display = 'none';
            }
            if (countDistrictResults > 1) {
                result4.innerHTML = '<b>District</b>: ' + districtResults[1].a;
                result4.style.display = 'block';
                result4.onclick = function() {
                    toggleLayer('house', districtResults[1]);
                    clearResults();
                    document.getElementById('queryInfo').style.display = 'none';
                }
            }
        }
    }
}