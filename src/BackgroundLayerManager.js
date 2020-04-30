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
import img_map_un from "./imgs/un.jpg";
//https://geonode.wfp.org/layers/geonode%3Awld_bnd_admin0_l_unmap_2019
import DropdownToggle from "react-bootstrap/DropdownToggle";
import DropdownItem from "react-bootstrap/DropdownItem";
import DropdownMenu from "react-bootstrap/DropdownMenu";
import BingMaps from "ol/source/BingMaps";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";

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
        super(props);
        console.log(`Constructor: Background layers`);
        this.state = {
            bk_layer: this.props.background_layer
        };

        this.updateBackgroundLayer= this.updateBackgroundLayer.bind(this);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    updateBackgroundLayer(e){
        console.log("Updating background layer...");
        let bk_layer = this.state.bk_layer;
        switch(parseInt(e)) {
            case BACKGROUND_MAPS.empty:
                d3.select("#title").style("color", "#212529");
                d3.select("#map").style("background-color", "white");
                bk_layer.setSource();
                break;
            case BACKGROUND_MAPS.un:
                d3.select("#title").style("color", "#212529");
                d3.select("#map").style("background-color", "white");
                bk_layer.setSource(
                    new TileWMS({
                        url: 'https://geonode.wfp.org/geoserver/wms',
                        params: {
                            'LAYERS': 'geonode:wld_bnd_admin0_l_unmap_2019',
                            'TILED': true
                        }
                    })
                );
                break;
            case BACKGROUND_MAPS.osm:
                d3.select("#title").style("color", "#212529");
                d3.select("#map").style("background-color", "white");
                bk_layer.setSource(new OSM());
                break;
            case BACKGROUND_MAPS.stamen:
                d3.select("#title").style("color", "#212529");
                d3.select("#map").style("background-color", "#60C5D7");
                bk_layer.setSource(
                    new Stamen({
                        layer: 'watercolor'
                    })
                );
                break;
            case BACKGROUND_MAPS.dark:
                d3.select("#title").style("color", "#d1d1e0");
                d3.select("#map").style("background-color", "black");
                bk_layer.setSource(
                    new BingMaps({
                        key: 'AsEfPuLqG-YV7GULoIjqTCW89vNTo4vktzl5Ca4FFRIc7bU4fhc--YTL6-g-Lp9N',
                        imagerySet: 'CanvasDark'
                    })
                );
                break;
            case BACKGROUND_MAPS.nature:
                d3.select("#title").style("color", "#d1e0e0");
                d3.select("#map").style("background-color", "#00101D");
                bk_layer.setSource(
                    new BingMaps({
                        key: 'AsEfPuLqG-YV7GULoIjqTCW89vNTo4vktzl5Ca4FFRIc7bU4fhc--YTL6-g-Lp9N',
                        imagerySet: 'Aerial'
                    })
                );
                break;
            default:
                d3.select("#title").style("color", "#212529");
                d3.select("#map").style("background-color", "white");
                bk_layer.setSource();
                break;
        }

        this.setState({
            bk_layer: bk_layer
        });
    }

    render(){
        return (
            <span className="navbar-brand ml-2">
                <Dropdown>
                    <DropdownToggle variant="light">
                        <FontAwesomeIcon icon={faMap} size="lg"/>
                    </DropdownToggle>
                    <DropdownMenu >
                        <DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.empty} >
                            <img src={img_map_un} className="rounded" width="100px" alt="White"/>
                        </DropdownItem>
                        {/*<DropdownItem onSelect={this.updateBackgroundLayer} eventKey={BACKGROUND_MAPS.un} >*/}
                        {/*    <img src={img_map_un} className="rounded" width="100px"></img>*/}
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
            </span>
            );
    }
}



export default BackgroundLayerManager;
