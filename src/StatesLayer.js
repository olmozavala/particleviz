import React from 'react';
import ReactDOM from 'react-dom';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {GeoJSON} from "ol/format";
import {Fill, Stroke, Style, Text} from "ol/style";
import MakePlot from "./MakePlot";
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './css/App.css';
import _ from "underscore";
import * as d3 from "d3";
import { isMobile } from "react-device-detect";

require('ol/ol.css');

let selected_color = `rgba(255,0,0,1)`;

class  StatesLayer extends React.Component{
    constructor(props){
        super(props);
        let states_layer = new VectorLayer({
            source: new VectorSource({
                // url: `${this.props.url}/countries.json`,
                // format: new GeoJSON( {layers:['countries'] }),
                url: `${this.props.url}/countries.geojson`,
                format: new GeoJSON(),
                overlaps: false
            }),
            style: this.setCountriesStyle.bind(this)
        });
        // Reading Reached data
        let url_data = `${this.props.url}/ReachedTablesData.json`;
        d3.json(url_data)
            .then(function (data) {
                this.reached_data = data;
                let country_names = []
                let country_tons = []
                for(let key of Object.keys(data)) {
                    if (!_.isUndefined(data[key]['from'])) {
                        country_tons.push(parseInt(data[key]['from']['tot_tons']))
                        country_names.push(key)
                    }
                }
                // console.log(country_names)
                // console.log(`All ${country_tons} Max value: ${Math.max(country_tons)} Min value: ${Math.min(country_tons)}`)
                this.props.updateTonsByCountry(country_names, country_tons)
            }.bind(this));

        this.props.map.addLayer(states_layer);

        this.clickEvent = this.clickEvent.bind(this);
        this.hoverEvent = this.hoverEvent.bind(this);
        this.drawStatesLayer = this.drawStatesLayer.bind(this);

        this.state = {
            hovered: null,
            selected: null,
            states_layer: states_layer
        }
    }


    drawStatesLayer(){
        let features = this.state.states_layer.getSource().getFeatures()
        for(let id in features){
            let country_name = features[id].get('name')
            let color = this.props.colors_by_country[country_name.toLowerCase()]
            if(!_.isUndefined(color)){
                features[id].setStyle(this.getCountryStyle(color, country_name)) // Set this country 'highlighted'
            }else{
                features[id].setStyle(this.getDefaultStyle(country_name)) // Set this country 'highlighted'
            }
        }
    }

    /**
     * Obtains the proper style for the country. Basically it changes the colro and text
     * @param color
     * @param name
     * @returns {Style}
     */
    getCountryStyle(color, name){
        return new Style({
            fill: new Fill({
                color: color
            }),
            stroke: new Stroke({
                color: '#6D6D6D',
                width: 1
            }),
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#FFFFFF',
                    width: 2
                }),
                text: name.charAt(0).toUpperCase() + name.slice(1)
            })
        });
    }

    /**
     *
     * @param name
     * @returns {Style}
     */
    getDefaultStyle(name){
        return new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, .1)',
            }),
            stroke: new Stroke({
                color: '#2f3e46',
                width: 1
            }),
            // text: new Text({
            //     font: '12px Calibri,sans-serif',
            //     fill: new Fill({
            //         color: '#212529',
            //         width: 2
            //     }),
            //     text: name.charAt(0).toUpperCase() + name.slice(1)
            // })
        });
    }

    setCountriesStyle(feature){
        let country_name = feature.get('name').toLowerCase()
        let color = this.props.colors_by_country[country_name]
        return this.getCountryStyle(color, feature.get(['name']));
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.drawStatesLayer()
    }

    /**
     * Catches the mouse click and updates the selected country and
     * table (if any).
     * @param e
     */

    clickEvent(e){
        this.clearHovered();
        let pixpos = e.pixel;
        let features = e.map.getFeaturesAtPixel(pixpos);

        let popup = document.getElementById('popup')
        $(popup).hide();

        let name = ''
        // It we click inside a country
        if(features !== null){
            let country = features[0]
            name = country.get("name")

            // If we are selecting a different country
            if (this.state.selected !== country) {
                country.setStyle(this.getCountryStyle(selected_color, name)) // Set this country 'highlighted'
                // Show the corresponding statistics
                let country_data  =this.reached_data[name.toLowerCase()]
                if(!_.isUndefined(country_data) && country_data['from'] !== -1){
                    $(popup).show()
                    ReactDOM.render(<MakePlot country_name={name} country_data={country_data}></MakePlot>, popup)
                }
                // Save current selection
                this.setState({
                    selected: country,
                });
            }else{// If we  clicked on the same country we clear everything
                name = ''
                this.setState({
                    selected: null,
                });
                $("#stats_table").addClass('fadeOutRight')
            }
        }
        // WE ALWAYS NEED TO SEND THE UPDATE SIGNAL WHEN WE CLICK IN A COUNTRY
        this.props.updateSelectedCountry(name);
    }

    clearHovered(){
        if(this.state.hovered !== null){
            // Verify that, if we have one country already selected, then we only clear
            // the hover if is not the one selected
            if(this.state.selected !== null){
                if(this.state.hovered === this.state.selected){
                    return;
                }
            }
            let oldHovered = this.state.hovered
            let name = oldHovered.get("name")
            let color = this.props.colors_by_country[name.toLowerCase()]//Adding transparency to the color
            color.opacity = 1
            if(_.isUndefined(color)){
                oldHovered.setStyle(this.getDefaultStyle(name));
            }else{
                oldHovered.setStyle(this.getCountryStyle(color, name));
            }
        }
    }

    hoverEvent(e){
        let pixpos = e.pixel;
        let features = e.map.getFeaturesAtPixel(pixpos);
        // It found something

        let map = document.getElementById("map")
        this.clearHovered();
        if(features !== null){
            map.style.cursor = "pointer"
            let country = features[0];
            // if(_.isNull(this.state.selected)){
            //     console.log(`Selected: null  hovered: ${country.get("name").toLowerCase()}`)
            // }else{
            //     console.log(`Selected: ${this.state.selected.get("name").toLowerCase()}  hovered: ${country.get("name").toLowerCase()}`)
            // }
            if(this.state.selected !== country) {
                let name = country.get("name")
                let color = this.props.colors_by_country[name.toLowerCase()]//Adding transaprency to the color
                if(!_.isNull(color) && !_.isUndefined(color)){
                    color.opacity = .8
                    // console.log(`Country at mouse: ${name} color: ${color}`)
                    country.setStyle(this.getCountryStyle(color, name));
                    this.setState({hovered: country})
                }
            }
        }else{
            map.style.cursor = "default"
        }
    }

    componentDidMount() {
        this.props.map.on('click', this.clickEvent);
        this.props.map.on('pointermove', this.hoverEvent);
        if(!isMobile){
            // document.getElementsByClassName("ol-zoom")[0].style.zIndex = 101
            // document.getElementsByClassName("ol-full-screen")[0].style.zIndex = 111
        }
    }

    render() {
        return (null );
    }

}

export default StatesLayer ;
