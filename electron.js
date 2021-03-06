'use strict'

const { app, BrowserWindow } = require('electron')
// const path = require('path')
// const url = require('url')

console.log('Starting [1]..')

if (process.env.NODE_ENV !== 'development') {
  require('./index')
}

// console.log('Starting [2]..')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  console.log('Starting [2]..')

  // Create the browser window.
  win = new BrowserWindow({
    width: 1150,
    height: 590,
    show: false,
  })

  // and load the index.html of the app.
  win.loadURL('http://localhost:3000')
  // win.loadURL(url.format({
  //   pathname: path.join(__dirname, 'dist/index.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }))
  win.once('ready-to-show', () => {
    win.show()
  })

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})
