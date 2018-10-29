
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
    xmlHttp.onreadystatechange = function(e) {
        if (xmlHttp.readyState === 4) {
          if (xmlHttp.status === 200) {
           // Code here for the server answer when successful
           return 
          } else {
           // Code here for the server answer when not successful
          }
        }
      }
      xmlHttp.ontimeout = function () {
        // Well, it took to long do some code here to handle that
      }
      xmlHttp.open('GET', url, true)
      xmlHttp.send();    
};//end httpPOST function

//https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url/34695026
function ValidURL(str) {
    /*var pattern = new RegExp('^(https?:\/\/)?'+ // protocol
      '((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'+ // domain name
      '((\d{1,3}\.){3}\d{1,3}))'+ // OR ip (v4) address
      '(\:\d+)?(\/[-a-z\d%_.~+]*)*'); // port and path
      //'(\?[;&a-z\d%_.~+=-]*)?'+ // query string
      //'(\#[-a-z\d_]*)?$','i'); // fragment locater*/

      //https://www.debuggex.com/r/KaJrYj7vm9pKgOhK
      var pattern = new RegExp('^((https?)?://)?(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?(([0-9]{1,3}\.){3}[0-9]{1,3}|([0-9a-z_!~*\'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6}|localhost)(:[0-9]{1,5})');
    if(!pattern.test(str)) {
      //alert("Please enter a valid URL.");
      return false;
    } else {
        //alert("Its valid URL.");
      return true;
    }
  }

function pingTally(message) {
   //load URL of Tally
    //url = "http://192.168.0.15:9000" //TEST
    input_url = $('#tallyURL').val()
    if (!ValidURL(input_url)) {
        $('#log').append('<br> INVALID URL.');
    }
    else {
        $.ajax({
            type: "POST",
            url: input_url,
            beforeSend: function() {
               // $('#log').append("<br> Processing. Please wait..");
               $('#log').append('<span class="prepended"><br> Processing. Please wait.. </span>');
            },
            /*complete: function() {
                $('#log').append("<br> Processed.");
            },*/
            error: function(xhr, statusText) { 
                $(".prepended").remove();
                $('#log').append("<br> Error: "+statusText); 
                },
            success: function(tally_response){ 
                //alert(data.responseText == undefined)
                $(".prepended").remove();
                if (tally_response.responseText == undefined) {
                    $('#log').append("<br> Wrong URL. See Tally for the correct URL.");
                }
                else {
                    $('#log').append("<br> Success - "+ tally_response.responseText);
                }
            },
            timeout: 3000 // sets timeout to 3 seconds
        });
    }//end else
};