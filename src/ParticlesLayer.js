import React from 'react';
import './css/App.css';
import './css/Animations.css';
import * as d3 from "d3"
import ImageLayer from "ol/layer/Image";
import ImageCanvasSource from "ol/source/ImageCanvas";
import {toLonLat} from "ol/proj";
import {getCenter} from "ol/extent";
import _ from "underscore";
import 'animate.css'
import {
    ArrowRight, CircleFill, Plus, Dash,
    PlayFill, PauseFill,
    SkipBackwardFill, SkipForwardFill,
    SkipEndFill, SkipStartFill,
} from 'react-bootstrap-icons';

import {Form, ProgressBar} from "react-bootstrap";

import JSZip from "jszip";
// import {faPlay} from "@fortawesome/free-solid-svg-icons/faPlay";
// import {faStepForward} from "@fortawesome/free-solid-svg-icons/faStepForward";
// import {ButtonGroup, OverlayTrigger, Tooltip} from "react-bootstrap";
import {ButtonGroup} from "react-bootstrap";
var zip = new JSZip();

const default_size = 15;
const STATUS = {
    loading: 0,
    decompressing: 1,
    paused: 2,
    playing: 3,
};

// How much transparency should we add
const TRAIL_SIZE = {
    1: .006,
    2: .016,
    3: .032,
    4: .12,
    5: .4
};

const PARTICLE_SIZES= {
    1: .6,
    2: 1.4,
    3: 2,
    4: 4,
    5: 6,
};

// const PARTICLE_SIZE_TXT = {
//     1: 'Biggest ',
//     2: 'Bigger  ',
//     3: 'Default ',
//     4: 'Smaller ',
//     5: 'Smallest'
// };

// Modes in how to increase/decrase a variable
const MODES={
    increase:1,
    decrease:2
}

const DRAW_LAST_DAYS = 60;
const MAX_ANIMATION_SPEED = 45;

class  ParticlesLayer extends React.Component {
    constructor(props) {
        super(props);

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
            canvas_layer: -1,
            loading_perc: 0,
        };
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.draw_until_day = true; // Used to redraw all the positions until current time

        this.getFeatures = this.getFeatures.bind(this);
        this.drawLitter = this.drawLitter.bind(this);
        this.drawParticles = this.drawParticles.bind(this);
        this.drawLines = this.drawLines.bind(this);
        this.canvasFunction = this.canvasFunction.bind(this);
        this.getIconColorSize= this.getIconColorSize.bind(this);
        this.getIconColorSizeBoostrap= this.getIconColorSizeBoostrap.bind(this);
        this.drawNextDay = this.drawNextDay.bind(this);
        this.increaseSpeed = this.increaseSpeed.bind(this);
        this.decreaseSpeed = this.decreaseSpeed.bind(this);
        this.increaseSize = this.increaseSize.bind(this);
        this.decreaseSize = this.decreaseSize.bind(this);
        this.updateAnimation = this.updateAnimation.bind(this);
        this.increaseTransparency = this.increaseTransparency.bind(this);
        this.readOneZip = this.readOneZip.bind(this);
        this.decreaseTransparency = this.decreaseTransparency.bind(this);
        this.playPause = this.playPause.bind(this);
        this.changeDayRange = this.changeDayRange.bind(this);
        this.readThreeReadJSON = this.readThreeReadJSON.bind(this);
        this.readTwoUnzippedFile = this.readTwoUnzippedFile.bind(this);
        this.clearInterval = this.clearInterval.bind(this);
        this.nextDay = this.nextDay.bind(this);
        this.prevDay = this.prevDay.bind(this);
        this.displayCurrentDay = this.displayCurrentDay.bind(this);
        this.displayTransparency= this.displayTransparency.bind(this);
        this.displayParticleSize= this.displayParticleSize.bind(this);
    }

    readTwoUnzippedFile(data) {
        this.readThreeReadJSON(JSON.parse(data));
    }

    /**
     * Main function that reads the json data
     * @param data
     */
    readThreeReadJSON(data) {
        console.log("Reading json data!!!!!!! ", data);
        this.data = data;

        this.country_keys = Object.keys(this.data);
        this.country_names = this.country_keys.map((x) => x.toLowerCase());
        this.ocean_names = this.country_keys.map((x) => this.data[x]['oceans']);
        this.continent_names = this.country_keys.map((x) => this.data[x]['continent']);
        this.total_timesteps = this.data[this.country_keys[0]]["lat_lon"][0][0].length;

        console.log("\t Total timesteps: ", this.total_timesteps);
        console.log("\t Countries names: ", this.country_names);
        console.log("\t Ocean names: ", this.ocean_names);
        console.log("\t Continent names: ", this.continent_names);

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
        this.props.updateCountriesData(this.country_names, this.ocean_names, this.continent_names);
    }

    canvasFunction(extent, resolution, pixelRatio, size, projection) {
        // TODO Depending on the extent is which generators we should display
        // console.log(`Canvas Function Extent:${extent}, Res:${resolution}, Size:${size} projection:`, projection);

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
        ctx.lineCap = 'round'; // butt, round, square

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
            console.log("Changed model: ", url);
            d3.blob(url)
                .then(this.readOneZip);
        } else {
            if (this.state.status === STATUS.playing) {
                this.interval = setInterval(() => this.drawNextDay(), (1.0 / this.state.speed_hz) * 1000);
            }
            if (this.state.status === STATUS.paused) {
                this.drawNextDay();
            }
        }
    }

    /**
     * Reads a zip file and dispatches the correct function after unziping
     * @param blob
     */
    readOneZip(blob) {
        console.log('File has been received!');
        zip.loadAsync(blob)
            .then(function (zip) {
                // you now have every files contained in the loaded zip
                for (let file in zip.files) {
                    let zipobj = zip.files[file];
                    return zipobj.async("string");
                }
            })
            .then(this.readTwoUnzippedFile);

        this.setState({
            status: STATUS.decompressing
        });
    }

    /**
     * Draws a single day of litter using D3
     */
    drawNextDay() {
        let canvas = this.d3canvas.node();
        let ctx = canvas.getContext('2d');
        if (this.state.time_step === 0) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            // Make previous frame transparent
            var prev = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = `rgba(255, 255, 255, ${TRAIL_SIZE[this.state.transparency_index]})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = prev;
            ctx.fill();
        }
        // Draw next frame
        this.drawLitter(ctx);

        if (this.state.status === STATUS.playing) {
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
        let countries = this.getFeatures('points');
        for (let i = 0; i < countries.length; i++) {
            ctx.beginPath()
            ctx.fillStyle = this.props.colors_by_country[countries[i].country.toLowerCase()];
            this.d3GeoGenerator({type: 'FeatureCollection', features: countries[i].features});
            this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features});
            this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features});
            if(this.show_west_map) {
                this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features});
            }
            if(this.show_east_map) {
                this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features});
            }
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
        // console.time('features');
        let countries = this.getFeatures('lines');
        // console.timeLog('features', "features");
        // console.time('draw');
        ctx.lineWidth = PARTICLE_SIZES[this.state.particle_size_index];
        for (let i = 0; i < countries.length; i++) {
            ctx.beginPath()
            // ctx.strokeStyle = this.props.colors_by_country[countries[i].country.toLowerCase()];
            ctx.strokeStyle = "rgb(0,0,0)"
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
        // console.timeLog('draw', "draw");
        this.props.map.render();
    }

    /**
     * Obtains the particles in the GeoJson format
     * @param type
     * @returns {[]}
     */
    getFeatures(type='lines'){
        let countries_feature_collection = [];
        let start_time = this.state.time_step;
        let end_time = start_time+1;
        if (this.draw_until_day) {
            start_time = Math.max(0, this.state.time_step - DRAW_LAST_DAYS*(6-this.state.transparency_index)/6);
        }

        // let glob_tot_particles = 0;
        // Iterating over countries
        for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
            let cur_country = this.data[this.country_keys[cur_country_id]];
            let tot_part = cur_country["lat_lon"][0].length;
            // glob_tot_particles += tot_part;

            let features_array = [];
            // Iterate over all the particles
            if(type.localeCompare('lines') === 0) {
                if(end_time === (start_time+1)){
                    for (let part_id = 0; part_id < tot_part; part_id++) {
                        let coordinates = [];
                        // Add the two positions of the current particle
                        // Pushes the coordinates of the first position
                        coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][start_time]),
                            parseFloat(cur_country["lat_lon"][0][part_id][start_time])]);
                        // Pushes all the other particles times
                        coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][start_time+1]),
                            parseFloat(cur_country["lat_lon"][0][part_id][start_time+1])]);
                        let single_part_feature = {
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coordinates
                            }
                        };
                        features_array.push(single_part_feature);
                    }

                }else{// In this case we need to draw more than one time step
                    for (let part_id = 0; part_id < tot_part; part_id++) {
                        let coordinates = [];
                        // Add the two positions of the current particle
                        // Pushes the coordinates of the first position
                        coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][start_time]),
                            parseFloat(cur_country["lat_lon"][0][part_id][start_time])]);
                        // Pushes all the other particles times
                        for (let time_step = start_time; time_step <= end_time; time_step++) {
                            coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][time_step]),
                                parseFloat(cur_country["lat_lon"][0][part_id][time_step])]);
                        }
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
            }else{
                // THis case is when we want to draw particles rather than lines
                for (let part_id = 0; part_id < tot_part; part_id++) {
                    let coordinates = [];
                    // Add the position of the current particle
                    coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][this.state.time_step]),
                        parseFloat(cur_country["lat_lon"][0][part_id][this.state.time_step])]);
                    // If drawing more than one location, then add more particles
                    for (let time_step = start_time; time_step < end_time; time_step++) {
                        coordinates.push([parseFloat(cur_country["lat_lon"][1][part_id][time_step]),
                            parseFloat(cur_country["lat_lon"][0][part_id][time_step])]);
                    }
                    let single_part_feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "MultiPoint",
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

        // console.log("TOTAL NUMBER OF PARTICLES: ", glob_tot_particles)

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
        if (mode === MODES.increase) {
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
        let new_size = this.updateValue(this.state.particle_size_index, MODES.increase);
        this.setState({
            particle_size_index: new_size
        });
        e.preventDefault();
    }

    decreaseSize(e) {
        let new_size = this.updateValue(this.state.particle_size_index, MODES.decrease);
        this.setState({
            particle_size_index: new_size
        });
        e.preventDefault();
    }

    increaseTransparency(e) {
        let new_trans = this.state.transparency_index;
        if (new_trans < (Object.keys(TRAIL_SIZE).length)) {
            new_trans += 1;
        }
        this.setState({
            transparency_index: new_trans
        });
        e.preventDefault();
    }

    decreaseTransparency(e) {
        let new_trans = this.state.transparency_index;
        if (new_trans > 0) {
            new_trans -= 1;
        }
        this.setState({
            transparency_index: new_trans
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

    changeDayRange(e) {
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

    /**
     * This function is used to change icon and color sizes
     * @param value
     * @param inv
     * @param color
     * @returns {string}
     */
    getIconColorSize(value, inv=false, color=false){
        if(inv){
            value = 6 - value;
        }

        if(color) {
            if(value === 5) {
                return "darkred"
            }else{
                return "black";
            }

        }else{
            switch (value) {
                case 5:
                    return "lg";
                case 4:
                    return "lg";
                case 3:
                    return "1x";
                case 2:
                    return "sm";
                case 1:
                    return "xs";
                default:
                    return "1x";
            }

        }
    }
    getIconColorSizeBoostrap(value, inv=false, color=false){
        if(inv){
            value = 6 - value;
        }

        if(color) {
            if(value === 5) {
                return "darkred"
            }else{
                return "black";
            }

        }else{
            switch (value) {
                case 5:
                    return 24;
                case 4:
                    return 22;
                case 3:
                    return 20;
                case 2:
                    return 18;
                case 1:
                    return 16
                default:
                    return 20;
            }

        }
    }
    displayTransparency(){
        let transparency = <span></span>;
        if(this.state.status !== STATUS.loading){
            transparency =
                <span className="navbar-brand col">
                    <span style={{display:"inline-block",  width:"25px"}}>
                        <ArrowRight size={this.getIconColorSizeBoostrap(this.state.transparency_index, true)} />
                    </span>
                    <button className="btn btn-info btn-sm " onClick={this.increaseTransparency}
                            title="Increase litter trail"
                            disabled={this.state.transparency_index === (Object.keys(TRAIL_SIZE).length)}>
                            <Dash size={default_size}/>
                    </button>
                    {" "}
                    <button className="btn btn-info btn-sm" onClick={this.decreaseTransparency}
                            title="Decrease litter trail"
                            disabled={this.state.transparency_index === 1}>
                            <Plus size={default_size}/>
                    </button>
                </span>
        }
        return transparency;
    }

    displayParticleSize(){
        let particleSize= <span></span>;
        // if(this.state.status === STATUS.playing){
        if(this.state.status !== STATUS.loading){
            particleSize =
                <span className="navbar-brand col">
                    <span style={{display:"inline-block",  width:"25px"}}>
                        <CircleFill size={this.getIconColorSizeBoostrap(this.state.particle_size_index, false)}/>
                    </span>
                    <button className="btn btn-info btn-sm" onClick={this.decreaseSize}
                            title="Decrease litter size"
                            disabled={this.state.particle_size_index === 1}>
                            <Dash size={default_size}/>
                        </button>
                    {" "}
                    <button className="btn btn-info btn-sm" onClick={this.increaseSize}
                            title="Increase litter size"
                            disabled={this.state.particle_size_index === (Object.keys(PARTICLE_SIZES).length)}>
                        <Plus size={default_size}/>
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
                {((this.state.status === STATUS.loading) || (this.state.status === STATUS.decompressing)) ?
                    <div className="row">
                        {this.state.status === STATUS.loading ?
                            <div className="col-6">
                                <div className="spinner-border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                            :
                            <div className="col-10  d-inline-block">
                                <div className="spinner-border text-secondary" role="status">
                                    <span className="sr-only">Processing data...</span>
                                </div>
                                <div className="col-9 d-inline-block">
                                    <ProgressBar animated variant="info" now={this.state.loading_perc} label="%"/>
                                </div>
                            </div>
                        }
                    </div>
                    :
                    <div className="row">
                        {/*---- Transparency ---------*/}
                        {this.displayTransparency()}
                        {/*---- Particle size ---------*/}
                        {this.displayParticleSize()}
                        {/*---- Current day ------------*/}
                        <span className="navbar-brand col d-none d-lg-inline">
                            <Form.Control type="range"
                                   onChange={this.changeDayRange}
                                   value={this.state.time_step}
                                   min="0" max={this.total_timesteps} custom/>
                        </span>
                        {/*---- Play/Pause---------*/}
                        <span className="navbar-brand col">
                            <ButtonGroup>
                                <button className="btn btn-info btn-sm" type="button" onClick={this.decreaseSpeed}
                                        title="Decrease animation speed"
                                        disabled={(this.state.status !== STATUS.playing) ||
                                        (this.state.speed_hz <= .6)}>
                                {/*<FontAwesomeIcon icon={faBackward} size="xs"/>*/}
                                <SkipBackwardFill size={default_size}/>
                                </button>
                                <button className="btn btn-info btn-sm" type="button" onClick={this.prevDay}
                                        title="Previous time step"
                                        disabled={this.state.status !== STATUS.paused}>
                                {/*<FontAwesomeIcon icon={faStepBackward} size="xs"/>*/}
                                <SkipStartFill size={default_size}/>
                                </button>
                                <button className="btn btn-info btn-sm"
                                        title="Play/pause animation"
                                        onClick={this.playPause}>{this.state.status === STATUS.playing ?
                                    <PauseFill size={default_size}/>:
                                    <PlayFill size={default_size}/>}
                                </button>
                                <button className="btn btn-info btn-sm" onClick={this.nextDay}
                                        title="Next time step"
                                        disabled={this.state.status !== STATUS.paused}>
                                        <SkipEndFill size={default_size}/>
                                </button>
                                <button className="btn btn-info btn-sm" onClick={this.increaseSpeed}
                                        title="Incrase animation speed"
                                        disabled={(this.state.status !== STATUS.playing) ||
                                        (this.state.speed_hz >= MAX_ANIMATION_SPEED)}>
                                <SkipForwardFill size={default_size}/>
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
// {/*---- Speed ---------*/}
// {/*<div className="row">*/}
// {/*    <div className="col-12">*/}
// {/*        Animation speed: {this.state.speed_hz} hz*/}
// {/*    </div>*/}
// {/*</div>*/}
