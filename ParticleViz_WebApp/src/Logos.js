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
        // list of logos
        <>
            <a className="m-2" href="https://olmozavala.github.io/particleviz/">
                <img src={pviz_logo} className="rounded" width="45px" alt="ParticleViz"/>
            </a>
            <a className="m-2" href="https://www.coaps.fsu.edu/">
                <img src={coaps_logo} className="rounded" width="30px" height="30px" alt="COAPS"/>
            </a>
            {logos.map(d => (
              <a className="m-2" href={d['url']} key={d['key']}>
                <img src={props.url+"/data/"+d['img']} className="rounded" height="30px" alt="extraLogo"/>
              </a>
            ))}
        </>
    )
}

class Logos extends React.Component {
    render() {
        if(isMobile ||  window.innerWidth <= 1200) {
            return(
                <> <RenderLogos url={this.props.url}/> </>
            )
        }else{
            return(
                // <div data-intro="Logos"  lassName="logos" data-position="left"> // Example change location
                // <div data-intro="Logos"  lassName="logos" data-position="bottom:50">  // Move the text 50% to the right
                // <div data-intro="Logos"  lassName="logos" data-position="bottom:50,200"> // Move 50% to the right and text twice as far
                <div data-intro="Logos"  className="logos" data-oz-position="6">
                    <RenderLogos url={this.props.url}/>
                </div>
            )
        }
    }
}
export default Logos
