import React from 'react';
import _ from "underscore";
import 'animate.css'
import CanvasJSReact from './canvasjs.react';

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart

class  ShowPlot extends React.Component {
    constructor(props){
        super(props)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
    }

    componentDidMount() {
        this.chart.render()
    }

    render(){
        let statsType = this.props.stats_type
        if(!_.isUndefined(this.props.country_data)) {
            let from_data = this.props.country_data
            let dataPoints = []
            console.log(Object.keys(from_data[statsType][statsType]).length)
            for(let id in Object.keys(from_data[statsType][statsType])){
                let text = from_data[statsType][statsType][id].name
                let value = from_data[statsType][statsType][id].tons
                // let perc = from_data[statsType][statsType][id].perc
                if(value > 50){
                    dataPoints.push({label: text, y: value})
                }
            }

            let title = ''
            let label = ''
            let container = ''
            if(statsType === 'from'){
                title = `Waste from ${this.props.country_name}.`
                label = `Tons from ${this.props.country_name}`
                container = 'chartContainerFrom'
            }else{
                title = `Waste towards ${this.props.country_name}.`
                label = `Tons towards ${this.props.country_name}`
                container = 'chartContainerTo'
            }
            const options = {
                container: container,
                height: 200,
                title: {
                    text: title,
                    fontSize: 18,
                },
                axisY: {
                    title:'Tons per year'
                },
                toolTip:{
                    shared: true
                },
                axisX:{
                    interval:1
                },
                data: [{
                    type: "column",
                    color: "#257A89",
                    name: label,
                    dataPoints: dataPoints
                }]
            }

            return (
                <CanvasJSChart options = {options}  onRef={ref => this.chart = ref}/>
            )
        }else{
            return <span></span>;
        }
    }
}

export default ShowPlot;

