import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import ParticleVizManager from './ParticleVizManager';
import * as serviceWorker from './serviceWorker';

import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import "bootstrap/dist/css/bootstrap.min.css"
import TileWMS from "ol/source/TileWMS";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {Style} from "ol/style";
import GeoJSON from "ol/format/GeoJSON";

// /FORMAT=image/png&HEIGHT=256&WIDTH=256&BBOX=-180.000005437,-89.900001526,180.0,83.627418516
let background_layer = new TileLayer({
    source: new TileWMS({
        url:'https://geonode.wfp.org/geoserver/wms',
        params: {
            'LAYERS':'geonode:wld_bnd_admin0_l_unmap_2019',
            'TILED':true
        }
    })
});

let states_layer = new VectorLayer({
    source: new VectorSource({
        // url: "http://ozavala.coaps.fsu.edu/data/countries.json",
        url: "http://localhost/data/countries.json",
        format: new GeoJSON()
    }),
    //The style is defined on 'StatesLayer.js'
    style: function (feature) {
        return new Style({});
    }
});

const tot_res = 9;
let resolutions = Array(tot_res);
for(let i=0; i < tot_res; i++){
    resolutions[i] = .3/(2**i);
}
console.log("Resolutions: ", resolutions);

let map = new Map({
    layers: [
        background_layer, states_layer
    ],
    target: 'map',
    view: new View({
        projection: 'EPSG:4326', //Equirectangular
        center: [0, 0],
        extent: [-180, -90, 180, 90],
        resolutions: resolutions,
        zoom: 1,
        moveTolerance: 400,
        // maxZoom: 8,
        // minZoom: 2
        // ---------- OR ----------------
        // projection: 'EPSG:3857', // Mercator
        // zoom: 4,
        // maxZoom: 8,
        // minZoom: 2
    })
});

console.log(map.getView().getResolution())

ReactDOM.render(<ParticleVizManager map={map} background_layer={background_layer}/>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
