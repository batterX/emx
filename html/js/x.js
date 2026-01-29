$.ripple({".ripple": { "touchDelay": 300 }});





mainLoop();

function mainLoop() {

    $.get({
        url: "api.php?get=currentstate",
        complete: () => { setTimeout(mainLoop, 5000); },
        success: (json) => {





            var json_has = function(type, entity) {
                if(entity !== undefined)
                    return json.hasOwnProperty(''+type) && json[type].hasOwnProperty(''+entity);
                return json.hasOwnProperty(type);
            }
            var json_get = function(type, entity) {
                if(entity !== undefined)
                    return json[type][entity];
                return json[type][Object.keys(json[type])[0]];
            }

            var round = function(value, precision) {
                var multiplier = Math.pow(10, precision || 0);
                var val = (Math.round(value * multiplier) / multiplier).toString();
                if(!val.includes(".")) val = val + ".0";
                return val;
            }





            if(json.hasOwnProperty("logtime") && json.hasOwnProperty("servertime")) {
                var logDate = new Date(json["logtime"].split(" ").join("T") + "Z");
                var nowDate = new Date(json["servertime"].split(" ").join("T") + "Z"); // Use server time instead of local PC time
                var dif = (nowDate - logDate) / 1000;
                console.log(logDate);
                console.log(nowDate);
                console.log(dif);
                $("#timestamp").text(json["logtime"]).css("color", (dif > 60) ? "red" : "var(--color-on-main)");
                // Show|Hide ClearDatabase
                if(dif > 60) $(".clear-db").removeClass("d-none");
                else         $(".clear-db").addClass   ("d-none");
            } else {
                // Show ClearDatabase
                $(".clear-db").removeClass("d-none");
            }





            if(json_has( "273", "1")) $( "#273_1").html(round(json_get( "273", "1") * 0.01, 1));
            if(json_has( "274", "1")) $( "#274_1").html(round(json_get( "274", "1") * 0.01, 1));
            if(json_has( "275", "1")) $( "#275_1").html(round(json_get( "275", "1") * 0.01, 1));

            if(json_has( "305", "1")) $( "#305_1").html(round(json_get( "305", "1") * 0.01, 1));
            if(json_has( "306", "1")) $( "#306_1").html(round(json_get( "306", "1") * 0.01, 1));
            if(json_has( "307", "1")) $( "#307_1").html(round(json_get( "307", "1") * 0.01, 1));

            if(json_has( "337", "1")) $( "#337_1").html(round(json_get( "337", "1") * 1   , 1));
            if(json_has( "338", "1")) $( "#338_1").html(round(json_get( "338", "1") * 1   , 1));
            if(json_has( "339", "1")) $( "#339_1").html(round(json_get( "339", "1") * 1   , 1));

            if(json_has( "353", "1")) $( "#353_1").html(round(json_get( "353", "1") * 1   , 1));





            if(json_has("2833", "0")) $("#2833_0").html(round(json_get("2833", "0") * 0.01, 1));
            if(json_has("2834", "0")) $("#2834_0").html(round(json_get("2834", "0") * 0.01, 1));
            if(json_has("2835", "0")) $("#2835_0").html(round(json_get("2835", "0") * 0.01, 1));

            if(json_has("2865", "0")) $("#2865_0").html(round(json_get("2865", "0") * 0.01, 1));
            if(json_has("2866", "0")) $("#2866_0").html(round(json_get("2866", "0") * 0.01, 1));
            if(json_has("2867", "0")) $("#2867_0").html(round(json_get("2867", "0") * 0.01, 1));

            if(json_has("2897", "0")) $("#2897_0").html(round(json_get("2897", "0") * 1   , 1));
            if(json_has("2898", "0")) $("#2898_0").html(round(json_get("2898", "0") * 1   , 1));
            if(json_has("2899", "0")) $("#2899_0").html(round(json_get("2899", "0") * 1   , 1));

            if(json_has("2913", "0")) $("#2913_0").html(round(json_get("2913", "0") * 1   , 1));





            if(json_has("1297", "1")) $("#1297_1").html(round(json_get("1297", "1") * 0.01, 1));
            if(json_has("1298", "1")) $("#1298_1").html(round(json_get("1298", "1") * 0.01, 1));
            if(json_has("1299", "1")) $("#1299_1").html(round(json_get("1299", "1") * 0.01, 1));

            if(json_has("1329", "1")) $("#1329_1").html(round(json_get("1329", "1") * 0.01, 1));
            if(json_has("1330", "1")) $("#1330_1").html(round(json_get("1330", "1") * 0.01, 1));
            if(json_has("1331", "1")) $("#1331_1").html(round(json_get("1331", "1") * 0.01, 1));

            if(json_has("1361", "1")) $("#1361_1").html(round(json_get("1361", "1") * 1   , 1));
            if(json_has("1362", "1")) $("#1362_1").html(round(json_get("1362", "1") * 1   , 1));
            if(json_has("1363", "1")) $("#1363_1").html(round(json_get("1363", "1") * 1   , 1));

            if(json_has("1377", "1")) $("#1377_1").html(round(json_get("1377", "1") * 1   , 1));





            if(json_has("2833", "2")) $("#2833_2").html(round(json_get("2833", "2") * 0.01, 1));
            if(json_has("2834", "2")) $("#2834_2").html(round(json_get("2834", "2") * 0.01, 1));
            if(json_has("2835", "2")) $("#2835_2").html(round(json_get("2835", "2") * 0.01, 1));

            if(json_has("2865", "2")) $("#2865_2").html(round(json_get("2865", "2") * 0.01, 1));
            if(json_has("2866", "2")) $("#2866_2").html(round(json_get("2866", "2") * 0.01, 1));
            if(json_has("2867", "2")) $("#2867_2").html(round(json_get("2867", "2") * 0.01, 1));

            if(json_has("2897", "2")) $("#2897_2").html(round(json_get("2897", "2") * 1   , 1));
            if(json_has("2898", "2")) $("#2898_2").html(round(json_get("2898", "2") * 1   , 1));
            if(json_has("2899", "2")) $("#2899_2").html(round(json_get("2899", "2") * 1   , 1));

            if(json_has("2913", "2")) $("#2913_2").html(round(json_get("2913", "2") * 1   , 1));





            if(json_has("2833", "3")) $("#2833_3").html(round(json_get("2833", "3") * 0.01, 1));
            if(json_has("2834", "3")) $("#2834_3").html(round(json_get("2834", "3") * 0.01, 1));
            if(json_has("2835", "3")) $("#2835_3").html(round(json_get("2835", "3") * 0.01, 1));

            if(json_has("2865", "3")) $("#2865_3").html(round(json_get("2865", "3") * 0.01, 1));
            if(json_has("2866", "3")) $("#2866_3").html(round(json_get("2866", "3") * 0.01, 1));
            if(json_has("2867", "3")) $("#2867_3").html(round(json_get("2867", "3") * 0.01, 1));

            if(json_has("2897", "3")) $("#2897_3").html(round(json_get("2897", "3") * 1   , 1));
            if(json_has("2898", "3")) $("#2898_3").html(round(json_get("2898", "3") * 1   , 1));
            if(json_has("2899", "3")) $("#2899_3").html(round(json_get("2899", "3") * 1   , 1));

            if(json_has("2913", "3")) $("#2913_3").html(round(json_get("2913", "3") * 1   , 1));





            if(json_has("1553", "1")) $("#1553_1").html(round(json_get("1553", "1") * 0.01, 1));
            if(json_has("1554", "1")) $("#1554_1").html(round(json_get("1554", "1") * 0.01, 1));

            if(json_has("1569", "1")) $("#1569_1").html(round(json_get("1569", "1") * 0.01, 1));
            if(json_has("1570", "1")) $("#1570_1").html(round(json_get("1570", "1") * 0.01, 1));

            if(json_has("1617", "1")) $("#1617_1").html(round(json_get("1617", "1") * 1   , 1));
            if(json_has("1618", "1")) $("#1618_1").html(round(json_get("1618", "1") * 1   , 1));

            if(json_has("1634", "0")) $("#1634_0").html(round(json_get("1634", "0") * 1   , 1));





            if(json_has("1042", "1")) $("#1042_1").html(round(json_get("1042", "1") * 0.01, 1));
            if(json_has("1058", "1")) $("#1058_1").html(round(json_get("1058", "1") * 0.01, 1));
            if(json_has("1121", "1")) $("#1121_1").html(round(json_get("1121", "1") * 1   , 1));
            if(json_has("1074", "1")) $("#1074_1").html(round(json_get("1074", "1") * 1   , 1));





            if(json_has(  "369", "1")) $(  "#369_1").html(round(json_get(  "369", "1") * 1   , 1));
            if(json_has(  "370", "1")) $(  "#370_1").html(round(json_get(  "370", "1") * 1   , 1));
            if(json_has("24582", "1")) $("#24582_1").html(round(json_get("24582", "1") * 1   , 1));
            if(json_has( "2913", "9")) $( "#2913_9").html(round(json_get( "2913", "9") * 1   , 1));





            if(json_has('2337')) {
                if(json_has('2337', '1')) {
                    var isOn = (json_get('2337', '1').toString().slice(-1) == "1");
                    var isForced = json_get('2337', '1').toString().length != 2 || json_get('2337', '1').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.out1 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.out1 .auto, .out1 .on, .out1 .off').removeAttr('disabled');
                    if(!isForced) $('.out1 .auto').attr('disabled', true);
                    else $('.out1 .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
                if(json_has('2337', '2')) {
                    var isOn = (json_get('2337', '2').toString().slice(-1) == "1");
                    var isForced = json_get('2337', '2').toString().length != 2 || json_get('2337', '2').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.out2 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.out2 .auto, .out2 .on, .out2 .off').removeAttr('disabled');
                    if(!isForced) $('.out2 .auto').attr('disabled', true);
                    else $('.out2 .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
                if(json_has('2337', '3')) {
                    var isOn = (json_get('2337', '3').toString().slice(-1) == "1");
                    var isForced = json_get('2337', '3').toString().length != 2 || json_get('2337', '3').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.out3 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.out3 .auto, .out3 .on, .out3 .off').removeAttr('disabled');
                    if(!isForced) $('.out3 .auto').attr('disabled', true);
                    else $('.out3 .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
                if(json_has('2337', '4')) {
                    var isOn = (json_get('2337', '4').toString().slice(-1) == "1");
                    var isForced = json_get('2337', '4').toString().length != 2 || json_get('2337', '4').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.out4 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.out4 .auto, .out4 .on, .out4 .off').removeAttr('disabled');
                    if(!isForced) $('.out4 .auto').attr('disabled', true);
                    else $('.out4 .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
            }





            if(json_has('2465')) {
                if(json_has('2465', '1')) {
                    var isOn = (json_get('2465', '1').toString().slice(-1) == "1");
                    var isForced = json_get('2465', '1').toString().length != 2 || json_get('2465', '1').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.cmd1 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.cmd1 .auto, .cmd1 .on, .cmd1 .off').removeAttr('disabled');
                    if(!isForced) $('.cmd1 .auto').attr('disabled', true);
                    else $('.cmd1 .' + (isOn?'on':'off')).attr('disabled', true);
                }
                if(json_has('2465', '2')) {
                    var isOn = (json_get('2465', '2').toString().slice(-1) == "1");
                    var isForced = json_get('2465', '2').toString().length != 2 || json_get('2465', '2').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.cmd2 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.cmd2 .auto, .cmd2 .on, .cmd2 .off').removeAttr('disabled');
                    if(!isForced) $('.cmd2 .auto').attr('disabled', true);
                    else $('.cmd2 .' + (isOn?'on':'off')).attr('disabled', true);
                }
                if(json_has('2465', '3')) {
                    var isOn = (json_get('2465', '3').toString().slice(-1) == "1");
                    var isForced = json_get('2465', '3').toString().length != 2 || json_get('2465', '3').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.cmd3 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.cmd3 .auto, .cmd3 .on, .cmd3 .off').removeAttr('disabled');
                    if(!isForced) $('.cmd3 .auto').attr('disabled', true);
                    else $('.cmd3 .' + (isOn?'on':'off')).attr('disabled', true);
                }
                if(json_has('2465', '4')) {
                    var isOn = (json_get('2465', '4').toString().slice(-1) == "1");
                    var isForced = json_get('2465', '4').toString().length != 2 || json_get('2465', '4').toString().charAt(0) != '1' ? false : true;
                    // Set Status
                    $('.cmd4 span').text(isOn ? "ON" : "OFF");
                    // Set Active Button
                    $('.cmd4 .auto, .cmd4 .on, .cmd4 .off').removeAttr('disabled');
                    if(!isForced) $('.cmd4 .auto').attr('disabled', true);
                    else $('.cmd4 .' + (isOn?'on':'off')).attr('disabled', true);
                }
            }





            if(json_has('2321')) {
                if(json_has('2321', '1')) {
                    var isOn = (json_get('2321', '1') == "1");
                    $('.in1 span').text(isOn ? "ON" : "OFF");
                }
                if(json_has('2321', '2')) {
                    var isOn = (json_get('2321', '2') == "1");
                    $('.in2 span').text(isOn ? "ON" : "OFF");
                }
                if(json_has('2321', '3')) {
                    var isOn = (json_get('2321', '3') == "1");
                    $('.in3 span').text(isOn ? "ON" : "OFF");
                }
                if(json_has('2321', '4')) {
                    var isOn = (json_get('2321', '4') == "1");
                    $('.in4 span').text(isOn ? "ON" : "OFF");
                }
            }





        }
    });
        
}





$('.out1 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=1&text2=2", success: function(response) { console.log(response); } }); });
$('.out1 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=1&text2=1", success: function(response) { console.log(response); } }); });
$('.out1 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=1&text2=0", success: function(response) { console.log(response); } }); });

$('.out2 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=2&text2=2", success: function(response) { console.log(response); } }); });
$('.out2 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=2&text2=1", success: function(response) { console.log(response); } }); });
$('.out2 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=2&text2=0", success: function(response) { console.log(response); } }); });

$('.out3 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=3&text2=2", success: function(response) { console.log(response); } }); });
$('.out3 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=3&text2=1", success: function(response) { console.log(response); } }); });
$('.out3 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=3&text2=0", success: function(response) { console.log(response); } }); });

$('.out4 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=4&text2=2", success: function(response) { console.log(response); } }); });
$('.out4 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=4&text2=1", success: function(response) { console.log(response); } }); });
$('.out4 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20737&text1=4&text2=0", success: function(response) { console.log(response); } }); });





$('.cmd1 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=1&text2=2", success: function(response) { console.log(response); } }); });
$('.cmd1 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=1&text2=1", success: function(response) { console.log(response); } }); });
$('.cmd1 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=1&text2=0", success: function(response) { console.log(response); } }); });

$('.cmd2 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=2&text2=2", success: function(response) { console.log(response); } }); });
$('.cmd2 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=2&text2=1", success: function(response) { console.log(response); } }); });
$('.cmd2 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=2&text2=0", success: function(response) { console.log(response); } }); });

$('.cmd3 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=3&text2=2", success: function(response) { console.log(response); } }); });
$('.cmd3 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=3&text2=1", success: function(response) { console.log(response); } }); });
$('.cmd3 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=3&text2=0", success: function(response) { console.log(response); } }); });

$('.cmd4 .auto').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=4&text2=2", success: function(response) { console.log(response); } }); });
$('.cmd4 .on  ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=4&text2=1", success: function(response) { console.log(response); } }); });
$('.cmd4 .off ').on('click', function() { $.get({ url: "api.php?set=command&type=20738&text1=4&text2=0", success: function(response) { console.log(response); } }); });





$.get({
    url: "cmd/apikey.php",
    success: function(apikey) {
        $('#apikey').html(apikey);
    }
});





$('#btnReboot').on('click', function() {
    if(!confirm("Are you sure you want to REBOOT the LiveX?")) return false;
    $.get({
        url: "cmd/reboot.php",
        complete: function(res) {
            setTimeout(function() { location.reload(1) }, 5000);
        }
    });
    $('#btnReboot').attr('disabled', true);
});

$('#btnShutdown').on('click', function() {
    if(!confirm("Are you sure you want to SHUTDOWN the LiveX?")) return false;
    $.get({
        url: "cmd/shutdown.php",
        complete: function(res) {
            setTimeout(function() { location.reload(1) }, 5000);
        }
    });
    $('#btnShutdown').attr('disabled', true);
});

$('#btnClearDatabase').on('click', function() {
    if(!confirm("Are you sure you want to CLEAR the Database?")) return false;
    $.get({
        url: "api.php?cleardb=1",
        success: function(response) {
            console.log(response);
            if(response == 1) alert("SUCCESS");
        }
    });
});
