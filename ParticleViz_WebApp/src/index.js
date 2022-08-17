import React from 'react';
import { createRoot } from 'react-dom/client';
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
import {Stroke, Style, Fill, Text} from "ol/style";
import _ from "underscore"

const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp
const ip_address = window.location.href
const resolutions = config_webapp["zoom-levels"]
const extra_layers = config_webapp["extra_layers"]

// create layers for the app
let background_layer = new TileLayer({ source: new OSM() });

let map_view = new View({
        projection: 'EPSG:4326', //Equirectangular
        center: config_webapp["map-center"],
        extent: config_webapp["map-extent"],
        resolutions: resolutions,
        zoom: config_webapp["def-zoom"],
        moveTolerance: 400,
        multiWorld: true,
        // maxZoom: 8,
        // minZoom: 2
        // ---------- OR ----------------
        // projection: 'EPSG:3857', // Mercator
        // zoom: 4,
        // maxZoom: 8,
        // minZoom: 2
    })

const ol_controls = []  // remove zoom and pan buttons
let map = new Map({
    layers: [background_layer],
    target: 'map',
    view: map_view,
    controls: ol_controls
})

if (typeof extra_layers !== 'undefined'){
    // TODO move this part to another component that is called by particlelayer
    // we need to have access to the color_scheme if we want to turn on/off layers
    // console.log(ip_address+"/"+extra_layers[0].file)
    for (const [, extra_layer_obj] of Object.entries(extra_layers)) {
        console.log("Adding extra vector layer: ", extra_layer_obj)
        let color = extra_layer_obj.color
        let extra_layer = new VectorLayer({
            source: new VectorSource({
                url: `${ip_address}/data/${extra_layer_obj.file}`,
                format: new GeoJSON(),
                overlaps: false
            }),
            // TODO it is only displaying Circles
            style: function(feature){
                let geometry = feature.getGeometry()
                const type = geometry.getType()
                let style
                let circleRadius = 5

                if (type === 'Point') {
                    style = new Style({
                        image: new CircleStyle({
                            radius: circleRadius,
                            fill: new Fill({ color: "red"}),
                        }),
                    })
                } else if (type === 'line') {
                    style = new Style({
                        stroke: new Stroke({
                            color: color,
                            width: 3,
                        }),
                    })
                }
                if(!_.isUndefined(extra_layer_obj.text)){
                    //https://openlayers.org/en/latest/apidoc/module-ol_style_Text-Text.html
                    style.setText(new Text({
                        font: 'bold 16px sans-serif',
                        text: feature.get(extra_layer_obj.text),
                        textAlign: "start",
                        // textBaseline: "hanging",
                        fill: new Fill({ color: "black"}),
                        // stroke: new Stroke({ color: "white"}),
                        offsetX: circleRadius*2,
                        // fill: new Fill({ color: "#2f363e"}),
                        // padding: [0,0,0,1000],
                        // backgroundFill: new Fill({ color: "lightgrey"}),
                    }))
                }
                return style
            }
        })
        map.addLayer(extra_layer)
    }
    map.on('click', function(evt){
        const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
            return feature;
        })
        console.log(feature)
    })
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
            <div className="col-xs-6 col-sm-4 col-md-3 col-lg-3 offset-sm-4 offset-md-4 offset-lg-4">
                <div id="intro_text">
                    <Card style={{ width: '50%' }}>
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
                                <button title="Continue" className="btn btn-info btn-sm m-1" onClick={() =>  {
                                    intro_chardin.stop()}
                                }>
                                    <Check/>
                                </button>
                                to continue and please wait for the site to load. For more information go to
                                <a title="Home" className="btn btn-info btn-sm ms-1" href={config_webapp['url']}>
                                    <House/>
                                </a>.
                            </Card.Text>
                            <div className="col-12 text-center loading-div" >
                                <Spinner animation="border" variant="info"/>
                                {" "} Loading ... <span className="loading_perc"> </span>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    )
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <span>
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
    </span>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
