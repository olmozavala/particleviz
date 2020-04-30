import React from 'react';
import './css/App.css';
import StatesLayer from "./StatesLayer";
import ParticlesLayer from "./ParticlesLayer";
import BackgroundLayerManager from "./BackgroundLayerManager";
import Dropdown from "react-bootstrap/Dropdown";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobeAfrica, faMap, } from '@fortawesome/free-solid-svg-icons';

const data_folder_url = "http://localhost/data";
// const data_folder_url = "http://ozavala.coaps.fsu.edu/data";
const def_alpha = "FF";
const selected_alpha = 1;
// const not_selected_alpha = .2;
const not_selected_alpha = '88';
let tempcolors = [
    ["#45CDE9", "#4EC3E5", "#57B8E2", "#60AEDE", "#68A4DA", "#7199D7", "#7A8FD3"],
    ["#0968E5", "#095BD2", "#094EBE", "#0941AB", "#093397", "#092684", "#091970"],
    ["#C11E38", "#A71B37", "#8C1837", "#721536", "#571135", "#3D0E35", "#220B34"],
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
// let colors = [
//     "rgba(0, 145, 224, "+def_alpha+")", "rgba(0, 104, 71, "+def_alpha+")", "rgba(82, 0, 183, "+def_alpha+")", "rgba(209, 0, 149, "+def_alpha+")",
//     "rgba(230, 40, 179,"+def_alpha+")", "rgba(33, 0, 181, "+def_alpha+")", "rgba(42, 234, 64, "+def_alpha+")",
//     "rgba(247, 195, 27,"+def_alpha+")", "rgba(152, 152, 152, "+def_alpha+")", "rgba(255, 97, 71, "+def_alpha+")", "rgba(98, 132, 109, "+def_alpha+")",
//     "rgba(255, 233, 0, "+def_alpha+")", "rgba(233, 0, 255, "+def_alpha+")", "rgba(50, 84, 20, "+def_alpha+")", "rgba(94, 47, 34, "+def_alpha+")",
//      "rgba(0, 221, 96, "+def_alpha+")", "rgba(40, 7, 0, "+def_alpha+")","rgba(255, 255, 0, "+def_alpha+")",
//     "rgba(0, 242, 242, "+def_alpha+")", "rgba(87, 37, 167, "+def_alpha+")", "rgba(52, 46, 55, "+def_alpha+")", "rgba(149, 32, 56, "+def_alpha+")",
//     "rgba(0, 255, 110, "+def_alpha+")", "rgba(126, 253, 50, "+def_alpha+")", "rgba(0, 76, 48, "+def_alpha+")", "rgba(0, 61, 117, "+def_alpha+")",
//     "rgba(162, 215, 41,"+def_alpha+")", "rgba(49, 148, 0, "+def_alpha+")", "rgba(36, 33, 88, "+def_alpha+")", "rgba(60, 145, 230, "+def_alpha+")",
//     "rgba(88, 168, 186,"+def_alpha+")", "rgba(30, 30, 30, "+def_alpha+")", "rgba(234, 89, 0, "+def_alpha+")",
// ];

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

let selected_color = `rgba(255,0,0,${selected_alpha})`;

const data_files = [
    {file: "1/TESTUN_output",title: "TEST", speed: "", start_date: new Date(2010, 0, 1)},
    {file: "1/Single_Release_FiveYears_EachMonth_2010_08_2020-04-19_21_18_output",title: "August 2010", speed: "", start_date: new Date(2010, 8, 1)},
    {file: "1/Single_Release_FiveYears_EachMonth_2010_09_2020-04-19_21_18_output",title: "September 2010", speed: "", start_date: new Date(2010, 9, 1)},
    {file: "1/Single_Release_FiveYears_EachMonth_2010_10_2020-04-19_21_18_output",title: "October 2010", speed: "", start_date: new Date(2010, 10, 1)},
    {file: "1/Single_Release_FiveYears_EachMonth_2010_11_2020-04-19_21_18_output",title: "November 2010", speed: "", start_date: new Date(2010, 11, 1)},
    {file: "1/Single_Release_FiveYears_EachMonth_2010_12_2020-04-19_21_18_output",title: "December 2010", speed: "", start_date: new Date(2010, 12, 1)},

];

class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            colors_by_country: [],
            selected_country: '',
            country_names: [],
            ocean_names: [],
            selected_model: data_files[0]
        };

        this.updateCountriesAll = this.updateCountriesAll.bind(this);
        this.updateSelectedCountry= this.updateSelectedCountry.bind(this);
        this.changeFile = this.changeFile.bind(this);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.props.map.getLayers().forEach(layer => layer.getSource().refresh());
        this.props.map.render();
    }

    updateCountriesAll(country_names, ocean_names) {
        let colors_by_country = this.updateCountryColorsPartViz_Manager(country_names, ocean_names, this.state.selected_country);
        this.setState({
            country_names: country_names,
            ocean_names: ocean_names,
            colors_by_country: colors_by_country
        })
    }

    updateSelectedCountry(name){

        let current_country = this.state.selected_country;
        // If the name is the same as before then we 'toogle it'
        if(current_country.localeCompare(name) === 0){
            name = '';
        }
        let colors_by_country = this.updateCountryColorsPartViz_Manager(this.state.country_names, this.state.ocean_names, name);

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

    /**
     * Function that updates the assigned color for each country.
     * @param country_names
     * @param selected_country
     * @returns {{}}
     */
    updateCountryColorsPartViz_Manager(country_names, ocean_names, selected_country) {
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
                let new_color = this.colorByOcean(ocean_names[i])[i % 7];
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
                    <div className="col-1 navbar-brand ml-2 d-none d-lg-inline">
                        <FontAwesomeIcon icon={faGlobeAfrica} size="lg"/>
                    </div>
                    <div className="col-12 col-md-8 col-lg-8 col-xl-6">
                        <ParticlesLayer map={this.props.map}
                                        updateCountriesData={this.updateCountriesAll}
                                        selected_color={selected_color}
                                        url={data_folder_url}
                                        colors_by_country={this.state.colors_by_country}
                                        selected_model={this.state.selected_model}/>
                    </div>
                    <div className="col-5 col-md-2 col-lg-2 navbar-brand  ml-2">
                        <Dropdown >
                            <Dropdown.Toggle variant="info">
                                {this.state.selected_model.title} {this.state.selected_model.speed}
                            </Dropdown.Toggle>
                            <Dropdown.Menu onClick={this.changeFile}>
                                {data_files.map((item,index) => (
                                    <Dropdown.Item eventKey={item.name} key={index}>{item.title} {item.speed}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    <div className="col-5 col-md-2 col-lg-1">
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
