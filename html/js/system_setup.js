$progress.trigger("step", 5);










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Define Variables
*/

var skipSetup        = false;

var systemApikey     = apikey;
var systemModel      = "";
var systemSerial     = "";
var systemType       = "";
var deviceModel      = "";
var deviceDatetime   = "";
var devicePower      = 0;
var devicePartNumber = "";

var newParameters    = {};
var oldParameters    = {};

var isAlreadyRegistered = false;
var isSettingParameters = false;
var checkParametersInterval;
var checkParametersCounter;

var reactive_mode   = null;
var reactive_kink   = null;
var reactive_cosphi = null;
var reactive_qmaxsn = null;
var reactive_v1     = null;
var reactive_v2     = null;
var reactive_v3     = null;
var reactive_v4     = null;
var reactive_qutime = null;
var reactive_qfix   = null;

var isClixV2 = false;

var dataSettings = {};
var importedData = {};

var previousSettings = null; // Store the previous response, to compare and know when something has changed
var initialBmsConnectValue = null; // Store the initial BMS battery connect value to restore at the end

var canShowImportCloudData = true;










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Helper Functions
*/

function isLiFePO   () { return $("#bx_battery_type_0").is(":checked"); }
function isCarbon   () { return $("#bx_battery_type_1").is(":checked"); }
function isOther    () { return $("#bx_battery_type_9").is(":checked"); }
function isNoBattery() { return $("#bx_battery_type_n").is(":checked"); }

function isUPS      () { return $("#bx_sysmode").val() == "0"; }
function isBackup   () { return $("#bx_sysmode").val() == "1"; }

function hasExtSol  () { return $("#extsol_check").is(":checked"); }

function hasMeter1  () { return $("#meter1_mode").val() == "1"; }
function hasMeter2  () { return $("#meter2_mode").val() == "1"; }
function hasMeter3  () { return $("#meter3_mode").val() == "1"; }
function hasMeter4  () { return $("#meter4_mode").val() == "1"; }

function isNewSys   () { return $("#system_co_new").is(":checked"); }
function isOldSys   () { return $("#system_co_old").is(":checked"); }










/*
    Helper Functions
*/

function elementExists(selector) { return $(selector).length > 0; }

function disableBtnNext() { $("#btn_next").attr("disabled", true); }










/*
    Helper Functions
*/

function allFieldsCorrect() {

    // Return If Empty Field
    if( $("#installation_date      ").val() == "" ||
        $("#bx_device              ").val() == "" ||
        $("#bx_box                 ").val() == "" ||
        $("#bx_sysmode             ").val() == "" && elementExists("#bx_sysmode") ||
        $("#solar_wattpeak         ").val() == "" ||
        $("#solar_feedinlimitation ").val() == "" ||
        $("#reactive_mode          ").val() == "" ||
        $("#extended_lfsmoThreshold").val() == "" ||
        $("#extended_lfsmoDroop    ").val() == "" && elementExists("#extended_lfsmoDroop") ||
        $("#extended_lfsmoSlope    ").val() == "" && elementExists("#extended_lfsmoSlope")
    ) return false;

    // Return If Empty System S/N
    if(boxType == "livex" && isLiFePO()) { 
        if( $("bx_system").val() == ""
        ) return;
    } else {
        if( isOldSys() && $("#system_co_sn").val() == ""
        ) return false;
    }

    // LiFePO
    if(isLiFePO()) {
        if( $("#lifepo_bms          ").val() == "" && elementExists("#lifepo_bms") ||
            $("#lifepo_serialnumbers").val() == ""
        ) return false;
    }
    // Carbon
    else if(isCarbon()) {
        if( $("#carbon_battery_model   ").val() == "" ||
            $("#carbon_battery_strings ").val() == "" ||
            $("#carbon_battery_capacity").val() == ""
        ) return false;
    }
    // Other
    else if(isOther()) {
        if( $("#other_battery_capacity                ").val() == "" ||
            $("#other_battery_maxChargingCurrent      ").val() == "" ||
            $("#other_battery_maxDischargingCurrent   ").val() == "" ||
            $("#other_battery_bulkChargingVoltage     ").val() == "" ||
            $("#other_battery_floatChargingVoltage    ").val() == "" ||
            $("#other_battery_cutoffVoltage           ").val() == "" ||
            $("#other_battery_redischargeVoltage      ").val() == "" ||
            $("#other_battery_cutoffVoltageHybrid     ").val() == "" ||
            $("#other_battery_redischargeVoltageHybrid").val() == ""
        ) return false;
    }

    // Return if empty extended parameters for TOR
    if(isTor) {
        if( $("#extended_maxGridVoltage    ").val() == "" ||
            $("#extended_minGridVoltage    ").val() == "" ||
            $("#extended_maxGridFrequency  ").val() == "" ||
            $("#extended_minGridFrequency  ").val() == "" ||
            $("#extended_UeffOver1         ").val() == "" ||
            $("#extended_UeffUnder1        ").val() == "" ||
            $("#extended_UeffOver2         ").val() == "" ||
            $("#extended_UeffUnder2        ").val() == "" ||
            $("#extended_fOver1            ").val() == "" ||
            $("#extended_fUnder1           ").val() == "" ||
            $("#extended_UeffOver1Time     ").val() == "" ||
            $("#extended_UeffUnder1Time    ").val() == "" ||
            $("#extended_UeffOver2Time     ").val() == "" ||
            $("#extended_UeffUnder2Time    ").val() == "" ||
            $("#extended_fOver1Time        ").val() == "" ||
            $("#extended_fUnder1Time       ").val() == "" ||
            $("#extended_Ueff              ").val() == "" ||
            $("#extended_gridConnectDelay  ").val() == "" ||
            $("#extended_gridReconnectDelay").val() == "" && elementExists("#extended_gridReconnectDelay") ||
            $("#extended_puTime            ").val() == ""
        ) return false;
    }

    return true;

}










/*
    Helper Functions
*/

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showSettingParametersError(errorStr) {
    clearInterval(checkParametersInterval);
    checkParametersInterval = undefined;
    isSettingParameters = false;
    $("#notif").removeClass("loading error success").addClass("error");
    $("#message").html(errorStr).css("color", "red");
    $("#btn_next").attr("disabled", false).unbind().on("click", () => { mainFormSubmit(); });
}

async function waitForSettingsParameter(varName, entity, field, expectedValue, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while(Date.now() - startTime < maxWaitTime) {
        try {
            const response = await $.get({
                url: "api.php?get=settings"
            });
            
            // Update dataSettings variable like we do everywhere else
            dataSettings = JSON.parse(JSON.stringify(response));
            
            if(response && response[varName] && response[varName][entity] && response[varName][entity][field] == expectedValue) {
                return true;
            }
            
            await sleep(5000); // Wait 5 seconds before checking again
        } catch (error) {
            console.log("Error checking settings:", error);
            await sleep(5000);
        }
    }
    
    return false; // Timeout reached
}

async function waitForProgramRestart() {
    // Wait 10 seconds for program to restart first
    await sleep(10000);
    
    // Get initial logtime after the restart delay
    let initialLogtime = null;
    try {
        const initialResponse = await $.get({
            url: "api.php?get=currentstate"
        });
        initialLogtime = initialResponse?.logtime;
    } catch (error) {
        console.log("Error getting initial currentstate:", error);
    }
    
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();
    
    while(Date.now() - startTime < maxWaitTime) {
        try {
            const response = await $.get({
                url: "api.php?get=currentstate"
            });
            
            // If logtime changed, program has restarted and is running
            if(response?.logtime && response.logtime !== initialLogtime) {
                return true;
            }
            
            await sleep(5000); // Wait 5 seconds before checking again
        } catch (error) {
            console.log("Error checking currentstate:", error);
            await sleep(5000);
        }
    }
    
    return false; // Timeout reached
}

function enableBatteryFieldsAndHideLoading() {
    // Enable Battery Fields
    $(` #lifepo_bms,
        #lifepo_serialnumbers
    `).attr("disabled", false);
    // Hide Loading Screen
    isSettingParameters = false;
    $("#btn_next").attr("disabled", false);
    $(".setting-progress").addClass("d-none");
}










/*
    Helper Functions
*/

async function verifySystem() {
    try {
        const response = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action : "verify_system",
                user   : customerEmail.trim().toLowerCase(),
                system : boxType == "livex" && isLiFePO() ? $("#bx_system").val().trim() : (isOldSys() ? $("#system_co_sn").val().trim() : "NEW") 
            }
        });
        console.log(response);
        if(response === "1") {
            return true;
        } else {
            $("#errorSystemRegisteredWithOtherUser").modal("show");
            return false;
        }
    } catch (error) {
        alert("E032. Please refresh the page! (Error while verifying system serialnumber in cloud)");
        return false;
    }
}

async function verifyModulesLiFePO() {
    var system_serial = boxType == "livex" ? $("#bx_system").val() : $("#system_co_sn").val(); 
    var batteries = [];
    var bms       = [];
    $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
        if(sn.trim() != "") batteries.push(sn.trim());
    });
    if(elementExists("#lifepo_bms")) {
        $("#lifepo_bms").val().trim().split("\n").forEach(sn => {
            if(sn.trim() != "") bms.push(sn.trim());
        });
    }
    try {
        // Verify batteries
        for(const sn of batteries) {
            const response = await $.post({
                url: "https://api.batterx.app/v2/install.php",
                data: {
                    action: "verify_battery",
                    system: system_serial,
                    serialnumber: sn.trim()
                }
            });
            if(response !== "1") {
                $("#errorBatterySerial").val(sn.trim());
                $("#errorBatteryNotExistOrWithOtherSystem").modal("show");
                enableBatteryFieldsAndHideLoading();
                return false;
            }
        }
        // Verify BMS
        for(const sn of bms) {
            const response = await $.post({
                url: "https://api.batterx.app/v2/install.php",
                data: {
                    action: "verify_bms",
                    system: system_serial,
                    serialnumber: sn.trim()
                }
            });
            if(response !== "1") {
                $("#errorBmsSerial").val(sn.trim());
                $("#errorBmsNotExistOrWithOtherSystem").modal("show");
                enableBatteryFieldsAndHideLoading();
                return false;
            }
        }
        // All verifications passed
        return true;
    } catch (error) {
        alert("E015. Please refresh the page! (Error while verifying battery serialnumber in cloud)");
        enableBatteryFieldsAndHideLoading();
        return false;
    }
}

async function verifyModulesCommunication() {
    try {
        // Get current state
        const currentStateResponse = await $.get({
            url: "api.php?get=currentstate"
        });
        
        console.log(currentStateResponse);
        if(!currentStateResponse || typeof currentStateResponse != "object") {
            alert("E023. Please refresh the page! (Missing or malformed data in local currentstate table)");
            return false;
        }
        
        dataCurrentState = JSON.parse(JSON.stringify(currentStateResponse));
        var batteryLevel = 0;
        if(dataCurrentState.hasOwnProperty("3122"))
            if(dataCurrentState["3122"].hasOwnProperty(1))
                batteryLevel = parseInt(dataCurrentState["3122"]["1"]);
        
        // Verify Battery Level
        if(batteryLevel == 0) {
            $("#notif").removeClass("loading error success").addClass("error");
            $("#message").html(lang.system_setup.msg_lifepo_communication_problem).css("color", "red");
            $("#btn_next").unbind().removeAttr("form").removeAttr("type").on("click", () => { setup1(); });
            isSettingParameters = false;
            return false;
        }
        
        // If not h10 inverter, we're done
        if(inverterModel != "10002") {
            return true;
        }
        
        // For H10 inverter: Check battery charging voltage
        while(true) {
            const settingsResponse = await $.get({
                url: "api.php?get=settings"
            });
            
            console.log(settingsResponse);
            if(!settingsResponse || typeof settingsResponse != "object" || !settingsResponse.hasOwnProperty("Inverter")) {
                alert("E023. Please refresh the page! (Missing or malformed data in local settings table)");
                return false;
            }
            
            dataSettings = JSON.parse(JSON.stringify(settingsResponse));
            const inverterData = settingsResponse["Inverter"];
            
            // Wait for data to change (first time or if timestamp hasn't changed)
            if(tempDatetime == "") {
                tempDatetime = inverterData["10"]["s1"];
                await sleep(5000);
                continue;
            }
            
            if(inverterData["10"]["s1"] == tempDatetime) {
                await sleep(5000);
                continue;
            }
            
            // Verify Battery Charging Voltage
            var floatVoltage = inverterData["416"]["s1"];
            console.log(floatVoltage);
            if(floatVoltage != "5320" && floatVoltage != "5280") {
                $("#notif").removeClass("loading error success").addClass("error");
                $("#message").html(lang.system_setup.msg_lifepo_communication_problem).css("color", "red");
                $("#btn_next").unbind().removeAttr("form").removeAttr("type").on("click", () => { setup1(); });
                isSettingParameters = false;
                return false;
            }
            
            // All checks passed
            return true;
        }
        
    } catch (error) {
        alert("E022. Please refresh the page! (Error while reading local currentstate table)");
        return false;
    }
}










/*
    Helper Functions
*/

setTimeout(() => { $("#modalSkipSetup input").val(""); }, 2500);
$("#modalSkipSetup input").on("keypress", (e) => {
    if(e.which == 13) {
        function sha1(str) {
            var rotate_left = function(n, s) { var t4 = (n << s) | (n >>> (32 - s)); return t4; };
            var cvt_hex = function(val) { var str = '', i, v; for(i = 7; i >= 0; i--) { v = (val >>> (i * 4)) & 0x0f; str += v.toString(16); } return str; };
            var blockstart, i, j, W = new Array(80), H0 = 0x67452301, H1 = 0xEFCDAB89, H2 = 0x98BADCFE, H3 = 0x10325476, H4 = 0xC3D2E1F0, A, B, C, D, E, temp;
            str = unescape(encodeURIComponent(str));
            var str_len = str.length;
            var word_array = [];
            for(i = 0; i < str_len - 3; i += 4) { j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3); word_array.push(j); }
            switch(str_len % 4) {
                case 0: i = 0x080000000; break;
                case 1: i = str.charCodeAt(str_len - 1) << 24 | 0x0800000; break;
                case 2: i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000; break;
                case 3: i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) << 8 | 0x80; break;
            }
            word_array.push(i);
            while((word_array.length % 16) != 14) { word_array.push(0); }
            word_array.push(str_len >>> 29);
            word_array.push((str_len << 3) & 0x0ffffffff);
            for(blockstart = 0; blockstart < word_array.length; blockstart += 16) {
                for(i = 0; i < 16; i++) { W[i] = word_array[blockstart + i]; } for(i = 16; i <= 79; i++) { W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1); } A = H0; B = H1; C = H2; D = H3; E = H4;
                for(i = 0; i <= 19; i++) { temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff; E = D; D = C; C = rotate_left(B, 30); B = A; A = temp; }
                for(i = 20; i <= 39; i++) { temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff; E = D; D = C; C = rotate_left(B, 30); B = A; A = temp; }
                for(i = 40; i <= 59; i++) { temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff; E = D; D = C; C = rotate_left(B, 30); B = A; A = temp; }
                for(i = 60; i <= 79; i++) { temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff; E = D; D = C; C = rotate_left(B, 30); B = A; A = temp; }
                H0 = (H0 + A) & 0x0ffffffff; H1 = (H1 + B) & 0x0ffffffff; H2 = (H2 + C) & 0x0ffffffff; H3 = (H3 + D) & 0x0ffffffff; H4 = (H4 + E) & 0x0ffffffff;
            }
            temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
            return temp.toLowerCase();
        }
        var pw = $("#modalSkipSetup input").val();
        if(sha1(pw) !== "01b6951429065548a08cb881ca9151eb651b6c5f") return $("#modalSkipSetup").modal("hide");
        if($("#btn_next").is(":disabled")) return $("#modalSkipSetup").modal("hide");
        if(confirm("Are you sure you want to continue?")) { $("#modalSkipSetup").modal("hide"); skipSetup = true; $("#btn_next").trigger("click"); }
    }
});










/*
    Helper Functions
*/

function showSystemInfo(json) {

    if(!json) return;

    // Set System Info
    if(json.hasOwnProperty("system")) {
        if(json.system.hasOwnProperty("serialnumber")) {
            $("#bx_system, #system_co_sn").val(json.system.serialnumber).attr("disabled", true);
            systemSerial = json.system.serialnumber;
        }
        if(boxType == "livex") { 
            if(json.system.hasOwnProperty("model")) {
                systemType = json.system.model.includes("W") ? "w" : "r";
                $(`#bx_system_type_${systemType}`).click();
                $("#bx_system_type_w, #bx_system_type_r").attr("disabled", true);
            }
        }
    }

    // Set Device Info
    if(json.hasOwnProperty("device")) {
        if(json.device.hasOwnProperty("solar_watt_peak"))
            $("#solar_wattpeak").val(json.device.solar_watt_peak);
        if(json.device.hasOwnProperty("grid_feedin_limitation") && !isVde4105)
            $("#solar_feedinlimitation").val(json.device.grid_feedin_limitation);
    }

    // Set Installation Date
    if(json.hasOwnProperty("installation_date"))
        $("#installation_date").val(json.installation_date);

    // Set Solar Info
    if(json.hasOwnProperty("solar_info"))
        $("#solar_info").val(json.solar_info);

    // Set Installer Memo
    if(json.hasOwnProperty("note"))
        $("#installer_memo").val(json.note);

    // Set Batteries Info
    if(json.hasOwnProperty("batteries")) {
        // With Batteries
        if(json.batteries.length > 0 && json.batteries[0].hasOwnProperty("serialnumber") && json.batteries[0].hasOwnProperty("type")) {
            var battery = json.batteries[0];
            // LiFePO
            if(battery.type == 0 || json.batteries_bms.length > 0) {
                var tempArr = [];
                json.batteries.forEach(battery => { tempArr.push(battery.serialnumber); });
                $("#lifepo_serialnumbers").val(tempArr.join("\n"));
                tempArr = [];
                json.batteries_bms.forEach(bms => { tempArr.push(bms.serialnumber); });
                $("#lifepo_bms").val(tempArr.join("\n"));
            }
            // Carbon
            else if(battery.type == 1) {
                $("#bx_battery_type_1").prop("checked", true).trigger("change");
                $("#bx_system_type_w ").prop("checked", true).trigger("change");
                if(battery.hasOwnProperty("capacity")) $("#carbon_battery_capacity").val(`${battery.capacity} Wh`);
                if(battery.hasOwnProperty("strings" )) $("#carbon_battery_strings ").val(battery.strings).trigger("change");
                if(battery.hasOwnProperty("model"   )) $("#carbon_battery_model   ").val(battery.model  ).trigger("change");
            }
            // Other
            else if(battery.type == 9) {
                $("#bx_battery_type_9").prop("checked", true).trigger("change");
                $("#bx_system_type_w ").prop("checked", true).trigger("change");
                if(battery.hasOwnProperty("capacity")) $("#other_battery_capacity").val(battery.capacity);
            }
        }
        // No Batteries
        else {
            if(boxType == "livex") { 
                $("#bx_battery_type_9").prop("checked", true).trigger("change");
                $("#bx_system_type_w ").prop("checked", true).trigger("change");
                $("#other_battery_capacity").val(0);
            } else {
                $("#bx_battery_type_n").prop("checked", true).trigger("change");
            }
        }
    }

    // Disable CO System Radio
    $("#system_co_old").prop("checked", true).trigger("change");
    $("#system_co_new, #system_co_old").prop("disabled", true);

    isAlreadyRegistered = true;

}










/*
    Helper Functions
*/

function showSystemSettings(response) {

    // E.Meter Injection Regulation
    if(response.hasOwnProperty("InjectionMode")) {
        var temp = response["InjectionMode"];
        $("#regulation_check").prop("checked", temp["0"]["v5"] != "0");
    }

    // ExtSol Energy Meter
    if(response.hasOwnProperty("ModbusExtSolarDevice")) {
        var temp = response["ModbusExtSolarDevice"];
        $("#extsol_check").prop("checked", temp["0"]["mode"] != "0");
    }

    // User Meters
    if(response.hasOwnProperty("UserMeter")) {
        var temp = response["UserMeter"];
        if(temp.hasOwnProperty("1")) {
            $("#meter1_mode ").val(temp["1"]["mode"]);
            $("#meter1_label").val(temp["1"]["s1"  ]);
        }
        if(temp.hasOwnProperty("2")) {
            $("#meter2_mode ").val(temp["2"]["mode"]);
            $("#meter2_label").val(temp["2"]["s1"  ]);
        }
        if(temp.hasOwnProperty("3")) {
            $("#meter3_mode ").val(temp["3"]["mode"]);
            $("#meter3_label").val(temp["3"]["s1"  ]);
        }
        if(temp.hasOwnProperty("4")) {
            $("#meter4_mode ").val(temp["4"]["mode"]);
            $("#meter4_label").val(temp["4"]["s1"  ]);
        }
    }

    // Control Power
    if(response.hasOwnProperty("ControlMaxChargingPowerAC")) {
        var temp = response["ControlMaxChargingPowerAC"];
        $("#controlMaxChargingPowerAC_check").prop("checked", temp["0"]["mode"] != "0");
    }
    if(response.hasOwnProperty("ControlMaxInjectionPower")) {
        var temp = response["ControlMaxInjectionPower"];
        $("#controlMaxInjectionPower_check").prop("checked", temp["0"]["mode"] != "0");
    }

    // Inverter Parameters
    if(response.hasOwnProperty("Inverter")) {
        var temp = response["Inverter"];
        // Battery Parameters
        if(temp.hasOwnProperty("417")) $("#other_battery_maxChargingCurrent      ").val(parseInt(temp["417"].s1) / 100);
        if(temp.hasOwnProperty("418")) $("#other_battery_maxDischargingCurrent   ").val(parseInt(temp["418"].s1) / 100);
        if(temp.hasOwnProperty("415")) $("#other_battery_bulkChargingVoltage     ").val(parseInt(temp["415"].s1) / 100);
        if(temp.hasOwnProperty("416")) $("#other_battery_floatChargingVoltage    ").val(parseInt(temp["416"].s1) / 100);
        if(temp.hasOwnProperty("411")) $("#other_battery_cutoffVoltageHybrid     ").val(parseInt(temp["411"].s1) / 100);
        if(temp.hasOwnProperty("413")) $("#other_battery_redischargeVoltageHybrid").val(parseInt(temp["413"].s1) / 100);
        if(temp.hasOwnProperty("412")) $("#other_battery_cutoffVoltage           ").val(parseInt(temp["412"].s1) / 100);
        if(temp.hasOwnProperty("414")) $("#other_battery_redischargeVoltage      ").val(parseInt(temp["414"].s1) / 100);
        // Extended Parameters
        if(temp.hasOwnProperty("342")) $("#extended_lfsmoThreshold").val(temp["342"].s1);
        if(temp.hasOwnProperty("349")) $("#extended_lfsmoDroop    ").val(temp["349"].s1);
        if(temp.hasOwnProperty("350")) $("#extended_lfsmoSlope    ").val(parseInt(temp["350"].s1) / 100);
        // Extended Parameters TOR
        if(isTor && isAlreadyRegistered) {
            if(temp.hasOwnProperty("212")) $("#extended_maxGridVoltage    ").val(parseInt(temp["212"].s1) / 100);
            if(temp.hasOwnProperty("211")) $("#extended_minGridVoltage    ").val(parseInt(temp["211"].s1) / 100);
            if(temp.hasOwnProperty("214")) $("#extended_maxGridFrequency  ").val(parseInt(temp["214"].s1) / 100);
            if(temp.hasOwnProperty("213")) $("#extended_minGridFrequency  ").val(parseInt(temp["213"].s1) / 100);
            if(temp.hasOwnProperty("232")) $("#extended_UeffOver1         ").val(parseInt(temp["232"].s1) / 100);
            if(temp.hasOwnProperty("231")) $("#extended_UeffUnder1        ").val(parseInt(temp["231"].s1) / 100);
            if(temp.hasOwnProperty("240")) $("#extended_UeffOver2         ").val(parseInt(temp["240"].s1) / 100);
            if(temp.hasOwnProperty("239")) $("#extended_UeffUnder2        ").val(parseInt(temp["239"].s1) / 100);
            if(temp.hasOwnProperty("234")) $("#extended_fOver1            ").val(parseInt(temp["234"].s1) / 100);
            if(temp.hasOwnProperty("233")) $("#extended_fUnder1           ").val(parseInt(temp["233"].s1) / 100);
            if(temp.hasOwnProperty("236")) $("#extended_UeffOver1Time     ").val(parseInt(temp["236"].s1) / 1000);
            if(temp.hasOwnProperty("235")) $("#extended_UeffUnder1Time    ").val(parseInt(temp["235"].s1) / 1000);
            if(temp.hasOwnProperty("244")) $("#extended_UeffOver2Time     ").val(parseInt(temp["244"].s1) / 1000);
            if(temp.hasOwnProperty("243")) $("#extended_UeffUnder2Time    ").val(parseInt(temp["243"].s1) / 1000);
            if(temp.hasOwnProperty("238")) $("#extended_fOver1Time        ").val(parseInt(temp["238"].s1) / 1000);
            if(temp.hasOwnProperty("237")) $("#extended_fUnder1Time       ").val(parseInt(temp["237"].s1) / 1000);
            if(temp.hasOwnProperty("205")) $("#extended_Ueff              ").val(parseInt(temp["205"].s1) / 100);
            if(temp.hasOwnProperty("215")) $("#extended_gridConnectDelay  ").val(parseInt(temp["215"].s1));
            if(temp.hasOwnProperty("225")) $("#extended_gridReconnectDelay").val(parseInt(temp["225"].s1));
            if(temp.hasOwnProperty("336")) $("#extended_puTime            ").val(parseInt(temp["336"].s1) / 1000);
        }
    }
    
    // E.Meter Phase Connection (batterX h5)
    if(response.hasOwnProperty("InjectionMode")) {
        var temp = response["InjectionMode"];
        if(temp["0"]["v6"] !== 0) $("#bx_emeter_phase").val(temp["0"]["v6"]);
    }

    // System Mode (cliX 2.0)
    if(isClixV2) {
        if(response.hasOwnProperty("SystemMode")) {
            var temp = response["SystemMode"];
            $("#bx_sysmode").val(temp["0"]["mode"]);
        }
    }

}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Show|Hide Import Data From Cloud Button
*/

$("#bx_system, #system_co_sn").on("change", () => showImportDataFromCloud());

async function showImportDataFromCloud() {

    $("#bxHome").removeClass("can-import-cloud-data");

    if(boxType == "livex" && isLiFePO() && $("#bx_system").val().trim() == "") return; 
    else if(isOldSys() && $("#system_co_sn").val().trim() == "") return;

    if(Object.keys(dataSettings).length == 0) return;
    if(!dataSettings.hasOwnProperty("CloudSet")) return;
    if(!dataSettings["CloudSet"].hasOwnProperty("0")) return;
    if(!dataSettings["CloudSet"]["0"].hasOwnProperty("mode")) return;

    try {
        const json = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action : "get_system_data",
                system : boxType == "livex" && isLiFePO() ? $("#bx_system").val().trim() : $("#system_co_sn").val().trim(), 
                customer : customerEmail.trim().toLowerCase()
            }
        });
        
        console.log(json);
        if(boxType == "livex") { 
            if((isCarbon() || isOther()) && isOldSys() && !json) {
                alert(lang.system_setup.msg_system_with_sn_does_not_exist.replace("123", $("#system_co_sn").val().trim()));
                $("#system_co_sn").val("");
            }
        } else {
            if(isOldSys() && !json) {
                alert(lang.system_setup.msg_system_with_sn_does_not_exist.replace("123", $("#system_co_sn").val().trim()));
                $("#system_co_sn").val("");
            }
        }
        if(!json) return;
        if(!json.hasOwnProperty("info")) return;
        // Decide when to show import button
        var hasBox = json.info.hasOwnProperty("box") && json.info.box.hasOwnProperty("serialnumber") && json.info.box.serialnumber != null && json.info.box.serialnumber != "";
        var isSameBox = hasBox && $("#bx_box").val().trim() == json.info.box.serialnumber;
        if(!hasBox || !isSameBox || dataSettings["CloudSet"]["0"]["mode"].toString() == "0") {
            if(!canShowImportCloudData) return;
            importedData = json;
            $("#bxHome").addClass("can-import-cloud-data");
        }
        
    } catch (error) {
        alert("E004. Please refresh the page! (Error while reading system data from cloud)");
    }

}










/*
    Show Imported Data From Cloud
*/

$("#btnImportDataFromCloud").on("click", () => {
    importSystemInfo();
    importSystemSettings();
    $("#bxHome").removeClass("can-import-cloud-data");
    canShowImportCloudData = false;
});










/*
    Show Imported Data From Cloud
*/

function importSystemInfo() {
    if(!importedData.hasOwnProperty("info")) return;
    showSystemInfo(importedData.info);
}










/*
    Log All Imported Settings to Database
*/

async function importSystemSettings() {

    if(!importedData.hasOwnProperty("settings")) return;

    var response = importedData.settings;

    /*
        SETTINGS LOADED BELOW
        - ModbusExtSolarDevice 0
        - UserMeter 1
        - UserMeter 2
        - UserMeter 3
        - UserMeter 4
        - PrepareBatteryExtension 0
    */

    showSystemSettings(response);

    /*
        SETTINGS STORED DIRECTLY IN DATABASE
        - BxOutPin 1
        - BxOutPin 2
        - BxOutPin 3
        - BxOutPin 4
        - SystemMode 0
        - GridInjection 0
        - BatteryCharging 0
        - BatteryChargingAC 0
        - BatteryDischarging 0
        - BatteryDischargingAC 0
        - IgnoreWarnings 0
        - BatteryMinSoC 0
        - InjectionMode 0
        - DynamicTariff 0
        - DynamicTariffEntsoe 0
        - DynamicTariffTibber 0
        - ForecastSolar 0
        - ForecastSolar 1
        - ForecastSolar 2
        - ForecastSolar 3
        - SystemLocation 0
    */

    const settings = [
        { varName: "BxOutPin", entity: "1" },
        { varName: "BxOutPin", entity: "2" },
        { varName: "BxOutPin", entity: "3" },
        { varName: "BxOutPin", entity: "4" },
        { varName: "SystemMode", entity: "0" },
        { varName: "GridInjection", entity: "0" },
        { varName: "BatteryCharging", entity: "0" },
        { varName: "BatteryChargingAC", entity: "0" },
        { varName: "BatteryDischarging", entity: "0" },
        { varName: "BatteryDischargingAC", entity: "0" },
        { varName: "IgnoreWarnings", entity: "0" },
        { varName: "BatteryMinSoC", entity: "0" },
        { varName: "InjectionMode", entity: "0" },
        { varName: "DynamicTariff", entity: "0" },
        { varName: "DynamicTariffEntsoe", entity: "0" },
        { varName: "DynamicTariffTibber", entity: "0" },
        { varName: "ForecastSolar", entity: "0" },
        { varName: "ForecastSolar", entity: "1" },
        { varName: "ForecastSolar", entity: "2" },
        { varName: "ForecastSolar", entity: "3" },
        { varName: "SystemLocation", entity: "0" }
    ];

    const totalSteps = settings.length;

    try {
        for(let currentStep = 0; currentStep < settings.length; currentStep++) {
            const { varName, entity } = settings[currentStep];
            const temp = response.hasOwnProperty(varName) && response[varName].hasOwnProperty(entity) ? response[varName][entity] : false;
            const jsonArr = temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name];
            
            await importSystemSettings_applySetting(totalSteps, currentStep + 1, varName, entity, jsonArr);
        }
        
        // SHOW SUCCESS
        alert("Data imported successfully!");
        $("#importingDataFromCloud").modal("hide");
        
    } catch (error) {
        alert("Error while importing settings: " + error.message);
        $("#importingDataFromCloud").modal("hide");
    }

}

async function importSystemSettings_applySetting(totalSteps, currentStep, varName, entity, jsonArr) {
    $("#importingDataFromCloud_step").html(`<b>${currentStep} / ${totalSteps}</b>`);
    $("#importingDataFromCloud").modal("show");
    
    if(jsonArr.length == 0) return;
    
    // Check if cloud and local setting are already the same
    if(dataSettings.hasOwnProperty(varName) && dataSettings[varName].hasOwnProperty(entity)) {
        var allAreEqual = true;
        if(jsonArr.length > 0 && dataSettings[varName][entity].mode != jsonArr[0]) allAreEqual = false;
        if(jsonArr.length > 1 && dataSettings[varName][entity].v1   != jsonArr[1]) allAreEqual = false;
        if(jsonArr.length > 2 && dataSettings[varName][entity].v2   != jsonArr[2]) allAreEqual = false;
        if(jsonArr.length > 3 && dataSettings[varName][entity].v3   != jsonArr[3]) allAreEqual = false;
        if(jsonArr.length > 4 && dataSettings[varName][entity].v4   != jsonArr[4]) allAreEqual = false;
        if(jsonArr.length > 5 && dataSettings[varName][entity].v5   != jsonArr[5]) allAreEqual = false;
        if(jsonArr.length > 6 && dataSettings[varName][entity].v6   != jsonArr[6]) allAreEqual = false;
        if(jsonArr.length > 7 && dataSettings[varName][entity].s1   != jsonArr[7]) allAreEqual = false;
        if(jsonArr.length > 8 && dataSettings[varName][entity].s2   != jsonArr[8]) allAreEqual = false;
        if(jsonArr.length > 9 && dataSettings[varName][entity].name != jsonArr[9]) allAreEqual = false;
        
        if(allAreEqual) {
            await sleep(250);
            return;
        }
    }

    // Keep trying to set and verify the setting until it's applied correctly
    while(true) {
        try {
            // Update setting in database
            const setResponse = await $.get({
                url: `api.php?set=command&type=11&entity=0&text1=${entity} ${varName}&text2=${encodeURIComponent(JSON.stringify(jsonArr))}`
            });
            
            if(setResponse != "1") {
                alert("Error while writing the settings, please refresh the page! (E002)");
                return;
            }
            
            // Wait 5 seconds before checking
            await sleep(5000);
            
            // Check if setting was applied correctly
            const getResponse = await $.get({
                url: "api.php?get=settings"
            });
            
            console.log(getResponse);
            
            if(!getResponse || typeof getResponse != "object") {
                // Bad response, wait and try the whole process again
                await sleep(5000);
                continue;
            }
            
            dataSettings = JSON.parse(JSON.stringify(getResponse));

            if(!getResponse.hasOwnProperty(varName) || !getResponse[varName].hasOwnProperty(entity)) {
                alert("Error while writing the settings, please refresh the page! (E003) " + varName + " " + entity);
                return;
            }

            // Check if all values match
            let allMatch = true;
            if(jsonArr.length > 0 && getResponse[varName][entity].mode != jsonArr[0]) allMatch = false;
            if(jsonArr.length > 1 && getResponse[varName][entity].v1   != jsonArr[1]) allMatch = false;
            if(jsonArr.length > 2 && getResponse[varName][entity].v2   != jsonArr[2]) allMatch = false;
            if(jsonArr.length > 3 && getResponse[varName][entity].v3   != jsonArr[3]) allMatch = false;
            if(jsonArr.length > 4 && getResponse[varName][entity].v4   != jsonArr[4]) allMatch = false;
            if(jsonArr.length > 5 && getResponse[varName][entity].v5   != jsonArr[5]) allMatch = false;
            if(jsonArr.length > 6 && getResponse[varName][entity].v6   != jsonArr[6]) allMatch = false;
            if(jsonArr.length > 7 && getResponse[varName][entity].s1   != jsonArr[7]) allMatch = false;
            if(jsonArr.length > 8 && getResponse[varName][entity].s2   != jsonArr[8]) allMatch = false;
            if(jsonArr.length > 9 && getResponse[varName][entity].name != jsonArr[9]) allMatch = false;

            if(allMatch) {
                return; // Success - setting is applied correctly
            }
            
            // Setting not applied correctly, wait 5 seconds and retry the whole process
            await sleep(5000);
            
        } catch (error) {
            // Error occurred, wait and retry
            await sleep(5000);
        }
    }
}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    CO System Radio OnChange Listener
*/

$("input[name=system_co_radio]").on("change", function() {
    if(this.value == "old")
        $("#system_co_sn").show();
    else
        $("#system_co_sn").hide();
});










/*
    Battery Type OnChange Listener
*/

$("input[name=bx_battery_type]").on("change", function() {

    // Show Correct Battery Section
    $(`#battery_section_0, #battery_section_1, #battery_section_9, #battery_section_n`).hide();
    if(this.value == "") $("#battery_section_n").show();
    else $(`#battery_section_${this.value}`).show();

    // Show|Hide Options
    if(boxType == "livex") {
        if(this.value == "0") {
            // LiFePO
            $("#system_type, #system_mode").show();
            $("#system_co_box").hide();
            $("#bx_system").val(systemSerial).trigger("change");
            $(`#bx_system_type_${systemType}`).prop("checked", true);
        } else {
            // Carbon|Other
            $("#system_type, #system_mode").hide();
            $("#system_co_box").show();
            $("#bx_system").val(systemSerial).trigger("change");
            $("#bx_system_type_w").prop("checked", true);
            $("#bx_sysmode").val("0");
        }
    } else {
        $("#system_co_sn").val(systemSerial).trigger("change");
    }

});










/*
    Carbon Batteries|Strings OnChange Listener
*/

$("#carbon_battery_model, #carbon_battery_strings").on("change", function() {

    var batteryModel    = $("#carbon_battery_model").val();
    var batteryStrings  = $("#carbon_battery_strings").val();
    var batteryCapacity = 0;

         if(batteryModel == "LC+700"  ) batteryCapacity = 4 * 700 * parseInt(batteryStrings);
    else if(batteryModel == "LC+1300" ) batteryCapacity = 4 * 1300 * parseInt(batteryStrings);
    else if(batteryModel == "LC+2V500") batteryCapacity = 24 * 2 * 500 * parseInt(batteryStrings);

    $("#carbon_battery_capacity").val(`${batteryCapacity} Wh`);

});










/*
    Reactive Mode OnChange|OnInput Listeners
*/

$("#reactive_mode").on("change", function() {
    $(`#reactive_mode1, #reactive_mode2, #reactive_mode3, #reactive_mode4`).addClass("d-none");
    $(`#reactive_mode${this.value}`).removeClass("d-none");
});

$("#reactive_mode1_kink").on("change", function() {
    $("#svg_reactive_mode1 #svg_reactive_mode1_kink_value").text(parseInt($("#reactive_mode1_kink").val()) / 100);
});

$("#reactive_mode3_v1, #reactive_mode3_v2, #reactive_mode3_v3, #reactive_mode3_v4").on("change input", function() {
    $("#svg_reactive_mode3 #svg_reactive_mode3_v1_value").text(($("#reactive_mode3_v1").val() == "" ? $("#reactive_mode3_v1").attr("placeholder") : $("#reactive_mode3_v1").val()) + "%");
    $("#svg_reactive_mode3 #svg_reactive_mode3_v2_value").text(($("#reactive_mode3_v2").val() == "" ? $("#reactive_mode3_v2").attr("placeholder") : $("#reactive_mode3_v2").val()) + "%");
    $("#svg_reactive_mode3 #svg_reactive_mode3_v3_value").text(($("#reactive_mode3_v3").val() == "" ? $("#reactive_mode3_v3").attr("placeholder") : $("#reactive_mode3_v3").val()) + "%");
    $("#svg_reactive_mode3 #svg_reactive_mode3_v4_value").text(($("#reactive_mode3_v4").val() == "" ? $("#reactive_mode3_v4").attr("placeholder") : $("#reactive_mode3_v4").val()) + "%");
});

$("#reactive_mode, #reactive_mode1_kink, #reactive_mode3_v1, #reactive_mode3_v2, #reactive_mode3_v3, #reactive_mode3_v4").trigger("change");










/*
    TOR Extended Parameters Validation - Clamp values to min/max limits and step increments
*/

$(".tor-extended-param").on("change", function() {
    const $field = $(this);
    const value = parseFloat($field.val());
    const min = parseFloat($field.attr("min"));
    const max = parseFloat($field.attr("max"));
    const step = parseFloat($field.attr("step"));
    
    if(!isNaN(value) && !isNaN(min) && !isNaN(max) && !isNaN(step)) {
        let clampedValue = value;
        
        // First clamp to min/max range
        if(value < min) {
            clampedValue = min;
        } else if(value > max) {
            clampedValue = max;
        }
        
        // Then clamp to nearest step increment
        if(step > 0) {
            const stepsFromMin = Math.round((clampedValue - min) / step);
            clampedValue = min + (stepsFromMin * step);
            
            // Ensure we didn't go out of bounds after step adjustment
            if(clampedValue > max) {
                clampedValue = max;
            } else if(clampedValue < min) {
                clampedValue = min;
            }
        }
        
        if(clampedValue !== value) {
            $field.val(clampedValue.toFixed(3).replace(/\.?0+$/, ''));
        }
    }
});










/*
    Activate Submit Button
*/

setInterval(() => {

    // Return If Empty Fields
    if(!allFieldsCorrect()) return disableBtnNext();

    // Enable|Disable Button Next
    $("#btn_next").attr("disabled", isSettingParameters);

}, 1000);










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Begin Process
*/

step1();










/*
    Check If Apikey Correct
*/

function step1() {

    if(!apikey || apikey.length != 40) return alert("E003. Please refresh the page! (Missing or malformed apikey)");

    step2();

}










/*
    Get Installation Info
*/

async function step2() {

    try {
        const json = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action : "get_installation_info",
                apikey : systemApikey
            }
        });

        console.log(json);

        if(!json) { 
            step3(); 
            return; 
        }

        showSystemInfo(json);

        step3();

    } catch (error) {
        alert("E004. Please refresh the page! (Error while reading installation info from cloud)");
    }

}










/*
    Set LiveX Serial-Number
*/

async function step3() {

    try {
        const box_info = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action : "get_box_info",
                apikey : systemApikey
            }
        });

        console.log(box_info);

        if(!box_info) {
            $("#errorBoxNotRegistered").modal("show");
            return;
        }

        // Check If cliX v2
        let clix_info = null;
        if(PNS_BOX.hasOwnProperty(box_info.partnumber) && PNS_BOX[box_info.partnumber].type == "xc")
            clix_info = PNS_BOX[box_info.partnumber];
        isClixV2 = clix_info && clix_info.version > 1;
        if(!isClixV2) $("#bx_sysmode option[value=1]").remove();

        // Enable|Disable Battery Type Selection
        if(boxType == "livex") {
            if(clix_info) {
                // Only LiFePO|None
            } else {
                // Only Carbon|Other
                $("#bx_battery_type_1").prop("checked", true).trigger("change");
                $("#bx_battery_type_0").attr("disabled", true); // disable lifepo
            }
        } else {
            // Do nothing
        }

        // Save LiveX Serial-Number & Part-Number to Session
        try {
            const sessionResponse = await $.post({
                url: "cmd/session.php",
                data: {
                    box_serial: box_info.serialnumber,
                    box_partnumber: box_info.partnumber
                }
            });
            
            console.log(sessionResponse);
            if(sessionResponse !== "1") {
                alert("E007. Please refresh the page! (Bad response while saving data to session)");
                return;
            }
            
            $("#bx_box").val(box_info.serialnumber);
            step4();
            
        } catch (sessionError) {
            alert("E006. Please refresh the page! (Error while saving data to session)");
        }

    } catch (error) {
        alert("E005. Please refresh the page! (Error while reading LiveX info from cloud)");
    }

}










/*
    Set Inverter Serial-Number
*/

async function step4() {

    try {
        const response = await $.get({
            url: "api.php?get=settings"
        });

        console.log(response);

        if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter") || !response["Inverter"].hasOwnProperty("1") || !response["Inverter"].hasOwnProperty("2")) {
            alert("E009. Please refresh the page! (Missing or malformed data in local settings table)");
            return;
        }

        dataSettings = JSON.parse(JSON.stringify(response));

        var device_serial_number = response["Inverter"]["2"]["s1"];

        switch(response["Inverter"]["1"]["s1"]) {
            case "10001": devicePower =  5000; break;
            case "10002": devicePower = 10000; break;
            case "11001": devicePower =  4000; break;
            case "11002": devicePower =  5000; break;
            case "11003": devicePower =  6000; break;
            case "11004": devicePower =  8000; break;
            case "11005": devicePower = 10000; break;
            case "11006": devicePower = 12000; break;
            case "11011": devicePower = 10000; break;
            case "11012": devicePower = 12000; break;
            case "11013": devicePower = 15000; break;
            case "11014": devicePower = 20000; break;
            case "11021": devicePower = 25000; break;
            case "11022": devicePower = 30000; break;
            case "11023": devicePower = 36000; break;
            case "11024": devicePower = 40000; break;
            case "11025": devicePower = 50000; break;
            default: break;
        }

        try {
            const partNumberResponse = await $.post({
                url: "https://api.batterx.app/v2/install.php",
                data: {
                    action       : "get_device_partnumber",
                    serialnumber : device_serial_number
                }
            });
            
            console.log(partNumberResponse);

            devicePartNumber = partNumberResponse;

            if(!devicePartNumber) {
                alert("Error! Device partnumber cannot be empty!");
                return;
            }

            deviceModel = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].type : "";

            // Save Device Serialnumber & Partnumber to Session
            try {
                const sessionResponse = await $.post({
                    url: "cmd/session.php",
                    data: {
                        device_serial: device_serial_number,
                        device_partnumber: devicePartNumber
                    }
                });
                
                console.log(sessionResponse);
                if(sessionResponse !== "1") {
                    alert("E011. Please refresh the page! (Bad response while saving data to session)");
                    return;
                }
                
                $("#bx_device").val(device_serial_number);
                step5();
                
            } catch (sessionError) {
                alert("E010. Please refresh the page! (Error while saving data to session)");
            }

        } catch (partNumberError) {
            alert("Error. Please refresh the page!");
        }

    } catch (error) {
        alert("E008. Please refresh the page! (Error while reading local settings table)");
    }

}










/*
    Load Other Parameters From Settings Table
*/

async function step5() {
    
    try {
        const response = await $.get({
            url: "api.php?get=settings"
        });
        
        console.log(response);
        
        if(!response || typeof response != "object") {
            alert("E013. Please refresh the page! (Missing or malformed data in local settings table)");
            return;
        }

        dataSettings = JSON.parse(JSON.stringify(response));

        showSystemSettings(response);

        // Show|Hide Import Data From Cloud Button
        showImportDataFromCloud();

    } catch (error) {
        alert("E012. Please refresh the page! (Error while reading local settings table)");
    }

}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Main Form On-Submit
*/

$("#mainForm").on("submit", (e) => {
    e.preventDefault();
    mainFormSubmit();
});

function mainFormSubmit() {
    if(isTor) {
        // Validate all TOR extended parameter values before submission
        $(".tor-extended-param").trigger("change");
        // Update the confirm extended parameters modal
        $("#confirmExtended_maxGridVoltage"    ).val($("#extended_maxGridVoltage"    ).val());
        $("#confirmExtended_minGridVoltage"    ).val($("#extended_minGridVoltage"    ).val());
        $("#confirmExtended_maxGridFrequency"  ).val($("#extended_maxGridFrequency"  ).val());
        $("#confirmExtended_minGridFrequency"  ).val($("#extended_minGridFrequency"  ).val());
        $("#confirmExtended_UeffOver1"         ).val($("#extended_UeffOver1"         ).val());
        $("#confirmExtended_UeffUnder1"        ).val($("#extended_UeffUnder1"        ).val());
        $("#confirmExtended_UeffOver2"         ).val($("#extended_UeffOver2"         ).val());
        $("#confirmExtended_UeffUnder2"        ).val($("#extended_UeffUnder2"        ).val());
        $("#confirmExtended_fOver1"            ).val($("#extended_fOver1"            ).val());
        $("#confirmExtended_fUnder1"           ).val($("#extended_fUnder1"           ).val());
        $("#confirmExtended_UeffOver1Time"     ).val($("#extended_UeffOver1Time"     ).val());
        $("#confirmExtended_UeffUnder1Time"    ).val($("#extended_UeffUnder1Time"    ).val());
        $("#confirmExtended_UeffOver2Time"     ).val($("#extended_UeffOver2Time"     ).val());
        $("#confirmExtended_UeffUnder2Time"    ).val($("#extended_UeffUnder2Time"    ).val());
        $("#confirmExtended_fOver1Time"        ).val($("#extended_fOver1Time"        ).val());
        $("#confirmExtended_fUnder1Time"       ).val($("#extended_fUnder1Time"       ).val());
        $("#confirmExtended_Ueff"              ).val($("#extended_Ueff"              ).val());
        $("#confirmExtended_gridConnectDelay"  ).val($("#extended_gridConnectDelay"  ).val());
        $("#confirmExtended_gridReconnectDelay").val($("#extended_gridReconnectDelay").val());
        $("#confirmExtended_puTime"            ).val($("#extended_puTime"            ).val());
        $("#modalConfirmExtendedParameters").modal("show");
        $("#modalConfirmExtendedParameters button.confirm").unbind().on("click", () => {
            $("#modalConfirmExtendedParameters").modal("hide");
            mainFormSubmit_2();
        });
        $("#modalConfirmExtendedParameters button.modify").unbind().on("click", () => {
            $("#modalConfirmExtendedParameters").modal("hide");
            $("#modalExtendedParameters").modal("show");
        });
    } else {
        mainFormSubmit_2();
    }
}

function mainFormSubmit_2() {
    if(boxType == "livex") {
        if(isOther() && $("#other_battery_capacity").val() != "0") {
            $("#modalConfirmOtherBatteries").modal("show");
            $("#modalConfirmOtherBatteries button").unbind().on("click", () => {
                $("#modalConfirmOtherBatteries").modal("hide");
                mainFormSubmit_3();
            });
        } else {
            mainFormSubmit_3();
        }
    } else {
        mainFormSubmit_3();
    }
}

function mainFormSubmit_3() {
    if(boxType == "livex") {
        if(isClixV2 && isUPS()) {
            $("#modalConfirmUpsMode").modal("show");
            $("#modalConfirmUpsMode button").unbind().on("click", () => {
                $("#modalConfirmUpsMode").modal("hide");
                mainFormSubmit_4();
            });
        } else if(isClixV2 && isBackup()) {
            $("#modalConfirmBackupMode").modal("show");
            $("#modalConfirmBackupMode button").unbind().on("click", () => {
                $("#modalConfirmBackupMode").modal("hide");
                mainFormSubmit_4();
            });
        } else {
            mainFormSubmit_4();
        }
    } else {
        mainFormSubmit_4();
    }
}

function mainFormSubmit_4() {
    if($("#regulation_check").is(":checked") && parseInt($("#solar_feedinlimitation").val()) < 100) {
        $("#modalConfirmInternalSolar .message").html(lang.system_setup.internalsolarconfirm_message.replace("30%", `<b>${Math.round(100 - parseInt($("#solar_feedinlimitation").val()))}%</b>`));
        $("#modalConfirmInternalSolar").modal("show");
        $("#modalConfirmInternalSolar button").unbind().on("click", () => {
            $("#modalConfirmInternalSolar").modal("hide");
            mainFormSubmit_5();
        });
    } else {
        mainFormSubmit_5();
    }
}










/*
    Check All Fields
*/

async function mainFormSubmit_5() {

    // Return If Empty Fields
    if(!allFieldsCorrect()) return;

    // Confirm Solar Watt Peak (if under 1000Wp)
    if(parseInt($("#solar_wattpeak").val()) < 1000) {
        var tempFlag = confirm(`${lang.system_setup.msg_solar_size_very_low}\n\n${lang.system_setup.msg_solar_size_very_low_confirm.replace("100", $("#solar_wattpeak").val())}\n`);
        if(!tempFlag) return $("#solar_wattpeak").val("");
    }

    // Check System S/N (For LiFePO)
    if(boxType == "livex" && isLiFePO() && !isAlreadyRegistered && $("#bx_system").val().length != 14)
        return $("#errorSystemSerialNotCorrect").modal("show");

    // Verify System S/N
    if(!await verifySystem()) return;
    
    // Verify Battery Modules
    if(isLiFePO() && !await verifyModulesLiFePO()) return;

    // Check Inverter S/N
    try {
        const response = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action       : "verify_device",
                serialnumber : $("#bx_device").val(),
                system       : boxType == "livex" && isLiFePO() ? $("#bx_system").val().trim() : (isOldSys() ? $("#system_co_sn").val().trim() : "NEW") 
            }
        });
        
        console.log(response);
        if(response !== "1") return $("#errorInverterRegisteredWithOtherSystem").modal("show");
        mainFormSubmit_6();
    } catch (error) {
        alert("E014. Please refresh the page! (Error while verifying device serialnumber in cloud)");
    }

}










/*
    Start Setup
*/

function mainFormSubmit_6() {





    // Disable All Fields

    $(` #bx_system,
        #bx_system_type_r,
        #bx_system_type_w,
        #bx_device,
        #bx_box,
        #bx_sysmode,
        #btnInstallerMemo,
        #installer_memo,
        
        #solar_wattpeak,
        #solar_wideinputrange,
        #solar_feedinlimitation,
        #solar_info,
        #bx_emeter_phase,

        #bx_battery_type_0,
        #lifepo_bms,
        #lifepo_serialnumbers,

        #bx_battery_type_1,
        #carbon_battery_model,
        #carbon_battery_strings,
        #carbon_battery_capacity,
        
        #bx_battery_type_9,
        #other_battery_capacity,
        #other_battery_maxChargingCurrent,
        #other_battery_maxDischargingCurrent,
        #other_battery_bulkChargingVoltage,
        #other_battery_floatChargingVoltage,
        #other_battery_cutoffVoltageHybrid,
        #other_battery_redischargeVoltageHybrid,
        #other_battery_cutoffVoltage,
        #other_battery_redischargeVoltage,

        #bx_battery_type_n,

        #reactive_mode,
        #reactive_mode1_kink,
        #reactive_mode2_cosphi,
        #reactive_mode2_cosphi_sign,
        #reactive_mode3_qmaxsn,
        #reactive_mode3_v1,
        #reactive_mode3_v2,
        #reactive_mode3_v3,
        #reactive_mode3_v4,
        #reactive_mode3_qutime,
        #reactive_mode4_qfix,

        #btnExtendedParameters,
        #extended_lfsmoThreshold,
        #extended_lfsmoDroop,
        #extended_lfsmoSlope,
        #extended_maxGridVoltage,
        #extended_minGridVoltage,
        #extended_maxGridFrequency,
        #extended_minGridFrequency,
        #extended_UeffOver1,
        #extended_UeffUnder1,
        #extended_UeffOver2,
        #extended_UeffUnder2,
        #extended_fOver1,
        #extended_fUnder1,
        #extended_UeffOver1Time,
        #extended_UeffUnder1Time,
        #extended_UeffOver2Time,
        #extended_UeffUnder2Time,
        #extended_fOver1Time,
        #extended_fUnder1Time,
        #extended_Ueff,
        #extended_gridConnectDelay,
        #extended_gridReconnectDelay,
        #extended_puTime,

        #regulation_check,
        #extsol_check,
        #btnUserMeters,
        #meter1_mode,
        #meter1_label,
        #meter2_mode,
        #meter2_label,
        #meter3_mode,
        #meter3_label,
        #meter4_mode,
        #meter4_label,
        
        #controlMaxChargingPowerAC_check,
        #controlMaxInjectionPower_check,

        #system_co_new,
        #system_co_old,
        #system_co_sn
    `).attr("disabled", true);





    // Show Loading Screen

    isSettingParameters = true;
    disableBtnNext();
    $(".setting-progress").removeClass("d-none");





    // Scroll to Bottom

    $("html, body").scrollTop($(document).height());





    // Set Values to Session

    setValuesToSession();





}










/*
    Set Values To Session
*/

async function setValuesToSession() {





    var tempData = {};





    // Common Parameters

    tempData.system_serial          = boxType == "livex" && isLiFePO() ? $("#bx_system").val().trim() : (isOldSys() ? $("#system_co_sn").val().trim() : "NEW");

    tempData.device_serial          = $("#bx_device             ").val().trim();
    tempData.solar_wattpeak         = $("#solar_wattpeak        ").val().trim();
    tempData.solar_feedinlimitation = $("#solar_feedinlimitation").val().trim();
    tempData.solar_info             = $("#solar_info            ").val().trim();
    tempData.note                   = $("#installer_memo        ").val().trim();
    tempData.installation_date      = $("#installation_date     ").val().trim();

    if(elementExists("#solar_wideinputrange")) tempData.solar_wideinputrange = $("#solar_wideinputrange").val().trim();
    if(elementExists("#bx_sysmode"          )) tempData.system_mode          = $("#bx_sysmode          ").val().trim();





    // Reactive Power Mode

    reactive_mode   = Math.round($("#reactive_mode").val());
    reactive_kink   = null;
    reactive_cosphi = null;
    reactive_qmaxsn = null;
    reactive_v1     = null;
    reactive_v2     = null;
    reactive_v3     = null;
    reactive_v4     = null;
    reactive_qutime = $("#reactive_mode3_qutime").val() == "" ? 5 : Math.round($("#reactive_mode3_qutime").val());
    reactive_qfix   = null;

    if(reactive_mode == "1") {
        reactive_kink = Math.round($("#reactive_mode1_kink").val());
    } else if(reactive_mode == "2") {
        reactive_cosphi = Math.round($("#reactive_mode2_cosphi").val());
        if($("#reactive_mode2_cosphi_sign").val() == "1" && reactive_cosphi != 100) reactive_cosphi = -reactive_cosphi;
    } else if(reactive_mode == "3") {
        reactive_qmaxsn = parseFloat($("#reactive_mode3_qmaxsn").val());
        reactive_v1     = $("#reactive_mode3_v1").val() == "" ? (isTor ?  92 :  93) : Math.round($("#reactive_mode3_v1").val());
        reactive_v2     = $("#reactive_mode3_v2").val() == "" ? (isTor ?  96 :  97) : Math.round($("#reactive_mode3_v2").val());
        reactive_v3     = $("#reactive_mode3_v3").val() == "" ? (isTor ? 105 : 103) : Math.round($("#reactive_mode3_v3").val());
        reactive_v4     = $("#reactive_mode3_v4").val() == "" ? (isTor ? 108 : 107) : Math.round($("#reactive_mode3_v4").val());
        reactive_qutime = $("#reactive_mode3_qutime").val() == "" ? 5 : Math.round($("#reactive_mode3_qutime").val());
        if(reactive_qutime < 3) reactive_qutime = 3;
        if(reactive_qutime > 60) reactive_qutime = 60;
    } else if(reactive_mode == "4") {
        reactive_qfix   = $("#reactive_mode4_qfix").val() == "" ? 0 : Math.round($("#reactive_mode4_qfix").val());
        if(reactive_qfix < -5000) reactive_qfix = -5000;
        if(reactive_qfix >  5000) reactive_qfix =  5000;
    }

    if(reactive_mode   != null) tempData.reactive_mode   = reactive_mode;
    if(reactive_kink   != null) tempData.reactive_kink   = reactive_kink;
    if(reactive_cosphi != null) tempData.reactive_cosphi = reactive_cosphi;
    if(reactive_qmaxsn != null) tempData.reactive_qmaxsn = reactive_qmaxsn;
    if(reactive_v1     != null) tempData.reactive_v1     = reactive_v1;
    if(reactive_v2     != null) tempData.reactive_v2     = reactive_v2;
    if(reactive_v3     != null) tempData.reactive_v3     = reactive_v3;
    if(reactive_v4     != null) tempData.reactive_v4     = reactive_v4;
    if(reactive_qutime != null) tempData.reactive_qutime = reactive_qutime;
    if(reactive_qfix   != null) tempData.reactive_qfix   = reactive_qfix;

    if(elementExists("#extended_lfsmoThreshold"    ) && $("#extended_lfsmoThreshold    ").val() != "") tempData.extended_lfsmoThreshold     = $("#extended_lfsmoThreshold    ").val();
    if(elementExists("#extended_lfsmoDroop"        ) && $("#extended_lfsmoDroop        ").val() != "") tempData.extended_lfsmoDroop         = $("#extended_lfsmoDroop        ").val();
    if(elementExists("#extended_lfsmoSlope"        ) && $("#extended_lfsmoSlope        ").val() != "") tempData.extended_lfsmoSlope         = $("#extended_lfsmoSlope        ").val();
    if(elementExists("#extended_maxGridVoltage"    ) && $("#extended_maxGridVoltage    ").val() != "") tempData.extended_maxGridVoltage     = $("#extended_maxGridVoltage    ").val();
    if(elementExists("#extended_minGridVoltage"    ) && $("#extended_minGridVoltage    ").val() != "") tempData.extended_minGridVoltage     = $("#extended_minGridVoltage    ").val();
    if(elementExists("#extended_maxGridFrequency"  ) && $("#extended_maxGridFrequency  ").val() != "") tempData.extended_maxGridFrequency   = $("#extended_maxGridFrequency  ").val();
    if(elementExists("#extended_minGridFrequency"  ) && $("#extended_minGridFrequency  ").val() != "") tempData.extended_minGridFrequency   = $("#extended_minGridFrequency  ").val();
    if(elementExists("#extended_UeffOver1"         ) && $("#extended_UeffOver1         ").val() != "") tempData.extended_UeffOver1          = $("#extended_UeffOver1         ").val();
    if(elementExists("#extended_UeffUnder1"        ) && $("#extended_UeffUnder1        ").val() != "") tempData.extended_UeffUnder1         = $("#extended_UeffUnder1        ").val();
    if(elementExists("#extended_UeffOver2"         ) && $("#extended_UeffOver2         ").val() != "") tempData.extended_UeffOver2          = $("#extended_UeffOver2         ").val();
    if(elementExists("#extended_UeffUnder2"        ) && $("#extended_UeffUnder2        ").val() != "") tempData.extended_UeffUnder2         = $("#extended_UeffUnder2        ").val();
    if(elementExists("#extended_fOver1"            ) && $("#extended_fOver1            ").val() != "") tempData.extended_fOver1             = $("#extended_fOver1            ").val();
    if(elementExists("#extended_fUnder1"           ) && $("#extended_fUnder1           ").val() != "") tempData.extended_fUnder1            = $("#extended_fUnder1           ").val();
    if(elementExists("#extended_UeffOver1Time"     ) && $("#extended_UeffOver1Time     ").val() != "") tempData.extended_UeffOver1Time      = $("#extended_UeffOver1Time     ").val();
    if(elementExists("#extended_UeffUnder1Time"    ) && $("#extended_UeffUnder1Time    ").val() != "") tempData.extended_UeffUnder1Time     = $("#extended_UeffUnder1Time    ").val();
    if(elementExists("#extended_UeffOver2Time"     ) && $("#extended_UeffOver2Time     ").val() != "") tempData.extended_UeffOver2Time      = $("#extended_UeffOver2Time     ").val();
    if(elementExists("#extended_UeffUnder2Time"    ) && $("#extended_UeffUnder2Time    ").val() != "") tempData.extended_UeffUnder2Time     = $("#extended_UeffUnder2Time    ").val();
    if(elementExists("#extended_fOver1Time"        ) && $("#extended_fOver1Time        ").val() != "") tempData.extended_fOver1Time         = $("#extended_fOver1Time        ").val();
    if(elementExists("#extended_fUnder1Time"       ) && $("#extended_fUnder1Time       ").val() != "") tempData.extended_fUnder1Time        = $("#extended_fUnder1Time       ").val();
    if(elementExists("#extended_Ueff"              ) && $("#extended_Ueff              ").val() != "") tempData.extended_Ueff               = $("#extended_Ueff              ").val();
    if(elementExists("#extended_gridConnectDelay"  ) && $("#extended_gridConnectDelay  ").val() != "") tempData.extended_gridConnectDelay   = $("#extended_gridConnectDelay  ").val();
    if(elementExists("#extended_gridReconnectDelay") && $("#extended_gridReconnectDelay").val() != "") tempData.extended_gridReconnectDelay = $("#extended_gridReconnectDelay").val();
    if(elementExists("#extended_puTime"            ) && $("#extended_puTime            ").val() != "") tempData.extended_puTime             = $("#extended_puTime            ").val();





    // Battery Parameters

    if(isLiFePO()) {
        tempData.battery_type    = "lifepo";
        tempData.battery_voltage = inverterModel >= "11000" ? "51" : "48";
        var bms       = [];
        var batteries = [];
        if(elementExists("#lifepo_bms")) {
            $("#lifepo_bms").val().trim().split("\n").forEach(sn => {
                if(sn.trim() != "") bms.push(sn.trim());
            });
            tempData.battery_bms = bms.join(",");
        }
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if(sn.trim() != "") batteries.push(sn.trim());
        });
        tempData.battery_serialnumbers = batteries.join(",");
    } else if(isCarbon()) { // only for h-Series
        tempData.battery_type     = "carbon";
        tempData.battery_voltage  = "48";
        tempData.battery_capacity = $("#carbon_battery_capacity").val().split(" ")[0];
        tempData.battery_model    = $("#carbon_battery_model   ").val();
        tempData.battery_strings  = $("#carbon_battery_strings ").val();
    } else if(isOther()) { // only for h-Series
        tempData.battery_type     = "other";
        tempData.battery_voltage  = "48";
        tempData.battery_capacity = $("#other_battery_capacity").val();
    } else {
        // no battery
    }





    // System Model

    var countModules = 0;

    if(isLiFePO()) {
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if(sn.trim() != "") countModules += 1;
        });
    }

    if(deviceModel == "batterx_h10") {
        if(isLiFePO()) {
            tempData.system_model = "batterX h10" + ($("#bx_system_type_w").is(":checked") ? "W" : "R") + "-" + (countModules * 3.5).toString().replace(".", ",");
        } else {
            tempData.system_model = "batterX h10";
        }
    } else if(deviceModel == "batterx_h5") {
        if(isLiFePO()) {
            tempData.system_model = "batterX h5" + ($("#bx_system_type_w").is(":checked") ? "W" : "R") + "-" + (countModules * 3.5).toString().replace(".", ",");
        } else {
            tempData.system_model = "batterX h5";
        }
    } else if(deviceModel == "batterx_i") {
        tempData.system_model = "batterX";
        var deviceName = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].name : "";
        var batteryCapacity = Math.round(countModules * 2.5 * 10) / 10;
        if(deviceName != "") {
            tempData.system_model = `${deviceName} basic ${batteryCapacity}kWh`
        }
    }





    // Energy Meters

    tempData.has_extsol = $("#extsol_check").is(":checked") ? "1" : "0";
    tempData.has_meter1 = $("#meter1_mode").val();
    tempData.has_meter2 = $("#meter2_mode").val();
    tempData.has_meter3 = $("#meter3_mode").val();
    tempData.has_meter4 = $("#meter4_mode").val();





    // Control Power

    tempData.control_max_charging_power_ac = $("#controlMaxChargingPowerAC_check").is(":checked") ? "1" : "0";
    tempData.control_max_injection_power = $("#controlMaxInjectionPower_check").is(":checked") ? "1" : "0";





    // Add Values To Session

    try {
        const response = await $.post({
            url: "cmd/session.php",
            data: tempData
        });
        
        console.log(response);
        if(response !== "1") return alert("E057. Please refresh the page! (Bad response while saving data to session)");
        
        // Start Setup
        checkParametersCounter = 0;
        if(skipSetup) {
            await sleep(2500);
            window.location.href = "system_test.php";
        } else {
            setup1();
        }
    } catch (error) {
        alert("E056. Please refresh the page! (Error while saving data to session)");
    }



    

}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Begin Setup
*/

async function setup1() {
    




    isSettingParameters = true;
    $("#notif").removeClass("loading error success").addClass("loading");
    $("#message").html(lang.system_setup.msg_setting_parameters).css("color", "");





    // Set Grid InjectionPhase (batterX h5)

    if(elementExists("#bx_emeter_phase")) {
        var selectedPhase = $("#bx_emeter_phase").val();
        if(selectedPhase == "1" || selectedPhase == "2" || selectedPhase == "3") {
            try {
                const response = await $.get({
                    url: "api.php?set=command&type=20736&entity=6&text2=" + selectedPhase
                });
                if(response != "1") return alert("E017. Please refresh the page! (Bad response while writing command to local database)");
                
                // Wait for parameter to be confirmed in settings
                const parameterSet = await waitForSettingsParameter("InjectionMode", "0", "v6", selectedPhase);
                if(!parameterSet) {
                    alert("E018. Timeout waiting for Grid Injection Phase parameter to be applied. Please try again.");
                    return;
                }
            } catch (error) {
                alert("E016. Please refresh the page! (Error while writing command to local database)");
                return;
            }
        }
    }





    // Set Grid MaxInjectionPower

    var maxGridFeedInPower = Math.round(Math.max(parseInt($("#solar_wattpeak").val()) * parseInt($("#solar_feedinlimitation").val()) / 100, 50)).toString();
    try {
        const response = await $.get({
            url: "api.php?set=command&type=20736&entity=1&text2=" + maxGridFeedInPower
        });
        if(response != "1") return alert("E019. Please refresh the page! (Bad response while writing command to local database)");
        
        // Wait for parameter to be confirmed in settings
        const parameterSet = await waitForSettingsParameter("InjectionMode", "0", "v1", maxGridFeedInPower);
        if(!parameterSet) {
            alert("E020. Timeout waiting for Grid Max Injection Power parameter to be applied. Please try again.");
            return;
        }
    } catch (error) {
        alert("E018. Please refresh the page! (Error while writing command to local database)");
        return;
    }

    // Set System Mode

    if(elementExists("#bx_sysmode")) {
        var newSystemMode = $("#bx_sysmode").val();
        if(!dataSettings.hasOwnProperty("SystemMode") || !dataSettings["SystemMode"].hasOwnProperty("0") || dataSettings["SystemMode"]["0"]["mode"] != newSystemMode) {
            try {
                const response = await $.get({
                    url: "api.php?set=command&type=20752&entity=0&text2=" + newSystemMode
                });
                if(response != "1") return alert("E019. Please refresh the page! (Bad response while writing command to local database)");
                
                // Wait for program to restart (SystemMode change restarts the background program)
                const programRestarted = await waitForProgramRestart();
                if(!programRestarted) {
                    alert("E021. Timeout waiting for program to restart after System Mode change. Please try again.");
                    return;
                }
                
                // Wait for parameter to be confirmed in settings
                const parameterSet = await waitForSettingsParameter("SystemMode", "0", "mode", newSystemMode);
                if(!parameterSet) {
                    alert("E022. Timeout waiting for System Mode parameter to be applied. Please try again.");
                    return;
                }
            } catch (error) {
                alert("E018. Please refresh the page! (Error while writing command to local database)");
                return;
            }
        }
    }

    // Set Wide Solar Input Range

    if(elementExists("#solar_wideinputrange")) {
        var newWideInputRange = $("#solar_wideinputrange").val();
        try {
            const response = await $.get({
                url: "api.php?set=command&type=20752&entity=4&text2=" + newWideInputRange
            });
            if(response != "1") return alert("E019. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait for parameter to be confirmed in settings
            const parameterSet = await waitForSettingsParameter("SystemMode", "0", "v4", newWideInputRange);
            if(!parameterSet) {
                alert("E022. Timeout waiting for Wide Solar Input Range parameter to be applied. Please try again.");
                return;
            }
        } catch (error) {
            alert("E018. Please refresh the page! (Error while writing command to local database)");
            return;
        }
    }





    // Next Step For Batteries That Are Not LiFePO

    if(!isLiFePO()) {
        setup2();
        return;
    }





    // Verify LiFePO Communication

    if(inverterModel >= "11000") { // i-Series
        try {
            const response = await $.get({
                url: "api.php?set=command&type=24064&entity=401&text2=2" // battery type
            });
            if(response != "1") return alert("E025. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait for battery type parameter to be confirmed in settings
            const parameterSet = await waitForSettingsParameter("Inverter", "401", "s1", "2");
            if(!parameterSet) {
                alert("E026. Timeout waiting for battery type parameter to be applied. Please try again.");
                return;
            }
            
            await sleep(10000);
            const flag = await verifyModulesCommunication();
            // Next Step For LiFePO Batteries
            if(flag) setup2();
        } catch (error) {
            alert("E024. Please refresh the page! (Error while writing command to local database)");
            return;
        }
    } else { // h-Series
        try {
            // Set battery type
            const response1 = await $.get({
                url: "api.php?set=command&type=24064&entity=401&text2=1" // battery type
            });
            if(response1 != "1") return alert("E025. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait for battery type parameter to be confirmed in settings
            const parameterSet = await waitForSettingsParameter("Inverter", "401", "s1", "1");
            if(!parameterSet) {
                alert("E027. Timeout waiting for battery type parameter to be applied. Please try again.");
                return;
            }
            
            // Store initial BMS battery connect value to restore at the end
            if(initialBmsConnectValue === null && dataSettings.hasOwnProperty("Inverter") && dataSettings["Inverter"].hasOwnProperty("10003")) {
                initialBmsConnectValue = dataSettings["Inverter"]["10003"]["s1"];
            }
            
            // Set bms battery connect
            const response2 = await $.get({
                url: "api.php?set=command&type=24064&entity=10003&text2=1" // bms battery connect
            });
            if(response2 != "1") return alert("E025. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait for bms battery connect parameter to be confirmed in settings
            const bmsParameterSet = await waitForSettingsParameter("Inverter", "10003", "s1", "1");
            if(!bmsParameterSet) {
                alert("E028. Timeout waiting for BMS battery connect parameter to be applied. Please try again.");
                return;
            }
            
            await sleep(10000);
            // Set battery voltage
            const response3 = await $.get({
                url: "api.php?set=command&type=24064&entity=416&text2=5260" // battery voltage
            });
            if(response3 != "1") return alert("E021. Please refresh the page! (Bad response while writing command to local database)");
            
            tempDatetime = "";
            const flag = await verifyModulesCommunication();
            // Next Step For LiFePO Batteries
            if(flag) setup2();
        } catch (error) {
            alert("E020. Please refresh the page! (Error while writing command to local database)");
            return;
        }
    }




    
}










/*
    Continue Setup
*/

async function setup2() {

    
    
    
    
    // Set common inverter parameters (here are set to manually, should set to auto in system_test)
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=1" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=2&text2=1" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=4&text2=1" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0" });





    newParameters = {};

    if(inverterModel == "10001" || inverterModel == "10002") { // for h5 and h10
        var maxChargingCurrent    = inverterModel == "10002" ? 20000 :  6000; // x0.01A
        var maxDischargingCurrent = inverterModel == "10002" ? 30000 : 15000; // x0.01A
        if(isLiFePO()) {
            var numberOfModules = 0;
            $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
                if(sn.trim() != "") numberOfModules += 1;
            });
            if(dataSettings.hasOwnProperty("Inverter") && dataSettings["Inverter"].hasOwnProperty("412")) {
                newParameters["battery_cutoff_voltage_ongrid"] = dataSettings["Inverter"]["412"].s1; // battery_cutoff_voltage_offgrid
            }
            newParameters["battery_recovery_voltage_ongrid"     ] = "4800";
            newParameters["battery_recovery_voltage_offgrid"    ] = "4800";
            newParameters["battery_max_discharge_current_ongrid"] = Math.min(numberOfModules * 37 * 100, maxDischargingCurrent).toString();
        } else if(isCarbon()) {
            var batteryCapacity = parseInt($("#carbon_battery_capacity").val().split(" ")[0]);
            newParameters["battery_bulk_charge_voltage"         ] = "5600";
            newParameters["battery_float_charge_voltage"        ] = "5400";
            newParameters["battery_cutoff_voltage_ongrid"       ] = "4680";
            newParameters["battery_recovery_voltage_ongrid"     ] = "5200";
            newParameters["battery_cutoff_voltage_offgrid"      ] = "4300";
            newParameters["battery_recovery_voltage_offgrid"    ] = "4800";
            newParameters["battery_max_charge_current"          ] = Math.min(Math.max(Math.round(batteryCapacity * 0.15 / 48), 10) * 100, maxChargingCurrent).toString();
            newParameters["battery_max_discharge_current_ongrid"] = Math.min(Math.max(Math.round(batteryCapacity * 0.20 / 48), 20) * 100, maxDischargingCurrent).toString();
        } else if(isOther()) {
            var custom_maxChargingCurrent       =                Math.round(parseFloat($("#other_battery_maxChargingCurrent      ").val()) *  1) * 100 ;
            var custom_maxDischargingCurrent    =                Math.round(parseFloat($("#other_battery_maxDischargingCurrent   ").val()) *  1) * 100 ;
            var custom_bulkChargingVoltage      = Math.min(6000, Math.round(parseFloat($("#other_battery_bulkChargingVoltage     ").val()) * 10) *  10);
            var custom_floatChargingVoltage     = Math.min(6000, Math.round(parseFloat($("#other_battery_floatChargingVoltage    ").val()) * 10) *  10);
            var custom_cutoffVoltage            = Math.min(6000, Math.round(parseFloat($("#other_battery_cutoffVoltage           ").val()) * 10) *  10);
            var custom_redischargeVoltage       = Math.min(6000, Math.round(parseFloat($("#other_battery_redischargeVoltage      ").val()) * 10) *  10);
            var custom_cutoffVoltageHybrid      = Math.min(6000, Math.round(parseFloat($("#other_battery_cutoffVoltageHybrid     ").val()) * 10) *  10);
            var custom_redischargeVoltageHybrid = Math.min(6000, Math.round(parseFloat($("#other_battery_redischargeVoltageHybrid").val()) * 10) *  10);
            newParameters["battery_bulk_charge_voltage"         ] = custom_bulkChargingVoltage;
            newParameters["battery_float_charge_voltage"        ] = custom_floatChargingVoltage;
            newParameters["battery_cutoff_voltage_ongrid"       ] = custom_cutoffVoltageHybrid;
            newParameters["battery_recovery_voltage_ongrid"     ] = custom_redischargeVoltageHybrid;
            newParameters["battery_cutoff_voltage_offgrid"      ] = custom_cutoffVoltage;
            newParameters["battery_recovery_voltage_offgrid"    ] = custom_redischargeVoltage;
            newParameters["battery_max_charge_current"          ] = Math.min(custom_maxChargingCurrent, maxChargingCurrent).toString();
            newParameters["battery_max_discharge_current_ongrid"] = Math.min(custom_maxDischargingCurrent, maxDischargingCurrent);
        }
    }

    newParameters["regulationMode"] = $("#regulation_check").is(":checked") ? "1" : "0";
    newParameters["extsolMode"    ] = $("#extsol_check    ").is(":checked") ? "1" : "0";
    newParameters["meter1Mode"    ] = $("#meter1_mode     ").val();
    newParameters["meter2Mode"    ] = $("#meter2_mode     ").val();
    newParameters["meter3Mode"    ] = $("#meter3_mode     ").val();
    newParameters["meter4Mode"    ] = $("#meter4_mode     ").val();
    newParameters["meter1Label"   ] = $("#meter1_label    ").val();
    newParameters["meter2Label"   ] = $("#meter2_label    ").val();
    newParameters["meter3Label"   ] = $("#meter3_label    ").val();
    newParameters["meter4Label"   ] = $("#meter4_label    ").val();

    newParameters["controlMaxChargingPowerACMode"] = $("#controlMaxChargingPowerAC_check").is(":checked") ? "1" : "0";
    newParameters["controlMaxInjectionPowerMode" ] = $("#controlMaxInjectionPower_check" ).is(":checked") ? "1" : "0";

    newParameters["prepareBatteryExtension"] = "0";
    newParameters["cloudSet"               ] = "1";

    newParameters["battery_type" ] = inverterModel >= "11000" ? "2" : (isLiFePO() ? "1" : "0"); // 2=lifepo i-Series, for h5 or h10 should be 0=carbon 1=lifepo
    newParameters["reactive_mode"] = "0"; // Reactive mode off

    if(elementExists("#extended_lfsmoThreshold")) newParameters["lfsmo_threshold"] = Math.round($("#extended_lfsmoThreshold").val());
    if(elementExists("#extended_lfsmoDroop"    )) newParameters["lfsmo_droop"    ] = Math.round($("#extended_lfsmoDroop").val());
    if(elementExists("#extended_lfsmoSlope"    )) newParameters["lfsmo_slope"    ] = Math.round(parseFloat($("#extended_lfsmoSlope").val()) * 100);

    // VDE4105
    if(isVde4105) {
        // i-Series Only
        if(inverterModel >= "11000") {
            newParameters["stage_1_ov_threshold"     ] = "26450";
            newParameters["qu_enter_power"           ] = "0";
            newParameters["qu_exit_power"            ] = "0";
            newParameters["cosfp_enter_voltage"      ] = "23200";
            newParameters["cosfp_exit_voltage"       ] = "20700";
            newParameters["lvrt_enter_voltage"       ] = "19500";
            newParameters["lvrt_exit_voltage"        ] = "19600";
            newParameters["lvrt_point_5_voltage"     ] = "19500";
            newParameters["lvrt_point_1_duration"    ] = "150";
            newParameters["lvrt_point_2_duration"    ] = "750";
            newParameters["lvrt_point_3_duration"    ] = "1600";
            newParameters["lvrt_point_4_duration"    ] = "2700";
            newParameters["lvrt_point_5_duration"    ] = "3000";
            newParameters["hvrt_enter_voltage"       ] = "26400";
            newParameters["hvrt_exit_voltage"        ] = "28750";
            newParameters["hvrt_point_1_voltage"     ] = "26450";
            newParameters["hvrt_point_2_voltage"     ] = "27600";
            newParameters["hvrt_point_3_voltage"     ] = "28750";
            newParameters["hvrt_point_3_duration"    ] = "100";
            newParameters["lfsmo_power_recovery_rate"] = "1000";
            newParameters["qu_time_constant"         ] = "10000";
        }
        // h-Series Only
        else {
            newParameters["qu_time_constant"  ] = "5000";
            newParameters["lvrt_switch"       ] = "0";
            newParameters["hvrt_switch"       ] = "0";
            newParameters["lfsmo_curve_switch"] = "1";
        }
    }
    // TOR
    else if(isTor) {
        // All Series
        if(elementExists("#extended_maxGridVoltage"    )) newParameters["grid_connect_upper_voltage"     ] = Math.round(parseFloat($("#extended_maxGridVoltage").val()) * 100);
        if(elementExists("#extended_minGridVoltage"    )) newParameters["grid_connect_lower_voltage"     ] = Math.round(parseFloat($("#extended_minGridVoltage").val()) * 100);
        if(elementExists("#extended_maxGridFrequency"  )) newParameters["grid_connect_upper_frequency"   ] = Math.round(parseFloat($("#extended_maxGridFrequency").val()) * 100);
        if(elementExists("#extended_minGridFrequency"  )) newParameters["grid_connect_lower_frequency"   ] = Math.round(parseFloat($("#extended_minGridFrequency").val()) * 100);
        if(elementExists("#extended_UeffOver1"         )) newParameters["stage_1_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver1").val()) * 100);
        if(elementExists("#extended_UeffUnder1"        )) newParameters["stage_1_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder1").val()) * 100);
        if(elementExists("#extended_UeffOver2"         )) newParameters["stage_2_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver2").val()) * 100);
        if(elementExists("#extended_UeffUnder2"        )) newParameters["stage_2_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder2").val()) * 100);
        if(elementExists("#extended_fOver1"            )) newParameters["stage_1_of_threshold"           ] = Math.round(parseFloat($("#extended_fOver1").val()) * 100);
        if(elementExists("#extended_fUnder1"           )) newParameters["stage_1_uf_threshold"           ] = Math.round(parseFloat($("#extended_fUnder1").val()) * 100);
        if(elementExists("#extended_UeffOver1Time"     )) newParameters["stage_1_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver1Time").val()) * 1000);
        if(elementExists("#extended_UeffUnder1Time"    )) newParameters["stage_1_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder1Time").val()) * 1000);
        if(elementExists("#extended_UeffOver2Time"     )) newParameters["stage_2_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver2Time").val()) * 1000);
        if(elementExists("#extended_UeffUnder2Time"    )) newParameters["stage_2_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder2Time").val()) * 1000);
        if(elementExists("#extended_fOver1Time"        )) newParameters["stage_1_of_duration"            ] = Math.round(parseFloat($("#extended_fOver1Time").val()) * 1000);
        if(elementExists("#extended_fUnder1Time"       )) newParameters["stage_1_uf_duration"            ] = Math.round(parseFloat($("#extended_fUnder1Time").val()) * 1000);
        if(elementExists("#extended_Ueff"              )) newParameters["overvoltage_10min_threshold"    ] = Math.round(parseFloat($("#extended_Ueff").val()) * 100);
        if(elementExists("#extended_gridConnectDelay"  )) newParameters["wait_time_before_grid_connect"  ] = Math.round($("#extended_gridConnectDelay").val());
        if(elementExists("#extended_puTime"            )) newParameters["pu_time_constant"               ] = Math.round(parseFloat($("#extended_puTime").val()) * 1000);
        if(elementExists("#extended_gridReconnectDelay")) newParameters["wait_time_before_grid_reconnect"] = Math.round($("#extended_gridReconnectDelay").val());
        newParameters["pu_curve_switch"   ] = "1";
        newParameters["lfsmu_curve_switch"] = "1";
        // i-Series Only
        if(inverterModel >= "11000") {
            newParameters["grid_reconnect_upper_voltage"] = "25070";
            newParameters["cosfp_enter_voltage"         ] = "25070";
            newParameters["cosfp_exit_voltage"          ] = "20700";
            newParameters["lvrt_enter_voltage"          ] = "18400";
            newParameters["lvrt_exit_voltage"           ] = "18500";
            newParameters["lvrt_point_5_voltage"        ] = "19500";
            newParameters["lvrt_point_1_duration"       ] = "150";
            newParameters["lvrt_point_2_duration"       ] = "400";
            newParameters["lvrt_point_3_duration"       ] = "800";
            newParameters["lvrt_point_4_duration"       ] = "1250";
            newParameters["lfsmo_end_point_frequency"   ] = "5120";
            newParameters["qu_time_constant"            ] = "10000";
        }
        // h-Series Only
        else {
            newParameters["qu_time_constant"  ] = "5000";
            newParameters["lfsmo_curve_switch"] = "1";
            newParameters["lvrt_switch"       ] = isBackup() ? "1" : "0";
            newParameters["hvrt_switch"       ] = isBackup() ? "1" : "0";
        }
    }
    // Estonia
    else if(isEstonia) {
        // All Series
        newParameters["grid_connect_lower_voltage"] = "19550";
        newParameters["grid_connect_upper_voltage"] = "26450";
        newParameters["stage_1_uv_threshold"      ] = "19550";
        newParameters["stage_1_uv_duration"       ] = "1200";
        newParameters["stage_1_ov_duration"       ] = "3000";
        newParameters["stage_1_uf_duration"       ] = "360";
        newParameters["stage_1_of_duration"       ] = "160";
        newParameters["stage_2_uv_threshold"      ] = "4600";
        newParameters["stage_2_uv_duration"       ] = "360";
        newParameters["stage_2_ov_duration"       ] = "100";
        newParameters["lfsmu_curve_switch"        ] = "1";
        // i-Series Only
        if(inverterModel >= "11000") {
            newParameters["grid_connect_lower_frequency"] = "4700";
            newParameters["grid_connect_upper_frequency"] = "5200";
            newParameters["stage_1_ov_threshold"        ] = "25530";
            newParameters["stage_1_uf_threshold"        ] = "4740";
            newParameters["stage_1_of_threshold"        ] = "5160";
            newParameters["stage_2_ov_threshold"        ] = "26450";
            newParameters["lvrt_switch"                 ] = "1";
            newParameters["hvrt_switch"                 ] = "1";
        }
        // h-Series Only
        else {
            newParameters["grid_connect_lower_frequency"] = "4750";
            newParameters["grid_connect_upper_frequency"] = "5150";
            newParameters["stage_1_ov_threshold"        ] = "26500";
            newParameters["stage_1_uf_threshold"        ] = "4750"; // 4740 out-of-range for h-Series
            newParameters["stage_1_of_threshold"        ] = "5150"; // 5160 out-of-range for h-Series
            newParameters["stage_2_ov_threshold"        ] = "28500";
            newParameters["stage_2_uf_duration"         ] = "100";
            newParameters["stage_2_of_duration"         ] = "100";
            newParameters["lfsmo_curve_switch"          ] = "1";
            newParameters["lvrt_switch"                 ] = isBackup() ? "1" : "0";
            newParameters["hvrt_switch"                 ] = isBackup() ? "1" : "0";
        }
    }

    // Reactive Mode
    if(reactive_mode == 1) {
        // cosφ(P) Curve
        newParameters["reactive_mode"            ] = "3";
        newParameters["cosfp_point_b_power"      ] = reactive_kink * 100;
    } else if(reactive_mode == 2) {
        // Fixed cosφ
        newParameters["reactive_mode"            ] = "1";
        newParameters["pf_mode_power_factor"     ] = reactive_cosphi * 10;
    } else if(reactive_mode == 3) {
        // Q(U) Curve
        newParameters["reactive_mode"            ] = "4";
        newParameters["qu_point_1_voltage"       ] = Math.round(Math.round(reactive_v1) * 230.94 / 10) * 10;
        newParameters["qu_point_2_voltage"       ] = Math.round(Math.round(reactive_v2) * 230.94 / 10) * 10;
        newParameters["qu_point_3_voltage"       ] = Math.round(Math.round(reactive_v3) * 230.94 / 10) * 10;
        newParameters["qu_point_4_voltage"       ] = Math.round(Math.round(reactive_v4) * 230.94 / 10) * 10;
        newParameters["qu_point_1_reactive_power"] = Math.round(reactive_qmaxsn * 100 * 100);
        newParameters["qu_point_4_reactive_power"] = Math.round(reactive_qmaxsn * 100 * 100 * -1);
        newParameters["qu_time_constant"         ] = Math.round(reactive_qutime * 1000);
    } else if(reactive_mode == 4) {
        // Fixed Q
        newParameters["reactive_mode"            ] = "2";
        newParameters["qt_mode_reactive_power"   ] = reactive_qfix / devicePower * 100 * 100;
    }





    // Get oldParameters
    try {
        const response = await $.get({
            url: "api.php?get=settings"
        });

        if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
            return alert("E027. Please refresh the page! (Missing or malformed data in local settings table)");

        dataSettings = JSON.parse(JSON.stringify(response));
        
        var temp = response["Inverter"];
        
        previousSettings = JSON.stringify(response);

        oldParameters["regulationMode"] = !response.hasOwnProperty("InjectionMode"       ) ? "0" : response["InjectionMode"       ]["0"]["v5"  ];
        oldParameters["extsolMode"    ] = !response.hasOwnProperty("ModbusExtSolarDevice") ? "0" : response["ModbusExtSolarDevice"]["0"]["mode"];
        oldParameters["meter1Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? "0" : response["UserMeter"]["1"]["mode"];
        oldParameters["meter2Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? "0" : response["UserMeter"]["2"]["mode"];
        oldParameters["meter3Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? "0" : response["UserMeter"]["3"]["mode"];
        oldParameters["meter4Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? "0" : response["UserMeter"]["4"]["mode"];
        oldParameters["meter1Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? ""  : response["UserMeter"]["1"]["s1"  ];
        oldParameters["meter2Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? ""  : response["UserMeter"]["2"]["s1"  ];
        oldParameters["meter3Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? ""  : response["UserMeter"]["3"]["s1"  ];
        oldParameters["meter4Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? ""  : response["UserMeter"]["4"]["s1"  ];

        oldParameters["controlMaxChargingPowerACMode"] = !response.hasOwnProperty("ControlMaxChargingPowerAC") ? "0" : response["ControlMaxChargingPowerAC"]["0"]["mode"];
        oldParameters["controlMaxInjectionPowerMode" ] = !response.hasOwnProperty("ControlMaxInjectionPower" ) ? "0" : response["ControlMaxInjectionPower" ]["0"]["mode"];

        oldParameters["prepareBatteryExtension"] = !response.hasOwnProperty("PrepareBatteryExtension") || !response["PrepareBatteryExtension"].hasOwnProperty("0") ? "0" : response["PrepareBatteryExtension"]["0"]["mode"];
        oldParameters["cloudSet"               ] = !response.hasOwnProperty("CloudSet"               ) || !response["CloudSet"               ].hasOwnProperty("0") ? ""  : response["CloudSet"               ]["0"]["mode"];

        if(temp.hasOwnProperty("202")) oldParameters["reactive_mode"                       ] = temp["202"].s1;
        if(temp.hasOwnProperty("203")) oldParameters["pf_mode_power_factor"                ] = temp["203"].s1;
        if(temp.hasOwnProperty("204")) oldParameters["qt_mode_reactive_power"              ] = temp["204"].s1;
        if(temp.hasOwnProperty("205")) oldParameters["overvoltage_10min_threshold"         ] = temp["205"].s1;
        if(temp.hasOwnProperty("211")) oldParameters["grid_connect_lower_voltage"          ] = temp["211"].s1;
        if(temp.hasOwnProperty("212")) oldParameters["grid_connect_upper_voltage"          ] = temp["212"].s1;
        if(temp.hasOwnProperty("213")) oldParameters["grid_connect_lower_frequency"        ] = temp["213"].s1;
        if(temp.hasOwnProperty("214")) oldParameters["grid_connect_upper_frequency"        ] = temp["214"].s1;
        if(temp.hasOwnProperty("215")) oldParameters["wait_time_before_grid_connect"       ] = temp["215"].s1;
        if(temp.hasOwnProperty("222")) oldParameters["grid_reconnect_upper_voltage"        ] = temp["222"].s1;
        if(temp.hasOwnProperty("225")) oldParameters["wait_time_before_grid_reconnect"     ] = temp["225"].s1;
        if(temp.hasOwnProperty("231")) oldParameters["stage_1_uv_threshold"                ] = temp["231"].s1;
        if(temp.hasOwnProperty("232")) oldParameters["stage_1_ov_threshold"                ] = temp["232"].s1;
        if(temp.hasOwnProperty("233")) oldParameters["stage_1_uf_threshold"                ] = temp["233"].s1;
        if(temp.hasOwnProperty("234")) oldParameters["stage_1_of_threshold"                ] = temp["234"].s1;
        if(temp.hasOwnProperty("235")) oldParameters["stage_1_uv_duration"                 ] = temp["235"].s1;
        if(temp.hasOwnProperty("236")) oldParameters["stage_1_ov_duration"                 ] = temp["236"].s1;
        if(temp.hasOwnProperty("237")) oldParameters["stage_1_uf_duration"                 ] = temp["237"].s1;
        if(temp.hasOwnProperty("238")) oldParameters["stage_1_of_duration"                 ] = temp["238"].s1;
        if(temp.hasOwnProperty("239")) oldParameters["stage_2_uv_threshold"                ] = temp["239"].s1;
        if(temp.hasOwnProperty("240")) oldParameters["stage_2_ov_threshold"                ] = temp["240"].s1;
        if(temp.hasOwnProperty("243")) oldParameters["stage_2_uv_duration"                 ] = temp["243"].s1;
        if(temp.hasOwnProperty("244")) oldParameters["stage_2_ov_duration"                 ] = temp["244"].s1;
        if(temp.hasOwnProperty("251")) oldParameters["qu_point_1_voltage"                  ] = temp["251"].s1;
        if(temp.hasOwnProperty("252")) oldParameters["qu_point_2_voltage"                  ] = temp["252"].s1;
        if(temp.hasOwnProperty("253")) oldParameters["qu_point_3_voltage"                  ] = temp["253"].s1;
        if(temp.hasOwnProperty("254")) oldParameters["qu_point_4_voltage"                  ] = temp["254"].s1;
        if(temp.hasOwnProperty("255")) oldParameters["qu_point_1_reactive_power"           ] = temp["255"].s1;
        if(temp.hasOwnProperty("258")) oldParameters["qu_point_4_reactive_power"           ] = temp["258"].s1;
        if(temp.hasOwnProperty("260")) oldParameters["qu_time_constant"                    ] = temp["260"].s1;
        if(temp.hasOwnProperty("261")) oldParameters["qu_enter_power"                      ] = temp["261"].s1;
        if(temp.hasOwnProperty("262")) oldParameters["qu_exit_power"                       ] = temp["262"].s1;
        if(temp.hasOwnProperty("272")) oldParameters["cosfp_point_b_power"                 ] = temp["272"].s1;
        if(temp.hasOwnProperty("277")) oldParameters["cosfp_enter_voltage"                 ] = temp["277"].s1;
        if(temp.hasOwnProperty("278")) oldParameters["cosfp_exit_voltage"                  ] = temp["278"].s1;
        if(temp.hasOwnProperty("291")) oldParameters["lvrt_switch"                         ] = temp["291"].s1;
        if(temp.hasOwnProperty("292")) oldParameters["lvrt_enter_voltage"                  ] = temp["292"].s1;
        if(temp.hasOwnProperty("293")) oldParameters["lvrt_exit_voltage"                   ] = temp["293"].s1;
        if(temp.hasOwnProperty("298")) oldParameters["lvrt_point_5_voltage"                ] = temp["298"].s1;
        if(temp.hasOwnProperty("299")) oldParameters["lvrt_point_1_duration"               ] = temp["299"].s1;
        if(temp.hasOwnProperty("300")) oldParameters["lvrt_point_2_duration"               ] = temp["300"].s1;
        if(temp.hasOwnProperty("301")) oldParameters["lvrt_point_3_duration"               ] = temp["301"].s1;
        if(temp.hasOwnProperty("302")) oldParameters["lvrt_point_4_duration"               ] = temp["302"].s1;
        if(temp.hasOwnProperty("303")) oldParameters["lvrt_point_5_duration"               ] = temp["303"].s1;
        if(temp.hasOwnProperty("311")) oldParameters["hvrt_switch"                         ] = temp["311"].s1;
        if(temp.hasOwnProperty("312")) oldParameters["hvrt_enter_voltage"                  ] = temp["312"].s1;
        if(temp.hasOwnProperty("313")) oldParameters["hvrt_exit_voltage"                   ] = temp["313"].s1;
        if(temp.hasOwnProperty("314")) oldParameters["hvrt_point_1_voltage"                ] = temp["314"].s1;
        if(temp.hasOwnProperty("315")) oldParameters["hvrt_point_2_voltage"                ] = temp["315"].s1;
        if(temp.hasOwnProperty("316")) oldParameters["hvrt_point_3_voltage"                ] = temp["316"].s1;
        if(temp.hasOwnProperty("319")) oldParameters["hvrt_point_3_duration"               ] = temp["319"].s1;
        if(temp.hasOwnProperty("336")) oldParameters["pu_time_constant"                    ] = temp["336"].s1;
        if(temp.hasOwnProperty("342")) oldParameters["lfsmo_threshold"                     ] = temp["342"].s1;
        if(temp.hasOwnProperty("344")) oldParameters["lfsmo_end_point_frequency"           ] = temp["344"].s1;
        if(temp.hasOwnProperty("348")) oldParameters["lfsmo_power_recovery_rate"           ] = temp["348"].s1;
        if(temp.hasOwnProperty("349")) oldParameters["lfsmo_droop"                         ] = temp["349"].s1;
        if(temp.hasOwnProperty("350")) oldParameters["lfsmo_slope"                         ] = temp["350"].s1;
        if(temp.hasOwnProperty("401")) oldParameters["battery_type"                        ] = temp["401"].s1;
        if(temp.hasOwnProperty("411")) oldParameters["battery_cutoff_voltage_ongrid"       ] = temp["411"].s1;
        if(temp.hasOwnProperty("412")) oldParameters["battery_cutoff_voltage_offgrid"      ] = temp["412"].s1;
        if(temp.hasOwnProperty("413")) oldParameters["battery_recovery_voltage_ongrid"     ] = temp["413"].s1;
        if(temp.hasOwnProperty("414")) oldParameters["battery_recovery_voltage_offgrid"    ] = temp["414"].s1;
        if(temp.hasOwnProperty("415")) oldParameters["battery_bulk_charge_voltage"         ] = temp["415"].s1;
        if(temp.hasOwnProperty("416")) oldParameters["battery_float_charge_voltage"        ] = temp["416"].s1;
        if(temp.hasOwnProperty("417")) oldParameters["battery_max_charge_current"          ] = temp["417"].s1;
        if(temp.hasOwnProperty("418")) oldParameters["battery_max_discharge_current_ongrid"] = temp["418"].s1;
    } catch (error) {
        alert("E026. Please refresh the page! (Error while reading local settings table)");
        return;
    }

    console.log("newParameters"); console.log(newParameters);
    console.log("oldParameters"); console.log(oldParameters);

    var retry = false;

    if(newParameters["regulationMode"] != oldParameters["regulationMode"]) { retry = true; setup_sendSetting("InjectionMode"        , "0", "v5"   , newParameters["regulationMode"]); }
    if(newParameters["extsolMode"    ] != oldParameters["extsolMode"    ]) { retry = true; setup_sendSetting("ModbusExtSolarDevice" , "0", "mode" , newParameters["extsolMode"    ]); }
    if(newParameters["meter1Mode"    ] != oldParameters["meter1Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "1", "mode" , newParameters["meter1Mode"    ]); }
    if(newParameters["meter2Mode"    ] != oldParameters["meter2Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "2", "mode" , newParameters["meter2Mode"    ]); }
    if(newParameters["meter3Mode"    ] != oldParameters["meter3Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "3", "mode" , newParameters["meter3Mode"    ]); }
    if(newParameters["meter4Mode"    ] != oldParameters["meter4Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "4", "mode" , newParameters["meter4Mode"    ]); }
    if(newParameters["meter1Label"   ] != oldParameters["meter1Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "1", "s1"   , newParameters["meter1Label"   ]); }
    if(newParameters["meter2Label"   ] != oldParameters["meter2Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "2", "s1"   , newParameters["meter2Label"   ]); }
    if(newParameters["meter3Label"   ] != oldParameters["meter3Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "3", "s1"   , newParameters["meter3Label"   ]); }
    if(newParameters["meter4Label"   ] != oldParameters["meter4Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "4", "s1"   , newParameters["meter4Label"   ]); }

    if(newParameters["controlMaxChargingPowerACMode"] != oldParameters["controlMaxChargingPowerACMode"]) { retry = true; setup_sendCommand(20769, 0, "", newParameters["controlMaxChargingPowerACMode"]); }
    if(newParameters["controlMaxInjectionPowerMode" ] != oldParameters["controlMaxInjectionPowerMode" ]) { retry = true; setup_sendCommand(20770, 0, "", newParameters["controlMaxInjectionPowerMode" ]); }

    if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) { retry = true; setup_sendSetting("PrepareBatteryExtension", "0", "mode", newParameters["prepareBatteryExtension"]) }
    if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) { retry = true; setup_sendSetting("CloudSet"               , "0", "mode", newParameters["cloudSet"               ]) }

    if(newParameters.hasOwnProperty("reactive_mode"                       ) && oldParameters.hasOwnProperty("reactive_mode"                       ) && newParameters["reactive_mode"                       ] != oldParameters["reactive_mode"                       ]) { retry = true; setup_sendCommand(24064, 202, "", newParameters["reactive_mode"                       ]); }
    if(newParameters.hasOwnProperty("pf_mode_power_factor"                ) && oldParameters.hasOwnProperty("pf_mode_power_factor"                ) && newParameters["pf_mode_power_factor"                ] != oldParameters["pf_mode_power_factor"                ]) { retry = true; setup_sendCommand(24064, 203, "", newParameters["pf_mode_power_factor"                ]); }
    if(newParameters.hasOwnProperty("qt_mode_reactive_power"              ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"              ) && newParameters["qt_mode_reactive_power"              ] != oldParameters["qt_mode_reactive_power"              ]) { retry = true; setup_sendCommand(24064, 204, "", newParameters["qt_mode_reactive_power"              ]); }
    if(newParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && newParameters["overvoltage_10min_threshold"         ] != oldParameters["overvoltage_10min_threshold"         ]) { retry = true; setup_sendCommand(24064, 205, "", newParameters["overvoltage_10min_threshold"         ]); }
    if(newParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && newParameters["grid_connect_lower_voltage"          ] != oldParameters["grid_connect_lower_voltage"          ]) { retry = true; setup_sendCommand(24064, 211, "", newParameters["grid_connect_lower_voltage"          ]); }
    if(newParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && newParameters["grid_connect_upper_voltage"          ] != oldParameters["grid_connect_upper_voltage"          ]) { retry = true; setup_sendCommand(24064, 212, "", newParameters["grid_connect_upper_voltage"          ]); }
    if(newParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && newParameters["grid_connect_lower_frequency"        ] != oldParameters["grid_connect_lower_frequency"        ]) { retry = true; setup_sendCommand(24064, 213, "", newParameters["grid_connect_lower_frequency"        ]); }
    if(newParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && newParameters["grid_connect_upper_frequency"        ] != oldParameters["grid_connect_upper_frequency"        ]) { retry = true; setup_sendCommand(24064, 214, "", newParameters["grid_connect_upper_frequency"        ]); }
    if(newParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && newParameters["wait_time_before_grid_connect"       ] != oldParameters["wait_time_before_grid_connect"       ]) { retry = true; setup_sendCommand(24064, 215, "", newParameters["wait_time_before_grid_connect"       ]); }
    if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && newParameters["grid_reconnect_upper_voltage"        ] != oldParameters["grid_reconnect_upper_voltage"        ]) { retry = true; setup_sendCommand(24064, 222, "", newParameters["grid_reconnect_upper_voltage"        ]); }
    if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && newParameters["wait_time_before_grid_reconnect"     ] != oldParameters["wait_time_before_grid_reconnect"     ]) { retry = true; setup_sendCommand(24064, 225, "", newParameters["wait_time_before_grid_reconnect"     ]); }
    if(newParameters.hasOwnProperty("stage_1_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"                ) && newParameters["stage_1_uv_threshold"                ] != oldParameters["stage_1_uv_threshold"                ]) { retry = true; setup_sendCommand(24064, 231, "", newParameters["stage_1_uv_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_1_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"                ) && newParameters["stage_1_ov_threshold"                ] != oldParameters["stage_1_ov_threshold"                ]) { retry = true; setup_sendCommand(24064, 232, "", newParameters["stage_1_ov_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_1_uf_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"                ) && newParameters["stage_1_uf_threshold"                ] != oldParameters["stage_1_uf_threshold"                ]) { retry = true; setup_sendCommand(24064, 233, "", newParameters["stage_1_uf_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_1_of_threshold"                ) && oldParameters.hasOwnProperty("stage_1_of_threshold"                ) && newParameters["stage_1_of_threshold"                ] != oldParameters["stage_1_of_threshold"                ]) { retry = true; setup_sendCommand(24064, 234, "", newParameters["stage_1_of_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_1_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uv_duration"                 ) && newParameters["stage_1_uv_duration"                 ] != oldParameters["stage_1_uv_duration"                 ]) { retry = true; setup_sendCommand(24064, 235, "", newParameters["stage_1_uv_duration"                 ]); }
    if(newParameters.hasOwnProperty("stage_1_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_1_ov_duration"                 ) && newParameters["stage_1_ov_duration"                 ] != oldParameters["stage_1_ov_duration"                 ]) { retry = true; setup_sendCommand(24064, 236, "", newParameters["stage_1_ov_duration"                 ]); }
    if(newParameters.hasOwnProperty("stage_1_uf_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uf_duration"                 ) && newParameters["stage_1_uf_duration"                 ] != oldParameters["stage_1_uf_duration"                 ]) { retry = true; setup_sendCommand(24064, 237, "", newParameters["stage_1_uf_duration"                 ]); }
    if(newParameters.hasOwnProperty("stage_1_of_duration"                 ) && oldParameters.hasOwnProperty("stage_1_of_duration"                 ) && newParameters["stage_1_of_duration"                 ] != oldParameters["stage_1_of_duration"                 ]) { retry = true; setup_sendCommand(24064, 238, "", newParameters["stage_1_of_duration"                 ]); }
    if(newParameters.hasOwnProperty("stage_2_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"                ) && newParameters["stage_2_uv_threshold"                ] != oldParameters["stage_2_uv_threshold"                ]) { retry = true; setup_sendCommand(24064, 239, "", newParameters["stage_2_uv_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_2_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"                ) && newParameters["stage_2_ov_threshold"                ] != oldParameters["stage_2_ov_threshold"                ]) { retry = true; setup_sendCommand(24064, 240, "", newParameters["stage_2_ov_threshold"                ]); }
    if(newParameters.hasOwnProperty("stage_2_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_2_uv_duration"                 ) && newParameters["stage_2_uv_duration"                 ] != oldParameters["stage_2_uv_duration"                 ]) { retry = true; setup_sendCommand(24064, 243, "", newParameters["stage_2_uv_duration"                 ]); }
    if(newParameters.hasOwnProperty("stage_2_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_2_ov_duration"                 ) && newParameters["stage_2_ov_duration"                 ] != oldParameters["stage_2_ov_duration"                 ]) { retry = true; setup_sendCommand(24064, 244, "", newParameters["stage_2_ov_duration"                 ]); }
    if(newParameters.hasOwnProperty("qu_point_1_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_1_voltage"                  ) && newParameters["qu_point_1_voltage"                  ] != oldParameters["qu_point_1_voltage"                  ]) { retry = true; setup_sendCommand(24064, 251, "", newParameters["qu_point_1_voltage"                  ]); }
    if(newParameters.hasOwnProperty("qu_point_2_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_2_voltage"                  ) && newParameters["qu_point_2_voltage"                  ] != oldParameters["qu_point_2_voltage"                  ]) { retry = true; setup_sendCommand(24064, 252, "", newParameters["qu_point_2_voltage"                  ]); }
    if(newParameters.hasOwnProperty("qu_point_3_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_3_voltage"                  ) && newParameters["qu_point_3_voltage"                  ] != oldParameters["qu_point_3_voltage"                  ]) { retry = true; setup_sendCommand(24064, 253, "", newParameters["qu_point_3_voltage"                  ]); }
    if(newParameters.hasOwnProperty("qu_point_4_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_4_voltage"                  ) && newParameters["qu_point_4_voltage"                  ] != oldParameters["qu_point_4_voltage"                  ]) { retry = true; setup_sendCommand(24064, 254, "", newParameters["qu_point_4_voltage"                  ]); }
    if(newParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && newParameters["qu_point_1_reactive_power"           ] != oldParameters["qu_point_1_reactive_power"           ]) { retry = true; setup_sendCommand(24064, 255, "", newParameters["qu_point_1_reactive_power"           ]); }
    if(newParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && newParameters["qu_point_4_reactive_power"           ] != oldParameters["qu_point_4_reactive_power"           ]) { retry = true; setup_sendCommand(24064, 258, "", newParameters["qu_point_4_reactive_power"           ]); }
    if(newParameters.hasOwnProperty("qu_time_constant"                    ) && oldParameters.hasOwnProperty("qu_time_constant"                    ) && newParameters["qu_time_constant"                    ] != oldParameters["qu_time_constant"                    ]) { retry = true; setup_sendCommand(24064, 260, "", newParameters["qu_time_constant"                    ]); }
    if(newParameters.hasOwnProperty("qu_enter_power"                      ) && oldParameters.hasOwnProperty("qu_enter_power"                      ) && newParameters["qu_enter_power"                      ] != oldParameters["qu_enter_power"                      ]) { retry = true; setup_sendCommand(24064, 261, "", newParameters["qu_enter_power"                      ]); }
    if(newParameters.hasOwnProperty("qu_exit_power"                       ) && oldParameters.hasOwnProperty("qu_exit_power"                       ) && newParameters["qu_exit_power"                       ] != oldParameters["qu_exit_power"                       ]) { retry = true; setup_sendCommand(24064, 262, "", newParameters["qu_exit_power"                       ]); }
    if(newParameters.hasOwnProperty("cosfp_point_b_power"                 ) && oldParameters.hasOwnProperty("cosfp_point_b_power"                 ) && newParameters["cosfp_point_b_power"                 ] != oldParameters["cosfp_point_b_power"                 ]) { retry = true; setup_sendCommand(24064, 272, "", newParameters["cosfp_point_b_power"                 ]); }
    if(newParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && newParameters["cosfp_enter_voltage"                 ] != oldParameters["cosfp_enter_voltage"                 ]) { retry = true; setup_sendCommand(24064, 277, "", newParameters["cosfp_enter_voltage"                 ]); }
    if(newParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && newParameters["cosfp_exit_voltage"                  ] != oldParameters["cosfp_exit_voltage"                  ]) { retry = true; setup_sendCommand(24064, 278, "", newParameters["cosfp_exit_voltage"                  ]); }
    if(newParameters.hasOwnProperty("lvrt_switch"                         ) && oldParameters.hasOwnProperty("lvrt_switch"                         ) && newParameters["lvrt_switch"                         ] != oldParameters["lvrt_switch"                         ]) { retry = true; setup_sendCommand(24064, 291, "", newParameters["lvrt_switch"                         ]); }
    if(newParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && newParameters["lvrt_enter_voltage"                  ] != oldParameters["lvrt_enter_voltage"                  ]) { retry = true; setup_sendCommand(24064, 292, "", newParameters["lvrt_enter_voltage"                  ]); }
    if(newParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && newParameters["lvrt_exit_voltage"                   ] != oldParameters["lvrt_exit_voltage"                   ]) { retry = true; setup_sendCommand(24064, 293, "", newParameters["lvrt_exit_voltage"                   ]); }
    if(newParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && newParameters["lvrt_point_5_voltage"                ] != oldParameters["lvrt_point_5_voltage"                ]) { retry = true; setup_sendCommand(24064, 298, "", newParameters["lvrt_point_5_voltage"                ]); }
    if(newParameters.hasOwnProperty("lvrt_point_1_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"               ) && newParameters["lvrt_point_1_duration"               ] != oldParameters["lvrt_point_1_duration"               ]) { retry = true; setup_sendCommand(24064, 299, "", newParameters["lvrt_point_1_duration"               ]); }
    if(newParameters.hasOwnProperty("lvrt_point_2_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"               ) && newParameters["lvrt_point_2_duration"               ] != oldParameters["lvrt_point_2_duration"               ]) { retry = true; setup_sendCommand(24064, 300, "", newParameters["lvrt_point_2_duration"               ]); }
    if(newParameters.hasOwnProperty("lvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"               ) && newParameters["lvrt_point_3_duration"               ] != oldParameters["lvrt_point_3_duration"               ]) { retry = true; setup_sendCommand(24064, 301, "", newParameters["lvrt_point_3_duration"               ]); }
    if(newParameters.hasOwnProperty("lvrt_point_4_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"               ) && newParameters["lvrt_point_4_duration"               ] != oldParameters["lvrt_point_4_duration"               ]) { retry = true; setup_sendCommand(24064, 302, "", newParameters["lvrt_point_4_duration"               ]); }
    if(newParameters.hasOwnProperty("lvrt_point_5_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"               ) && newParameters["lvrt_point_5_duration"               ] != oldParameters["lvrt_point_5_duration"               ]) { retry = true; setup_sendCommand(24064, 303, "", newParameters["lvrt_point_5_duration"               ]); }
    if(newParameters.hasOwnProperty("hvrt_switch"                         ) && oldParameters.hasOwnProperty("hvrt_switch"                         ) && newParameters["hvrt_switch"                         ] != oldParameters["hvrt_switch"                         ]) { retry = true; setup_sendCommand(24064, 311, "", newParameters["hvrt_switch"                         ]); }
    if(newParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && newParameters["hvrt_enter_voltage"                  ] != oldParameters["hvrt_enter_voltage"                  ]) { retry = true; setup_sendCommand(24064, 312, "", newParameters["hvrt_enter_voltage"                  ]); }
    if(newParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && newParameters["hvrt_exit_voltage"                   ] != oldParameters["hvrt_exit_voltage"                   ]) { retry = true; setup_sendCommand(24064, 313, "", newParameters["hvrt_exit_voltage"                   ]); }
    if(newParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && newParameters["hvrt_point_1_voltage"                ] != oldParameters["hvrt_point_1_voltage"                ]) { retry = true; setup_sendCommand(24064, 314, "", newParameters["hvrt_point_1_voltage"                ]); }
    if(newParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && newParameters["hvrt_point_2_voltage"                ] != oldParameters["hvrt_point_2_voltage"                ]) { retry = true; setup_sendCommand(24064, 315, "", newParameters["hvrt_point_2_voltage"                ]); }
    if(newParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && newParameters["hvrt_point_3_voltage"                ] != oldParameters["hvrt_point_3_voltage"                ]) { retry = true; setup_sendCommand(24064, 316, "", newParameters["hvrt_point_3_voltage"                ]); }
    if(newParameters.hasOwnProperty("hvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"               ) && newParameters["hvrt_point_3_duration"               ] != oldParameters["hvrt_point_3_duration"               ]) { retry = true; setup_sendCommand(24064, 319, "", newParameters["hvrt_point_3_duration"               ]); }
    if(newParameters.hasOwnProperty("pu_time_constant"                    ) && oldParameters.hasOwnProperty("pu_time_constant"                    ) && newParameters["pu_time_constant"                    ] != oldParameters["pu_time_constant"                    ]) { retry = true; setup_sendCommand(24064, 336, "", newParameters["pu_time_constant"                    ]); }
    if(newParameters.hasOwnProperty("lfsmo_threshold"                     ) && oldParameters.hasOwnProperty("lfsmo_threshold"                     ) && newParameters["lfsmo_threshold"                     ] != oldParameters["lfsmo_threshold"                     ]) { retry = true; setup_sendCommand(24064, 342, "", newParameters["lfsmo_threshold"                     ]); }
    if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && newParameters["lfsmo_end_point_frequency"           ] != oldParameters["lfsmo_end_point_frequency"           ]) { retry = true; setup_sendCommand(24064, 344, "", newParameters["lfsmo_end_point_frequency"           ]); }
    if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && newParameters["lfsmo_power_recovery_rate"           ] != oldParameters["lfsmo_power_recovery_rate"           ]) { retry = true; setup_sendCommand(24064, 348, "", newParameters["lfsmo_power_recovery_rate"           ]); }
    if(newParameters.hasOwnProperty("lfsmo_droop"                         ) && oldParameters.hasOwnProperty("lfsmo_droop"                         ) && newParameters["lfsmo_droop"                         ] != oldParameters["lfsmo_droop"                         ]) { retry = true; setup_sendCommand(24064, 349, "", newParameters["lfsmo_droop"                         ]); }
    if(newParameters.hasOwnProperty("lfsmo_slope"                         ) && oldParameters.hasOwnProperty("lfsmo_slope"                         ) && newParameters["lfsmo_slope"                         ] != oldParameters["lfsmo_slope"                         ]) { retry = true; setup_sendCommand(24064, 350, "", newParameters["lfsmo_slope"                         ]); }
    if(newParameters.hasOwnProperty("battery_type"                        ) && oldParameters.hasOwnProperty("battery_type"                        ) && newParameters["battery_type"                        ] != oldParameters["battery_type"                        ]) { retry = true; setup_sendCommand(24064, 401, "", newParameters["battery_type"                        ]); }
    if(newParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && newParameters["battery_cutoff_voltage_ongrid"       ] != oldParameters["battery_cutoff_voltage_ongrid"       ]) { retry = true; setup_sendCommand(24064, 411, "", newParameters["battery_cutoff_voltage_ongrid"       ]); }
    if(newParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && newParameters["battery_cutoff_voltage_offgrid"      ] != oldParameters["battery_cutoff_voltage_offgrid"      ]) { retry = true; setup_sendCommand(24064, 412, "", newParameters["battery_cutoff_voltage_offgrid"      ]); }
    if(newParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && oldParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && newParameters["battery_recovery_voltage_ongrid"     ] != oldParameters["battery_recovery_voltage_ongrid"     ]) { retry = true; setup_sendCommand(24064, 413, "", newParameters["battery_recovery_voltage_ongrid"     ]); }
    if(newParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && oldParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && newParameters["battery_recovery_voltage_offgrid"    ] != oldParameters["battery_recovery_voltage_offgrid"    ]) { retry = true; setup_sendCommand(24064, 414, "", newParameters["battery_recovery_voltage_offgrid"    ]); }
    if(newParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && oldParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && newParameters["battery_bulk_charge_voltage"         ] != oldParameters["battery_bulk_charge_voltage"         ]) { retry = true; setup_sendCommand(24064, 415, "", newParameters["battery_bulk_charge_voltage"         ]); }
    if(newParameters.hasOwnProperty("battery_float_charge_voltage"        ) && oldParameters.hasOwnProperty("battery_float_charge_voltage"        ) && newParameters["battery_float_charge_voltage"        ] != oldParameters["battery_float_charge_voltage"        ]) { retry = true; setup_sendCommand(24064, 416, "", newParameters["battery_float_charge_voltage"        ]); }
    if(newParameters.hasOwnProperty("battery_max_charge_current"          ) && oldParameters.hasOwnProperty("battery_max_charge_current"          ) && newParameters["battery_max_charge_current"          ] != oldParameters["battery_max_charge_current"          ]) { retry = true; setup_sendCommand(24064, 417, "", newParameters["battery_max_charge_current"          ]); }
    if(newParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && oldParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && newParameters["battery_max_discharge_current_ongrid"] != oldParameters["battery_max_discharge_current_ongrid"]) { retry = true; setup_sendCommand(24064, 418, "", newParameters["battery_max_discharge_current_ongrid"]); }

    if(!retry) {
        $(".setting-progress span").html(lang.system_setup.msg_setting_success).css("color", "#28a745");
        $("#notif").removeClass("loading error success").addClass("success");
        // Next Step
        await sleep(2500);
        window.location.href = "system_test.php";
    } else console.log("SETTING PARAMETERS");





}










/*
    Send Command
*/

async function setup_sendCommand(type, entity, text1, text2) {
    try {
        const response = await $.get({
            url: `api.php?set=command&type=${type}&entity=${entity}&text1=${text1}&text2=${text2}`
        });
        if(response != "1") return alert("E029. Please refresh the page! (Bad response while writing command to local database)");
        if(checkParametersInterval == undefined) checkParametersInterval = setInterval(setup_checkParameters, 5000);
    } catch (error) {
        alert("E028. Please refresh the page! (Error while writing command to local database)");
    }
}

async function setup_sendSetting(varname, entity, field, value) {
    var bxSet = { "mode":11, "v1":21, "v2":22, "v3":23, "v4":24, "v5":25, "v6":26, "s1":31, "s2":32 };
    await setup_sendCommand(11, bxSet[field], entity + " " + varname, value);
}










/*
    Check Parameters
*/

var tempCheckCounter = 0;

async function setup_checkParameters() {

    if(!isSettingParameters) {
        await sleep(5000); // wait for all setup_sendCommand calls to fire
        clearInterval(checkParametersInterval);
        checkParametersInterval = undefined;
        isSettingParameters = false;
    }

    try {
        const response = await $.get({
            url: "api.php?get=settings"
        });

        if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
            return alert("E031. Please refresh the page! (Missing or malformed data in local settings table)");

        dataSettings = JSON.parse(JSON.stringify(response));

        var temp = response["Inverter"];

        if(JSON.stringify(response) == previousSettings) {
            tempCheckCounter += 1;
            if(tempCheckCounter > 10) {
                setTimeout(async () => {
                    try {
                        const response = await $.get({
                            url: "api.php?set=command&type=12&entity=0&text2=1" // reload settings (to avoid waiting 5 minutes)
                        });
                        console.log(response);
                    } catch (error) {
                        console.log("Error reloading settings:", error);
                    }
                }, 1000);
                tempCheckCounter = 0;
            }
            return false;
        }
        previousSettings = JSON.stringify(response);

        oldParameters["regulationMode"] = !response.hasOwnProperty("InjectionMode"       ) ? "0" : response["InjectionMode"       ]["0"]["v5"  ];
        oldParameters["extsolMode"    ] = !response.hasOwnProperty("ModbusExtSolarDevice") ? "0" : response["ModbusExtSolarDevice"]["0"]["mode"];
        oldParameters["meter1Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? "0" : response["UserMeter"]["1"]["mode"];
        oldParameters["meter2Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? "0" : response["UserMeter"]["2"]["mode"];
        oldParameters["meter3Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? "0" : response["UserMeter"]["3"]["mode"];
        oldParameters["meter4Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? "0" : response["UserMeter"]["4"]["mode"];
        oldParameters["meter1Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? ""  : response["UserMeter"]["1"]["s1"  ];
        oldParameters["meter2Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? ""  : response["UserMeter"]["2"]["s1"  ];
        oldParameters["meter3Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? ""  : response["UserMeter"]["3"]["s1"  ];
        oldParameters["meter4Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? ""  : response["UserMeter"]["4"]["s1"  ];

        oldParameters["controlMaxChargingPowerACMode"] = !response.hasOwnProperty("ControlMaxChargingPowerAC") ? "0" : response["ControlMaxChargingPowerAC"]["0"]["mode"];
        oldParameters["controlMaxInjectionPowerMode" ] = !response.hasOwnProperty("ControlMaxInjectionPower" ) ? "0" : response["ControlMaxInjectionPower" ]["0"]["mode"];

        oldParameters["prepareBatteryExtension"] = !response.hasOwnProperty("PrepareBatteryExtension") || !response["PrepareBatteryExtension"].hasOwnProperty("0") ? "0" : response["PrepareBatteryExtension"]["0"]["mode"];
        oldParameters["cloudSet"               ] = !response.hasOwnProperty("CloudSet"               ) || !response["CloudSet"               ].hasOwnProperty("0") ? ""  : response["CloudSet"               ]["0"]["mode"];

        if(temp.hasOwnProperty("202")) oldParameters["reactive_mode"                       ] = temp["202"].s1;
        if(temp.hasOwnProperty("203")) oldParameters["pf_mode_power_factor"                ] = temp["203"].s1;
        if(temp.hasOwnProperty("204")) oldParameters["qt_mode_reactive_power"              ] = temp["204"].s1;
        if(temp.hasOwnProperty("205")) oldParameters["overvoltage_10min_threshold"         ] = temp["205"].s1;
        if(temp.hasOwnProperty("211")) oldParameters["grid_connect_lower_voltage"          ] = temp["211"].s1;
        if(temp.hasOwnProperty("212")) oldParameters["grid_connect_upper_voltage"          ] = temp["212"].s1;
        if(temp.hasOwnProperty("213")) oldParameters["grid_connect_lower_frequency"        ] = temp["213"].s1;
        if(temp.hasOwnProperty("214")) oldParameters["grid_connect_upper_frequency"        ] = temp["214"].s1;
        if(temp.hasOwnProperty("215")) oldParameters["wait_time_before_grid_connect"       ] = temp["215"].s1;
        if(temp.hasOwnProperty("222")) oldParameters["grid_reconnect_upper_voltage"        ] = temp["222"].s1;
        if(temp.hasOwnProperty("225")) oldParameters["wait_time_before_grid_reconnect"     ] = temp["225"].s1;
        if(temp.hasOwnProperty("231")) oldParameters["stage_1_uv_threshold"                ] = temp["231"].s1;
        if(temp.hasOwnProperty("232")) oldParameters["stage_1_ov_threshold"                ] = temp["232"].s1;
        if(temp.hasOwnProperty("233")) oldParameters["stage_1_uf_threshold"                ] = temp["233"].s1;
        if(temp.hasOwnProperty("234")) oldParameters["stage_1_of_threshold"                ] = temp["234"].s1;
        if(temp.hasOwnProperty("235")) oldParameters["stage_1_uv_duration"                 ] = temp["235"].s1;
        if(temp.hasOwnProperty("236")) oldParameters["stage_1_ov_duration"                 ] = temp["236"].s1;
        if(temp.hasOwnProperty("237")) oldParameters["stage_1_uf_duration"                 ] = temp["237"].s1;
        if(temp.hasOwnProperty("238")) oldParameters["stage_1_of_duration"                 ] = temp["238"].s1;
        if(temp.hasOwnProperty("239")) oldParameters["stage_2_uv_threshold"                ] = temp["239"].s1;
        if(temp.hasOwnProperty("240")) oldParameters["stage_2_ov_threshold"                ] = temp["240"].s1;
        if(temp.hasOwnProperty("243")) oldParameters["stage_2_uv_duration"                 ] = temp["243"].s1;
        if(temp.hasOwnProperty("244")) oldParameters["stage_2_ov_duration"                 ] = temp["244"].s1;
        if(temp.hasOwnProperty("251")) oldParameters["qu_point_1_voltage"                  ] = temp["251"].s1;
        if(temp.hasOwnProperty("252")) oldParameters["qu_point_2_voltage"                  ] = temp["252"].s1;
        if(temp.hasOwnProperty("253")) oldParameters["qu_point_3_voltage"                  ] = temp["253"].s1;
        if(temp.hasOwnProperty("254")) oldParameters["qu_point_4_voltage"                  ] = temp["254"].s1;
        if(temp.hasOwnProperty("255")) oldParameters["qu_point_1_reactive_power"           ] = temp["255"].s1;
        if(temp.hasOwnProperty("258")) oldParameters["qu_point_4_reactive_power"           ] = temp["258"].s1;
        if(temp.hasOwnProperty("260")) oldParameters["qu_time_constant"                    ] = temp["260"].s1;
        if(temp.hasOwnProperty("261")) oldParameters["qu_enter_power"                      ] = temp["261"].s1;
        if(temp.hasOwnProperty("262")) oldParameters["qu_exit_power"                       ] = temp["262"].s1;
        if(temp.hasOwnProperty("272")) oldParameters["cosfp_point_b_power"                 ] = temp["272"].s1;
        if(temp.hasOwnProperty("277")) oldParameters["cosfp_enter_voltage"                 ] = temp["277"].s1;
        if(temp.hasOwnProperty("278")) oldParameters["cosfp_exit_voltage"                  ] = temp["278"].s1;
        if(temp.hasOwnProperty("291")) oldParameters["lvrt_switch"                         ] = temp["291"].s1;
        if(temp.hasOwnProperty("292")) oldParameters["lvrt_enter_voltage"                  ] = temp["292"].s1;
        if(temp.hasOwnProperty("293")) oldParameters["lvrt_exit_voltage"                   ] = temp["293"].s1;
        if(temp.hasOwnProperty("298")) oldParameters["lvrt_point_5_voltage"                ] = temp["298"].s1;
        if(temp.hasOwnProperty("299")) oldParameters["lvrt_point_1_duration"               ] = temp["299"].s1;
        if(temp.hasOwnProperty("300")) oldParameters["lvrt_point_2_duration"               ] = temp["300"].s1;
        if(temp.hasOwnProperty("301")) oldParameters["lvrt_point_3_duration"               ] = temp["301"].s1;
        if(temp.hasOwnProperty("302")) oldParameters["lvrt_point_4_duration"               ] = temp["302"].s1;
        if(temp.hasOwnProperty("303")) oldParameters["lvrt_point_5_duration"               ] = temp["303"].s1;
        if(temp.hasOwnProperty("311")) oldParameters["hvrt_switch"                         ] = temp["311"].s1;
        if(temp.hasOwnProperty("312")) oldParameters["hvrt_enter_voltage"                  ] = temp["312"].s1;
        if(temp.hasOwnProperty("313")) oldParameters["hvrt_exit_voltage"                   ] = temp["313"].s1;
        if(temp.hasOwnProperty("314")) oldParameters["hvrt_point_1_voltage"                ] = temp["314"].s1;
        if(temp.hasOwnProperty("315")) oldParameters["hvrt_point_2_voltage"                ] = temp["315"].s1;
        if(temp.hasOwnProperty("316")) oldParameters["hvrt_point_3_voltage"                ] = temp["316"].s1;
        if(temp.hasOwnProperty("319")) oldParameters["hvrt_point_3_duration"               ] = temp["319"].s1;
        if(temp.hasOwnProperty("336")) oldParameters["pu_time_constant"                    ] = temp["336"].s1;
        if(temp.hasOwnProperty("342")) oldParameters["lfsmo_threshold"                     ] = temp["342"].s1;
        if(temp.hasOwnProperty("344")) oldParameters["lfsmo_end_point_frequency"           ] = temp["344"].s1;
        if(temp.hasOwnProperty("348")) oldParameters["lfsmo_power_recovery_rate"           ] = temp["348"].s1;
        if(temp.hasOwnProperty("349")) oldParameters["lfsmo_droop"                         ] = temp["349"].s1;
        if(temp.hasOwnProperty("350")) oldParameters["lfsmo_slope"                         ] = temp["350"].s1;
        if(temp.hasOwnProperty("401")) oldParameters["battery_type"                        ] = temp["401"].s1;
        if(temp.hasOwnProperty("411")) oldParameters["battery_cutoff_voltage_ongrid"       ] = temp["411"].s1;
        if(temp.hasOwnProperty("412")) oldParameters["battery_cutoff_voltage_offgrid"      ] = temp["412"].s1;
        if(temp.hasOwnProperty("413")) oldParameters["battery_recovery_voltage_ongrid"     ] = temp["413"].s1;
        if(temp.hasOwnProperty("414")) oldParameters["battery_recovery_voltage_offgrid"    ] = temp["414"].s1;
        if(temp.hasOwnProperty("415")) oldParameters["battery_bulk_charge_voltage"         ] = temp["415"].s1;
        if(temp.hasOwnProperty("416")) oldParameters["battery_float_charge_voltage"        ] = temp["416"].s1;
        if(temp.hasOwnProperty("417")) oldParameters["battery_max_charge_current"          ] = temp["417"].s1;
        if(temp.hasOwnProperty("418")) oldParameters["battery_max_discharge_current_ongrid"] = temp["418"].s1;

        console.log("newParameters"); console.log(newParameters);
        console.log("oldParameters"); console.log(oldParameters);

        var retry = false;
            
        if(newParameters["regulationMode"] != oldParameters["regulationMode"]) { retry = true; setup_sendSetting("InjectionMode"        , "0", "v5"   , newParameters["regulationMode"]); }
        if(newParameters["extsolMode"    ] != oldParameters["extsolMode"    ]) { retry = true; setup_sendSetting("ModbusExtSolarDevice" , "0", "mode" , newParameters["extsolMode"    ]); }
        if(newParameters["meter1Mode"    ] != oldParameters["meter1Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "1", "mode" , newParameters["meter1Mode"    ]); }
        if(newParameters["meter2Mode"    ] != oldParameters["meter2Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "2", "mode" , newParameters["meter2Mode"    ]); }
        if(newParameters["meter3Mode"    ] != oldParameters["meter3Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "3", "mode" , newParameters["meter3Mode"    ]); }
        if(newParameters["meter4Mode"    ] != oldParameters["meter4Mode"    ]) { retry = true; setup_sendSetting("UserMeter"            , "4", "mode" , newParameters["meter4Mode"    ]); }
        if(newParameters["meter1Label"   ] != oldParameters["meter1Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "1", "s1"   , newParameters["meter1Label"   ]); }
        if(newParameters["meter2Label"   ] != oldParameters["meter2Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "2", "s1"   , newParameters["meter2Label"   ]); }
        if(newParameters["meter3Label"   ] != oldParameters["meter3Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "3", "s1"   , newParameters["meter3Label"   ]); }
        if(newParameters["meter4Label"   ] != oldParameters["meter4Label"   ]) { retry = true; setup_sendSetting("UserMeter"            , "4", "s1"   , newParameters["meter4Label"   ]); }

        if(newParameters["controlMaxChargingPowerACMode"] != oldParameters["controlMaxChargingPowerACMode"]) { retry = true; setup_sendCommand(20769, 0, "", newParameters["controlMaxChargingPowerACMode"]); }
        if(newParameters["controlMaxInjectionPowerMode" ] != oldParameters["controlMaxInjectionPowerMode" ]) { retry = true; setup_sendCommand(20770, 0, "", newParameters["controlMaxInjectionPowerMode" ]); }

        if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) { retry = true; setup_sendSetting("PrepareBatteryExtension", "0", "mode", newParameters["prepareBatteryExtension"]) }
        if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) { retry = true; setup_sendSetting("CloudSet"               , "0", "mode", newParameters["cloudSet"               ]) }

        if(newParameters.hasOwnProperty("reactive_mode"                       ) && oldParameters.hasOwnProperty("reactive_mode"                       ) && newParameters["reactive_mode"                       ] != oldParameters["reactive_mode"                       ]) { retry = true; setup_sendCommand(24064, 202, "", newParameters["reactive_mode"                       ]); }
        if(newParameters.hasOwnProperty("pf_mode_power_factor"                ) && oldParameters.hasOwnProperty("pf_mode_power_factor"                ) && newParameters["pf_mode_power_factor"                ] != oldParameters["pf_mode_power_factor"                ]) { retry = true; setup_sendCommand(24064, 203, "", newParameters["pf_mode_power_factor"                ]); }
        if(newParameters.hasOwnProperty("qt_mode_reactive_power"              ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"              ) && newParameters["qt_mode_reactive_power"              ] != oldParameters["qt_mode_reactive_power"              ]) { retry = true; setup_sendCommand(24064, 204, "", newParameters["qt_mode_reactive_power"              ]); }
        if(newParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && newParameters["overvoltage_10min_threshold"         ] != oldParameters["overvoltage_10min_threshold"         ]) { retry = true; setup_sendCommand(24064, 205, "", newParameters["overvoltage_10min_threshold"         ]); }
        if(newParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && newParameters["grid_connect_lower_voltage"          ] != oldParameters["grid_connect_lower_voltage"          ]) { retry = true; setup_sendCommand(24064, 211, "", newParameters["grid_connect_lower_voltage"          ]); }
        if(newParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && newParameters["grid_connect_upper_voltage"          ] != oldParameters["grid_connect_upper_voltage"          ]) { retry = true; setup_sendCommand(24064, 212, "", newParameters["grid_connect_upper_voltage"          ]); }
        if(newParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && newParameters["grid_connect_lower_frequency"        ] != oldParameters["grid_connect_lower_frequency"        ]) { retry = true; setup_sendCommand(24064, 213, "", newParameters["grid_connect_lower_frequency"        ]); }
        if(newParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && newParameters["grid_connect_upper_frequency"        ] != oldParameters["grid_connect_upper_frequency"        ]) { retry = true; setup_sendCommand(24064, 214, "", newParameters["grid_connect_upper_frequency"        ]); }
        if(newParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && newParameters["wait_time_before_grid_connect"       ] != oldParameters["wait_time_before_grid_connect"       ]) { retry = true; setup_sendCommand(24064, 215, "", newParameters["wait_time_before_grid_connect"       ]); }
        if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && newParameters["grid_reconnect_upper_voltage"        ] != oldParameters["grid_reconnect_upper_voltage"        ]) { retry = true; setup_sendCommand(24064, 222, "", newParameters["grid_reconnect_upper_voltage"        ]); }
        if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && newParameters["wait_time_before_grid_reconnect"     ] != oldParameters["wait_time_before_grid_reconnect"     ]) { retry = true; setup_sendCommand(24064, 225, "", newParameters["wait_time_before_grid_reconnect"     ]); }
        if(newParameters.hasOwnProperty("stage_1_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"                ) && newParameters["stage_1_uv_threshold"                ] != oldParameters["stage_1_uv_threshold"                ]) { retry = true; setup_sendCommand(24064, 231, "", newParameters["stage_1_uv_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_1_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"                ) && newParameters["stage_1_ov_threshold"                ] != oldParameters["stage_1_ov_threshold"                ]) { retry = true; setup_sendCommand(24064, 232, "", newParameters["stage_1_ov_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_1_uf_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"                ) && newParameters["stage_1_uf_threshold"                ] != oldParameters["stage_1_uf_threshold"                ]) { retry = true; setup_sendCommand(24064, 233, "", newParameters["stage_1_uf_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_1_of_threshold"                ) && oldParameters.hasOwnProperty("stage_1_of_threshold"                ) && newParameters["stage_1_of_threshold"                ] != oldParameters["stage_1_of_threshold"                ]) { retry = true; setup_sendCommand(24064, 234, "", newParameters["stage_1_of_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_1_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uv_duration"                 ) && newParameters["stage_1_uv_duration"                 ] != oldParameters["stage_1_uv_duration"                 ]) { retry = true; setup_sendCommand(24064, 235, "", newParameters["stage_1_uv_duration"                 ]); }
        if(newParameters.hasOwnProperty("stage_1_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_1_ov_duration"                 ) && newParameters["stage_1_ov_duration"                 ] != oldParameters["stage_1_ov_duration"                 ]) { retry = true; setup_sendCommand(24064, 236, "", newParameters["stage_1_ov_duration"                 ]); }
        if(newParameters.hasOwnProperty("stage_1_uf_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uf_duration"                 ) && newParameters["stage_1_uf_duration"                 ] != oldParameters["stage_1_uf_duration"                 ]) { retry = true; setup_sendCommand(24064, 237, "", newParameters["stage_1_uf_duration"                 ]); }
        if(newParameters.hasOwnProperty("stage_1_of_duration"                 ) && oldParameters.hasOwnProperty("stage_1_of_duration"                 ) && newParameters["stage_1_of_duration"                 ] != oldParameters["stage_1_of_duration"                 ]) { retry = true; setup_sendCommand(24064, 238, "", newParameters["stage_1_of_duration"                 ]); }
        if(newParameters.hasOwnProperty("stage_2_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"                ) && newParameters["stage_2_uv_threshold"                ] != oldParameters["stage_2_uv_threshold"                ]) { retry = true; setup_sendCommand(24064, 239, "", newParameters["stage_2_uv_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_2_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"                ) && newParameters["stage_2_ov_threshold"                ] != oldParameters["stage_2_ov_threshold"                ]) { retry = true; setup_sendCommand(24064, 240, "", newParameters["stage_2_ov_threshold"                ]); }
        if(newParameters.hasOwnProperty("stage_2_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_2_uv_duration"                 ) && newParameters["stage_2_uv_duration"                 ] != oldParameters["stage_2_uv_duration"                 ]) { retry = true; setup_sendCommand(24064, 243, "", newParameters["stage_2_uv_duration"                 ]); }
        if(newParameters.hasOwnProperty("stage_2_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_2_ov_duration"                 ) && newParameters["stage_2_ov_duration"                 ] != oldParameters["stage_2_ov_duration"                 ]) { retry = true; setup_sendCommand(24064, 244, "", newParameters["stage_2_ov_duration"                 ]); }
        if(newParameters.hasOwnProperty("qu_point_1_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_1_voltage"                  ) && newParameters["qu_point_1_voltage"                  ] != oldParameters["qu_point_1_voltage"                  ]) { retry = true; setup_sendCommand(24064, 251, "", newParameters["qu_point_1_voltage"                  ]); }
        if(newParameters.hasOwnProperty("qu_point_2_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_2_voltage"                  ) && newParameters["qu_point_2_voltage"                  ] != oldParameters["qu_point_2_voltage"                  ]) { retry = true; setup_sendCommand(24064, 252, "", newParameters["qu_point_2_voltage"                  ]); }
        if(newParameters.hasOwnProperty("qu_point_3_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_3_voltage"                  ) && newParameters["qu_point_3_voltage"                  ] != oldParameters["qu_point_3_voltage"                  ]) { retry = true; setup_sendCommand(24064, 253, "", newParameters["qu_point_3_voltage"                  ]); }
        if(newParameters.hasOwnProperty("qu_point_4_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_4_voltage"                  ) && newParameters["qu_point_4_voltage"                  ] != oldParameters["qu_point_4_voltage"                  ]) { retry = true; setup_sendCommand(24064, 254, "", newParameters["qu_point_4_voltage"                  ]); }
        if(newParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && newParameters["qu_point_1_reactive_power"           ] != oldParameters["qu_point_1_reactive_power"           ]) { retry = true; setup_sendCommand(24064, 255, "", newParameters["qu_point_1_reactive_power"           ]); }
        if(newParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && newParameters["qu_point_4_reactive_power"           ] != oldParameters["qu_point_4_reactive_power"           ]) { retry = true; setup_sendCommand(24064, 258, "", newParameters["qu_point_4_reactive_power"           ]); }
        if(newParameters.hasOwnProperty("qu_time_constant"                    ) && oldParameters.hasOwnProperty("qu_time_constant"                    ) && newParameters["qu_time_constant"                    ] != oldParameters["qu_time_constant"                    ]) { retry = true; setup_sendCommand(24064, 260, "", newParameters["qu_time_constant"                    ]); }
        if(newParameters.hasOwnProperty("qu_enter_power"                      ) && oldParameters.hasOwnProperty("qu_enter_power"                      ) && newParameters["qu_enter_power"                      ] != oldParameters["qu_enter_power"                      ]) { retry = true; setup_sendCommand(24064, 261, "", newParameters["qu_enter_power"                      ]); }
        if(newParameters.hasOwnProperty("qu_exit_power"                       ) && oldParameters.hasOwnProperty("qu_exit_power"                       ) && newParameters["qu_exit_power"                       ] != oldParameters["qu_exit_power"                       ]) { retry = true; setup_sendCommand(24064, 262, "", newParameters["qu_exit_power"                       ]); }
        if(newParameters.hasOwnProperty("cosfp_point_b_power"                 ) && oldParameters.hasOwnProperty("cosfp_point_b_power"                 ) && newParameters["cosfp_point_b_power"                 ] != oldParameters["cosfp_point_b_power"                 ]) { retry = true; setup_sendCommand(24064, 272, "", newParameters["cosfp_point_b_power"                 ]); }
        if(newParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && newParameters["cosfp_enter_voltage"                 ] != oldParameters["cosfp_enter_voltage"                 ]) { retry = true; setup_sendCommand(24064, 277, "", newParameters["cosfp_enter_voltage"                 ]); }
        if(newParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && newParameters["cosfp_exit_voltage"                  ] != oldParameters["cosfp_exit_voltage"                  ]) { retry = true; setup_sendCommand(24064, 278, "", newParameters["cosfp_exit_voltage"                  ]); }
        if(newParameters.hasOwnProperty("lvrt_switch"                         ) && oldParameters.hasOwnProperty("lvrt_switch"                         ) && newParameters["lvrt_switch"                         ] != oldParameters["lvrt_switch"                         ]) { retry = true; setup_sendCommand(24064, 291, "", newParameters["lvrt_switch"                         ]); }
        if(newParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && newParameters["lvrt_enter_voltage"                  ] != oldParameters["lvrt_enter_voltage"                  ]) { retry = true; setup_sendCommand(24064, 292, "", newParameters["lvrt_enter_voltage"                  ]); }
        if(newParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && newParameters["lvrt_exit_voltage"                   ] != oldParameters["lvrt_exit_voltage"                   ]) { retry = true; setup_sendCommand(24064, 293, "", newParameters["lvrt_exit_voltage"                   ]); }
        if(newParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && newParameters["lvrt_point_5_voltage"                ] != oldParameters["lvrt_point_5_voltage"                ]) { retry = true; setup_sendCommand(24064, 298, "", newParameters["lvrt_point_5_voltage"                ]); }
        if(newParameters.hasOwnProperty("lvrt_point_1_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"               ) && newParameters["lvrt_point_1_duration"               ] != oldParameters["lvrt_point_1_duration"               ]) { retry = true; setup_sendCommand(24064, 299, "", newParameters["lvrt_point_1_duration"               ]); }
        if(newParameters.hasOwnProperty("lvrt_point_2_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"               ) && newParameters["lvrt_point_2_duration"               ] != oldParameters["lvrt_point_2_duration"               ]) { retry = true; setup_sendCommand(24064, 300, "", newParameters["lvrt_point_2_duration"               ]); }
        if(newParameters.hasOwnProperty("lvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"               ) && newParameters["lvrt_point_3_duration"               ] != oldParameters["lvrt_point_3_duration"               ]) { retry = true; setup_sendCommand(24064, 301, "", newParameters["lvrt_point_3_duration"               ]); }
        if(newParameters.hasOwnProperty("lvrt_point_4_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"               ) && newParameters["lvrt_point_4_duration"               ] != oldParameters["lvrt_point_4_duration"               ]) { retry = true; setup_sendCommand(24064, 302, "", newParameters["lvrt_point_4_duration"               ]); }
        if(newParameters.hasOwnProperty("lvrt_point_5_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"               ) && newParameters["lvrt_point_5_duration"               ] != oldParameters["lvrt_point_5_duration"               ]) { retry = true; setup_sendCommand(24064, 303, "", newParameters["lvrt_point_5_duration"               ]); }
        if(newParameters.hasOwnProperty("hvrt_switch"                         ) && oldParameters.hasOwnProperty("hvrt_switch"                         ) && newParameters["hvrt_switch"                         ] != oldParameters["hvrt_switch"                         ]) { retry = true; setup_sendCommand(24064, 311, "", newParameters["hvrt_switch"                         ]); }
        if(newParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && newParameters["hvrt_enter_voltage"                  ] != oldParameters["hvrt_enter_voltage"                  ]) { retry = true; setup_sendCommand(24064, 312, "", newParameters["hvrt_enter_voltage"                  ]); }
        if(newParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && newParameters["hvrt_exit_voltage"                   ] != oldParameters["hvrt_exit_voltage"                   ]) { retry = true; setup_sendCommand(24064, 313, "", newParameters["hvrt_exit_voltage"                   ]); }
        if(newParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && newParameters["hvrt_point_1_voltage"                ] != oldParameters["hvrt_point_1_voltage"                ]) { retry = true; setup_sendCommand(24064, 314, "", newParameters["hvrt_point_1_voltage"                ]); }
        if(newParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && newParameters["hvrt_point_2_voltage"                ] != oldParameters["hvrt_point_2_voltage"                ]) { retry = true; setup_sendCommand(24064, 315, "", newParameters["hvrt_point_2_voltage"                ]); }
        if(newParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && newParameters["hvrt_point_3_voltage"                ] != oldParameters["hvrt_point_3_voltage"                ]) { retry = true; setup_sendCommand(24064, 316, "", newParameters["hvrt_point_3_voltage"                ]); }
        if(newParameters.hasOwnProperty("hvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"               ) && newParameters["hvrt_point_3_duration"               ] != oldParameters["hvrt_point_3_duration"               ]) { retry = true; setup_sendCommand(24064, 319, "", newParameters["hvrt_point_3_duration"               ]); }
        if(newParameters.hasOwnProperty("pu_time_constant"                    ) && oldParameters.hasOwnProperty("pu_time_constant"                    ) && newParameters["pu_time_constant"                    ] != oldParameters["pu_time_constant"                    ]) { retry = true; setup_sendCommand(24064, 336, "", newParameters["pu_time_constant"                    ]); }
        if(newParameters.hasOwnProperty("lfsmo_threshold"                     ) && oldParameters.hasOwnProperty("lfsmo_threshold"                     ) && newParameters["lfsmo_threshold"                     ] != oldParameters["lfsmo_threshold"                     ]) { retry = true; setup_sendCommand(24064, 342, "", newParameters["lfsmo_threshold"                     ]); }
        if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && newParameters["lfsmo_end_point_frequency"           ] != oldParameters["lfsmo_end_point_frequency"           ]) { retry = true; setup_sendCommand(24064, 344, "", newParameters["lfsmo_end_point_frequency"           ]); }
        if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && newParameters["lfsmo_power_recovery_rate"           ] != oldParameters["lfsmo_power_recovery_rate"           ]) { retry = true; setup_sendCommand(24064, 348, "", newParameters["lfsmo_power_recovery_rate"           ]); }
        if(newParameters.hasOwnProperty("lfsmo_droop"                         ) && oldParameters.hasOwnProperty("lfsmo_droop"                         ) && newParameters["lfsmo_droop"                         ] != oldParameters["lfsmo_droop"                         ]) { retry = true; setup_sendCommand(24064, 349, "", newParameters["lfsmo_droop"                         ]); }
        if(newParameters.hasOwnProperty("lfsmo_slope"                         ) && oldParameters.hasOwnProperty("lfsmo_slope"                         ) && newParameters["lfsmo_slope"                         ] != oldParameters["lfsmo_slope"                         ]) { retry = true; setup_sendCommand(24064, 350, "", newParameters["lfsmo_slope"                         ]); }
        if(newParameters.hasOwnProperty("battery_type"                        ) && oldParameters.hasOwnProperty("battery_type"                        ) && newParameters["battery_type"                        ] != oldParameters["battery_type"                        ]) { retry = true; setup_sendCommand(24064, 401, "", newParameters["battery_type"                        ]); }
        if(newParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && newParameters["battery_cutoff_voltage_ongrid"       ] != oldParameters["battery_cutoff_voltage_ongrid"       ]) { retry = true; setup_sendCommand(24064, 411, "", newParameters["battery_cutoff_voltage_ongrid"       ]); }
        if(newParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && newParameters["battery_cutoff_voltage_offgrid"      ] != oldParameters["battery_cutoff_voltage_offgrid"      ]) { retry = true; setup_sendCommand(24064, 412, "", newParameters["battery_cutoff_voltage_offgrid"      ]); }
        if(newParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && oldParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && newParameters["battery_recovery_voltage_ongrid"     ] != oldParameters["battery_recovery_voltage_ongrid"     ]) { retry = true; setup_sendCommand(24064, 413, "", newParameters["battery_recovery_voltage_ongrid"     ]); }
        if(newParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && oldParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && newParameters["battery_recovery_voltage_offgrid"    ] != oldParameters["battery_recovery_voltage_offgrid"    ]) { retry = true; setup_sendCommand(24064, 414, "", newParameters["battery_recovery_voltage_offgrid"    ]); }
        if(newParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && oldParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && newParameters["battery_bulk_charge_voltage"         ] != oldParameters["battery_bulk_charge_voltage"         ]) { retry = true; setup_sendCommand(24064, 415, "", newParameters["battery_bulk_charge_voltage"         ]); }
        if(newParameters.hasOwnProperty("battery_float_charge_voltage"        ) && oldParameters.hasOwnProperty("battery_float_charge_voltage"        ) && newParameters["battery_float_charge_voltage"        ] != oldParameters["battery_float_charge_voltage"        ]) { retry = true; setup_sendCommand(24064, 416, "", newParameters["battery_float_charge_voltage"        ]); }
        if(newParameters.hasOwnProperty("battery_max_charge_current"          ) && oldParameters.hasOwnProperty("battery_max_charge_current"          ) && newParameters["battery_max_charge_current"          ] != oldParameters["battery_max_charge_current"          ]) { retry = true; setup_sendCommand(24064, 417, "", newParameters["battery_max_charge_current"          ]); }
        if(newParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && oldParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && newParameters["battery_max_discharge_current_ongrid"] != oldParameters["battery_max_discharge_current_ongrid"]) { retry = true; setup_sendCommand(24064, 418, "", newParameters["battery_max_discharge_current_ongrid"]); }

        if(!retry) {
            // Restore initial BMS battery connect value before moving to next step (for all h-Series systems)
            if(initialBmsConnectValue !== null) {
                try {
                    let finalBmsValue = initialBmsConnectValue;
                    // If initial value was not "0", set to "2" for all h-Series systems
                    // (Value "1" is only used during communication checking)
                    if(initialBmsConnectValue !== "0") {
                        finalBmsValue = "2";
                    }
                    // Otherwise, restore to "0" if it was "0"
                    const restoreResponse = await $.get({
                        url: `api.php?set=command&type=24064&entity=10003&text2=${finalBmsValue}`
                    });
                    if(restoreResponse === "1") {
                        // Wait for BMS parameter to be restored in settings
                        await waitForSettingsParameter("Inverter", "10003", "s1", finalBmsValue);
                    }
                } catch (error) {
                    console.log("Warning: Could not restore initial BMS battery connect value:", error);
                }
                // Reset the stored value
                initialBmsConnectValue = null;
            }
            // Show Success
            $(".setting-progress span").html(lang.system_setup.msg_setting_success).css("color", "#28a745");
            $("#notif").removeClass("loading error success").addClass("success");
            // Next Step
            await sleep(2500);
            window.location.href = "system_test.php";
        } else {
            checkParametersCounter++;
            if(checkParametersCounter < 5) {
                console.log(`RETRYING, ${checkParametersCounter + 1}/5, PLEASE WAIT!`);
            } else {

                // Show Error - Parameter Not Accepted

                     if(newParameters["regulationMode"] != oldParameters["regulationMode"]) showSettingParametersError("Problem when setting regulationMode");
                else if(newParameters["extsolMode"    ] != oldParameters["extsolMode"    ]) showSettingParametersError("Problem when setting extsolMode"    );
                else if(newParameters["meter1Mode"    ] != oldParameters["meter1Mode"    ]) showSettingParametersError("Problem when setting meter1Mode"    );
                else if(newParameters["meter2Mode"    ] != oldParameters["meter2Mode"    ]) showSettingParametersError("Problem when setting meter2Mode"    );
                else if(newParameters["meter3Mode"    ] != oldParameters["meter3Mode"    ]) showSettingParametersError("Problem when setting meter3Mode"    );
                else if(newParameters["meter4Mode"    ] != oldParameters["meter4Mode"    ]) showSettingParametersError("Problem when setting meter4Mode"    );
                else if(newParameters["meter1Label"   ] != oldParameters["meter1Label"   ]) showSettingParametersError("Problem when setting meter1Label"   );
                else if(newParameters["meter2Label"   ] != oldParameters["meter2Label"   ]) showSettingParametersError("Problem when setting meter2Label"   );
                else if(newParameters["meter3Label"   ] != oldParameters["meter3Label"   ]) showSettingParametersError("Problem when setting meter3Label"   );
                else if(newParameters["meter4Label"   ] != oldParameters["meter4Label"   ]) showSettingParametersError("Problem when setting meter4Label"   );

                else if(newParameters["controlMaxChargingPowerACMode"] != oldParameters["controlMaxChargingPowerACMode"]) showSettingParametersError("Problem when setting controlMaxChargingPowerACMode");
                else if(newParameters["controlMaxInjectionPowerMode" ] != oldParameters["controlMaxInjectionPowerMode" ]) showSettingParametersError("Problem when setting controlMaxInjectionPowerMode" );

                else if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) showSettingParametersError("Problem when setting prepareBatteryExtension");
                else if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) showSettingParametersError("Problem when setting cloudSet"               );

                else if(newParameters.hasOwnProperty("reactive_mode"                       ) && oldParameters.hasOwnProperty("reactive_mode"                       ) && newParameters["reactive_mode"                       ] != oldParameters["reactive_mode"                       ]) showSettingParametersError("Problem when setting reactive_mode"                       );
                else if(newParameters.hasOwnProperty("pf_mode_power_factor"                ) && oldParameters.hasOwnProperty("pf_mode_power_factor"                ) && newParameters["pf_mode_power_factor"                ] != oldParameters["pf_mode_power_factor"                ]) showSettingParametersError("Problem when setting pf_mode_power_factor"                );
                else if(newParameters.hasOwnProperty("qt_mode_reactive_power"              ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"              ) && newParameters["qt_mode_reactive_power"              ] != oldParameters["qt_mode_reactive_power"              ]) showSettingParametersError("Problem when setting qt_mode_reactive_power"              );
                else if(newParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"         ) && newParameters["overvoltage_10min_threshold"         ] != oldParameters["overvoltage_10min_threshold"         ]) showSettingParametersError("Problem when setting overvoltage_10min_threshold"         );
                else if(newParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"          ) && newParameters["grid_connect_lower_voltage"          ] != oldParameters["grid_connect_lower_voltage"          ]) showSettingParametersError("Problem when setting grid_connect_lower_voltage"          );
                else if(newParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"          ) && newParameters["grid_connect_upper_voltage"          ] != oldParameters["grid_connect_upper_voltage"          ]) showSettingParametersError("Problem when setting grid_connect_upper_voltage"          );
                else if(newParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"        ) && newParameters["grid_connect_lower_frequency"        ] != oldParameters["grid_connect_lower_frequency"        ]) showSettingParametersError("Problem when setting grid_connect_lower_frequency"        );
                else if(newParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"        ) && newParameters["grid_connect_upper_frequency"        ] != oldParameters["grid_connect_upper_frequency"        ]) showSettingParametersError("Problem when setting grid_connect_upper_frequency"        );
                else if(newParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"       ) && newParameters["wait_time_before_grid_connect"       ] != oldParameters["wait_time_before_grid_connect"       ]) showSettingParametersError("Problem when setting wait_time_before_grid_connect"       );
                else if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"        ) && newParameters["grid_reconnect_upper_voltage"        ] != oldParameters["grid_reconnect_upper_voltage"        ]) showSettingParametersError("Problem when setting grid_reconnect_upper_voltage"        );
                else if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect"     ) && newParameters["wait_time_before_grid_reconnect"     ] != oldParameters["wait_time_before_grid_reconnect"     ]) showSettingParametersError("Problem when setting wait_time_before_grid_reconnect"     );
                else if(newParameters.hasOwnProperty("stage_1_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"                ) && newParameters["stage_1_uv_threshold"                ] != oldParameters["stage_1_uv_threshold"                ]) showSettingParametersError("Problem when setting stage_1_uv_threshold"                );
                else if(newParameters.hasOwnProperty("stage_1_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"                ) && newParameters["stage_1_ov_threshold"                ] != oldParameters["stage_1_ov_threshold"                ]) showSettingParametersError("Problem when setting stage_1_ov_threshold"                );
                else if(newParameters.hasOwnProperty("stage_1_uf_threshold"                ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"                ) && newParameters["stage_1_uf_threshold"                ] != oldParameters["stage_1_uf_threshold"                ]) showSettingParametersError("Problem when setting stage_1_uf_threshold"                );
                else if(newParameters.hasOwnProperty("stage_1_of_threshold"                ) && oldParameters.hasOwnProperty("stage_1_of_threshold"                ) && newParameters["stage_1_of_threshold"                ] != oldParameters["stage_1_of_threshold"                ]) showSettingParametersError("Problem when setting stage_1_of_threshold"                );
                else if(newParameters.hasOwnProperty("stage_1_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uv_duration"                 ) && newParameters["stage_1_uv_duration"                 ] != oldParameters["stage_1_uv_duration"                 ]) showSettingParametersError("Problem when setting stage_1_uv_duration"                 );
                else if(newParameters.hasOwnProperty("stage_1_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_1_ov_duration"                 ) && newParameters["stage_1_ov_duration"                 ] != oldParameters["stage_1_ov_duration"                 ]) showSettingParametersError("Problem when setting stage_1_ov_duration"                 );
                else if(newParameters.hasOwnProperty("stage_1_uf_duration"                 ) && oldParameters.hasOwnProperty("stage_1_uf_duration"                 ) && newParameters["stage_1_uf_duration"                 ] != oldParameters["stage_1_uf_duration"                 ]) showSettingParametersError("Problem when setting stage_1_uf_duration"                 );
                else if(newParameters.hasOwnProperty("stage_1_of_duration"                 ) && oldParameters.hasOwnProperty("stage_1_of_duration"                 ) && newParameters["stage_1_of_duration"                 ] != oldParameters["stage_1_of_duration"                 ]) showSettingParametersError("Problem when setting stage_1_of_duration"                 );
                else if(newParameters.hasOwnProperty("stage_2_uv_threshold"                ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"                ) && newParameters["stage_2_uv_threshold"                ] != oldParameters["stage_2_uv_threshold"                ]) showSettingParametersError("Problem when setting stage_2_uv_threshold"                );
                else if(newParameters.hasOwnProperty("stage_2_ov_threshold"                ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"                ) && newParameters["stage_2_ov_threshold"                ] != oldParameters["stage_2_ov_threshold"                ]) showSettingParametersError("Problem when setting stage_2_ov_threshold"                );
                else if(newParameters.hasOwnProperty("stage_2_uv_duration"                 ) && oldParameters.hasOwnProperty("stage_2_uv_duration"                 ) && newParameters["stage_2_uv_duration"                 ] != oldParameters["stage_2_uv_duration"                 ]) showSettingParametersError("Problem when setting stage_2_uv_duration"                 );
                else if(newParameters.hasOwnProperty("stage_2_ov_duration"                 ) && oldParameters.hasOwnProperty("stage_2_ov_duration"                 ) && newParameters["stage_2_ov_duration"                 ] != oldParameters["stage_2_ov_duration"                 ]) showSettingParametersError("Problem when setting stage_2_ov_duration"                 );
                else if(newParameters.hasOwnProperty("qu_point_1_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_1_voltage"                  ) && newParameters["qu_point_1_voltage"                  ] != oldParameters["qu_point_1_voltage"                  ]) showSettingParametersError("Problem when setting qu_point_1_voltage"                  );
                else if(newParameters.hasOwnProperty("qu_point_2_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_2_voltage"                  ) && newParameters["qu_point_2_voltage"                  ] != oldParameters["qu_point_2_voltage"                  ]) showSettingParametersError("Problem when setting qu_point_2_voltage"                  );
                else if(newParameters.hasOwnProperty("qu_point_3_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_3_voltage"                  ) && newParameters["qu_point_3_voltage"                  ] != oldParameters["qu_point_3_voltage"                  ]) showSettingParametersError("Problem when setting qu_point_3_voltage"                  );
                else if(newParameters.hasOwnProperty("qu_point_4_voltage"                  ) && oldParameters.hasOwnProperty("qu_point_4_voltage"                  ) && newParameters["qu_point_4_voltage"                  ] != oldParameters["qu_point_4_voltage"                  ]) showSettingParametersError("Problem when setting qu_point_4_voltage"                  );
                else if(newParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"           ) && newParameters["qu_point_1_reactive_power"           ] != oldParameters["qu_point_1_reactive_power"           ]) showSettingParametersError("Problem when setting qu_point_1_reactive_power"           );
                else if(newParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"           ) && newParameters["qu_point_4_reactive_power"           ] != oldParameters["qu_point_4_reactive_power"           ]) showSettingParametersError("Problem when setting qu_point_4_reactive_power"           );
                else if(newParameters.hasOwnProperty("qu_time_constant"                    ) && oldParameters.hasOwnProperty("qu_time_constant"                    ) && newParameters["qu_time_constant"                    ] != oldParameters["qu_time_constant"                    ]) showSettingParametersError("Problem when setting qu_time_constant"                    );
                else if(newParameters.hasOwnProperty("qu_enter_power"                      ) && oldParameters.hasOwnProperty("qu_enter_power"                      ) && newParameters["qu_enter_power"                      ] != oldParameters["qu_enter_power"                      ]) showSettingParametersError("Problem when setting qu_enter_power"                      );
                else if(newParameters.hasOwnProperty("qu_exit_power"                       ) && oldParameters.hasOwnProperty("qu_exit_power"                       ) && newParameters["qu_exit_power"                       ] != oldParameters["qu_exit_power"                       ]) showSettingParametersError("Problem when setting qu_exit_power"                       );
                else if(newParameters.hasOwnProperty("cosfp_point_b_power"                 ) && oldParameters.hasOwnProperty("cosfp_point_b_power"                 ) && newParameters["cosfp_point_b_power"                 ] != oldParameters["cosfp_point_b_power"                 ]) showSettingParametersError("Problem when setting cosfp_point_b_power"                 );
                else if(newParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"                 ) && newParameters["cosfp_enter_voltage"                 ] != oldParameters["cosfp_enter_voltage"                 ]) showSettingParametersError("Problem when setting cosfp_enter_voltage"                 );
                else if(newParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"                  ) && newParameters["cosfp_exit_voltage"                  ] != oldParameters["cosfp_exit_voltage"                  ]) showSettingParametersError("Problem when setting cosfp_exit_voltage"                  );
                else if(newParameters.hasOwnProperty("lvrt_switch"                         ) && oldParameters.hasOwnProperty("lvrt_switch"                         ) && newParameters["lvrt_switch"                         ] != oldParameters["lvrt_switch"                         ]) showSettingParametersError("Problem when setting lvrt_switch"                         );
                else if(newParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"                  ) && newParameters["lvrt_enter_voltage"                  ] != oldParameters["lvrt_enter_voltage"                  ]) showSettingParametersError("Problem when setting lvrt_enter_voltage"                  );
                else if(newParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"                   ) && newParameters["lvrt_exit_voltage"                   ] != oldParameters["lvrt_exit_voltage"                   ]) showSettingParametersError("Problem when setting lvrt_exit_voltage"                   );
                else if(newParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"                ) && newParameters["lvrt_point_5_voltage"                ] != oldParameters["lvrt_point_5_voltage"                ]) showSettingParametersError("Problem when setting lvrt_point_5_voltage"                );
                else if(newParameters.hasOwnProperty("lvrt_point_1_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"               ) && newParameters["lvrt_point_1_duration"               ] != oldParameters["lvrt_point_1_duration"               ]) showSettingParametersError("Problem when setting lvrt_point_1_duration"               );
                else if(newParameters.hasOwnProperty("lvrt_point_2_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"               ) && newParameters["lvrt_point_2_duration"               ] != oldParameters["lvrt_point_2_duration"               ]) showSettingParametersError("Problem when setting lvrt_point_2_duration"               );
                else if(newParameters.hasOwnProperty("lvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"               ) && newParameters["lvrt_point_3_duration"               ] != oldParameters["lvrt_point_3_duration"               ]) showSettingParametersError("Problem when setting lvrt_point_3_duration"               );
                else if(newParameters.hasOwnProperty("lvrt_point_4_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"               ) && newParameters["lvrt_point_4_duration"               ] != oldParameters["lvrt_point_4_duration"               ]) showSettingParametersError("Problem when setting lvrt_point_4_duration"               );
                else if(newParameters.hasOwnProperty("lvrt_point_5_duration"               ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"               ) && newParameters["lvrt_point_5_duration"               ] != oldParameters["lvrt_point_5_duration"               ]) showSettingParametersError("Problem when setting lvrt_point_5_duration"               );
                else if(newParameters.hasOwnProperty("hvrt_switch"                         ) && oldParameters.hasOwnProperty("hvrt_switch"                         ) && newParameters["hvrt_switch"                         ] != oldParameters["hvrt_switch"                         ]) showSettingParametersError("Problem when setting hvrt_switch"                         );
                else if(newParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"                  ) && newParameters["hvrt_enter_voltage"                  ] != oldParameters["hvrt_enter_voltage"                  ]) showSettingParametersError("Problem when setting hvrt_enter_voltage"                  );
                else if(newParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"                   ) && newParameters["hvrt_exit_voltage"                   ] != oldParameters["hvrt_exit_voltage"                   ]) showSettingParametersError("Problem when setting hvrt_exit_voltage"                   );
                else if(newParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"                ) && newParameters["hvrt_point_1_voltage"                ] != oldParameters["hvrt_point_1_voltage"                ]) showSettingParametersError("Problem when setting hvrt_point_1_voltage"                );
                else if(newParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"                ) && newParameters["hvrt_point_2_voltage"                ] != oldParameters["hvrt_point_2_voltage"                ]) showSettingParametersError("Problem when setting hvrt_point_2_voltage"                );
                else if(newParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"                ) && newParameters["hvrt_point_3_voltage"                ] != oldParameters["hvrt_point_3_voltage"                ]) showSettingParametersError("Problem when setting hvrt_point_3_voltage"                );
                else if(newParameters.hasOwnProperty("hvrt_point_3_duration"               ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"               ) && newParameters["hvrt_point_3_duration"               ] != oldParameters["hvrt_point_3_duration"               ]) showSettingParametersError("Problem when setting hvrt_point_3_duration"               );
                else if(newParameters.hasOwnProperty("pu_time_constant"                    ) && oldParameters.hasOwnProperty("pu_time_constant"                    ) && newParameters["pu_time_constant"                    ] != oldParameters["pu_time_constant"                    ]) showSettingParametersError("Problem when setting pu_time_constant"                    );
                else if(newParameters.hasOwnProperty("lfsmo_threshold"                     ) && oldParameters.hasOwnProperty("lfsmo_threshold"                     ) && newParameters["lfsmo_threshold"                     ] != oldParameters["lfsmo_threshold"                     ]) showSettingParametersError("Problem when setting lfsmo_threshold"                     );
                else if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"           ) && newParameters["lfsmo_end_point_frequency"           ] != oldParameters["lfsmo_end_point_frequency"           ]) showSettingParametersError("Problem when setting lfsmo_end_point_frequency"           );
                else if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"           ) && newParameters["lfsmo_power_recovery_rate"           ] != oldParameters["lfsmo_power_recovery_rate"           ]) showSettingParametersError("Problem when setting lfsmo_power_recovery_rate"           );
                else if(newParameters.hasOwnProperty("lfsmo_droop"                         ) && oldParameters.hasOwnProperty("lfsmo_droop"                         ) && newParameters["lfsmo_droop"                         ] != oldParameters["lfsmo_droop"                         ]) showSettingParametersError("Problem when setting lfsmo_droop"                         );
                else if(newParameters.hasOwnProperty("lfsmo_slope"                         ) && oldParameters.hasOwnProperty("lfsmo_slope"                         ) && newParameters["lfsmo_slope"                         ] != oldParameters["lfsmo_slope"                         ]) showSettingParametersError("Problem when setting lfsmo_slope"                         );
                else if(newParameters.hasOwnProperty("battery_type"                        ) && oldParameters.hasOwnProperty("battery_type"                        ) && newParameters["battery_type"                        ] != oldParameters["battery_type"                        ]) showSettingParametersError("Problem when setting battery_type"                        );
                else if(newParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_ongrid"       ) && newParameters["battery_cutoff_voltage_ongrid"       ] != oldParameters["battery_cutoff_voltage_ongrid"       ]) showSettingParametersError("Problem when setting battery_cutoff_voltage_ongrid"       );
                else if(newParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && oldParameters.hasOwnProperty("battery_cutoff_voltage_offgrid"      ) && newParameters["battery_cutoff_voltage_offgrid"      ] != oldParameters["battery_cutoff_voltage_offgrid"      ]) showSettingParametersError("Problem when setting battery_cutoff_voltage_offgrid"      );
                else if(newParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && oldParameters.hasOwnProperty("battery_recovery_voltage_ongrid"     ) && newParameters["battery_recovery_voltage_ongrid"     ] != oldParameters["battery_recovery_voltage_ongrid"     ]) showSettingParametersError("Problem when setting battery_recovery_voltage_ongrid"     );
                else if(newParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && oldParameters.hasOwnProperty("battery_recovery_voltage_offgrid"    ) && newParameters["battery_recovery_voltage_offgrid"    ] != oldParameters["battery_recovery_voltage_offgrid"    ]) showSettingParametersError("Problem when setting battery_recovery_voltage_offgrid"    );
                else if(newParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && oldParameters.hasOwnProperty("battery_bulk_charge_voltage"         ) && newParameters["battery_bulk_charge_voltage"         ] != oldParameters["battery_bulk_charge_voltage"         ]) showSettingParametersError("Problem when setting battery_bulk_charge_voltage"         );
                else if(newParameters.hasOwnProperty("battery_float_charge_voltage"        ) && oldParameters.hasOwnProperty("battery_float_charge_voltage"        ) && newParameters["battery_float_charge_voltage"        ] != oldParameters["battery_float_charge_voltage"        ]) showSettingParametersError("Problem when setting battery_float_charge_voltage"        );
                else if(newParameters.hasOwnProperty("battery_max_charge_current"          ) && oldParameters.hasOwnProperty("battery_max_charge_current"          ) && newParameters["battery_max_charge_current"          ] != oldParameters["battery_max_charge_current"          ]) showSettingParametersError("Problem when setting battery_max_charge_current"          );
                else if(newParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && oldParameters.hasOwnProperty("battery_max_discharge_current_ongrid") && newParameters["battery_max_discharge_current_ongrid"] != oldParameters["battery_max_discharge_current_ongrid"]) showSettingParametersError("Problem when setting battery_max_discharge_current_ongrid");

                // Stop Sending Parameters And Activate Fields To Modify

                isSettingParameters = false;

                $(` #btnExtendedParameters,
                    #extended_lfsmoThreshold,
                    #extended_lfsmoDroop,
                    #extended_lfsmoSlope,
                    #extended_maxGridVoltage,
                    #extended_minGridVoltage,
                    #extended_maxGridFrequency,
                    #extended_minGridFrequency,
                    #extended_UeffOver1,
                    #extended_UeffUnder1,
                    #extended_UeffOver2,
                    #extended_UeffUnder2,
                    #extended_fOver1,
                    #extended_fUnder1,
                    #extended_UeffOver1Time,
                    #extended_UeffUnder1Time,
                    #extended_UeffOver2Time,
                    #extended_UeffUnder2Time,
                    #extended_fOver1Time,
                    #extended_fUnder1Time,
                    #extended_Ueff,
                    #extended_gridConnectDelay,
                    #extended_gridReconnectDelay,
                    #extended_puTime
                `).attr("disabled", false);

            }
        }
    } catch (error) {
        alert("E030. Please refresh the page! (Error while reading local settings table)");
    }

}
