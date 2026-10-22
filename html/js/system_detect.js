const objGridStandards = {
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
};

let inverterSerialNumber    = "";
let inverterModel           = "";
let inverterFirmware        = "";
let bmsFirmware             = "";
let gridStandard            = "";
let isVde4105               = false;
let isVde0126               = false;
let isTor                   = false;
let isEstonia               = false;
let isGridLoss              = true;
let iArmUpdateNeeded        = "";
let iDspUpdateNeeded        = "";
let iBmsUpdateNeeded        = "";
let isS3Battery             = false; // i-Series with S3 BAT (Inverter[1101] = 3) — own BMS firmware
let cMergedUpdateNeeded     = "";
let cBmsUpdateNeeded        = "";
let estimatedUpdateDuration = 0;
let batterySoC              = 0;
let batteryVoltage          = 0;

function setLoadingConnecting() {
    $("#loadingStatusIcon").html('<div class="spinner-border text-success"></div>');
    $("#loadingText").text(t("sd_connecting"));
    $("#loadingHint").addClass("d-none");
    $("#loadingCountdown").addClass("d-none");
}

function setLoadingError(message) {
    $("#loadingStatusIcon").html('<i class="bi bi-exclamation-circle-fill text-danger"></i>');
    $("#loadingText").html(message);
}

function setGridStatus(type, text) {
    const icons = {
        success: "bi-check-circle-fill text-success",
        warning: "bi-exclamation-circle-fill text-warning",
        error:   "bi-x-circle-fill text-danger",
    };
    if (type === "neutral") {
        $("#gridStatusIcon").addClass("d-none");
    } else {
        $("#gridStatusIcon").removeClass("d-none").attr("class", `bi fs-4 ${icons[type]}`);
    }
    $("#gridStatusText").text(text);
}




// MARK: Step 1 — Wait until inverter is online

async function step1() {
    let previousLogtime = null;

    async function showRetry() {
        setLoadingError(t("sd_not_responding"));
        $("#loadingHint").removeClass("d-none");
        const delay = 5;
        for (let i = delay; i >= 1; i--) {
            $("#loadingCountdown").text(t("su_retrying_in", {seconds: i})).removeClass("d-none");
            await sleep(1000);
        }
        setLoadingConnecting();
        await sleep(1000);
    }

    while (true) {
        try {
            const json = await $.get({ url: "api.php?get=currentstate" });

            if (!json || typeof json !== "object" || !json.hasOwnProperty("logtime")) {
                await showRetry();
                continue;
            }

            const isWorking = isLogtimeRecent(json["logtime"]);

            if (!isWorking) {
                if (previousLogtime === null) previousLogtime = json["logtime"];
                else if (previousLogtime !== json["logtime"]) alert(t("sd_time_error"));
                await showRetry();
                continue;
            }

            // Check grid loss via phase voltages (< 184V = grid loss)
            isGridLoss = false;
            if (json["273"]?.["1"] < 18400) isGridLoss = true;
            if (json["274"]?.["1"] < 18400) isGridLoss = true;
            if (json["275"]?.["1"] < 18400) isGridLoss = true;

            // Battery SoC
            batterySoC     = json["3122"]?.["1"] ?? 0;
            batteryVoltage = json["3090"]?.["1"] ?? 0;

            break;
        } catch {
            await showRetry();
        }
    }

    await step2();
}




// MARK: Step 2 — Read settings (serial number, model, firmware)

async function step2() {
    try {
        const json = await $.get({ url: "api.php?get=settings" });

        if (!json || typeof json !== "object" || !json["Inverter"]?.["1"] || !json["Inverter"]?.["2"])
            return alert("E002. Please refresh the page! (Missing or malformed data in local settings table)");

        inverterSerialNumber = json["Inverter"]["2"]["s1"];
        inverterModel        = json["Inverter"]["1"]["s1"];
        inverterFirmware     = json["Inverter"]["3"]?.["s1"]    ?? "";
        bmsFirmware          = json["Inverter"]["1103"]?.["s1"] ?? "";

        // Update page title and device card UI
        const modelInt = parseInt(inverterModel, 10);
        let modelLabel = "";
        if (modelInt === 10001) {
            modelLabel = "h5";
            $("#deviceImage").attr("src", "img/device_batterx_h5.png");
        } else if (modelInt === 10002) {
            modelLabel = "h10";
            $("#deviceImage").attr("src", "img/device_batterx_h10.png");
        } else if (modelInt >= 11001 && modelInt <= 11099) {
            modelLabel = "i-Series";
            $("#deviceImage").attr("src", "img/device_batterx_i.png");
        } else if (modelInt >= 11101 && modelInt <= 11199) {
            modelLabel = "c-Series";
            $("#deviceImage").attr("src", "img/device_batterx_c.png");
        }
        $("#pageTitle").text(modelLabel ? `batterX ${modelLabel}` : "batterX");
        $("#serialNumber").text(inverterSerialNumber);

        await step3(json);
    } catch {
        alert("E001. Please refresh the page! (Error while reading settings table from local database)");
    }
}




// MARK: Step 3 — Verify device is registered in cloud, check battery

async function step3(settings) {
    try {
        const response = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "verify_device", serialnumber: inverterSerialNumber }
        });

        if (response !== "1") {
            setLoadingError(`<span class="text-danger">${t("sd_not_registered")}<br><b>(S/N: ${inverterSerialNumber})</b></span>`);
            return;
        }

        // Show the detected section, hide loading
        $("#inverterLoading").addClass("d-none");
        $("#inverterDetected").removeClass("d-none");

        // For i/c-Series: check battery SoC
        if (parseInt(inverterModel, 10) >= 11000 && (batterySoC == 0 || batteryVoltage == 0)) {
            if (sessionStorage.getItem("noBatteryInstalled") === "true") {
                await step4(settings);
                return;
            }
            $("#modalNoBattery").modal("show");
            return;
        }

        await step4(settings);
    } catch {
        alert("E003. Please refresh the page! (Error while verifying device in cloud)");
    }
}




// MARK: No Battery Modal Buttons

$("#modalNoBattery .refresh").on("click", function() {
    const $btn = $(this);
    $btn.prop("disabled", true);
    $("#modalNoBattery .confirm").prop("disabled", true);
    let count = 0;
    const max = 15;
    $btn.text(`${count} / ${max}`);
    const interval = setInterval(() => {
        count++;
        $btn.text(`${count} / ${max}`);
        if (count >= max) { clearInterval(interval); location.reload(); }
    }, 1000);
});

$("#modalNoBattery .confirm").on("click", async () => {
    sessionStorage.setItem("noBatteryInstalled", "true");
    $("#modalNoBattery").modal("hide");
    try {
        const json = await $.get({ url: "api.php?get=settings" });
        if (!json?.["Inverter"]) return alert("E002. Please refresh the page! (Missing or malformed data in local settings table)");
        await step4(json);
    } catch {
        alert("E001. Please refresh the page! (Error while reading settings table from local database)");
    }
});




// MARK: Step 4 — Grid standard card

async function step4(settings) {
    if (!settings["Inverter"]?.["201"])
        return alert(t("sd_grid_wait"));

    // Populate general selector with available standards
    try {
        const available = JSON.parse(settings["Inverter"]["201"]["s2"] || "[]");
        const options = available.map(item =>
            `<option value="${item}">${objGridStandards[item.toString()] ?? item}</option>`
        ).join("");
        $("#machineModelSelect").html(options);
    } catch {}

    gridStandard = settings["Inverter"]["201"]["s1"];
    isVde4105 = gridStandard === "2";
    isVde0126 = gridStandard === "1";
    isTor     = gridStandard === "3";
    isEstonia = gridStandard === "9";

    // Set current value in selects
    $("#germanyMachineModelSelect").val(gridStandard);
    $("#machineModelSelect").val(gridStandard);

    // Mark current option with a checkmark
    $(`#machineModelSelect option[value="${gridStandard}"]`).text(
        ($(`#machineModelSelect option[value="${gridStandard}"]`).text()) + " ✓"
    );

    // Update modal confirmation value and grid status text
    const standardName = objGridStandards[gridStandard] ?? gridStandard;
    $("#modalConfirmDeviceStandardBody").html(t("sd_confirm_body", {standard: `<b>${standardName}</b>`}));

    if (installationCountry === "de") {
        setGridStatus(isVde4105 ? "success" : "error", "VDE4105");
        if (!isVde4105 && !isVde0126) $("#generalSelector").removeClass("d-none");
        else                          $("#germanySelector").removeClass("d-none");
    } else if (installationCountry === "at") {
        setGridStatus(isTor ? "success" : "error", "TOR");
        if (!isTor) $("#generalSelector").removeClass("d-none");
    } else {
        setGridStatus("neutral", standardName);
        $("#generalSelector").removeClass("d-none");
    }

    // Save flags to session, then continue
    try {
        const response = await $.post({
            url: "cmd/session.php",
            data: { grid_standard: gridStandard }
        });
        if (response !== "1")
            return alert("E007. Please refresh the page! (Bad response while saving data to session)");
        step5(settings);
    } catch {
        alert("E006. Please refresh the page! (Error while saving data to session)");
    }
}




// MARK: Step 5 — Firmware version check

// R1/R2 version is "aa.bb" or "aa.bb-cc.dd" — compare only the parts that are there
function isCBmsUpToDate(fw) {
    const parts = fw.split("-").flatMap(p => p.split("."));
    return parts.every((v, i) => v === cBmsLatestVersion[i]);
}

function step5(settings) {
    const modelInt = parseInt(inverterModel, 10);

    // No battery data (SoC and voltage both 0) → leave the battery firmware alone
    const bmsFw = (batterySoC == 0 && batteryVoltage == 0) ? "" : bmsFirmware;

    if (modelInt >= 11001 && modelInt <= 11099) {
        // i-Series: compare ARM, DSP, BMS firmware versions
        const invParts      = inverterFirmware.split("-");
        const firstPart     = invParts[0].split(".");
        const secondPart    = invParts[1].split(".");

        const currentArm    = [firstPart[0].substring(1), secondPart[0].substring(1)];
        const currentDsp    = [firstPart[1], secondPart[1]];
        const newArm        = [iArmLatestVersion[0], iArmLatestVersion[1]];
        const newDsp        = inverterModel >= "11020" ? [iDspLgLatestVersion[0], iDspLgLatestVersion[1]] : [iDspSmLatestVersion[0], iDspSmLatestVersion[1]];
        const durationArm   = iArmEstimatedDuration;
        const durationDsp   = inverterModel >= "11020" ? iDspLgEstimatedDuration : iDspSmEstimatedDuration;

        isS3Battery         = settings?.["Inverter"]?.["1101"]?.["s1"] == "3";
        const currentBms    = bmsFw ? bmsFw.split(".") : [];
        const newBms        = isS3Battery ? [iBmsS3LatestVersion[0], iBmsS3LatestVersion[1]] : [iBmsLatestVersion[0], iBmsLatestVersion[1]];
        const durationBms   = isS3Battery ? iBmsS3EstimatedDuration : iBmsEstimatedDuration;

        const newVersionInv = `V${newArm[0]}.${newDsp[0]}.${firstPart[2]}.${firstPart[3]}-V${newArm[1]}.${newDsp[1]}.${secondPart[2]}.${secondPart[3]}`;
        const newVersionBms = `${newBms[0]}.${newBms[1]}`;

        const isArmUpToDate = currentArm[0] === newArm[0] && currentArm[1] === newArm[1];
        const isDspUpToDate = currentDsp[0] === newDsp[0] && currentDsp[1] === newDsp[1];
        const isBmsUpToDate = currentBms.length === 0 ? true : (currentBms[0] === newBms[0] && currentBms[1] === newBms[1]);

        iArmUpdateNeeded = isArmUpToDate ? "" : `${newArm[0]}(${newArm[1]})`;
        iDspUpdateNeeded = isDspUpToDate ? "" : `${newDsp[0]}(${newDsp[1]})`;
        iBmsUpdateNeeded = isBmsUpToDate ? "" : (isS3Battery ? `${newBms[0]}(${newBms[1]})` : `${newBms[0]}${newBms[1]}`);
        estimatedUpdateDuration = (isArmUpToDate ? 0 : durationArm) + (isDspUpToDate ? 0 : durationDsp) + (isBmsUpToDate ? 0 : durationBms);

        if (currentBms.length === 0) {
            $("#installedVersion").html(`<small>INVERTER</small><br>${inverterFirmware}`);
            $("#latestVersion").html(`<small>INVERTER</small><br>${newVersionInv}`);
        } else {
            $("#installedVersion").html(`<small>INVERTER</small><br>${inverterFirmware}<br><small>BMS</small><br>${bmsFw}`);
            $("#latestVersion").html(`<small>INVERTER</small><br>${newVersionInv}<br><small>BMS</small><br>${newVersionBms}`);
        }
        $("#estimatedDuration").text(`${estimatedUpdateDuration} min`);

        if (isArmUpToDate && isDspUpToDate && isBmsUpToDate) {
            showReady(true);
        } else {
            $("#firmwareUpdate").removeClass("d-none");
        }
    } else if (modelInt >= 11101 && modelInt <= 11199) {
        // c-Series: single merged firmware update + R1/R2 battery
        const invParts   = inverterFirmware.split("-");
        const firstPart  = invParts[0].split(".");
        const secondPart = invParts[1].split(".");

        const aa = firstPart[0].substring(1);  // strip leading 'V'
        const bb = secondPart[0].substring(1);
        const cc = firstPart[1];
        const dd = secondPart[1];

        const isUpToDate = aa === cMergedLatestVersion[0] && bb === cMergedLatestVersion[1]
                        && cc === cMergedLatestVersion[2] && dd === cMergedLatestVersion[3];

        // R1/R2 battery: settings hold "aa.bb" or "aa.bb-cc.dd"
        const isBmsUpToDate = !bmsFw || isCBmsUpToDate(bmsFw);
        const hasBmsFullVer = bmsFw.includes("-");

        cMergedUpdateNeeded     = isUpToDate ? "" : `${cMergedLatestVersion[0]}${cMergedLatestVersion[1]}-${cMergedLatestVersion[2]}${cMergedLatestVersion[3]}`;
        cBmsUpdateNeeded        = isBmsUpToDate ? "" : `${cBmsLatestVersion[0]}${cBmsLatestVersion[1]}-${cBmsLatestVersion[2]}${cBmsLatestVersion[3]}`;
        estimatedUpdateDuration = (isUpToDate ? 0 : cMergedEstimatedDuration) + (isBmsUpToDate ? 0 : cBmsEstimatedDuration);

        const newVersion    = `V${cMergedLatestVersion[0]}.${cMergedLatestVersion[2]}.${firstPart[2]}.${firstPart[3]}-V${cMergedLatestVersion[1]}.${cMergedLatestVersion[3]}.${secondPart[2]}.${secondPart[3]}`;
        const newVersionBms = `${cBmsLatestVersion[0]}.${cBmsLatestVersion[1]}` + (hasBmsFullVer ? `-${cBmsLatestVersion[2]}.${cBmsLatestVersion[3]}` : "");

        if (!bmsFw) {
            $("#installedVersion").html(`<small>INVERTER</small><br>${inverterFirmware}`);
            $("#latestVersion").html(`<small>INVERTER</small><br>${newVersion}`);
        } else {
            $("#installedVersion").html(`<small>INVERTER</small><br>${inverterFirmware}<br><small>BMS</small><br>${bmsFw}`);
            $("#latestVersion").html(`<small>INVERTER</small><br>${newVersion}<br><small>BMS</small><br>${newVersionBms}`);
        }
        $("#estimatedDuration").text(`${estimatedUpdateDuration} min`);

        if (isUpToDate && isBmsUpToDate) {
            showReady(true);
        } else {
            $("#firmwareUpdate").removeClass("d-none");
        }
    } else {
        // h-Series: no firmware update support
        showReady(false);
    }
}

function showReady(showFirmwareStatus) {
    if (showFirmwareStatus) $("#firmwareUpToDate").removeClass("d-none");
    $("#gridStandardCard").removeClass("d-none");
    $("#btn_continue").removeClass("d-none").prop("disabled", false);
    autoApplyImportedGridStandard();
}

// Auto-apply the imported grid standard (if any) once the grid card is visible.
// Pre-selects the imported value in both selects, then fires applyMachineModel() which shows the
// spinner + reloads the page after the change confirms.
// Skipped when: already applied this session, no import, imported matches current, or imported
// value isn't in the inverter's supported list. The "applied" flag persists until customer_info is
// re-visited (which unsets it), so a manual change by the installer after auto-apply is respected.
async function autoApplyImportedGridStandard() {
    if (importedGridStandardApplied) return;
    const importedStandard = importedProject?.grid?.standard;
    if (!importedStandard || importedStandard === gridStandard) return;
    if ($(`#machineModelSelect option[value='${importedStandard}']`).length === 0) return;

    $("#germanyMachineModelSelect").val(importedStandard);
    $("#machineModelSelect"       ).val(importedStandard);

    // Disable Continue synchronously — showReady() just enabled it, and the awaits below leave a
    // window where the installer could navigate to system_setup with the OLD grid_standard in session.
    $("#btn_continue").prop("disabled", true);

    // Mark as consumed BEFORE firing apply, so a failure mid-way still doesn't loop-apply on reload.
    try {
        await $.post({ url: "cmd/session.php", data: { imported_grid_standard_applied: "1" } });
    } catch { /* non-blocking; worst case we auto-apply once more on next visit */ }

    await applyMachineModel(importedStandard);
}




// MARK: Grid Standard Selects

$("#germanyMachineModelSelect").on("change", function() {
    $("#germanyMachineModelBtn").prop("disabled", $(this).val() === gridStandard);
});

$("#machineModelSelect").on("change", function() {
    $("#machineModelBtn").prop("disabled", $(this).val() === gridStandard);
});

$("#germanyMachineModelBtn").on("click", async () => {
    await applyMachineModel($("#germanyMachineModelSelect").val());
});

$("#machineModelBtn").on("click", async () => {
    await applyMachineModel($("#machineModelSelect").val());
});

async function applyMachineModel(val) {
    try {
        await $.get({ url: `api.php?set=command&type=24064&entity=201&text2=${val}` });
        $("#germanySelector, #generalSelector, #gridStatus").addClass("d-none");
        $("#gridApplying").removeClass("d-none");
        $("#btn_continue").prop("disabled", true);
        await checkParameters();
    } catch {
        alert("E008. Please refresh the page! (Error while writing command to local database)");
    }
}

async function checkParameters() {
    let deviceDatetime = "";
    while (true) {
        try {
            const response = await $.get({ url: "api.php?get=settings" });
            if (!response?.["Inverter"])
                return alert("E010. Please refresh the page! (Missing or malformed data in local settings table)");
            const inv = response["Inverter"];
            if (deviceDatetime === "") {
                deviceDatetime = inv["10"]["s1"];
                await sleep(5000);
                continue;
            }
            if (inv["10"]["s1"] === deviceDatetime) {
                await sleep(5000);
                continue;
            }
            location.reload();
            return;
        } catch {
            return alert("E009. Please refresh the page! (Error while reading local settings table)");
        }
    }
}




// MARK: Continue Button

$("#btn_continue").on("click", () => {
    const selectorVisible = !$("#germanySelector").hasClass("d-none") || !$("#generalSelector").hasClass("d-none");
    const isHappyPath    = (installationCountry === "de" && isVde4105) || (installationCountry === "at" && isTor);

    if (selectorVisible && !isHappyPath) {
        $("#modalConfirmDeviceStandard").modal("show");
    } else {
        window.location.href = "system_setup.php";
    }
});

$("#modalConfirmDeviceStandardBtn").on("click", () => {
    $("#modalConfirmDeviceStandard").modal("hide");
    window.location.href = "system_setup.php";
});




// MARK: Firmware Update

function preventPageLeave(event) {
    event.preventDefault();
    event.returnValue = "";
}

async function waitForProgramRestart() {
    await sleep(10000);
    let initialLogtime = null;
    try {
        const r = await $.get({ url: "api.php?get=currentstate" });
        initialLogtime = r?.logtime ?? null;
    } catch {}

    const startTime = Date.now();
    while (Date.now() - startTime < 300000) {
        try {
            const r = await $.get({ url: "api.php?get=currentstate" });
            if (r?.logtime && r.logtime !== initialLogtime) return true;
            await sleep(5000);
        } catch { await sleep(5000); }
    }
    return false;
}

async function waitForBatteryVoltage() {
    await sleep(10000);
    const startTime = Date.now();
    while (Date.now() - startTime < 600000) {
        try {
            const r = await $.get({ url: "api.php?get=currentstate" });
            const voltage = r?.["3090"]?.["1"] ?? 0;
            if (voltage > 100) return true;
            await sleep(5000);
        } catch { await sleep(5000); }
    }
    return false;
}

async function verifyFirmwareUpdate(expectedVersion, firmwareType) {
    const maxWait = (firmwareType === "bms" || firmwareType === "bms-s3" || firmwareType === "c-bms" ? 7 : 2) * 60000;
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
        try {
            const r = await $.get({ url: "api.php?get=settings" });
            if (firmwareType === "arm" || firmwareType === "dsp") {
                const fw = r?.["Inverter"]?.["3"]?.["s1"];
                if (fw) {
                    const parts = fw.split("-");
                    const a = parts[0].split(".");
                    const b = parts[1].split(".");
                    if (firmwareType === "arm") {
                        if (`${a[0].substring(1)}(${b[0].substring(1)})` === expectedVersion) return true;
                    } else {
                        if (`${a[1]}(${b[1]})` === expectedVersion) return true;
                    }
                }
            } else if (firmwareType === "bms" || firmwareType === "bms-s3") {
                const fw = r?.["Inverter"]?.["1103"]?.["s1"];
                if (fw) {
                    const parts = fw.split(".");
                    const current = firmwareType === "bms" ? `${parts[0]}${parts[1]}` : `${parts[0]}(${parts[1]})`;
                    if (current === expectedVersion) return true;
                }
            } else if (firmwareType === "c-merged") {
                const fw = r?.["Inverter"]?.["3"]?.["s1"];
                if (fw) {
                    const parts = fw.split("-");
                    const a = parts[0].split(".");
                    const b = parts[1].split(".");
                    const current = `${a[0].substring(1)}${b[0].substring(1)}-${a[1]}${b[1]}`;
                    if (current === expectedVersion) return true;
                }
            } else if (firmwareType === "c-bms") {
                const fw = r?.["Inverter"]?.["1103"]?.["s1"];
                if (fw && isCBmsUpToDate(fw)) return true;
            }
            await sleep(5000);
        } catch { await sleep(5000); }
    }
    return false;
}

async function waitForFirmwareUpdateComplete() {
    const startTime = Date.now();
    let consecutiveCount = 0;
    while (Date.now() - startTime < 900000) {
        try {
            const status = await $.post({ url: "cmd/fwupdate.php", data: { action: "status" } });
            if (status === "{}") {
                if (++consecutiveCount >= 5) return { success: true };
            } else if (status && status !== "") {
                const parsed = JSON.parse(status);
                if (parsed.state === 0) {
                    if (++consecutiveCount >= 5) return { success: true, message: parsed.message };
                } else if (parsed.state === 2) {
                    return { success: false, message: parsed.message };
                } else {
                    consecutiveCount = 0;
                }
            } else {
                consecutiveCount = 0;
            }
            await sleep(5000);
        } catch { consecutiveCount = 0; await sleep(5000); }
    }
    return { success: false, message: "Timeout: firmware update did not complete" };
}

async function performFirmwareUpdates() {
    try {
        if (iArmUpdateNeeded) {
            const r = await $.post({ url: "cmd/fwupdate.php", data: { action: "start", type: "i-arm", version: iArmUpdateNeeded } });
            if (r !== "1") throw new Error("Failed to start ARM firmware update");
            await waitForFirmwareUpdateComplete();
            if (!await waitForProgramRestart()) throw new Error("Program did not restart after ARM update");
            if (!await verifyFirmwareUpdate(iArmUpdateNeeded, "arm")) throw new Error("ARM firmware verification failed");
        }

        if (iDspUpdateNeeded) {
            const dspType = inverterModel >= "11020" ? "i-dsp-lg" : "i-dsp-sm";
            const r = await $.post({ url: "cmd/fwupdate.php", data: { action: "start", type: dspType, version: iDspUpdateNeeded } });
            if (r !== "1") throw new Error("Failed to start DSP firmware update");
            await waitForFirmwareUpdateComplete();
            if (!await waitForProgramRestart()) throw new Error("Program did not restart after DSP update");
            if (!await verifyFirmwareUpdate(iDspUpdateNeeded, "dsp")) throw new Error("DSP firmware verification failed");
        }

        if (iBmsUpdateNeeded) {
            const bmsType = isS3Battery ? "i-bms-s3" : "i-bms";
            const r = await $.post({ url: "cmd/fwupdate.php", data: { action: "start", type: bmsType, version: iBmsUpdateNeeded } });
            if (r !== "1") throw new Error("Failed to start BMS firmware update");
            await waitForFirmwareUpdateComplete();
            if (!await waitForProgramRestart()) throw new Error("Program did not restart after BMS update");
            if (!await waitForBatteryVoltage()) throw new Error("Battery did not reconnect after BMS update");
            if (!await verifyFirmwareUpdate(iBmsUpdateNeeded, isS3Battery ? "bms-s3" : "bms")) throw new Error("BMS firmware verification failed");
        }

        if (cMergedUpdateNeeded) {
            const r = await $.post({ url: "cmd/fwupdate.php", data: { action: "start", type: "c-merged", version: cMergedUpdateNeeded } });
            if (r !== "1") throw new Error("Failed to start c-Series firmware update");
            await waitForFirmwareUpdateComplete();
            if (!await waitForProgramRestart()) throw new Error("Program did not restart after c-Series firmware update");
            if (!await verifyFirmwareUpdate(cMergedUpdateNeeded, "c-merged")) throw new Error("c-Series firmware verification failed");
        }

        if (cBmsUpdateNeeded) {
            const r = await $.post({ url: "cmd/fwupdate.php", data: { action: "start", type: "c-bms", version: cBmsUpdateNeeded } });
            if (r !== "1") throw new Error("Failed to start BMS firmware update");
            await waitForFirmwareUpdateComplete();
            if (!await waitForProgramRestart()) throw new Error("Program did not restart after BMS update");
            if (!await waitForBatteryVoltage()) throw new Error("Battery did not reconnect after BMS update");
            if (!await verifyFirmwareUpdate(cBmsUpdateNeeded, "c-bms")) throw new Error("BMS firmware verification failed");
        }

        window.removeEventListener("beforeunload", preventPageLeave);
        location.reload();
    } catch (error) {
        window.removeEventListener("beforeunload", preventPageLeave);
        alert("Firmware update error: " + error.message);
        location.reload();
    }
}

function startProgressCountdown() {
    const totalSeconds = estimatedUpdateDuration * 60;
    let elapsed = 0;
    $("#firmwareUpdateProgressBar").css("width", "0%");
    const interval = setInterval(() => {
        elapsed++;
        if (elapsed <= totalSeconds) {
            const pct = (elapsed / totalSeconds) * 100;
            const remaining = totalSeconds - elapsed;
            const m = Math.floor(remaining / 60);
            const s = (remaining % 60).toString().padStart(2, "0");
            $("#firmwareUpdateProgressBar").css("width", pct + "%");
            $("#firmwareUpdateProgressText").text(t("sd_updating_fw", {time: `${m}:${s}`}));
        } else {
            clearInterval(interval);
            $("#firmwareUpdateProgressBar").css("width", "100%");
            $("#firmwareUpdateProgressText").text(t("sd_updating_fw_wait"));
        }
    }, 1000);
}

$("#firmwareUpdateStart").on("click", () => {
    $("#modalConfirmFirmwareUpdate").modal("show");
});

$("#modalConfirmFirmwareUpdate .confirm").on("click", () => {
    $("#modalConfirmFirmwareUpdate").modal("hide");
    window.addEventListener("beforeunload", preventPageLeave);
    $("#firmwareUpdateStart").addClass("d-none");
    $("#estimatedDurationContainer").addClass("d-none");
    $("#firmwareUpdateProgress").removeClass("d-none");
    startProgressCountdown();
    performFirmwareUpdates();
});




// MARK: Init

(async () => { await step1(); })();
