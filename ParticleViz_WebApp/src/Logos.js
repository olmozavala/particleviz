import React from 'react'
import coaps_logo from "./imgs/coaps_logo.png"
import pviz_logo from "./imgs/logo_notxt_sm.png"
import { isMobile } from "react-device-detect"
import './css/App.css'

const config_pviz = require("./Config.json")
const config_webapp = config_pviz.webapp


let logos = []
if(typeof config_webapp["logos"] !== "undefined") {
    logos = config_webapp["logos"]
    for (const key of logos.keys()) {
        logos[key]['key'] = key
    }
}

function RenderLogos(props){
    return (
        /*------------ Logos ------------------*/
        <>
            <a className="navbar-brand" href="https://olmozavala.github.io/particleviz/">
                <img src={pviz_logo} className="rounded" width="30px" alt="ParticleViz"/>
            </a>
            <a className="navbar-brand" href="https://www.coaps.fsu.edu/">
                <img src={coaps_logo} className="rounded" width="30px" height="30px" alt="COAPS"/>
            </a>
            {logos.map(d => (
                <a className="navbar-brand" href={d['url']} key={d['key']} alt="">
                    <img src={props.url+"//"+"data/"+d['img']} className="rounded" height="30px"/>
                </a> ))}
        </>
    )
}
class  Logos extends React.Component {
    constructor(props) { super(props) }

    render() {
        // if(isMobile ||  window.innerWidth <= 1200) {
        if(isMobile ||  window.innerWidth <= 1200) {
            return(
                <> <RenderLogos url={this.props.url}/> </>
            )
        }else{
            return(
                <div data-intro="Logos" data-position="bottom" className="logos"> <RenderLogos url={this.props.url}/> </div>
            )
        }
    }
}
export default Logos
