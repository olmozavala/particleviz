import React from 'react';
import _ from "underscore";
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
                    {/*<div className="row">*/}
                    {/*    <div className="col-6">*/}
                    {/*        <ul className="list-group list-group-flush">*/}
                    {/*            {Object.keys(asia).map((name) =>*/}
                    {/*                <li className="m-0 p-1  text-capitalize list-group-item" key={name}>*/}
                    {/*                    <small>{name} {(100 * asia[name][0] / asia[name][1]).toFixed(2)}%</small>*/}
                    {/*                </li>)}*/}
                    {/*        </ul>*/}
                    {/*    </div>*/}
                    {/*    <div className="col-6">*/}
                    {/*        <ul className="list-group list-group-flush">*/}
                    {/*            {Object.keys(africa).map((name) =>*/}
                    {/*                <li className="m-0 p-1 text-capitalize list-group-item" key={name}>*/}
                    {/*                    <small> {name} {(100 * africa[name][0] / africa[name][1]).toFixed(2)}%</small>*/}
                    {/*                </li>)}*/}
                    {/*        </ul>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
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
                    {/*<div className="col-auto">*/}
                    {/*    <button type="button" className="btn btn-dark" onClick={this.hideTable}>*/}
                    {/*        <FontAwesomeIcon icon={faWindowClose} color="white"/>*/}
                    {/*    </button>*/}
                    {/*</div>*/}
                </div>
                {this.showStatistics()}
                {/*{this.showFootnote()}*/}
            </div>
        );
    }
}

export default MakeTable;

