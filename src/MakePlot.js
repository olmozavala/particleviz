import React from 'react';
import _ from "underscore";
import $ from 'jquery';
import CanvasJSReact from './canvasjs.react';
import { isMobile } from "react-device-detect";
var CanvasJSChart = CanvasJSReact.CanvasJSChart

/**
 * Reduces the size of the names to a maximum. In order to have more homogenous plots
 * @param name
 * @returns {string|*}
 */
function shortenNames(name){
    let max_size = 13
    if(name.length > max_size){
        // Search for spaces (multiple words)
        if(name.search(" ") !== -1){
            let allspaces = [...name.matchAll(new RegExp(" ", 'gi'))].map(a => a.index)
            // Select the last space before max_size
            let i = 0
            let last_space_before_max = name.length
            while((allspaces[i] < max_size) && (i < allspaces.length)){
                last_space_before_max = allspaces[i]
                i += 1
            }
            name = name.substring(0, last_space_before_max + 2)
            name = name + '.'
            return name
        }
    }
    return name
}

/**
 * This is the function that generates the CanvasJS plots.
 * @param country_data
 * @param country_name
 * @param statsType
 * @returns {*}
 */
function showStatistics({country_data, country_name}, statsType='from'){
    let max_num_countries = 15
    let add_others = false // Indicates if we need to add the 'others' column
    let others_value = 0
    let others_perc = 0
    if(!_.isUndefined(country_data)) {
        let dataPoints = []
        for(let id in Object.keys(country_data[statsType][statsType])){
            let text = shortenNames(country_data[statsType][statsType][id].name)
            let value = country_data[statsType][statsType][id].tons
            let perc = country_data[statsType][statsType][id].perc
            if(id <= max_num_countries){
                dataPoints.push({label: text, y: value, perc: perc})
            }else{
                add_others = true
                others_value += value
                others_perc += perc
            }
        }

        if(add_others){
            dataPoints.push({label: "Others", y: others_value, perc: Math.round(others_perc*100)/100 })
        }

        let title = ''
        let label = ''
        let container = ''
        let tooltip = ''
        if(statsType === 'from'){
            title = `Litter from ${country_name}`
            label = `Tons from ${country_name}`
            container = 'chartContainerFrom'
            tooltip = `{y} tons to {label} ({perc}%)`
        }else{
            title = `Litter towards ${country_name}`
            label = `Tons towards ${country_name}`
            container = 'chartContainerTo'
            tooltip = `{y} tons from {label} ({perc}%)`
        }
        // let plot_height = Math.min(parseInt(window.innerHeight * .20), 200)
        let plot_height = 225
        const options = {
            container: container,
            animationEnabled: true,
            exportEnabled: true,
            // zoomEnabled: true,
            height: plot_height,
            title: {
                text: title,
                fontSize: isMobile? 16 : 20,
            },
            axisY: {
                title:'Tons per year',
                // suffix: ' tons'
            },
            toolTip:{
                shared: true
            },
            axisX:{
                interval:1,
                labelAngle: -23,
            },
            data: [{
                toolTipContent: tooltip,
                type: "column",
                color: "#257A89",
                name: label,
                dataPoints: dataPoints
            }]
        }

        if(statsType === 'from'){
            return ( <CanvasJSChart options = {options}  /> )
        }else{
            return ( <CanvasJSChart options = {options}  /> )
        }
    }else{
        return <span></span>;
    }
}

function hidePlot(){
    let popup = document.getElementById('popup')
    $(popup).hide();
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

const MakePlot = props => {
    let stats_data = props.country_data
    return (
        <div className="container-fluid bg-white rounded-lg">
            <div className="row justify-content-center">
                {!_.isUndefined(stats_data['from']) ?
                    <div className="col-12 mt-1 text-center">
                        <button className="d-inline float-right close" type="button"
                                onClick={hidePlot}
                                aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h5 className="d-inline"> {props.country_name} exports {numberWithCommas(stats_data['from'].tot_tons)} tons
                            in ten years</h5>
                        <h6>
                            {numberWithCommas(stats_data['from'].ocean_tons)} ({stats_data['from'].ocean_perc}%) end up in the ocean
                            and&nbsp;
                            {numberWithCommas(stats_data['from'].beach_tons)} ({stats_data['from'].beach_perc}%) end up on the beach.
                        </h6>
                    </div>
                    :
                    <div className="col-12 mt-1 text-center">
                        <button className="d-inline float-right close" type="button"
                                onClick={hidePlot}
                                aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="d-inline"> No input data for {props.country_name} </h4>
                    </div>
                }
            </div>
            <div className="row justify-content-center">
                <div className="col-xl-5 col-md-6 col-12 p-0" id="chartContainerFrom">
                    {_.isUndefined(stats_data['from']) ? <span></span> : showStatistics(props, 'from')}
                </div>
                <div className="col-xl-5 col-md-6 col-12 p-0" id="chartContainerTo">
                    {_.isUndefined(stats_data['to']) ? <span></span> : showStatistics(props, 'to')}
                </div>
            </div>
        </div>
    );
}

export default MakePlot;

