// PHP-injected constants (from system_test.php footer block):
//   batteryType  — "lifepo" | "carbon" | "other" | ""
//   noBattery    — boolean
//   backupMode   — boolean
//   boxType      — "emx" | "livex"

var hasExtSol = false,
    hasMeter1 = false,
    hasMeter2 = false,
    hasMeter3 = false,
    hasMeter4 = false;

var skipEnergyMeterTest = false;

var batteryCharging_count          = 0;
var batteryCharging_alreadyCharged = false;
var batteryMinLevel                = 20;
var batteryMaxLevel                = boxType == "livex" ? 95 : 90;
var batteryMinVoltage              = 51;
var batteryMaxVoltage              = 53;
var batteryWaitCounter             = 0;

var upsMode_count = 0;

function isLiFePO () { return batteryType == "lifepo"; }











// MARK: UI Helpers



function setTestIcon(rowId, state) {
    const icons = {
        pending: '<i class="bi bi-circle text-secondary opacity-50"></i>',
        running: '<div class="spinner-border text-dark"></div>',
        passed:  '<i class="bi bi-check-circle-fill text-success"></i>',
        failed:  '<i class="bi bi-x-circle-fill text-danger"></i>',
        skipped: '<i class="bi bi-dash-circle text-secondary"></i>',
    };
    $(`#${rowId}Icon`).html(icons[state] ?? icons.pending);
}

function setTestStatus(rowId, message) {
    $(`#${rowId}Status`).removeClass("opacity-50").text(message);
    console.log(rowId, message);
}



function showUserAction(rowId, message, type = "danger") {
    $(`#${rowId}ActionMessage`).text(message);
    $(`#${rowId}Action`).removeClass("alert-danger alert-success alert-warning").addClass(`alert-${type}`).removeClass("d-none");
}

function hideUserAction(rowId) {
    $(`#${rowId}Action`).addClass("d-none");
}





// MARK: DynamicTariff Management



async function setDynamicTariffMode(targetMode) {
    while (true) {
        try {
            const setResponse = await $.get({ url: `api.php?set=command&type=11&entity=11&text1=0 DynamicTariff&text2=${targetMode}` });
            if (setResponse != "1") { await _alert("Error setting DynamicTariff mode. Please refresh the page!"); return; }

            await sleep(2000);

            const reloadResponse = await $.get({ url: "api.php?set=command&type=12&entity=0&text2=1" });
            if (reloadResponse != "1") { await _alert("Error reloading settings. Please refresh the page!"); return; }

            const startTime = Date.now();
            while (true) {
                await sleep(5000);
                const settings = await $.get({ url: "api.php?get=settings" });
                if (settings?.["DynamicTariff"]?.["0"]?.["mode"] == targetMode) return;
                if (Date.now() - startTime >= 60000) break;
            }
        } catch (error) {
            await _alert("Error while setting DynamicTariff mode. Please refresh the page!");
            return;
        }
    }
}



async function disableDynamicTariffForBatteryTest(onStatus) {
    try {
        const settings = await $.get({ url: "api.php?get=settings" });
        const currentMode = settings?.["DynamicTariff"]?.["0"]?.["mode"];
        if (!currentMode) return;
        if (currentMode != "0") {
            sessionStorage.setItem("dynamicTariffOriginalMode", currentMode);
            if (onStatus) onStatus(t("st_bc_disabling_tariff"));
            await setDynamicTariffMode("0");
        }
    } catch (error) {
        await _alert("Error checking DynamicTariff status. Please refresh the page!");
    }
}



async function restoreDynamicTariffAfterBatteryTest(onStatus) {
    try {
        const originalMode = sessionStorage.getItem("dynamicTariffOriginalMode");
        if (originalMode !== null) {
            if (onStatus) onStatus(t("st_bc_restoring_tariff"));
            await setDynamicTariffMode(originalMode);
            sessionStorage.removeItem("dynamicTariffOriginalMode");
        }
    } catch (error) {
        console.log("Warning: Could not restore DynamicTariff mode:", error);
    }
}





// MARK: MinSoC Management



async function setMinSoC(targetValue) {
    while (true) {
        try {
            const setResponse = await $.get({ url: `api.php?set=command&type=11&entity=21&text1=0 BatteryMinSoC&text2=${targetValue}` });
            if (setResponse != "1") { await _alert("Error setting BatteryMinSoC. Please refresh the page!"); return; }

            await sleep(2000);

            const reloadResponse = await $.get({ url: "api.php?set=command&type=12&entity=0&text2=1" });
            if (reloadResponse != "1") { await _alert("Error reloading settings. Please refresh the page!"); return; }

            const startTime = Date.now();
            while (true) {
                await sleep(5000);
                const settings = await $.get({ url: "api.php?get=settings" });
                if (settings?.["BatteryMinSoC"]?.["0"]?.["v1"] == targetValue) return;
                if (Date.now() - startTime >= 60000) break;
            }
        } catch (error) {
            await _alert("Error while setting BatteryMinSoC. Please refresh the page!");
            return;
        }
    }
}



async function reduceMinSoCForBatteryTest(onStatus) {
    try {
        const settings = await $.get({ url: "api.php?get=settings" });
        const currentMinSoC = parseInt(settings?.["BatteryMinSoC"]?.["0"]?.["v1"]);
        if (isNaN(currentMinSoC)) return;
        if (currentMinSoC > batteryMaxLevel) {
            sessionStorage.setItem("batteryMinSoCOriginal", currentMinSoC);
            if (onStatus) onStatus(t("st_bc_adjusting_soc"));
            await setMinSoC(batteryMaxLevel);
        }
    } catch (error) {
        await _alert("Error checking BatteryMinSoC status. Please refresh the page!");
    }
}



async function restoreMinSoCAfterBatteryTest(onStatus) {
    try {
        const originalMinSoC = sessionStorage.getItem("batteryMinSoCOriginal");
        if (originalMinSoC !== null) {
            if (onStatus) onStatus(t("st_bc_restoring_soc"));
            await setMinSoC(parseInt(originalMinSoC));
            sessionStorage.removeItem("batteryMinSoCOriginal");
        }
    } catch (error) {
        console.log("Warning: Could not restore BatteryMinSoC:", error);
    }
}





// MARK: Finish Step



async function finishStep() {
    $("#btn_next").removeClass("d-none");
    $("#btn_next").attr("disabled", false);
}




















// MARK: Initialize



async function initialize() {

    // Load needed settings
    try {
        const settings = await $.get({ url: "api.php?get=settings" });
        hasExtSol = parseInt(settings?.["ModbusExtSolarDevice"]?.["0"]?.["mode"]) > 0;
        hasMeter1 = parseInt(settings?.["UserMeter"]?.["1"]?.["mode"]) > 0;
        hasMeter2 = parseInt(settings?.["UserMeter"]?.["2"]?.["mode"]) > 0;
        hasMeter3 = parseInt(settings?.["UserMeter"]?.["3"]?.["mode"]) > 0;
        hasMeter4 = parseInt(settings?.["UserMeter"]?.["4"]?.["mode"]) > 0;
    } catch (error) {
        return await _alert("E001. Please refresh the page! (Error while reading local settings table)");
    }

    // Load active warnings
    try {
        let warnings;
        const response = await $.get({ url: "api.php?get=warnings" });
        if (!response || !Array.isArray(response))
            return await _alert("E002. Please refresh the page! (Bad response from local warnings table)");
        warnings = response[0][1];
        const $warningBody = $("#warningMessage").empty();
        if (warnings.includes(16640) || warnings.includes(12544)) { // AC Input Loss
            $warningBody.append(`<p class="mb-2">${t("st_warning_16640")}</p>`);
        }
        if (warnings.includes(16642) || warnings.includes(12682)) { // AC Input Phase Dislocation
            $warningBody.append(`<p class="mb-2">${t("st_warning_16642")}</p>`);
        }
        if (warnings.includes(12553)) { // N-PE Check Fault
            $warningBody.append(`<p class="mb-2">${t("st_warning_12553")}</p>`)
        }
        if ($warningBody.children().length > 0) {
            $warningBody.children().last().removeClass("mb-2").addClass("mb-0");
            new bootstrap.Modal(document.getElementById("warningsModal")).show();
            return;
        }
    } catch (error) {
        return await _alert("E002. Please refresh the page! (Error while reading local warnings table)");
    }

    // Start E-Meter Test
    setTestIcon("testEnergyMeter", "running");
    setTestStatus("testEnergyMeter", t("st_em_checking"));
    testEnergyMeter();

}



// OnClick Reload Page
$("#btnWarningRetry").on("click", function() {
    const $btn = $(this);
    $btn.prop("disabled", true);
    let count = 0;
    const max = 15;
    $btn.text(`${count} / ${max}`);
    const interval = setInterval(() => {
        count++;
        $btn.text(`${count} / ${max}`);
        if (count >= max) {
            clearInterval(interval);
            location.reload();
        }
    }, 1000);
});




















// MARK: Test Energy Meter



async function testEnergyMeter() {
    
    await sleep(2500);

    try {

        const response = await $.get({ url: "api.php?get=currentstate" });
        if (!response || typeof response != "object") return await _alert("E004. Please refresh the page! (Bad response from local currentstate table)");
        if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"])) return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

        var currentErrorId = "";
        if (!response.hasOwnProperty("2913")) {
            currentErrorId = "1";
        } else {
            if (             !response["2913"].hasOwnProperty(  "0")) currentErrorId =   "1";
            if (hasExtSol && !response["2913"].hasOwnProperty(  "3")) currentErrorId =   "2";
            if (hasMeter1 && !response["2913"].hasOwnProperty("101")) currentErrorId = "101";
            if (hasMeter2 && !response["2913"].hasOwnProperty("102")) currentErrorId = "102";
            if (hasMeter3 && !response["2913"].hasOwnProperty("103")) currentErrorId = "103";
            if (hasMeter4 && !response["2913"].hasOwnProperty("104")) currentErrorId = "104";
        }

        if (!currentErrorId) {
            setTestIcon("testEnergyMeter", "passed");
            setTestStatus("testEnergyMeter", t("st_passed"));
            await sleep(2500);
            testBatteryCharging();
        } else {
            setTestIcon("testEnergyMeter", "failed");
            setTestStatus("testEnergyMeter", t("st_em_failed", { id: currentErrorId }));
            if (skipEnergyMeterTest) {
                const skip = await _confirm(t("st_em_skip_confirm"));
                if (skip) {
                    setTestIcon("testEnergyMeter", "skipped");
                    setTestStatus("testEnergyMeter", t("st_skipped"));
                    await sleep(2500);
                    testBatteryCharging();
                } else {
                    skipEnergyMeterTest = false;
                    await sleep(5000);
                    setTestIcon("testEnergyMeter", "running");
                    setTestStatus("testEnergyMeter", t("st_retrying"));
                    testEnergyMeter();
                }
            } else {
                await sleep(5000);
                setTestIcon("testEnergyMeter", "running");
                setTestStatus("testEnergyMeter", t("st_retrying"));
                testEnergyMeter();
            }
        }

    } catch (error) {
        await _alert("E003. Please refresh the page! (Error while reading local currentstate table)");
    }

}




















// MARK: Test Battery Charging



async function testBatteryCharging() {

    if (noBattery) return finishStep();

    setTestIcon("testBatteryCharging", "running");
    setTestStatus("testBatteryCharging", t("st_bc_checking"));

    const onStatus = (msg) => setTestStatus("testBatteryCharging", msg);
    await disableDynamicTariffForBatteryTest(onStatus);
    await reduceMinSoCForBatteryTest(onStatus);

    try {

        const response = await $.get({ url: "api.php?get=currentstate" });

        if (!response || typeof response != "object")
            return await _alert("E006. Please refresh the page! (Bad response from local currentstate table)");
        if (!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1"))
            return await _alert("E007. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
        if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
            return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

        const batteryLevel   = parseInt(response["1074"]["1"]);
        const batteryVoltage = parseInt(response["1042"]["1"]) / 100;

        if (isLiFePO()) {
            if (!batteryCharging_alreadyCharged && batteryLevel < batteryMinLevel) {
                setTestStatus("testBatteryCharging", t("st_bc_level_low", { level: batteryLevel, target: batteryMinLevel }));
                batteryCharging_count = 0;
                batteryWaitCounter = 10;
                testBatteryCharging_waitUntilCharged();
            } else if (!batteryCharging_alreadyCharged && batteryLevel > batteryMaxLevel) {
                setTestStatus("testBatteryCharging", t("st_bc_level_high", { level: batteryLevel, target: batteryMaxLevel }));
                batteryCharging_count = 0;
                batteryWaitCounter = 10;
                testBatteryCharging_waitUntilDischarged();
            } else {
                setTestStatus("testBatteryCharging", t("st_bc_level_ok", { level: batteryLevel }));
                batteryCharging_count = 0;
                testBatteryCharging_doTest();
            }
        } else {
            if (!batteryCharging_alreadyCharged && batteryVoltage < batteryMinVoltage) {
                setTestStatus("testBatteryCharging", t("st_bc_voltage_low", { voltage: batteryVoltage, target: batteryMinVoltage }));
                batteryCharging_count = 0;
                batteryWaitCounter = 10;
                testBatteryCharging_waitUntilCharged();
            } else if (!batteryCharging_alreadyCharged && batteryVoltage > batteryMaxVoltage) {
                setTestStatus("testBatteryCharging", t("st_bc_voltage_high", { voltage: batteryVoltage, target: batteryMaxVoltage }));
                batteryCharging_count = 0;
                batteryWaitCounter = 10;
                testBatteryCharging_waitUntilDischarged();
            } else {
                setTestStatus("testBatteryCharging", t("st_bc_voltage_ok", { voltage: batteryVoltage }));
                batteryCharging_count = 0;
                testBatteryCharging_doTest();
            }
        }

    } catch (error) {
        await _alert("E005. Please refresh the page! (Error while reading local currentstate table)");
    }

}



async function testBatteryCharging_waitUntilCharged() {

    try {
        while (true) {
            const cmdResponse = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1" });
            if (cmdResponse != "1") return await _alert("E009. Please refresh the page! (Bad response while writing command to local database)");
            await sleep(20000);
            const checkResponse = await $.get({ url: "api.php?get=currentstate" });
            if (checkResponse?.["2465"]?.["3"] == 11) break;
        }
    } catch (error) {
        return await _alert("E008. Please refresh the page! (Error while writing command to local database)");
    }

    while (true) {
        try {
            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object") return await _alert("E017. Please refresh the page! (Bad response from local currentstate table)");
            if (!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return await _alert("E018. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
            if (!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return await _alert("E019. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
            if (!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return await _alert("E02A. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
            if (!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("3")) return await _alert("E020. Please refresh the page! (Missing value 2465,3 from local currentstate table)");
            if (response["2465"]["3"] != 11) return await _alert("E021. Please refresh the page! (BatteryChargingAC could not be set to forced-on)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"])) return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            const power = parseInt(response["1121"]["1"]);

            if (isLiFePO()) {
                const level = parseInt(response["1074"]["1"]);
                setTestStatus("testBatteryCharging", t("st_bc_charging_level", { target: batteryMinLevel, level, power }));
                if (batteryWaitCounter < 1 && level >= batteryMinLevel) {
                    batteryCharging_alreadyCharged = true;
                    testBatteryCharging();
                    return;
                }
            } else {
                const voltage = parseInt(response["1042"]["1"]) / 100;
                setTestStatus("testBatteryCharging", t("st_bc_charging_voltage", { target: batteryMinVoltage, voltage, power }));
                if (batteryWaitCounter < 1 && voltage >= batteryMinVoltage) {
                    batteryCharging_alreadyCharged = true;
                    testBatteryCharging();
                    return;
                }
            }
            batteryWaitCounter -= 1;
            await sleep(5000);
        } catch (error) {
            await _alert("E016. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }

}



async function testBatteryCharging_waitUntilDischarged() {

    try {
        while (true) {
            const cmdResponse1 = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=1" });
            if (cmdResponse1 != "1") return await _alert("E011. Please refresh the page! (Bad response while writing command to local database)");
            const cmdResponse2 = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0" });
            if (cmdResponse2 != "1") return await _alert("E013. Please refresh the page! (Bad response while writing command to local database)");
            await sleep(20000);
            const checkResponse = await $.get({ url: "api.php?get=currentstate" });
            if (checkResponse?.["2465"]?.["5"] == 11 && checkResponse?.["2465"]?.["3"] == 10) break;
        }
    } catch (error) {
        return await _alert("E010. Please refresh the page! (Error while writing command to local database)");
    }

    while (true) {
        try {
            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object") return await _alert("E023. Please refresh the page! (Bad response from local currentstate table)");
            if (!response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1")) return await _alert("E024. Please refresh the page! (Missing value 1121,1 from local currentstate table)");
            if (!response.hasOwnProperty("1074") || !response["1074"].hasOwnProperty("1")) return await _alert("E025. Please refresh the page! (Missing value 1074,1 from local currentstate table)");
            if (!response.hasOwnProperty("1042") || !response["1042"].hasOwnProperty("1")) return await _alert("E026. Please refresh the page! (Missing value 1042,1 from local currentstate table)");
            if (!response.hasOwnProperty("2465") || !response["2465"].hasOwnProperty("5")) return await _alert("E026b. Please refresh the page! (Missing value 2465,5 from local currentstate table)");
            if (!response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0")) return await _alert("E027. Please refresh the page! (Missing value 1634,0 from local currentstate table)");
            if (response["2465"]["5"] != 11) return await _alert("E028. Please refresh the page! (BatteryDischargingAC could not be set to forced-on)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"])) return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            const solarPower = parseInt(response["1634"]["0"]);
            if (solarPower > 100) showUserAction("testBatteryCharging", t("st_bc_solar_off"));
            else hideUserAction("testBatteryCharging");

            const power = parseInt(response["1121"]["1"]);

            if (isLiFePO()) {
                const level = parseInt(response["1074"]["1"]);
                setTestStatus("testBatteryCharging", t("st_bc_discharging_level", { target: batteryMaxLevel, level, power }));
                if (batteryWaitCounter < 1 && level <= batteryMaxLevel) {
                    hideUserAction("testBatteryCharging");
                    testBatteryCharging();
                    return;
                }
            } else {
                const voltage = parseInt(response["1042"]["1"]) / 100;
                setTestStatus("testBatteryCharging", t("st_bc_discharging_voltage", { target: batteryMaxVoltage, voltage, power }));
                if (batteryWaitCounter < 1 && voltage <= batteryMaxVoltage) {
                    hideUserAction("testBatteryCharging");
                    testBatteryCharging();
                    return;
                }
            }
            batteryWaitCounter -= 1;
            await sleep(5000);
        } catch (error) {
            await _alert("E022. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }

}



async function testBatteryCharging_doTest() {

    // Phase 1: Enable AC charging command
    try {
        while (true) {
            const cmdResponse = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=1" });
            if (cmdResponse != "1") return await _alert("E015. Please refresh the page! (Bad response while writing command to local database)");
            await sleep(20000);
            const checkResponse = await $.get({ url: "api.php?get=currentstate" });
            if (checkResponse?.["2465"]?.["3"] == 11) break;
        }
    } catch (error) {
        return await _alert("E014. Please refresh the page! (Error while writing command to local database)");
    }

    setTestStatus("testBatteryCharging", t("st_bc_ac_enabled"));

    // Phase 2: Test charging power (5 consecutive readings > 100W)
    while (true) {
        try {
            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object" || !response.hasOwnProperty("1121") || !response["1121"].hasOwnProperty("1"))
                return await _alert("E033. Please refresh the page! (Bad response or missing value 1121,1 from local currentstate table)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
                return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            const batteryPower = parseInt(response["1121"]["1"]);
            batteryCharging_count += 1;
            setTestStatus("testBatteryCharging", t("st_bc_testing", { count: batteryCharging_count, power: batteryPower }));

            if (batteryPower > 100) {
                if (batteryCharging_count < 5) {
                    await sleep(5000);
                } else {
                    break;
                }
            } else {
                setTestIcon("testBatteryCharging", "failed");
                setTestStatus("testBatteryCharging", t("st_bc_too_low", { power: batteryPower }));
                await sleep(5000);
                batteryCharging_count = 0;
                testBatteryCharging();
                return;
            }
        } catch (error) {
            await _alert("E032. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }

    setTestStatus("testBatteryCharging", t("st_bc_resetting"));

    // Phase 3: Reset commands
    try {
        while (true) {
            const cmdResponse1 = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0" });
            if (cmdResponse1 != "1") return await _alert("E035. Please refresh the page! (Bad response while writing command to local database)");
            const cmdResponse2 = await $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0" });
            if (cmdResponse2 != "1") return await _alert("E037. Please refresh the page! (Bad response while writing command to local database)");
            await sleep(20000);
            const checkResponse = await $.get({ url: "api.php?get=currentstate" });
            if (checkResponse?.["2465"]?.["3"] == 10 && checkResponse?.["2465"]?.["5"] == 10) break;
        }
    } catch (error) {
        return await _alert("E034. Please refresh the page! (Error while writing command to local database)");
    }

    // Phase 4: Fire-and-forget final commands + cleanup
    try {
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=2" });
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=2&text2=2" });
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=2" });
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=4&text2=2" });
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=2" });

        const onStatus = (msg) => setTestStatus("testBatteryCharging", msg);
        await restoreDynamicTariffAfterBatteryTest(onStatus);
        await restoreMinSoCAfterBatteryTest(onStatus);

        setTestIcon("testBatteryCharging", "passed");
        setTestStatus("testBatteryCharging", t("st_passed"));
        await sleep(2500);
        testUpsMode();
    } catch (error) {
        await _alert("E042. Please refresh the page! (Error while writing command to local database)");
    }

}




















// MARK: Test UPS Mode



async function testUpsMode() {

    if (backupMode) return finishStep();

    setTestIcon("testUpsMode", "running");
    setTestStatus("testUpsMode", t("st_ups_checking"));

    try {

        const response = await $.get({ url: "api.php?get=currentstate" });

        if (!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
            return await _alert("E047. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");
        if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
            return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

        const voltage1 = response["1297"]?.["1"];
        const voltage2 = response["1298"]?.["1"];
        const voltage3 = response["1299"]?.["1"];

        let outputIsActive;
        if (voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
            outputIsActive = (voltage1 > 10000);
        else if (voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
            outputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
        else
            return await _alert("E048. Please refresh the page! (Some of the ups output voltage values are missing from currentstate table)");

        if (outputIsActive) {
            setTestStatus("testUpsMode", t("st_ups_output_active"));
            showUserAction("testUpsMode", t("st_ups_input_off"));
            await sleep(5000);
            testUpsMode_waitingForInput();
        } else {
            setTestStatus("testUpsMode", t("st_ups_output_inactive"));
            showUserAction("testUpsMode", t("st_ups_enable_output"));
            await sleep(5000);
            hideUserAction("testUpsMode");
            testUpsMode();
        }

    } catch (error) {
        await _alert("E046. Please refresh the page! (Error while reading local currentstate table)");
    }

}



async function testUpsMode_waitingForInput() {
    while (true) {
        try {

            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1") || !response.hasOwnProperty("1634") || !response["1634"].hasOwnProperty("0"))
                return await _alert("E050. Please refresh the page! (Bad response or missing value 273,1 from local currentstate table)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
                return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            const voltage1  = response["273"]?.["1"];
            const voltage2  = response["274"]?.["1"];
            const voltage3  = response["275"]?.["1"];
            const solPower  = response["1634"]["0"];

            let inputIsActive;
            if (voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                inputIsActive = (voltage1 > 10000);
            else if (voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                inputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else
                return await _alert("E051. Please refresh the page! (Some of the ups input voltage values are missing from currentstate table)");

            const solarIsActive = (solPower > 1);

            if (inputIsActive == false && solarIsActive == false) {
                hideUserAction("testUpsMode");
                setTestStatus("testUpsMode", t("st_ups_grid_off"));
                await sleep(5000);
                testUpsMode_test();
                return;
            }
            await sleep(5000);

        } catch (error) {
            await _alert("E049. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}



async function testUpsMode_test() {
    while (true) {
        try {

            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object" || !response.hasOwnProperty("1297") || !response["1297"].hasOwnProperty("1"))
                return await _alert("E053. Please refresh the page! (Bad response or missing value 1297,1 from local currentstate table)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
                return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            upsMode_count += 1;
            setTestStatus("testUpsMode", t("st_ups_testing", { count: upsMode_count }));

            const voltage1 = response["1297"]?.["1"];
            const voltage2 = response["1298"]?.["1"];
            const voltage3 = response["1299"]?.["1"];

            let outputIsActive;
            if (voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                outputIsActive = (voltage1 > 10000);
            else if (voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                outputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else
                return await _alert("E054. Please refresh the page! (Some of the ups output voltage values are missing from currentstate table)");

            if (outputIsActive) {
                if (upsMode_count < 5) {
                    await sleep(5000);
                } else {
                    setTestStatus("testUpsMode", t("st_ups_ok"));
                    showUserAction("testUpsMode", t("st_ups_input_on"), "success");
                    testUpsMode_finish();
                    return;
                }
            } else {
                setTestIcon("testUpsMode", "failed");
                setTestStatus("testUpsMode", t("st_ups_failed", { count: upsMode_count }));
                return;
            }

        } catch (error) {
            await _alert("E052. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}



async function testUpsMode_finish() {
    while (true) {
        try {

            const response = await $.get({ url: "api.php?get=currentstate" });

            if (!response || typeof response != "object" || !response.hasOwnProperty("273") || !response["273"].hasOwnProperty("1"))
                return await _alert("E056. Please refresh the page! (Bad response from local currentstate table)");
            if (!response.hasOwnProperty("logtime") || !isLogtimeRecent(response["logtime"]))
                return await _alert("Error! Connection to inverter has been lost. Please refresh the page!");

            const voltage1 = response["273"]?.["1"];
            const voltage2 = response["274"]?.["1"];
            const voltage3 = response["275"]?.["1"];

            let inputIsActive;
            if (voltage1 != undefined && voltage2 == undefined && voltage3 == undefined)
                inputIsActive = (voltage1 > 10000);
            else if (voltage1 != undefined && voltage2 != undefined && voltage3 != undefined)
                inputIsActive = (voltage1 > 10000 && voltage2 > 10000 && voltage3 > 10000);
            else
                return await _alert("E057. Please refresh the page! (Some of the ups input voltages are missing from currentstate table)");

            if (inputIsActive) {
                hideUserAction("testUpsMode");
                setTestIcon("testUpsMode", "passed");
                setTestStatus("testUpsMode", t("st_passed"));
                finishStep();
                return;
            }
            await sleep(5000);

        } catch (error) {
            await _alert("E055. Please refresh the page! (Error while reading local currentstate table)");
            return;
        }
    }
}




















// MARK: Page Load



initialize();



$("#btn_next").on("click", () => { window.location.href = "accept_terms.php"; });
