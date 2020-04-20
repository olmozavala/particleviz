import React from 'react';
import './css/App.css';
import './css/Animations.css';
import * as d3 from "d3"
import ImageLayer from "ol/layer/Image";
import ImageCanvasSource from "ol/source/ImageCanvas";
import {fromLonLat, toLonLat} from "ol/proj";
import {getCenter, getWidth} from "ol/extent";
import _ from "underscore";
import 'animate.css'
import 'open-iconic/font/css/open-iconic-bootstrap.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBackward,
    faForward,
    faMinus,
    faPause,
    faPlus,
    faStepBackward
} from '@fortawesome/free-solid-svg-icons'


import JSZip from "jszip";
import {faPlay} from "@fortawesome/free-solid-svg-icons/faPlay";
import {faStepForward} from "@fortawesome/free-solid-svg-icons/faStepForward";
import {ButtonGroup} from "react-bootstrap";
var zip = new JSZip();

const STATUS = {
    loading: 0,
    decompressing: 1,
    paused: 2,
    playing: 3,
};

const TRANSPARENCY_LEVELS = {
    1: .001,
    2: .004,
    3: .008,
    4: .03,
    5: .1
};

const PARTICLE_SIZES= {
    1: .3,
    2: .7,
    3: 1,
    4: 2,
    5: 3,
};

// Modes in how to increase/decrase a variable
const MODES={
    increase:1,
    decrease:2
}

const DRAW_LAST_DAYS = 40;
const MAX_ANIMATION_SPEED = 25;

class  ParticlesLayer extends React.Component {
    constructor(props) {
        super(props);
        console.log(`Constructor ParticlesLayer, Properties: `, this.props);

        // Setting up d3 objects
        this.d3Projection = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3ProjectionEast = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3ProjectionWest = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3GeoGenerator = d3.geoPath().projection(this.d3Projection);
        this.d3GeoGeneratorEast = d3.geoPath().projection(this.d3ProjectionEast);
        this.d3GeoGeneratorWest = d3.geoPath().projection(this.d3ProjectionWest);
        this.d3canvas = d3.select("#particle_canvas");
        // https://github.com/d3/d3-time-format
        this.dateFormat = d3.timeFormat("%B %e, %Y ");

        this.state = {
            time_step: 0,
            speed_hz: 10,
            transparency_index: 3,
            status: STATUS.loading,
            particle_size_index: 3,
            selected_model: this.props.selected_model,
            canvas_layer: -1
        };
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.draw_until_day = true; // Used to redraw all the positions until current time

        this.getFeatures = this.getFeatures.bind(this);
        this.getFeaturesAsLines = this.getFeaturesAsLines.bind(this);
        this.drawLitter = this.drawLitter.bind(this);
        this.drawParticles = this.drawParticles.bind(this);
        this.drawLines = this.drawLines.bind(this);
        this.canvasFunction = this.canvasFunction.bind(this);
        this.drawNextDay = this.drawNextDay.bind(this);
        this.increaseSpeed = this.increaseSpeed.bind(this);
        this.decreaseSpeed = this.decreaseSpeed.bind(this);
        this.increaseSize = this.increaseSize.bind(this);
        this.decreaseSize = this.decreaseSize.bind(this);
        this.updateAnimation = this.updateAnimation.bind(this);
        this.addTransparency = this.addTransparency.bind(this);
        this.readBinaryBlob = this.readBinaryBlob.bind(this);
       this.decreaseTransparency = this.decreaseTransparency.bind(this);
        this.playPause = this.playPause.bind(this);
        this.changeDay = this.changeDay.bind(this);
        this.readData = this.readData.bind(this);
        this.readingRawData = this.readingRawData.bind(this);
        this.clearInterval = this.clearInterval.bind(this);
        this.nextDay = this.nextDay.bind(this);
        this.prevDay = this.prevDay.bind(this);
        this.displayCurrentDay = this.displayCurrentDay.bind(this);
        this.displayTransparency= this.displayTransparency.bind(this);
        this.displayParticleSize= this.displayParticleSize.bind(this);
    }

    readingRawData(data) {
        console.log("Reading data!!!!!!! ", data);
        this.readData(JSON.parse(data));
    }

    /**
     * Main function that reads the json data
     * @param data
     */
    readData(data) {
        console.log("Reading data!!!!!!! ", data);
        this.data = data;

        this.country_keys = Object.keys(this.data);
        this.country_names = this.country_keys.map((x) => x.toLowerCase());
        this.total_timesteps = this.data[this.country_keys[0]]["lat_lon"][0][0].length;

        console.log("\t Total timesteps: ", this.total_timesteps);
        console.log("\t Countries names: ", this.country_names);

        if (this.state.canvas_layer === -1) {
            let canv_lay = new ImageLayer({
                source: new ImageCanvasSource({
                    canvasFunction: this.canvasFunction
                })
            });
            this.setState({
                canvas_layer: canv_lay
            })
            this.props.map.addLayer(canv_lay);
        }
        this.props.updateCountryColors(this.country_names);
    }

    canvasFunction(extent, resolution, pixelRatio, size, projection) {
        // console.log('====================================================');
        // TODO Depending on the extent is which generators we should display
        // console.log(`Canvas Function Extent:${extent}, Res:${resolution}, Size:${size} projection:`, projection);
        var blues = d3.scaleOrdinal(d3.schemeBlues[9]);
        for(let i=0; i < 10; i++){
            console.log(blues(i));
        }

        this.canvasWidth = size[0];
        this.canvasHeight = size[1];
        this.draw_until_day = true; // Used to redraw all the positions until current time

        this.d3canvas = d3.select(document.createElement("canvas"))
        if (this.d3canvas.empty()) {
            // console.log("Initializing canvas");
            this.d3canvas = d3.select(document.createElement("canvas"))
                .attr("id", "particle_canvas");
        }

        this.d3canvas.attr('width', this.canvasWidth).attr('height', this.canvasHeight);
        let ctx = this.d3canvas.node().getContext('2d');
        ctx.lineCap = 'butt';

        this.show_west_map = false;
        this.show_east_map = false;
        if(extent[0] < -180){
            // console.log('Showing west map....');
            this.show_west_map = true;
        }
        if(extent[2] > 180){
            // console.log('Showing east map....');
            this.show_east_map = true;
        }

        if (!_.isUndefined(this.data)) {
            let r = 57.295779513082266; // TODO This needs to be fixed is hardcoded
            let scale = r / (resolution / pixelRatio);
            let center = toLonLat(getCenter(extent), projection);
            this.d3Projection.scale(scale).center(center)
                .translate([this.canvasWidth / 2, this.canvasHeight / 2]);
            let center_west = center.slice();
            center_west[0] += 360;
            this.d3ProjectionWest.scale(scale).center(center_west)
                .translate([this.canvasWidth / 2, this.canvasHeight / 2]);
            let center_east = center.slice();
            center_east[0] -= 360;
            this.d3ProjectionEast.scale(scale).center(center_east)
                .translate([this.canvasWidth / 2, this.canvasHeight / 2]);

            this.d3GeoGenerator = this.d3GeoGenerator.projection(this.d3Projection).context(ctx);
            this.d3GeoGeneratorWest = this.d3GeoGeneratorWest.projection(this.d3ProjectionWest).context(ctx);
            this.d3GeoGeneratorEast = this.d3GeoGeneratorEast.projection(this.d3ProjectionEast).context(ctx);

            if (this.state.status === STATUS.decompressing) {
                this.setState({status: STATUS.paused});
            }
            this.updateAnimation();
        }

        return this.d3canvas.node();
    };

    clearInterval() {
        if (!_.isUndefined(this.interval)) {
            clearInterval(this.interval);
        }
    }

    /**
     * Updates the animation with the current frame rate
     */
    updateAnimation() {
        this.clearInterval();
        // Verify the update was caused by the parent component and we have updated
        // the file to read.
        if (this.selected_mode !== this.props.selected_model) {
            delete this.data;
            this.setState({
                time_step: 0,
                selected_model: this.props.selected_model,
                status: STATUS.loading
            });
            this.selected_mode = this.props.selected_model;
            let url = `${this.props.url}/${this.props.selected_model.file}.zip`;
            d3.blob(url)
                .then(this.readBinaryBlob);
        } else {
            if (this.state.status === STATUS.playing) {
                this.interval = setInterval(() => this.drawNextDay(), (1.0 / this.state.speed_hz) * 1000);
            }
            if (this.state.status === STATUS.paused) {
                let canvas = this.d3canvas.node();
                let ctx = canvas.getContext('2d');
                this.drawLitter(ctx);
            }
        }
    }

    /**
     * Reads a zip file and dispatches the correct function after unziping
     * @param blob
     */
    readBinaryBlob(blob) {
        console.log('File has been received!');
        zip.loadAsync(blob)
            .then(function (zip) {
                // you now have every files contained in the loaded zip
                for (let file in zip.files) {
                    let zipobj = zip.files[file];
                    return zipobj.async("string");
                }
            })
            .then(this.readingRawData);

        this.setState({
            status: STATUS.decompressing
        });
    }

    /**
     * Draws a single day of litter using D3
     */
    drawNextDay() {
        if (this.state.status === STATUS.playing) {
            let canvas = this.d3canvas.node();
            let ctx = canvas.getContext('2d');
            if (this.state.time_step === 0) {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            } else {
                // Make previous frame transparent
                var prev = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = `rgba(255, 255, 255, ${TRANSPARENCY_LEVELS[this.state.transparency_index]})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = prev;
                ctx.fill();
            }

            // Draw next frame
            this.drawLitter(ctx);
            let next_time_step = (this.state.time_step + 1) % this.total_timesteps;
            this.setState({
                time_step: next_time_step
            });
        }
    }

    /**
     * Draws the ocean litter, as particles or as lines
     * @param ctx
     */
    drawLitter(ctx){
        this.drawLines(ctx);
        // this.drawParticles(ctx);
    }

    /**
     * Draws the particles for a single day. It iterates over different countries
     * @param ctx Context of the canvas object to use
     */
    drawParticles(ctx) {
        let countries = this.getFeatures();
        ctx.lineWidth = PARTICLE_SIZES[this.state.particle_size_index];
        for (let i = 0; i < countries.length; i++) {
            ctx.beginPath()
            ctx.fillStyle = this.props.colors_by_country[countries[i].country.toLowerCase()];
            this.d3GeoGenerator({type: 'FeatureCollection', features: countries[i].features});
            this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features});
            this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features});
            ctx.fill();
            ctx.closePath();
        }
        this.props.map.render();
    }

    /**
     * Draws the lines for a single day. It iterates over different countries
     * @param ctx Context of the canvas object to use
     */
    drawLines(ctx) {
        let countries = this.getFeaturesAsLines();
        ctx.lineWidth = PARTICLE_SIZES[this.state.particle_size_index];
        for (let i = 0; i < countries.length; i++) {
            ctx.beginPath()
            ctx.strokeStyle = this.props.colors_by_country[countries[i].country.toLowerCase()];
            this.d3GeoGenerator({type: 'FeatureCollection', features: countries[i].features});
            if(this.show_west_map) {
                this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features});
            }
            if(this.show_east_map) {
                this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features});
            }
            ctx.stroke();
            ctx.closePath();
        }
        this.props.map.render();
    }

    /**
     * Gets the features as points rather than lines.
     * @returns {[]}
     */
    getFeatures() {
        let countries_feature_collection = [];
        // Iterating over countries
        for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
            // console.log(`--------------------- Country: ${cur_country_id} -----------------`);
            let cur_country = this.data[this.country_keys[cur_country_id]];
            let tot_part = cur_country[0].length;
            // console.log("\t tot particles: ", tot_part);

            // Iterating over particles at this time step
            let features_array = [];
            for (let part_id = 0; part_id < tot_part; part_id++) {
                let coordinates = [];
                coordinates.push([parseFloat(cur_country[1][part_id][this.state.time_step]),
                                  parseFloat(cur_country[0][part_id][this.state.time_step])]);
                let single_part_feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "MultiPoint",
                        "coordinates": coordinates
                    }
                };
                features_array.push(single_part_feature);
            }

            let features = {
                "type": "FeatureCollection",
                "features": features_array,
                "country": this.country_names[cur_country_id]
            };
            countries_feature_collection.push(features);
        }

        return countries_feature_collection;
    }

    getFeaturesAsLines() {
        let countries_feature_collection = [];
        // Iterating over countries
        for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
            let cur_country = this.data[this.country_keys[cur_country_id]];
            let tot_part = cur_country["lat_lon"][0].length;
            // console.log("\t tot particles: ", tot_part);

            // Iterating over particles at this time step
            let features_array = [];

            // This if only applies when we are reloading the map, drawing more than a single day.
            if (this.draw_until_day) {
                // Iterate over the particles of this country
                for (let part_id = 0; part_id < tot_part; part_id++) {
                    let coordinates = [];
                    let start_time = Math.max(0, this.state.time_step - DRAW_LAST_DAYS);
                    // Pushes the coordinates of the first position
                    coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][start_time]),
                                      parseFloat(cur_country["lat_lon"][0][part_id][start_time])]);
                    // Pushes all the other particles
                    for (let time_step = start_time; time_step < this.state.time_step; time_step++) {
                        coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][time_step]),
                            parseFloat(cur_country["lat_lon"][0][part_id][time_step])]);
                    }
                    // Make a LineString feature from the coordinates
                    let single_part_feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coordinates
                        }
                    };
                    // PUsh the array of 'this country' into the complete array of features
                    features_array.push(single_part_feature);
                }

            } else {
                // Iterate over all the particles
                for (let part_id = 0; part_id < tot_part; part_id++) {
                    let coordinates = [];
                    // Add the two positions of the current particle
                    coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][this.state.time_step]),
                                      parseFloat(cur_country["lat_lon"][0][part_id][this.state.time_step])]);
                    coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][this.state.time_step + 1]),
                                      parseFloat(cur_country["lat_lon"][0][part_id][this.state.time_step + 1])]);
                    let single_part_feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": coordinates
                        }
                    };
                    features_array.push(single_part_feature);
                }
            }

            let features = {
                "type": "FeatureCollection",
                "features": features_array,
                "country": this.country_names[cur_country_id]
            };
            countries_feature_collection.push(features);
        }


        if (this.draw_until_day) {
            this.draw_until_day = false;
        }
        return countries_feature_collection;
    }

    componentDidMount() {
        this.updateAnimation();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateAnimation();
    }

    /**
     * Generic function to update a variable (size, speed)
     * @param old_value
     * @param mode
     * @param amount
     * @returns {*}
     */
    updateValue(old_value, mode, amount = 1) {
        let new_value = old_value;
        if (mode == MODES.increase) {
            if (old_value >= 1) {
                new_value += amount;
            } else {
                new_value *= 2;
            }
        } else {
            if ((old_value - amount) > 0) {
                new_value -= amount;
            } else {
                new_value /= 2;
            }
        }
        return new_value;
    }

    increaseSpeed(e) {
        let new_speed = this.updateValue(this.state.speed_hz, MODES.increase, 5);
        this.setState({
            speed_hz: new_speed
        });
        console.log(new_speed);
        e.preventDefault();
    }

    decreaseSpeed(e) {
        let new_speed = this.updateValue(this.state.speed_hz, MODES.decrease, 5);
        this.setState({
            speed_hz: new_speed
        });
        e.preventDefault();
    }

    increaseSize(e) {
        let new_size = this.updateValue(this.state.particle_size_index, true);
        this.setState({
            particle_size_index: new_size
        });
        e.preventDefault();
    }

    decreaseSize(e) {
        let new_size = this.updateValue(this.state.particle_size_index, false);
        this.setState({
            particle_size_index: new_size
        });
        e.preventDefault();
    }

    addTransparency(e) {
        let new_life = this.state.transparency_index;
        if (new_life < (Object.keys(TRANSPARENCY_LEVELS).length)) {
            new_life += 1;
        }
        this.setState({
            transparency_index: new_life
        });
        e.preventDefault();
    }

    decreaseTransparency(e) {
        let new_life = this.state.transparency_index;
        if (new_life > 0) {
            new_life -= 1;
        }
        this.setState({
            transparency_index: new_life
        });
        e.preventDefault();
    }

    playPause(e) {
        e.preventDefault();
        if (this.state.status === STATUS.playing) {
            this.setState({
                status: STATUS.paused
            })
        } else {
            this.setState({
                status: STATUS.playing
            })
        }
    }

    changeDay(e) {
        e.preventDefault();
        this.draw_until_day = true;
        this.setState({time_step: parseInt(e.target.value)});
        let canvas = this.d3canvas.node();
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    nextDay(e) {
        e.preventDefault();
        this.setState({time_step: Math.min(this.state.time_step + 1, this.total_timesteps)});
    }

    prevDay(e) {
        e.preventDefault();
        this.draw_until_day = true;
        this.setState({time_step: Math.max(this.state.time_step - 1, 1)});
        let canvas = this.d3canvas.node();
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    displayTransparency(){
        let transparency = <span></span>;
        if(this.state.status == STATUS.playing){
            transparency =
                <span className="navbar-brand"> Transparency: {this.state.transparency_index} {" "}
                    <button className="btn btn-info btn-sm " onClick={this.decreaseTransparency}
                            disabled={this.state.transparency_index == 1}>
                                    <FontAwesomeIcon icon={faMinus} size="xs"/>
                    </button>
                    {" "}
                    <button className="btn btn-info btn-sm" onClick={this.addTransparency}
                            disabled={this.state.transparency_index == (Object.keys(TRANSPARENCY_LEVELS).length)}>
                                    <FontAwesomeIcon icon={faPlus} size="xs"/>
                    </button>
                </span>
        }
        return transparency;
    }

    displayParticleSize(){
        let particleSize= <span></span>;
        if(this.state.status == STATUS.playing){
            particleSize =
                <span className="navbar-brand"> Particle size: {this.state.particle_size_index} {" "}
                    <button className="btn btn-info btn-sm" onClick={this.decreaseSize}
                            disabled={this.state.particle_size_index == 1}>
                            <FontAwesomeIcon icon={faMinus} size="xs"/>
                    </button>
                    {" "}
                    <button className="btn btn-info btn-sm" onClick={this.increaseSize}
                            disabled={this.state.particle_size_index == (Object.keys(PARTICLE_SIZES).length)}>
                            <FontAwesomeIcon icon={faPlus} size="xs"/>
                    </button>
                </span>;
        }
        return particleSize;
    }

    /**
     * Draws the date in the 'title' div. Everytime
     */
    displayCurrentDay() {
        let start_date = this.state.selected_model.start_date;
        let title = d3.select("#title");
        let cur_date = new Date(start_date.getTime() + this.state.time_step *24*3600000);
        title.text(this.dateFormat(cur_date));
    }

    render() {
        this.displayCurrentDay();
        return (
            <span>
                {((this.state.status == STATUS.loading) || (this.state.status == STATUS.decompressing)) ?
                    <div>
                        {this.state.status == STATUS.loading ?
                            <div>
                                <div className="spinner-border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                            :
                            <div className="spinner-border text-secondary" role="status">
                                <span className="sr-only">Processing data...</span>
                            </div>
                        }
                    </div>
                    :
                    <div>
                        {/*---- Transparency ---------*/}
                        {this.displayTransparency()}
                        {/*---- Particle size ---------*/}
                        {this.displayParticleSize()}
                        {/*---- Current day ------------*/}
                        <span className="navbar-brand">
                            <input type="range"
                                   onChange={this.changeDay}
                                   value={this.state.time_step}
                                   min="0" max={this.total_timesteps}/>
                        </span>
                        {/*---- Play/Pause---------*/}
                        <span className="navbar-brand">
                            <ButtonGroup>
                                <button className="btn btn-info btn-sm" type="button" onClick={this.decreaseSpeed}
                                        disabled={this.state.status !== STATUS.playing}>
                                <FontAwesomeIcon icon={faBackward} size="xs"/>
                                </button>
                                <button className="btn btn-info btn-sm" type="button" onClick={this.prevDay}
                                        disabled={this.state.status !== STATUS.paused}>
                                <FontAwesomeIcon icon={faStepBackward} size="xs"/>
                                </button>
                                <button className="btn btn-info btn-sm"
                                        onClick={this.playPause}>{this.state.status === STATUS.playing ?
                                    <FontAwesomeIcon icon={faPause} size="xs"/> :
                                    <FontAwesomeIcon icon={faPlay} size="xs"/>}
                                </button>
                                <button className="btn btn-info btn-sm" onClick={this.nextDay}
                                        disabled={this.state.status !== STATUS.paused}>
                                <FontAwesomeIcon icon={faStepForward} size="xs"/>
                                </button>
                                <button className="btn btn-info btn-sm" onClick={this.increaseSpeed}
                                        disabled={(this.state.status !== STATUS.playing) ||
                                        (this.state.speed_hz >= MAX_ANIMATION_SPEED)}>
                                <FontAwesomeIcon icon={faForward} size="xs"/>
                                </button>
                            </ButtonGroup>
                        </span>
                    </div>
                }
            </span>
        );
    }
}

export default ParticlesLayer ;
{/*---- Speed ---------*/}
{/*<div className="row">*/}
{/*    <div className="col-12">*/}
{/*        Animation speed: {this.state.speed_hz} hz*/}
{/*    </div>*/}
{/*</div>*/}
