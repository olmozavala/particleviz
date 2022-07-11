import React from 'react';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {GeoJSON} from "ol/format";
import {Fill, Stroke, Style, Text} from "ol/style";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './css/App.css';
require('ol/ol.css');

const country_color = `rgba(212, 212, 213, 0.1)`;

class  StatesLayer extends React.Component{
    constructor(props){
        super(props);
        // Initializes the state layer from the provided url
        let states_layer = new VectorLayer({
            source: new VectorSource({
                url: `${this.props.url}/countries.geojson`,
                format: new GeoJSON(),
                overlaps: false
            }),
            style: this.setCountriesStyle.bind(this)
        });

        this.state = {
            states_layer: states_layer
        }
        let layers = this.props.map.getLayers();
        layers.insertAt(1, states_layer);
        // this.props.map.addLayer(states_layer);
    }

    /**
     * Generates a default style for a country
     * @param name Name of the country
     * @returns {Style}
     */
    getDefaultStyle(name){
        return new Style({
            fill: new Fill({
                color: country_color,
            }),
            stroke: new Stroke({
                color: '#2f3e46',
                width: .5
            }),
            text: new Text({
                font: '15px Calibri,sans-serif',
                fill: new Fill({
                    color: '#0c0c0c',
                    width: 2
                }),
                text: name.charAt(0).toUpperCase() + name.slice(1)
            })
        });
    }

    /**
     * This function is assigned to the state layer to obtain the style
     * for each feature (country in this case).
     * @param feature
     * @returns {Style}
     */
    setCountriesStyle(feature){
        return this.getDefaultStyle(feature.get(['name']));
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.state.states_layer.set('visible', this.props.drawstates)
    }

    componentDidMount() { }

    render() {
        return (null );
    }

}

export default StatesLayer ;
