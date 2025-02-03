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

var dataSettings = {};
var importedData = {};










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Helper Functions
*/

function isLiFePO   () { return $("#bx_battery_type_0").is(":checked"); }
function isNoBattery() { return $("#bx_battery_type_n").is(":checked"); }

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

function disableBtnNext() { $("#btn_next").attr("disabled", true); }










/*
    Helper Functions
*/

function allFieldsCorrect() {

    // Return If Empty Field
    if( $("#installation_date      ").val() == "" ||
        $("#bx_device              ").val() == "" ||
        $("#bx_box                 ").val() == "" ||
        $("#solar_wattpeak         ").val() == "" ||
        $("#solar_feedinlimitation ").val() == "" ||
        $("#reactive_mode          ").val() == "" ||
        $("#extended_lfsmoThreshold").val() == "" ||
        $("#extended_lfsmoDroop    ").val() == ""
    ) return false;

    // Return If Empty Syetem S/N
    if( isOldSys() && $("#system_co_sn").val() == ""
    ) return false;

    // LiFePO
    if(isLiFePO()) {
        if( $("#lifepo_bms          ").val() == "" ||
            $("#lifepo_serialnumbers").val() == ""
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
            $("#extended_gridReconnectDelay").val() == "" ||
            $("#extended_puTime            ").val() == ""
        ) return false;
    }

    return true;

}










/*
    Helper Functions
*/

function showSettingParametersError(errorStr) {
    clearInterval(checkParametersInterval);
    checkParametersInterval = undefined;
    isSettingParameters = false;
    $("#notif").removeClass("loading error success").addClass("error");
    $("#message").html(errorStr).css("color", "red");
    $("#btn_next").attr("disabled", false).unbind().on("click", () => { mainFormSubmit(); });
}










/*
    Helper Functions
*/

function verifySystem() {
    let isOK = false;
    $.post({
        url: "https://api.batterx.app/v2/install.php",
        async: false,
        data: {
            action : "verify_system",
            user   : customerEmail.trim(),
            system : isOldSys() ? $("#system_co_sn").val().trim() : "NEW"
        },
        error: () => { alert("E032. Please refresh the page! (Error while verifying system serialnumber in cloud)"); },
        success: (response) => {
            console.log(response);
            if(response === "1")
                isOK = true;
            else
                $("#errorSystemRegisteredWithOtherUser").modal("show");
        }
    });
    return isOK;
}

function verifyModulesLiFePO() {

    var system_serial = $("#system_co_sn").val();
    var bms       = [];
	var batteries = [];
	$("#lifepo_bms").val().trim().split("\n").forEach(sn => {
		if(sn.trim() != "") bms.push(sn.trim());
	});
	$("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
		if(sn.trim() != "") batteries.push(sn.trim());
	});

    var canContinue = true;
    batteries.forEach(sn => {
		if(canContinue) {
			canContinue = false;
			$.post({
				url: "https://api.batterx.app/v2/install.php",
				async: false,
				data: {
					action: "verify_battery",
					system: system_serial,
					serialnumber: sn.trim()
				},
				error: () => { alert("E015. Please refresh the page! (Error while verifying battery serialnumber in cloud)"); },
				success: (response) => {
					if(response === "1") {
						canContinue = true;
					} else {
						$("#errorBatterySerial").val(sn.trim());
						$("#errorBatteryNotExistOrWithOtherSystem").modal("show");
					}
				}
			});
		}
	});
    bms.forEach(sn => {
		if(canContinue) {
			canContinue = false;
			$.post({
				url: "https://api.batterx.app/v2/install.php",
				async: false,
				data: {
					action: "verify_bms",
					system: system_serial,
					serialnumber: sn.trim()
				},
				error: () => { alert("E015. Please refresh the page! (Error while verifying bms serialnumber in cloud)"); },
				success: (response) => {
					if(response === "1") {
						canContinue = true;
					} else {
						$("#errorBmsSerial").val(sn.trim());
						$("#errorBmsNotExistOrWithOtherSystem").modal("show");
					}
				}
			});
		}
	});

    if(!canContinue) {
        // Enable Battery Fields
        $(` #lifepo_bms,
            #lifepo_serialnumbers
        `).attr("disabled", false);
        // Hide Loading Screen
        isSettingParameters = false;
        $("#btn_next").attr("disabled", false);
        $(".setting-progress").addClass("d-none");
    }

    // Return Result
    return canContinue;

}

function verifyModulesCommunication(callback) {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E022. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {
            console.log(response);
            if(!response || typeof response != "object")
                return alert("E023. Please refresh the page! (Missing or malformed data in local currentstate table)");
            dataCurrentState = JSON.parse(JSON.stringify(response));
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
            } else {
                // Set Session Variables
                callback(true);
            }
        }
    });
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
            $("#system_co_sn").val(json.system.serialnumber).attr("disabled", true);
            systemSerial = json.system.serialnumber;
        }
    }

    // Set Device Info
    if(json.hasOwnProperty("device")) {
        if(json.device.hasOwnProperty("solar_watt_peak"))
            $("#solar_wattpeak").val(json.device.solar_watt_peak);
        if(json.device.hasOwnProperty("grid_feedin_limitation"))
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
        // Multiple Batteries (LiFePO Only)
        if(json.batteries.length > 0) {
            var tempArr = [];
			json.batteries.forEach(battery => { tempArr.push(battery.serialnumber); });
			$("#lifepo_serialnumbers").val(tempArr.join("\n"));
			tempArr = [];
			json.batteries_bms.forEach(bms => { tempArr.push(bms.serialnumber); });
			$("#lifepo_bms").val(tempArr.join("\n"));
        }
        // No Batteries
        else {
            $("#bx_battery_type_n").prop("checked", true).trigger("change");
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

    // Inverter Parameters
    if(response.hasOwnProperty("Inverter")) {
        var temp = response["Inverter"];
        // Extended Parameters
        if(temp.hasOwnProperty("342")) $("#extended_lfsmoThreshold").val(temp["342"].s1);
        if(temp.hasOwnProperty("349")) $("#extended_lfsmoDroop    ").val(temp["349"].s1);
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

}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Show|Hide Import Data From Cloud Button
*/

$("#system_co_sn").on("change", () => showImportDataFromCloud());

function showImportDataFromCloud() {

    $("#bxHome").removeClass("can-import-cloud-data");

    if(isOldSys() && $("#system_co_sn").val().trim() == "") return;
    if(Object.keys(dataSettings).length == 0) return;
    if(!dataSettings.hasOwnProperty("CloudSet")) return;
    if(!dataSettings["CloudSet"].hasOwnProperty("0")) return;
    if(!dataSettings["CloudSet"]["0"].hasOwnProperty("mode")) return;
    if(dataSettings["CloudSet"]["0"]["mode"].toString() != "0") return;

    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action : "get_system_data",
            system : $("#system_co_sn").val().trim(),
            customer : customerEmail.trim()
        },
        error: () => { alert("E004. Please refresh the page! (Error while reading system data from cloud)"); },
        success: (json) => {
            console.log(json);
            if(isOldSys() && !json) {
                alert(lang.system_setup.msg_system_with_sn_does_not_exist.replace("123", $("#system_co_sn").val().trim()));
                $("#system_co_sn").val("");
            }
            if(!json) return;
            importedData = json;
            $("#bxHome").addClass("can-import-cloud-data");
        }
    });

}










/*
    Show Imported Data From Cloud
*/

$("#btnImportDataFromCloud").on("click", () => {
    importSystemInfo();
    importSystemSettings();
    $("#bxHome").removeClass("can-import-cloud-data");
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

function importSystemSettings() {

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
    */

    var totalSteps = 13;
    var temp = false; // Function Inside Function
    temp = response.hasOwnProperty("BxOutPin"            ) && response["BxOutPin"            ].hasOwnProperty("1") ? response["BxOutPin"            ]["1"] : false; importSystemSettings_logSetting(totalSteps,  1, "BxOutPin"            , "1", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BxOutPin"            ) && response["BxOutPin"            ].hasOwnProperty("2") ? response["BxOutPin"            ]["2"] : false; importSystemSettings_logSetting(totalSteps,  2, "BxOutPin"            , "2", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BxOutPin"            ) && response["BxOutPin"            ].hasOwnProperty("3") ? response["BxOutPin"            ]["3"] : false; importSystemSettings_logSetting(totalSteps,  3, "BxOutPin"            , "3", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BxOutPin"            ) && response["BxOutPin"            ].hasOwnProperty("4") ? response["BxOutPin"            ]["4"] : false; importSystemSettings_logSetting(totalSteps,  4, "BxOutPin"            , "4", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("SystemMode"          ) && response["SystemMode"          ].hasOwnProperty("0") ? response["SystemMode"          ]["0"] : false; importSystemSettings_logSetting(totalSteps,  5, "SystemMode"          , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("GridInjection"       ) && response["GridInjection"       ].hasOwnProperty("0") ? response["GridInjection"       ]["0"] : false; importSystemSettings_logSetting(totalSteps,  6, "GridInjection"       , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BatteryCharging"     ) && response["BatteryCharging"     ].hasOwnProperty("0") ? response["BatteryCharging"     ]["0"] : false; importSystemSettings_logSetting(totalSteps,  7, "BatteryCharging"     , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BatteryChargingAC"   ) && response["BatteryChargingAC"   ].hasOwnProperty("0") ? response["BatteryChargingAC"   ]["0"] : false; importSystemSettings_logSetting(totalSteps,  8, "BatteryChargingAC"   , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BatteryDischarging"  ) && response["BatteryDischarging"  ].hasOwnProperty("0") ? response["BatteryDischarging"  ]["0"] : false; importSystemSettings_logSetting(totalSteps,  9, "BatteryDischarging"  , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BatteryDischargingAC") && response["BatteryDischargingAC"].hasOwnProperty("0") ? response["BatteryDischargingAC"]["0"] : false; importSystemSettings_logSetting(totalSteps, 10, "BatteryDischargingAC", "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("IgnoreWarnings"      ) && response["IgnoreWarnings"      ].hasOwnProperty("0") ? response["IgnoreWarnings"      ]["0"] : false; importSystemSettings_logSetting(totalSteps, 11, "IgnoreWarnings"      , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("BatteryMinSoC"       ) && response["BatteryMinSoC"       ].hasOwnProperty("0") ? response["BatteryMinSoC"       ]["0"] : false; importSystemSettings_logSetting(totalSteps, 12, "BatteryMinSoC"       , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
    temp = response.hasOwnProperty("InjectionMode"       ) && response["InjectionMode"       ].hasOwnProperty("0") ? response["InjectionMode"       ]["0"] : false; importSystemSettings_logSetting(totalSteps, 13, "InjectionMode"       , "0", temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name], () => {
        // SHOW SUCCESS
        alert("Data imported successfully!");
        $("#importingDataFromCloud").modal("hide");
    }); }); }); }); }); }); }); }); }); }); }); }); });

}

function importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback) {
    $("#importingDataFromCloud_step").html(`<b>${currentStep} / ${totalSteps}</b>`);
    $("#importingDataFromCloud").modal("show");
    if(jsonArr.length == 0) return callback();
    $.get({
        url: `api.php?set=command&type=11&entity=0&text1=${entity} ${varName}&text2=${encodeURIComponent(JSON.stringify(jsonArr))}`,
        error: () => { alert("Error while writing the settings, please refresh the page! (E001)"); },
        success: (response) => {
            if(response != "1") return alert("Error while writing the settings, please refresh the page! (E002)");
            setTimeout(() => { importSystemSettings_waitUntilSet(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
        }
    });
}

function importSystemSettings_waitUntilSet(totalSteps, currentStep, varName, entity, jsonArr, callback) {
    $.get({
        url: "api.php?get=settings",
        error: () => { return setTimeout(() => { importSystemSettings_waitUntilSet(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000); },
        success: (response) => {
            
            console.log(response);
            
            if(!response || typeof response != "object") return setTimeout(() => { importSystemSettings_waitUntilSet(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            
            dataSettings = JSON.parse(JSON.stringify(response));

            if(!response.hasOwnProperty(varName) || !response[varName].hasOwnProperty(entity)) return alert("Error while writing the settings, please refresh the page! (E003) " + varName + " " + entity);

            if(jsonArr.length > 0 && response[varName][entity].mode != jsonArr[0]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 1 && response[varName][entity].v1   != jsonArr[1]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 2 && response[varName][entity].v2   != jsonArr[2]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 3 && response[varName][entity].v3   != jsonArr[3]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 4 && response[varName][entity].v4   != jsonArr[4]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 5 && response[varName][entity].v5   != jsonArr[5]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 6 && response[varName][entity].v6   != jsonArr[6]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 7 && response[varName][entity].s1   != jsonArr[7]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 8 && response[varName][entity].s2   != jsonArr[8]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);
            if(jsonArr.length > 9 && response[varName][entity].name != jsonArr[9]) return setTimeout(() => { importSystemSettings_logSetting(totalSteps, currentStep, varName, entity, jsonArr, callback); }, 5000);

            return callback();
        }
    });
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
    $(`#battery_section_0, #battery_section_n`).hide();
    if(this.value == "0") $(`#battery_section_0`).show();
    else if(this.value == "") $(`#battery_section_n`).show();

    // Show|Hide Options
    $("#system_co_sn").val(systemSerial).trigger("change");

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

function step2() {

    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action : "get_installation_info",
            apikey : systemApikey
        },
        error: () => { alert("E004. Please refresh the page! (Error while reading installation info from cloud)"); },
        success: (json) => {

            console.log(json);

            if(!json) { step3(); return; }

            showSystemInfo(json);

            step3();

        }
    });

}










/*
    Set EMX Serial-Number
*/

function step3() {

    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action : "get_box_info",
            apikey : systemApikey
        },
        error: () => { alert("E005. Please refresh the page! (Error while reading EMX info from cloud)"); },
        success: (response) => {

            console.log(response);

            var box_info = response;

            if(!box_info) return $("#errorBoxNotRegistered").modal("show");

            // Save EMX Serial-Number & Part-Number to Session
            $.post({
                url: "cmd/session.php",
                data: {
                    box_serial: box_info.serialnumber,
                    box_partnumber: box_info.partnumber
                },
                error: () => { alert("E006. Please refresh the page! (Error while saving data to session)"); },
                success: (response) => {
                    console.log(response);
                    if(response !== "1") return alert("E007. Please refresh the page! (Bad response while saving data to session)");
                    $("#bx_box").val(box_info.serialnumber);
                    step4();
                }
            });

        }
    });

}










/*
    Set Inverter Serial-Number
*/

function step4() {

    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E008. Please refresh the page! (Error while reading local settings table)"); },
        success: (response) => {

            console.log(response);

            if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter") || !response["Inverter"].hasOwnProperty("1") || !response["Inverter"].hasOwnProperty("2"))
                return alert("E009. Please refresh the page! (Missing or malformed data in local settings table)");

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

            $.post({
                url: "https://api.batterx.app/v2/install.php",
                data: {
                    action       : "get_device_partnumber",
                    serialnumber : device_serial_number
                },
                error: () => { alert("Error. Please refresh the page!"); },
                success: (response) => {
                    
                    console.log(response);

                    devicePartNumber = response;

                    if(!devicePartNumber) return alert("Error! Device partnumber cannot be empty!");

                    deviceModel = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].type : "";

                    // Save Device Serialnumber & Partnumber to Session
                    $.post({
                        url: "cmd/session.php",
                        data: {
                            device_serial: device_serial_number,
                            device_partnumber: devicePartNumber
                        },
                        error: () => { alert("E010. Please refresh the page! (Error while saving data to session)"); },
                        success: (response) => {
                            console.log(response);
                            if(response !== "1") return alert("E011. Please refresh the page! (Bad response while saving data to session)");
                            $("#bx_device").val(device_serial_number);
                            step5();
                        }
                    });

                }
            });

        }
    });

}










/*
    Load Other Parameters From Settings Table
*/

function step5() {
    
    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E012. Please refresh the page! (Error while reading local settings table)"); },
        success: (response) => {
            
            console.log(response);
            
            if(!response || typeof response != "object") return alert("E013. Please refresh the page! (Missing or malformed data in local settings table)");

            dataSettings = JSON.parse(JSON.stringify(response));

            showSystemSettings(response);

            // Show|Hide Import Data From Cloud Button
            showImportDataFromCloud();

        }
    });

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
    mainFormSubmit_3();
}

function mainFormSubmit_3() {
    mainFormSubmit_4();
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

function mainFormSubmit_5() {

    // Return If Empty Fields
    if(!allFieldsCorrect()) return;

    // Confirm Solar Watt Peak (if under 1000Wp)
    if(parseInt($("#solar_wattpeak").val()) < 1000) {
        var tempFlag = confirm(`${lang.system_setup.msg_solar_size_very_low}\n\n${lang.system_setup.msg_solar_size_very_low_confirm.replace("100", $("#solar_wattpeak").val())}\n`);
        if(!tempFlag) return $("#solar_wattpeak").val("");
    }

    // Verify System S/N
    if(!verifySystem()) return;
    
    // Verify Battery Modules
    if(isLiFePO() && !verifyModulesLiFePO()) return;

    // Check Inverter S/N
    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action       : "verify_device",
            serialnumber : $("#bx_device").val(),
            system       : isOldSys() ? $("#system_co_sn").val().trim() : "NEW"
        },
        error: () => { alert("E014. Please refresh the page! (Error while verifying device serialnumber in cloud)"); },
        success: (response) => {
            console.log(response);
            if(response !== "1") return $("#errorInverterRegisteredWithOtherSystem").modal("show");
            mainFormSubmit_6();
        }
    });

}










/*
    Start Setup
*/

function mainFormSubmit_6() {





    // Disable All Fields

    $(` #bx_device,
        #bx_box,
        #btnInstallerMemo,
        #installer_memo,
        
        #solar_wattpeak,
        #solar_feedinlimitation,
        #solar_info,

        #bx_battery_type_0,
        #lifepo_bms,
        #lifepo_serialnumbers,

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

function setValuesToSession() {





    var tempData = {};





    // Common Parameters

    tempData.system_serial          = isOldSys() ? $("#system_co_sn").val().trim() : "NEW";

    tempData.device_serial          = $("#bx_device             ").val().trim();
    tempData.solar_wattpeak         = $("#solar_wattpeak        ").val().trim();
    tempData.solar_feedinlimitation = $("#solar_feedinlimitation").val().trim();
    tempData.solar_info             = $("#solar_info            ").val().trim();
    tempData.note                   = $("#installer_memo        ").val().trim();
    tempData.installation_date      = $("#installation_date     ").val().trim();





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

    if($("#extended_lfsmoThreshold    ").val() != "") tempData.extended_lfsmoThreshold     = $("#extended_lfsmoThreshold    ").val();
    if($("#extended_lfsmoDroop        ").val() != "") tempData.extended_lfsmoDroop         = $("#extended_lfsmoDroop        ").val();
    if($("#extended_maxGridVoltage    ").val() != "") tempData.extended_maxGridVoltage     = $("#extended_maxGridVoltage    ").val();
    if($("#extended_minGridVoltage    ").val() != "") tempData.extended_minGridVoltage     = $("#extended_minGridVoltage    ").val();
    if($("#extended_maxGridFrequency  ").val() != "") tempData.extended_maxGridFrequency   = $("#extended_maxGridFrequency  ").val();
    if($("#extended_minGridFrequency  ").val() != "") tempData.extended_minGridFrequency   = $("#extended_minGridFrequency  ").val();
    if($("#extended_UeffOver1         ").val() != "") tempData.extended_UeffOver1          = $("#extended_UeffOver1         ").val();
    if($("#extended_UeffUnder1        ").val() != "") tempData.extended_UeffUnder1         = $("#extended_UeffUnder1        ").val();
    if($("#extended_UeffOver2         ").val() != "") tempData.extended_UeffOver2          = $("#extended_UeffOver2         ").val();
    if($("#extended_UeffUnder2        ").val() != "") tempData.extended_UeffUnder2         = $("#extended_UeffUnder2        ").val();
    if($("#extended_fOver1            ").val() != "") tempData.extended_fOver1             = $("#extended_fOver1            ").val();
    if($("#extended_fUnder1           ").val() != "") tempData.extended_fUnder1            = $("#extended_fUnder1           ").val();
    if($("#extended_UeffOver1Time     ").val() != "") tempData.extended_UeffOver1Time      = $("#extended_UeffOver1Time     ").val();
    if($("#extended_UeffUnder1Time    ").val() != "") tempData.extended_UeffUnder1Time     = $("#extended_UeffUnder1Time    ").val();
    if($("#extended_UeffOver2Time     ").val() != "") tempData.extended_UeffOver2Time      = $("#extended_UeffOver2Time     ").val();
    if($("#extended_UeffUnder2Time    ").val() != "") tempData.extended_UeffUnder2Time     = $("#extended_UeffUnder2Time    ").val();
    if($("#extended_fOver1Time        ").val() != "") tempData.extended_fOver1Time         = $("#extended_fOver1Time        ").val();
    if($("#extended_fUnder1Time       ").val() != "") tempData.extended_fUnder1Time        = $("#extended_fUnder1Time       ").val();
    if($("#extended_Ueff              ").val() != "") tempData.extended_Ueff               = $("#extended_Ueff              ").val();
    if($("#extended_gridConnectDelay  ").val() != "") tempData.extended_gridConnectDelay   = $("#extended_gridConnectDelay  ").val();
    if($("#extended_gridReconnectDelay").val() != "") tempData.extended_gridReconnectDelay = $("#extended_gridReconnectDelay").val();
    if($("#extended_puTime            ").val() != "") tempData.extended_puTime             = $("#extended_puTime            ").val();





    // Battery Parameters

    if(isLiFePO()) {
        tempData.battery_type    = "lifepo";
        tempData.battery_voltage = "51";
        var bms       = [];
		var batteries = [];
        $("#lifepo_bms").val().trim().split("\n").forEach(sn => {
            if(sn.trim() != "") bms.push(sn.trim());
        });
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if(sn.trim() != "") batteries.push(sn.trim());
        });
        tempData.battery_bms           = bms.join(",");
		tempData.battery_serialnumbers = batteries.join(",");
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
        tempData.system_model = "batterX h10";
    } else if(deviceModel == "batterx_h5") {
        tempData.system_model = "batterX h5";
    } else if(deviceModel == "batterx_i") {
        tempData.system_model = "batterX";
        var deviceName = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].name : "";
        var batteryCapacity = Math.round(countModules * 2.5 * 10) / 10;
        if(deviceName != "")
            tempData.system_model = `${deviceName} basic ${batteryCapacity}kWh`
    }





    // Energy Meters

    tempData.has_extsol = $("#extsol_check").is(":checked") ? "1" : "0";
    tempData.has_meter1 = $("#meter1_mode").val();
    tempData.has_meter2 = $("#meter2_mode").val();
    tempData.has_meter3 = $("#meter3_mode").val();
    tempData.has_meter4 = $("#meter4_mode").val();





    // Add Values To Session

    $.post({
        url: "cmd/session.php",
        data: tempData,
        error: () => { alert("E056. Please refresh the page! (Error while saving data to session)"); },
        success: (response) => {
            console.log(response);
            if(response !== "1") return alert("E057. Please refresh the page! (Bad response while saving data to session)");
            // Start Setup
            checkParametersCounter = 0;
            if(skipSetup)
                setTimeout(() => { window.location.href = "system_test.php"; }, 2500);
            else
                setup1();
        }
    });



    

}










//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////










/*
    Begin Setup
*/

function setup1() {
    




    isSettingParameters = true;
    $("#notif").removeClass("loading error success").addClass("loading");
    $("#message").html(lang.system_setup.msg_setting_parameters).css("color", "");





    // Set Grid MaxInjectionPower

    var maxGridFeedInPower = Math.round(Math.max(parseInt($("#solar_wattpeak").val()) * parseInt($("#solar_feedinlimitation").val()) / 100, 50)).toString();
    $.get({
        url: "api.php?set=command&type=20736&entity=1&text2=" + maxGridFeedInPower,
        error: () => { alert("E018. Please refresh the page! (Error while writing command to local database)"); },
        success: (response) => { if(response != "1") return alert("E019. Please refresh the page! (Bad response while writing command to local database)"); }
    });





    // Next Step For Carbon|Other Batteries

    if(isNoBattery()) setup2();
    




    // Verify LiFePO Communication

    if(isLiFePO()) {
        setTimeout(() => {
            $.get({
                url: "api.php?set=command&type=24064&entity=401&text2=2", // battery type
                error: () => { alert("E024. Please refresh the page! (Error while writing command to local database)"); },
                success: (response) => {
                    if(response != "1") return alert("E025. Please refresh the page! (Bad response while writing command to local database)");
                    setTimeout(() => {
                        verifyModulesCommunication((flag) => {
                            // Next Step For LiFePO Batteries
                            if(flag) setup2();
                        });
                    }, 10000);
                }
            });
        }, 5000);
    }




    
}










/*
    Continue Setup
*/

function setup2() {

    
    
    
    
    // Set common inverter parameters (here are set to manually, should set to auto in system_test)
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=1", success: () => {} });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=2&text2=1", success: () => {} });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0", success: () => {} });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=4&text2=1", success: () => {} });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0", success: () => {} });





    newParameters = {};

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

    newParameters["prepareBatteryExtension"] = "0";
    newParameters["cloudSet"               ] = "1";

    newParameters["battery_type" ] = "2"; // 2=lifepo i-Series, for h5 or h10 should be 0=carbon 1=lifepo
    newParameters["reactive_mode"] = "0"; // Reactive mode off

    if(isVde4105) {
        newParameters["stage_1_ov_threshold"        ] = "26450";
        newParameters["qu_time_constant"            ] = "10000";
        newParameters["qu_enter_power"              ] = "0";
        newParameters["qu_exit_power"               ] = "0";
        newParameters["cosfp_enter_voltage"         ] = "23200";
        newParameters["cosfp_exit_voltage"          ] = "20700";
        newParameters["lvrt_enter_voltage"          ] = "19500";
        newParameters["lvrt_exit_voltage"           ] = "19600";
        newParameters["lvrt_point_5_voltage"        ] = "19500";
        newParameters["lvrt_point_1_duration"       ] = "150";
        newParameters["lvrt_point_2_duration"       ] = "750";
        newParameters["lvrt_point_3_duration"       ] = "1600";
        newParameters["lvrt_point_4_duration"       ] = "2700";
        newParameters["lvrt_point_5_duration"       ] = "3000";
        newParameters["hvrt_enter_voltage"          ] = "26400";
        newParameters["hvrt_exit_voltage"           ] = "28750";
        newParameters["hvrt_point_1_voltage"        ] = "26450";
        newParameters["hvrt_point_2_voltage"        ] = "27600";
        newParameters["hvrt_point_3_voltage"        ] = "28750";
        newParameters["hvrt_point_3_duration"       ] = "100";
        newParameters["lfsmo_power_recovery_rate"   ] = "1000";
    } else if(isTor) {
        newParameters["grid_connect_upper_voltage"  ] = "25760";
        newParameters["grid_connect_upper_frequency"] = "5150";
        newParameters["grid_reconnect_upper_voltage"] = "25070";
        newParameters["stage_1_ov_threshold"        ] = "25540";
        newParameters["qu_time_constant"            ] = "10000";
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
    } else if(isEstonia) {
        newParameters["grid_connect_lower_voltage"  ] = "19550";
        newParameters["grid_connect_upper_voltage"  ] = "26450";
        newParameters["grid_connect_lower_frequency"] = "4700";
        newParameters["grid_connect_upper_frequency"] = "5200";
        newParameters["stage_1_uv_threshold"        ] = "19550";
        newParameters["stage_1_ov_threshold"        ] = "25530";
        newParameters["stage_1_uf_threshold"        ] = "4740";
        newParameters["stage_1_of_threshold"        ] = "5160";
        newParameters["stage_1_uv_duration"         ] = "1200";
        newParameters["stage_1_ov_duration"         ] = "3000";
        newParameters["stage_1_uf_duration"         ] = "360";
        newParameters["stage_1_of_duration"         ] = "160";
        newParameters["stage_2_uv_threshold"        ] = "4600";
        newParameters["stage_2_ov_threshold"        ] = "26450";
        newParameters["stage_2_uv_duration"         ] = "360";
        newParameters["stage_2_ov_duration"         ] = "100";
        newParameters["lvrt_switch"                 ] = "1";
        newParameters["hvrt_switch"                 ] = "1";
    }

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

    newParameters["lfsmo_threshold"] = Math.round($("#extended_lfsmoThreshold").val());
    newParameters["lfsmo_droop"    ] = Math.round($("#extended_lfsmoDroop").val());

    if(isTor) {
        newParameters["grid_connect_upper_voltage"     ] = Math.round(parseFloat($("#extended_maxGridVoltage").val()) * 100);
        newParameters["grid_connect_lower_voltage"     ] = Math.round(parseFloat($("#extended_minGridVoltage").val()) * 100);
        newParameters["grid_connect_upper_frequency"   ] = Math.round(parseFloat($("#extended_maxGridFrequency").val()) * 100);
        newParameters["grid_connect_lower_frequency"   ] = Math.round(parseFloat($("#extended_minGridFrequency").val()) * 100);
        newParameters["stage_1_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver1").val()) * 100);
        newParameters["stage_1_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder1").val()) * 100);
        newParameters["stage_2_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver2").val()) * 100);
        newParameters["stage_2_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder2").val()) * 100);
        newParameters["stage_1_of_threshold"           ] = Math.round(parseFloat($("#extended_fOver1").val()) * 100);
        newParameters["stage_1_uf_threshold"           ] = Math.round(parseFloat($("#extended_fUnder1").val()) * 100);
        newParameters["stage_1_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver1Time").val()) * 1000);
        newParameters["stage_1_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder1Time").val()) * 1000);
        newParameters["stage_2_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver2Time").val()) * 1000);
        newParameters["stage_2_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder2Time").val()) * 1000);
        newParameters["stage_1_of_duration"            ] = Math.round(parseFloat($("#extended_fOver1Time").val()) * 1000);
        newParameters["stage_1_uf_duration"            ] = Math.round(parseFloat($("#extended_fUnder1Time").val()) * 1000);
        newParameters["overvoltage_10min_threshold"    ] = Math.round(parseFloat($("#extended_Ueff").val()) * 100);
        newParameters["wait_time_before_grid_connect"  ] = Math.round($("#extended_gridConnectDelay").val());
        newParameters["wait_time_before_grid_reconnect"] = Math.round($("#extended_gridReconnectDelay").val());
        newParameters["pu_time_constant"               ] = Math.round(parseFloat($("#extended_puTime").val()) * 1000);
    }





    // Get oldParameters
    $.get({
        url: "api.php?get=settings",
        async: false,
        error: () => { alert("E026. Please refresh the page! (Error while reading local settings table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
                return alert("E027. Please refresh the page! (Missing or malformed data in local settings table)");

            dataSettings = JSON.parse(JSON.stringify(response));
            
            var temp = response["Inverter"];
            deviceDatetime = temp["10"]["s1"];

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

            oldParameters["prepareBatteryExtension"] = !response.hasOwnProperty("PrepareBatteryExtension") || !response["PrepareBatteryExtension"].hasOwnProperty("0") ? "0" : response["PrepareBatteryExtension"]["0"]["mode"];
            oldParameters["cloudSet"               ] = !response.hasOwnProperty("CloudSet"               ) || !response["CloudSet"               ].hasOwnProperty("0") ? ""  : response["CloudSet"               ]["0"]["mode"];

            if(temp.hasOwnProperty("202")) oldParameters["reactive_mode"                  ] = temp["202"].s1;
            if(temp.hasOwnProperty("203")) oldParameters["pf_mode_power_factor"           ] = temp["203"].s1;
            if(temp.hasOwnProperty("204")) oldParameters["qt_mode_reactive_power"         ] = temp["204"].s1;
            if(temp.hasOwnProperty("205")) oldParameters["overvoltage_10min_threshold"    ] = temp["205"].s1;
            if(temp.hasOwnProperty("211")) oldParameters["grid_connect_lower_voltage"     ] = temp["211"].s1;
            if(temp.hasOwnProperty("212")) oldParameters["grid_connect_upper_voltage"     ] = temp["212"].s1;
            if(temp.hasOwnProperty("213")) oldParameters["grid_connect_lower_frequency"   ] = temp["213"].s1;
            if(temp.hasOwnProperty("214")) oldParameters["grid_connect_upper_frequency"   ] = temp["214"].s1;
            if(temp.hasOwnProperty("215")) oldParameters["wait_time_before_grid_connect"  ] = temp["215"].s1;
            if(temp.hasOwnProperty("222")) oldParameters["grid_reconnect_upper_voltage"   ] = temp["222"].s1;
            if(temp.hasOwnProperty("225")) oldParameters["wait_time_before_grid_reconnect"] = temp["225"].s1;
            if(temp.hasOwnProperty("231")) oldParameters["stage_1_uv_threshold"           ] = temp["231"].s1;
            if(temp.hasOwnProperty("232")) oldParameters["stage_1_ov_threshold"           ] = temp["232"].s1;
            if(temp.hasOwnProperty("233")) oldParameters["stage_1_uf_threshold"           ] = temp["233"].s1;
            if(temp.hasOwnProperty("234")) oldParameters["stage_1_of_threshold"           ] = temp["234"].s1;
            if(temp.hasOwnProperty("235")) oldParameters["stage_1_uv_duration"            ] = temp["235"].s1;
            if(temp.hasOwnProperty("236")) oldParameters["stage_1_ov_duration"            ] = temp["236"].s1;
            if(temp.hasOwnProperty("237")) oldParameters["stage_1_uf_duration"            ] = temp["237"].s1;
            if(temp.hasOwnProperty("238")) oldParameters["stage_1_of_duration"            ] = temp["238"].s1;
            if(temp.hasOwnProperty("239")) oldParameters["stage_2_uv_threshold"           ] = temp["239"].s1;
            if(temp.hasOwnProperty("240")) oldParameters["stage_2_ov_threshold"           ] = temp["240"].s1;
            if(temp.hasOwnProperty("243")) oldParameters["stage_2_uv_duration"            ] = temp["243"].s1;
            if(temp.hasOwnProperty("244")) oldParameters["stage_2_ov_duration"            ] = temp["244"].s1;
            if(temp.hasOwnProperty("251")) oldParameters["qu_point_1_voltage"             ] = temp["251"].s1;
            if(temp.hasOwnProperty("252")) oldParameters["qu_point_2_voltage"             ] = temp["252"].s1;
            if(temp.hasOwnProperty("253")) oldParameters["qu_point_3_voltage"             ] = temp["253"].s1;
            if(temp.hasOwnProperty("254")) oldParameters["qu_point_4_voltage"             ] = temp["254"].s1;
            if(temp.hasOwnProperty("255")) oldParameters["qu_point_1_reactive_power"      ] = temp["255"].s1;
            if(temp.hasOwnProperty("258")) oldParameters["qu_point_4_reactive_power"      ] = temp["258"].s1;
            if(temp.hasOwnProperty("260")) oldParameters["qu_time_constant"               ] = temp["260"].s1;
            if(temp.hasOwnProperty("261")) oldParameters["qu_enter_power"                 ] = temp["261"].s1;
            if(temp.hasOwnProperty("262")) oldParameters["qu_exit_power"                  ] = temp["262"].s1;
            if(temp.hasOwnProperty("272")) oldParameters["cosfp_point_b_power"            ] = temp["272"].s1;
            if(temp.hasOwnProperty("277")) oldParameters["cosfp_enter_voltage"            ] = temp["277"].s1;
            if(temp.hasOwnProperty("278")) oldParameters["cosfp_exit_voltage"             ] = temp["278"].s1;
            if(temp.hasOwnProperty("291")) oldParameters["lvrt_switch"                    ] = temp["291"].s1;
            if(temp.hasOwnProperty("292")) oldParameters["lvrt_enter_voltage"             ] = temp["292"].s1;
            if(temp.hasOwnProperty("293")) oldParameters["lvrt_exit_voltage"              ] = temp["293"].s1;
            if(temp.hasOwnProperty("298")) oldParameters["lvrt_point_5_voltage"           ] = temp["298"].s1;
            if(temp.hasOwnProperty("299")) oldParameters["lvrt_point_1_duration"          ] = temp["299"].s1;
            if(temp.hasOwnProperty("300")) oldParameters["lvrt_point_2_duration"          ] = temp["300"].s1;
            if(temp.hasOwnProperty("301")) oldParameters["lvrt_point_3_duration"          ] = temp["301"].s1;
            if(temp.hasOwnProperty("302")) oldParameters["lvrt_point_4_duration"          ] = temp["302"].s1;
            if(temp.hasOwnProperty("303")) oldParameters["lvrt_point_5_duration"          ] = temp["303"].s1;
            if(temp.hasOwnProperty("311")) oldParameters["hvrt_switch"                    ] = temp["311"].s1;
            if(temp.hasOwnProperty("312")) oldParameters["hvrt_enter_voltage"             ] = temp["312"].s1;
            if(temp.hasOwnProperty("313")) oldParameters["hvrt_exit_voltage"              ] = temp["313"].s1;
            if(temp.hasOwnProperty("314")) oldParameters["hvrt_point_1_voltage"           ] = temp["314"].s1;
            if(temp.hasOwnProperty("315")) oldParameters["hvrt_point_2_voltage"           ] = temp["315"].s1;
            if(temp.hasOwnProperty("316")) oldParameters["hvrt_point_3_voltage"           ] = temp["316"].s1;
            if(temp.hasOwnProperty("319")) oldParameters["hvrt_point_3_duration"          ] = temp["319"].s1;
            if(temp.hasOwnProperty("336")) oldParameters["pu_time_constant"               ] = temp["336"].s1;
            if(temp.hasOwnProperty("342")) oldParameters["lfsmo_threshold"                ] = temp["342"].s1;
            if(temp.hasOwnProperty("344")) oldParameters["lfsmo_end_point_frequency"      ] = temp["344"].s1;
            if(temp.hasOwnProperty("348")) oldParameters["lfsmo_power_recovery_rate"      ] = temp["348"].s1;
            if(temp.hasOwnProperty("349")) oldParameters["lfsmo_droop"                    ] = temp["349"].s1;
            if(temp.hasOwnProperty("401")) oldParameters["battery_type"                   ] = temp["401"].s1;

        }
    });

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

    if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) { retry = true; setup_sendSetting("PrepareBatteryExtension", "0", "mode", newParameters["prepareBatteryExtension"]) }
    if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) { retry = true; setup_sendSetting("CloudSet"               , "0", "mode", newParameters["cloudSet"               ]) }

    if(newParameters.hasOwnProperty("reactive_mode"                  ) && oldParameters.hasOwnProperty("reactive_mode"                  ) && newParameters["reactive_mode"                  ] != oldParameters["reactive_mode"                  ]) { retry = true; setup_sendCommand(24064, 202, "", newParameters["reactive_mode"                  ]); }
    if(newParameters.hasOwnProperty("pf_mode_power_factor"           ) && oldParameters.hasOwnProperty("pf_mode_power_factor"           ) && newParameters["pf_mode_power_factor"           ] != oldParameters["pf_mode_power_factor"           ]) { retry = true; setup_sendCommand(24064, 203, "", newParameters["pf_mode_power_factor"           ]); }
    if(newParameters.hasOwnProperty("qt_mode_reactive_power"         ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"         ) && newParameters["qt_mode_reactive_power"         ] != oldParameters["qt_mode_reactive_power"         ]) { retry = true; setup_sendCommand(24064, 204, "", newParameters["qt_mode_reactive_power"         ]); }
    if(newParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && newParameters["overvoltage_10min_threshold"    ] != oldParameters["overvoltage_10min_threshold"    ]) { retry = true; setup_sendCommand(24064, 205, "", newParameters["overvoltage_10min_threshold"    ]); }
    if(newParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && newParameters["grid_connect_lower_voltage"     ] != oldParameters["grid_connect_lower_voltage"     ]) { retry = true; setup_sendCommand(24064, 211, "", newParameters["grid_connect_lower_voltage"     ]); }
    if(newParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && newParameters["grid_connect_upper_voltage"     ] != oldParameters["grid_connect_upper_voltage"     ]) { retry = true; setup_sendCommand(24064, 212, "", newParameters["grid_connect_upper_voltage"     ]); }
    if(newParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && newParameters["grid_connect_lower_frequency"   ] != oldParameters["grid_connect_lower_frequency"   ]) { retry = true; setup_sendCommand(24064, 213, "", newParameters["grid_connect_lower_frequency"   ]); }
    if(newParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && newParameters["grid_connect_upper_frequency"   ] != oldParameters["grid_connect_upper_frequency"   ]) { retry = true; setup_sendCommand(24064, 214, "", newParameters["grid_connect_upper_frequency"   ]); }
    if(newParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && newParameters["wait_time_before_grid_connect"  ] != oldParameters["wait_time_before_grid_connect"  ]) { retry = true; setup_sendCommand(24064, 215, "", newParameters["wait_time_before_grid_connect"  ]); }
    if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && newParameters["grid_reconnect_upper_voltage"   ] != oldParameters["grid_reconnect_upper_voltage"   ]) { retry = true; setup_sendCommand(24064, 222, "", newParameters["grid_reconnect_upper_voltage"   ]); }
    if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect") && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect") && newParameters["wait_time_before_grid_reconnect"] != oldParameters["wait_time_before_grid_reconnect"]) { retry = true; setup_sendCommand(24064, 225, "", newParameters["wait_time_before_grid_reconnect"]); }
    if(newParameters.hasOwnProperty("stage_1_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"           ) && newParameters["stage_1_uv_threshold"           ] != oldParameters["stage_1_uv_threshold"           ]) { retry = true; setup_sendCommand(24064, 231, "", newParameters["stage_1_uv_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_1_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"           ) && newParameters["stage_1_ov_threshold"           ] != oldParameters["stage_1_ov_threshold"           ]) { retry = true; setup_sendCommand(24064, 232, "", newParameters["stage_1_ov_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_1_uf_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"           ) && newParameters["stage_1_uf_threshold"           ] != oldParameters["stage_1_uf_threshold"           ]) { retry = true; setup_sendCommand(24064, 233, "", newParameters["stage_1_uf_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_1_of_threshold"           ) && oldParameters.hasOwnProperty("stage_1_of_threshold"           ) && newParameters["stage_1_of_threshold"           ] != oldParameters["stage_1_of_threshold"           ]) { retry = true; setup_sendCommand(24064, 234, "", newParameters["stage_1_of_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_1_uv_duration"            ) && oldParameters.hasOwnProperty("stage_1_uv_duration"            ) && newParameters["stage_1_uv_duration"            ] != oldParameters["stage_1_uv_duration"            ]) { retry = true; setup_sendCommand(24064, 235, "", newParameters["stage_1_uv_duration"            ]); }
    if(newParameters.hasOwnProperty("stage_1_ov_duration"            ) && oldParameters.hasOwnProperty("stage_1_ov_duration"            ) && newParameters["stage_1_ov_duration"            ] != oldParameters["stage_1_ov_duration"            ]) { retry = true; setup_sendCommand(24064, 236, "", newParameters["stage_1_ov_duration"            ]); }
    if(newParameters.hasOwnProperty("stage_1_uf_duration"            ) && oldParameters.hasOwnProperty("stage_1_uf_duration"            ) && newParameters["stage_1_uf_duration"            ] != oldParameters["stage_1_uf_duration"            ]) { retry = true; setup_sendCommand(24064, 237, "", newParameters["stage_1_uf_duration"            ]); }
    if(newParameters.hasOwnProperty("stage_1_of_duration"            ) && oldParameters.hasOwnProperty("stage_1_of_duration"            ) && newParameters["stage_1_of_duration"            ] != oldParameters["stage_1_of_duration"            ]) { retry = true; setup_sendCommand(24064, 238, "", newParameters["stage_1_of_duration"            ]); }
    if(newParameters.hasOwnProperty("stage_2_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"           ) && newParameters["stage_2_uv_threshold"           ] != oldParameters["stage_2_uv_threshold"           ]) { retry = true; setup_sendCommand(24064, 239, "", newParameters["stage_2_uv_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_2_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"           ) && newParameters["stage_2_ov_threshold"           ] != oldParameters["stage_2_ov_threshold"           ]) { retry = true; setup_sendCommand(24064, 240, "", newParameters["stage_2_ov_threshold"           ]); }
    if(newParameters.hasOwnProperty("stage_2_uv_duration"            ) && oldParameters.hasOwnProperty("stage_2_uv_duration"            ) && newParameters["stage_2_uv_duration"            ] != oldParameters["stage_2_uv_duration"            ]) { retry = true; setup_sendCommand(24064, 243, "", newParameters["stage_2_uv_duration"            ]); }
    if(newParameters.hasOwnProperty("stage_2_ov_duration"            ) && oldParameters.hasOwnProperty("stage_2_ov_duration"            ) && newParameters["stage_2_ov_duration"            ] != oldParameters["stage_2_ov_duration"            ]) { retry = true; setup_sendCommand(24064, 244, "", newParameters["stage_2_ov_duration"            ]); }
    if(newParameters.hasOwnProperty("qu_point_1_voltage"             ) && oldParameters.hasOwnProperty("qu_point_1_voltage"             ) && newParameters["qu_point_1_voltage"             ] != oldParameters["qu_point_1_voltage"             ]) { retry = true; setup_sendCommand(24064, 251, "", newParameters["qu_point_1_voltage"             ]); }
    if(newParameters.hasOwnProperty("qu_point_2_voltage"             ) && oldParameters.hasOwnProperty("qu_point_2_voltage"             ) && newParameters["qu_point_2_voltage"             ] != oldParameters["qu_point_2_voltage"             ]) { retry = true; setup_sendCommand(24064, 252, "", newParameters["qu_point_2_voltage"             ]); }
    if(newParameters.hasOwnProperty("qu_point_3_voltage"             ) && oldParameters.hasOwnProperty("qu_point_3_voltage"             ) && newParameters["qu_point_3_voltage"             ] != oldParameters["qu_point_3_voltage"             ]) { retry = true; setup_sendCommand(24064, 253, "", newParameters["qu_point_3_voltage"             ]); }
    if(newParameters.hasOwnProperty("qu_point_4_voltage"             ) && oldParameters.hasOwnProperty("qu_point_4_voltage"             ) && newParameters["qu_point_4_voltage"             ] != oldParameters["qu_point_4_voltage"             ]) { retry = true; setup_sendCommand(24064, 254, "", newParameters["qu_point_4_voltage"             ]); }
    if(newParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && newParameters["qu_point_1_reactive_power"      ] != oldParameters["qu_point_1_reactive_power"      ]) { retry = true; setup_sendCommand(24064, 255, "", newParameters["qu_point_1_reactive_power"      ]); }
    if(newParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && newParameters["qu_point_4_reactive_power"      ] != oldParameters["qu_point_4_reactive_power"      ]) { retry = true; setup_sendCommand(24064, 258, "", newParameters["qu_point_4_reactive_power"      ]); }
    if(newParameters.hasOwnProperty("qu_time_constant"               ) && oldParameters.hasOwnProperty("qu_time_constant"               ) && newParameters["qu_time_constant"               ] != oldParameters["qu_time_constant"               ]) { retry = true; setup_sendCommand(24064, 260, "", newParameters["qu_time_constant"               ]); }
    if(newParameters.hasOwnProperty("qu_enter_power"                 ) && oldParameters.hasOwnProperty("qu_enter_power"                 ) && newParameters["qu_enter_power"                 ] != oldParameters["qu_enter_power"                 ]) { retry = true; setup_sendCommand(24064, 261, "", newParameters["qu_enter_power"                 ]); }
    if(newParameters.hasOwnProperty("qu_exit_power"                  ) && oldParameters.hasOwnProperty("qu_exit_power"                  ) && newParameters["qu_exit_power"                  ] != oldParameters["qu_exit_power"                  ]) { retry = true; setup_sendCommand(24064, 262, "", newParameters["qu_exit_power"                  ]); }
    if(newParameters.hasOwnProperty("cosfp_point_b_power"            ) && oldParameters.hasOwnProperty("cosfp_point_b_power"            ) && newParameters["cosfp_point_b_power"            ] != oldParameters["cosfp_point_b_power"            ]) { retry = true; setup_sendCommand(24064, 272, "", newParameters["cosfp_point_b_power"            ]); }
    if(newParameters.hasOwnProperty("cosfp_enter_voltage"            ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"            ) && newParameters["cosfp_enter_voltage"            ] != oldParameters["cosfp_enter_voltage"            ]) { retry = true; setup_sendCommand(24064, 277, "", newParameters["cosfp_enter_voltage"            ]); }
    if(newParameters.hasOwnProperty("cosfp_exit_voltage"             ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"             ) && newParameters["cosfp_exit_voltage"             ] != oldParameters["cosfp_exit_voltage"             ]) { retry = true; setup_sendCommand(24064, 278, "", newParameters["cosfp_exit_voltage"             ]); }
    if(newParameters.hasOwnProperty("lvrt_switch"                    ) && oldParameters.hasOwnProperty("lvrt_switch"                    ) && newParameters["lvrt_switch"                    ] != oldParameters["lvrt_switch"                    ]) { retry = true; setup_sendCommand(24064, 291, "", newParameters["lvrt_switch"                    ]); }
    if(newParameters.hasOwnProperty("lvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"             ) && newParameters["lvrt_enter_voltage"             ] != oldParameters["lvrt_enter_voltage"             ]) { retry = true; setup_sendCommand(24064, 292, "", newParameters["lvrt_enter_voltage"             ]); }
    if(newParameters.hasOwnProperty("lvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"              ) && newParameters["lvrt_exit_voltage"              ] != oldParameters["lvrt_exit_voltage"              ]) { retry = true; setup_sendCommand(24064, 293, "", newParameters["lvrt_exit_voltage"              ]); }
    if(newParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && newParameters["lvrt_point_5_voltage"           ] != oldParameters["lvrt_point_5_voltage"           ]) { retry = true; setup_sendCommand(24064, 298, "", newParameters["lvrt_point_5_voltage"           ]); }
    if(newParameters.hasOwnProperty("lvrt_point_1_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"          ) && newParameters["lvrt_point_1_duration"          ] != oldParameters["lvrt_point_1_duration"          ]) { retry = true; setup_sendCommand(24064, 299, "", newParameters["lvrt_point_1_duration"          ]); }
    if(newParameters.hasOwnProperty("lvrt_point_2_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"          ) && newParameters["lvrt_point_2_duration"          ] != oldParameters["lvrt_point_2_duration"          ]) { retry = true; setup_sendCommand(24064, 300, "", newParameters["lvrt_point_2_duration"          ]); }
    if(newParameters.hasOwnProperty("lvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"          ) && newParameters["lvrt_point_3_duration"          ] != oldParameters["lvrt_point_3_duration"          ]) { retry = true; setup_sendCommand(24064, 301, "", newParameters["lvrt_point_3_duration"          ]); }
    if(newParameters.hasOwnProperty("lvrt_point_4_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"          ) && newParameters["lvrt_point_4_duration"          ] != oldParameters["lvrt_point_4_duration"          ]) { retry = true; setup_sendCommand(24064, 302, "", newParameters["lvrt_point_4_duration"          ]); }
    if(newParameters.hasOwnProperty("lvrt_point_5_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"          ) && newParameters["lvrt_point_5_duration"          ] != oldParameters["lvrt_point_5_duration"          ]) { retry = true; setup_sendCommand(24064, 303, "", newParameters["lvrt_point_5_duration"          ]); }
    if(newParameters.hasOwnProperty("hvrt_switch"                    ) && oldParameters.hasOwnProperty("hvrt_switch"                    ) && newParameters["hvrt_switch"                    ] != oldParameters["hvrt_switch"                    ]) { retry = true; setup_sendCommand(24064, 311, "", newParameters["hvrt_switch"                    ]); }
    if(newParameters.hasOwnProperty("hvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"             ) && newParameters["hvrt_enter_voltage"             ] != oldParameters["hvrt_enter_voltage"             ]) { retry = true; setup_sendCommand(24064, 312, "", newParameters["hvrt_enter_voltage"             ]); }
    if(newParameters.hasOwnProperty("hvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"              ) && newParameters["hvrt_exit_voltage"              ] != oldParameters["hvrt_exit_voltage"              ]) { retry = true; setup_sendCommand(24064, 313, "", newParameters["hvrt_exit_voltage"              ]); }
    if(newParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && newParameters["hvrt_point_1_voltage"           ] != oldParameters["hvrt_point_1_voltage"           ]) { retry = true; setup_sendCommand(24064, 314, "", newParameters["hvrt_point_1_voltage"           ]); }
    if(newParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && newParameters["hvrt_point_2_voltage"           ] != oldParameters["hvrt_point_2_voltage"           ]) { retry = true; setup_sendCommand(24064, 315, "", newParameters["hvrt_point_2_voltage"           ]); }
    if(newParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && newParameters["hvrt_point_3_voltage"           ] != oldParameters["hvrt_point_3_voltage"           ]) { retry = true; setup_sendCommand(24064, 316, "", newParameters["hvrt_point_3_voltage"           ]); }
    if(newParameters.hasOwnProperty("hvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"          ) && newParameters["hvrt_point_3_duration"          ] != oldParameters["hvrt_point_3_duration"          ]) { retry = true; setup_sendCommand(24064, 319, "", newParameters["hvrt_point_3_duration"          ]); }
    if(newParameters.hasOwnProperty("pu_time_constant"               ) && oldParameters.hasOwnProperty("pu_time_constant"               ) && newParameters["pu_time_constant"               ] != oldParameters["pu_time_constant"               ]) { retry = true; setup_sendCommand(24064, 336, "", newParameters["pu_time_constant"               ]); }
    if(newParameters.hasOwnProperty("lfsmo_threshold"                ) && oldParameters.hasOwnProperty("lfsmo_threshold"                ) && newParameters["lfsmo_threshold"                ] != oldParameters["lfsmo_threshold"                ]) { retry = true; setup_sendCommand(24064, 342, "", newParameters["lfsmo_threshold"                ]); }
    if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && newParameters["lfsmo_end_point_frequency"      ] != oldParameters["lfsmo_end_point_frequency"      ]) { retry = true; setup_sendCommand(24064, 344, "", newParameters["lfsmo_end_point_frequency"      ]); }
    if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && newParameters["lfsmo_power_recovery_rate"      ] != oldParameters["lfsmo_power_recovery_rate"      ]) { retry = true; setup_sendCommand(24064, 348, "", newParameters["lfsmo_power_recovery_rate"      ]); }
    if(newParameters.hasOwnProperty("lfsmo_droop"                    ) && oldParameters.hasOwnProperty("lfsmo_droop"                    ) && newParameters["lfsmo_droop"                    ] != oldParameters["lfsmo_droop"                    ]) { retry = true; setup_sendCommand(24064, 349, "", newParameters["lfsmo_droop"                    ]); }
    if(newParameters.hasOwnProperty("battery_type"                   ) && oldParameters.hasOwnProperty("battery_type"                   ) && newParameters["battery_type"                   ] != oldParameters["battery_type"                   ]) { retry = true; setup_sendCommand(24064, 401, "", newParameters["battery_type"                   ]); }

    if(!retry) {
        $(".setting-progress span").html(lang.system_setup.msg_setting_success).css("color", "#28a745");
        $("#notif").removeClass("loading error success").addClass("success");
        // Next Step
        setTimeout(() => { window.location.href = "system_test.php"; }, 2500);
    } else console.log("SETTING PARAMETERS");





}










/*
    Send Command
*/

function setup_sendCommand(type, entity, text1, text2) {
    $.get({
        url: `api.php?set=command&type=${type}&entity=${entity}&text1=${text1}&text2=${text2}`,
        error: () => { alert("E028. Please refresh the page! (Error while writing command to local database)") },
        success: function(response) {
            if(response != "1") return alert("E029. Please refresh the page! (Bad response while writing command to local database)");
            if(checkParametersInterval == undefined) checkParametersInterval = setInterval(setup_checkParameters, 5000);
        }
    });
}

function setup_sendSetting(varname, entity, field, value) {
    var bxSet = { "mode":11, "v1":21, "v2":22, "v3":23, "v4":24, "v5":25, "v6":26, "s1":31, "s2":32 };
    setup_sendCommand(11, bxSet[field], entity + " " + varname, value);
}










/*
    Check Parameters
*/

function setup_checkParameters() {

    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E030. Please refresh the page! (Error while reading local settings table)") },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
                return alert("E031. Please refresh the page! (Missing or malformed data in local settings table)");

            dataSettings = JSON.parse(JSON.stringify(response));

            var temp = response["Inverter"];
            if(temp["10"]["s1"] == deviceDatetime) return false;
            deviceDatetime = temp["10"]["s1"];

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

            oldParameters["prepareBatteryExtension"] = !response.hasOwnProperty("PrepareBatteryExtension") || !response["PrepareBatteryExtension"].hasOwnProperty("0") ? "0" : response["PrepareBatteryExtension"]["0"]["mode"];
            oldParameters["cloudSet"               ] = !response.hasOwnProperty("CloudSet"               ) || !response["CloudSet"               ].hasOwnProperty("0") ? ""  : response["CloudSet"               ]["0"]["mode"];

            if(temp.hasOwnProperty("202")) oldParameters["reactive_mode"                  ] = temp["202"].s1;
            if(temp.hasOwnProperty("203")) oldParameters["pf_mode_power_factor"           ] = temp["203"].s1;
            if(temp.hasOwnProperty("204")) oldParameters["qt_mode_reactive_power"         ] = temp["204"].s1;
            if(temp.hasOwnProperty("205")) oldParameters["overvoltage_10min_threshold"    ] = temp["205"].s1;
            if(temp.hasOwnProperty("211")) oldParameters["grid_connect_lower_voltage"     ] = temp["211"].s1;
            if(temp.hasOwnProperty("212")) oldParameters["grid_connect_upper_voltage"     ] = temp["212"].s1;
            if(temp.hasOwnProperty("213")) oldParameters["grid_connect_lower_frequency"   ] = temp["213"].s1;
            if(temp.hasOwnProperty("214")) oldParameters["grid_connect_upper_frequency"   ] = temp["214"].s1;
            if(temp.hasOwnProperty("215")) oldParameters["wait_time_before_grid_connect"  ] = temp["215"].s1;
            if(temp.hasOwnProperty("222")) oldParameters["grid_reconnect_upper_voltage"   ] = temp["222"].s1;
            if(temp.hasOwnProperty("225")) oldParameters["wait_time_before_grid_reconnect"] = temp["225"].s1;
            if(temp.hasOwnProperty("231")) oldParameters["stage_1_uv_threshold"           ] = temp["231"].s1;
            if(temp.hasOwnProperty("232")) oldParameters["stage_1_ov_threshold"           ] = temp["232"].s1;
            if(temp.hasOwnProperty("233")) oldParameters["stage_1_uf_threshold"           ] = temp["233"].s1;
            if(temp.hasOwnProperty("234")) oldParameters["stage_1_of_threshold"           ] = temp["234"].s1;
            if(temp.hasOwnProperty("235")) oldParameters["stage_1_uv_duration"            ] = temp["235"].s1;
            if(temp.hasOwnProperty("236")) oldParameters["stage_1_ov_duration"            ] = temp["236"].s1;
            if(temp.hasOwnProperty("237")) oldParameters["stage_1_uf_duration"            ] = temp["237"].s1;
            if(temp.hasOwnProperty("238")) oldParameters["stage_1_of_duration"            ] = temp["238"].s1;
            if(temp.hasOwnProperty("239")) oldParameters["stage_2_uv_threshold"           ] = temp["239"].s1;
            if(temp.hasOwnProperty("240")) oldParameters["stage_2_ov_threshold"           ] = temp["240"].s1;
            if(temp.hasOwnProperty("243")) oldParameters["stage_2_uv_duration"            ] = temp["243"].s1;
            if(temp.hasOwnProperty("244")) oldParameters["stage_2_ov_duration"            ] = temp["244"].s1;
            if(temp.hasOwnProperty("251")) oldParameters["qu_point_1_voltage"             ] = temp["251"].s1;
            if(temp.hasOwnProperty("252")) oldParameters["qu_point_2_voltage"             ] = temp["252"].s1;
            if(temp.hasOwnProperty("253")) oldParameters["qu_point_3_voltage"             ] = temp["253"].s1;
            if(temp.hasOwnProperty("254")) oldParameters["qu_point_4_voltage"             ] = temp["254"].s1;
            if(temp.hasOwnProperty("255")) oldParameters["qu_point_1_reactive_power"      ] = temp["255"].s1;
            if(temp.hasOwnProperty("258")) oldParameters["qu_point_4_reactive_power"      ] = temp["258"].s1;
            if(temp.hasOwnProperty("260")) oldParameters["qu_time_constant"               ] = temp["260"].s1;
            if(temp.hasOwnProperty("261")) oldParameters["qu_enter_power"                 ] = temp["261"].s1;
            if(temp.hasOwnProperty("262")) oldParameters["qu_exit_power"                  ] = temp["262"].s1;
            if(temp.hasOwnProperty("272")) oldParameters["cosfp_point_b_power"            ] = temp["272"].s1;
            if(temp.hasOwnProperty("277")) oldParameters["cosfp_enter_voltage"            ] = temp["277"].s1;
            if(temp.hasOwnProperty("278")) oldParameters["cosfp_exit_voltage"             ] = temp["278"].s1;
            if(temp.hasOwnProperty("291")) oldParameters["lvrt_switch"                    ] = temp["291"].s1;
            if(temp.hasOwnProperty("292")) oldParameters["lvrt_enter_voltage"             ] = temp["292"].s1;
            if(temp.hasOwnProperty("293")) oldParameters["lvrt_exit_voltage"              ] = temp["293"].s1;
            if(temp.hasOwnProperty("298")) oldParameters["lvrt_point_5_voltage"           ] = temp["298"].s1;
            if(temp.hasOwnProperty("299")) oldParameters["lvrt_point_1_duration"          ] = temp["299"].s1;
            if(temp.hasOwnProperty("300")) oldParameters["lvrt_point_2_duration"          ] = temp["300"].s1;
            if(temp.hasOwnProperty("301")) oldParameters["lvrt_point_3_duration"          ] = temp["301"].s1;
            if(temp.hasOwnProperty("302")) oldParameters["lvrt_point_4_duration"          ] = temp["302"].s1;
            if(temp.hasOwnProperty("303")) oldParameters["lvrt_point_5_duration"          ] = temp["303"].s1;
            if(temp.hasOwnProperty("311")) oldParameters["hvrt_switch"                    ] = temp["311"].s1;
            if(temp.hasOwnProperty("312")) oldParameters["hvrt_enter_voltage"             ] = temp["312"].s1;
            if(temp.hasOwnProperty("313")) oldParameters["hvrt_exit_voltage"              ] = temp["313"].s1;
            if(temp.hasOwnProperty("314")) oldParameters["hvrt_point_1_voltage"           ] = temp["314"].s1;
            if(temp.hasOwnProperty("315")) oldParameters["hvrt_point_2_voltage"           ] = temp["315"].s1;
            if(temp.hasOwnProperty("316")) oldParameters["hvrt_point_3_voltage"           ] = temp["316"].s1;
            if(temp.hasOwnProperty("319")) oldParameters["hvrt_point_3_duration"          ] = temp["319"].s1;
            if(temp.hasOwnProperty("336")) oldParameters["pu_time_constant"               ] = temp["336"].s1;
            if(temp.hasOwnProperty("342")) oldParameters["lfsmo_threshold"                ] = temp["342"].s1;
            if(temp.hasOwnProperty("344")) oldParameters["lfsmo_end_point_frequency"      ] = temp["344"].s1;
            if(temp.hasOwnProperty("348")) oldParameters["lfsmo_power_recovery_rate"      ] = temp["348"].s1;
            if(temp.hasOwnProperty("349")) oldParameters["lfsmo_droop"                    ] = temp["349"].s1;
            if(temp.hasOwnProperty("401")) oldParameters["battery_type"                   ] = temp["401"].s1;

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

            if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) { retry = true; setup_sendSetting("PrepareBatteryExtension", "0", "mode", newParameters["prepareBatteryExtension"]) }
            if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) { retry = true; setup_sendSetting("CloudSet"               , "0", "mode", newParameters["cloudSet"               ]) }

            if(newParameters.hasOwnProperty("reactive_mode"                  ) && oldParameters.hasOwnProperty("reactive_mode"                  ) && newParameters["reactive_mode"                  ] != oldParameters["reactive_mode"                  ]) { retry = true; setup_sendCommand(24064, 202, "", newParameters["reactive_mode"                  ]); }
            if(newParameters.hasOwnProperty("pf_mode_power_factor"           ) && oldParameters.hasOwnProperty("pf_mode_power_factor"           ) && newParameters["pf_mode_power_factor"           ] != oldParameters["pf_mode_power_factor"           ]) { retry = true; setup_sendCommand(24064, 203, "", newParameters["pf_mode_power_factor"           ]); }
            if(newParameters.hasOwnProperty("qt_mode_reactive_power"         ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"         ) && newParameters["qt_mode_reactive_power"         ] != oldParameters["qt_mode_reactive_power"         ]) { retry = true; setup_sendCommand(24064, 204, "", newParameters["qt_mode_reactive_power"         ]); }
            if(newParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && newParameters["overvoltage_10min_threshold"    ] != oldParameters["overvoltage_10min_threshold"    ]) { retry = true; setup_sendCommand(24064, 205, "", newParameters["overvoltage_10min_threshold"    ]); }
            if(newParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && newParameters["grid_connect_lower_voltage"     ] != oldParameters["grid_connect_lower_voltage"     ]) { retry = true; setup_sendCommand(24064, 211, "", newParameters["grid_connect_lower_voltage"     ]); }
            if(newParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && newParameters["grid_connect_upper_voltage"     ] != oldParameters["grid_connect_upper_voltage"     ]) { retry = true; setup_sendCommand(24064, 212, "", newParameters["grid_connect_upper_voltage"     ]); }
            if(newParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && newParameters["grid_connect_lower_frequency"   ] != oldParameters["grid_connect_lower_frequency"   ]) { retry = true; setup_sendCommand(24064, 213, "", newParameters["grid_connect_lower_frequency"   ]); }
            if(newParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && newParameters["grid_connect_upper_frequency"   ] != oldParameters["grid_connect_upper_frequency"   ]) { retry = true; setup_sendCommand(24064, 214, "", newParameters["grid_connect_upper_frequency"   ]); }
            if(newParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && newParameters["wait_time_before_grid_connect"  ] != oldParameters["wait_time_before_grid_connect"  ]) { retry = true; setup_sendCommand(24064, 215, "", newParameters["wait_time_before_grid_connect"  ]); }
            if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && newParameters["grid_reconnect_upper_voltage"   ] != oldParameters["grid_reconnect_upper_voltage"   ]) { retry = true; setup_sendCommand(24064, 222, "", newParameters["grid_reconnect_upper_voltage"   ]); }
            if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect") && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect") && newParameters["wait_time_before_grid_reconnect"] != oldParameters["wait_time_before_grid_reconnect"]) { retry = true; setup_sendCommand(24064, 225, "", newParameters["wait_time_before_grid_reconnect"]); }
            if(newParameters.hasOwnProperty("stage_1_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"           ) && newParameters["stage_1_uv_threshold"           ] != oldParameters["stage_1_uv_threshold"           ]) { retry = true; setup_sendCommand(24064, 231, "", newParameters["stage_1_uv_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_1_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"           ) && newParameters["stage_1_ov_threshold"           ] != oldParameters["stage_1_ov_threshold"           ]) { retry = true; setup_sendCommand(24064, 232, "", newParameters["stage_1_ov_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_1_uf_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"           ) && newParameters["stage_1_uf_threshold"           ] != oldParameters["stage_1_uf_threshold"           ]) { retry = true; setup_sendCommand(24064, 233, "", newParameters["stage_1_uf_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_1_of_threshold"           ) && oldParameters.hasOwnProperty("stage_1_of_threshold"           ) && newParameters["stage_1_of_threshold"           ] != oldParameters["stage_1_of_threshold"           ]) { retry = true; setup_sendCommand(24064, 234, "", newParameters["stage_1_of_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_1_uv_duration"            ) && oldParameters.hasOwnProperty("stage_1_uv_duration"            ) && newParameters["stage_1_uv_duration"            ] != oldParameters["stage_1_uv_duration"            ]) { retry = true; setup_sendCommand(24064, 235, "", newParameters["stage_1_uv_duration"            ]); }
            if(newParameters.hasOwnProperty("stage_1_ov_duration"            ) && oldParameters.hasOwnProperty("stage_1_ov_duration"            ) && newParameters["stage_1_ov_duration"            ] != oldParameters["stage_1_ov_duration"            ]) { retry = true; setup_sendCommand(24064, 236, "", newParameters["stage_1_ov_duration"            ]); }
            if(newParameters.hasOwnProperty("stage_1_uf_duration"            ) && oldParameters.hasOwnProperty("stage_1_uf_duration"            ) && newParameters["stage_1_uf_duration"            ] != oldParameters["stage_1_uf_duration"            ]) { retry = true; setup_sendCommand(24064, 237, "", newParameters["stage_1_uf_duration"            ]); }
            if(newParameters.hasOwnProperty("stage_1_of_duration"            ) && oldParameters.hasOwnProperty("stage_1_of_duration"            ) && newParameters["stage_1_of_duration"            ] != oldParameters["stage_1_of_duration"            ]) { retry = true; setup_sendCommand(24064, 238, "", newParameters["stage_1_of_duration"            ]); }
            if(newParameters.hasOwnProperty("stage_2_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"           ) && newParameters["stage_2_uv_threshold"           ] != oldParameters["stage_2_uv_threshold"           ]) { retry = true; setup_sendCommand(24064, 239, "", newParameters["stage_2_uv_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_2_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"           ) && newParameters["stage_2_ov_threshold"           ] != oldParameters["stage_2_ov_threshold"           ]) { retry = true; setup_sendCommand(24064, 240, "", newParameters["stage_2_ov_threshold"           ]); }
            if(newParameters.hasOwnProperty("stage_2_uv_duration"            ) && oldParameters.hasOwnProperty("stage_2_uv_duration"            ) && newParameters["stage_2_uv_duration"            ] != oldParameters["stage_2_uv_duration"            ]) { retry = true; setup_sendCommand(24064, 243, "", newParameters["stage_2_uv_duration"            ]); }
            if(newParameters.hasOwnProperty("stage_2_ov_duration"            ) && oldParameters.hasOwnProperty("stage_2_ov_duration"            ) && newParameters["stage_2_ov_duration"            ] != oldParameters["stage_2_ov_duration"            ]) { retry = true; setup_sendCommand(24064, 244, "", newParameters["stage_2_ov_duration"            ]); }
            if(newParameters.hasOwnProperty("qu_point_1_voltage"             ) && oldParameters.hasOwnProperty("qu_point_1_voltage"             ) && newParameters["qu_point_1_voltage"             ] != oldParameters["qu_point_1_voltage"             ]) { retry = true; setup_sendCommand(24064, 251, "", newParameters["qu_point_1_voltage"             ]); }
            if(newParameters.hasOwnProperty("qu_point_2_voltage"             ) && oldParameters.hasOwnProperty("qu_point_2_voltage"             ) && newParameters["qu_point_2_voltage"             ] != oldParameters["qu_point_2_voltage"             ]) { retry = true; setup_sendCommand(24064, 252, "", newParameters["qu_point_2_voltage"             ]); }
            if(newParameters.hasOwnProperty("qu_point_3_voltage"             ) && oldParameters.hasOwnProperty("qu_point_3_voltage"             ) && newParameters["qu_point_3_voltage"             ] != oldParameters["qu_point_3_voltage"             ]) { retry = true; setup_sendCommand(24064, 253, "", newParameters["qu_point_3_voltage"             ]); }
            if(newParameters.hasOwnProperty("qu_point_4_voltage"             ) && oldParameters.hasOwnProperty("qu_point_4_voltage"             ) && newParameters["qu_point_4_voltage"             ] != oldParameters["qu_point_4_voltage"             ]) { retry = true; setup_sendCommand(24064, 254, "", newParameters["qu_point_4_voltage"             ]); }
            if(newParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && newParameters["qu_point_1_reactive_power"      ] != oldParameters["qu_point_1_reactive_power"      ]) { retry = true; setup_sendCommand(24064, 255, "", newParameters["qu_point_1_reactive_power"      ]); }
            if(newParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && newParameters["qu_point_4_reactive_power"      ] != oldParameters["qu_point_4_reactive_power"      ]) { retry = true; setup_sendCommand(24064, 258, "", newParameters["qu_point_4_reactive_power"      ]); }
            if(newParameters.hasOwnProperty("qu_time_constant"               ) && oldParameters.hasOwnProperty("qu_time_constant"               ) && newParameters["qu_time_constant"               ] != oldParameters["qu_time_constant"               ]) { retry = true; setup_sendCommand(24064, 260, "", newParameters["qu_time_constant"               ]); }
            if(newParameters.hasOwnProperty("qu_enter_power"                 ) && oldParameters.hasOwnProperty("qu_enter_power"                 ) && newParameters["qu_enter_power"                 ] != oldParameters["qu_enter_power"                 ]) { retry = true; setup_sendCommand(24064, 261, "", newParameters["qu_enter_power"                 ]); }
            if(newParameters.hasOwnProperty("qu_exit_power"                  ) && oldParameters.hasOwnProperty("qu_exit_power"                  ) && newParameters["qu_exit_power"                  ] != oldParameters["qu_exit_power"                  ]) { retry = true; setup_sendCommand(24064, 262, "", newParameters["qu_exit_power"                  ]); }
            if(newParameters.hasOwnProperty("cosfp_point_b_power"            ) && oldParameters.hasOwnProperty("cosfp_point_b_power"            ) && newParameters["cosfp_point_b_power"            ] != oldParameters["cosfp_point_b_power"            ]) { retry = true; setup_sendCommand(24064, 272, "", newParameters["cosfp_point_b_power"            ]); }
            if(newParameters.hasOwnProperty("cosfp_enter_voltage"            ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"            ) && newParameters["cosfp_enter_voltage"            ] != oldParameters["cosfp_enter_voltage"            ]) { retry = true; setup_sendCommand(24064, 277, "", newParameters["cosfp_enter_voltage"            ]); }
            if(newParameters.hasOwnProperty("cosfp_exit_voltage"             ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"             ) && newParameters["cosfp_exit_voltage"             ] != oldParameters["cosfp_exit_voltage"             ]) { retry = true; setup_sendCommand(24064, 278, "", newParameters["cosfp_exit_voltage"             ]); }
            if(newParameters.hasOwnProperty("lvrt_switch"                    ) && oldParameters.hasOwnProperty("lvrt_switch"                    ) && newParameters["lvrt_switch"                    ] != oldParameters["lvrt_switch"                    ]) { retry = true; setup_sendCommand(24064, 291, "", newParameters["lvrt_switch"                    ]); }
            if(newParameters.hasOwnProperty("lvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"             ) && newParameters["lvrt_enter_voltage"             ] != oldParameters["lvrt_enter_voltage"             ]) { retry = true; setup_sendCommand(24064, 292, "", newParameters["lvrt_enter_voltage"             ]); }
            if(newParameters.hasOwnProperty("lvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"              ) && newParameters["lvrt_exit_voltage"              ] != oldParameters["lvrt_exit_voltage"              ]) { retry = true; setup_sendCommand(24064, 293, "", newParameters["lvrt_exit_voltage"              ]); }
            if(newParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && newParameters["lvrt_point_5_voltage"           ] != oldParameters["lvrt_point_5_voltage"           ]) { retry = true; setup_sendCommand(24064, 298, "", newParameters["lvrt_point_5_voltage"           ]); }
            if(newParameters.hasOwnProperty("lvrt_point_1_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"          ) && newParameters["lvrt_point_1_duration"          ] != oldParameters["lvrt_point_1_duration"          ]) { retry = true; setup_sendCommand(24064, 299, "", newParameters["lvrt_point_1_duration"          ]); }
            if(newParameters.hasOwnProperty("lvrt_point_2_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"          ) && newParameters["lvrt_point_2_duration"          ] != oldParameters["lvrt_point_2_duration"          ]) { retry = true; setup_sendCommand(24064, 300, "", newParameters["lvrt_point_2_duration"          ]); }
            if(newParameters.hasOwnProperty("lvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"          ) && newParameters["lvrt_point_3_duration"          ] != oldParameters["lvrt_point_3_duration"          ]) { retry = true; setup_sendCommand(24064, 301, "", newParameters["lvrt_point_3_duration"          ]); }
            if(newParameters.hasOwnProperty("lvrt_point_4_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"          ) && newParameters["lvrt_point_4_duration"          ] != oldParameters["lvrt_point_4_duration"          ]) { retry = true; setup_sendCommand(24064, 302, "", newParameters["lvrt_point_4_duration"          ]); }
            if(newParameters.hasOwnProperty("lvrt_point_5_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"          ) && newParameters["lvrt_point_5_duration"          ] != oldParameters["lvrt_point_5_duration"          ]) { retry = true; setup_sendCommand(24064, 303, "", newParameters["lvrt_point_5_duration"          ]); }
            if(newParameters.hasOwnProperty("hvrt_switch"                    ) && oldParameters.hasOwnProperty("hvrt_switch"                    ) && newParameters["hvrt_switch"                    ] != oldParameters["hvrt_switch"                    ]) { retry = true; setup_sendCommand(24064, 311, "", newParameters["hvrt_switch"                    ]); }
            if(newParameters.hasOwnProperty("hvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"             ) && newParameters["hvrt_enter_voltage"             ] != oldParameters["hvrt_enter_voltage"             ]) { retry = true; setup_sendCommand(24064, 312, "", newParameters["hvrt_enter_voltage"             ]); }
            if(newParameters.hasOwnProperty("hvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"              ) && newParameters["hvrt_exit_voltage"              ] != oldParameters["hvrt_exit_voltage"              ]) { retry = true; setup_sendCommand(24064, 313, "", newParameters["hvrt_exit_voltage"              ]); }
            if(newParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && newParameters["hvrt_point_1_voltage"           ] != oldParameters["hvrt_point_1_voltage"           ]) { retry = true; setup_sendCommand(24064, 314, "", newParameters["hvrt_point_1_voltage"           ]); }
            if(newParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && newParameters["hvrt_point_2_voltage"           ] != oldParameters["hvrt_point_2_voltage"           ]) { retry = true; setup_sendCommand(24064, 315, "", newParameters["hvrt_point_2_voltage"           ]); }
            if(newParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && newParameters["hvrt_point_3_voltage"           ] != oldParameters["hvrt_point_3_voltage"           ]) { retry = true; setup_sendCommand(24064, 316, "", newParameters["hvrt_point_3_voltage"           ]); }
            if(newParameters.hasOwnProperty("hvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"          ) && newParameters["hvrt_point_3_duration"          ] != oldParameters["hvrt_point_3_duration"          ]) { retry = true; setup_sendCommand(24064, 319, "", newParameters["hvrt_point_3_duration"          ]); }
            if(newParameters.hasOwnProperty("pu_time_constant"               ) && oldParameters.hasOwnProperty("pu_time_constant"               ) && newParameters["pu_time_constant"               ] != oldParameters["pu_time_constant"               ]) { retry = true; setup_sendCommand(24064, 336, "", newParameters["pu_time_constant"               ]); }
            if(newParameters.hasOwnProperty("lfsmo_threshold"                ) && oldParameters.hasOwnProperty("lfsmo_threshold"                ) && newParameters["lfsmo_threshold"                ] != oldParameters["lfsmo_threshold"                ]) { retry = true; setup_sendCommand(24064, 342, "", newParameters["lfsmo_threshold"                ]); }
            if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && newParameters["lfsmo_end_point_frequency"      ] != oldParameters["lfsmo_end_point_frequency"      ]) { retry = true; setup_sendCommand(24064, 344, "", newParameters["lfsmo_end_point_frequency"      ]); }
            if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && newParameters["lfsmo_power_recovery_rate"      ] != oldParameters["lfsmo_power_recovery_rate"      ]) { retry = true; setup_sendCommand(24064, 348, "", newParameters["lfsmo_power_recovery_rate"      ]); }
            if(newParameters.hasOwnProperty("lfsmo_droop"                    ) && oldParameters.hasOwnProperty("lfsmo_droop"                    ) && newParameters["lfsmo_droop"                    ] != oldParameters["lfsmo_droop"                    ]) { retry = true; setup_sendCommand(24064, 349, "", newParameters["lfsmo_droop"                    ]); }
            if(newParameters.hasOwnProperty("battery_type"                   ) && oldParameters.hasOwnProperty("battery_type"                   ) && newParameters["battery_type"                   ] != oldParameters["battery_type"                   ]) { retry = true; setup_sendCommand(24064, 401, "", newParameters["battery_type"                   ]); }

            if(!retry) {
                $(".setting-progress span").html(lang.system_setup.msg_setting_success).css("color", "#28a745");
                $("#notif").removeClass("loading error success").addClass("success");
                // Next Step
                setTimeout(function() { window.location.href = "system_test.php"; }, 2500);
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

                    else if(newParameters["prepareBatteryExtension"] != oldParameters["prepareBatteryExtension"]) showSettingParametersError("Problem when setting prepareBatteryExtension");
                    else if(newParameters["cloudSet"               ] != oldParameters["cloudSet"               ]) showSettingParametersError("Problem when setting cloudSet"               );

                    else if(newParameters.hasOwnProperty("reactive_mode"                  ) && oldParameters.hasOwnProperty("reactive_mode"                  ) && newParameters["reactive_mode"                  ] != oldParameters["reactive_mode"                  ]) showSettingParametersError("Problem when setting reactive_mode"                  );
                    else if(newParameters.hasOwnProperty("pf_mode_power_factor"           ) && oldParameters.hasOwnProperty("pf_mode_power_factor"           ) && newParameters["pf_mode_power_factor"           ] != oldParameters["pf_mode_power_factor"           ]) showSettingParametersError("Problem when setting pf_mode_power_factor"           );
                    else if(newParameters.hasOwnProperty("qt_mode_reactive_power"         ) && oldParameters.hasOwnProperty("qt_mode_reactive_power"         ) && newParameters["qt_mode_reactive_power"         ] != oldParameters["qt_mode_reactive_power"         ]) showSettingParametersError("Problem when setting qt_mode_reactive_power"         );
                    else if(newParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && oldParameters.hasOwnProperty("overvoltage_10min_threshold"    ) && newParameters["overvoltage_10min_threshold"    ] != oldParameters["overvoltage_10min_threshold"    ]) showSettingParametersError("Problem when setting overvoltage_10min_threshold"    );
                    else if(newParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_lower_voltage"     ) && newParameters["grid_connect_lower_voltage"     ] != oldParameters["grid_connect_lower_voltage"     ]) showSettingParametersError("Problem when setting grid_connect_lower_voltage"     );
                    else if(newParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && oldParameters.hasOwnProperty("grid_connect_upper_voltage"     ) && newParameters["grid_connect_upper_voltage"     ] != oldParameters["grid_connect_upper_voltage"     ]) showSettingParametersError("Problem when setting grid_connect_upper_voltage"     );
                    else if(newParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_lower_frequency"   ) && newParameters["grid_connect_lower_frequency"   ] != oldParameters["grid_connect_lower_frequency"   ]) showSettingParametersError("Problem when setting grid_connect_lower_frequency"   );
                    else if(newParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && oldParameters.hasOwnProperty("grid_connect_upper_frequency"   ) && newParameters["grid_connect_upper_frequency"   ] != oldParameters["grid_connect_upper_frequency"   ]) showSettingParametersError("Problem when setting grid_connect_upper_frequency"   );
                    else if(newParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && oldParameters.hasOwnProperty("wait_time_before_grid_connect"  ) && newParameters["wait_time_before_grid_connect"  ] != oldParameters["wait_time_before_grid_connect"  ]) showSettingParametersError("Problem when setting wait_time_before_grid_connect"  );
                    else if(newParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && oldParameters.hasOwnProperty("grid_reconnect_upper_voltage"   ) && newParameters["grid_reconnect_upper_voltage"   ] != oldParameters["grid_reconnect_upper_voltage"   ]) showSettingParametersError("Problem when setting grid_reconnect_upper_voltage"   );
                    else if(newParameters.hasOwnProperty("wait_time_before_grid_reconnect") && oldParameters.hasOwnProperty("wait_time_before_grid_reconnect") && newParameters["wait_time_before_grid_reconnect"] != oldParameters["wait_time_before_grid_reconnect"]) showSettingParametersError("Problem when setting wait_time_before_grid_reconnect");
                    else if(newParameters.hasOwnProperty("stage_1_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uv_threshold"           ) && newParameters["stage_1_uv_threshold"           ] != oldParameters["stage_1_uv_threshold"           ]) showSettingParametersError("Problem when setting stage_1_uv_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_1_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_1_ov_threshold"           ) && newParameters["stage_1_ov_threshold"           ] != oldParameters["stage_1_ov_threshold"           ]) showSettingParametersError("Problem when setting stage_1_ov_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_1_uf_threshold"           ) && oldParameters.hasOwnProperty("stage_1_uf_threshold"           ) && newParameters["stage_1_uf_threshold"           ] != oldParameters["stage_1_uf_threshold"           ]) showSettingParametersError("Problem when setting stage_1_uf_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_1_of_threshold"           ) && oldParameters.hasOwnProperty("stage_1_of_threshold"           ) && newParameters["stage_1_of_threshold"           ] != oldParameters["stage_1_of_threshold"           ]) showSettingParametersError("Problem when setting stage_1_of_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_1_uv_duration"            ) && oldParameters.hasOwnProperty("stage_1_uv_duration"            ) && newParameters["stage_1_uv_duration"            ] != oldParameters["stage_1_uv_duration"            ]) showSettingParametersError("Problem when setting stage_1_uv_duration"            );
                    else if(newParameters.hasOwnProperty("stage_1_ov_duration"            ) && oldParameters.hasOwnProperty("stage_1_ov_duration"            ) && newParameters["stage_1_ov_duration"            ] != oldParameters["stage_1_ov_duration"            ]) showSettingParametersError("Problem when setting stage_1_ov_duration"            );
                    else if(newParameters.hasOwnProperty("stage_1_uf_duration"            ) && oldParameters.hasOwnProperty("stage_1_uf_duration"            ) && newParameters["stage_1_uf_duration"            ] != oldParameters["stage_1_uf_duration"            ]) showSettingParametersError("Problem when setting stage_1_uf_duration"            );
                    else if(newParameters.hasOwnProperty("stage_1_of_duration"            ) && oldParameters.hasOwnProperty("stage_1_of_duration"            ) && newParameters["stage_1_of_duration"            ] != oldParameters["stage_1_of_duration"            ]) showSettingParametersError("Problem when setting stage_1_of_duration"            );
                    else if(newParameters.hasOwnProperty("stage_2_uv_threshold"           ) && oldParameters.hasOwnProperty("stage_2_uv_threshold"           ) && newParameters["stage_2_uv_threshold"           ] != oldParameters["stage_2_uv_threshold"           ]) showSettingParametersError("Problem when setting stage_2_uv_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_2_ov_threshold"           ) && oldParameters.hasOwnProperty("stage_2_ov_threshold"           ) && newParameters["stage_2_ov_threshold"           ] != oldParameters["stage_2_ov_threshold"           ]) showSettingParametersError("Problem when setting stage_2_ov_threshold"           );
                    else if(newParameters.hasOwnProperty("stage_2_uv_duration"            ) && oldParameters.hasOwnProperty("stage_2_uv_duration"            ) && newParameters["stage_2_uv_duration"            ] != oldParameters["stage_2_uv_duration"            ]) showSettingParametersError("Problem when setting stage_2_uv_duration"            );
                    else if(newParameters.hasOwnProperty("stage_2_ov_duration"            ) && oldParameters.hasOwnProperty("stage_2_ov_duration"            ) && newParameters["stage_2_ov_duration"            ] != oldParameters["stage_2_ov_duration"            ]) showSettingParametersError("Problem when setting stage_2_ov_duration"            );
                    else if(newParameters.hasOwnProperty("qu_point_1_voltage"             ) && oldParameters.hasOwnProperty("qu_point_1_voltage"             ) && newParameters["qu_point_1_voltage"             ] != oldParameters["qu_point_1_voltage"             ]) showSettingParametersError("Problem when setting qu_point_1_voltage"             );
                    else if(newParameters.hasOwnProperty("qu_point_2_voltage"             ) && oldParameters.hasOwnProperty("qu_point_2_voltage"             ) && newParameters["qu_point_2_voltage"             ] != oldParameters["qu_point_2_voltage"             ]) showSettingParametersError("Problem when setting qu_point_2_voltage"             );
                    else if(newParameters.hasOwnProperty("qu_point_3_voltage"             ) && oldParameters.hasOwnProperty("qu_point_3_voltage"             ) && newParameters["qu_point_3_voltage"             ] != oldParameters["qu_point_3_voltage"             ]) showSettingParametersError("Problem when setting qu_point_3_voltage"             );
                    else if(newParameters.hasOwnProperty("qu_point_4_voltage"             ) && oldParameters.hasOwnProperty("qu_point_4_voltage"             ) && newParameters["qu_point_4_voltage"             ] != oldParameters["qu_point_4_voltage"             ]) showSettingParametersError("Problem when setting qu_point_4_voltage"             );
                    else if(newParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_1_reactive_power"      ) && newParameters["qu_point_1_reactive_power"      ] != oldParameters["qu_point_1_reactive_power"      ]) showSettingParametersError("Problem when setting qu_point_1_reactive_power"      );
                    else if(newParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && oldParameters.hasOwnProperty("qu_point_4_reactive_power"      ) && newParameters["qu_point_4_reactive_power"      ] != oldParameters["qu_point_4_reactive_power"      ]) showSettingParametersError("Problem when setting qu_point_4_reactive_power"      );
                    else if(newParameters.hasOwnProperty("qu_time_constant"               ) && oldParameters.hasOwnProperty("qu_time_constant"               ) && newParameters["qu_time_constant"               ] != oldParameters["qu_time_constant"               ]) showSettingParametersError("Problem when setting qu_time_constant"               );
                    else if(newParameters.hasOwnProperty("qu_enter_power"                 ) && oldParameters.hasOwnProperty("qu_enter_power"                 ) && newParameters["qu_enter_power"                 ] != oldParameters["qu_enter_power"                 ]) showSettingParametersError("Problem when setting qu_enter_power"                 );
                    else if(newParameters.hasOwnProperty("qu_exit_power"                  ) && oldParameters.hasOwnProperty("qu_exit_power"                  ) && newParameters["qu_exit_power"                  ] != oldParameters["qu_exit_power"                  ]) showSettingParametersError("Problem when setting qu_exit_power"                  );
                    else if(newParameters.hasOwnProperty("cosfp_point_b_power"            ) && oldParameters.hasOwnProperty("cosfp_point_b_power"            ) && newParameters["cosfp_point_b_power"            ] != oldParameters["cosfp_point_b_power"            ]) showSettingParametersError("Problem when setting cosfp_point_b_power"            );
                    else if(newParameters.hasOwnProperty("cosfp_enter_voltage"            ) && oldParameters.hasOwnProperty("cosfp_enter_voltage"            ) && newParameters["cosfp_enter_voltage"            ] != oldParameters["cosfp_enter_voltage"            ]) showSettingParametersError("Problem when setting cosfp_enter_voltage"            );
                    else if(newParameters.hasOwnProperty("cosfp_exit_voltage"             ) && oldParameters.hasOwnProperty("cosfp_exit_voltage"             ) && newParameters["cosfp_exit_voltage"             ] != oldParameters["cosfp_exit_voltage"             ]) showSettingParametersError("Problem when setting cosfp_exit_voltage"             );
                    else if(newParameters.hasOwnProperty("lvrt_switch"                    ) && oldParameters.hasOwnProperty("lvrt_switch"                    ) && newParameters["lvrt_switch"                    ] != oldParameters["lvrt_switch"                    ]) showSettingParametersError("Problem when setting lvrt_switch"                    );
                    else if(newParameters.hasOwnProperty("lvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("lvrt_enter_voltage"             ) && newParameters["lvrt_enter_voltage"             ] != oldParameters["lvrt_enter_voltage"             ]) showSettingParametersError("Problem when setting lvrt_enter_voltage"             );
                    else if(newParameters.hasOwnProperty("lvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("lvrt_exit_voltage"              ) && newParameters["lvrt_exit_voltage"              ] != oldParameters["lvrt_exit_voltage"              ]) showSettingParametersError("Problem when setting lvrt_exit_voltage"              );
                    else if(newParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && oldParameters.hasOwnProperty("lvrt_point_5_voltage"           ) && newParameters["lvrt_point_5_voltage"           ] != oldParameters["lvrt_point_5_voltage"           ]) showSettingParametersError("Problem when setting lvrt_point_5_voltage"           );
                    else if(newParameters.hasOwnProperty("lvrt_point_1_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_1_duration"          ) && newParameters["lvrt_point_1_duration"          ] != oldParameters["lvrt_point_1_duration"          ]) showSettingParametersError("Problem when setting lvrt_point_1_duration"          );
                    else if(newParameters.hasOwnProperty("lvrt_point_2_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_2_duration"          ) && newParameters["lvrt_point_2_duration"          ] != oldParameters["lvrt_point_2_duration"          ]) showSettingParametersError("Problem when setting lvrt_point_2_duration"          );
                    else if(newParameters.hasOwnProperty("lvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_3_duration"          ) && newParameters["lvrt_point_3_duration"          ] != oldParameters["lvrt_point_3_duration"          ]) showSettingParametersError("Problem when setting lvrt_point_3_duration"          );
                    else if(newParameters.hasOwnProperty("lvrt_point_4_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_4_duration"          ) && newParameters["lvrt_point_4_duration"          ] != oldParameters["lvrt_point_4_duration"          ]) showSettingParametersError("Problem when setting lvrt_point_4_duration"          );
                    else if(newParameters.hasOwnProperty("lvrt_point_5_duration"          ) && oldParameters.hasOwnProperty("lvrt_point_5_duration"          ) && newParameters["lvrt_point_5_duration"          ] != oldParameters["lvrt_point_5_duration"          ]) showSettingParametersError("Problem when setting lvrt_point_5_duration"          );
                    else if(newParameters.hasOwnProperty("hvrt_switch"                    ) && oldParameters.hasOwnProperty("hvrt_switch"                    ) && newParameters["hvrt_switch"                    ] != oldParameters["hvrt_switch"                    ]) showSettingParametersError("Problem when setting hvrt_switch"                    );
                    else if(newParameters.hasOwnProperty("hvrt_enter_voltage"             ) && oldParameters.hasOwnProperty("hvrt_enter_voltage"             ) && newParameters["hvrt_enter_voltage"             ] != oldParameters["hvrt_enter_voltage"             ]) showSettingParametersError("Problem when setting hvrt_enter_voltage"             );
                    else if(newParameters.hasOwnProperty("hvrt_exit_voltage"              ) && oldParameters.hasOwnProperty("hvrt_exit_voltage"              ) && newParameters["hvrt_exit_voltage"              ] != oldParameters["hvrt_exit_voltage"              ]) showSettingParametersError("Problem when setting hvrt_exit_voltage"              );
                    else if(newParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_1_voltage"           ) && newParameters["hvrt_point_1_voltage"           ] != oldParameters["hvrt_point_1_voltage"           ]) showSettingParametersError("Problem when setting hvrt_point_1_voltage"           );
                    else if(newParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_2_voltage"           ) && newParameters["hvrt_point_2_voltage"           ] != oldParameters["hvrt_point_2_voltage"           ]) showSettingParametersError("Problem when setting hvrt_point_2_voltage"           );
                    else if(newParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && oldParameters.hasOwnProperty("hvrt_point_3_voltage"           ) && newParameters["hvrt_point_3_voltage"           ] != oldParameters["hvrt_point_3_voltage"           ]) showSettingParametersError("Problem when setting hvrt_point_3_voltage"           );
                    else if(newParameters.hasOwnProperty("hvrt_point_3_duration"          ) && oldParameters.hasOwnProperty("hvrt_point_3_duration"          ) && newParameters["hvrt_point_3_duration"          ] != oldParameters["hvrt_point_3_duration"          ]) showSettingParametersError("Problem when setting hvrt_point_3_duration"          );
                    else if(newParameters.hasOwnProperty("pu_time_constant"               ) && oldParameters.hasOwnProperty("pu_time_constant"               ) && newParameters["pu_time_constant"               ] != oldParameters["pu_time_constant"               ]) showSettingParametersError("Problem when setting pu_time_constant"               );
                    else if(newParameters.hasOwnProperty("lfsmo_threshold"                ) && oldParameters.hasOwnProperty("lfsmo_threshold"                ) && newParameters["lfsmo_threshold"                ] != oldParameters["lfsmo_threshold"                ]) showSettingParametersError("Problem when setting lfsmo_threshold"                );
                    else if(newParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && oldParameters.hasOwnProperty("lfsmo_end_point_frequency"      ) && newParameters["lfsmo_end_point_frequency"      ] != oldParameters["lfsmo_end_point_frequency"      ]) showSettingParametersError("Problem when setting lfsmo_end_point_frequency"      );
                    else if(newParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && oldParameters.hasOwnProperty("lfsmo_power_recovery_rate"      ) && newParameters["lfsmo_power_recovery_rate"      ] != oldParameters["lfsmo_power_recovery_rate"      ]) showSettingParametersError("Problem when setting lfsmo_power_recovery_rate"      );
                    else if(newParameters.hasOwnProperty("lfsmo_droop"                    ) && oldParameters.hasOwnProperty("lfsmo_droop"                    ) && newParameters["lfsmo_droop"                    ] != oldParameters["lfsmo_droop"                    ]) showSettingParametersError("Problem when setting lfsmo_droop"                    );
                    else if(newParameters.hasOwnProperty("battery_type"                   ) && oldParameters.hasOwnProperty("battery_type"                   ) && newParameters["battery_type"                   ] != oldParameters["battery_type"                   ]) showSettingParametersError("Problem when setting battery_type"                   );

                }
            }

        }
    });

}
