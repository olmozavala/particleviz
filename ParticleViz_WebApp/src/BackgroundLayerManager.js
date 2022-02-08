import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMap} from "@fortawesome/free-solid-svg-icons";
import Stamen from "ol/source/Stamen";
import Dropdown from "react-bootstrap/Dropdown";
import * as d3 from "d3"

import img_map_dark from "./imgs/dark.jpg";
import img_map_stamen from "./imgs/stamen.jpg";
import img_map_bingaer from "./imgs/bing_aer.jpg";
import img_map_osm from "./imgs/osm.jpg";
// import img_map_un from "./imgs/un.jpg";
import img_map_blank from "./imgs/blank.jpg";
//https://geonode.wfp.org/layers/geonode%3Awld_bnd_admin0_l_unmap_2019
import DropdownToggle from "react-bootstrap/DropdownToggle";
import DropdownItem from "react-bootstrap/DropdownItem";
import DropdownMenu from "react-bootstrap/DropdownMenu";
import BingMaps from "ol/source/BingMaps";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import StatesLayer from "./StatesLayer";

const BACKGROUND_MAPS = {
    dark: 0,
    stamen: 1,
    nature: 2,
    osm: 3,
    un: 4,
    empty: 5
};

class  BackgroundLayerManager extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            bk_layer: this.props.background_layer,
            selected_bk: BACKGROUND_MAPS.nature,
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
        // console.log("Updating background layer...")
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
                    new Stamen({
                        layer: 'watercolor'
                    })
                )
                draw_states = true
                break;
            case BACKGROUND_MAPS.dark:
                this.updateTitlesColors("#d1d1e0")
                d3.select("#map").style("background-color", "black")
                bk_layer.setSource(
                    new BingMaps({
                        key: 'AsEfPuLqG-YV7GULoIjqTCW89vNTo4vktzl5Ca4FFRIc7bU4fhc--YTL6-g-Lp9N',
                        imagerySet: 'CanvasDark'
                    })
                )
                draw_states = false
                break;
            case BACKGROUND_MAPS.nature:
                this.updateTitlesColors("#d1d1e0")
                d3.select("#map").style("background-color", "#00101D")
                bk_layer.setSource(
                    new BingMaps({
                        key: 'AsEfPuLqG-YV7GULoIjqTCW89vNTo4vktzl5Ca4FFRIc7bU4fhc--YTL6-g-Lp9N',
                        imagerySet: 'Aerial'
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

    render(){
        return (
            <span>
                <Dropdown className="d-inline" title="Switch background">
                    <DropdownToggle variant="light">
                        <FontAwesomeIcon icon={faMap}/>
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.empty} >
                            <img src={img_map_blank} className="rounded" width="100px" alt="White"/>
                        </DropdownItem>
                        {/*<DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.un} >*/}
                        {/*    <img src={img_map_un} className="rounded" width="100px"  alt="UN"/>*/}
                        {/*</DropdownItem>*/}
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.osm} >
                            <img src={img_map_osm} className="rounded" width="100px" alt="OSM"/>
                        </DropdownItem>
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.stamen} >
                            <img src={img_map_stamen} className="rounded" width="100px" alt="Stamen"/>
                        </DropdownItem>
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.nature} >
                            <img src={img_map_bingaer} className="rounded" width="100px" alt="Nature"/>
                        </DropdownItem>
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.dark} >
                            <img src={img_map_dark} className="rounded" width="100px" alt="Dark"/>
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                <StatesLayer map={this.props.map}
                             url={this.props.url}
                             drawstates={this.state.draw_states}/>
            </span>
            )
    }
}

export default BackgroundLayerManager;
