import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import './css/App.css';
import ParticleVizManager from './ParticleVizManager';
import * as serviceWorker from './serviceWorker';

import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import "bootstrap/dist/css/bootstrap.min.css"
import OSM from "ol/source/OSM";

// /FORMAT=image/png&HEIGHT=256&WIDTH=256&BBOX=-180.000005437,-89.900001526,180.0,83.627418516
let background_layer = new TileLayer({ source: new OSM() });

// let ip_address = 'http://146.201.212.214'
let ip_address = 'http://ozavala.coaps.fsu.edu/'
const tot_res = 9;
let resolutions = Array(tot_res);
for(let i=0; i < tot_res; i++){
    resolutions[i] = .36/(2**i);
}
// console.log("Resolutions: ", resolutions);


let map_view = new View({
        projection: 'EPSG:4326', //Equirectangular
        center: [0, 0],
        extent: [-180, -190, 180, 190],
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
let map = new Map({
    layers: [
        background_layer
    ],
    target: 'map',
    view: map_view
})


// console.log(map.getView().getResolution())

ReactDOM.render(<ParticleVizManager map={map} background_layer={background_layer} url={ip_address}/>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
