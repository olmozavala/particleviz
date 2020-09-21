import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import ParticleVizManager from './ParticleVizManager';
import * as serviceWorker from './serviceWorker';
import Card from "react-bootstrap/Card"
import Button from "react-bootstrap/Button"
import introjpg from "./imgs/ocean-litter.jpg"

import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import './css/App.css';
import "bootstrap/dist/css/bootstrap.min.css"
import OSM from "ol/source/OSM";
import {House} from "react-bootstrap-icons";
import {Spinner} from "react-bootstrap";
import $ from "jquery";

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

function PageSummary(){
    return (
        <div className="row p-0 m-0">
            <div className="col-sm-4 col-md-3 offset-sm-4 offset-md-4">
                <div id="intro_text" className=" mt-3" >
                    <Card style={{ width: '100%' }}>
                        <Card.Img variant="top" src={introjpg} />
                        <Card.Body>
                            <Card.Title>World's Ocean Litter</Card.Title>
                            <Card.Text>
                                This site provides a dynamic display of litter trajectories in the ocean,
                                and statistics of the litter generated and received from each country.
                                For more information on the model built to simulate these trajectories go to
                                <a title="Home" className="btn ml-2 btn-info btn-sm"
                                   href="https://www.coaps.fsu.edu/our-expertise/global-model-for-marine-litter">
                                    <House/>
                                </a>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>)
}

ReactDOM.render(<span>
                    <ParticleVizManager map={map} background_layer={background_layer} url={ip_address}/>
                    <div className="container-fluid wl-title">
                        <div className="row p-0 m-0">
                            <div className="col-12 text-center">
                               <div id="main-title" className="display-4 mt-3"> World's Ocean Litter </div>
                            </div>
                        </div>
                        <div className="row p-0 m-0">
                            <div className="col-12 text-center">
                               <div id="dates-title" className="h4 mt-3"></div>
                            </div>
                        </div>
                        <div className="row p-0 m-0">
                            <div id="loading-div" className="h5 col-12 text-center">
                               <Spinner animation="border" variant="info"/> Loading ...
                           </div>
                        </div>
                    </div>
                    <PageSummary/>
                </span>,
    document.getElementById('root'));


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
