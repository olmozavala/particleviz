import React from 'react'
import coaps_logo from "./imgs/coaps_logo.png"
import StatesLayer from "./StatesLayer"
import ParticlesLayer from "./ParticlesLayer"
import BackgroundLayerManager from "./BackgroundLayerManager"
import _ from "underscore"
import $ from "jquery"
import {QuestionCircle, House, List} from "react-bootstrap-icons"
import {Collapse, Row, Col, Container, Button}  from "react-bootstrap";
import { isMobile } from "react-device-detect";
import './css/App.css'
const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp

let data_files = []
// Indicates the subsampling level of the particles
let folder = config_webapp["desktop-subsample"]
if(isMobile){
    folder = config_webapp["mobile-subsample"]
}

data_files.push({
    id: 1,
    file: `${folder}/ParticleViz`,
    // start_date: new Date(config_webapp['star-date']),
    // start_date: new Date("2010-10-10"),
    start_date: new Date(2010,10,10,5),
    num_files: 4,
})

class  ParticleVizManager extends React.Component{
    constructor(props){
        super(props)

        this.updateMapLocation = this.updateMapLocation.bind(this)
        this.toggleHelp= this.toggleHelp.bind(this)
        this.setOpen = this.setOpen.bind(this)

        this.data_folder_url = this.props.url

        this.state = {
            countries: {},
            selected_model: data_files[0],
            chardin: this.props.chardin,
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
            $('.wl-title').hide()
        });
        $('#collapseNavMain').on('hidden.bs.collapse', function() {
            $('.wl-title').show()
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
            // --------------------- MOBILE  or < 1200---------------------------------
            return (
                <Container fluid>
                    <Row className={`bg-light py-1`}>
                        <Col xs={5}>
                            {/*------------ Logos ------------------*/}
                            <a href="https://www.coaps.fsu.edu/">
                                <img src={coaps_logo} className="rounded" width="35px" alt="COAPS"/>
                            </a>
                        </Col>
                        <Col>
                        {/* ---------- Home ------------*/}
                            <Button variant="info" size={"sm"} className={"m-1"}
                                    href="https://github.com/olmozavala/particle_viz">
                                <House/>
                            </Button>
                        </Col>
                        {/* ---------- Info ------------*/}
                        <Col xs={2}>
                            <Button
                                className={"m-1"}
                                size={"sm"}
                                variant={"info"}
                                onClick={() => this.setOpen()}
                                aria-controls="col_content"
                                aria-expanded={this.state.open}
                            >
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
                                                            map={this.props.map}/>
                                </Col>
                            </Row>
                            <Row className={`bg-light`} >
                                <Col xs={12}>
                                    {/*---------- All options from particles ------------*/}
                                    <ParticlesLayer map={this.props.map}
                                                    url={this.data_folder_url}
                                                    chardin={this.state.chardin}
                                                    selected_model={this.state.selected_model}/>
                                </Col>
                            </Row>
                        </Container>
                    </Collapse >
                    <StatesLayer map={this.props.map}
                                 url={this.data_folder_url}/>
                </Container>
            )
        }else {
            // --------------------- DESKTOP ---------------------------------
            return (
                <nav className="navbar navbar-expand-lg navbar-light bg-light pt-0 pb-0">
                    {/*------------ Logos ------------------*/}
                    <div data-intro="Logos" data-position="bottom" className="logos">
                        <a className="navbar-brand" href="https://www.coaps.fsu.edu/">
                            <img src={coaps_logo} className="rounded" width="30px" height="30px" alt="COAPS"/>
                        </a>
                    </div>
                    {/* ---------- Home ------------*/}
                    <span className="m-2" data-intro="Main site" data-position="bottom">
                            <div className="m-1 d-inline">
                                <a title="Home" className="btn  btn-info btn-sm"
                                   href="https://github.com/olmozavala/particle_viz">
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
                                            url={this.data_folder_url}
                                            chardin={this.state.chardin}
                                            selected_model={this.state.selected_model}/>
                            {/* ---------- Background selection ------------*/}
                            <span className="navbar-brand my-2" data-intro="Map Background" data-position="bottom:0,200">
                                <BackgroundLayerManager background_layer={this.props.background_layer}
                                                        map={this.props.map}/>
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
                    <StatesLayer map={this.props.map}
                                 url={this.data_folder_url} />
                </nav>
            )
        }
    }
}

export default ParticleVizManager

