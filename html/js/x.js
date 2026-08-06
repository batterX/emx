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
                var nowDate = new Date(json["servertime"].split(" ").join("T") + "Z");
                var dif = (nowDate - logDate) / 1000;
                $("#timestamp").text(json["logtime"]).css("color", (dif > 60) ? "red" : "");
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




            for(var n = 1; n <= 4; n++) {
                if(json_has('2337', ''+n)) {
                    var val = json_get('2337', ''+n).toString();
                    var isOn = (val.slice(-1) == "1");
                    var isForced = val.length == 2 && val.charAt(0) == '1';
                    $('.out' + n + ' span').text(isOn ? "ON" : "OFF");
                    $('.out' + n + ' .auto, .out' + n + ' .on, .out' + n + ' .off').removeAttr('disabled');
                    if(!isForced) $('.out' + n + ' .auto').attr('disabled', true);
                    else          $('.out' + n + ' .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
                if(json_has('2465', ''+n)) {
                    var val = json_get('2465', ''+n).toString();
                    var isOn = (val.slice(-1) == "1");
                    var isForced = val.length == 2 && val.charAt(0) == '1';
                    $('.cmd' + n + ' span').text(isOn ? "ON" : "OFF");
                    $('.cmd' + n + ' .auto, .cmd' + n + ' .on, .cmd' + n + ' .off').removeAttr('disabled');
                    if(!isForced) $('.cmd' + n + ' .auto').attr('disabled', true);
                    else          $('.cmd' + n + ' .' + (isOn ? 'on' : 'off')).attr('disabled', true);
                }
                if(json_has('2321', ''+n)) {
                    var isOn = (json_get('2321', ''+n) == "1");
                    $('.in' + n + ' span').text(isOn ? "ON" : "OFF");
                }
            }




        }
    });

}




// GPIO button handlers — data-type=20737 for outputs, 20738 for cmds
for(let n = 1; n <= 4; n++) {
    $('.out' + n + ' .auto').on('click', () => $.get({ url: "api.php?set=command&type=20737&text1=" + n + "&text2=2" }));
    $('.out' + n + ' .on'  ).on('click', () => $.get({ url: "api.php?set=command&type=20737&text1=" + n + "&text2=1" }));
    $('.out' + n + ' .off' ).on('click', () => $.get({ url: "api.php?set=command&type=20737&text1=" + n + "&text2=0" }));

    $('.cmd' + n + ' .auto').on('click', () => $.get({ url: "api.php?set=command&type=20738&text1=" + n + "&text2=2" }));
    $('.cmd' + n + ' .on'  ).on('click', () => $.get({ url: "api.php?set=command&type=20738&text1=" + n + "&text2=1" }));
    $('.cmd' + n + ' .off' ).on('click', () => $.get({ url: "api.php?set=command&type=20738&text1=" + n + "&text2=0" }));
}




$.get({
    url: "cmd/apikey.php",
    success: (apikey) => { $('#apikey').html(apikey); }
});




$('#btnReboot').on('click', async () => {
    if(!(await _confirm("Are you sure you want to REBOOT the EMS?"))) return;
    $('#btnReboot').attr('disabled', true);
    $.get({
        url: "cmd/reboot.php",
        complete: () => { setTimeout(() => location.reload(), 5000); }
    });
});

$('#btnShutdown').on('click', async () => {
    if(!(await _confirm("Are you sure you want to SHUTDOWN the EMS?"))) return;
    $('#btnShutdown').attr('disabled', true);
    $.get({
        url: "cmd/shutdown.php",
        complete: () => { setTimeout(() => location.reload(), 5000); }
    });
});

$('#btnClearDatabase').on('click', async () => {
    if(!(await _confirm("Are you sure you want to CLEAR the Database?"))) return;
    $.get({
        url: "api.php?cleardb=1",
        success: (response) => {
            if(response == 1) _alert("SUCCESS");
        }
    });
});
