import React from 'react';
import _ from "underscore";
import CanvasJSReact from './canvasjs.react';
var CanvasJSChart = CanvasJSReact.CanvasJSChart

class  MakePlot extends React.Component {
    constructor(props){
        super(props)
        this.showStatistics= this.showStatistics.bind(this)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    componentDidMount() {
    }

    showStatistics(statsType='from'){
        if(!_.isUndefined(this.props.country_data)) {
            let from_data = this.props.country_data
            let dataPoints = []
            for(let id in Object.keys(from_data[statsType][statsType])){
                let text = from_data[statsType][statsType][id].name
                let value = from_data[statsType][statsType][id].tons
                let perc = from_data[statsType][statsType][id].perc
                if(value > 50){
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
            const options = {
                container: container,
                animationEnabled: true,
                exportEnabled: true,
                height: 200,
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

    render(){
        let from_data = this.props.country_data
        return (
            <div className="container-fluid bg-white rounded-lg">
                <div className="row justify-content-center">
                    <div className="col-12 mt-1 text-center">
                        <h4 className="d-inline"> {this.props.country_name} exports {from_data['from'].tot_tons} tons per year </h4>
                        <h6>
                            {from_data['from'].ocean_tons} ({from_data['from'].ocean_perc}%) end up in the ocean,
                            {from_data['from'].beach_tons} ({from_data['from'].beach_perc}%) end up on the beach.
                        </h6>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <div className="col-xl-4 col-lg-5 col-md-6 col-sm-12"  id="chartContainerFrom">
                        {this.showStatistics('from')}
                    </div>
                    <div className="col-xl-4 col-lg-5 col-md-6 col-sm-12" id="chartContainerTo">
                        {this.showStatistics('to')}
                    </div>
                </div>
            </div>
        );
}
}

export default MakePlot;

