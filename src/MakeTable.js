import React from 'react';
import _ from "underscore";
import $ from 'jquery';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faForward, faWindowClose} from "@fortawesome/free-solid-svg-icons";
import 'animate.css'

class  MakeTable extends React.Component {
    constructor(props){
        super(props);
        // this.stats_table = $('#stats_table');
        this.hideTable = this.hideTable.bind(this);
        this.showStatistics= this.showStatistics.bind(this);
        this.showFootnote= this.showFootnote.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log("Updating TABLE");
        // this.stats_table.removeClass('fadeOutRight');
        // this.stats_table.addClass('fadeInRight');
    }

    hideTable(){
        // this.stats_table.addClass('fadeOutRight');
        // $('#popup').popover('hide');
    }

    showStatistics(asia, africa){
        if(!_.isUndefined(this.props.country_data)) {
            return (
                <span>
                    <div className="row text-center bg-white pt-2">
                        <div className="col-6">
                            <h6><strong>Asia</strong></h6>
                        </div>
                        <div className="col-6">
                            <h6><strong>Africa</strong></h6>
                        </div>
                        <div className="col-12">
                            <hr className="p-0 m-0"/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <ul className="list-group list-group-flush">
                                {Object.keys(asia).map((name) =>
                                    <li className="m-0 p-1  text-capitalize list-group-item" key={name}>
                                        <small>{name} {(100 * asia[name][0] / asia[name][1]).toFixed(2)}%</small>
                                    </li>)}
                            </ul>
                        </div>
                        <div className="col-6">
                            <ul className="list-group list-group-flush">
                                {Object.keys(africa).map((name) =>
                                    <li className="m-0 p-1 text-capitalize list-group-item" key={name}>
                                        <small> {name} {(100 * africa[name][0] / africa[name][1]).toFixed(2)}%</small>
                                    </li>)}
                            </ul>
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
        let africa = "";
        let asia = "";
        if(!_.isUndefined(this.props.country_data)){
            africa = this.props.country_data.Africa;
            asia = this.props.country_data.Asia;
        }
        return (
            <div className="container bg-white rounded-lg">
                <div className="row rounded-lg bg-dark">
                    <div className="col-11 text-center text-white  pt-2">
                        <h6 className="d-inline"> {this.props.country_name}</h6>
                    </div>
                    {/*<div className="col-auto">*/}
                    {/*    <button type="button" className="btn btn-dark" onClick={this.hideTable}>*/}
                    {/*        <FontAwesomeIcon icon={faWindowClose} color="white"/>*/}
                    {/*    </button>*/}
                    {/*</div>*/}
                </div>
                {this.showStatistics(asia, africa)}
                {/*{this.showFootnote()}*/}
            </div>
        );
    }
}

export default MakeTable;

