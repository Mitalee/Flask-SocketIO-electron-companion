//import { disconnect } from "cluster";
//COMMAND AND DATA
var socket;

function startSocket() {
 

    if ($('#userid').val() == ""){
         alert("Please enter a value");
         return false;       
    }

    //https://www.dropbox.com/s/5r58rlcu2njb13k/khaata-widget-11-03-2019.zip?dl=0
    //namespace = '/test_local';    
   // require('https').globalAgent.options.rejectUnauthorized = false; 
    
    socket = io.connect('http://localhost:5000/test_local',{secure: true, rejectUnauthorized: false, 'rememberTransport': false, 'force new connection':true})
    //socket = io.connect('https://khaata.in/test_local',{'rememberTransport': false, 'force new connection':true})
    //socket = io.connect('https://' + domain + ':' + port + namespace); //USE THIS TO AVOID SESSION ERRORS
    
    socket.on('connect', function() {
        //socket.emit('joined', {room: $('#userid').val()});
        $('#startSocket').attr("disabled", true);
        $('#disconnectSocket').removeAttr("disabled");
    });

    socket.on('local_window', function(msg) {
        console.log(msg.data);
        if (msg.data == 'Disconnected!') {
            //THIS WORKS WHEN THE WEBSOCKET CONNECTION IS UPGRADED TO WEBSOCKET
            console.log('disconnect call received.')
            $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.data +': '+ msg.reason).html());
            setTimeout(function(){ console.log('SOCKET DISCONNECT STATUS:', socket.disconnected) }, 3000);
            //console.log('SOCKET STATUS:', socket.disconnected);
            btnEnableDisable(); 
        }
        else if (msg.data == 'disconnect_from_widget') {
            //THIS IS REQUIRED IF THE WEBSOCKET CONNECTION IS IN LONG POLLING STATUS AND NOT UPGRADED TO WEBSOCKET
            console.log('disconnect_from_widget call received.');
            $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.reason).html());
            disconnect_from_widget();
        }
        else if (msg.data.slice(0,9) == 'CONNECTED') {
            socket.emit('join', {room: $('#userid').val()});
            $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.data).html()); 
        }
        else {
            console.log('appending the msg: '+msg.data);
            $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.data).html());     
        }   
    });

    socket.on('local_celery_request', function(msg) {
        console.log(msg.data);    
        pingTally(msg.data, msg.type);
    });

    /*$('form#emit2web').submit(function(event) {
        socket.emit('local_response', {room: $('#userid').val(), response:$('#emit2web_data').val()});
        return false;
    });*/
};//end Startsocket function

// function inform_server_socket_disconnect() {
//     socket.emit('left', {room: $('#userid').val()});
//     btnEnableDisable();
// }

function disconnect_from_widget() {
    socket.emit('left', {room: $('#userid').val()});
    socket.close(); 
    $('#log').append('<br>' + $('<div/>').text('Disconnected from khaata.in').html());
    btnEnableDisable();
    console.log('SOCKET DISCONNECT STATUS:', socket.disconnected);
    return false;
}

/* END SOCKET FUNCTIONS */
//MANAGE USE CASE OF CLOSING THE APP TO DISCONNECT THE SOCKET
window.onbeforeunload = function (e) {
    socket.close(); 
}

function btnEnableDisable() {
    $('#disconnectSocket').attr("disabled", true);
    $('#startSocket').removeAttr("disabled");
    return false;
};

/* HTTP ASYNC FUNCTION */
function postHTTPAsync(theUrl, message, message_type) {
    var xhr = new XMLHttpRequest();
    xhr.onloadstart = function () {
        $('#log').append('<span class="prepended"><br> Processing..</span>')
      };
    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. 
        $(".prepended").remove();
        $('#log').append('<br> Timeout.' + xhr.statusText)
        local_result = {'status': 'ERROR', 'resultText': 'TIMEOUT.' + xhr.statusText};
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val(), 'type': message_type});
      };
  
    xhr.onload = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        //alert(xhr.responseText);
        $(".prepended").remove();
        //console.log(xhr.responseXML);
        console.log(xhr.status);
        
        //SET variables to send to the server according to the response received from Tally
        var local_result = {};

        if (xhr.status == 200) {
            //VALID RESPONSE - GOT AN ENVELOPE TAG
            if (xhr.responseXML.getElementsByTagName("ENVELOPE").length) {
                //VALID RESPONSE - RECONCILE
                if (message_type == 'reconcile') {
                    console.log('RECONCILE RESPONSE IS:')
                    console.log(xhr);
                    //$voucherXML = xhr.responseXML.getElementsByTagName("TALLYMESSAGE");
                    $voucherXML = new XMLSerializer().serializeToString(xhr.responseXML);//.getElementsByTagName("VOUCHER");
                    // var voucher_array = [];
                    // for (var i=0; i< $voucherXML.length - 1;i++) {
                    //     voucher_array.push($voucherXML[i].getElementsByTagName('VOUCHERNUMBER')[0].innerHTML);
                    // }
                    console.log($voucherXML);
                    local_result = {'status': 'OK','resultText': $voucherXML};
                }// end of RECONCILE function
                //VALID RESPONSE - WRONG XML    
                else if (xhr.responseXML.getElementsByTagName("LINEERROR").length) {
                    console.log(xhr.response);
                    local_result = {
                        'status': 'LINEERROR',
                        'resultText':{
                            'created': (xhr.responseXML.getElementsByTagName('CREATED').length) ? xhr.responseXML.getElementsByTagName('CREATED')[0].textContent : 0,
                            'altered': (xhr.responseXML.getElementsByTagName('ALTERED').length) ? xhr.responseXML.getElementsByTagName('ALTERED')[0].textContent : 0,
                            'errors': (xhr.responseXML.getElementsByTagName('ERRORS').length) ? xhr.responseXML.getElementsByTagName('ERRORS')[0].textContent : 0
                        },
                        'linerror_details': {
                            'vch_number': (xhr.responseXML.getElementsByTagName('VCHNUMBER').length) ? xhr.responseXML.getElementsByTagName('VCHNUMBER')[0].textContent : 'NONE',
                            'lineerror': (xhr.responseXML.getElementsByTagName('LINEERROR').length) ? xhr.responseXML.getElementsByTagName('LINEERROR')[0].textContent : 'NONE'
                        }
                    }   
                }
                else {
                        //VALID RESPONSE - CORRECT XML AND EXECUTED SUCCESSFULLY
                    try {
                        local_result = {
                            'status': 'OK',
                            'resultText':{
                                'vch_number': (xhr.responseXML.getElementsByTagName('VCHNUMBER').length) ? xhr.responseXML.getElementsByTagName('VCHNUMBER')[0].textContent : 'NONE',
                                'created': xhr.responseXML.getElementsByTagName('CREATED')[0].textContent,
                                'altered': xhr.responseXML.getElementsByTagName('ALTERED')[0].textContent,
                                'errors': xhr.responseXML.getElementsByTagName('ERRORS')[0].textContent
                            }
                            };
                        } catch(error) {
                            local_result = {'status': 'ERROR','resultText': error.message};
                    }   
                }
            }
            //INVALID RESPONSE OR TEST TALLY
            else {
                local_result = {'status': 'RESPONSE', 
                'resultText': xhr.responseXML.getElementsByTagName("RESPONSE")[0].textContent
                }
            }
        }//End of status 200 loop
        else {
            //xhr Status is not 200
            $('#log').append('<br> Error.' + xhr.statusText);
            local_result = {'status': 'ERROR','resultText': xhr.statusText};
        }//end else of status loop   
        console.log('RESULT is: ', local_result); 
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val(), 'type':message_type});
     }//end DONE request
    };//end onLOAD
    xhr.onerror = function (e) {
        $('#log').append('<br> ERROR REQUEST.' + xhr.statusText);
        local_result = {'status': 'ERROR', 'resultText': 'TALLY SERVER IS NOT UP OR CHECK THE TALLY URL IN THE WIDGET.' + xhr.statusText};
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val(), 'type':message_type});
      };

xhr.open('POST', theUrl, true);//async operation
xhr.timeout = 15000; // time in milliseconds
xhr.send(message);
}
/* END HTTPASYNC FUNCTION */


/*PING TALLY HERE*/
function pingTally(message, message_type=null) {
   //load URL of Tally
    input_url = $('#tallyURL').val();
    //CHECK VALID URL AND SEND MESSAGE TO TALLY
    if (!ValidURL(input_url)) {
        $('#log').append('<br> INVALID URL.');
        local_result = {'status': 'ERROR', 'resultText': 'INVALID URL.' + xhr.statusText};
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val(), 'type': message_type});
    }
    else {
        postHTTPAsync(input_url, message, message_type);
    }//end else
};


/* VALIDATE TALLY URL */
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

function clearLog() {
    $('#log').empty();
}

/* TESTING FUNCTIONS */

/* TEST PING TALLY FUNCTION */
function test_ping_tally() {
    pingTally(create_ledger());
}

function check_local_response() {
    theUrl = 'http://192.168.0.15:9000';
    message = create_ledger();

    var xhr = new XMLHttpRequest();
    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. Do something here.
        console.log('Timeout.' + xhr.statusText)
        };
    
    xhr.onload = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        //alert(xhr.responseText);
        if (xhr.status == 200) {
            //console.log(xhr.responseXML.getElementsByTagName('DSPACCNAME')[0].getElementsByTagName('DSPDISPNAME'));
            //console.log(xhr.responseXML)
            //console.log(xhr.responseXML.getElementsByTagName('ENVELOPE'));
            //VALID RESPONSE
            if (xhr.responseXML.getElementsByTagName("ENVELOPE").length) {
                //console.log(xhr.responseXML.getElementsByTagName('DSPACCNAME')[0].getElementsByTagName('DSPDISPNAME')[0].innerHTML);
                try {
                    console.log(xhr.responseXML.getElementsByTagName('ALTfdfdERED')[0].innerHTML);
                }catch(error) {
                    console.log('ERROR IS: ', error);
                }
                var result = {
                    'c': xhr.responseXML.getElementsByTagName('CREAfdfdTED')[0].innerHTML,
                    'a': xhr.responseXML.getElementsByTagName('ALTERED')[0].innerHTML,
                    'e': xhr.responseXML.getElementsByTagName('ERRORS')[0].innerHTML
                };
                console.log('RESULT is: ', result);
            }
            //INVALID RESPONSE OR TEST TALLY
            else {
                console.log(xhr.responseXML);
                console.log(xhr.responseXML.getElementsByTagName("RESPONSE")[0].innerHTML);
            }
            //console.log(xhr.responseXML.getElementsByTagName('DSPACCNAME')[0].getElementsByTagName('DSPDISPNAME')[0].innerHTML);
        }
        else {
            console.log('Error.' + xhr.statusText)
        }//end else     */  
        }//end DONE request
    };//end onLOAD
    xhr.onerror = function (e) {
        console.log('ERROR REQUEST.' + xhr.statusText);
        };

xhr.open('POST', theUrl, true);//async operation
xhr.timeout = 3000; // time in milliseconds
xhr.send(message);
//xhr.send(null);
}

/*XMLs*/
function get_TB() {
    var req = `<ENVELOPE>
    <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    </HEADER>
    <BODY>
    <EXPORTDATA>
    <REQUESTDESC>
    <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
    <REPORTNAME>Trial Balance</REPORTNAME>
    </REQUESTDESC>
    </EXPORTDATA>
    </BODY>
    </ENVELOPE>`
    //console.log(req)
    return req
}

function create_ledger() {
    var req = `<ENVELOPE>
        <HEADER>
            <VERSION>1</VERSION>
            <TALLYREQUEST>Import</TALLYREQUEST>
            <TYPE>Data</TYPE>
            <ID>All Masters</ID>
        </HEADER>
        <BODY>
            <DESC>
                <STATICVARIABLES>
                    <IMPORTDUPS>@@DUPIGNORECOMBINE</IMPORTDUPS>
                </STATICVARIABLES>
            </DESC>
            <DATA>
                <TALLYMESSAGE xmlns:UDF='TallyUDF'>
                    <LEDGER NAME='Interstate Sales - GST - 12.0%' ACTION='Create'>
                            <NAME>Interstate Sales - GST - 12.0%</NAME> 
                        <PARENT>Sales Accounts</PARENT>
                        <OPENINGBALANCE>0</OPENINGBALANCE>
                    </LEDGER>
                </TALLYMESSAGE>
            </DATA>
        </BODY>
    </ENVELOPE>`
    return req
}

