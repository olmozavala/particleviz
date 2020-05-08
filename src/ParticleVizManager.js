import React from 'react';
import './css/App.css';
import StatesLayer from "./StatesLayer";
import ParticlesLayer from "./ParticlesLayer";
import BackgroundLayerManager from "./BackgroundLayerManager";
import Dropdown from "react-bootstrap/Dropdown";
import {
    DropletHalf
} from 'react-bootstrap-icons';
import InputGroup from "react-bootstrap/InputGroup";

const data_folder_url = "http://localhost/data";
// const data_folder_url = "http://ozavala.coaps.fsu.edu/data";
const def_alpha = "FF";
const selected_alpha = 1;
// const not_selected_alpha = .2;
const not_selected_alpha = '88';
let tempcolors = [
    ["#45CDE9", "#4EC3E5", "#57B8E2", "#60AEDE", "#68A4DA", "#7199D7", "#7A8FD3"],
    ["#0968E5", "#095BD2", "#094EBE", "#0941AB", "#093397", "#092684", "#091970"],
    ["#C11E38", "#3d0e15", "#A71B37", "#8C1837", "#721536", "#571135", "#340b0e"],
    ["#F4D941", "#F3CB3F", "#F1BC3D", "#F0AE3B", "#EF9F39", "#ED9137", "#EC8235"],
    ["#57EBDE", "#66EEC0", "#74F0A2", "#83F384", "#91F666", "#A0F848", "#AEFB2A"],
    ["#0B2C24", "#0F392B", "#134632", "#185339", "#1C603F", "#206D46", "#247A4D"],
    ["#ABBDFF", "#A5AAE8", "#A097D2", "#9A84BB", "#9471A4", "#8F5E8E", "#894B77"],
    ["#663177", "#763378", "#863678", "#963879", "#A63A7A", "#B63D7A", "#C63F7B"],
    ["#099773", "#139C78", "#1CA17D", "#26A783", "#30AC88", "#39B18D", "#43B692"],
    ["#FF5858", "#FF6B6B", "#FF7D7D", "#FF9090", "#FFA3A3", "#FFB5B5", "#FFC8C8"],
    ["#B94C98", "#C24189", "#CB3579", "#D52A6A", "#DE1E5A", "#E7134B", "#F0073B"],
    ["#E4E7E4", "#C0C4CA", "#9BA1B0", "#777F96", "#535C7B", "#2E3961", "#0A1647"],
];
let colors = tempcolors.map((c_colors ) => c_colors.map((color) => color + def_alpha));


const OCEANS = {
    black_sea: {
        name:'black sea',
        color: 0},
    north_atlantic_ocean: {
        name:'north atlantic ocean',
        color: 1},
    north_pacific_ocean: {
        name:'north pacific ocean',
        color: 2},
    south_atlantic_ocean: {
        name:'south atlantic ocean',
        color: 3},
    south_pacific_ocean: {
        name:'south pacific ocean',
        color: 4},
    indian_ocean: {
        name:'indian ocean',
        color: 5},
    southern_ocean: {
        name:'southern ocean',
        color: 6},
    artic_ocean: {
        name:'arctic ocean',
        color: 7}
}

const CONTINENTS = {
    africa: {name:'africa', color:2},
    asia: {name:'asia', color:1},
    south_america: {name:'south america', color:0},
    europe: {name:'europe', color:5},
    oceania: {name:'oceania', color:4},
    north_america: {name:'north america', color:3},
    seven_seas: {name:'seven seas (open ocean)', color:6},
    Antarctica: {name:'antarctica', color:7},
}

let selected_color = `rgba(255,0,0,${selected_alpha})`;

const data_files = [
    //-------------------------------------------------------------------
    // {file: "1/TESTUN_output",title: "TEST", speed: "", start_date: new Date(2010, 0, 1)},
    // {file: "1/OneYear_Only_Currents2020-05-05_16_36_output",title: "Only Currents 2010", speed: "", start_date: new Date(2010, 0, 1)},
    // {file: "1/OneYear_Currents_Winds_Diffusion2020-05-05_16_36_output",title: "Currents+Winds+Diffusion 2010", speed: "", start_date: new Date(2012, 0, 1)},
    // {file: "1/OneYear_Currents_And_Wind2020-05-05_16_36_output",title: "Currents+Winds 2010", speed: "", start_date: new Date(2010, 0, 1)},
    // {file: "1/OneYear_Currents_And_Diffusion2020-05-05_16_36_output",title: "Currents+Diffusion 2010", speed: "", start_date: new Date(2010, 0, 1)},
    //-------------------------------------------------------------------
    {file: "1/OneYear_Currents_Winds_Diffusion2020-05-04_13_46_output",title: "Currents+Winds+Diffusion 2010", speed: "", start_date: new Date(2010, 0, 1)},
    {file: "1/OneYear_Only_Currents2020-05-04_13_46_output",title: "Only Currents 2010", speed: "", start_date: new Date(2012, 0, 1)},
    {file: "2/OneYear_Currents_And_Wind2020-05-04_13_46_output",title: "Currents+Winds 2010", speed: "", start_date: new Date(2010, 0, 1)},
    {file: "2/OneYear_Currents_And_Diffusion2020-05-04_13_46_output",title: "Currents+Diffusion 2010", speed: "", start_date: new Date(2010, 0, 1)},
    //-------------------------------------------------------------------
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_01",title: "Five Years January", speed: "", start_date: new Date(2010, 0, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_02",title: "Five Years February", speed: "", start_date: new Date(2010, 1, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_03",title: "Five Years March", speed: "", start_date: new Date(2010, 2, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_04",title: "Five Years April", speed: "", start_date: new Date(2010, 3, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_05",title: "Five Years May", speed: "", start_date: new Date(2010, 4, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_06",title: "Five Years June", speed: "", start_date: new Date(2010, 5, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_07",title: "Five Years July", speed: "", start_date: new Date(2010, 6, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_08",title: "Five Years August", speed: "", start_date: new Date(2010, 7, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_09",title: "Five Years September", speed: "", start_date: new Date(2010, 8, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_10",title: "Five Years October", speed: "", start_date: new Date(2010, 9, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_11",title: "Five Years November", speed: "", start_date: new Date(2010, 10, 1)},
    {file: "4/Final_Five_Years_WindsCurrentsDiffusionUnbeaching_12",title: "Five Years December", speed: "", start_date: new Date(2010, 11, 1)},
    //-------------------------------------------------------------------

    // {file: "1/TestOneYear_Unbeaching2020-04-29_11_06_output",title: "(testunbeaching)Currents+Winds+Diffusion 2010", speed: "", start_date: new Date(2010, 0, 1)},
    // {file: "4/Single_Release_FiveYears_EachMonth_2010_08_2020-04-19_21_18_output",title: "August 2010 (1/4)", speed: "", start_date: new Date(2010, 7, 1)},
    // {file: "3/Single_Release_FiveYears_EachMonth_2010_09_2020-04-19_21_18_output",title: "September 2010", speed: "", start_date: new Date(2010, 8, 1)},
    // {file: "3/Single_Release_FiveYears_EachMonth_2010_10_2020-04-19_21_18_output",title: "October 2010", speed: "", start_date: new Date(2010, 9, 1)},
    // {file: "1/Single_Release_FiveYears_EachMonth_2010_11_2020-04-19_21_18_output",title: "November 2010", speed: "", start_date: new Date(2010, 10, 1)},
    // {file: "3/Single_Release_FiveYears_EachMonth_2010_12_2020-04-19_21_18_output",title: "December 2010", speed: "", start_date: new Date(2010, 11, 1)},
];

class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            colors_by_country: [],
            selected_country: '',
            country_names: [],
            ocean_names: [],
            continents: [],
            selected_model: data_files[0],
            histogram_selected: false
        };

        this.updateCountriesAll = this.updateCountriesAll.bind(this);
        this.updateSelectedCountry= this.updateSelectedCountry.bind(this);
        this.changeFile = this.changeFile.bind(this);
        this.updateHistogramLayer= this.updateHistogramLayer.bind(this);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.props.map.getLayers().forEach(layer => layer.getSource().refresh());
        this.props.map.render();
    }

    updateCountriesAll(country_names, ocean_names, continents) {
        let colors_by_country = this.updateCountryColorsPartViz_Manager(country_names, ocean_names, continents, this.state.selected_country);
        this.setState({
            country_names: country_names,
            ocean_names: ocean_names,
            continents: continents,
            colors_by_country: colors_by_country
        })
    }

    updateHistogramLayer(e){
        if(e.target.checked){
            this.props.histogram_layer.setVisible(true)
        }else{
            this.props.histogram_layer.setVisible(false)
        }

        this.setState({
            histogram_selected: !this.state.histogram_selected,
        })
    }

    updateSelectedCountry(name){

        let current_country = this.state.selected_country;
        // If the name is the same as before then we 'toogle it'
        if(current_country.localeCompare(name) === 0){
            name = '';
        }
        let colors_by_country = this.updateCountryColorsPartViz_Manager(
            this.state.country_names, this.state.ocean_names, this.state.continents, name);

        this.setState({
            selected_country: name,
            colors_by_country: colors_by_country
        });
    }

    colorByOcean(ocean){
        let sel_ocean = '';
        for(const c_ocean in OCEANS){
            if(OCEANS[c_ocean].name.localeCompare(ocean[0].toLowerCase()) === 0){
                sel_ocean = OCEANS[c_ocean];
                break;
            }
        }
        // return colors[sel_ocean.color][Math.floor(Math.random() * 7)];
        return colors[sel_ocean.color];
    }
    colorByContinent(continent){
        let sel_continent = '';
        for(const c_continent in CONTINENTS){
            if(CONTINENTS[c_continent].name.localeCompare(continent.toLowerCase()) === 0){
                sel_continent = CONTINENTS[c_continent];
                break;
            }
        }
        return colors[sel_continent.color];
    }

    /**
     * Function that updates the assigned color for each country.
     * @param country_names
     * @param selected_country
     * @returns {{}}
     */
    updateCountryColorsPartViz_Manager(country_names, ocean_names, continent_names, selected_country) {
        let colors_by_country = {};
        let update_alpha = false;

        // Finds for a selected country, If it finds it reduces the alpha of the other countries
        for(let i=0; i < country_names.length; i++){
            let name = country_names[i];
            if(name.toLowerCase() === selected_country.toLowerCase()) {
                update_alpha = true;
                break;
            }
        }

        // Iterates over all the country names
        for (let i = 0; i < country_names.length; i++) {
            let name = country_names[i];
            // Finds teh selected country and highlights it
            if (name.toLowerCase() === selected_country.toLowerCase()) {
                colors_by_country[name] = selected_color;
            } else {
                // let new_color = colors[i % colors.length];
                // let new_color = this.colorByOcean(ocean_names[i])[i % 7];
                let new_color = this.colorByContinent(continent_names[i])[i % 7];
                if(update_alpha) {
                    let rgb = new_color;
                    // rgb = rgb.replace(/[^\d,]/g, '').split(',');
                    // new_color = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${not_selected_alpha})`;
                    new_color = rgb.slice(0,-2) + not_selected_alpha;
                }
                colors_by_country[name] = new_color;
            }
        }
        return colors_by_country;
    }

    changeFile(e){
        let new_selected_model = [];
        for(let i = 0; i < data_files.length; i++){
            let merged = `${data_files[i].title.toLowerCase()} ${data_files[i].speed.toLowerCase()}`
            if(merged === e.target.text.toLowerCase()){
                new_selected_model = data_files[i];
                break;
            }
        }
        this.setState({
            selected_model: new_selected_model
        })
        e.preventDefault();
    }

    render(){
        return (
            <div className="container-fluid">
                <div className="row justify-content-center">
                    <div className="col-1 navbar-brand ml-2 d-none d-xl-inline">
                        <DropletHalf size={30}/>
                    </div>
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <ParticlesLayer map={this.props.map}
                                        updateCountriesData={this.updateCountriesAll}
                                        selected_color={selected_color}
                                        url={data_folder_url}
                                        colors_by_country={this.state.colors_by_country}
                                        selected_model={this.state.selected_model}/>
                    </div>
                    <div className="col-5 col-md-3 col-lg-2 navbar-brand  ml-2">
                        <Dropdown>
                            <Dropdown.Toggle variant="info" size="sm">
                                {this.state.selected_model.title} {this.state.selected_model.speed}
                            </Dropdown.Toggle>
                            <Dropdown.Menu onClick={this.changeFile}>
                                {data_files.map((item,index) => (
                                    <Dropdown.Item eventKey={item.name} key={index}>{item.title} {item.speed}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>

                    </div>
                    <div className="col-1 col-md-1 col-lg-1 navbar-brand  ml-2">
                        <InputGroup.Prepend>
                            <span>Density</span> &nbsp;
                            <InputGroup.Checkbox aria-label="Checkbox for following text input"
                                checked={this.state.histogram_selected}
                                onChange={this.updateHistogramLayer}/>
                        </InputGroup.Prepend>
                    </div>
                    <div className="col-5 col-md-1 col-lg-1">
                        <BackgroundLayerManager background_layer={this.props.background_layer}
                                                map={this.props.map} />
                    </div>
                </div>
                <StatesLayer map={this.props.map}
                             colors_by_country={this.state.colors_by_country}
                             url={data_folder_url}
                             selected_color={selected_color}
                             updateSelectedCountry = {this.updateSelectedCountry}/>

            </div>
        );
    }
}

export default ParticleVizManager;
