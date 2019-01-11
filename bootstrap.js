const electron = require('electron')
const app = electron.app
const path = require('path')
const url = require('url')
const BrowserWindow = electron.BrowserWindow
var mainWindow

app.on('ready', function(){
    mainWindow = new BrowserWindow({width:'800', height:'900'})

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname,'widget.html'),
        protocol:'file:',
        slashes: true
    }))

    mainWindow.openDevTools()
})