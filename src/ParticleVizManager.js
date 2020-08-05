import React from 'react'
import coaps_logo from "./imgs/coaps_logo.png"
import un_logo from "./imgs/un_PNG20.png"
import StatesLayer from "./StatesLayer"
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import Dropdown from "react-bootstrap/Dropdown"
import * as d3 from "d3"
import _ from "underscore"
import TileWMS from "ol/source/TileWMS"
import TileLayer from "ol/layer/Tile"
import $ from "jquery"
import {Bullseye, Download} from "react-bootstrap-icons"
import { isMobile } from "react-device-detect";
import './css/App.css'

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
        colors:["#fde74c","#E24E1B"],
        // colors:["#edc4b3","#774936"],
        // colors:["#e5f5f9","#2ca25f"],
        // colors:["#f0f0f0","#636363"],
        min_max: [1, 130000]},
    asia: {name:'asia',
        // colors:["#F4D941", "#db1b1b"]},
        // colors:["#b76935", "#143642"],
        // colors:["#fefcfb","#0a1128"],
        // colors:["#fefcfb", "#0466c8"],
        // colors:["#fefcfb", "#b3b128"],
        // colors:["#deebf7", "#3182bd"],
        colors:["#92c1ed", "#07487b"],
        // colors:["#d1eeea", "#2a5674"],
        min_max: [1000, 2300000]},
    south_america: {name:'south america',
        colors:["#d3f2a3", "#074050"],
        min_max: [1000, 1000000]},
    europe: {name:'europe',
        // colors:["#ABBDFF","#663177"]},
        // colors:["#e0ecf4","#522888"],
        colors:["#f4d277","#5b2b7e"],
        min_max: [1, 50000]},
    oceania: {name:'oceania',
        colors:["#f0f3bd","#05668d"],
        min_max: [1, 10000000]},
    north_america: {name:'north america',
        // colors:["#45CDE9","#091970"],
        // colors:["#fefcfb","#0a1128"],
        colors:["#fff7bc","#903933"],
        // colors:["#fde0c5","#eb4a40"],
        // colors:["#fef6b5","#e15383"],
        min_max: [1, 30000]},
    seven_seas: {name:'seven seas (open ocean)',
        colors:["#F6FFF8", "#6B9080"],
        min_max: [1, 10000000]},
    antarctica: {name:'antarctica',
        colors:["#E4E7E4", "#111111"],
        min_max: [1, 10000000]},
}

let selected_color = `rgb(255, 0, 0)`

const months = [
    'January', 'February', 'March', 'April', 'May',
    'June', 'July', 'August', 'September',
    'October', 'November', 'December'
]

const def_style = "x-Sst"
// const def_style = "x-Occam
// const def_style = "seq-YlGnBu"
// const def_style = "psu-viridis-inv"
// const def_style = "div-Spectral-inv"
// const def_style = "default-inv"
// const def_style = "div-RdYlGn-inv"
let def_max_pal_value = 3000000
// let data_files = [
//     {
//         id: 1,
//         file: "1/TESTUN_output",
//         // file: "4/JUN22Test_Unbeaching",
//         title: "TEST",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 1,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 2,
//         file: "1/OneYear_Currents_And_Diffusion2020-05-05_16_36_output",
//         title: "OneYear_Currents_And_Diffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 4,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 3,
//         file: "1/OneYear_Currents_Winds_Diffusion2020-05-05_16_36_output",
//         title: "OneYear_Currents_Winds_Diffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 4,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 4,
//         file: "1/OneYear_Only_Currents2020-05-05_16_36_output",
//         title: "OneYear_Only_Currents",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 4,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 5,
//         file: "1/OneYear_Currents_And_Wind2020-05-05_16_36_output",
//         title: "OneYear_Currents_And_Wind",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 4,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 6,
//         file: "4/NoWinds_NoDiffusion_2010_01_01",
//         title: "NoWinds_NoDiffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 10,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 7,
//         file: "4/NoWinds_YesDiffusion_2010_01",
//         title: "NoWinds_YesDiffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `nowind_yesdiff/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 10,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 8,
//         file: "4/YesWinds_NoDiffusion_2010_01",
//         title: "YesWinds_NoDiffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `histo_08/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 8,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
//     {
//         id: 9,
//         file: "4/YesWinds_YesDiffusion_2010_01",
//         title: "YesWinds_YesDiffusion",
//         // style:"default-scalar/div-PRGn",
//         // style:"div-PRGn",
//         style:def_style,
//         wms: `yeswind_yesdiff/histo`,
//         speed: "",
//         start_date: new Date(2010, 0, 1),
//         num_files: 8,
//         max_pal: def_max_pal_value,
//         min_pal: 17,
//     },
// ]
let data_files = []
let min_pal = new Array(13).fill(1)
let folder = "4"  // Indicates the subsampling of the particles
if(isMobile){
    folder = "6"
}
for(let i=1; i<=12; i++) { let i_str = `${i < 10 ? '0' + i : i}`
    data_files.push({
        id: i+10,
        file: `${folder}/YesWinds_YesDiffusion_NoUnbeaching_2010_${i_str}`,
        wms: `histo_${i_str}/histo`,
        title: `${months[i-1]} 2010`,
        speed: "",
        style:def_style,
        start_date: new Date(2010, i-1, 1),
        num_files: 1,
        // In each run we have more particles, so we need to change the maximum value on the palette
        // max_pal: parseInt(def_max_pal_value - (def_max_pal_value*i)/(12*5)) ,
        max_pal: (32300 * 31 * ((12 * 5) - i))/100,  // Particles by number of days / X X is subjective
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
        this.displayPalette = this.displayPalette.bind(this)
        this.showHistogramLayer = this.showHistogramLayer.bind(this)

        let histogram_layer = new TileLayer({
            source: this.getHistogramSource(data_files[0]),
            opacity:.8})

        let histogram_selected = true
        histogram_layer.setVisible(histogram_selected)

        // let colors_by_country = new Array().fill("#FFFFFF")
        this.state = {
            colors_by_country: [],
            selected_country: '',
            countries: {},
            selected_model: data_files[0],
            histogram_layer: histogram_layer,
            histogram_selected: histogram_selected,
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
        this.showHistogramLayer()
    }

    updateMapLocation(){
        this.props.map.setSize( [window.innerWidth, window.innerHeight])
        this.showHistogramLayer()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.state.histogram_layer.setSource( this.getHistogramSource(this.state.selected_model))
        this.showHistogramLayer()
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
                    ocean: [], continent: ""
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

    displayPalette(){
        let palette_canvas = document.getElementById("canvas-palette-horbar")
        let palette_container = document.getElementById("div-palette-horbar")

        console.log(this.state.selected_model)

        let barWidth = Math.ceil($(window).width()*.80)
        let barHeight = 15

        let params_pal = {
            request: "GetLegendGraphic",
            height: parseInt(window.innerHeight* .4),
            width:barWidth,
            heigth:15,
            numcolorbands:250,
            colorbaronly:true,
            vertical:false,
            palette:this.state.selected_model.style,
        }

        let url = `${wms_url}?${$.param(params_pal)}`

        //------ Modifying the size of the div container
        $(palette_container).css("WIDTH",barWidth+"px")
        $(palette_container).css("HEIGHT",barHeight+"px")

        let imageObj = new Image()
        imageObj.src = url
		console.log(url)

        let ctx = $(palette_canvas)[0].getContext("2d")
        //------ Modifying the size of the canvas container
        let spaceForUnits = 30;// Space between the black part for units and the rest
        ctx.canvas.width = barWidth+spaceForUnits
        ctx.canvas.height = barHeight

        imageObj.onload = function(){
            ctx.drawImage(imageObj,spaceForUnits,0)
            ctx.globalAlpha = 1
            $(palette_container).show()
            ctx.fillStyle = '#FFFFFF'; //Define color to use
            let pixBellowText = 3;// How many pixels bellow text
            ctx.font= (barHeight-pixBellowText)+"px Arial"

            //How many numbers do we want in the color bar
            // It is not perfect because the ticks function modifies
            // the size of the array depending its parameters
            let totNumbersOrig = 8
            let totNumbers = totNumbersOrig

            // How to calculate the value of the color palette
            // 32300 particles released every month
            // This simulate 6.4 million tons of waste

            // max_pal: (32300 * 31 * ((12 * 5) - i))/100,  // Particles by number of days / X X is subjective
            // ~ total particles in run / 100
            let mt_per_part =(6.4 * 10 ** 6) / 32300

            // let minVal = this.state.selected_model.min_pal
            let minVal = 1
            let maxVal = parseInt(this.state.selected_model.max_pal * mt_per_part)
            //
            //This scale is used to obtain the numbers
            // that are written above the color palette
            let logScaleValues = d3.scaleLog()
                .domain([minVal, maxVal])
                .range([0, 1])

            let logScaleText = new Array(totNumbers + 1)
            let myNumbers = new Array()

            do {
                //This scale is used to obtain the positions
                // where we will writhe the numbers
                logScaleText = d3.scaleLog()
                    .domain([minVal, maxVal])
                    .range([20, barWidth - 20])

                myNumbers = logScaleValues.ticks(totNumbers)
                totNumbers -= 1
            }
            while(myNumbers.length > totNumbersOrig)

            // Obtains the numbers we will write in the color palette

            //Write the units first
            ctx.fillText('Mt',2,Math.ceil(barHeight-pixBellowText))

            //Write the rest of the numbers from the ticks and the positions
            myNumbers.forEach(function(number){
                //console.log(number)
                //console.log(logScaleText(number))
                // The -14 is just to move the letters in the middle
                ctx.fillText(number,logScaleText(number)+spaceForUnits-14,Math.ceil(barHeight-pixBellowText))
            })
        }.bind(this)
    }

    showHistogramLayer(){
        let palette_container = document.getElementById("div-palette-horbar")
        if(this.state.histogram_selected){
            this.displayPalette()
            this.state.histogram_layer.setVisible(true)
        }else{
            $(palette_container).hide()
            this.state.histogram_layer.setVisible(false)
        }
    }

    toogleHistogramLayer(){
        this.setState({
            histogram_selected: !this.state.histogram_selected,
        })
    }

    updateSelectedCountry(name){
        let current_country = this.state.selected_country
        let countries = this.state.countries
        // Not sure in which cases the name comes empty but is not cached at StatesLayer
        // If the name is the same as before then we 'toogle it'
        if((current_country.localeCompare(name) === 0) && (name.length > 2)){
            countries[name.toLowerCase()]['color'] = selected_color
        }
        this.setState({
            selected_country: name,
            countries: countries
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
        // Default color
        let colors = ["#000000", "#000000"]
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
            <nav className="navbar navbar-expand-md navbar-light bg-light">
                {/*------------ Logos ------------------*/}
                <div>
                    <a className="navbar-brand" href="https://www.un.org/en/" >
                        <img src={un_logo} className="rounded"  width="50px" height="50" alt="United Nations"/>
                    </a>
                    <a className="navbar-brand" href="https://www.coaps.fsu.edu/" >
                        <img src={coaps_logo} className="rounded" width="40px" height="40" alt="COAPS"/>
                    </a>
                </div>
                {/*------------ Grouped icons ------------------*/}
                <button className="navbar-toggler" type="button" data-toggle="collapse"
                        data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false"
                        aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                {/*------------ Spinner ------------------*/}
                <div className="navbar-nav" id="loading">
                    <div className="spinner-border" role="status"> </div>
                    <div id="load-perc" className="navbar-brand m-2" ></div>
                </div>
                <div className="collapse navbar-collapse" id="navbarNavAltMarkup" >
                    <div className="navbar-nav">
                        {/* ---------- Particles menu ------------*/}
                        <ParticlesLayer map={this.props.map}
                                        updateCountriesData={this.updateCountriesData}
                                        url={data_folder_url}
                                        colors_by_country={this.state.colors_by_country}
                                        selected_model={this.state.selected_model}/>
                        {/* ---------- Model selection ------------*/}
                        <span className="m-1">
                            <Dropdown className="m-2 d-inline"  title="Release month"  >
                                <Dropdown.Toggle variant="info"  size="sm">
                                    {this.state.selected_model.title} {this.state.selected_model.speed}
                                </Dropdown.Toggle>
                                <Dropdown.Menu onClick={this.changeFile} >
                                    {data_files.map((item,index) => (
                                        <Dropdown.Item eventKey={item.name} key={index}>{item.title} {item.speed}</Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                            {/* ---------- Litter concentration ------------*/}
                            <div className="m-1 d-inline" {...(isMobile?{'data-toggle':"collapse",'data-target':"#navbarNavAltMarkup"}:'')} >
                                    <button title="Litter concentration"
                                            className={`btn ${this.state.histogram_selected?' btn-outline-info':' btn-info'} btn-sm`}
                                                 onClick={this.toogleHistogramLayer}>
                                        <Bullseye />
                                    </button>
                            </div>
                            {/* ---------- Download data ------------*/}
                            <div className="m-1 d-inline">
                                <a title="Download Data"
                                        className="btn  btn-info btn-sm"
                                   // href={`${data_folder_url}/World_litter_stats.tar.xz`}>
                                    href={`${data_folder_url}/ReachedTablesData.tar.xz`}>
                                    <Download />
                                </a>
                            </div>
                            {/* ---------- Background selection ------------*/}
                            <BackgroundLayerManager background_layer={this.props.background_layer} map={this.props.map} />
                            </span>
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

