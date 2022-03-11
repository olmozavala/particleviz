import React from 'react'
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import Logos from "./Logos";
import _ from "underscore"
import $ from "jquery"
import {QuestionCircle, House, List} from "react-bootstrap-icons"
import {Collapse, Row, Col, Container, Button, Dropdown}  from "react-bootstrap";
import { isMobile } from "react-device-detect";
import './css/App.css'

const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp
const config_adv = config_pviz.advanced
const datasets = config_adv["datasets"]

let models = []
// Indicates the subsampling level of the particles

const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)

// console.log(datasets)
for (const [key, c_dataset] of Object.entries(datasets)) {
    let folder = c_dataset["subsample"]["desktop"]
    if(isMobile){
        folder = c_dataset["subsample"]["mobile"]
    }
    models.push({
        id: key,
        name: capitalize(c_dataset["name"]),
        file: `${folder}/${c_dataset["file_name"]}`,
        num_files: c_dataset["total_files"],
        time_steps : config_adv["timesteps_by_file"],
    })
}


class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props)

        this.updateMapLocation = this.updateMapLocation.bind(this)
        this.toggleHelp= this.toggleHelp.bind(this)
        this.setOpen = this.setOpen.bind(this)
        this.updateSelectedModel = this.updateSelectedModel.bind(this)

        this.state = {
            countries: {},
            selected_model: models[0],
            chardin: this.props.chardin,
            particle_color:  config_webapp['particles-color'],
            open: false
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
         * Selects a new monthly release
         * @type {*[]}
         */
        let new_selected_model = []
        for(let i = 0; i < models.length; i++){
            if(models[i].name.toLowerCase().trim() === e.target.text.toLowerCase().trim()){
                new_selected_model = models[i]
                break
            }
        }
        console.log("New model",new_selected_model)
        this.setState({
            selected_model: new_selected_model,
        })
        e.preventDefault()
    }

    setOpen(){
        this.setState({
            open: !this.state.open
        })
    }

    toggleHelp() {
        this.state.chardin.refresh()
        this.state.chardin.toggle()
    }

    render(){
        if(isMobile ||  window.innerWidth <= 1200){
        // if(true){
            // --------------------- MOBILE  or < 1200---------------------------------
            return (
                <Container fluid >
                    <Row className={`bg-light py-1`}>
                        <Col xs={10} >
                            <Logos url={this.props.url}/>
                            {/* ---------- Home ------------*/}
                             <Button variant="info" size={"sm"} className={"ml-auto"}
                                     href={config_webapp['url']}>
                                <House/>
                            </Button>
                        </Col>
                        {/* ---------- Info ------------*/}
                        <Col xs={2} >
                            <Button
                                className={"m-1"}
                                size={"sm"}
                                variant={"info"}
                                onClick={() => this.setOpen()}
                                aria-controls="col_content"
                                aria-expanded={this.state.open} >
                                <List />
                            </Button>
                        </Col>
                    </Row>
                    <Collapse in={this.state.open} >
                        <Container fluid id={"col_content"} className={"mt-4"}>
                            <Row className={`bg-light p-2`} >
                                {/* ---------- Background selection ------------*/}
                                <Col xs={6}> <span className={"m-1"}>Background</span> </Col>
                                <Col xs={{span:5, offset:1}}>
                                    <BackgroundLayerManager background_layer={this.props.background_layer}
                                                            map={this.props.map}
                                                            url={this.props.url}/>
                                </Col>
                            </Row>
                            <Row className={`bg-light p-2`} >
                                {/* ---------- Model selection ------------*/}
                                <Col xs={6}> <span className={"m-1"}>Model</span> </Col>
                                <Col xs={{span:5, offset:1}}>
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
                            <Row className={`bg-light`} >
                                <Col xs={12}>
                                    {/*---------- All options from particles ------------*/}
                                    <ParticlesLayer map={this.props.map}
                                                    url={this.props.url}
                                                    chardin={this.state.chardin}
                                                    particle_color={this.state.particle_color}
                                                    selected_model={this.state.selected_model}/>
                                </Col>
                            </Row>
                        </Container>
                    </Collapse >
                </Container>
            )
        }else {
            // --------------------- DESKTOP ---------------------------------
            return (
                <nav className="navbar navbar-expand-lg navbar-light bg-light pt-0 pb-0">
                    {/* ---------- Logos ------------*/}
                    <Logos url={this.props.url}/>
                    {/* ---------- Home ------------*/}
                    <span className="m-2" data-intro="Main site" data-position="bottom">
                            <div className="m-1 d-inline">
                                <a title="Home" className="btn  btn-info btn-sm"
                                   href={config_webapp['url']}>
                                    <House/>
                                </a>
                            </div>
                        </span>
                    {/*------------ Grouped icons ------------------*/}
                    <button className="navbar-toggler" type="button" data-toggle="collapse"
                            data-target="#collapseNavMain" aria-controls="collapseNavMain" aria-expanded="false"
                            aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    {/*------------ Collapsible navbar------------------*/}
                    <div className="collapse navbar-collapse" id="collapseNavMain">
                        {/* ---------- Particles menu ------------*/}
                        <div className="navbar-nav">
                            {/* ---------- All options from particles ------------*/}
                            <ParticlesLayer map={this.props.map}
                                            url={this.props.url}
                                            chardin={this.state.chardin}
                                            particle_color={this.state.particle_color}
                                            selected_model={this.state.selected_model}/>
                            {/* ---------- Background selection ------------*/}
                            <span className="navbar-brand my-2" data-intro="Map Background" data-position="bottom:0,200">
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
                            <span className="navbar-brand mt-2" data-intro="Model Selection" data-position="bottom">
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
                            </span>
                            {/* ---------- Help toggle ------------*/}
                            <span className="navbar-brand my-2" data-intro="Help" data-position="bottom">
                                    <div className="m-1 d-inline">
                                        <button title="Help" className="btn btn-info btn-sm" onClick={this.toggleHelp}>
                                            <QuestionCircle/>
                                        </button>
                                    </div>
                                </span>
                        </div>
                    </div>
                </nav>
            )
        }
    }
}

export default ParticleVizManager
