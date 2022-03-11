import React from 'react';
import ReactDOM from 'react-dom';
import './css/index.css';
import './css/chardinjs.css'
import ParticleVizManager from './ParticleVizManager';
import * as serviceWorker from './serviceWorker';
import Card from "react-bootstrap/Card"
import intro_image from "./imgs/pviz_logo_md.png"

import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import './css/App.css';
import "bootstrap/dist/css/bootstrap.min.css"
import OSM from "ol/source/OSM";
import {House, Check} from "react-bootstrap-icons";
import {Spinner} from "react-bootstrap";
import {chardinJs} from "./chardinjsoz";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import CircleStyle from "ol/style/Circle";
import {GeoJSON} from "ol/format";
import {Stroke, Style} from "ol/style";

const config_pviz = require("./Config.json")

const config_webapp = config_pviz.webapp

const ip_address = window.location.href
const resolutions = config_webapp["zoom-levels"]
const extra_layers = config_webapp["extra_layers"]

// /FORMAT=image/png&HEIGHT=256&WIDTH=256&BBOX=-180.000005437,-89.900001526,180.0,83.627418516
let background_layer = new TileLayer({ source: new OSM() });

let map_view = new View({
        projection: 'EPSG:4326', //Equirectangular
        center: config_webapp["map-center"],
        extent: config_webapp["map-extent"],
        resolutions: resolutions,
        zoom: config_webapp["def-zoom"],
        moveTolerance: 400,
        // maxZoom: 8,
        // minZoom: 2
        // ---------- OR ----------------
        // projection: 'EPSG:3857', // Mercator
        // zoom: 4,
        // maxZoom: 8,
        // minZoom: 2
    })


let ol_controls = []

// let color= "rgb(134,229,56)"
let map = new Map({
    layers: [background_layer],
    target: 'map',
    view: map_view,
    controls: ol_controls
})

if (typeof extra_layers !== 'undefined'){
    // console.log(ip_address+"/"+extra_layers[0].file)

    for (const [, value] of Object.entries(extra_layers)) {
        console.log("Adding layer: ", value.name)
        let color = value.color
        let extra_layer = new VectorLayer({
            source: new VectorSource({
                url: `${ip_address}/data/${value.file}`,
                format: new GeoJSON(),
                overlaps: false
            }),
            style: function (feature) {
                return new Style({
                    image: new CircleStyle({
                        radius: 5,
                        fill: new Stroke({color: color, width: 1}),
                        stroke: new Stroke({color: color, width: 1}),
                    })
                })
            }
        })
        map.addLayer(extra_layer)
    }
}

var intro_chardin = new chardinJs("body")

/**
 * This function generates the div of the intro section
 * @returns {JSX.Element}
 * @constructor
 */
function PageSummary(){
    return (
        <div className="row p-0 m-0">
            <div className="col-xs-6 col-sm-4 col-md-3 col-lg-3  offset-sm-4 offset-md-4 offset-lg-4">
                <div id="intro_text" className=" mt-3" >
                    <Card style={{ width: '100%' }}>
                        {config_webapp['intro_image'] === ""?
                            <Card.Img variant="top" src={intro_image}/>
                            :

                            <Card.Img variant="top" src={ip_address+"/data/"+config_webapp['intro_image']}/>
                        }
                        <Card.Body>
                            <Card.Title>{config_webapp['title']}</Card.Title>
                            <Card.Text  style={{ textAlign: 'justify' }} className="">
                                {config_webapp['intro']}
                                Click
                                <button title="Continue" className="m-1 btn btn-info btn-sm" onClick={() =>  {
                                    intro_chardin.stop()}
                                }>
                                    <Check/>
                                </button>
                                to continue and please wait for the site to load.
                                For more information go to
                                <a title="Home" className="btn ml-2 btn-info btn-sm"
                                   href={config_webapp['url']}>
                                    <House/>
                                </a>.
                            </Card.Text>
                            <div className="h5 col-12 text-center loading-div" >
                                <Spinner animation="border" variant="info"/>
                                {" "} Loading ... <span className="loading_perc"> </span>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>)
}

ReactDOM.render(<span>
                    <ParticleVizManager map={map} background_layer={background_layer} url={ip_address} chardin={intro_chardin}/>
                    <div className="container-fluid pv-title">
                        <div className="row p-0 m-0">
                            <div className="col-12 text-center">
                               <div id="main-title" className="display-4 mt-3"> {config_webapp['title']} </div>

                            </div>
                        </div>
                        <div className="row p-0 m-0">
                            <div className="col-12 text-center">
                               <div id="dates-title" className="h4 mt-3"></div>
                            </div>
                        </div>
                        <div className="row p-0 m-0">
                            <div className="h5 col-12 text-center loading-div" >
                               <Spinner animation="border" variant="info"/>
                                {" "} Loading ... <span className="loading_perc"> </span>
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
