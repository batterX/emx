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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}





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

async function finishStep() {
    await sleep(1000);
    $("#btn_next").attr("disabled", false);
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

async function checkWarnings() {
    try {
        const response = await $.get({url: "api.php?get=warnings"});
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
    } catch (error) {
        alert("E001. Please refresh the page! (Error while reading local warnings table)");
    }
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test Energy Meter
*/

async function testEnergyMeter() {

    showLoading_energyMeter();

    try {
        const response = await $.get({url: "api.php?get=currentstate"});
        if(!response || typeof response != "object") return alert("E004. Please refresh the page! (Bad response from local currentstate table)");
        if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");
        
        energyMeter_firstRun = false;
        await sleep(2500);
        
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
            await sleep(2500);
            testBatteryCharging();
        } else {
            $("#testEnergyMeter .notif").addClass("error");
            $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (Modbus ID <b style="color:red">${currentErrorId}</b>)`);
            if(skipEnergyMeteryTest) {
                if(confirm("Continue without Energy Meter?")) {
                    await sleep(2500);
                    testBatteryCharging();
                } else {
                    skipEnergyMeteryTest = false;
                    await sleep(5000);
                    testEnergyMeter();
                }
            } else {
                await sleep(5000);
                testEnergyMeter();
            }
        }
    } catch (error) {
        alert("E003. Please refresh the page! (Error while reading local currentstate table)");
    }

}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test Battery Charging
*/

async function testBatteryCharging() {

    // IF battery_type == other AND battery_capacity == 0
    if(noBattery) return finishStep();

    showLoading_batteryCharging();
    batteryCharging_firstRun = false;

    try {
        // Check Battery Level
        const response = await $.get({url: "api.php?get=currentstate"});
        
        if(!response || typeof response != "object")
            return alert("E006. Please refresh the page! (Bad response from local currentstate table)");

        if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1"))
            return alert("E007. Please refresh the page! (Missing value 1074,1 from local currentstate table)");

        if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

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
            batteryCharging_count = 0;
            batteryWaitCounter = 10;
            testBatteryCharging_waitUntilCharged();
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
            batteryCharging_count = 0;
            batteryWaitCounter = 10;
            testBatteryCharging_waitUntilDischarged();
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
            batteryCharging_count = 0;
            testBatteryCharging_waitUntilSet();
        }
    } catch (error) {
        alert("E005. Please refresh the page! (Error while reading local currentstate table)");
    }

}





async function testBatteryCharging_waitUntilCharged() {
    try {
        // Keep trying to set the charging command until it's actually applied
        while (true) {
            const cmdResponse = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1"});
            if(cmdResponse != "1") return alert("E009. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait 15 seconds and check if the command was actually applied
            await sleep(15000);
            
            // Check if the setting is actually applied by reading current state
            const checkResponse = await $.get({url: "api.php?get=currentstate"});
            if(checkResponse && checkResponse.hasOwnProperty("2465") && checkResponse["2465"].hasOwnProperty("3") && checkResponse["2465"]["3"] == 11) {
                // Command successfully applied, break out of retry loop
                break;
            }
            // If not applied, the loop will continue and retry the command
        }
        
        // Now monitor until battery is charged
        while (true) {
            try {
                const response = await $.get({url: "api.php?get=currentstate"});

                if(!response || typeof response != "object") return alert("E017. Please refresh the page! (Bad response from local currentstate table)");
                if(!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return alert("E018. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
                if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return alert("E019. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
                if(!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return alert("E02A. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
                if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("3")) return alert("E020. Please refresh the page! (Missing value 2465,3 from local currentstate table)");
                if(response["2465"]["3"] != 11) return alert("E021. Please refresh the page! (BatteryChargingAC could not be set to forced-on)");

                if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

                if(isLiFePO()) {
                    if(batteryWaitCounter < 1 && response["1074"]["1"] >= batteryMinLevel) {
                        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.charging_battery_to} ${batteryMinLevel}%`);
                        batteryCharging_alreadyCharged = true;
                        testBatteryCharging();
                        return;
                    } else {
                        batteryWaitCounter -= 1;
                        $("#log p:last-child").html(`${lang.system_test.charging_battery_to} ${batteryMinLevel}%<br>${lang.system_test.current_status}: ${response["1074"]["1"]}% / ${response["1121"]["1"]}W`);
                    }
                } else {
                    if(batteryWaitCounter < 1 && parseInt(response["1042"]["1"]) / 100 >= batteryMinVoltage) {
                        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.charging_battery_to} ${batteryMinVoltage}V`);
                        batteryCharging_alreadyCharged = true;
                        testBatteryCharging();
                        return;
                    } else {
                        batteryWaitCounter -= 1;
                        $("#log p:last-child").html(`${lang.system_test.charging_battery_to} ${batteryMinVoltage}V<br>${lang.system_test.current_status}: ${parseInt(response["1042"]["1"]) / 100}V / ${response["1121"]["1"]}W`);
                    }
                }

                await sleep(5000);
            } catch (error) {
                alert("E016. Please refresh the page! (Error while reading local currentstate table)");
                return;
            }
        }
    } catch (error) {
        alert("E008. Please refresh the page! (Error while writing command to local database)");
    }
}





async function testBatteryCharging_waitUntilDischarged() {
    try {
        // Keep trying to set both discharge commands until they're both applied
        while (true) {
            // Send both commands
            const cmdResponse1 = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=5&text2=1"});
            if(cmdResponse1 != "1") return alert("E011. Please refresh the page! (Bad response while writing command to local database)");
            
            const cmdResponse2 = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0"});
            if(cmdResponse2 != "1") return alert("E013. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait 15 seconds and check if both commands were actually applied
            await sleep(15000);
            
            // Check if both settings are actually applied by reading current state
            const checkResponse = await $.get({url: "api.php?get=currentstate"});
            if(checkResponse && 
               checkResponse.hasOwnProperty("2465") && 
               checkResponse["2465"].hasOwnProperty("5") && checkResponse["2465"]["5"] == 11 &&
               checkResponse["2465"].hasOwnProperty("3") && checkResponse["2465"]["3"] == 10) {
                // Both commands successfully applied, break out of retry loop
                break;
            }
            // If not applied, the loop will continue and retry both commands
        }
        
        // Now monitor until battery is discharged
        while (true) {
            try {
                const response = await $.get({url: "api.php?get=currentstate"});

                if(!response || typeof response != "object") return alert("E023. Please refresh the page! (Bad response from local currentstate table)");
                if(!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return alert("E024. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
                if(!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return alert("E025. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
                if(!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return alert("E026. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
                if(!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("5")) return alert("E026. Please refresh the page! (Missing value 2465,5 from local currentstate table)");
                if(!response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0")) return alert("E027. Please refresh the page! (Missing value 1634,0 from local currentstate table)");
                if(response["2465"]["5"] != 11) return alert("E028. Please refresh the page! (BatteryDischargingAC could not be set to forced-on)");

                if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

                if(isLiFePO()) {
                    if(batteryWaitCounter < 1 && response["1074"]["1"] <= batteryMaxLevel) {
                        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.discharging_battery_to} ${batteryMaxLevel}%`);
                        $("#testBatteryCharging span span").html("");
                        testBatteryCharging();
                        return;
                    } else {
                        batteryWaitCounter -= 1;
                        $("#log p:last-child").html(`${lang.system_test.discharging_battery_to} ${batteryMaxLevel}%<br>${lang.system_test.current_status}: ${response["1074"]["1"]}% / ${response["1121"]["1"]}W`);
                        $("#testBatteryCharging span span").html(parseInt(response["1634"]["0"]) > 100 ? lang.system_test.turn_solar_off : "");
                    }
                } else {
                    if(batteryWaitCounter < 1 && parseInt(response["1042"]["1"]) / 100 <= batteryMaxVoltage) {
                        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.discharging_battery_to} ${batteryMaxVoltage}V`);
                        $("#testBatteryCharging span span").html("");
                        testBatteryCharging();
                        return;
                    } else {
                        batteryWaitCounter -= 1;
                        $("#log p:last-child").html(`${lang.system_test.discharging_battery_to} ${batteryMaxVoltage}V<br>${lang.system_test.current_status}: ${parseInt(response["1042"]["1"]) / 100}V / ${response["1121"]["1"]}W`);
                        $("#testBatteryCharging span span").html(parseInt(response["1634"]["0"]) > 100 ? lang.system_test.turn_solar_off : "");
                    }
                }

                await sleep(5000);
            } catch (error) {
                alert("E022. Please refresh the page! (Error while reading local currentstate table)");
                return;
            }
        }
    } catch (error) {
        alert("E010. Please refresh the page! (Error while writing command to local database)");
    }
}





async function testBatteryCharging_waitUntilSet() {
    try {
        // Keep trying to set the command until it's actually applied
        while (true) {
            const cmdResponse2 = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1"});
            if(cmdResponse2 != "1") return alert("E015. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait 15 seconds and check if the command was actually applied
            await sleep(15000);
            
            // Check if the setting is actually applied by reading current state
            const checkResponse = await $.get({url: "api.php?get=currentstate"});
            if(checkResponse && checkResponse.hasOwnProperty("2465") && checkResponse["2465"].hasOwnProperty("3") && checkResponse["2465"]["3"] == 11) {
                // Command successfully applied, break out of retry loop
                break;
            }
            // If not applied, the loop will continue and retry the command
        }
        
        $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.enable_ac_charging}`);
        $("#log").append(`<p>${lang.system_test.performing_test} (1 / 5)</p>`);
        testBatteryCharging_test();
    } catch (error) {
        alert("E014. Please refresh the page! (Error while writing command to local database)");
    }
}




async function testBatteryCharging_test() {
    while (true) {
        try {
            const response = await $.get({url: "api.php?get=currentstate"});

            if(!response || typeof response != "object" || !response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1"))
                return alert("E033. Please refresh the page! (Bad response or missing value 1121,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

            var batteryPower = parseInt(response["1121"]["1"]);
            batteryCharging_count += 1;
            $("#log p:last-child").html(`${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);

            if(batteryPower > 100) { // Charging with over 100W
                if(batteryCharging_count < 5) {
                    await sleep(5000);
                } else {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);
                    $("#log").append(`<p>${lang.system_test.disable_ac_charging}</p>`);
                    scrollToBottom();
                    testBatteryCharging_waitUntilReset();
                    return;
                }
            } else {
                $("#testBatteryCharging .notif").removeClass("loading error success").addClass("error");
                $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (${batteryCharging_count} / 5)`);
                await sleep(5000);
                testBatteryCharging();
                return;
            }
        } catch (error) {
            alert("E032. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}





async function testBatteryCharging_waitUntilReset() {
    try {
        // Keep trying to set both reset commands until they're both applied
        while (true) {
            // Send both reset commands
            const cmdResponse1 = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0"});
            if(cmdResponse1 != "1") return alert("E035. Please refresh the page! (Bad response while writing command to local database)");
            
            const cmdResponse2 = await $.get({url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0"});
            if(cmdResponse2 != "1") return alert("E037. Please refresh the page! (Bad response while writing command to local database)");
            
            // Wait 15 seconds and check if both commands were actually applied
            await sleep(15000);
            
            // Check if both settings are actually applied by reading current state
            const checkResponse = await $.get({url: "api.php?get=currentstate"});
            if(checkResponse && 
               checkResponse.hasOwnProperty("2465") && 
               checkResponse["2465"].hasOwnProperty("3") && checkResponse["2465"]["3"] == 10 &&
               checkResponse["2465"].hasOwnProperty("5") && checkResponse["2465"]["5"] == 10) {
                // Both commands successfully applied, break out of retry loop
                break;
            }
            // If not applied, the loop will continue and retry both commands
        }
        
        // Now set final commands and finish
        try {
            // Set all parameters to auto (fire-and-forget)
            $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=2" });
            $.get({ url: "api.php?set=command&type=20738&entity=0&text1=2&text2=2" });
            $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=2" });
            $.get({ url: "api.php?set=command&type=20738&entity=0&text1=4&text2=2" });
            $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=2" });
            
            $("#testBatteryCharging .notif").removeClass("loading error success").addClass("success");
            $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.disable_ac_charging}`);
            
            await sleep(2500);
            testUpsMode();
        } catch (error) {
            alert("E042. Please refresh the page! (Error while writing command to local database)");
        }
    } catch (error) {
        alert("E034. Please refresh the page! (Error while writing command to local database)");
    }
}





//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////





/*
    Test UPS Mode
*/

async function testUpsMode() {

    // IF system_mode == 1
    if(backupMode) return finishStep();

    showLoading_upsMode();
    upsMode_firstRun = false;

    try {
        // Check Output Voltage
        const response = await $.get({url: "api.php?get=currentstate"});

        if(!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
            return alert("E047. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");

        if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

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
            await sleep(5000);
            testUpsMode_waitingForInput();
        } else if(outputIsActive != undefined) {
            // Show Error
            $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.check_output_active}`);
            $("#testUpsMode span span").html(lang.system_test.turn_output_on);
            await sleep(5000);
            testUpsMode();
        }
    } catch (error) {
        alert("E046. Please refresh the page! (Error while reading local currentstate table)");
    }

}





async function testUpsMode_waitingForInput() {
    while (true) {
        try {
            const response = await $.get({url: "api.php?get=currentstate"});

            if(!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1") || !response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0"))
                return alert("E050. Please refresh the page! (Bad response or missing value 273,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

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
                await sleep(5000);
                testUpsMode_test();
                return;
            } else if(inputIsActive != undefined && solarIsActive != undefined) {
                // Retry
                await sleep(5000);
            }
        } catch (error) {
            alert("E049. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}





async function testUpsMode_test() {
    while (true) {
        try {
            const response = await $.get({url: "api.php?get=currentstate"});

            if(!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
                return alert("E053. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");

            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

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
                if(upsMode_count < 5) {
                    await sleep(5000);
                } else {
                    $("#log p:last-child").html(`<b class="mr-1">✓</b> ${lang.system_test.performing_test} (${upsMode_count} / 5)`);
                    testUpsMode_finish();
                    return;
                }
            } else if(outputIsActive != undefined) {
                $("#testUpsMode .notif").removeClass("loading error success").addClass("error");
                $("#log p:last-child").html(`<b class="mr-1">✗</b> ${lang.system_test.performing_test} (${upsMode_count} / 5)`);
                scrollToBottom();
                return;
            }
        } catch (error) {
            alert("E052. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}





async function testUpsMode_finish() {
    while (true) {
        try {
            // Check Input Voltage
            const response = await $.get({url: "api.php?get=currentstate"});

            if(!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1"))
                return alert("E056. Please refresh the page! (Bad response from local currentstate table)");
            
            if(!response.hasOwnProperty("logtime") || !moment(response["logtime"]).isAfter(moment(moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss")))) return alert("Error! Connection to inverter has been lost. Please refresh the page!");

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
                return;
            } else if(inputIsActive != undefined) {
                // Retry
                $("#testUpsMode span span").html(lang.system_test.turn_input_on);
                await sleep(5000);
            }
        } catch (error) {
            alert("E055. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
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
