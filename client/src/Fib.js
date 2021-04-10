import React, {Component} from "react"
import axios from "axios"

class Fib extends Component {
    state = {
        seenIndexes: [],
        values: {},
        index: ""
    }

    componentDidMount() {
        this.fetchValues()
        this.fetchIndexes()
    }

    fetchValues = () => {
        axios.get('/api/values/current')
            .then((resp) => this.setState({values: resp.data}))
            .catch(err => console.log(err))
    }

    fetchIndexes = () => {
        axios.get('/api/values/all')
            .then((resp) => this.setState({seenIndexes: resp.data}))
            .catch(err => console.log(err))
    }

    handleSubmitValues = () => {
        axios.post('/api/values', {index: this.state.index})
            .catch(err => console.log(err))
    }

    handleSubmitReset = () => {
        axios.post('/api/values/reset', {})
            .catch(err => console.log(err))
        window.location.reload(true)
    }

    renderSeenIndexes() {
        return this.state.seenIndexes.map(({number}) => number).join(', ')
    }

    renderValues() {
        const entries = []

        for (let key in this.state.values) {
            entries.push(
                <div key={key}>
                    Fibonacci of {key} is {parseInt(this.state.values[key], 10).toLocaleString()}
                </div>
            )
        }

        return entries.sort()
    }

    render() {
        return (
            <div className="fibonacci" style={{marginTop: '20px', fontSize: '120 %'}}>
                <div className="ui container">
                    <div className="ui message">
                        <div className="header">Simple proof of concept to demonstrate scalable cloud patterns</div>
                        <p/>
                        <p>The system calculates the Fibonacci number using a very inefficient recursive algorithm
                            running in O(c<sup>n</sup>) time. Values of 40 or less should complete within seconds
                            with negligible resource consumption, while values approaching 50 will take exponentially
                            longer and tax heavily the CPU. Values above 50 are not recommended, and values above 55 are
                            ignored.
                        </p>
                        <p>Although overly simplistic in their implementation, each service is designed to be
                            event-driven, concurrent, stateless, disposable and capable of significant horizontal
                            scaling. All of the system's state is managed by backing services (PostgreSQL, RabbbitMQ
                            and Redis).</p>
                        <p align="right">Click <b>&lt;Reset Data&gt;</b> to clear all values.</p>
                    </div>
                </div>
                <br/>
                <div className="ui container">
                    <div className="ui segment">
                        <div className="ui grid">
                            <div className="eleven wide column">
                                <div className="ui message" style= {{height: '300px', overflowY: 'auto'}}>
                                    <div className="header">Previous Numbers</div>
                                    <p>{this.renderSeenIndexes()}</p>
                                </div>
                            </div>
                            <div className="five wide column">
                                <div className="ui message" style= {{height: '300px', overflowY: 'auto'}}>
                                    <div className="header">Results</div>
                                    <p>{this.renderValues()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ui segment">
                        <div className="ui grid">
                            <div className="twelve wide column">
                                <form className="ui form" onSubmit={this.handleSubmitValues}>
                                    <div className="field">
                                        <input
                                            placeholder="Enter a number between 0 and 55"
                                            type="text"
                                            value={this.state.index}
                                            onChange={event => this.setState({index: event.target.value})}
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="four wide column">
                                <button className="negative fluid ui button" onClick={this.handleSubmitReset}>
                                    <i className="icon recycle"/>
                                    Reset Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <br/>
                <div className="ui container">
                    <div className="ui segment">
                        <h3>Sequence Diagram</h3>
                        <img className="ui centered bordered image" src="sequence.svg" alt="Sequence"
                             width="100%" height="auto"/>
                    </div>
                </div>
                <br/>
                <div className="ui container">
                    <div className="ui segment">
                        <h3>Architecture Diagram</h3>
                        <img className="ui centered bordered image" src="architecture.svg" alt="Architecture"
                             width="100%" height="auto"/>
                    </div>
                </div>
            </div>
        )
    }
}

export default Fib
