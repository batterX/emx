$progress.trigger("step", 4);





step1();





var objGridStandards = {
    "0": "Unknown",
    "1": "VDE0126",
    "2": "VDE4105",
    "3": "TOR",
    "4": "EN50438",
    "5": "EN50549",
    "6": "Sweden",
    "7": "Belgium",
    "8": "Czech",
    "9": "Estonia"
}

var inverterSerialNumber = "";
var inverterModel = "";
var inverterFirmware = "";
var bmsFirmware = "";
var gridStandard = "";
var isVde4105 = "";
var isVde0126 = "";
var isTor     = "";
var isEstonia = "";
var isGridLoss = true;

var armUpdateNeeded = false;
var dspUpdateNeeded = false;
var bmsUpdateNeeded = false;
var estimatedUpdateDuration = 0;
var batterySoC = 0;





// Get CurrentState (Verify if inverter is working)

var previousLogtime = null;

function step1() {

    $.get({
        url: "api.php?get=currentstate",
        error: () => { setTimeout(step1, 5000); },
        success: (json) => {
            console.log(json);
            if(!json || typeof json != "object" || !json.hasOwnProperty("logtime")) {
                setTimeout(step1, 5000);
                return;
            }
            var curtime   = moment.unix(getServerTime()).utc().subtract(1, "minute").format("YYYY-MM-DD HH:mm:ss");
            var isWorking = moment(json["logtime"]).isAfter(moment(curtime));
            if(!isWorking) {
                if(previousLogtime == null) previousLogtime = json["logtime"];
                else if(previousLogtime != json["logtime"]) alert("Error! PC or LiveX/EMX time/timezone not set correctly.");
                setTimeout(step1, 5000);
                return;
            }
            // Update Variables
            isGridLoss = false;
            if(json.hasOwnProperty("273") && json["273"].hasOwnProperty("1") && json["273"]["1"] < 18400) isGridLoss = true;
            if(json.hasOwnProperty("274") && json["274"].hasOwnProperty("1") && json["274"]["1"] < 18400) isGridLoss = true;
            if(json.hasOwnProperty("275") && json["275"].hasOwnProperty("1") && json["275"]["1"] < 18400) isGridLoss = true;
            // Get Battery SoC
            batterySoC = (json.hasOwnProperty("3122") && json["3122"].hasOwnProperty("1")) ? json["3122"]["1"] : 0;
            // Continue Next Step
            step2();
        }
    });

}





// Get Inverter Serial-Number

function step2() {

    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E001. Please refresh the page! (Error while reading settings table from local database)"); },
        success: (json) => {
            console.log(json);
            if(!json || typeof json != "object" || !json.hasOwnProperty("Inverter") || !json["Inverter"].hasOwnProperty("1") || !json["Inverter"].hasOwnProperty("2"))
                return alert("E002. Please refresh the page! (Missing or malformed data in local settings table)");
            // Get Needed Parameters
            inverterSerialNumber = json["Inverter"]["2"]["s1"];
            inverterModel = json["Inverter"]["1"]["s1"];
            if(json["Inverter"].hasOwnProperty("3")) {
                inverterFirmware = json["Inverter"]["3"]["s1"];
            }
            if(json["Inverter"].hasOwnProperty("1103")) {
                bmsFirmware = json["Inverter"]["1103"]["s1"];
            }
            // Get Inverter Model
            $(".serialnumber b").html(inverterSerialNumber);
            if(inverterModel == "10001") {
                $("#inverterDetected h1 .model").html("h5");
                $("#inverterDetected img").attr("src", "img/device_batterx_h5.png");
            } else if(inverterModel == "10002") {
                $("#inverterDetected h1 .model").html("h10");
                $("#inverterDetected img").attr("src", "img/device_batterx_h10.png");
            } else if(inverterModel >= "11000") {
                $("#inverterDetected h1 .model").html("i-Series");
                $("#inverterDetected img").attr("src", "img/device_batterx_i.png");
            } else {
                $("#inverterDetected h1 .model").html("");
                $("#inverterDetected img").attr("src", "");
            }
            // Continue Next Step
            step3(json);
        }
    });

}





// Check if Inverter registered in Cloud & Show Working Status

function step3(json) {

    var serial_number = json["Inverter"]["2"]["s1"];

    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action: "verify_device",
            serialnumber: serial_number
        },
        error: () => { alert("E003. Please refresh the page! (Error while verifying device serialnumber in cloud)"); },
        success: (response) => {
            // Show Not Registered
            if(response != "1") {
                $(".notif").removeClass("loading error success").addClass("error");
                $(".message").html(lang.system_detect.inverter_not_registered + "<br>" + "(S/N: " + serial_number + ")").css("color", "red");
                return;
            }
            // Show Working
            $("#inverterUnknown").addClass("d-none");
            $("#inverterDetected").removeClass("d-none");
            // Check Battery Connection (i-Series only)
            if(inverterModel >= "11000" && batterySoC == 0) {
                // Check if user already confirmed no battery
                if(sessionStorage.getItem('noBatteryInstalled') === 'true') {
                    // Skip modal, user already confirmed
                    step4(json);
                    return;
                }
                $("#modalConfirmNoBattery").modal("show");
                return;
            }
            // Continue Next Step
            step4(json);
        }
    });

}





// Battery Connection Modal Buttons

$("#modalConfirmNoBattery .refresh").on("click", () => {
    const $btn = $("#modalConfirmNoBattery .refresh");
    $btn.prop("disabled", true);

    let countdown = 0;
    const maxCountdown = 15;

    $btn.text(`${countdown} / ${maxCountdown}`);

    const countdownInterval = setInterval(() => {
        countdown++;
        $btn.text(`${countdown} / ${maxCountdown}`);

        if(countdown >= maxCountdown) {
            clearInterval(countdownInterval);
            location.reload();
        }
    }, 1000);
});

$("#modalConfirmNoBattery .confirm").on("click", () => {
    // Store flag in sessionStorage to prevent modal from showing again
    sessionStorage.setItem('noBatteryInstalled', 'true');

    $("#modalConfirmNoBattery").modal("hide");
    // Get the json data from step2 to continue to step4
    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E001. Please refresh the page! (Error while reading settings table from local database)"); },
        success: (json) => {
            if(!json || typeof json != "object" || !json.hasOwnProperty("Inverter"))
                return alert("E002. Please refresh the page! (Missing or malformed data in local settings table)");
            step4(json);
        }
    });
});





// Update Grid Standard Card

function step4(json) {

    // Log Response
    console.log(json);

    // Check If MachineModel Exists
    if(!json["Inverter"].hasOwnProperty("201"))
        return alert("Please wait one minute, then refresh the page!");

    // Populate machineModelSelect with available values
    try {
        var availableGridStandards = json["Inverter"]["201"]["s2"];
        if(availableGridStandards != "") {
            var tempArr = JSON.parse(availableGridStandards);
            var options = "";
            tempArr.forEach(item => {
                if(objGridStandards.hasOwnProperty(item.toString()))
                    options += `<option value="${item}">${objGridStandards[item.toString()]}</option>`;
                else
                    options += `<option value="${item}">${item}</option>`
            });
            $("#machineModelSelect").html(options);
        }
    } catch(error) {
        console.log("There are no grid standards available for setting up!");
    }

    // Get Machine Model
    gridStandard = json["Inverter"]["201"]["s1"];
    isVde4105 = gridStandard == "2" ? "1" : "0";
    isVde0126 = gridStandard == "1" ? "1" : "0";
    isTor     = gridStandard == "3" ? "1" : "0";
    isEstonia = gridStandard == "9" ? "1" : "0";

    $("#germanyMachineModelSelect").val(gridStandard).trigger("change");
    $("#machineModelSelect").val(gridStandard).trigger("change");
    $("#modalConfirmDeviceStandardValue").text(objGridStandards[gridStandard]);

    // Germany (2=VDE4105 | 1=VDE0126)
    if(installationCountry == "de") {
        $(".standard").text("VDE4105");
        // Show Status
        if(isVde4105 != "1" && isVde0126 != "1") {
            $(".standard").css("color", "red");
            $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#machineModelBox").removeClass("d-none");
        } else {
            if(isVde4105 == "1") {
                $(".standard").css("color", "#28a745");
                $(".cert-status").removeClass("loading error success").addClass("success").css("display", "block");
            } else {
                $(".standard").css("color", "red");
                $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            }
            $(`#germanyMachineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#germanyMachineModelBox").removeClass("d-none");
        }
    }
    // Austria (3=TOR)
    else if(installationCountry == "at") {
        $(".standard").text("TOR");
        // Show Status
        if(isTor != "1") {
            $(".standard").css("color", "red");
            $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#machineModelBox").removeClass("d-none");
        } else {
            $(".standard").css("color", "#28a745");
            $(".cert-status").removeClass("loading error success").addClass("success").css("display", "block");
        }
    }
    // Other
    else {
        // Show Status
        $(".standard").css("color", "black").html(`${objGridStandards.hasOwnProperty(gridStandard) ? objGridStandards[gridStandard] : '-'}`);
        $(".cert-status").addClass("d-none");
        $("#machineModelSelect").removeClass("border-danger").addClass("border-secondary");
        $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
        $("#machineModelBtn").removeClass("btn-danger").addClass("btn-secondary");
        $("#machineModelBox").removeClass("d-none");
    }

    // Store Certificate Variable
    $.post({
        url: "cmd/session.php",
        data: {
            vde4105: isVde4105,
            tor:     isTor,
            estonia: isEstonia
        },
        error: () => { alert("E006. Please refresh the page! (Error while saving data to session)"); },
        success: (response) => {
            console.log(response);
            if(response === "1") {
                // Continue Next Step
                step5(json);
            }
            else alert("E007. Please refresh the page! (Bad response while saving data to session)");
        }
    });

}





// Update Firmware Version Card

function step5(json) {

    // i-Series
    if(inverterModel >= "11000") {
        // Extract current version parts (Inverter)
        const invParts = inverterFirmware.split('-');
        const firstPart = invParts[0].split('.');
        const secondPart = invParts[1].split('.');
        const currentArm = [firstPart[0].substring(1), secondPart[0].substring(1)]; // Remove 'V'
        const currentDsp = [firstPart[1], secondPart[1]];
        const newArm = [armLatestVersion[0], armLatestVersion[1]];
        const newDsp =  inverterModel >= "11020" ? [dspLgLatestVersion[0], dspLgLatestVersion[1]] : [dspSmLatestVersion[0], dspSmLatestVersion[1]]; // i30 ? dspLg : dspSm
        const durationArm = armEstimatedDuration;
        const durationDsp = inverterModel >= "11020" ? dspLgEstimatedDuration : dspSmEstimatedDuration;
        // Extract current version parts (BMS)
        const currentBms = bmsFirmware ? bmsFirmware.split(".") : [];
        const newBms = [bmsLatestVersion[0], bmsLatestVersion[1]];
        const durationBms = bmsEstimatedDuration;
        // Build new version using the other parts from current firmware
        const newVersionInv = `V${newArm[0]}.${newDsp[0]}.${firstPart[2]}.${firstPart[3]}-V${newArm[1]}.${newDsp[1]}.${secondPart[2]}.${secondPart[3]}`;
        const newVersionBms = `${newBms[0]}.${newBms[1]}`;
        // Compare versions
        const isArmUpToDate = currentArm[0] == newArm[0] && currentArm[1] == newArm[1];
        const isDspUpToDate = currentDsp[0] == newDsp[0] && currentDsp[1] == newDsp[1];
        const isBmsUpToDate = currentBms.length == 0 ? true : currentBms[0] == newBms[0] && currentBms[1] == newBms[1];
        // Store which updates are needed
        armUpdateNeeded = isArmUpToDate ? "" : `${newArm[0]}(${newArm[1]})`;
        dspUpdateNeeded = isDspUpToDate ? "" : `${newDsp[0]}(${newDsp[1]})`;
        bmsUpdateNeeded = isBmsUpToDate ? "" : `${newBms[0]}${newBms[1]}`;
        estimatedUpdateDuration = (isArmUpToDate ? 0 : durationArm) + (isDspUpToDate ? 0 : durationDsp) + (isBmsUpToDate ? 0 : durationBms);
        // Show Firmware Update Card
        if(currentBms.length == 0) {
            $("#installedVersion").html(`<small><b>INVERTER</b></small><br><b>${inverterFirmware}</b>`);
            $("#latestVersion").html(`<small><b>INVERTER</b></small><br><b>${newVersionInv}</b>`);
        } else {
            $("#installedVersion").html(`<small><b>INVERTER</b></small><br><b>${inverterFirmware}</b><br><small><b>BMS</b></small><br><b>${bmsFirmware}</b>`);
            $("#latestVersion").html(`<small><b>INVERTER</b></small><br><b>${newVersionInv}</b><br><small><b>BMS</b></small><br><b>${newVersionBms}</b>`);
        }
        $("#estimatedDuration").html(`${estimatedUpdateDuration} min`);
        // Show Grid Standard Card
        if(isArmUpToDate && isDspUpToDate && isBmsUpToDate) {
            // Show Firmware Update Success
            $("#firmwareUpdateSuccess").removeClass("d-none");
            // Disable Firmware Update Button
            $("#firmwareUpdateStart").attr("disabled", true);
            // Show Grid Standard Card
            $("#machineModelContainer").removeClass("d-none");
            // Allow Continue Button
            $("#btn_next").attr("disabled", false);
        } else {
            // Show Firmware Update Card
            $("#firmwareUpdateContainer").removeClass("d-none");
        }
    }
    // h-Series
    else {
        // Disable Firmware Update Button
        $("#firmwareUpdateStart").attr("disabled", true);
        // Show Grid Standard Card
        $("#machineModelContainer").removeClass("d-none");
        // Allow Continue Button
        $("#btn_next").attr("disabled", false);
    }

}





// MachineModel Select

$("#germanyMachineModelSelect").on("input change", function() {
    if($(this).val() == gridStandard) //if($(this).val() == gridStandard || isGridLoss) NEW
        $("#germanyMachineModelBtn").prop("disabled", true);
    else
        $("#germanyMachineModelBtn").prop("disabled", false);
});

$("#machineModelSelect").on("input change", function() {
    if($(this).val() == gridStandard) //if($(this).val() == gridStandard || isGridLoss) NEW
        $("#machineModelBtn").prop("disabled", true);
    else
        $("#machineModelBtn").prop("disabled", false);
});





// Button MachineModel onClick

$("#germanyMachineModelBtn").on("click", () => {
    $("#machineModelSelect").val($("#germanyMachineModelSelect").val());
    $("#machineModelBtn").trigger("click");
});

$("#machineModelBtn").on("click", () => {
    // Switch to Selected MachineModel
    $.get({
        url: "api.php?set=command&type=24064&entity=201&text2=" + $("#machineModelSelect").val(),
        error: () => { alert("E008. Please refresh the page! (Error while writing command to local database)"); },
        success: () => {
            $("#germanyMachineModelBox").hide();
            $("#machineModelBox").hide();
            $("#btn_next").attr("disabled", true);
            $(".cert-loading").css("display", "block");
            checkParameters();
        }
    });
});

var deviceDatetime = "";
function checkParameters() {
    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E009. Please refresh the page! (Error while reading local settings table)"); },
        success: (response) => {
            console.log(response);
            if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
                return alert("E010. Please refresh the page! (Missing or malformed data in local settings table)");
            response = response["Inverter"];
            if(deviceDatetime == "") { deviceDatetime = response["10"]["s1"]; setTimeout(checkParameters, 5000); return; }
            if(response["10"]["s1"] == deviceDatetime) { setTimeout(checkParameters, 5000); return; }
            location.reload();
        }
    });
}





// Button Next On-Click

$("#btn_next").on("click", () => {
        
    // Show Confirmation Modal IF Germany Without VDE4105
    if(installationCountry == "de" && isVde4105 != "1") {
        $("#modalConfirmDeviceStandard").modal("show");
        $("#modalConfirmDeviceStandardBtn").unbind().on("click", () => {
            setTimeout(() => { window.location.href = "system_setup.php"; }, 1000);
            $("#modalConfirmDeviceStandard").modal("hide");
        });
    }
    // Else Continue To Next Page
    else {
        setTimeout(() => { window.location.href = "system_setup.php"; }, 1000);
    }

});










// Firmware Update

// Prevent page leave during firmware update
function preventPageLeave(event) {
    event.preventDefault();
    event.returnValue = ''; // Required for Chrome
}

// Helper function for async delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for battery voltage after program restart
async function waitForBatteryVoltage() {
    // Wait 10 seconds just to have some delay
    await sleep(10000);

    const maxWaitTime = 600000; // 10 minutes
    const startTime = Date.now();

    while(Date.now() - startTime < maxWaitTime) {
        try {
            const response = await $.get({
                url: "api.php?get=currentstate"
            });

            // If logtime changed, program has restarted and is running
            var batteryVoltage = (response.hasOwnProperty("3090") && response["3090"].hasOwnProperty("1")) ? response["3090"]["1"] : 0;
            if(batteryVoltage > 100) {
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

// Wait for program to restart after firmware update
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

// Verify firmware version in settings table
async function verifyFirmwareUpdate(expectedVersion, firmwareType) {
    const maxWaitTime = (firmwareType == "bms" ? 7 : 2) * 60000; // 2 minutes for ARM/DSP, 7 minutes for BMS
    const startTime = Date.now();

    while(Date.now() - startTime < maxWaitTime) {
        try {
            const response = await $.get({
                url: "api.php?get=settings"
            });
            if(firmwareType == "arm" || firmwareType == "dsp") {
                if(response && response["Inverter"] && response["Inverter"]["3"] && response["Inverter"]["3"]["s1"]) {
                    const currentFirmware = response["Inverter"]["3"]["s1"];
                    const invParts = currentFirmware.split('-');
                    const firstPart = invParts[0].split('.');
                    const secondPart = invParts[1].split('.');
                    if(firmwareType === "arm") {
                        const currentArm = [firstPart[0].substring(1), secondPart[0].substring(1)];
                        const currentArmVersion = `${currentArm[0]}(${currentArm[1]})`;
                        if(currentArmVersion === expectedVersion) {
                            return true;
                        }
                    } else if(firmwareType === "dsp") {
                        const currentDsp = [firstPart[1], secondPart[1]];
                        const currentDspVersion = `${currentDsp[0]}(${currentDsp[1]})`;
                        if(currentDspVersion === expectedVersion) {
                            return true;
                        }
                    }
                }
            } else if(firmwareType == "bms") {
                if(response && response["Inverter"] && response["Inverter"]["1103"] && response["Inverter"]["1103"]["s1"]) {
                    const currentFirmware = response["Inverter"]["1103"]["s1"];
                    const bmsParts = currentFirmware.split(".");
                    const currentBmsVersion = `${bmsParts[0]}${bmsParts[1]}`;
                    if(currentBmsVersion == expectedVersion) {
                        return true;
                    }
                }
            }
            await sleep(5000); // Wait 5 seconds before checking again
        } catch (error) {
            console.log("Error checking firmware version:", error);
            await sleep(5000);
        }
    }

    return false; // Timeout reached
}

// Wait for firmware update to complete by monitoring status
async function waitForFirmwareUpdateComplete() {
    const maxWaitTime = 900000; // 10 minutes
    const startTime = Date.now();
    let consecutiveCompleteCount = 0; // Count consecutive state=0 or "{}"
    const requiredConsecutiveCount = 5; // Need 5 consecutive (25 seconds)

    while(Date.now() - startTime < maxWaitTime) {
        try {
            const statusResponse = await $.post({
                url: "cmd/fwupdate.php",
                data: { action: "status" }
            });

            console.log("FWUpdate status:", statusResponse);

            // Check if file is gone (device restarted, RAM cleared)
            if(statusResponse === "{}") {
                consecutiveCompleteCount++;
                console.log(`File gone (RAM cleared), count: ${consecutiveCompleteCount}/${requiredConsecutiveCount}`);

                if(consecutiveCompleteCount >= requiredConsecutiveCount) {
                    return { success: true, message: "Update completed (device restarted, file cleared)" };
                }
            }
            // Parse JSON response
            else if(statusResponse && statusResponse !== "") {
                const status = JSON.parse(statusResponse);

                // state: 0=UpdateCompleteSuccess, 1=UpdateInProgress, 2=Error
                if(status.state === 0) {
                    consecutiveCompleteCount++;
                    console.log(`Update complete state detected, count: ${consecutiveCompleteCount}/${requiredConsecutiveCount}`);

                    if(consecutiveCompleteCount >= requiredConsecutiveCount) {
                        return { success: true, message: status.message };
                    }
                } else if(status.state === 2) {
                    // Error state - return immediately
                    return { success: false, message: status.message };
                } else {
                    // state === 1 (in progress), reset counter
                    consecutiveCompleteCount = 0;
                }
            } else {
                // Empty response, reset counter
                consecutiveCompleteCount = 0;
            }

            await sleep(5000); // Wait 5 seconds before checking again
        } catch (error) {
            console.log("Error checking FWUpdate status:", error);
            consecutiveCompleteCount = 0; // Reset counter on error
            await sleep(5000);
        }
    }

    return { success: false, message: "Timeout: Update did not complete within 15 minutes" };
}

// Main firmware update orchestration
async function performFirmwareUpdates() {
    try {
        // ARM Update
        if(armUpdateNeeded && armUpdateNeeded !== "") {
            console.log("Starting ARM firmware update to version:", armUpdateNeeded);

            // Start ARM update
            const startResponse = await $.post({
                url: "cmd/fwupdate.php",
                data: {
                    action: "start",
                    type: "arm",
                    version: armUpdateNeeded
                }
            });

            if(startResponse !== "1") {
                throw new Error("Failed to start ARM firmware update");
            }

            console.log("ARM update started, waiting for completion...");

            // Wait for update to complete (or device to restart and file to disappear)
            const updateResult = await waitForFirmwareUpdateComplete();
            console.log("ARM update process finished:", updateResult.message);

            console.log("Waiting for program restart...");

            // Wait for program to restart
            const restartSuccess = await waitForProgramRestart();

            if(!restartSuccess) {
                throw new Error("Program did not restart after ARM update");
            }

            console.log("Program restarted, verifying ARM firmware version...");

            // Verify ARM firmware was updated
            const verifySuccess = await verifyFirmwareUpdate(armUpdateNeeded, "arm");

            if(!verifySuccess) {
                throw new Error("ARM firmware verification failed");
            }

            console.log("ARM firmware update verified successfully");
        }

        // DSP Update
        if(dspUpdateNeeded && dspUpdateNeeded !== "") {
            console.log("Starting DSP firmware update to version:", dspUpdateNeeded);

            // Determine DSP type based on inverter model
            const dspType = inverterModel >= "11020" ? "dsp-lg" : "dsp-sm";

            // Start DSP update
            const startResponse = await $.post({
                url: "cmd/fwupdate.php",
                data: {
                    action: "start",
                    type: dspType,
                    version: dspUpdateNeeded
                }
            });

            if(startResponse !== "1") {
                throw new Error("Failed to start DSP firmware update");
            }

            console.log("DSP update started, waiting for completion...");

            // Wait for update to complete (or device to restart and file to disappear)
            const updateResult = await waitForFirmwareUpdateComplete();
            console.log("DSP update process finished:", updateResult.message);

            console.log("Waiting for program restart...");

            // Wait for program to restart
            const restartSuccess = await waitForProgramRestart();

            if(!restartSuccess) {
                throw new Error("Program did not restart after DSP update");
            }

            console.log("Program restarted, verifying DSP firmware version...");

            // Verify DSP firmware was updated
            const verifySuccess = await verifyFirmwareUpdate(dspUpdateNeeded, "dsp");

            if(!verifySuccess) {
                throw new Error("DSP firmware verification failed");
            }

            console.log("DSP firmware update verified successfully");
        }

        // BMS Update
        if(bmsUpdateNeeded && bmsUpdateNeeded !== "") {
            console.log("Starting BMS firmware update to version:", bmsUpdateNeeded);

            // Start BMS update
            const startResponse = await $.post({
                url: "cmd/fwupdate.php",
                data: {
                    action: "start",
                    type: "bms",
                    version: bmsUpdateNeeded
                }
            });

            if(startResponse !== "1") {
                throw new Error("Failed to start BMS firmware update");
            }

            console.log("BMS update started, waiting for completion...");

            // Wait for update to complete (or device to restart and file to disappear)
            const updateResult = await waitForFirmwareUpdateComplete();
            console.log("BMS update process finished:", updateResult.message);

            console.log("Waiting for program restart...");

            // Wait for program to restart
            const restartSuccess = await waitForProgramRestart();

            if(!restartSuccess) {
                throw new Error("Program did not restart after BMS update");
            }

            console.log("Program restarted, waiting for battery to reconnect...");

            // Wait for program to restart
            const reconnectSuccess = await waitForBatteryVoltage();

            if(!reconnectSuccess) {
                throw new Error("Battery did not reconnect after BMS update");
            }

            console.log("Battery reconnected, verifying BMS firmware version...");

            // Verify BMS firmware was updated
            const verifySuccess = await verifyFirmwareUpdate(bmsUpdateNeeded, "bms");

            if(!verifySuccess) {
                throw new Error("BMS firmware verification failed");
            }

            console.log("BMS firmware update verified successfully");
        }

        // Both updates complete - remove page leave warning and reload page
        window.removeEventListener('beforeunload', preventPageLeave);
        location.reload();

    } catch (error) {
        console.error("Firmware update error:", error);
        window.removeEventListener('beforeunload', preventPageLeave);
        $("#firmwareUpdateStart").prop("disabled", false);
        $("#firmwareUpdateStart").removeClass("d-none");
        $("#estimatedDurationContainer").removeClass("d-none");
        $("#firmwareUpdateProgress").addClass("d-none");
        alert("Firmware update error: " + error.message);
    }
}

// Progress bar countdown
function startProgressCountdown() {
    const totalMinutes = estimatedUpdateDuration;
    const totalSeconds = totalMinutes * 60;
    let elapsedSeconds = 0;
    const updateInterval = 1000; // Update every 1 second

    // Initialize progress bar to 0%
    $("#firmwareUpdateProgressBar").css("width", "0%");

    const progressInterval = setInterval(() => {
        elapsedSeconds++;

        if(elapsedSeconds <= totalSeconds) {
            // Calculate progress percentage (counting up from 0% to 100%)
            const percentageElapsed = (elapsedSeconds / totalSeconds) * 100;
            $("#firmwareUpdateProgressBar").css("width", percentageElapsed + "%");

            // Calculate time remaining
            const remainingSeconds = totalSeconds - elapsedSeconds;
            const minutesLeft = Math.floor(remainingSeconds / 60);
            const secondsLeft = remainingSeconds % 60;
            $("#firmwareUpdateProgressText").text(`${lang.system_detect.updating_firmware} ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} ${lang.system_detect.remaining}`);
        } else {
            // Countdown finished, show "Please wait..."
            clearInterval(progressInterval);
            $("#firmwareUpdateProgressBar").css("width", "100%");
            $("#firmwareUpdateProgressText").text(`${lang.system_detect.updating_firmware} ${lang.system_detect.please_wait}`);
        }
    }, updateInterval);

    return progressInterval;
}

$("#firmwareUpdateStart").on("click", () => {
    // Show confirmation modal
    $("#modalConfirmFirmwareUpdate").modal("show");
});

$("#modalConfirmFirmwareUpdate .confirm").on("click", () => {
    // Hide confirmation modal
    $("#modalConfirmFirmwareUpdate").modal("hide");

    // Prevent page leave during firmware update
    window.addEventListener('beforeunload', preventPageLeave);

    // Hide button and show progress bar
    $("#firmwareUpdateStart").addClass("d-none");
    $("#estimatedDurationContainer").addClass("d-none");
    $("#firmwareUpdateProgress").removeClass("d-none");

    // Start progress countdown
    startProgressCountdown();

    // Start the firmware update process
    performFirmwareUpdates();
});
