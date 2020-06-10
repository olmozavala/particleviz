import React from 'react'
import './css/App.css'
import './css/Animations.css'
import * as d3 from "d3"
import ImageLayer from "ol/layer/Image"
import ImageCanvasSource from "ol/source/ImageCanvas"
// import {toLonLat} from "ol/proj"
// import {getCenter} from "ol/extent"
import _ from "lodash"
import $ from 'jquery';
import 'animate.css'
import {
    ArrowRight, CircleFill, Plus, Dash,
    PlayFill, PauseFill,
    SkipBackwardFill, SkipForwardFill,
    SkipEndFill, SkipStartFill,
} from 'react-bootstrap-icons'

import {Form, ProgressBar} from "react-bootstrap"

import JSZip from "jszip"
import {ButtonGroup} from "react-bootstrap"

const default_size = 15
const STATUS = {
    loading: 0,
    decompressing: 1,
    paused: 2,
    playing: 3,
}

// How much transparency should we add
const TRAIL_SIZE = {
    1: .020,
    2: .040,
    3: .080,
    4: .12,
    5: .4
}

const PARTICLE_SIZES= {
    1: .6,
    2: 1.4,
    3: 2,
    4: 4,
    5: 6,
}

// const PARTICLE_SIZE_TXT = {
//     1: 'Biggest ',
//     2: 'Bigger  ',
//     3: 'Default ',
//     4: 'Smaller ',
//     5: 'Smallest'
// }

// Modes in how to increase/decrase a variable
const MODES={
    increase:1,
    decrease:2
}

const DRAW_LAST_DAYS = 60
const MAX_ANIMATION_SPEED = 45

class  ParticlesLayer extends React.Component {
    constructor(props) {
        super(props)

        // Setting up d3 objects
        this.d3Projection = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3ProjectionEast = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3ProjectionWest = d3.geoEquirectangular().scale(1).translate([0, 0]);//Corresponds to EPSG:4326
        this.d3GeoGenerator = d3.geoPath().projection(this.d3Projection)
        this.d3GeoGeneratorEast = d3.geoPath().projection(this.d3ProjectionEast)
        this.d3GeoGeneratorWest = d3.geoPath().projection(this.d3ProjectionWest)
        this.d3canvas = d3.select("#particle_canvas")
        // https://github.com/d3/d3-time-format
        this.dateFormat = d3.timeFormat("%B %e, %Y ")

        this.state = {
            time_step: 0,
            speed_hz: 10,
            transparency_index: 3,
            status: STATUS.loading,
            particle_size_index: 3,
            selected_model: this.props.selected_model,
            canvas_layer: -1,
            loaded_files: 0,
            data: {},
            data_geo: null,
            extent: null,
            domain: null,
            ol_canvas_size: null,
            total_timesteps: {},
            index_by_country: {},
        }
        this.canvasWidth = 0
        this.canvasHeight = 0
        this.draw_until_day = true; // Used to redraw all the positions until current time

        // THis is repeated should go ina function
        for (let i = 0; i < this.props.selected_model.num_files; i++) {
            let url = `${this.props.url}/${this.props.selected_model.file}_${i < 10 ? '0' + i : i}.zip`
            console.log(`Num of files ${this.props.selected_model.num_files}, reading ${url}`)
            d3.blob(url).then((blob) => this.readOneZip(blob, i))
        }

        this.d3canvas = d3.select(document.createElement("canvas")).attr("id", "particle_canvas")
        if (this.d3canvas.empty()) {
            // console.log("Initializing canvas")
            this.d3canvas = d3.select(document.createElement("canvas"))
                .attr("id", "particle_canvas")
            this.d3canvas.getContext('2d', { alpha: false });
        }

        // this.getFeatures = this.getFeatures.bind(this)
        this.drawLitter = this.drawLitter.bind(this)
        // this.drawParticles = this.drawParticles.bind(this)
        this.drawLines = this.drawLines.bind(this)
        this.canvasFunction = this.canvasFunction.bind(this)
        this.getIconColorSize = this.getIconColorSize.bind(this)
        this.getIconColorSizeBoostrap = this.getIconColorSizeBoostrap.bind(this)
        this.drawNextDay = this.drawNextDay.bind(this)
        this.increaseSpeed = this.increaseSpeed.bind(this)
        this.decreaseSpeed = this.decreaseSpeed.bind(this)
        this.increaseSize = this.increaseSize.bind(this)
        this.decreaseSize = this.decreaseSize.bind(this)
        this.updateAnimation = this.updateAnimation.bind(this)
        this.increaseTransparency = this.increaseTransparency.bind(this)
        this.readOneZip = this.readOneZip.bind(this)
        this.decreaseTransparency = this.decreaseTransparency.bind(this)
        this.playPause = this.playPause.bind(this)
        this.changeDayRange = this.changeDayRange.bind(this)
        this.readTwoUnzippedFile = this.readTwoUnzippedFile.bind(this)
        this.clearPreviousLoop = this.clearPreviousLoop.bind(this)
        this.nextDay = this.nextDay.bind(this)
        this.prevDay = this.prevDay.bind(this)
        this.displayCurrentDay = this.displayCurrentDay.bind(this)
        this.geoToCanvas = this.geoToCanvas.bind(this)
        // this.updateAllData = this.updateAllData.bind(this)
    }

    readTwoUnzippedFile(txtdata, filenum) {
        // console.log(`Uncompressed file received, file number: ${filenum} ....`)
        let data = JSON.parse(txtdata)
        let th = 10

        // console.log("Reading final json data!!!!!!! ", data)
        this.country_keys = Object.keys(data) // fixing those particles that 'jump' the map
        let total_timesteps = data[this.country_keys[0]]["lat_lon"][0][0].length
        let loc_index_by_country = {}
        for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
            let this_country_idx = []
            let cur_country = data[this.country_keys[cur_country_id]]
            let tot_part = cur_country["lat_lon"][0].length
            for (let part_id = 0; part_id < tot_part; part_id++) {
                for (let c_time = 0; c_time < total_timesteps - 1; c_time++) {
                    let lon = data[this.country_keys[cur_country_id]]["lat_lon"][1][part_id][c_time]
                    let nlon = data[this.country_keys[cur_country_id]]["lat_lon"][1][part_id][c_time + 1]

                    if ((lon !== 200) && (nlon !== 200)) {
                        if (((lon > th) && (nlon < -th)) || ((lon < -th) && (nlon > th))) {
                            // console.log(`This is added ${lon} and ${nlon} part ${part_id} time ${c_time}`)
                            data[this.country_keys[cur_country_id]]["lat_lon"][1][part_id][c_time] = 200
                        }
                    }
                }
                loc_index_by_country[cur_country_id] = this_country_idx
            }
        }

        let global_index_by_country = this.state.index_by_country
        global_index_by_country[filenum] = loc_index_by_country
        // console.log("Global index by country: ", global_index_by_country)
        let cur_state = this.state.status

        // Update the progress bar
        if (this.state.loaded_files >= (this.state.selected_model.num_files - 3)) {
            // console.log("Done reading and uncompressing all the files!!!!")
            // console.log(this.state.total_timesteps + total_timesteps)
            cur_state = STATUS.playing
            // cur_state = STATUS.paused
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
        current_data[model_id][filenum] = data

        // console.log("\t Total timesteps: ", this.state.total_timesteps)
        if(filenum == 0) {
            let country_names = this.country_keys.map((x) => x.toLowerCase())
            let ocean_names = this.country_keys.map((x) => data[x]['oceans'])
            let continent_names = this.country_keys.map((x) => data[x]['continent'])

            // console.log("\t Countries names: ", country_names)
            // console.log("\t Ocean names: ", ocean_names)
            // console.log("\t Continent names: ", continent_names)

            let canv_lay = null
            if (this.state.canvas_layer === -1) {
                let canv_lay = new ImageLayer({
                    source: new ImageCanvasSource({
                        canvasFunction: this.canvasFunction
                    })
                })
                // this.props.map.addLayer(canv_lay)
                let map_layers = this.props.map.getLayers()
                map_layers.insertAt(2, canv_lay)
            }
            this.props.updateCountriesData(country_names, ocean_names, continent_names)

            // console.log("Model time steps:", model_timesteps)
            this.setState({
                canvas_layer: canv_lay,
                data: {...current_data},
                loaded_files: this.state.loaded_files + 1,
                total_timesteps: {...model_timesteps},
                status: cur_state,
                index_by_country: global_index_by_country
            })
        }else{
            console.log("Model time steps:", model_timesteps)
            this.setState({
                data: {...current_data},
                loaded_files: this.state.loaded_files + 1,
                total_timesteps: {...model_timesteps},
                status: cur_state,
                index_by_country: global_index_by_country
            })
        }
        // console.log("Done reading!")
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
        return [nlon, nlat]
    }

    // updateAllData(extent, domain, size) {
    //     console.log("Updating positions....")
    //     let geoData = _.cloneDeep(this.state.data)
    //     for (let c_time = 0; c_time < this.state.total_timesteps; c_time++) {
    //         for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
    //             let cur_country = geoData[this.country_keys[cur_country_id]]
    //             let tot_part = cur_country["lat_lon"][0].length
    //             for (let part_id = 0; part_id < tot_part; part_id++) {
    //                 let lon = geoData[this.country_keys[cur_country_id]]["lat_lon"][1][part_id][c_time]
    //                 let lat = geoData[this.country_keys[cur_country_id]]["lat_lon"][0][part_id][c_time]
    //                 geoData[this.country_keys[cur_country_id]]["lat_lon"][1][part_id][c_time] = ((lon - extent[0]) / domain[0]) * size[0]
    //                 geoData[this.country_keys[cur_country_id]]["lat_lon"][0][part_id][c_time] = size[1] - (((lat - extent[1]) / domain[1]) * size[1])
    //             }
    //         }
    //     }
    //     console.log("Done!....")
    //     return geoData
    // }
    canvasFunction(extent, resolution, pixelRatio, size, projection) {
        // console.log(`Canvas Function Extent:${extent}, Res:${resolution}, Size:${size} projection:`, projection)

        this.canvasWidth = size[0]
        this.canvasHeight = size[1]
        this.draw_until_day = true; // Used to redraw all the positions until current time

        this.d3canvas.attr('width', this.canvasWidth).attr('height', this.canvasHeight)
        let ctx = this.d3canvas.node().getContext('2d')
        ctx.lineCap = 'round'; // butt, round, square

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
            if ((this.state.status === STATUS.decompressing) && (this.state.loaded_files >= this.state.selected_model.num_files)) {
                new_status = STATUS.playing
            }

            this.setState({
                extent: extent,
                domain: domain,
                ol_canvas_size: size,
                status: new_status,
                // data_geo: data_geo
            })
        }

        return this.d3canvas.node()
    }

    clearPreviousLoop() {
        if (!_.isUndefined(this.interval)) {
            clearInterval(this.interval)
        }
    }

    /**
     * Updates the animation with the current frame rate
     */
    updateAnimation() {
        this.clearPreviousLoop()
        // Verify the update was caused by the parent component and we have updated
        // the file to read.
        if (this.state.selected_model !== this.props.selected_model) {
            if(_.isUndefined(this.state.data[this.props.selected_model.id])){
                this.setState({
                    time_step: 0,
                    loaded_files: 0,
                    selected_model: this.props.selected_model,
                    status: STATUS.loading,
                })
                for (let i = 0; i < this.props.selected_model.num_files; i++) {
                    let url = `${this.props.url}/${this.props.selected_model.file}_${i < 10 ? '0' + i : i}.zip`
                    console.log(`Num of files ${this.props.selected_model.num_files}, reading ${url}`)
                    d3.blob(url).then((blob) => this.readOneZip(blob, i))
                }
            }else{
                // console.log("Filas has been loaded previously")
                this.setState({
                    time_step: 0,
                    selected_model: this.props.selected_model,
                    cur_state: STATUS.playing
                })
            }
        } else {
            let canvas = this.d3canvas.node()
            if (this.state.status === STATUS.playing) {
                    if (!_.isNull(canvas)) {
                        this.interval = setTimeout(() => this.drawNextDay(canvas), (1.0 / this.state.speed_hz) * 1000)
                    }
            }
            if (this.state.status === STATUS.paused) {
                if (!_.isNull(canvas)) {
                    this.drawNextDay(canvas)
                }
            }
        }
    }

    /**
     * Reads a zip file and dispatches the correct function after unziping
     * @param blob
     */
    readOneZip(blob, filenum) {
        // console.log(`File has been received! file number ${filenum}`, blob)
        let zip = new JSZip()
        zip.loadAsync(blob)
            .then(function (zip) {
                // you now have every files contained in the loaded zip
                // console.log(`Received zip for file number ${filenum}:`, zip)
                for (let file in zip.files) {
                    let zipobj = zip.files[file]
                    return zipobj.async("string")
                }
            })
            .then((txtdata) => this.readTwoUnzippedFile(txtdata, filenum))

        this.setState({
            status: STATUS.decompressing
        })
    }

    /**
     * Draws a single day of litter using D3
     */
    drawNextDay(canvas) {
        let ctx = canvas.getContext('2d')
        if (this.state.time_step === 0) {
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)
        } else {
            // Make previous frame a little bit transparent
            // var prev = ctx.globalCompositeOperation
            // ctx.globalCompositeOperation = "destination-out"
            ctx.fillStyle = `rgba(255, 255, 255, ${TRAIL_SIZE[this.state.transparency_index]})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            // ctx.globalCompositeOperation = prev
            ctx.fill()
        }
        // Draw next frame
        this.drawLitter(ctx)

        if (this.state.status === STATUS.playing) {
            let next_time_step = (this.state.time_step + 1) % this.state.total_timesteps[this.state.selected_model.id]
            // console.log(`Setting the time: ${next_time_step}`)
            this.setState({
                time_step: next_time_step
            })
        }
    }

    /**
     * Draws the ocean litter, as particles or as lines
     * @param ctx
     */
    drawLitter(ctx) {
        this.drawLines(ctx)
        // this.drawParticles(ctx)
    }

    /**
     * Draws the particles for a single day. It iterates over different countries
     * @param ctx Context of the canvas object to use
     */
    // drawParticles(ctx) {
    //     let countries = this.getFeatures('points')
    //     for (let i = 0; i < countries.length; i++) {
    //         ctx.beginPath()
    //         ctx.fillStyle = this.props.colors_by_country[countries[i].country.toLowerCase()]
    //         this.d3GeoGenerator({type: 'FeatureCollection', features: countries[i].features})
    //         this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features})
    //         this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features})
    //         if(this.show_west_map) {
    //             this.d3GeoGeneratorWest({type: 'FeatureCollection', features: countries[i].features})
    //         }
    //         if(this.show_east_map) {
    //             this.d3GeoGeneratorEast({type: 'FeatureCollection', features: countries[i].features})
    //         }
    //         ctx.fill()
    //         ctx.closePath()
    //     }
    //     this.props.map.render()
    // }

    drawLines(ctx) {
        ctx.lineWidth = PARTICLE_SIZES[this.state.particle_size_index]
        let model_id = this.state.selected_model.id
        let available_files = Object.keys(this.state.data[model_id])
        let file_number = (Math.floor(this.state.time_step / 100)).toString()
        let start_time = this.state.time_step % 100;
        // console.log(`Drawing lines time step: ${start_time} file number: ${file_number}   (global ${this.state.time_step})`)
        if (available_files.includes(file_number)) {
            for (let cur_country_id = 0; cur_country_id < this.country_keys.length; cur_country_id++) {
                ctx.beginPath()
                // Retreive all the information from the first available file
                ctx.strokeStyle = this.props.colors_by_country[this.country_keys[cur_country_id].toLowerCase()]
                let country_start = this.state.data[model_id][file_number][this.country_keys[cur_country_id]]
                let tot_part = country_start["lat_lon"][0].length
                // console.log(`local global ${local_global_start_time} global end ${global_end_time} c_time ${c_time} next_time ${next_time}` )
                let oldpos = [0, 0]
                let newpos = [0, 0]
                for (let part_id = 0; part_id < tot_part; part_id++) {
                    if (this.state.index_by_country[file_number]) {
                        let clon = country_start["lat_lon"][1][part_id][start_time]
                        let clat = country_start["lat_lon"][0][part_id][start_time]
                        let nlon = country_start["lat_lon"][1][part_id][start_time + 1]
                        let nlat = country_start["lat_lon"][0][part_id][start_time + 1]

                        if ((clon !== 200) && (nlon !== 200)) {
                            if ((clon >= this.state.extent[0]) && (clon <= this.state.extent[2])) {
                                oldpos = this.geoToCanvas(clon, clat)
                                newpos = this.geoToCanvas(nlon, nlat)
                                ctx.moveTo(oldpos[0], oldpos[1])
                                ctx.lineTo(newpos[0], newpos[1])
                            }
                            // Draw the particles on the additional map on the east
                            if ((this.state.extent[2] >= 180)) {
                                let tlon = clon + 360
                                let tnlon = nlon + 360
                                if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(tlon, clat)
                                    newpos = this.geoToCanvas(tnlon, nlat)
                                    ctx.moveTo(oldpos[0], oldpos[1])
                                    ctx.lineTo(newpos[0], newpos[1])
                                }
                            }
                            // Draw the particles on the additional map on the west
                            if ((this.state.extent[0] <= -180)) {
                                let tlon = clon - 360
                                let tnlon = nlon - 360
                                if ((tlon >= this.state.extent[0]) && (tnlon <= this.state.extent[2])) {
                                    oldpos = this.geoToCanvas(tlon, clat)
                                    newpos = this.geoToCanvas(tnlon, nlat)
                                    ctx.moveTo(oldpos[0], oldpos[1])
                                    ctx.lineTo(newpos[0], newpos[1])
                                }
                            }
                        }
                    }
                }
                ctx.stroke()
                ctx.closePath()
            }
            this.props.map.render()
        }
    }
    componentDidMount() {
        this.updateAnimation()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateAnimation()
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
        let new_speed = this.updateValue(this.state.speed_hz, MODES.increase, 5)
        this.setState({
            speed_hz: new_speed
        })
        e.preventDefault()
    }

    decreaseSpeed(e) {
        let new_speed = this.updateValue(this.state.speed_hz, MODES.decrease, 5)
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
        e.preventDefault()
        this.draw_until_day = true
        this.setState({time_step: parseInt(e.target.value)})
        let canvas = this.d3canvas.node()
        let ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    nextDay(e) {
        e.preventDefault()
        this.setState({time_step: Math.min(this.state.time_step + 1, this.state.total_timesteps[this.state.selected_model.id])})
    }

    prevDay(e) {
        e.preventDefault()
        this.draw_until_day = true
        this.setState({time_step: Math.max(this.state.time_step - 1, 1)})
        let canvas = this.d3canvas.node()
        let ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
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
    displayCurrentDay() {
        let start_date = this.state.selected_model.start_date
        let title = d3.select("#title")
        let cur_date = new Date(start_date.getTime() + this.state.time_step * 24 * 3600000)
        title.text(this.dateFormat(cur_date))
    }

    render() {
        this.displayCurrentDay()
        let perc = 0
        let perctxt = ''
        let load = document.getElementById("loading")
        if ((this.state.status === STATUS.loading) || (this.state.status === STATUS.decompressing)) {
            perc = parseInt(100 * (this.state.loaded_files / (this.state.selected_model.num_files - 2)))
            perctxt = `${perc} %`
            //VERY HARD CODED UGLY
            let load_perc = document.getElementById("load-perc")
            $(load_perc).text(perctxt)
            $(load).removeClass("d-none")
            $(load).addClass("d-inline")
            return <span></span>
        } else {
            $(load).removeClass("d-inline")
            $(load).addClass("d-none")
            return (
                <span>
                    <div className="row m-1">
                        {/*---- Transparency ---------*/}
                        <span className="navbar-brand col-auto">
                            <span style={{display: "inline-block", width: "25px"}}>
                                <ArrowRight size={this.getIconColorSizeBoostrap(this.state.transparency_index, true)}/>
                            </span>
                            <button className="btn btn-info btn-sm " onClick={this.increaseTransparency}
                                    title="Decrease litter trail"
                                    disabled={this.state.transparency_index === (Object.keys(TRAIL_SIZE).length)}>
                                    <Dash size={default_size}/>
                            </button>
                            {" "}
                            <button className="btn btn-info btn-sm" onClick={this.decreaseTransparency}
                                    title="Increase litter trail"
                                    disabled={this.state.transparency_index === 1}>
                                    <Plus size={default_size}/>
                            </button>
                        </span>
                        {/*---- Particle size ---------*/}
                        <span className="navbar-brand col-auto">
                            <span style={{display: "inline-block", width: "25px"}}>
                                <CircleFill
                                    size={this.getIconColorSizeBoostrap(this.state.particle_size_index, false)}/>
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
                        </span>
                        {/*---- Current day ------------*/}
                        <span className="navbar-brand col-md-2 d-none d-md-inline">
                            <Form.Control type="range"
                                          onChange={this.changeDayRange}
                                          value={this.state.time_step}
                                          min="0" max={this.state.total_timesteps[this.state.selected_model.id]} custom/>
                        </span>
                        {/*---- Play/Pause---------*/}
                        <span className="navbar-brand col-auto">
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
                                    <PauseFill size={default_size}/> :
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
                </span>
            )
        }
    }
}

export default ParticlesLayer
