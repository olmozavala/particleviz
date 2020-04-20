import React from 'react';
import ReactDOM from 'react-dom';
import _ from "underscore"
import Button from 'react-bootstrap/Button'
import {Container} from "react-bootstrap"
import ParticlesLayer from "./ParticlesLayer";

class  MapControls extends React.Component {
    render(){
        <div className="container map-controls">
            <form>
                <ul>
                    <li>
                        <label>
                            Current day:{this.state.time_step}
                            <input type="range" onChange={this.changeDay}
                                   value={this.state.time_step}
                                   min="0" max={this.state.tot_timesteps}
                            />
                            <button onClick={this.renderMapEvent} style={this.state.status == STATUS.playing? {'display':'none'}: {display:'block'}}>Update</button>
                        </label>
                    </li>
                    <li>
                        Display particles: {this.state.particle_max_life} days.
                        <button onClick={this.addLife}>+</button>
                        <button onClick={this.reduceLife}>-</button>
                    </li>
                    <li>
                        Speed: {this.state.speed_hz} frames per seconds.
                        <button onClick={this.increaseSpeed}>+</button>
                        <button onClick={this.reduceSpeed}>-</button>
                    </li>
                </ul>
                <button onClick={this.playPause}>{this.state.status == STATUS.playing? 'Stop': 'Play'}</button>
            </form>
        </div>
    }
}

export default MapControls;
