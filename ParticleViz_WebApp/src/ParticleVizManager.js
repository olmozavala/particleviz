import React from 'react'
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import Logos from "./Logos";
import _ from "underscore"
import $ from "jquery"
import {QuestionCircle, House, List} from "react-bootstrap-icons"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import {Collapse, Row, Col, Container, Button, Dropdown}  from "react-bootstrap";
import { isMobile } from "react-device-detect";
import './css/App.css'

const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp
const config_adv = config_pviz.advanced
const datasets = config_adv["datasets"]
const default_size = 15 // fontsize
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)
let models = []

// console.log(datasets)
// This index is TIGHTLY related with the index generated at the preprocessing
// step to generate the color scheme files
let id_dataset = 0
for (const c_obj of datasets) {
    for (const c_dataset of Object.values(c_obj)) {
        let folder = c_dataset["subsample"]["desktop"]
        if (isMobile) {
            folder = c_dataset["subsample"]["mobile"]
        }
        models.push({
            id: id_dataset,
            name: capitalize(c_dataset["name"]),
            file: `data/${folder}/${c_dataset["file_name"]}`,
            num_files: c_dataset["total_files"],
            time_steps: config_adv["timesteps_by_file"],
            color_scheme: c_dataset["color_scheme"]
        })
    }
    id_dataset ++
}


class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props)

        this.updateMapLocation = this.updateMapLocation.bind(this)
        this.toggleHelp= this.toggleHelp.bind(this)
        this.toogleMobileMenu = this.toogleMobileMenu.bind(this)
        this.updateSelectedModel = this.updateSelectedModel.bind(this)

        this.state = {
            countries: {},
            selected_model: models[0],
            chardin: this.props.chardin,
            particle_color:  config_webapp['particles_color'],
            show_menu: false
        }
    }

    componentDidMount() {
        window.addEventListener('resize', function(){
            this.updateMapLocation()
            this.state.chardin.stop()
        }.bind(this) )
        // TODO search a better place to do this part
        $("body").on('chardinJs:start', function(){ $("#intro_text").show() })
        $("body").on('chardinJs:stop', function(){ $("#intro_text").hide() })
        if(!isMobile){
            this.state.chardin.start()
        }

        //TODO this is a patch for the collapse nabvar to hide the titles
        $('#collapseNavMain').on('show.bs.collapse', function() {
            $('.pv-title').hide()
        });
        $('#collapseNavMain').on('hidden.bs.collapse', function() {
            $('.pv-title').show()
        });
    }

    updateMapLocation(){
        this.props.map.setSize( [window.innerWidth, window.innerHeight])
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
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

    updateSelectedModel(e){
        /**
         * Select one of the available models
         */
        let new_selected_model = []
        for(let i = 0; i < models.length; i++){
            if(models[i].name.toLowerCase().trim() === e.target.text.toLowerCase().trim()){
                new_selected_model = models[i]
                break
            }
        }
        // console.log("New model",new_selected_model)
        this.setState({
            selected_model: new_selected_model,
        })
        e.preventDefault()
    }

    toogleMobileMenu(){
        this.setState({
            show_menu: !this.state.show_menu
        })
    }

    toggleHelp() {
        this.state.chardin.refresh()
        this.state.chardin.toggle()
    }

    render(){
        if(isMobile ||  window.innerWidth < 992){
        // if(true){
            return (
                <Container fluid >
                    <Row className={`bg-light py-1`}>
                        <Col xs={10} >
                            <Logos url={this.props.url}/>
                            {/* ---------- Home ------------*/}
                             <Button variant="info" size={"sm"} className={"ms-auto"}
                                     href={config_webapp['url']}>
                                <House/>
                            </Button>
                        </Col>
                        {/* ---------- Burger Menu ------------*/}
                        <Col xs={2} >
                            <Button
                                className={"m-1"}
                                size={"sm"}
                                variant={"info"}
                                onClick={() => this.toogleMobileMenu()}
                                aria-controls="col_content"
                                aria-expanded={this.state.show_menu} >
                                <List />
                            </Button>
                        </Col>
                    </Row>
                    <Collapse in={this.state.show_menu} >
                        <Container fluid id={"col_content"} className={"mt-1"}>
                            <Row className={`bg-light px-2 py-1`} >
                                {/* ---------- Background selection ------------*/}
                                <Col xs={7}> <span className={"m-1"}>Background</span> </Col>
                                <Col xs={{span:4, offset:1}}>
                                    <BackgroundLayerManager background_layer={this.props.background_layer}
                                                            map={this.props.map}
                                                            url={this.props.url}/>
                                </Col>
                            </Row>
                            <Row className={`bg-light px-2 py-1`} >
                                {/* ---------- Model selection ------------*/}
                                <Col xs={7}> <span className={"m-1"}>Model</span> </Col>
                                <Col xs={{span:4}}>
                                    <Dropdown className="mt-2 d-inline" title="Release month">
                                        <Dropdown.Toggle variant="info" size="sm">
                                            {this.state.selected_model.name}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu onClick={this.updateSelectedModel}>
                                            {models.map((item, index) => (
                                                <Dropdown.Item eventKey={item.name}
                                                               key={index}>{item.name} </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Col>
                            </Row>
                            <Row className={`bg-light mb-1`} >
                                <Col xs={12}>
                                    {/*---------- All options from particles ------------*/}
                                    <ParticlesLayer map={this.props.map}
                                                    url={this.props.url}
                                                    chardin={this.state.chardin}
                                                    particle_color={this.state.particle_color}
                                                    selected_model={this.state.selected_model}
                                    />
                                </Col>
                            </Row>
                        </Container>
                    </Collapse >
                </Container>
            )
        }else {
            // --------------------- DESKTOP ---------------------------------
            let chardin_offset = 2
            return (
            <span>
                <nav className="navbar navbar-expand-md navbar-light bg-light justify-content-center">
                    {/* ---------- Logos ------------*/}
                    <span className="navbar-brand align-middle">
                        <Logos url={this.props.url}/>
                    </span>
                    {/* ---------- Home ------------*/}
                    <span className="navbar-brand align-middle" data-intro="Main" data-oz-position={chardin_offset}>
                        <OverlayTrigger
                            placement="bottom"
                            delay={{show: 1, hide: 1}}
                            overlay={(props) => (<Tooltip id="tooltip_home_icon" {...props}> Home</Tooltip>)}>
                            <a className="btn btn-info btn-sm" href={config_webapp['url']} role="button">
                                <House size="14px"/>
                            </a>
                        </OverlayTrigger>
                    </span>
                    {/* ---------- Particles menu ------------*/}
                    {/* ---------- All options from particles ------------*/}
                    <span className="navbar-brand align-middle"> {/* data-intro="Particles" */}
                        <ParticlesLayer map={this.props.map}
                                        url={this.props.url}
                                        chardin={this.state.chardin}
                                        particle_color={this.state.particle_color}
                                        selected_model={this.state.selected_model}/>
                    </span>
                    {/* ---------- Background selection ------------*/}
                    <span className="navbar-brand align-middle" data-intro="Map Style" data-oz-position={chardin_offset} >
                        <BackgroundLayerManager background_layer={this.props.background_layer}
                                                map={this.props.map}
                                                url={this.props.url}/>
                    </span>
                    {/*/!* ---------- Stats button ------------*!/*/}
                    {/*<span className="navbar-brand my-2" data-intro="Help" data-position="bottom">*/}
                    {/*        <div className="m-1 d-inline">*/}
                    {/*            <button title="Statistics" className="btn btn-info btn-sm">*/}
                    {/*                <Activity/>*/}
                    {/*            </button>*/}
                    {/*        </div>*/}
                    {/*    </span>*/}
                    {/* ---------- Model selection ------------*/}
                    <span className="navbar-brand align-middle" >
                        <OverlayTrigger placement="right" delay={{show: 1, hide: 1}} overlay={(props) => (<Tooltip id="tooltip_mod_sel" {...props}> Datasets</Tooltip>)}>
                            <Dropdown className="d-inline me-1" data-intro="Model Selection" data-oz-position={chardin_offset + 10} >
                                <Dropdown.Toggle variant="info" size="sm">
                                    {this.state.selected_model.name}
                                </Dropdown.Toggle>
                                <Dropdown.Menu onClick={this.updateSelectedModel}>
                                    {models.map((item, index) => (
                                        <Dropdown.Item eventKey={item.name}
                                                       key={index}>{item.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </OverlayTrigger>
                        {/* ---------- Help toggle ------------*/}
                        <OverlayTrigger placement="bottom" delay={{show: 1, hide: 1}} overlay={(props) => (<Tooltip id="tooltip_help" {...props}> Help </Tooltip>)}>
                            <button className="btn btn-info btn-sm" onClick={this.toggleHelp} data-intro="Help"  data-oz-position={chardin_offset + 5}>
                                <QuestionCircle size={default_size}/>
                            </button>
                        </OverlayTrigger>
                    </span>
                </nav>
            </span>
            )
        }
    }
}

export default ParticleVizManager
