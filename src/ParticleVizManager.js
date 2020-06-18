import React from 'react'
import './css/App.css'
import coaps_logo from "./imgs/coaps_logo.png";
import un_logo from "./imgs/un_PNG20.png"
import StatesLayer from "./StatesLayer"
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import Dropdown from "react-bootstrap/Dropdown"
import * as d3 from "d3"
import _ from "underscore";
import { isMobile } from "react-device-detect";

import TileWMS from "ol/source/TileWMS"
import TileLayer from "ol/layer/Tile";
import $ from "jquery";
import {Bullseye, SkipForwardFill} from "react-bootstrap-icons";
import img_map_osm from "./imgs/osm.jpg";

// const data_folder_url = "http://localhost/data"
const data_folder_url = "http://ozavala.coaps.fsu.edu/data"
// const wms_url = "http://localhost:8080/ncWMS2/wms"
const wms_url = "http://ozavala.coaps.fsu.edu/ncWMS2/wms"
const def_alpha = "FF"
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
        // colors:["#fefcfb","#0a1128"],
        // colors:["#fefcfb", "#0466c8"],
        colors:["#fefcfb", "#03045e"],
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

let selected_color = `rgba(255,0,0,1)`

const months = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September',
    'October', 'November', 'December'
];

let def_max_pal_value = 30000000
// let data_files = [
//     {
//         id: 1,
//         file: "1/TESTUN_output",
//         title: "TEST",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:"x-Sst",
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 1,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     }
// ]
let data_files = []
let num_files = [18, 18, 18, 16, 17, 17, 16, 16, 16, 15]
let min_pal = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

let folder = 4
if(isMobile){folder = 6}

for(let i=3; i<=12; i++) { let i_str = `${i < 10 ? '0' + i : i}`
    data_files.push({
        id: i,
        file: `${folder}/Single_Release_FiveYears_EachMonth_2010_${i_str}`,
        wms: `histo_${i_str}/histo`,
        title: `${months[i-1]} 2010`,
        speed: "",
        style:"x-Sst",
        start_date: new Date(2010, i-1, 1),
        num_files: num_files[i-1],
        max_pal: parseInt(def_max_pal_value- (def_max_pal_value/(12*5))*i ),
        min_pal: min_pal[i]
    })
}

class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props)

        this.updateSelectedCountry= this.updateSelectedCountry.bind(this)
        this.changeFile = this.changeFile.bind(this)
        this.toogleHistogramLayer= this.toogleHistogramLayer.bind(this)
        this.updateMapLocation = this.updateMapLocation.bind(this)
        this.getColorByCountry= this.getColorByCountry.bind(this)
        this.updateTonsByCountry = this.updateTonsByCountry.bind(this) // This one is called by States
        this.updateCountriesData = this.updateCountriesData.bind(this) // This one is called by Particles
        this.updateColors = this.updateColors.bind(this)
        this.initCountries = this.initCountries.bind(this)
        this.getHistogramSource= this.getHistogramSource.bind(this)
        this.updatePaletteRange= this.updatePaletteRange.bind(this)

        let histogram_layer = new TileLayer({
            source: this.getHistogramSource(data_files[0].wms),
            opacity:.8});
        histogram_layer.setVisible(false);

        // let colors_by_country = new Array().fill("#FFFFFF")
        this.state = {
            colors_by_country: [],
            selected_country: '',
            countries: {},
            selected_model: data_files[0],
            histogram_layer: histogram_layer,
            histogram_selected: false,
            max_pal: 10,
            min_pa: 1
        }

        // this.updateMinMax(data_files[0].wms)
        this.props.map.addLayer(histogram_layer)
    }

    getHistogramSource(selected_model){
        let layer = selected_model.wms
        let style= selected_model.style
        let min_val= selected_model.min_pal
        let max_val= selected_model.max_pal
        console.log(selected_model)
        return new TileWMS({
            url:`${wms_url}`,
            params: {
                'LAYERS':layer,
                'TILED':true,
                'STYLES':`default-scalar/${style}`,
                // 'COLORSCALERANGE':'1,503500',
                'NUMCOLORBANDS':250,
                'LOGSCALE':true,
                'COLORSCALERANGE':`${min_val},${max_val}`
            }
        })
    }

    componentDidMount() {
        window.addEventListener("resize", this.updateMapLocation.bind(this))
    }

    updateMapLocation(){
        let view = this.props.map.getView()
        this.props.map.setSize( [window.innerWidth, window.innerHeight])
        let popup = document.getElementById('popup')
        // $(popup).hide();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.state.histogram_layer.setSource( this.getHistogramSource(this.state.selected_model))
        this.updatePaletteRange()
        this.props.map.render()
    }

    updatePaletteRange(){
        let max_pal_el = $(document.getElementById("max_pal_val"))
        let min_pal_el = $(document.getElementById("min_pal_val"))
        let tons_per_part = (32300 * 12)/ (6.4 * 10**6)

        max_pal_el.html(`${(this.state.selected_model.max_pal * tons_per_part / 10**6).toFixed(2)}x10 <sup>6</sup> Mt`)
        min_pal_el.html(`${parseInt(this.state.selected_model.min_pal * tons_per_part / 10**6)} Mt`)
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

    toogleHistogramLayer(){
        let palette = document.getElementById("palette_img")
        let palette_container = document.getElementById("wl-palette")

        let params_pal = {
            request: "GetLegendGraphic",
            height: parseInt(window.innerHeight* .4),
            width:20,
            numcolorbands:250,
            colorbaronly:true,
            vertical:true,
            palette:this.state.selected_model.style,
        }
        let url = `${wms_url}?${$.param(params_pal)}`

        console.log(`Palette url: ${url}`)
        if(this.state.histogram_selected){
            $(palette_container).hide()
            this.state.histogram_layer.setVisible(false)
        }else{
            $(palette).attr("src", url);
            $(palette_container).show()
            this.state.histogram_layer.setVisible(true)
        }

        this.setState({
            histogram_selected: !this.state.histogram_selected,
        })
    }

    // updateMinMax(layer){
        // let params_minmax = {
        //     request: "GetMetadata",
        //     item: "minmax",
        //     layers: layer,
        //     version: "1.1.1",
        //     srs: "EPSG:4326",
        //     BBOX: "-180,-90,180,90",
        //     width: 20,
        //     height: 1
        // }
        // let url_minmax = `${wms_url}?${$.param(params_minmax)}`
        // console.log(`Palette minmax: ${url_minmax}`)
        // fetch(url_minmax)
        //     .then(res => res.json())
        //         .then(minmax_txt => {
        //             let min_val = minmax_txt.min
        //             let max_val = minmax_txt.max
        //             $(document.getElementById("max_pal_val")).text(`${max_val} \n tons`)
        //             $(document.getElementById("min_pal_val")).text(`${min_val} \n tons`)
        //             this.setState({
        //                 min_pal: min_val,
        //                 max_val: max_val
        //             })
        //         })
    // }

    updateSelectedCountry(name){
        let current_country = this.state.selected_country
        // Not sure in which cases the name comes empty but is not cached at StatesLayer
        // If the name is the same as before then we 'toogle it'
        if((current_country.localeCompare(name) === 0) && (name.length > 2)){
            this.state.countries[name.toLowerCase()]['color'] = selected_color
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
            selected_model: new_selected_model,
        })
        e.preventDefault()
    }

    render(){
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand" href="https://www.un.org/en/" >
                    <img src={un_logo} className="rounded"  width="50px" height="50"/>
                </a>
                <a className="navbar-brand" href="https://www.coaps.fsu.edu/" >
                    <img src={coaps_logo} className="rounded" width="40px" height="40"/>
                </a>
                <button className="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="navbar-nav" id="loading">
                    <div className="spinner-border" role="status"> </div>
                    <a id="load-perc" className="navbar-brand m-2" ></a>
                </div>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup" >
                    <div className="navbar-nav">
                        {/*--------- All particles menus (trail size, particle size, animation controls)-----------*/}
                        <ParticlesLayer map={this.props.map}
                                        updateCountriesData={this.updateCountriesData}
                                        url={data_folder_url}
                                        colors_by_country={this.state.colors_by_country}
                                        selected_model={this.state.selected_model}/>

                        {/*--------- Model file selection -----------*/}
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

                        {/*--------- ncwms layer selection -----------*/}
                        <div className="m-2" {...(isMobile?{'data-toggle':"collapse",'data-target':"#navbarNavAltMarkup"}:'')} >
                            <button title="Litter concentration" className={`btn ${this.state.histogram_selected?' btn-outline-info':' btn-info'}  `}
                                    onClick={this.toogleHistogramLayer}>
                                <Bullseye />
                            </button>
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

