import React from 'react';
import ReactDOM from 'react-dom';
import './css/App.css';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {GeoJSON} from "ol/format";
import {Fill, Stroke, Style, Text} from "ol/style";
import MakeTable from "./MakeTable";
import Overlay from "ol/Overlay";
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import _ from "underscore";
import * as d3 from "d3";
import TopoJSON from "ol/format/TopoJSON";

require('ol/ol.css');


class  StatesLayer extends React.Component{
    constructor(props){
        super(props);
        // console.log(`Constructor StatesLayer `);

        // Creating vector layer
        // this.vectorLayer = new VectorLayer({
        //     source: new VectorSource({
        //         url: `${this.props.url}/countries.geojson`,
        //         format: new GeoJSON()
        //     }),
        //     style: this.setStyle.bind(this)
        // });
        this.vectorLayer = new VectorLayer({
            source: new VectorSource({
                // url: `${this.props.url}/countries-110m.json`,
                url: `${this.props.url}/countries.json`,
                // url: `${this.props.url}/countries-50m.json`,
                // url: `${this.props.url}/countries-10m.json`,
                format: new GeoJSON( {layers:['countries'] }),
                overlaps: false
            }),
            style: this.setStyle.bind(this)
        });

        //------------------ Adding popup for the stats table ---------------------
        // Creating overlay
        this.popup = new Overlay({
            element: document.getElementById('popup')
        });
        $('#popup').popover();
        this.props.map.addOverlay(this.popup);

        //------------  Bootstrap popover versoin
        // this.popup = $('#stats_table'); //Get the jquery ref
        // this.popup.popover();  // Initialize as Boostrap popup

        // Reading Reached data
        let url_data = `${this.props.url}/ReachedTablesData.json`;
        d3.json(url_data)
            .then(function (data) {
                this.reached_data = data;
            }.bind(this));

        this.props.map.addLayer(this.vectorLayer);

        this.verifySelectedPosition = this.verifySelectedPosition.bind(this);
        this.makeTable = this.makeTable.bind(this);
    }

    /**
     * Catches the mouse click and updates the selected country and
     * table (if any).
     * @param e
     */
    verifySelectedPosition(e){
        var pixpos = e.pixel;
        var features = e.map.getFeaturesAtPixel(pixpos);

        // Hide the previous table/plot
        var element = this.popup.getElement();
        $(element).hide();

        // It found something
        if(features !== null){
            let country = features[0];
            let name = country.get("name");
            this.props.updateSelectedCountry(name);
            var coordinate = e.coordinate;

            console.log(`Pixel pos: ${pixpos} Coordinate: ${coordinate}`);

            //     ------ Popup Boostrap
            // ReactDOM.render(this.makeTable(name), this.popup.get(0));

            //     ------ Popup OpenLayers
            this.popup.setPosition(coordinate);
            $(element).popover({
                placement: 'left',
                animation: true,
                html: true,
            });
            ReactDOM.render(this.makeTable(name), element);
            $(element).show({duration:100});
            console.log("Showing");
        // }else{
        //     $("#stats_table").addClass('fadeOutRight');
        }
    }

    makeTable(name){
        let country_data  =this.reached_data[name.toLowerCase()];
        const element = <MakeTable country_name={name} country_data={country_data}></MakeTable>;
        return  element;
    }

    /**
     * Obtains the proper style for the country. Basically it changes the colro and text
     * @param color
     * @param name
     * @returns {Style}
     */
    getStyleCountryOfInterest(color, name){
        return new Style({
            fill: new Fill({
                color: color
            }),
            // stroke: new Stroke({
            //     // color: '#319FD3',
            //     color: '#6D6D6D',
            //     width: 0
            // })
            // ,
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#000000'
                }),
                stroke: new Stroke({
                    color: '#fff',
                    width: 3
                }),
                text: ''
            })
        });
    }

    getDefaultStyle(name){
        return new Style({
            fill: new Fill({
                color: 'rgba(255,255,255,.1)',
            }),
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#000000'
                }),
                stroke: new Stroke({
                    color: '#fff',
                    width: 3
                }),
                text: ''
            })
        });
    }

    setStyle(feature){
        if( this.props.colors_by_country[feature.get('name').toLowerCase()]){
            let color = this.props.colors_by_country[feature.get('name').toLowerCase()];//Adding transaprency to the color
            // color = color.slice(0, color.lastIndexOf(',')) + ',1)';  // Setting new transparency
            // console.log("******************************************");
            // console.log("Found Country: ", feature.get('name'));
            // console.log("Color: ", color);
            return this.getStyleCountryOfInterest(color, feature.get(['name']));
        }else{
            return this.getDefaultStyle(feature.get(['name']));
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    componentDidMount() {
        this.props.map.on('click', this.verifySelectedPosition);
    }

    render() {
        return (null );
    }

}

export default StatesLayer ;
