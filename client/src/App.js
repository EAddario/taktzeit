import React from 'react';
import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import Fib from './Fib';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">12 Factor App PoC</h1>
        </header>
      </div>
      <div>
        <Route exact path="/" component={Fib} />
      </div>
    </Router>
  );
}

export default App;
