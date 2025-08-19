$progress.trigger("step", 6);





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Define Variables
*/

var energyMeter_firstRun = true;
var skipEnergyMeteryTest = false;

var batteryCharging_firstRun = true;
var batteryCharging_count = 0; // run 5 times (5sec delay), then finish
var batteryCharging_datetime = "";
var batteryCharging_alreadyCharged = false;
var batteryMinLevel = 20;
var batteryMaxLevel = boxType == "livex" ? 95 : 90; // old was 95%
var batteryMinVoltage = 51;
var batteryMaxVoltage = 53;
var batteryWaitCounter = 0;

var upsMode_firstRun = true;
var upsMode_count = 0; // run 5 times (5sec delay), then finish

function isLiFePO   () { return batteryType == "lifepo"; }
function isCarbon   () { return batteryType == "carbon"; }
function isOther    () { return batteryType == "other";  }
function isNoBattery() { return batteryType == "";       }





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Helper Function - Scroll To Bottom
*/

function scrollToBottom() { $("#log").scrollTop($("#log").prop("scrollHeight")); }





/*
    Helper Function - Show Loading
*/

function showLoading_energyMeter() {
    $("#testEnergyMeter .notif").removeClass("loading error success").addClass("loading");
    if(energyMeter_firstRun) $("#log").append(`<p class="head"><b>${lang.system_test.energy_meter}</b></p>`);
    $("#log").append(`<p>${lang.system_test.performing_test}</p>`);
    scrollToBottom();
}

function showLoading_batteryCharging() {
    $("#testBatteryCharging .notif").removeClass("loading error success").addClass("loading");
    if(batteryCharging_firstRun) $("#log").append(`<p class="head"><b>${lang.system_test.battery_charging}</b></p>`);
    $("#log").append(`<p>${lang.system_test.verifying_battery_soc}</p>`);
    scrollToBottom();
}

function showLoading_upsMode() {
    $("#testUpsMode .notif").removeClass("loading error success").addClass("loading");
    if(upsMode_firstRun) $("#log").append(`<p class="head"><b>${lang.system_test.ups_mode}</b></p>`);
    $("#log").append(`<p>${lang.system_test.check_output_active}</p>`);
    scrollToBottom();
}





/*
    Helper Function - Finish Step
*/

function finishStep() {
    setTimeout(() => { $("#btn_next").attr("disabled", false); }, 1000);
    $("#btn_next").on("click", () => { window.location.href = "accept_terms.php"; });
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Check Warnings
*/

function checkWarnings() {
    $.get({
        url: "api.php?get=warnings",
        error: () => { alert("E001. Please refresh the page! (Error while reading local warnings table)"); },
        success: (response) => {
            if(!response || !Array.isArray(response)) return alert("E002. Please refresh the page! (Bad response from local warnings table)");
            var warnings = response[0][1];
            // Warning - AC Input Loss
            if(warnings.includes(16640) || warnings.includes(12544)) {
                $(".container").hide();
                $("#warningsModal").modal({ backdrop: "static", show: true }).find(".modal-body p").text(lang.system_test.warning_16640);
            }
            // Warning - AC Phase Dislocation
            else if(warnings.includes(16642)) {
                $(".container").hide();
                $("#warningsModal").modal({ backdrop: "static", show: true }).find(".modal-body p").text(lang.system_test.warning_16642);
            }
            // No Warnings - Start Testing
            else testEnergyMeter();
        }
    });
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test Energy Meter
*/

function testEnergyMeter() {

    showLoading_energyMeter();

    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E003. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {
            if(!response || typeof response != "object") return alert("E004. Please refresh the page! (Bad response from local currentstate table)");
            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW
            setTimeout(() => {
                $("#testEnergyMeter .notif").removeClass("loading error success");
                var currentErrorId = "";
                if(!response.hasOwnProperty("2913")) {
                    currentErrorId = "1";
                } else {
                    if(             !response["2913"].hasOwnProperty(  "0")) currentErrorId =   "1";
                    if(hasExtSol && !response["2913"].hasOwnProperty(  "3")) currentErrorId =   "2";
                    if(hasMeter1 && !response["2913"].hasOwnProperty("101")) currentErrorId = "101";
                    if(hasMeter2 && !response["2913"].hasOwnProperty("102")) currentErrorId = "102";
                    if(hasMeter3 && !response["2913"].hasOwnProperty("103")) currentErrorId = "103";
                    if(hasMeter4 && !response["2913"].hasOwnProperty("104")) currentErrorId = "104";
                }
                if(!currentErrorId) {
                    $("#testEnergyMeter .notif").addClass("success");
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.performing_test}`);
                    setTimeout(testBatteryCharging, 2500);
                } else {
                    $("#testEnergyMeter .notif").addClass("error");
                    $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (Modbus ID <b style="color:red">${currentErrorId}</b>)`);
                    if(skipEnergyMeteryTest) {
                        if(confirm("Continue without Energy Meter?")) {
                            setTimeout(testBatteryCharging, 2500);
                        } else {
                            skipEnergyMeteryTest = false;
                            setTimeout(testEnergyMeter, 5000);
                        }
                    } else {
                        setTimeout(testEnergyMeter, 5000);
                    }
                }
            }, 2500);
            energyMeter_firstRun = false;
        }
    });

}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test Battery Charging
*/

function testBatteryCharging() {

    // IF battery_type == other AND battery_capacity == 0
    if(noBattery) return finishStep();

    showLoading_batteryCharging();
    batteryCharging_firstRun = false;

    // Check Battery Level
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E005. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object")
                return alert("E006. Please refresh the page! (Bad response from local currentstate table)");

            if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1"))
                return alert("E007. Please refresh the page! (Missing value 1074,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            var batteryLevel = parseInt(response["1074"]["1"]);
            var batteryVoltage = parseInt(response["1042"]["1"]) / 100;

            // Charge Battery
            if(!batteryCharging_alreadyCharged && (isLiFePO() && batteryLevel < batteryMinLevel || !isLiFePO() && batteryVoltage < batteryMinVoltage)) {
                if(isLiFePO()) {
                    $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.verifying_battery_soc} (${batteryLevel}%)`);
                    $("#log").append(`<p>${lang.system_test.charging_battery_to} ${batteryMinLevel}%</p>`);
                } else {
                    $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.verifying_battery_soc} (${batteryVoltage}V)`);
                    $("#log").append(`<p>${lang.system_test.charging_battery_to} ${batteryMinVoltage}V</p>`);
                }
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1",
                    error: () => { alert("E008. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => {
                        if(response != "1") return alert("E009. Please refresh the page! (Bad response while writing command to local database)");
                        batteryCharging_count = 0;
                        batteryWaitCounter = 10;
                        setTimeout(testBatteryCharging_waitUntilCharged, 15000);
                    }
                });
            }
            // Discharge Battery
            else if(!batteryCharging_alreadyCharged && (isLiFePO() && batteryLevel > batteryMaxLevel || !isLiFePO() && batteryVoltage > batteryMaxVoltage)) {
                if(isLiFePO()) {
                    $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.verifying_battery_soc} (${batteryLevel}%)`);
                    $("#log").append(`<p>${lang.system_test.discharging_battery_to} ${batteryMaxLevel}%</p>`);
                } else {
                    $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.verifying_battery_soc} (${batteryVoltage}V)`);
                    $("#log").append(`<p>${lang.system_test.discharging_battery_to} ${batteryMaxVoltage}V</p>`);
                }
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=5&text2=1",
                    error: () => { alert("E010. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => {
                        if(response != "1") return alert("E011. Please refresh the page! (Bad response while writing command to local database)");
                        batteryCharging_count = 0;
                        batteryWaitCounter = 10;
                        setTimeout(testBatteryCharging_waitUntilDischarged, 15000);
                    }
                });
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0",
                    error: () => { alert("E012. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => { if(response != "1") alert("E013. Please refresh the page! (Bad response while writing command to local database)"); }
                });
            }
            // Continue Testing
            else {
                if(isLiFePO()) {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.verifying_battery_soc} (${batteryLevel}%)`);
                    $("#log").append(`<p>${lang.system_test.enable_ac_charging}</p>`);
                } else {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.verifying_battery_soc} (${batteryVoltage}V)`);
                    $("#log").append(`<p>${lang.system_test.enable_ac_charging}</p>`);
                }
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1",
                    error: () => { alert("E014. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => {
                        if(response != "1") return alert("E015. Please refresh the page! (Bad response while writing command to local database)");
                        batteryCharging_count = 0;
                        setTimeout(testBatteryCharging_waitUntilSet, 5000);
                    }
                });
            }

        }
    });

}





function testBatteryCharging_waitUntilCharged() {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E016. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object") return alert("E017. Please refresh the page! (Bad response from local currentstate table)");
            if(!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return alert("E018. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
            if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return alert("E019. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
            if(!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return alert("E02A. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
            if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("3")) return alert("E020. Please refresh the page! (Missing value 2465,3 from local currentstate table)");
            if(response["2465"]["3"] != 11) return alert("E021. Please refresh the page! (BatteryChargingAC could not be set to forced-on)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            if(isLiFePO()) {
                if(batteryWaitCounter < 1 && response["1074"]["1"] >= batteryMinLevel) {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.charging_battery_to} ${batteryMinLevel}%`);
                    batteryCharging_alreadyCharged = true;
                    testBatteryCharging();
                } else {
                    batteryWaitCounter -= 1;
                    $("#log p:last-child").html(`${lang.system_test.charging_battery_to} ${batteryMinLevel}%<br>${lang.system_test.current_status}: ${response["1074"]["1"]}% / ${response["1121"]["1"]}W`);
                    setTimeout(testBatteryCharging_waitUntilCharged, 5000);
                }
            } else {
                if(batteryWaitCounter < 1 && parseInt(response["1042"]["1"]) / 100 >= batteryMinVoltage) {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.charging_battery_to} ${batteryMinVoltage}V`);
                    batteryCharging_alreadyCharged = true;
                    testBatteryCharging();
                } else {
                    batteryWaitCounter -= 1;
                    $("#log p:last-child").html(`${lang.system_test.charging_battery_to} ${batteryMinVoltage}V<br>${lang.system_test.current_status}: ${parseInt(response["1042"]["1"]) / 100}V / ${response["1121"]["1"]}W`);
                    setTimeout(testBatteryCharging_waitUntilCharged, 5000);
                }
            }

        }
    });
}





function testBatteryCharging_waitUntilDischarged() {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E022. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object") return alert("E023. Please refresh the page! (Bad response from local currentstate table)");
            if(!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return alert("E024. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
            if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return alert("E025. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
            if(!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return alert("E026. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
            if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("5")) return alert("E026. Please refresh the page! (Missing value 2465,5 from local currentstate table)");
            if(!response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0")) return alert("E027. Please refresh the page! (Missing value 1634,0 from local currentstate table)");
            if(response["2465"]["5"] != 11) return alert("E028. Please refresh the page! (BatteryDischargingAC could not be set to forced-on)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            if(isLiFePO()) {
                if(batteryWaitCounter < 1 && response["1074"]["1"] <= batteryMaxLevel) {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.discharging_battery_to} ${batteryMaxLevel}%`);
                    $("#testBatteryCharging span span").html("");
                    testBatteryCharging();
                } else {
                    batteryWaitCounter -= 1;
                    $("#log p:last-child").html(`${lang.system_test.discharging_battery_to} ${batteryMaxLevel}%<br>${lang.system_test.current_status}: ${response["1074"]["1"]}% / ${response["1121"]["1"]}W`);
                    $("#testBatteryCharging span span").html(parseInt(response["1634"]["0"]) > 100 ? lang.system_test.turn_solar_off : "");
                    setTimeout(testBatteryCharging_waitUntilDischarged, 5000);
                }
            } else {
                if(batteryWaitCounter < 1 && parseInt(response["1042"]["1"]) / 100 <= batteryMaxVoltage) {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.discharging_battery_to} ${batteryMaxVoltage}V`);
                    $("#testBatteryCharging span span").html("");
                    testBatteryCharging();
                } else {
                    batteryWaitCounter -= 1;
                    $("#log p:last-child").html(`${lang.system_test.discharging_battery_to} ${batteryMaxVoltage}V<br>${lang.system_test.current_status}: ${parseInt(response["1042"]["1"]) / 100}V / ${response["1121"]["1"]}W`);
                    $("#testBatteryCharging span span").html(parseInt(response["1634"]["0"]) > 100 ? lang.system_test.turn_solar_off : "");
                    setTimeout(testBatteryCharging_waitUntilDischarged, 5000);
                }
            }

        }
    });
}





function testBatteryCharging_waitUntilSet() {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E029. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {
            if(!response || typeof response != "object")
                return alert("E030. Please refresh the page! (Bad response from local currentstate table)");
            if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("3"))
                return alert("E031. Please refresh the page! (Missing value 2465,3 from local currentstate table)");
            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW
            // Check If Enabled
            if(response["2465"]["3"] != 11)
                setTimeout(testBatteryCharging_waitUntilSet, 5000);
            else
                setTimeout(() => {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.enable_ac_charging}`);
                    $("#log").append(`<p>${lang.system_test.performing_test} (1 / 5)</p>`);
                    testBatteryCharging_test();
                }, 15000); // Wait 15 seconds
        }
    });
}





function testBatteryCharging_test() {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E032. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1"))
                return alert("E033. Please refresh the page! (Bad response or missing value 1121,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            var batteryPower = parseInt(response["1121"]["1"]);
            batteryCharging_count += 1;
            $("#log p:last-child").html(`${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);

            if(batteryPower > 100) { // Charging with over 100W
                if(batteryCharging_count < 5)
                    setTimeout(testBatteryCharging_test, 5000);
                else {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);
                    $.get({
                        url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0",
                        error: () => { alert("E034. Please refresh the page! (Error while writing command to local database)"); },
                        success: (response) => {
                            if(response != "1") return alert("E035. Please refresh the page! (Bad response while writing command to local database)");
                            $("#log").append(`<p>${lang.system_test.disable_ac_charging}</p>`);
                            scrollToBottom();
                            testBatteryCharging_waitUntilReset();
                        }
                    });
                    $.get({
                        url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0",
                        error: () => { alert("E036. Please refresh the page! (Error while writing command to local database)"); },
                        success: (response) => { if(response != "1") alert("E037. Please refresh the page! (Bad response while writing command to local database)"); }
                    });
                }
            } else {
                $("#testBatteryCharging .notif").removeClass("loading error success").addClass("error");
                $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);
                setTimeout(testBatteryCharging, 5000);
            }

        }
    });
}





function testBatteryCharging_waitUntilReset() {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E038. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {
            if(!response || typeof response != "object") return alert("E039. Please refresh the page! (Bad response from local currentstate table)");
            if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("3")) return alert("E040. Please refresh the page! (Missing value 2465,3 from local currentstate table)");
            if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("5")) return alert("E041. Please refresh the page! (Missing value 2465,5 from local currentstate table)");
            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW
            // Check If Disabled
            if(response["2465"]["3"] != 10 && response["2465"]["5"] != 10)
                setTimeout(testBatteryCharging_waitUntilReset, 5000);
            else {
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=3&text2=2",
                    error: () => { alert("E042. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => {
                        if(response != "1") return alert("E043. Please refresh the page! (Bad response while writing command to local database)");
                        $("#testBatteryCharging .notif").removeClass("loading error success").addClass("success");
                        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.disable_ac_charging}`);
                        setTimeout(testUpsMode, 2500);
                    }
                });
                $.get({
                    url: "api.php?set=command&type=20738&entity=0&text1=5&text2=2",
                    error: () => { alert("E044. Please refresh the page! (Error while writing command to local database)"); },
                    success: (response) => { if(response != "1") alert("E045. Please refresh the page! (Bad response while writing command to local database)"); }
                });
            }
        }
    });
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test UPS Mode
*/

function testUpsMode() {

    // IF system_mode == 1
    if(backupMode) return finishStep();

    showLoading_upsMode();

    // Check Output Voltage
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E046. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
                return alert("E047. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            var voltage1 = undefined;
            var voltage2 = undefined;
            var voltage3 = undefined;

            if(response.hasOwnProperty("1297") && response["1297"].hasOwnProperty("1")) voltage1 = response["1297"]["1"];
            if(response.hasOwnProperty("1298") && response["1298"].hasOwnProperty("1")) voltage2 = response["1298"]["1"];
            if(response.hasOwnProperty("1299") && response["1299"].hasOwnProperty("1")) voltage3 = response["1299"]["1"];

            outputIsActive = undefined;

            if(voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                outputIsActive = (voltage1 > 10000);
            else if(voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                outputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else alert("E048. Please refresh the page! (Some of the ups output voltage values are missing from currentstate table)");

            if(outputIsActive == true) {
                // Continue With Test
                $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.check_output_active}`);
                $("#log").append(`<p>${lang.system_test.turn_input_off}</p>`);
                scrollToBottom();
                $("#testUpsMode span span").html(lang.system_test.turn_input_off);
                setTimeout(testUpsMode_waitingForInput, 5000);
            } else if(outputIsActive != undefined) {
                // Show Error
                $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.check_output_active}`);
                $("#testUpsMode span span").html(lang.system_test.turn_output_on);
                setTimeout(() => { testUpsMode(); }, 5000);
            }

        }
    });

    upsMode_firstRun = false;

}





function testUpsMode_waitingForInput() {

    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E049. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1") || !response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0"))
                return alert("E050. Please refresh the page! (Bad response or missing value 273,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            var voltage1 = undefined;
            var voltage2 = undefined;
            var voltage3 = undefined;
            var solPower = undefined;

            if(response.hasOwnProperty("273") && response["273"].hasOwnProperty("1")) voltage1 = response["273"]["1"];
            if(response.hasOwnProperty("274") && response["274"].hasOwnProperty("1")) voltage2 = response["274"]["1"];
            if(response.hasOwnProperty("275") && response["275"].hasOwnProperty("1")) voltage3 = response["275"]["1"];
            solPower = response["1634"]["0"];

            inputIsActive = undefined;
            solarIsActive = (solPower > 1);

            if(voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                inputIsActive = (voltage1 > 10000);
            else if(voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                inputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else alert("E051. Please refresh the page! (Some of the ups input voltage values are missing from currentstate table)");

            if(inputIsActive == false && solarIsActive == false) {
                // Continue With Test
                $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.turn_input_off}`);
                $("#log").append(`<p>${lang.system_test.performing_test} (1 / 5)</p>`);
                scrollToBottom();
                $("#testUpsMode span span").html("");
                setTimeout(testUpsMode_test, 5000);
            } else if(inputIsActive != undefined && solarIsActive != undefined) {
                // Retry
                setTimeout(testUpsMode_waitingForInput, 5000);
            }

        }
    });

}





function testUpsMode_test() {

    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E052. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
                return alert("E053. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            upsMode_count += 1;
            $("#log p:last-child").html(`${lang.system_test.performing_test} (${upsMode_count} / 5)`);

            var voltage1 = undefined;
            var voltage2 = undefined;
            var voltage3 = undefined;

            if(response.hasOwnProperty("1297") && response["1297"].hasOwnProperty("1")) voltage1 = response["1297"]["1"];
            if(response.hasOwnProperty("1298") && response["1298"].hasOwnProperty("1")) voltage2 = response["1298"]["1"];
            if(response.hasOwnProperty("1299") && response["1299"].hasOwnProperty("1")) voltage3 = response["1299"]["1"];

            outputIsActive = undefined;

            if(voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                outputIsActive = (voltage1 > 10000);
            else if(voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                outputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else alert("E054. Please refresh the page! (Some of the ups output voltage values are missing from currentstate table)");

            if(outputIsActive == true) {
                if(upsMode_count < 5)
                    setTimeout(testUpsMode_test, 5000);
                else {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.performing_test} (${upsMode_count} / 5)`);
                    testUpsMode_finish();
                }
            } else if(outputIsActive != undefined) {
                $("#testUpsMode .notif").removeClass("loading error success").addClass("error");
                $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (${upsMode_count} / 5)`);
                scrollToBottom();
            }

        }
    });

}





function testUpsMode_finish() {
        
    // Check Input Voltage
    $.get({
        url: "api.php?get=currentstate",
        error: () => { alert("E055. Please refresh the page! (Error while reading local currentstate table)"); },
        success: (response) => {

            if(!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1"))
                return alert("E056. Please refresh the page! (Bad response from local currentstate table)");
            
            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!"); // NEW

            var voltage1 = undefined;
            var voltage2 = undefined;
            var voltage3 = undefined;

            if(response.hasOwnProperty("273") && response["273"].hasOwnProperty("1")) voltage1 = response["273"]["1"];
            if(response.hasOwnProperty("274") && response["274"].hasOwnProperty("1")) voltage2 = response["274"]["1"];
            if(response.hasOwnProperty("275") && response["275"].hasOwnProperty("1")) voltage3 = response["275"]["1"];

            inputIsActive = undefined;

            if(voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                inputIsActive = (voltage1 > 10000);
            else if(voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                inputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else alert("E057. Please refresh the page! (Some of the ups input voltages are missing from currentstate table)");

            if(inputIsActive == true) {
                // Finish Step
                $("#testUpsMode .notif").removeClass("loading error success").addClass("success");
                $("#testUpsMode span span").html("");
                finishStep();
            } else if(inputIsActive != undefined) {
                // Retry
                $("#testUpsMode span span").html(lang.system_test.turn_input_on);
                setTimeout(testUpsMode_finish, 5000);
            }

        }
    });
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Begin Testing
*/

checkWarnings();
