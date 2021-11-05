import './style.css'
import React, {Fragment} from 'react';
import Navbar from './components/navbar.js';
import Footer from './components/footer.js';
import Catalog from './components/catalog.js';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';

function App() {
  return (
    <Router>
      <Navbar/>
      <Switch>
        <Route path="/manga" component={Catalog}/>
      </Switch>
      <Footer/>
    </Router>
  );
}

export default App;
