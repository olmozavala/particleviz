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
let experiments = []

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
        const data_folder = c_dataset["data_folder"]
        const file_base = data_folder
            ? `data/${data_folder}/${folder}/${c_dataset["file_name"]}`
            : `data/${folder}/${c_dataset["file_name"]}`
        experiments.push({
            id: id_dataset,
            name: capitalize(c_dataset["name"]),
            data_folder: data_folder || "",
            file: file_base,
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
        this.updateSelectedExperiment = this.updateSelectedExperiment.bind(this)

        this.state = {
            countries: {},
            selected_experiment: experiments[0],
            chardin: this.props.chardin,
            particle_color:  config_webapp['particles_color'],
            show_menu: false
        }
    }

    componentDidMount() {
        window.addEventListener('resize', function(){
            this.updateMapLocation()
            this.state.chardin.stop()
            $("#layers").css("max-height", `${parseInt(window.innerHeight*.9)}px`)
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

    updateSelectedExperiment(e){
        /**
         * Select one of the available experiments
         */
        let new_selected_experiment = []
        for(let i = 0; i < experiments.length; i++){
            if(experiments[i].name.toLowerCase().trim() === e.target.text.toLowerCase().trim()){
                new_selected_experiment = experiments[i]
                break
            }
        }
        this.setState({
            selected_experiment: new_selected_experiment,
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
                                {/* ---------- Experiment selection ------------*/}
                                <Col xs={7}> <span className={"m-1"}>Experiment</span> </Col>
                                <Col xs={{span:4}}>
                                    <Dropdown className="mt-2 d-inline" title="Release month">
                                        <Dropdown.Toggle variant="info" size="sm">
                                            {this.state.selected_experiment.name}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu onClick={this.updateSelectedExperiment}>
                                            {experiments.map((item, index) => (
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
                                                    selected_experiment={this.state.selected_experiment}
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
            <Container fluid className="bg-light pv-desktop-toolbar py-1">
                <Row className="align-items-center g-2">
                    <Col xs="auto" className="pv-toolbar-item">
                        <Logos url={this.props.url}/>
                    </Col>
                    <Col xs="auto" className="pv-toolbar-item" data-intro="Main" data-oz-position={chardin_offset}>
                        <OverlayTrigger
                            placement="bottom"
                            delay={{show: 1, hide: 1}}
                            overlay={(props) => (<Tooltip id="tooltip_home_icon" {...props}> Home</Tooltip>)}>
                            <a className="btn btn-info btn-sm" href={config_webapp['url']} role="button">
                                <House size="14px"/>
                            </a>
                        </OverlayTrigger>
                    </Col>
                    <Col xs={12} xl className="pv-toolbar-item pv-toolbar-particles">
                        <ParticlesLayer map={this.props.map}
                                        url={this.props.url}
                                        chardin={this.state.chardin}
                                        particle_color={this.state.particle_color}
                                        selected_experiment={this.state.selected_experiment}/>
                    </Col>
                    <Col xs="auto" className="pv-toolbar-item" data-intro="Map Style" data-oz-position={chardin_offset}>
                        <BackgroundLayerManager background_layer={this.props.background_layer}
                                                map={this.props.map}
                                                url={this.props.url}/>
                    </Col>
                    <Col xs="auto" className="pv-toolbar-item">
                        <OverlayTrigger placement="right" delay={{show: 1, hide: 1}} overlay={(props) => (<Tooltip id="tooltip_exp_sel" {...props}> Experiments</Tooltip>)}>
                            <Dropdown className="d-inline me-1" data-intro="Experiment Selection" data-oz-position={chardin_offset + 10} >
                                <Dropdown.Toggle variant="info" size="sm">
                                    {this.state.selected_experiment.name}
                                </Dropdown.Toggle>
                                <Dropdown.Menu onClick={this.updateSelectedExperiment}>
                                    {experiments.map((item, index) => (
                                        <Dropdown.Item eventKey={item.name}
                                                       key={index}>{item.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </OverlayTrigger>
                        <OverlayTrigger placement="bottom" delay={{show: 1, hide: 1}} overlay={(props) => (<Tooltip id="tooltip_help" {...props}> Help </Tooltip>)}>
                            <button className="btn btn-info btn-sm" onClick={this.toggleHelp} data-intro="Help"  data-oz-position={chardin_offset + 5}>
                                <QuestionCircle size={default_size}/>
                            </button>
                        </OverlayTrigger>
                    </Col>
                </Row>
            </Container>
            )
        }
    }
}

export default ParticleVizManager
