var socket;

function startSocket() {
 

    if ($('#userid').val() == ""){
         alert("Please enter a value");
         return false;       
    }

    
    //namespace = '/test_local';    
    socket = io.connect('http://localhost:5000/test_local',{'rememberTransport': false, 'force new connection':true})
    //socket = io.connect('http://staging.khaata.in/test_local',{'rememberTransport': false, 'force new connection':true})
    //socket = io.connect('http://' + document.domain + ':' + location.port + namespace); //USE THIS TO AVOID SESSION ERRORS
    
    socket.on('connect', function() {
        socket.emit('joined', {room: $('#userid').val()});
        $('#startSocket').attr("disabled", true);
        $('#disconnectSocket').removeAttr("disabled");
    });

    socket.on('local_window', function(msg) {
        if (msg.data == 'disconnect_client') {
            disconnectSocket();
        }
        else {
            $('#log').append('<br>' + $('<div/>').text('Received: ' + msg.data).html());
        }
        
    });

    socket.on('local_celery_request', function(msg) {
        //console.log(msg.data);    
        pingTally(msg.data);
    });

    /*$('form#emit2web').submit(function(event) {
        socket.emit('local_response', {room: $('#userid').val(), response:$('#emit2web_data').val()});
        return false;
    });*/
};//end Startsocket function


function disconnectSocket() {
    socket.emit('left', {room: $('#userid').val()});
    $('#disconnectSocket').attr("disabled", true);
    $('#startSocket').removeAttr("disabled");
    return false;
};
/* END SOCKET FUNCTIONS */
//MANAGE USE CASE OF CLOSING THE APP TO DISCONNECT THE SOCKET
window.onbeforeunload = function (e) { 
    disconnectSocket();
}

/* HTTP ASYNC FUNCTION */
function postHTTPAsync(theUrl, message) {
    var xhr = new XMLHttpRequest();
    xhr.onloadstart = function () {
        $('#log').append('<span class="prepended"><br> Processing..</span>')
      };
    xhr.ontimeout = function (e) {
        // XMLHttpRequest timed out. 
        $(".prepended").remove();
        $('#log').append('<br> Timeout.' + xhr.statusText)
        local_result = {'status': 'ERROR', 'resultText': 'TIMEOUT.' + xhr.statusText};
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val()});
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
                //VALID RESPONSE - WRONG XML    
                if (xhr.responseXML.getElementsByTagName("LINEERROR").length) {
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
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val()});
     }//end DONE request
    };//end onLOAD
    xhr.onerror = function (e) {
        $('#log').append('<br> ERROR REQUEST.' + xhr.statusText);
        local_result = {'status': 'ERROR', 'resultText': 'BAD REQUEST..' + xhr.statusText};
        socket.emit('local_celery_response', {'local_result': local_result, room: $('#userid').val()});
      };

xhr.open('POST', theUrl, true);//async operation
xhr.timeout = 4000; // time in milliseconds
xhr.send(message);
}
/* END HTTPASYNC FUNCTION */


/*PING TALLY HERE*/
function pingTally(message) {
   //load URL of Tally
   //DEBUG
    //input_url = "http://192.168.0.15:9000"
    
    input_url = $('#tallyURL').val();
    //alert(input_url);
    //CHECK VALID URL AND SEND MESSAGE TO TALLY
    if (!ValidURL(input_url)) {
        $('#log').append('<br> INVALID URL.');
    }
    else {
        postHTTPAsync(input_url, message);
        //$('#log').append('<br><span class= + 'Posted to:' + input_url) //for sync request
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

/* DEPRECATED
function postHTTPsync(theUrl) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest()  
    xmlHttp.open("POST", theUrl, false) //false is for synchronous requests.
    try {
        xmlHttp.send(null)
    } catch (error) {
        return '<br>Could not load URL. Please see Tally.'
    }
    return xmlHttp.responseText 
};//end httpPOST function

function postAJAX(theUrl) {
    $.ajax({
        type: "POST",
        url: theUrl,
        contentType: "application/xml",
        beforeSend: function() {
           $('#log').append('<span class="prepended"><br> Processing. Please wait.. </span>');
        },
        complete: function() {
            $('#log').append("<br> Processed.");
        },
        error: function(xhr, statusText) { 
            $(".prepended").remove();
            $('#log').append("<br> Error: "+statusText); 
            },
        success: function(tally_response){ 
            alert(tally_response.responseText)
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
}
*/