'use strict'

import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import openSocket from 'socket.io-client'

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

    const mixNames = { 0: 'Parents', 1: 'Main' }
    const uskNames = { 0: 'Banner', 1: 'Text' }
    const macroNames = { 1: 'Text down', 2: 'Text normal' }
    const labels = [
      inputNames[scene[mixId].input]
        ? inputNames[scene[mixId].input].name
        : `Input ${scene[mixId].input}`,
      scene[mixId].usk[usk.BANNER] ? uskNames[usk.BANNER] : null,
      scene[mixId].usk[usk.TEXT] ? uskNames[usk.TEXT] : null,
      macroNames[scene[mixId].macro] || null
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
    const { config, connected, settings, setState } = this.state

    return (
      <div id="controller">
        <section id="top">
          {config &&
            <span>ATEM on {config.atem.ip}</span>
          }

          {connected ? (
            <span className="connected">Connected</span>
          ) : (
            <span className="disconnected">DISCONNECTED</span>
          )}
        </section>

        <section id="master-control">
          <label>
            <input type="checkbox"
                   name="main"
                   checked={settings.main}
                   onChange={this.toggleMix}
            />
            <span>Byt Main</span>
          </label>
          <label>
            <input type="checkbox"
                   name="parents"
                   checked={settings.parents}
                   onChange={this.toggleMix}
            />
            <span>Byt FL</span>
          </label>

          <button id="go" onClick={this.go}>GO</button>
        </section>

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

        {/*<nav id="nav">
          <Link to="/output">Output</Link>
        </nav>
        <aside id="aside">
        </aside>*/}
      </div>
    )
  }
}
