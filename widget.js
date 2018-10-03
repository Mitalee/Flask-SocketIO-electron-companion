
function startSocket() {
 
    namespace = '/test_local';
 
    var socket = io.connect('http://localhost:5000/test_local',{'force new connection':true})

    socket.on('connect', function() {
        socket.emit('join', {room: $('#userid').val()});
    });

    $('form#emit2web').submit(function(event) {
        socket.emit('local_to_web_event', {data: $('#emit2web_data').val()});
        return false;
    });
    $('form#emit').submit(function(event) {
        socket.emit('local_event', {data: $('#emit_data').val()});
        return false;
    });

    socket.on('local_response', function(msg) {
        console.log(msg);
        $('#log').append('<br>' + $('<div/>').text('Received #' + msg.count + ': ' + msg.data).html());
    });
  /*  $('form#join').submit(function(event) {
        socket.emit('join', {room: $('#join_room').val()});
        return false;
    });
*/
    $('form#leave').submit(function(event) {
        socket.emit('leave', {room: $('#leave_room').val()});
        return false;
    });
  /*  $('form#send_room').submit(function(event) {
        socket.emit('my_room_event', {room: $('#room_name').val(), data: $('#room_data').val()});
        return false;
    });
    $('form#close').submit(function(event) {
        socket.emit('close_room', {room: $('#close_room').val()});
        return false;
    });*/
    $('form#disconnect').submit(function(event) {
        //socket.emit('leave', {room: $('#userid').val()});
        socket.emit('disconnect_request');
        return false;
    });

};

