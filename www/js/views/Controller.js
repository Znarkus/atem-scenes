'use strict'

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import openSocket from 'socket.io-client'
import hotkeys from 'hotkeys-js';

const socket = openSocket()

export default class Controller extends Component {
  state = {
    settings: { main: true, parents: true },
  }

  componentDidMount () {
    socket.on('load', opts => {
      this.setState(opts)
    })

    socket.on('atemConnection', ({ connected }) => {
      this.setState({ connected })
    })

    hotkeys('enter', (event, handler) => {
      event.preventDefault()
      this.go()
    })
  }

  componentWillUnmount () {
    socket.removeAllListeners('load')
    socket.removeAllListeners('atemConnection')
  }

  trigger (sceneId) {
    const { settings } = this.state
    socket.emit('triggerScene', { sceneId, settings })
  }

  go = () => {
    const { settings } = this.state
    socket.emit('go', { settings })
  }

  toggleMix = ({ target }) => {
    this.setState(prevState => {
      prevState.settings[target.name] = target.checked
      return prevState
    })
  }

  renderSceneMix (sceneId, mixId) {
    const { states, mix, usk, macros, inputNames } = this.state

    if (!states) return

    const scene = states[sceneId]

    if (!scene) throw new Error(`Scene ${sceneId} not defined`)

    const mixNames = Object.keys(mix)
    const uskNames = Object.keys(usk)
    const macroNames = Object.keys(macros)
      .map(k => k.replace(/_/g, ' '))

    const labels = [
      inputNames[scene[mixId].input]
        ? inputNames[scene[mixId].input].name
        : `Input ${scene[mixId].input}`,
      scene[mixId].usk[usk.BANNER] ? uskNames[usk.BANNER] : null,
      scene[mixId].usk[usk.TEXT] ? uskNames[usk.TEXT] : null,
      macroNames[scene[mixId].macro - 1 ] || null
    ]

    return <div className='info'>
      {mixNames[mixId]}: {labels.filter(v => v).join(', ')}
    </div>
  }

  renderScene (sceneId, label) {
    const { states, mix, usk, macros } = this.state

    if (!states) return

    return <div className="scene">
      <button onClick={() => this.trigger(sceneId)}>{label}</button>
      {this.renderSceneMix(sceneId, mix.MAIN)}
      {this.renderSceneMix(sceneId, mix.PARENTS)}
    </div>
  }

  render () {
    const { config, connected, settings, usk, macros, mix } = this.state

    const uskList = Object.keys(usk || {}).map(k => <li key={k}>
      {usk[k] + 1}: {k}
    </li>)

    const macroList = Object.keys(macros || {}).map(k => <li key={k}>
      {macros[k] + 1}: {k.replace(/_/g, ' ')}
    </li>)

    const mixList = Object.keys(mix || {}).map(k => <li key={k}>
      {mix[k]}: {k}
    </li>)

    return (
      <div id="controller">
        <section id="master-control">
          {config &&
            <p className='atem-info'>ATEM on {config.atem.ip}</p>
          }

          {connected ? (
            <p className="connected">Connected</p>
          ) : (
            <p className="disconnected">DISCONNECTED</p>
          )}

          <label className='toggle-main'>
            <input type="checkbox"
                   name="main"
                   checked={settings.main}
                   onChange={this.toggleMix}
            />
            <span>Byt Main</span>
          </label>

          <label className='toggle-parents'>
            <input type="checkbox"
                   name="parents"
                   checked={settings.parents}
                   onChange={this.toggleMix}
            />
            <span>Byt FL</span>
          </label>

          <button id="go" onClick={this.go}>GO</button>
          <p className='help-text'>Press Enter to GO</p>

          <section id="info-lists">
            <h4>Upstream keys</h4>
            <ul>{uskList}</ul>

            <h4>Macros</h4>
            <ul>{macroList}</ul>

            <h4>Mixes</h4>
            <ul>{mixList}</ul>
          </section>
        </section>

        <div id="scenes-wrap">
          <section className="scenes gfx">
            {this.renderScene('video', 'Pre/Post Service')}
            {this.renderScene('video', 'Video')}
            {this.renderScene('animations', 'Animations')}
          </section>

          <section className="scenes cyc">
            {this.renderScene('cyc', 'CYC')}
            {this.renderScene('cyc-text', 'CYC med text')}
          </section>

          <section className="scenes cam">
            {this.renderScene('cam', 'Kamera')}
            {this.renderScene('cam-lyrics', 'Kamera med lyrics')}
            {this.renderScene('cam-banner-text', 'Kamera med banner + text')}
            {this.renderScene('cam-banner', 'Kamera med banner')}
          </section>

          <section className="scenes link">
            {this.renderScene('link', 'Livelänk')}
            {this.renderScene('link-lyrics', 'Livelänk med lyrics')}
            {this.renderScene('link-banner-text', 'Livelänk med banner + text')}
            {this.renderScene('link-banner', 'Livelänk med banner')}
          </section>
        </div>
        {/*<nav id="nav">
          <Link to="/output">Output</Link>
        </nav>
        <aside id="aside">
        </aside>*/}
      </div>
    )
  }
}
