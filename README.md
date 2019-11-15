# Flask-SocketIO-electron-companion

It's an era of air-gapping. The more sensitive the data, the more one needs to hide it from prying online eyes. What with all the daemons running in our laptops, sometimes users choose older softwares that don't have internet capabilities.

I made this desktop application to talk to a web service as well as a local application that may/may not have internet access. I used this to connect to a desktop accounting tool called Tally ERP9. This data transfer happens bidirectionally and there is complete control over the communication protocol, rather than a remote sync that needs to be kept up every 5 minutes.

This is a companion app in electronjs for initiating a local client session to communicate with a webserver over a websocket. 

The webserver that responds to this local client can be found at this repo:<br />
https://github.com/Mitalee/Flask-SocketIO-Celery-Electron
