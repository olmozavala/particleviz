import React from 'react'
import './css/Animations.css'
import * as d3 from "d3"
import ImageLayer from "ol/layer/Image"
import ImageCanvasSource from "ol/source/ImageCanvas"
import _ from "lodash"
import $ from 'jquery'
import { isMobile } from "react-device-detect"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import {Container, ButtonGroup, Row, Col, Form, Button}  from "react-bootstrap";
import { TwitterPicker } from 'react-color';

import {
    ArrowRight, CircleFill, Plus, Dash,
    PlayFill, PauseFill, Slash, SquareFill,
    SkipBackwardFill, SkipForwardFill,
    SkipEndFill, SkipStartFill,
    Brush, BrushFill, ArrowCounterclockwise, ArrowClockwise, ListCheck,
    X, List
} from 'react-bootstrap-icons'

import JSZip from "jszip"

const data_key = 'def_part_viz'
const default_size = 15 // Font size
const STATUS = {
    loading: 0,
    decompressing: 1,
    paused: 2,
    playing: 3,
}

// How much transparency should we add
const TRAIL_SIZE = {
    1: .01, // Longest trail
    2: .04,
    3: .15,
    4: .35,
    5: .90  // Shortest trail
}

const PARTICLE_SIZES= {
    1: .5,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
}
// Double the size of particles when we are in mobile
let DRAW_LAST_TIMESTEPS = 5
if(isMobile){
    for(let key of Object.keys(PARTICLE_SIZES)){
        PARTICLE_SIZES[key] *= 2
    }
    DRAW_LAST_TIMESTEPS = 1
}

// Modes in how to increase/decrease a variable
const MODES={
    increase:1,
    decrease:2
}

const MAX_ANIMATION_SPEED = 30 // Frames per second

class  ParticlesLayer extends React.Component {
    constructor(props) {
        super(props)

        // https://github.com/d3/d3-time-format
        this.dateFormat = d3.timeFormat("%B %e, %Y ")
        this.time_step = 0  // Current time step for the file being displayed
        this.canvasWidth = 0
        this.canvasHeight = 0
        this.draw_until_day = true // Used to redraw all the positions until current time
        this.color_promise_status = 'none'
        this.state = {
            speed_hz: 10,  // SPeed of animation
            transparency_index: 3,  // Size of particle trail
            status: STATUS.loading,  // Status of animation
            particle_size_index: 3,  // Size of the particle
            selected_model: this.props.selected_model,  // selected model
            canvas_layer: -1,  //
            loaded_files: 0,
            data: {},
            extent: null,  // Current extent of the winodw
            domain: null,
            ol_canvas_size: null,
            total_timesteps: {},
            timesteps_per_file:this.props.selected_model.time_steps,
            shape_type: false, // true for lines, false for dots
            particle_color: this.props.particle_color,
            display_picker: false,
            display_layers: false,  // Displays the dropdown of the available layers (by color)
            toggle_all_layers_display: true,   // Indicates if we are displaying or not all the layers
            play_backward: false, // It is used to play the videos backward in time
            delta_t: -1,
            color_scheme_name: {},
            color_scheme: {},
            start_date: Date.now(),
            date_format: d3.timeFormat("%B %e, %Y "),
            range_time_step: 0
        }

        // This is repeated should go in a function
        $(".btn").attr("disabled", true)  // Enable all the buttons


        // Setting up d3 objects TODO somethings doesn't make sense here
        this.d3canvas = d3.select(document.createElement("canvas")).attr("id", "particle_canvas")
        if (this.d3canvas.empty()) {
            // console.log("Initializing canvas")
            this.d3canvas = d3.select(document.createElement("canvas")).attr("id", "particle_canvas")
            this.d3canvas.getContext('2d', { alpha: false })
        }
        this.ctx = this.d3canvas.node().getContext('2d')

        this.drawParticlesAsLines = this.drawParticlesAsLines.bind(this)
        this.canvasFunction = this.canvasFunction.bind(this)
        this.getIconColorSize = this.getIconColorSize.bind(this)
        this.getIconColorSizeBoostrap = this.getIconColorSizeBoostrap.bind(this)
        this.drawAnimationFrame = this.drawAnimationFrame.bind(this)
        this.toggleShapeType = this.toggleShapeType.bind(this)
        this.toggleLayerDisplay= this.toggleLayerDisplay.bind(this)
        this.toggleAllLayerDisplay= this.toggleAllLayerDisplay.bind(this)
        this.toggleLayersContainer = this.toggleLayersContainer.bind(this)
        this.increaseSpeed = this.increaseSpeed.bind(this)
        this.decreaseSpeed = this.decreaseSpeed.bind(this)
        this.updateRange = this.updateRange.bind(this)
        this.increaseSize = this.increaseSize.bind(this)
        this.decreaseSize = this.decreaseSize.bind(this)
        this.updateAnimation = this.updateAnimation.bind(this)
        this.increaseTransparency = this.increaseTransparency.bind(this)
        this.readZipStepOne = this.readZipStepOne.bind(this)
        this.decreaseTransparency = this.decreaseTransparency.bind(this)
        this.playPause = this.playPause.bind(this)
        this.changeDayRange = this.changeDayRange.bind(this)
        this.readUnzippedFileStepTwo = this.readUnzippedFileStepTwo.bind(this)
        this.clearPreviousLoop = this.clearPreviousLoop.bind(this)
        this.nextDay = this.nextDay.bind(this)
        this.prevDay = this.prevDay.bind(this)
        this.togglePlayDirection= this.togglePlayDirection.bind(this)
        this.updateDateTxt = this.updateDateTxt.bind(this)
        this.geoToCanvas = this.geoToCanvas.bind(this)
        this.changeParticleColor = this.changeParticleColor.bind(this)
        this.strDeltaTimeToMiliseconds = this.strDeltaTimeToMiliseconds.bind(this)
        this.readColorScheme= this.readColorScheme.bind(this)
        this.processNewColorScheme= this.processNewColorScheme.bind(this)
    }


    /**
     * It returns the number of miliseconds to increase in each time step. Based on the string stored in the header files
     * @param str_deltat
     */
    strDeltaTimeToMiliseconds(str_delta_t, dt){
        let base_unit = 0
        switch(String(str_delta_t).trim().toLowerCase()){
            case "milliseconds":
                base_unit = 1
                break
            case "seconds":
                base_unit = 1000
                break
            case "hours":
                base_unit = 1000 * 3600
                break
            case "days":
                base_unit = 1000 * 24 * 3600
                break
            case "weeks":
                base_unit = 7 * 1000 * 24 * 3600
                break
            case "years":
                base_unit = 365 * 1000 * 24 * 3600
                break
            default:
                base_unit = 1000 * 24 * 3600
        }

        let delta_t = Math.abs(base_unit * dt)
        let delta_ts = base_unit * dt
        let str_format = "%B %e, %Y "
        if(delta_t < 1000){ // Milliseconds (less than seconds)
            str_format = d3.timeFormat("%H:%M:%S.%L  %B %e, %Y")
        } else if(delta_t < 3600000) { // seconds (less than hours)
            str_format = d3.timeFormat("%H:%M:%S  %B %e, %Y ")
        } else if(delta_t < 1000 * 24 * 3600) { // hours (less than days)
            str_format = d3.timeFormat("%H h  %B %e, %Y")
        } else if(delta_t <  7 * 1000 * 24 * 3600 + 1) { // week (less than weeks)
            str_format = d3.timeFormat("%B %e, %Y ")
        } else { // Years
            str_format = d3.timeFormat("%Y ")
        }
        return [delta_ts, str_format]
    }

    /**
     * Reads a zip file and dispatches the correct function after unziping
     * @param text
     * @param file_number
     */
    readZipStepOne(text, file_number) {
        // Reads the header file (txt)
        file_number = parseInt(file_number)
        let header_data = d3.csvParseRows(text, function(d) { // In ParticleViz it should only be one line
            return [parseInt(d[0]), parseInt(d[1]), d[2], d[3], parseInt(d[4]), JSON.parse(d[5].toLowerCase())]
        });

        // Then it reads the corresponding zip file
        let file_number_str = `${file_number < 10 ? '0' + file_number : file_number}`
        let url = `${this.props.url}/${this.props.selected_model.file}_${file_number_str}.zip`
        // console.log("This is the url: " + url)
        d3.blob(url).then((blob) => {
            let zip = new JSZip()
            zip.loadAsync(blob).then(function (zip) {
                // you now have every files contained in the loaded zip
                // console.log(`Received zip for file number ${file_number}:`, zip)
                for (let file in zip.files) {
                    let zipobj = zip.files[file]
                    return zipobj.async("arraybuffer")
                }
            }).then((binarydata) => { // This function receives the binary data
                let buf_off = 0
                let line = header_data[0]
                let has_nans  = line[5]
                let num_part = line[0]
                let tot_timesteps = line[1]
                // We only update these state variables if it is the first file we receive
                if(this.state.delta_t === -1){
                    let start_date = new Date(Date.parse(line[2].trim()))
                    let [delta_t, date_format] = this.strDeltaTimeToMiliseconds(line[3], line[4])
                    this.setState({
                        delta_t:delta_t,
                        start_date:start_date,
                        date_format: date_format
                    })
                }

                // console.log(`Num particles: ${num_part} timesteps ${tot_timesteps}`)
                let data = {}
                data[data_key] = {}
                // All latitudes and longitudes in the file
                let all_lat = new Float32Array(new Int16Array(binarydata, buf_off, num_part*tot_timesteps))
                // Not sure why in hte next line is by 2?
                let all_lon = new Float32Array(new Int16Array(binarydata, buf_off+(num_part*tot_timesteps*2), num_part*tot_timesteps))
                let all_display = []
                if(has_nans){
                    let main_i = 0
                    let byte_idx = 0
                    let bin_mask = 0
                    let data_int = new Uint8Array(binarydata, buf_off + (num_part * tot_timesteps * 4), parseInt(Math.ceil(num_part*tot_timesteps/8)))
                    for(let c_part=0; c_part < num_part; c_part++){
                        let c_part_display = new Array(tot_timesteps)
                        for(let c_time=0; c_time < tot_timesteps; c_time++) {
                            byte_idx = Math.floor(((c_part*tot_timesteps) + c_time) / 8)
                            bin_mask = 2**(7 - (main_i % 8))
                            c_part_display[c_time] = (data_int[byte_idx] & bin_mask) > 0
                            main_i += 1
                        }
                        all_display.push(c_part_display)
                    }
                }
                // Adding information on when to display a particle, If we need to include the array of nans
                // Split locations by particles
                let lats_by_part = []
                let lons_by_part = []
                for(let c_part=0; c_part < num_part; c_part++){
                    let cur_part_lats = _.range(tot_timesteps).map((i) =>  all_lat[c_part*tot_timesteps + i]/100)
                    let cur_part_lons = _.range(tot_timesteps).map((i) =>  all_lon[c_part*tot_timesteps + i]/100)
                    lats_by_part.push(cur_part_lats)
                    lons_by_part.push(cur_part_lons)
                }
                // Because we draw the particles by file (in order to be able to read files on-demand and async)
                // we need to repeat the
                data[data_key]["lat_lon"] = [lats_by_part, lons_by_part]
                // If it has information on when to display particles we include it
                if(has_nans){
                    data[data_key]["disp_info"] = all_display
                }
                this.readUnzippedFileStepTwo(data, this.props.selected_model.file, file_number)
            })
        })
    }

    processNewColorScheme(selected_model){
        /**
         * Initializes the reading of a color scheme from a new model
         */
        if( selected_model.color_scheme !== undefined){
            let color_scheme_url = ""
            // These files are harcoded and are created by the Preproc module of ParticleViz
            if(isMobile) {
                color_scheme_url = `${this.props.url}/data/${selected_model.color_scheme.replace('.json','_Mobile.json')}`
            }else{
                color_scheme_url = `${this.props.url}/data/${selected_model.color_scheme.replace('.json','_Desktop.json')}`
            }
            console.log(color_scheme_url) // For debugging
            console.log("Reading new color scheme for model: ", this.state.selected_model.name)
            console.log("Color scheme:", this.state.color_scheme)
            console.log("Color scheme name:", this.state.color_scheme_name)
            this.color_promise_status = "pending"
            d3.json(color_scheme_url).then((data) => this.readColorScheme(data))
        }else{
            this.readColorScheme({
                "default": [
                    {
                        "name": "All",
                        "color": this.state.particle_color,
                        "index": "all"
                    }
                ]
            })
        }
    }

    readColorScheme(color_scheme){
        /**
         * Reads a color scheme from a json file
         * @type {string}
         */
        let scheme_name = Object.keys(color_scheme)[0]
        for(let id=0; id < color_scheme[scheme_name].length; id++) {
            let temp_index_str = color_scheme[scheme_name][id].index
            // Verify it comes as a range and not a list of indices
            if(temp_index_str.includes("-")){
                let first = parseInt(temp_index_str.split("-")[0])
                let last = parseInt(temp_index_str.split("-")[1])
                color_scheme[scheme_name][id]['index'] = _.range(first, last)
            }else{
                color_scheme[scheme_name][id]['index'] = temp_index_str.split(',').map(Number)
            }
            color_scheme[scheme_name][id]['display'] = true
            color_scheme[scheme_name][id]['id'] = id
        }

        let cur_color_scheme = this.state.color_scheme
        let cur_color_scheme_name = this.state.color_scheme_name
        cur_color_scheme[this.state.selected_model.id] = color_scheme[scheme_name]
        cur_color_scheme_name[this.state.selected_model.id] = scheme_name
        console.log("New color scheme state variable: ", cur_color_scheme)
        this.color_promise_status = "finished"
        this.setState({
            color_scheme: cur_color_scheme,
            color_scheme_name: cur_color_scheme_name
        })
        // console.log(Object.keys(color_scheme[scheme_name]).map((key) => [key, color_scheme[scheme_name][key]]))
    }

    /**
     * This function organizes the data after been read into objects
     * @param data
     * @param name
     * @param file_number
     */
    readUnzippedFileStepTwo(data, name, file_number_str) {
        let file_number = parseInt(file_number_str)
        if(name === this.props.selected_model.file) {
            // console.log(`Uncompressed file received, file number: ${file_number} ....`)
            let total_timesteps = data[data_key]["lat_lon"][0][0].length
            let cur_state = this.state.status
            let color_scheme = this.state.color_scheme

            // Decide if we have loaded enough files to start the animation
            let wait_for = 1 // We will wait for this percentage of files to be loaded
            let files_to_load = parseInt(this.state.selected_model.num_files) * wait_for
            if (this.state.loaded_files >= (files_to_load - 1)) {
                // console.log("Done reading and uncompressed the minimum number of files!!!!")
                cur_state = STATUS.playing
                $(".btn").attr("disabled", false)  // Enable all the buttons
                // TODO is there a better place to do this? (setting the particle range of the color scheme for full range, when there is no color scheme)
                // TODO we are missing the option of specifying a list of indexes rather than a range
                if( this.state.color_scheme_name[this.props.selected_model.id] === "default"){
                    // The color_scheme should only have one entry in this case
                    color_scheme[this.props.selected_model.id].index = _.range(0, data['def_part_viz']['lat_lon'][0].length)
                }
            }else{
                let perc = parseInt(100 * (this.state.loaded_files / files_to_load))
                $(".loading_perc").text(`${perc} %`)
            }

            let model_id = this.state.selected_model.id

            let current_data = this.state.data
            // Verify we have already read at least one file for this model
            let model_timesteps = this.state.total_timesteps
            // console.log("Model time steps:", this.state.total_timesteps)
            if(_.isUndefined(current_data[model_id])){
                current_data[model_id] = {}
                model_timesteps[model_id] = {}
                model_timesteps[model_id] = total_timesteps
            }else{
                model_timesteps[model_id] += total_timesteps
            }

            // Here we append a new location at the end of each file (if is still not there) to fix the
            // problem of drawing a location at the last timestep of each file.
            let has_nans = data[data_key]['disp_info'] !== undefined? true: false

            current_data[model_id][file_number] = data
            if (this.state.loaded_files >= (files_to_load - 1)) {
                // Here we have finished loading the files we needed
                this.props.chardin.stop()
                for(let c_file_number=0; c_file_number < files_to_load - 1; c_file_number++) {
                    // Be sure we have already loaded the next file
                    if(!_.isUndefined(current_data[model_id][c_file_number+1])) {
                        let next_file_data = current_data[model_id][c_file_number+1]
                        let num_part = current_data[model_id][c_file_number][data_key]['lat_lon'][0].length
                        let time_steps = current_data[model_id][c_file_number][data_key]['lat_lon'][0][0].length
                        if(time_steps === this.state.timesteps_per_file){// Check we haven't 'fixed' this file already
                            for(let c_part=0; c_part < num_part; c_part++) {
                                // We add the first location of the next file as the last location of this file
                                current_data[model_id][c_file_number][data_key]['lat_lon'][0][c_part].push(next_file_data[data_key]['lat_lon'][0][c_part][0])
                                current_data[model_id][c_file_number][data_key]['lat_lon'][1][c_part].push(next_file_data[data_key]['lat_lon'][1][c_part][0])
                                if(has_nans){
                                    current_data[model_id][c_file_number][data_key]['disp_info'][c_part].push(next_file_data[data_key]['disp_info'][c_part][0])
                                }
                            }
                        }
                    }
                }
            }

            // This is useful for doing things we want to do only once
            if(file_number === 0) {
                let canv_lay = this.state.canvas_layer
                if (canv_lay === -1) {
                    canv_lay = new ImageLayer({
                        source: new ImageCanvasSource({
                            canvasFunction: this.canvasFunction
                        })
                    })
                    this.props.map.addLayer(canv_lay)
                }
                this.setState({
                    canvas_layer: canv_lay,
                    data: {...current_data},
                    loaded_files: this.state.loaded_files + 1,
                    total_timesteps: {...model_timesteps},
                    status: cur_state,
                    color_scheme: color_scheme
                })
            }else{
                // console.log(`Loaded files:  ${this.state.loaded_files + 1}`)
                this.setState({
                    data: {...current_data},
                    loaded_files: this.state.loaded_files + 1,
                    total_timesteps: {...model_timesteps},
                    status: cur_state,
                    color_scheme: color_scheme
                })
            }
        } // Check the received file comes from the current file we are looking at
    }

    /**
     * Transforms geographic into window
     * @param lon
     * @param lat
     * @returns {number[]}
     */
    geoToCanvas(lon, lat) {
        let nlon = ((lon - this.state.extent[0]) / this.state.domain[0]) * this.state.ol_canvas_size[0]
        let nlat = this.state.ol_canvas_size[1] - (((lat - this.state.extent[1]) / this.state.domain[1]) * this.state.ol_canvas_size[1])
        return [parseInt(nlon), parseInt(nlat)]
    }

    canvasFunction(extent, resolution, pixelRatio, size, projection) {
        // console.log(`Canvas Function Extent:${extent}, Res:${resolution}, Size:${size} projection:`, projection)

        this.canvasWidth = size[0]
        this.canvasHeight = size[1]
        this.draw_until_day = true; // Used to redraw all the positions until current time

        this.d3canvas.attr('width', this.canvasWidth).attr('height', this.canvasHeight)
        this.ctx.lineCap = 'round'; // butt, round, square

        this.show_west_map = false
        this.show_east_map = false
        if (extent[0] < -180) {
            // console.log('Showing west map....')
            this.show_west_map = true
        }
        if (extent[2] > 180) {
            // console.log('Showing east map....')
            this.show_east_map = true
        }

        if (!_.isUndefined(this.state.data)) {
            let domain = [Math.abs(extent[2] - extent[0]), Math.abs(extent[3] - extent[1])]
            let new_status = this.state.status
            if ((this.state.status === STATUS.decompressing) && (this.state.loaded_files >= this.state.selected_model.num_files - 1)) {
                new_status = STATUS.playing
            }

            this.setState({
                extent: extent,
                domain: domain,
                ol_canvas_size: size,
                status: new_status,
            })
        }

        return this.d3canvas.node()
    }

    clearPreviousLoop() {
        if (!_.isUndefined(this.interval)) {
            cancelAnimationFrame(this.interval)
        }
    }


    /**
     * Updates the animation with the current frame rate
     */
    updateAnimation() {
        this.clearPreviousLoop()
        // Verify the update was caused by the parent component and we have updated
        // the file to read.

        // In this case the data of the selected model has not been loaded
        if (this.state.selected_model !== this.props.selected_model) {
            this.color_promise_status = "newmodel"  // It is used to avoid requesting the color squeme multiple times
            if(_.isUndefined(this.state.data[this.props.selected_model.id])){
                $(".btn").attr("disabled", true)  // Enable all the buttons
                // In this case is a new file, we need to reset almost everything
                this.time_step= 0
                this.setState({
                    loaded_files: 0,
                    selected_model: this.props.selected_model,
                    status: STATUS.loading,
                })
                // ========================= This was for the single file version =============================
                for(let file_number in _.range(0, this.props.selected_model.num_files)){
                    let file_number_str = `${file_number < 10 ? '0' + file_number : file_number}`
                    let url = `${this.props.url}/${this.props.selected_model.file}_${file_number_str}.txt`
                    d3.text(url).then( (blob) => this.readZipStepOne(blob, file_number))
                }
                $(".loading_perc").text("0 %")
                $(".loading-div").show() // Show the loading
            }else{ // In this case the file was loaded previously, setting time to 0
                this.time_step= 0
                this.setState({
                    selected_model: this.props.selected_model,
                    cur_state: STATUS.playing
                })
            }
        } else { // In this case the data for this model has already been loaded we just need to update the animation
            if ((this.state.status === STATUS.loading) || (this.state.status === STATUS.decompressing)) {
                $(".loading-div").show() // In this case we are still loading something
            }else{
                $(".loading-div").hide() // Hide the loading
                // $(".btn").attr("disabled", false)  // Enable all the buttons
                let canvas = this.d3canvas.node()
                if (this.state.status === STATUS.playing) {
                    if (!_.isNull(canvas)) {// If we have already setup the canvas (not null) then we draw
                        this.time = Date.now()
                        this.interval = requestAnimationFrame( this.drawAnimationFrame )
                    }
                }
                if (this.state.status === STATUS.paused) {
                    if (!_.isNull(canvas)) {// If we have already setup the canvas (not null) then we draw
                        this.drawAnimationFrame()
                    }
                }
            }
        }

        // Verify we need to update the color scheme
        if(_.isUndefined(this.state.color_scheme[this.state.selected_model.id])){
            if( this.color_promise_status !== 'pending') {
                this.color_promise_status = "pending"
                this.processNewColorScheme(this.props.selected_model)
            }
        }
    }


    /**
     * Changes the current particle color
     * @param color
     */
    changeParticleColor(color){
        let rgb = color.rgb
        let color_scheme = this.state.color_scheme
        for(let scheme_id = 0; scheme_id < color_scheme.length; scheme_id++){
            color_scheme[scheme_id].color = "rgb("+rgb.r+","+rgb.g+","+rgb.b+","+rgb.a+")"
        }
        this.setState({
            color_scheme: color_scheme,
            display_picker: false
        })
    }


    /**
     * Draws a single frame (timestep) using D3
     */
    drawAnimationFrame() {
        let ctime = Date.now()
        // Verify is time to draw the next frame
        if( (ctime - this.time) > (1000/this.state.speed_hz)) {
            // console.log(`${(ctime - this.time)}  ${(1000/this.state.speed_hz)}`)
            this.time = ctime

            let canvas = this.d3canvas.node()
            this.updateDateTxt()
            let cur_date = this.time_step
            let to_date = this.time_step
            if (this.draw_until_day) { // This is just to draw more than one day (necessary when updating the screen)
                if(this.state.play_backward){
                    cur_date = Math.min(this.time_step + DRAW_LAST_TIMESTEPS, this.state.total_timesteps[this.state.selected_model.id])
                }else{
                    cur_date = Math.max(this.time_step - DRAW_LAST_TIMESTEPS, 0)
                }
                this.draw_until_day = false
            }
            // Here we draw from the current date up to 'to_date'. Normally is should only be one day
            for (; this.state.play_backward? cur_date >= to_date: cur_date <= to_date;
                   this.state.play_backward? cur_date--: cur_date++) {
                if (cur_date === 0) {
                    // Clear the canvas if it is the first date of the animation
                    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
                } else {
                    // Make previous frame a little bit transparent
                    var prev = this.ctx.globalCompositeOperation
                    this.ctx.globalCompositeOperation = "destination-out"
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${TRAIL_SIZE[this.state.transparency_index]})`
                    this.ctx.fillRect(0, 0, canvas.width, canvas.height)
                    this.ctx.globalCompositeOperation = prev
                    this.ctx.fill()
                }
                // Draw next frame
                if (this.state.shape_type) {
                    this.drawParticlesAsLines(cur_date)
                } else {
                    this.drawParticlesAsSquares(cur_date)
                }
            }// for

            if (this.state.status === STATUS.playing) {
                // This can only happen when playing backward
                if(cur_date === -1){
                    cur_date = this.state.total_timesteps[this.state.selected_model.id]-1
                }
                this.time_step = cur_date % this.state.total_timesteps[this.state.selected_model.id]
                if(this.time_step % 10 === 0){ // Update the range bar every 10 timesteps
                    this.updateRange()
                }
            }
        }
        cancelAnimationFrame(this.interval)
        if (this.state.status === STATUS.playing) {
            this.interval =  requestAnimationFrame( this.drawAnimationFrame )
        }
    }

    /**
     * Draws the particles for a single day as squares.
     * @param ctx Context of the canvas object to use
     */
    drawParticlesAsSquares(cur_date_all_files) {
        let square_size = parseInt(PARTICLE_SIZES[this.state.particle_size_index] + 1)
        this.ctx.lineWidth = square_size
        let model_id = this.state.selected_model.id
        let available_files = Object.keys(this.state.data[model_id])
        let file_number = (Math.floor(this.time_step / this.state.timesteps_per_file)).toString()
        let color_scheme = this.state.color_scheme[model_id]

        let cur_date = cur_date_all_files % this.state.timesteps_per_file

        if (available_files.includes(file_number)) {
            let clat = 0
            let clon = 0
            // Retreive all the information from the first available file
            let drawing_data = this.state.data[model_id][file_number][data_key]
            let oldpos = [0, 0]

            let has_nans = drawing_data['disp_info'] !== undefined? true: false
            if(has_nans){
                let disp_part = 0
                for(let scheme_id = 0; scheme_id < color_scheme.length; scheme_id++){
                    this.ctx.beginPath()
                    let c_scheme = color_scheme[scheme_id]
                    if(c_scheme.display){
                        let part_indxs = c_scheme.index
                        this.ctx.fillStyle = c_scheme.color
                        for (let part_indxs_id = 0; part_indxs_id < part_indxs.length; part_indxs_id++) {
                            let part_id = part_indxs[part_indxs_id]
                            clon = drawing_data["lat_lon"][1][part_id][cur_date]
                            clat = drawing_data["lat_lon"][0][part_id][cur_date]
                            disp_part = drawing_data["disp_info"][part_id][cur_date]

                            if(disp_part){
                                if (clon !== this.state.timesteps_per_file) {
                                    if ((clon >= this.state.extent[0]) && (clon <= this.state.extent[2])) {
                                        oldpos = this.geoToCanvas(clon, clat)
                                        this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                    }
                                    // Draw the particles on the additional map on the east
                                    if (this.show_east_map) {
                                        let tlon = clon + 360
                                        if (tlon >= this.state.extent[0]) {
                                            oldpos = this.geoToCanvas(tlon, clat)
                                            this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                        }
                                    }
                                    // Draw the particles on the additional map on the west
                                    if (this.show_west_map){
                                        let tlon = clon - 360
                                        if (tlon >= this.state.extent[0]) {
                                            oldpos = this.geoToCanvas(tlon, clat)
                                            this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                        }
                                    }
                                }
                            }
                        }
                        this.ctx.stroke()
                        this.ctx.closePath()
                    }
                }
            }else{
                for(let scheme_id = 0; scheme_id < color_scheme.length; scheme_id++){
                    this.ctx.beginPath()
                    let c_scheme = color_scheme[scheme_id]
                    if(c_scheme.display) {
                        let part_indxs = c_scheme.index
                        this.ctx.fillStyle = c_scheme.color
                        for (let part_indxs_id = 0; part_indxs_id < part_indxs.length; part_indxs_id++) {
                            let part_id = part_indxs[part_indxs_id]
                            let clon = drawing_data["lat_lon"][1][part_id][cur_date]
                            let clat = drawing_data["lat_lon"][0][part_id][cur_date]
                            if (clon !== this.state.timesteps_per_file) {
                                if ((clon >= this.state.extent[0]) && (clon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(clon, clat)
                                    this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                }
                                // Draw the particles on the additional map on the east
                                if (this.show_east_map) {
                                    let tlon = clon + 360
                                    if (tlon >= this.state.extent[0]) {
                                        oldpos = this.geoToCanvas(tlon, clat)
                                        this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                    }
                                }
                                // Draw the particles on the additional map on the west
                                if (this.show_west_map) {
                                    let tlon = clon - 360
                                    if (tlon >= this.state.extent[0]) {
                                        oldpos = this.geoToCanvas(tlon, clat)
                                        this.ctx.fillRect(oldpos[0], oldpos[1], square_size, square_size)
                                    }
                                }
                            }
                        }
                        this.ctx.stroke()
                        this.ctx.closePath()
                    }
                }
            }
        }
        this.props.map.render()
    }

    drawParticlesAsLines(timestep_idx_org) {
        // console.log(`DrawLines: ${this.state.speed_hz}`)
        this.ctx.lineWidth = PARTICLE_SIZES[this.state.particle_size_index]
        let model_id = this.state.selected_model.id
        let available_files = Object.keys(this.state.data[model_id])
        let file_number = (Math.floor(this.time_step / this.state.timesteps_per_file)).toString()
        let color_scheme = this.state.color_scheme[model_id]

        let clon = 0
        let clat = 0
        let nlon = 0
        let nlat = 0

        let tlon = 0
        let tnlon = 0

        let timestep_idx = timestep_idx_org % this.state.timesteps_per_file

        if (available_files.includes(file_number)) {
            // Retreive all the information from the first available file
            let drawing_data = this.state.data[model_id][file_number][data_key]
            // console.log(`local global ${local_global_cur_time} global end ${global_end_time} c_time ${c_time} next_time ${next_time}` )
            let oldpos = [0, 0]
            let newpos = [0, 0]

            let has_nans = drawing_data['disp_info'] !== undefined? true: false
            if(has_nans){
                let disp_part = 0
                for(let scheme_id = 0; scheme_id < color_scheme.length; scheme_id++){
                    let c_scheme = color_scheme[scheme_id]
                    if(c_scheme.display){
                        this.ctx.beginPath()
                        let part_indxs = c_scheme.index
                        this.ctx.strokeStyle = c_scheme.color
                        for (let part_indxs_id = 0; part_indxs_id < part_indxs.length; part_indxs_id++) {
                            let part_id = part_indxs[part_indxs_id]
                            clon = drawing_data["lat_lon"][1][part_id][timestep_idx]
                            clat = drawing_data["lat_lon"][0][part_id][timestep_idx]
                            nlon = drawing_data["lat_lon"][1][part_id][timestep_idx + 1]
                            nlat = drawing_data["lat_lon"][0][part_id][timestep_idx + 1]
                            disp_part = drawing_data["disp_info"][part_id][timestep_idx] && drawing_data["disp_info"][part_id][timestep_idx + 1]

                            if(disp_part){
                                // Here we draw the 'normal' particles, those inside the limits of the globe
                                if ((clon >= this.state.extent[0]) && (clon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(clon, clat)
                                    newpos = this.geoToCanvas(nlon, nlat)
                                    this.ctx.moveTo(oldpos[0], oldpos[1])
                                    this.ctx.lineTo(newpos[0], newpos[1])
                                }
                                // Draw the particles on the additional map on the east
                                if (this.show_east_map) {
                                    tlon = clon + 360
                                    tnlon = nlon + 360
                                    if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                        oldpos = this.geoToCanvas(tlon, clat)
                                        newpos = this.geoToCanvas(tnlon, nlat)
                                        this.ctx.moveTo(oldpos[0], oldpos[1])
                                        this.ctx.lineTo(newpos[0], newpos[1])
                                    }
                                }
                                // Draw the particles on the additional map on the west
                                if (this.show_west_map){
                                    tlon = clon - 360
                                    tnlon = nlon - 360
                                    if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                        oldpos = this.geoToCanvas(tlon, clat)
                                        newpos = this.geoToCanvas(tnlon, nlat)
                                        this.ctx.moveTo(oldpos[0], oldpos[1])
                                        this.ctx.lineTo(newpos[0], newpos[1])
                                    }
                                }
                            }
                        }
                        this.ctx.stroke()
                        this.ctx.closePath()
                    }
                }
            }else{
                for(let scheme_id = 0; scheme_id < color_scheme.length; scheme_id++){
                    let c_scheme = color_scheme[scheme_id]
                    if(c_scheme.display){
                        this.ctx.beginPath()
                        let part_indxs = c_scheme.index
                        this.ctx.strokeStyle = c_scheme.color
                        for (let part_indxs_id = 0; part_indxs_id < part_indxs.length; part_indxs_id++) {
                            let part_id = part_indxs[part_indxs_id]
                            clon = drawing_data["lat_lon"][1][part_id][timestep_idx]
                            clat = drawing_data["lat_lon"][0][part_id][timestep_idx]
                            nlon = drawing_data["lat_lon"][1][part_id][timestep_idx + 1]
                            nlat = drawing_data["lat_lon"][0][part_id][timestep_idx + 1]

                            // Here we draw the 'normal' particles, those inside the limits of the globe
                            if ((clon >= this.state.extent[0]) && (clon <= this.state.extent[2])) {
                                oldpos = this.geoToCanvas(clon, clat)
                                newpos = this.geoToCanvas(nlon, nlat)
                                this.ctx.moveTo(oldpos[0], oldpos[1])
                                this.ctx.lineTo(newpos[0], newpos[1])
                            }
                            // Draw the particles on the additional map on the east
                            if (this.show_east_map) {
                                tlon = clon + 360
                                tnlon = nlon + 360
                                if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(tlon, clat)
                                    newpos = this.geoToCanvas(tnlon, nlat)
                                    this.ctx.moveTo(oldpos[0], oldpos[1])
                                    this.ctx.lineTo(newpos[0], newpos[1])
                                }
                            }
                            // Draw the particles on the additional map on the west
                            if (this.show_west_map){
                                tlon = clon - 360
                                tnlon = nlon - 360
                                if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(tlon, clat)
                                    newpos = this.geoToCanvas(tnlon, nlat)
                                    this.ctx.moveTo(oldpos[0], oldpos[1])
                                    this.ctx.lineTo(newpos[0], newpos[1])
                                }
                            }
                        }
                        this.ctx.stroke()
                        this.ctx.closePath()
                    }
                }
            }
        }
        this.props.map.render()
    }

    componentDidMount() {
        let selected_model = this.props.selected_model
        for(let file_number in _.range(0, selected_model.num_files)){
            let file_number_str = `${file_number < 10 ? '0' + file_number : file_number}`
            let url = `${this.props.url}/${selected_model.file}_${file_number_str}.txt`
            d3.text(url).then( (blob) => this.readZipStepOne(blob, file_number))
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // console.log("Component update")
        this.updateAnimation()
        let picker = $('.pv-pcolor')
        if(this.state.display_picker){
            picker.show()
        }else{
            picker.hide()
        }
    }

    /**
     * Generic function to update a variable (size, speed)
     * @param old_value
     * @param mode
     * @param amount
     * @returns {*}
     */
    updateValue(old_value, mode, amount = 1) {
        let new_value = old_value
        if (mode === MODES.increase) {
            if (old_value >= 1) {
                new_value += amount
            } else {
                new_value *= 2
            }
        } else {
            if ((old_value - amount) > 0) {
                new_value -= amount
            } else {
                new_value /= 2
            }
        }
        return new_value
    }

    increaseSpeed(e) {
        let new_speed = this.updateValue(this.state.speed_hz, MODES.increase, 2)
        this.setState({
            speed_hz: new_speed
        })
        e.preventDefault()
    }

    decreaseSpeed(e) {
        let new_speed = this.updateValue(this.state.speed_hz, MODES.decrease, 2)
        this.setState({
            speed_hz: new_speed
        })
        e.preventDefault()
    }

    increaseSize(e) {
        let new_size = this.updateValue(this.state.particle_size_index, MODES.increase)
        this.setState({
            particle_size_index: new_size
        })
        e.preventDefault()
    }

    decreaseSize(e) {
        let new_size = this.updateValue(this.state.particle_size_index, MODES.decrease)
        this.setState({
            particle_size_index: new_size
        })
        e.preventDefault()
    }

    increaseTransparency(e) {
        let new_trans = this.state.transparency_index
        if (new_trans < (Object.keys(TRAIL_SIZE).length)) {
            new_trans += 1
        }
        this.setState({
            transparency_index: new_trans
        })
        e.preventDefault()
    }

    decreaseTransparency(e) {
        let new_trans = this.state.transparency_index
        if (new_trans > 0) {
            new_trans -= 1
        }
        this.setState({
            transparency_index: new_trans
        })
        e.preventDefault()
    }

    playPause(e) {
        e.preventDefault()
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
        // e.preventDefault()
        let cur_time_step = parseInt(e.target.value)
        this.time_step = cur_time_step
        let canvas = this.d3canvas.node()
        this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.drawAnimationFrame()
        this.updateRange()
    }

    updateRange(){
        this.setState({
            range_time_step: this.time_step
        })
    }

    nextDay(e) {
        e.preventDefault()
        this.time_step = Math.min(this.time_step + 1, this.state.total_timesteps[this.state.selected_model.id])
        this.drawAnimationFrame(this.d3canvas.node())
        this.updateRange()
    }

    prevDay(e) {
        e.preventDefault()
        this.draw_until_day = true
        this.time_step = Math.max(this.time_step - 1, 1)
        let canvas = this.d3canvas.node()
        this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        this.drawAnimationFrame()
        this.updateRange()
    }

    togglePlayDirection(e) {
        let canvas = this.d3canvas.node()
        this.ctx.clearRect(0, 0, canvas.width, canvas.height)
        e.preventDefault()
        this.setState({
            play_backward: !(this.state.play_backward)
        })
    }

    /**
     * This function is used to change icon and color sizes
     * @param value
     * @param inv
     * @param color
     * @returns {string}
     */
    getIconColorSize(value, inv = false, color = false) {
        if (inv) {
            value = 6 - value
        }

        if (color) {
            if (value === 5) {
                return "darkred"
            } else {
                return "black"
            }

        } else {
            switch (value) {
                case 5:
                    return "lg"
                case 4:
                    return "lg"
                case 3:
                    return "1x"
                case 2:
                    return "sm"
                case 1:
                    return "xs"
                default:
                    return "1x"
            }

        }
    }

    getIconColorSizeBoostrap(value, inv = false, color = false) {
        if (inv) {
            value = 6 - value
        }

        if (color) {
            if (value === 5) {
                return "darkred"
            } else {
                return "black"
            }

        } else {
            switch (value) {
                case 5:
                    return 24
                case 4:
                    return 22
                case 3:
                    return 20
                case 2:
                    return 18
                case 1:
                    return 16
                default:
                    return 20
            }

        }
    }

    /**
     * Draws the date in the 'title' div. Everytime
     */
    updateDateTxt() {
        let start_date = this.state.start_date
        let title = d3.select("#dates-title")
        let cur_date = new Date(start_date.getTime() + this.time_step * this.state.delta_t)
        // let cur_date = Date.now()
        title.text(this.state.date_format(cur_date))
    }

    toggleShapeType(){
        this.setState({
            shape_type: !(this.state.shape_type)
        })
    }

    toggleLayersContainer(){
        this.setState({
            display_layers: !(this.state.display_layers)
        })
    }

    toggleAllLayerDisplay(e){
        e.persist()
        e.preventDefault()
        let disp_all_layers = !this.state.toggle_all_layers_display

        let all_color_schemes = this.state.color_scheme
        let color_scheme = all_color_schemes[this.state.selected_model.id]
        for(let id=0; id < color_scheme.length; id++) {
            color_scheme[id].display = disp_all_layers
        }

        all_color_schemes[this.state.selected_model.id] = color_scheme
        this.setState({
            color_scheme: all_color_schemes,
            toggle_all_layers_display: disp_all_layers
        })
    }

    toggleLayerDisplay(e){
        e.persist()
        e.preventDefault()
        let id = parseInt(e.target.id)

        let all_color_schemes = this.state.color_scheme
        let color_scheme = all_color_schemes[this.state.selected_model.id]
        color_scheme[id].display = !color_scheme[id].display

        all_color_schemes[this.state.selected_model.id] = color_scheme
        this.setState({
            color_scheme: all_color_schemes
        })
    }

    render() {
        // xs < 576,  >= 576 sm, >= 768 md, >= 992 lg , >= 1200 ex
        if(isMobile ||  window.innerWidth < 992){
            // if(true){
            return (
                <Container fluid>
                    {/*---- Trail size---------*/}
                    <Row>
                        <Col xs={7} > <span className={"mt-1"}>Trail size</span> </Col>
                        <Col xs={5} >
                            <span style={{display: "inline-block", width: "25px"}}>
                                <ArrowRight
                                    size={this.getIconColorSizeBoostrap(this.state.transparency_index, true)}/>
                            </span>
                            <button className="btn btn-info btn-sm " onClick={this.increaseTransparency}
                                    title="Decrease litter trail"
                                    disabled={this.state.transparency_index === (Object.keys(TRAIL_SIZE).length) ||
                                        this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                <Dash size={default_size}/>
                            </button>
                            {" "}
                            <button className="btn btn-info btn-sm" onClick={this.decreaseTransparency}
                                    title="Increase litter trail"
                                    disabled={this.state.transparency_index === 1 ||
                                        this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                <Plus size={default_size}/>
                            </button>
                        </Col>
                    </Row>
                    {/*---- Particle size ---------*/}
                    <Row className={"mt-1"}>
                        <Col xs={7} ><span>Particle size</span></Col>
                        <Col xs={5} >
                             <span style={{display: "inline-block", width: "25px"}}>
                             <CircleFill
                                 size={this.getIconColorSizeBoostrap(this.state.particle_size_index, false)}/>
                             </span>
                            <button className="btn btn-info btn-sm" onClick={this.decreaseSize}
                                    title="Decrease litter size"
                                    disabled={this.state.particle_size_index === 1 || this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                <Dash size={default_size}/>
                            </button>
                            {" "}
                            <button className="btn btn-info btn-sm" onClick={this.increaseSize}
                                    title="Increase litter size"
                                    disabled={this.state.particle_size_index === (Object.keys(PARTICLE_SIZES).length) || this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                <Plus size={default_size}/>
                            </button>
                        </Col>
                    </Row>
                    {/*---- Range Current day ------------*/}
                    <Row >
                        <Col xs={7} ><span>Date selection</span></Col>
                        <Col xs={5} >
                            <span id="date_range" className="navbar-brand mt-1"
                                  data-position="bottom">
                                         <Form.Control type="range"
                                                       className="range-ml"
                                                       title="Date selection"
                                                       onChange={this.changeDayRange}
                                                       value={this.time_step}
                                                       min="0" max={(this.state.status === STATUS.loading ||
                                             this.state.status === STATUS.decompressing) ? 0 :
                                             this.state.total_timesteps[this.state.selected_model.id] - 2} custom />
                            </span>
                        </Col>
                    </Row>
                    {/*---- Particle Shape & Color ------------*/}
                    <Row className={'mb-1'}>
                        <Col xs={7} ><span>Shape</span></Col>
                        <Col xs={5}>
                            <button className={`btn btn-sm btn-info`}
                                    onClick={this.toggleShapeType}
                                    disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                {this.state.shape_type ?
                                    <Slash size={default_size}/>
                                    :
                                    <SquareFill size={default_size}/>
                                }
                            </button>
                            {/*{" "}*/}
                            {/*<button className={`btn btn-sm btn-info `}*/}
                            {/*        onClick={() => this.setState({display_picker:!this.state.display_picker})}*/}
                            {/*        title="Color selection"*/}
                            {/*        disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>*/}
                            {/*     {this.state.display_picker?*/}
                            {/*         <Brush size={default_size}/>*/}
                            {/*         :*/}
                            {/*         <BrushFill size={default_size}/>*/}
                            {/*     }*/}
                            {/*</button>*/}
                        </Col>
                    </Row>
                    <Row>
                        {/*---- Animation controls --------*/}
                        <Col xs={6} ><span>Animation controls</span></Col>
                        <Col xs={6} >
                            <ButtonGroup>
                                {/*---- Decrease speed --------*/}
                                <button className={`btn btn-info btn-sm ${this.state.status !== STATUS.paused? 'd-block':'d-none'}`}
                                        onClick={this.decreaseSpeed}
                                        disabled={this.state.speed_hz <= .6}>
                                    <SkipBackwardFill size={default_size}/>
                                </button>
                                {/*---- Previous day --------*/}
                                <button id="pt" className={`btn btn-info btn-sm ${this.state.status === STATUS.paused? 'd-block':'d-none'}`}
                                        onClick={this.prevDay}>
                                    <SkipStartFill size={default_size}/>
                                </button>
                                {/*---- Play Backward--------*/}
                                <button id='bk' className={`btn btn-info btn-sm`} onClick={this.togglePlayDirection}>
                                    {this.state.play_backward?
                                        <ArrowClockwise size={default_size}/>
                                        :
                                        <ArrowCounterclockwise size={default_size}/>
                                    }
                                </button>
                                {/*---- Play/Pause--------*/}
                                <button className={`btn btn-info btn-sm ${this.state.play_backward ? 'pv-flipped' : ''}`}
                                        onClick={this.playPause}>
                                    {this.state.status === STATUS.playing ?
                                        <PauseFill size={default_size}/> :
                                        <PlayFill size={default_size}/>}
                                </button>
                                {/*---- Next day--------*/}
                                <button id="nt" className={`btn btn-info btn-sm ${this.state.status === STATUS.paused? 'd-block':'d-none'}`}
                                        onClick={this.nextDay}>
                                    <SkipEndFill size={default_size}/>
                                </button>
                                {/*---- Increase speed --------*/}
                                <button className={`btn btn-info btn-sm ${this.state.status !== STATUS.paused? 'd-block':'d-none'}`}
                                        onClick={this.increaseSpeed}
                                        disabled={this.state.speed_hz >= MAX_ANIMATION_SPEED}>
                                    <SkipForwardFill size={default_size}/>
                                </button>
                            </ButtonGroup>
                        </Col>
                    </Row>
                    {/*---- Layers Selection --------*/}
                    <Row className={"mt-1"}>
                        <Col xs={7} ><span>Layers</span></Col>
                        <Col xs={5} >
                            <span style={{display: "inline-block", width: "25px"}}>
                                 <button className={`btn btn-sm btn-info d-md-none d-lg-inline mr-2`}
                                         onClick={this.toggleLayersContainer}
                                         title="Toogle layers dropdown"
                                         disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                             {this.state.display_layers?
                                 <ListCheck size={default_size}/>
                                 :
                                 <List size={default_size}/>
                             }
                             </button>
                             </span>
                        </Col>
                    </Row>
                    <div id='layers' className={`position-fixed pv-layerslistcontainer my_round ${this.state.display_layers? 'd-block':'d-none'}`}>
                        <Form className="bg-light">
                            <Row  >
                                <Col xs={9}>
                                    <Form.Check
                                        type="switch"
                                        key="all"
                                        id="all"
                                        label="All"
                                        checked={this.state.toggle_all_layers_display}
                                        onChange={this.toggleAllLayerDisplay}
                                        className="m-2"
                                    ></Form.Check>
                                </Col>
                                <Col xs={3} >
                                    <Button variant="info"
                                            size="sm"
                                            onClick={this.toggleLayersContainer} title="Close layers " >
                                        <X size={default_size}/>
                                    </Button>
                                </Col>
                            </Row>
                            {!_.isUndefined(this.state.color_scheme[this.state.selected_model.id]) ?
                                <Row  className='bg-light'>
                                    <Col>
                                        <ul className="pv-layerslist">
                                            {this.state.color_scheme[this.state.selected_model.id].length ?
                                                this.state.color_scheme[this.state.selected_model.id].map(c_layer => (
                                                    <li key={c_layer.id}>
                                                        <Form.Check
                                                            type="switch"
                                                            key={c_layer.id}
                                                            id={c_layer.id}
                                                            label={c_layer.name}
                                                            checked={c_layer.display}
                                                            onChange={this.toggleLayerDisplay}
                                                            className="m-1"
                                                        ></Form.Check>
                                                    </li>
                                                ))
                                                : <span></span>
                                            }
                                        </ul>
                                    </Col>
                                </Row>
                                :
                                <span></span>
                            }
                        </Form>
                    </div>
                </Container>
            )
        }else {
            this.props.chardin.refresh()
            return (
                <span className="mt-1">
                     {/*---- Size of Streamline ---------*/}
                    <span className="navbar-brand col-auto viz-control" data-intro={"Path length"} data-position={"bottom"}>
                                         <span style={{display: "inline-block", width: "25px"}}>
                                         <ArrowRight
                                             size={this.getIconColorSizeBoostrap(this.state.transparency_index, true)}/>
                                         </span>
                                         <button className="btn btn-info btn-sm " onClick={this.increaseTransparency}
                                                 title="Decrease litter trail"
                                                 disabled={this.state.transparency_index === (Object.keys(TRAIL_SIZE).length) ||
                                                     this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                         <Dash size={default_size}/>
                                         </button>
                        {" "}
                        <button className="btn btn-info btn-sm" onClick={this.decreaseTransparency}
                                title="Increase litter trail"
                                disabled={this.state.transparency_index === 1 ||
                                    this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                         <Plus size={default_size}/>
                                         </button>
                                         </span>
                    {/*---- Particle size ---------*/}
                    <span className="navbar-brand col-auto viz-control" data-intro={"Particle size"} data-position={"bottom"}>
                                         <span style={{display: "inline-block", width: "25px"}}>
                                         <CircleFill
                                             size={this.getIconColorSizeBoostrap(this.state.particle_size_index, false)}/>
                                         </span>
                                         <button className="btn btn-info btn-sm" onClick={this.decreaseSize}
                                                 title="Decrease litter size"
                                                 disabled={this.state.particle_size_index === 1 || this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                         <Dash size={default_size}/>
                                         </button>
                        {" "}
                        <button className="btn btn-info btn-sm" onClick={this.increaseSize}
                                title="Increase litter size"
                                disabled={this.state.particle_size_index === (Object.keys(PARTICLE_SIZES).length) || this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                         <Plus size={default_size}/>
                                         </button>
                                         </span>
                    {/*---- Particle Shape & Color ------------*/}
                    <span className="navbar-brand col-auto" data-intro={"Particle shape & color"} data-position={"bottom"}>
                             <button className={`btn btn-sm btn-info d-md-none d-lg-inline mr-2`}
                                     onClick={this.toggleShapeType}
                                     title="Shape selection"
                                     disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                             {this.state.shape_type ?
                                 <Slash size={default_size}/>
                                 :
                                 <SquareFill size={default_size}/>
                             }
                             </button>
                            <button className={`btn btn-sm btn-info d-md-none d-lg-inline `}
                                    onClick={() => this.setState({display_picker:!this.state.display_picker})}
                                    title="Color selection"
                                    disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                                 {this.state.display_picker?
                                     <Brush size={default_size}/>
                                     :
                                     <BrushFill size={default_size}/>
                                 }
                            </button>
                    </span>
                    <span className="position-fixed pv-pcolor">
                        <TwitterPicker className="position-fixed"
                                       color={this.state.particle_color}
                                       onChange={this.changeParticleColor}
                                       triangle="hide" />
                    </span>
                    {/*---- Range Current day ------------*/}
                    <span id="date_range" className="navbar-brand m-1 range-ml" data-intro="Time selection" data-position="bottom">
                        <span className={"mt-5"}>
                             <Form.Control type="range"
                                           title="Date selection"
                                           onChange={this.changeDayRange}
                                           value={this.time_step}
                                           min="0" max={(this.state.status === STATUS.loading ||
                                 this.state.status === STATUS.decompressing) ? 0 :
                                 this.state.total_timesteps[this.state.selected_model.id] - 2}
                                           custom
                                           disabled={this.state.status === STATUS.loading}/>
                       </span>
                     </span>
                    {/*---- Animation controls --------*/}
                    <span className="navbar-brand col-auto anim-controls" data-intro="Animation controls" data-position="bottom">
                         <ButtonGroup>
                         {/*---- Decrease speed --------*/}
                             <OverlayTrigger
                                 placement="bottom"
                                 delay={{show: 1, hide: 1}}
                                 overlay={(props) => ( <Tooltip id="tooltip_dspeed" {...props}> Decrease animation speed </Tooltip>)}>
                         <button className={`btn btn-info btn-sm`} type="button"
                                 onClick={this.decreaseSpeed}
                                 disabled={this.state.speed_hz <= .6}>
                             <SkipBackwardFill size={default_size}/>
                         </button>
                         </OverlayTrigger>
                             {/*---- Previous day --------*/}
                             <OverlayTrigger
                                 placement="bottom"
                                 delay={{show: 1, hide: 1}}
                                 overlay={(props) => ( <Tooltip id="tooltip_pday" {...props}> Previous time step</Tooltip>)}>
                         {/*<button id="pt" className={`btn btn-info btn-sm ${this.state.status === STATUS.paused? 'd-block':'d-none'}`} type="button"*/}
                                 <button id="pt" className={`btn btn-info btn-sm`} type="button"
                                         onClick={this.prevDay}>
                             <SkipStartFill size={default_size}/>
                         </button>
                         </OverlayTrigger>
                             {/*---- Play Backward--------*/}
                             <OverlayTrigger placement="bottom" delay={{show: 1, hide: 1}} overlay={(props) => ( <Tooltip id="tooltip_pflip" {...props}>
                                 {this.state.play_backward? "Play Forward": "Play Backward"} </Tooltip>)}>
                             <button className={`btn btn-info btn-sm`} onClick={this.togglePlayDirection}>
                                 {this.state.play_backward?
                                     <ArrowClockwise size={default_size}/>
                                     :
                                     <ArrowCounterclockwise size={default_size}/>
                                 }
                             </button>
                         </OverlayTrigger>
                             {/*---- Play/Pause--------*/}
                             <OverlayTrigger placement="bottom" delay={{show: 1, hide: 1}} overlay={(props) => ( <Tooltip id="tooltip_ppause" {...props}> Play/Pause </Tooltip>)}>
                         <button className={`btn btn-info btn-sm ${this.state.play_backward ? 'pv-flipped' : ''}`}
                                 onClick={this.playPause}>
                             {this.state.status === STATUS.playing ?
                                 <PauseFill size={default_size}/> :
                                 <PlayFill size={default_size}/>}
                         </button>
                         </OverlayTrigger>
                             {/*---- Next day--------*/}
                             <OverlayTrigger
                                 placement="bottom"
                                 delay={{show: 1, hide: 1}}
                                 overlay={(props) => (
                                     <Tooltip id="tooltip_nday" {...props}> Next time step </Tooltip>)}>
                                 <button id="nt" className={`btn btn-info btn-sm `} onClick={this.nextDay}>
                             <SkipEndFill size={default_size}/>
                         </button>
                         </OverlayTrigger>
                             {/*---- Increase speed --------*/}
                             <OverlayTrigger
                                 placement="bottom"
                                 delay={{show: 1, hide: 1}}
                                 overlay={(props) => (
                                     <Tooltip id="tooltip_inc_speed" {...props}> Increase animation
                                         speed</Tooltip>)}>
                         {/*<button className={`btn btn-info btn-sm ${this.state.status === STATUS.playing? 'd-block':'d-none'}`} onClick={this.increaseSpeed}*/}
                                 <button className={`btn btn-info btn-sm `} onClick={this.increaseSpeed}
                                         disabled={this.state.speed_hz >= MAX_ANIMATION_SPEED}>
                             <SkipForwardFill size={default_size}/>
                         </button>
                         </OverlayTrigger>
                         </ButtonGroup>
                    </span>
                    {/*---- Layers Selection --------*/}
                    <span className="navbar-brand col-auto" data-intro={"Layers"} data-position={"bottom"}>
                             <button className={`btn btn-sm btn-info d-md-none d-lg-inline mr-2`}
                                     onClick={this.toggleLayersContainer}
                                     title="Toogle layers dropdown"
                                     disabled={this.state.status === STATUS.loading || this.state.status === STATUS.decompressing}>
                             {this.state.display_layers?
                                 <ListCheck size={default_size}/>
                                 :
                                 <List size={default_size}/>
                             }
                             </button>
                     </span>
                    <div className={`position-fixed pv-layerslistcontainer my_round ${this.state.display_layers? 'd-block':'d-none'}`}>
                        <Form className="bg-light">
                            <Row  >
                                <Col xs={9}>
                                    <Form.Check
                                        type="switch"
                                        key="all"
                                        id="all"
                                        label="All"
                                        checked={this.state.toggle_all_layers_display}
                                        onChange={this.toggleAllLayerDisplay}
                                        className="m-2"
                                    ></Form.Check>
                                </Col>
                                <Col xs={3} >
                                   <Button variant="info"
                                           size="sm"
                                           onClick={this.toggleLayersContainer} title="Close layers " >
                                         <X size={default_size}/>
                                    </Button>
                                </Col>
                            </Row>
                            {!_.isUndefined(this.state.color_scheme[this.state.selected_model.id]) ?
                                <Row className='bg-light'>
                                    <Col>
                                        <ul className="pv-layerslist">
                                            {this.state.color_scheme[this.state.selected_model.id].length ?
                                                this.state.color_scheme[this.state.selected_model.id].map(c_layer => (
                                                    <li key={c_layer.id}>
                                                        <Form.Check
                                                            type="switch"
                                                            key={c_layer.id}
                                                            id={c_layer.id}
                                                            label={c_layer.name}
                                                            checked={c_layer.display}
                                                            onChange={this.toggleLayerDisplay}
                                                            className="m-1"
                                                        ></Form.Check>
                                                    </li>
                                                ))
                                                : <span>Single one</span>
                                            }
                                        </ul>
                                    </Col>
                                </Row>
                                :
                                <span>Single one</span>
                            }
                        </Form>
                    </div >
                 </span>
            )
        }
    }
}

export default ParticlesLayer
