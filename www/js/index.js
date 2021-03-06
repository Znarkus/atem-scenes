'use strict'

import React, { Fragment } from 'react'
import { render } from 'react-dom'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'

import Controller from './views/Controller'

render(
  <Router>
    <Fragment>
      <Route exact path="/" component={Controller}/>
      {/*<Route path="/output" component={Output}/>*/}
    </Fragment>
  </Router>,
  document.getElementById('mount')
)
