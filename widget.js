
function startSocket() {
 
    namespace = '/test_local';
 
    //var socket = io.connect('http://localhost:5000/test_local',{'force new connection':true})
    
    //var socket = io.connect('http://localhost:9000/test_local',{'rememberTransport': false, 'force new connection':true})
    var socket = io.connect('http://localhost:5000/test_local',{'rememberTransport': false, 'force new connection':true})

    socket.on('connect', function() {
        socket.emit('join', {room: $('#username').val()});
    });

    socket.on('local_window', function(msg) {
        console.log(msg);
        $('#log').append('<br>' + $('<div/>').text('Received #' + msg.count + ': ' + msg.data).html());
    });

    socket.on('local_request', function(msg) {
        console.log(msg);
        $('#log').append('<br>' + $('<div/>').text('Sending Data to Tally').html());
        //Ping Tally here

        //Send Tally Response back to server
    });


    $('form#join').submit(function(event) {
        socket.emit('join', {room: $('#join_room').val()});
        return false;
    });

    $('form#leave').submit(function(event) {
        socket.emit('leave', {room: $('#leave_room').val()});
        return false;
    });
    $('form#send_room').submit(function(event) {
        socket.emit('my_room_event', {room: $('#room_name').val(), response: $('#room_data').val()});
        return false;
    });
    /*$('form#close').submit(function(event) {
        socket.emit('close_room', {room: $('#close_room').val()});
        return false;
    });*/
    $('form#disconnect').submit(function(event) {
        //socket.emit('leave', {room: $('#userid').val()});
        socket.emit('disconnect_request');
        return false;
    });

};


function httpPost(theUrl) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest()
    //xmlHttp.open("POST", theUrl, false)
    xmlHttp.open("GET", theUrl, false)
    xmlHttp.send(null)
    return xmlHttp.responseText
};


function pingTally(message) {
   //load URL of Tally
    url = "http://localhost:9000"
    //url = "https://api.ipify.org/?format=jsonp&callback=getIP"
    var tally_response = httpPost(url)
    console.log(tally_response)
    //document.getElementById("log").append = tally_response
    //$('#log').append('<br>' + $('<div/>').text(tally_response));//.html());
    $('#log').append(tally_response);
};