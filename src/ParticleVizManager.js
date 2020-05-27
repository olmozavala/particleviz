import React from 'react'
import './css/App.css'
import StatesLayer from "./StatesLayer"
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import Dropdown from "react-bootstrap/Dropdown"
import * as d3 from "d3"
import _ from "underscore";

import TileWMS from "ol/source/TileWMS"
import TileLayer from "ol/layer/Tile";
import {easeIn} from "ol/easing";

const data_folder_url = "http://localhost/data"
// const data_folder_url = "http://ozavala.coaps.fsu.edu/data"
// const wms_url = "http://localhost:8080/ncWMS2/wms"
const wms_url = "http://ozavala.coaps.fsu.edu/ncWMS2/wms"
const def_alpha = "FF"
const selected_alpha = 1
// const not_selected_alpha = .2
const not_selected_alpha = '88'
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
]
let colors = tempcolors.map((c_colors ) => c_colors.map((color) => color + def_alpha))

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
    africa: {name:'africa',
        // colors:["#fde74c","#E24E1B"],
        // colors:["#edc4b3","#774936"],
        colors:["#ffea47","#ff4b1f"],
        min_max: [1, 130000]},
    asia: {name:'asia',
        // colors:["#F4D941", "#db1b1b"]},
        // colors:["#b76935", "#143642"],
        colors:["#fefcfb", "#0466c8"],
        min_max: [1, 2300000]},
    south_america: {name:'south america',
        colors:["#57EBDE", "#0B2C24"],
        min_max: [1, 1000000]},
    europe: {name:'europe',
        // colors:["#ABBDFF","#663177"]},
        colors:["#ffdd55","#522888"],
        min_max: [1, 50000]},
    oceania: {name:'oceania',
        colors:["#f0f3bd","#05668d"],
        min_max: [1, 10000000]},
    north_america: {name:'north america',
        // colors:["#45CDE9","#091970"],
        // colors:["#fefcfb","#0a1128"],
        colors:["#ffc600","#710000"],
        min_max: [1, 30000]},
    seven_seas: {name:'seven seas (open ocean)',
        colors:["#F6FFF8", "#6B9080"],
        min_max: [1, 10000000]},
    antarctica: {name:'antarctica',
        colors:["#E4E7E4", "#111111"],
        min_max: [1, 10000000]},
}

let selected_color = `rgba(255,0,0,${selected_alpha})`

const months = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September',
    'October', 'November', 'December'
];

let data_files = [
    {
        id: 1,
        file: "1/TESTUN_output",
        title: "TEST",
        style:"default-scalar/div-PRGn",
        wms: `histo_08/histo`,
        speed: "",
        start_date: new Date(2010, 0, 1),
        num_files: 1
    }
]
let num_files = [0, 0, 18, 18, 18, 16, 17, 17, 16, 16, 16, 15]
for(let i=3; i<=12; i++) {
    let i_str = `${i < 10 ? '0' + i : i}`
    data_files.push({
        id: i,
        file: `4/Single_Release_FiveYears_EachMonth_2010_${i_str}`,
        wms: `histo_${i_str}/histo`,
        title: `${months[i-1]} 2010`,
        speed: "",
        start_date: new Date(2010, i-1, 1),
        num_files: num_files[i-1]
    })
}

class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props)

        let histogram_layer = new TileLayer({
            source: new TileWMS({
                url:`${wms_url}:8080/ncWMS2/wms`,
                params: {
                    'LAYERS':data_files[0].wms,
                    'TILED':true,
                    'STYLES':'default-scalar/x-Sst',
                    // 'COLORSCALERANGE':'1,503500',
                    'NUMCOLORBANDS':250,
                    'LOGSCALE':true

                }
            }),
            opacity:.8});
        histogram_layer.setVisible(false);

        // let colors_by_country = new Array().fill("#FFFFFF")
        this.state = {
            colors_by_country: [],
            selected_country: '',
            countries: {},
            selected_model: data_files[0],
            histogram_layer: histogram_layer,
            histogram_selected: false
        }
        this.props.map.addLayer(histogram_layer)

        this.updateSelectedCountry= this.updateSelectedCountry.bind(this)
        this.changeFile = this.changeFile.bind(this)
        this.toogleHistogramLayer= this.toogleHistogramLayer.bind(this)
        this.updateMapLocation = this.updateMapLocation.bind(this)
        this.getColorByCountry= this.getColorByCountry.bind(this)
        this.updateTonsByCountry = this.updateTonsByCountry.bind(this) // This one is called by States
        this.updateCountriesData = this.updateCountriesData.bind(this) // This one is called by Particles
        this.updateColors = this.updateColors.bind(this)
        this.initCountries = this.initCountries.bind(this)
    }

    componentDidMount() {
        window.addEventListener("resize", this.updateMapLocation.bind(this))
    }

    updateMapLocation(){
        let view = this.props.map.getView()
        this.props.map.setSize( [window.innerWidth, window.innerHeight])
        // this.props.map.render()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        this.state.histogram_layer.setSource(
            new TileWMS({
                url: wms_url,
                params: {
                    'LAYERS':this.state.selected_model.wms,
                    'TILED':true,
                    'STYLES':'default-scalar/x-Sst',
                    // 'COLORSCALERANGE':'1,503500',
                    // 'NUMCOLORBANDS':250,
                    'LOGSCALE':true
                }
            })
        )
        // this.props.map.getLayers().forEach(layer => layer.getSource().refresh())
        this.props.map.render()
    }

    initCountries(country_names){
        let countries = {}
        if(!_.isEmpty(this.state.countries)){
            // console.log("Return filled")
            countries = {...this.state.countries}
        }else{
            // console.log("Create empty")
            for(let i=0; i < country_names.length; i++){
                countries[country_names[i]] = {
                    tons: 0,
                    color: "#FFFFFF",
                    ocean: [],
                    continent: ""
                }
            }
        }
        return countries
    }

    updateTonsByCountry(country_names, country_tons) {
        // console.log("Updating tons per country....")
        let countries = this.initCountries(country_names)
        for(let i=0; i < country_names.length; i++){
            if(!_.isUndefined(countries[country_names[i]])) {
                countries[country_names[i]]['tons'] = country_tons[i]
            }
        }
        this.setState({
            countries: countries
        })
        this.updateColors()
    }

    updateCountriesData(country_names, oceans_by_country, continents) {
        // console.log("Updating country data....")
        let countries = this.initCountries(country_names)
        for(let i=0; i < country_names.length; i++){
            if(!_.isUndefined(countries[country_names[i]])){
                countries[country_names[i]]['ocean'] = oceans_by_country[i]
                countries[country_names[i]]['continent'] = continents[i]
            }
        }
        this.setState({
            countries: countries
        })
        this.updateColors()
    }

    updateColors(){
        // console.log("Updating colors....")
        let countries = {...this.state.countries}

        let colors_by_country = {}
        for(let key of Object.keys(countries)){
            let continent_name = countries[key]['continent'].toLowerCase()
            let [first_color, last_color, min_value, max_value] = this.colorByContinent(continent_name)
            let myColor = d3.scaleLog().domain([min_value,max_value]).range([first_color, last_color])
            let new_color = d3.color(myColor(countries[key]['tons']))
            if(this.state.selected_country.toLowerCase().localeCompare(key) === 0){
                // console.log(`${this.state.selected_country.toLowerCase()} ---- ${key}`)
                new_color = selected_color
            }
            countries[key]['color'] = new_color
            colors_by_country[key] = new_color
        }
        this.setState({
            countries: countries,
            colors_by_country: colors_by_country
        })
    }

    getColorByCountry(name){
        if(!_.isUndefined(this.state.countries[name])) {
            // console.log(this.state.selected_country)
            // console.log(`Returning this: ${this.state.countries[name]['color']} name: ${name}`)
            return d3.color(this.state.countries[name]['color'])
        } else{
            return d3.color("#FFFFFF")
        }

    }

    toogleHistogramLayer(e){
        if(this.state.histogram_selected){
            this.state.histogram_layer.setVisible(false)
        }else{
            // console.log("Visible true")
            this.state.histogram_layer.setVisible(true)
        }

        this.setState({
            histogram_selected: !this.state.histogram_selected,
        })
    }

    updateSelectedCountry(name){
        let current_country = this.state.selected_country
        // If the name is the same as before then we 'toogle it'
        if(current_country.localeCompare(name) === 0){
            this.state.countries[name]['color'] = selected_color
        }
        this.setState({
            selected_country: name,
        })
        this.updateColors()
    }

    colorByOcean(ocean){
        let sel_ocean = ''
        for(const c_ocean in OCEANS){
            if(OCEANS[c_ocean].name.localeCompare(ocean[0].toLowerCase()) === 0){
                sel_ocean = OCEANS[c_ocean]
                break
            }
        }
        // return colors[sel_ocean.color][Math.floor(Math.random() * 7)]
        return colors[sel_ocean.color]
    }
    colorByContinent(continent){
        let colors = ["#FFFFFF", "#FFFFFF"]
        let min_max = [0, 100000]
        for(const c_continent in CONTINENTS){
            if(CONTINENTS[c_continent].name.localeCompare(continent.toLowerCase()) === 0){
                colors = CONTINENTS[c_continent]['colors']
                min_max = CONTINENTS[c_continent]['min_max']
                break
            }
        }
        return [colors[0], colors[1], min_max[0], min_max[1]]
    }

    changeFile(e){
        let new_selected_model = []
        for(let i = 0; i < data_files.length; i++){
            let merged = `${data_files[i].title.toLowerCase()} ${data_files[i].speed.toLowerCase()}`
            if(merged === e.target.text.toLowerCase()){
                new_selected_model = data_files[i]
                break
            }
        }
        this.setState({
            selected_model: new_selected_model
        })
        e.preventDefault()
    }

    render(){
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="#">Ocean Litter</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="navbar-nav" id="loading">
                    <div className="spinner-border" role="status"> </div>
                    <a id="load-perc" className="navbar-brand m-2" ></a>
                </div>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                    <div className="navbar-nav">
                        <ParticlesLayer map={this.props.map}
                                        updateCountriesData={this.updateCountriesData}
                                        url={data_folder_url}
                                        colors_by_country={this.state.colors_by_country}
                                        selected_model={this.state.selected_model}/>
                        <Dropdown className="m-2"  title="Release month">
                            <Dropdown.Toggle variant="info">
                                {this.state.selected_model.title} {this.state.selected_model.speed}
                            </Dropdown.Toggle>
                            <Dropdown.Menu onClick={this.changeFile}>
                                {data_files.map((item,index) => (
                                    <Dropdown.Item eventKey={item.name} key={index}>{item.title} {item.speed}</Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                        <div className="m-2">
                            {this.state.histogram_selected?
                                <button title="Litter accumulation" className="btn btn-outline-info" onClick={this.toogleHistogramLayer}>Histogram</button>
                                :
                                <button title="Litter accumulation" className="btn btn-info" onClick={this.toogleHistogramLayer}>Histogram</button>
                            }
                        </div>
                        <BackgroundLayerManager background_layer={this.props.background_layer} map={this.props.map} />
                    </div>

                </div>
                <StatesLayer map={this.props.map}
                             url={data_folder_url}
                             colors_by_country={this.state.colors_by_country}
                             updateTonsByCountry={this.updateTonsByCountry}
                             updateSelectedCountry = {this.updateSelectedCountry}/>
            </nav>
        )
    }
}

export default ParticleVizManager

