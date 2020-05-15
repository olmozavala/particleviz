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

require('ol/ol.css');

let selected_color = `rgba(255,0,0,1)`;

class  StatesLayer extends React.Component{
    constructor(props){
        super(props);
        this.vectorLayer = new VectorLayer({
            source: new VectorSource({
                // url: `${this.props.url}/countries-110m.json`,
                url: `${this.props.url}/countries.json`,
                // url: `${this.props.url}/countries-50m.json`,
                // url: `${this.props.url}/countries-10m.json`,
                format: new GeoJSON( {layers:['countries'] }),
                overlaps: false
            }),
            style: this.setCountriesStyle.bind(this)
        });

        //------------------ Adding popup for the stats table ---------------------
        // Creating overlay
        let popup = document.getElementById('popup')
        this.popup = new Overlay({
            element: popup
        });
        $('#popup').popover();
        this.props.map.addOverlay(this.popup);

        //------------  Bootstrap popover versoin
        // this.popup = $('#stats_table'); //Get the jquery ref
        // this.popup.popover();  // Initialize as Boostrap popup

        // Reading Reached data
        let url_data = `${this.props.url}/ReachedTablesData.json`;
        // console.log(url_data)
        d3.json(url_data)
            .then(function (data) {
                this.reached_data = data;
                console.log('Table data', data)
            }.bind(this));

        this.props.map.addLayer(this.vectorLayer);

        this.clickEvent = this.clickEvent.bind(this);
        this.hoverEvent = this.hoverEvent.bind(this);
        this.makeTable = this.makeTable.bind(this);
        this.clearHovered = this.clearHovered.bind(this);

        this.state = {
            hovered: null,
            selected: null,
            oldSelectedColor: null
        }
    }

    makeTable(name){
        let country_data  =this.reached_data[name.toLowerCase()];
        let element = <div></div>
        if(!_.isUndefined(country_data) && !_.isUndefined(country_data['to']) && !_.isUndefined(country_data['from'])){
            element = <MakeTable country_name={name} country_data={country_data}></MakeTable>;
        }
        return  element;
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
                // color: '#319FD3',
                color: '#6D6D6D',
                width: 1
            }),
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#FFFFFF',
                    width: 2
                }),
                // stroke: new Stroke({
                //     color: '#fff',
                //     width: 4
                // }),
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
                color: 'rgba(255,255,255,.1)',
            }),
            stroke: new Stroke({
                // color: '#319FD3',
                color: '#6D6D6D',
                width: 0
            }),
            text: new Text({
                font: '12px Calibri,sans-serif',
                fill: new Fill({
                    color: '#FFFFFF'
                }),
                // stroke: new Stroke({
                //     color: '#fff',
                //     width: 3
                // }),
                text: ''
            })
        });
    }

    setCountriesStyle(feature){
        if( this.props.colors_by_country[feature.get('name').toLowerCase()]){
            let color = this.props.colors_by_country[feature.get('name').toLowerCase()];//Adding transaprency to the color
            return this.getCountryStyle(color, feature.get(['name']));
        }else{
            return this.getDefaultStyle(feature.get(['name']));
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
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
            let oldHovered = this.state.hovered;
            let name = oldHovered.get("name").toLowerCase();
            let color = this.props.colors_by_country[name];//Adding transaprency to the color
            if(_.isUndefined(color)){
                oldHovered.setStyle(this.getDefaultStyle(name));
            }else{
                oldHovered.setStyle(this.getCountryStyle(color, name));
            }
        }
    }
    /**
     * Catches the mouse click and updates the selected country and
     * table (if any).
     * @param e
     */
    clickEvent(e){
        this.clearHovered();
        var pixpos = e.pixel;
        var features = e.map.getFeaturesAtPixel(pixpos);

        // Hide the previous table/plot
        var element = this.popup.getElement();

        $(element).hide();

        // It found something
        if(features !== null){
            let country = features[0];
            let name = country.get("name");
            let oldcolor = this.props.colors_by_country[name.toLowerCase()];
            if(!(_.isUndefined(oldcolor))){ // In this case the country is not found.
                // In which case should we restore the old color
                if(this.state.selected !== null) {
                    let old_name = this.state.selected.get("name");
                    this.state.selected.setStyle(this.getCountryStyle(this.state.oldSelectedColor, old_name));
                }

                // WE ALWAYS NEED TO SEND THE UPDATE SIGNAL WHEN WE CLICK IN A COUNTRY
                this.props.updateSelectedCountry(name);

                if (this.state.selected !== country) {
                    country.setStyle(this.getCountryStyle(selected_color, name));
                    // Es un desmadre, esta linea TIENE que ir antes del update o se puede cambiar los colores
                    var coordinate = e.coordinate;
                    //     ------ Popup OpenLayers
                    this.popup.setPosition(coordinate);
                    $(element).popover({
                        placement: 'left',
                        animation: true,
                        html: true,
                    });
                    let ol_popup_container = document.getElementsByClassName("ol-selectable")
                    // Setting the popup with the table to 'passs through' the mouse events. To be able to scroll the map
                    if(!_.isUndefined(ol_popup_container)){
                        ol_popup_container[0].style.pointerEvents = "none"
                        ol_popup_container[0].style.width= "34em"
                    }
                    ReactDOM.render(this.makeTable(name), element);
                    $(element).show({duration:100});
                    this.setState({
                        selected: country,
                        oldSelectedColor: oldcolor
                    });
                }
                else{// Tooggle color 'unselect'
                    this.setState({
                        selected: null,
                        oldSelectedColor: null
                    });
                    $("#stats_table").addClass('fadeOutRight');
                }
            }
        }
    }

    hoverEvent(e){
        this.clearHovered();
        var pixpos = e.pixel;
        var features = e.map.getFeaturesAtPixel(pixpos);
        // It found something

        if(features !== null){
            let country = features[0];
            if(this.state.selected !== country) {
                let name = country.get("name").toLowerCase();
                let color = this.props.colors_by_country[name];//Adding transaprency to the color
                if(!_.isUndefined(color)){
                    let new_color = color.slice(0,-2) + "AA";
                    country.setStyle(this.getCountryStyle(new_color, name));
                    this.setState({hovered: country});
                }
            }
        }
    }

    componentDidMount() {
        this.props.map.on('click', this.clickEvent);
        this.props.map.on('pointermove', this.hoverEvent);
        document.getElementsByClassName("ol-zoom")[0].style.zIndex = 101
    }

    render() {
        return (null );
    }

}

export default StatesLayer ;
