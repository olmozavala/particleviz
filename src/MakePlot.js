import React from 'react';
import _ from "underscore";
import $ from 'jquery';
import CanvasJSReact from './canvasjs.react';
var CanvasJSChart = CanvasJSReact.CanvasJSChart

class  MakePlot extends React.Component {
    constructor(props){
        super(props)
        this.showStatistics= this.showStatistics.bind(this)
        this.hidePlot= this.hidePlot.bind(this)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    componentDidMount() {
    }

    showStatistics(statsType='from'){
        if(!_.isUndefined(this.props.country_data)) {
            let stats_data = this.props.country_data
            let dataPoints = []
            for(let id in Object.keys(stats_data[statsType][statsType])){
                let text = stats_data[statsType][statsType][id].name
                let value = stats_data[statsType][statsType][id].tons
                let perc = stats_data[statsType][statsType][id].perc
                // console.log(perst0c)
                if(perc > 1 || value > 50){
                    dataPoints.push({label: text, y: value, perc: perc})
                }
            }

            let title = ''
            let label = ''
            let container = ''
            let tooltip = ''
            if(statsType === 'from'){
                title = `Waste from ${this.props.country_name}`
                label = `Tons from ${this.props.country_name}`
                container = 'chartContainerFrom'
                tooltip = `{y} tons to {label} ({perc}%)`
            }else{
                title = `Waste towards ${this.props.country_name}.`
                label = `Tons towards ${this.props.country_name}`
                container = 'chartContainerTo'
                tooltip = `{y} tons from {label} ({perc}%)`
            }
            // let plot_height = Math.min(parseInt(window.innerHeight * .20), 200)
            let plot_height = 205
            const options = {
                container: container,
                animationEnabled: true,
                exportEnabled: true,
                height: plot_height,
                title: {
                    text: title,
                    fontSize: 18,
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
                return ( <CanvasJSChart options = {options}  onRef={ref => this.chart_from = ref}/> )
            }else{
                return ( <CanvasJSChart options = {options}  onRef={ref => this.chart_to = ref}/> )
            }
        }else{
            return <span></span>;
        }
    }

    hidePlot(){
        let popup = document.getElementById('popup')
        $(popup).hide();
    }

    render(){
        let stats_data = this.props.country_data

        return (
            <div className="container-fluid bg-white rounded-lg">
                <div className="row justify-content-center">
                    {!_.isUndefined(stats_data['from']) ?
                        <div className="col-12 mt-1 text-center">
                            <button className="d-inline float-right" type="button" className="close"
                                    onClick={this.hidePlot}
                                    aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5 className="d-inline"> {this.props.country_name} exports {stats_data['from'].tot_tons} tons
                                per year </h5>
                            <h6>
                                {stats_data['from'].ocean_tons} ({stats_data['from'].ocean_perc}%) end up in the ocean,
                                &nbsp;
                                {stats_data['from'].beach_tons} ({stats_data['from'].beach_perc}%) end up on the beach.
                            </h6>
                        </div>
                        :
                        <div className="col-12 mt-1 text-center">
                            <button className="d-inline float-right" type="button" className="close"
                                    onClick={this.hidePlot}
                                    aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="d-inline"> No input data for {this.props.country_name} </h4>
                        </div>
                    }
                </div>
                <div className="row justify-content-center">
                    <div className="col-xl-5 col-md-6 col-12 p-0"  id="chartContainerFrom">
                        {_.isUndefined(stats_data['from']) ? <span></span>: this.showStatistics('from') }
                    </div>
                    <div className="col-xl-5 col-md-6 col-12 p-0" id="chartContainerTo">
                        {_.isUndefined(stats_data['to']) ? <span></span>: this.showStatistics('to') }
                    </div>
                </div>
            </div>
        );
}
}

export default MakePlot;

