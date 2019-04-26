const electron = require('electron')
const app = electron.app
const path = require('path')
const url = require('url')
const BrowserWindow = electron.BrowserWindow
var mainWindow

app.on('ready', function(){
    //mainWindow = new BrowserWindow({width:'800', height:'900'})
    mainWindow = new BrowserWindow({width:'300', height:'400'})
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname,'widget.html'),
        protocol:'file:',
        slashes: true
    }))

    mainWindow.openDevTools()
})

    // SSL/TSL: this is the self signed certificate support
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        // On certificate error we disable default behaviour (stop loading the page)
        // and we then say "it is all fine - true" to the callback
        event.preventDefault();
        callback(true);
});