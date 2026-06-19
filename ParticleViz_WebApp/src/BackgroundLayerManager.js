import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMap} from "@fortawesome/free-solid-svg-icons";
import Dropdown from "react-bootstrap/Dropdown";
import * as d3 from "d3"

import img_map_dark from "./imgs/dark.jpg";
import img_map_stamen from "./imgs/stamen.jpg";
import img_map_bingaer from "./imgs/bing_aer.jpg";
import img_map_osm from "./imgs/osm.jpg";
import img_map_blank from "./imgs/blank.jpg";
import DropdownToggle from "react-bootstrap/DropdownToggle";
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import XYZ from "ol/source/XYZ";
import StatesLayer from "./StatesLayer";
import _ from "lodash";

const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp

const BACKGROUND_MAPS = {
    empty: 0,
    osm: 1,
    stamen: 2,
    nature: 3,
    dark: 4,
    un: 5
};

const MAP_OPTIONS = [
    { key: BACKGROUND_MAPS.empty, src: img_map_blank, alt: "White" },
    { key: BACKGROUND_MAPS.osm, src: img_map_osm, alt: "OSM" },
    { key: BACKGROUND_MAPS.stamen, src: img_map_stamen, alt: "Stamen" },
    { key: BACKGROUND_MAPS.nature, src: img_map_bingaer, alt: "Nature" },
    { key: BACKGROUND_MAPS.dark, src: img_map_dark, alt: "Dark" },
];


class  BackgroundLayerManager extends React.Component{
    constructor(props){

        let def_background = _.isUndefined(config_webapp['background']) ? BACKGROUND_MAPS.nature : config_webapp['background']
        super(props)
        this.state = {
            bk_layer: this.props.background_layer,
            selected_bk: _.isInteger(def_background) && (1 <= def_background <= 5)? def_background - 1: BACKGROUND_MAPS.nature,
            draw_states: true
        };

        this.updateBackgroundLayer= this.updateBackgroundLayer.bind(this)
    }

    componentDidMount() {
        // Here we set the default background map
        this.updateBackgroundLayer(this.state.selected_bk)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    updateTitlesColors(color){
        d3.select("#dates-title").style("color", color)
        d3.select("#main-title").style("color", color)
        d3.select(".loading-div").style("color", color)
    }

    updateBackgroundLayer(e){
        // console.log("Updating background layer..." + e)
        let bk_layer = this.state.bk_layer;
        let selected_bk = parseInt(e)
        let draw_states = true;
        switch(selected_bk) {
            case BACKGROUND_MAPS.empty:
                this.updateTitlesColors("#212529")
                d3.select("#map").style("background-color", "white")
                bk_layer.setSource()
                draw_states = true
                break;
            case BACKGROUND_MAPS.un:
                d3.select("#dates-title").style("color", "#212529")
                d3.select("#map").style("background-color", "#AAD3DF")
                bk_layer.setSource(
                    new TileWMS({
                        url: 'https://geonode.wfp.org/geoserver/wms',
                        params: {
                            'LAYERS': 'geonode:wld_bnd_admin0_l_unmap_2019',
                            'TILED': true
                        }
                    })
                )
                draw_states = false
                break;
            case BACKGROUND_MAPS.osm:
                this.updateTitlesColors("#212529")
                d3.select("#map").style("background-color", "white")
                bk_layer.setSource(new OSM())
                draw_states = false
                break;
            case BACKGROUND_MAPS.stamen:
                this.updateTitlesColors("#212529")
                d3.select("#map").style("background-color", "#60C5D7")
                bk_layer.setSource(
                    new XYZ({
                        url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
                        attributions: '© Stadia Maps © Stamen Design © OpenStreetMap',
                        maxZoom: 16,
                    })
                )
                draw_states = true
                break;
            case BACKGROUND_MAPS.dark:
                this.updateTitlesColors("#d1d1e0")
                d3.select("#map").style("background-color", "#2e2e2e")
                bk_layer.setSource(
                    new XYZ({
                        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                        attributions: 'Tiles © Esri',
                        maxZoom: 16,
                    })
                )
                draw_states = false
                break;
            case BACKGROUND_MAPS.nature:
                this.updateTitlesColors("#d1d1e0")
                d3.select("#map").style("background-color", "#00101D")
                bk_layer.setSource(
                    new XYZ({
                        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                        attributions: 'Tiles © Esri',
                        maxZoom: 19,
                    })
                )
                draw_states = true
                break;
            default:
                this.updateTitlesColors( "#212529")
                d3.select("#map").style("background-color", "white")
                bk_layer.setSource()
                break;
        }

        this.setState({
            bk_layer: bk_layer,
            selected_bk: selected_bk,
            draw_states: draw_states
        })
    }

    renderMapOption(option) {
        const selected = this.state.selected_bk === option.key;
        return (
            <Dropdown.Item
                key={option.key}
                eventKey={option.key}
                active={selected}
                className="pv-bk-map-item"
                aria-current={selected ? "true" : undefined}
            >
                <img
                    src={option.src}
                    className={`rounded pv-bk-map-thumb${selected ? " pv-bk-map-thumb--selected" : ""}`}
                    width="100px"
                    alt={option.alt}
                />
            </Dropdown.Item>
        );
    }

    render(){
        return (
            <span>
                <OverlayTrigger placement="right" delay={{show: 1, hide: 1}} overlay={(props) => (<Tooltip id="tooltip_switch_bk" {...props}> Switch Background </Tooltip>)}>
                    <Dropdown onSelect={this.updateBackgroundLayer}>
                        <DropdownToggle variant="light" size="sm" className="p-0">
                            <FontAwesomeIcon icon={faMap}/>
                        </DropdownToggle>
                        <Dropdown.Menu className="pv-bk-map-menu">
                            {MAP_OPTIONS.map((option) => this.renderMapOption(option))}
                        </Dropdown.Menu>
                    </Dropdown>
                </OverlayTrigger>
                <StatesLayer map={this.props.map}
                             url={this.props.url}
                             drawstates={this.state.draw_states}/>
            </span>
            )
    }
}

export default BackgroundLayerManager;
