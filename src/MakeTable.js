import React from 'react';
import _ from "underscore";
import 'animate.css'
import $ from "jquery";
import {SkipForwardFill} from "react-bootstrap-icons";
import {ButtonGroup} from "react-bootstrap";

class  MakeTable extends React.Component {
    constructor(props){
        super(props)
        this.showStatistics= this.showStatistics.bind(this)
        this.showFootnote= this.showFootnote.bind(this)
        this.hideTable = this.hideTable.bind(this)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log("Updating TABLE");
    }

    hideTable(){
        console.log("Hiding table....")
        $("#stats_table").addClass('fadeOutRight');
    }

    showStatistics(){
        if(!_.isUndefined(this.props.country_data)) {
            let from_data = this.props.country_data
            return (
                <span >
                    <div className="row">
                        <div className="col-6">
                            <div className="row ">
                                <div className="col-12 bg-secondary text-white">
                                    From {this.props.country_name} ({from_data['from'].tot_tons} tons)
                                </div>
                            </div>
                            <div className="row ">
                                <div className="col-12">
                                    <ul className="list-group list-group-flush">
                                        {Object.keys(from_data['from']['from']).map((id) =>
                                            <li className="m-0 p-1  list-group-item" key={from_data['from']['from'][id].name}>
                                                <small>{from_data['from']['from'][id].tons} tons, {from_data['from']['from'][id].perc}%
                                                    to {from_data['from']['from'][id].name}</small>
                                            </li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="row ">
                                <div className="col-12 bg-secondary text-white">
                                    Toward {this.props.country_name} ({from_data['to'].tot_tons} tons)
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <ul className="list-group list-group-flush">
                                        {Object.keys(from_data['to']['to']).map((id) =>
                                            <li className="m-0 p-1   list-group-item" key={from_data['to']['to'][id].name}>
                                                <small>{from_data['to']['to'][id].tons} tons, {from_data['to']['to'][id].perc}%
                                                    from {from_data['to']['to'][id].name}</small>
                                            </li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </span>);
        }else{
            return <span></span>;
        }
    }

    showFootnote(){
        return (
            <div className="row rounded-lg bg-dark">
                <p className="lead">
                    This map shows an estimated location of the marine litter propagation by country.
                    Th ewhen they are
                </p>
            </div>
                );
    }

    render(){
        let from_data = this.props.country_data
        return (
            <div className="container bg-white rounded-lg">
                <div className="row rounded-lg bg-dark">
                    <div className="col-11 text-center text-white  pt-2">
                        <h5 className="d-inline"> {this.props.country_name} exports {from_data['from'].tot_tons} tons per year </h5>
                    </div>
                    <div className="col-11 text-center text-white  pt-2">
                        <h6 className="d-inline">
                            {from_data['from'].ocean_tons} ({from_data['from'].ocean_perc}%) end up on the ocean
                            <br/>
                            {from_data['from'].beach_tons} ({from_data['from'].beach_perc}%) end up on the beach
                        </h6>
                    </div>
                    {/*<button className="btn btn-info btn-sm" onClick={this.hideTable}*/}
                    {/*        title="Incrase animation speed">*/}
                    {/*    <SkipForwardFill/>*/}
                    {/*</button>*/}
                </div>
                {this.showStatistics()}
                {/*{this.showFootnote()}*/}
            </div>
        );
    }
}

export default MakeTable;

