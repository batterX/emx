const EVC_PRODUCER_URLS = {
    1: "https://api.batterx.app/docs/wallbox/Spelsberg Wallbox Smart Pro.pdf"
};

const batterxStringEntities  = [1, 2, 3, 4, 5, 6, 7, 8];
const externalStringEntities = [101, 102, 103, 104, 105, 106, 107, 108];

var installationDate = new Date().toISOString().split('T')[0]; // today's date by default

var installationInfo = {};

var dataSettings = {};
var importedData = {};

var systemSerial     = "";
var systemType       = "";

var devicePartNumber = "";
var deviceModel      = "";
var devicePower      = 0;

var isClix   = false;
var isClixV2 = false;

var skipSetup = false;

var isAlreadyRegistered = false;

var cloudSetSyncActive = true;

var lastSystemConfirmDisabled = false;

var reactive_mode   = "";
var reactive_kink   = "";
var reactive_cosphi = "";
var reactive_qmaxsn = "";
var reactive_v1     = "";
var reactive_v2     = "";
var reactive_v3     = "";
var reactive_v4     = "";
var reactive_qutime = "";
var reactive_qfix   = "";

var newParameters = {};
var oldParameters = {};

var previousSettings = null; // Store the previous response, to compare and know when something has changed

var rawInjectionPower = 0; // Computed in beginSetup(); re-used in applyParams() to skip injection-ON when 0W

var isSettingParameters = false;
var checkParametersInterval;
var checkParametersCounter;

function isNewSys   () { return $("#system_radio_new").is(":checked"); }
function isOldSys   () { return $("#system_radio_old").is(":checked"); }

function isUPS      () { return $("#bx_sysmode").val() == "0"; }
function isBackup   () { return $("#bx_sysmode").val() == "1"; }

function isLiFePO   () { return $("#bx_battery_type_0").is(":checked"); }
function isCarbon   () { return $("#bx_battery_type_1").is(":checked"); }
function isOther    () { return $("#bx_battery_type_9").is(":checked"); }
function isNoBattery() { return $("#bx_battery_type_n").is(":checked"); }

function elementExists(selector) { return $(selector).length > 0; }




















// MARK: Initialization





// MARK: Helpers



// Helper: Set Loading Error
function setLoadingError(message) {
    $("#loadingStatusIcon").html('<i class="bi bi-exclamation-circle-fill text-danger"></i>');
    $("#loadingText").html(message);
    $("#loadingReload").removeClass("d-none");
}

// Helper: Set Box Not Registered Error
function setBoxNotRegisteredError() {
    $("#systemLoading").addClass("d-none");
    $("#boxNotRegistered").removeClass("d-none");
}



// Helper: Show Confirm Button
function showSystemConfirmButton(disabled = false) {
    lastSystemConfirmDisabled = disabled;
    const fuseEmpty = $("#bx_gridfuseamps").val() === "";
    $("#btnSystemImport").addClass("d-none").prop("disabled", true);
    $("#btnSystemConfirm").removeClass("d-none").prop("disabled", disabled || fuseEmpty);
    $("#importProgress").addClass("d-none");
}

// Helper: Show Import Button
function showSystemImportButton() {
    const fuseEmpty = $("#bx_gridfuseamps").val() === "";
    $("#btnSystemConfirm").addClass("d-none").prop("disabled", true);
    $("#btnSystemImport").removeClass("d-none").prop("disabled", fuseEmpty);
    $("#importProgress").addClass("d-none");
}

// Helper: Show Import Progress
function showImportProgress(current, total) {
    $("#btnSystemConfirm").addClass("d-none").prop("disabled", true);
    $("#btnSystemImport").addClass("d-none").prop("disabled", true);
    const percent = Math.round(current / total * 100);
    $("#importProgressStep").text(`${current} / ${total} (${percent}%)`);
    $("#importProgress").removeClass("d-none");
}

// Helper: Hide All System Buttons
function hideAllSystemButtons() {
    $("#btnSystemImport").addClass("d-none").prop("disabled", true);
    $("#btnSystemConfirm").addClass("d-none").prop("disabled", true);
    $("#importProgress").addClass("d-none");
}



// Helper: Save Session Data
async function save_session(data) {
    try {
        const response = await $.post({ url: "cmd/session.php", data: data });
        console.log("save_session", response);
        if (response !== "1") return [null, "Bad response while saving data to session"];
        return [true, null];
    } catch (error) {
        return [null, "Error while saving data to session"];
    }
}

// Helper: Get Installation Info
async function get_installation_info() {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_installation_info", apikey: apikey }
        });
        console.log("get_installation_info", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading installation info from cloud"];
    }
}

// Helper: Get Box Info
async function get_box_info() {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_box_info", apikey: apikey }
        });
        console.log("get_box_info", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading liveX/EMX info from cloud"];
    }
}

// Helper: Get Device Part Number
async function get_device_partnumber(serialnumber) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_device_partnumber", serialnumber: serialnumber }
        });
        console.log("get_device_partnumber", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading device part number from cloud"];
    }
}

// Helper: Get Battery Part Number
async function get_battery_partnumber(serialnumber) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_battery_partnumber", serialnumber: serialnumber }
        });
        console.log("get_battery_partnumber", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading battery part number from cloud"];
    }
}

// Helper: Get BMS Part Number
async function get_bms_partnumber(serialnumber) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_bms_partnumber", serialnumber: serialnumber }
        });
        console.log("get_bms_partnumber", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading BMS part number from cloud"];
    }
}

// Helper: Get Local Settings (makes sure inverter data exists)
async function get_settings() {
    try {
        const data = await $.get({ url: "api.php?get=settings" });
        console.log("get_settings", data);
        if (!data || typeof data !== "object" || !data.hasOwnProperty("Inverter"))
            return [null, "Missing or malformed data in local settings table"];
        return [data, null];
    } catch (error) {
        return [null, "Error while reading local settings table"];
    }
}

// Helper: Get System Data
async function get_system_data(system, customer) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_system_data", system: system, customer: customer.trim().toLowerCase() }
        });
        console.log("get_system_data", data);
        return [data, null];
    } catch (error) {
        return [null, "Error while reading system data from cloud"];
    }
}

// Helper: Verify System (returns true if SN is available for this user — free or unverified owner)
async function verify_system(system, user) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "verify_system", system: system, user: user.trim().toLowerCase() }
        });
        console.log("verify_system", data);
        return [data === "1", null];
    } catch (error) {
        return [null, "Error while verifying system in cloud"];
    }
}

// Helper: Verify Device (returns true if SN is available for this system)
async function verify_device(serialnumber, system) {
    try {
        const data = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "verify_device", serialnumber: serialnumber, system: system }
        });
        console.log("verify_device", data);
        return [data === "1", null];
    } catch (error) {
        return [null, "Error while verifying device in cloud"];
    }
}





// MARK: Initial Load



async function initialLoad() {

    // Read and confirm data

    // Confirm apikey length
    if (!apikey || apikey.length != 40) {
        setLoadingError("Missing or malformed apikey");
        return;
    }

    // Get installation info
    const [installation_info, install_error] = await get_installation_info();
    if (install_error) {
        setLoadingError(install_error);
        return;
    }

    // Confirm system serial number exists if installation info is present
    if (installation_info) {
        if (!installation_info.hasOwnProperty("system") || !installation_info.system.hasOwnProperty("serialnumber")) {
            setLoadingError("System serial number is missing from installation info");
            return;
        }
    }

    // Get box info
    const [box_info, box_error] = await get_box_info();
    if (box_error) {
        setLoadingError(box_error);
        return;
    }

    // Confirm box is registered
    if (!box_info) {
        setBoxNotRegisteredError();
        return;
    }

    // Save box serial number & part number to session
    const [box_session, box_session_error] = await save_session({
        box_serial: box_info.serialnumber,
        box_partnumber: box_info.partnumber
    });
    if (box_session_error) {
        setLoadingError(box_session_error);
        return;
    }

    // Get local settings
    const [settings, settings_error] = await get_settings();
    if (settings_error) {
        setLoadingError(settings_error);
        return;
    }

    // Confirm device serial number and model exist
    if (!settings["Inverter"].hasOwnProperty("1") || !settings["Inverter"].hasOwnProperty("2")) {
        setLoadingError("Missing inverter data from settings table");
        return;
    }

    // Get device serial number
    var device_serial_number = settings["Inverter"]["2"]["s1"];

    // Get device part number
    const [device_partnumber, device_pn_error] = await get_device_partnumber(device_serial_number);
    if (device_pn_error) {
        setLoadingError(device_pn_error);
        return;
    }

    // Confirm device part number found
    if (!device_partnumber) {
        setLoadingError("Device part number not found");
        return;
    }

    // Save device serial number & part number to session
    const [device_session, device_session_error] = await save_session({
        device_serial: device_serial_number,
        device_partnumber: device_partnumber
    });
    if (device_session_error) {
        setLoadingError(device_session_error);
        return;
    }

    // Store variables

    // Store installation info
    installationInfo = installation_info;

    // Store settings table
    dataSettings = JSON.parse(JSON.stringify(settings));
    
    // Store device part number
    devicePartNumber = device_partnumber;

    // Store device model
    deviceModel = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].type : "";

    // Store device power
    if (settings["Inverter"]["4"] && settings["Inverter"]["4"]["s1"]) {
        devicePower = parseInt(settings["Inverter"]["4"]["s1"]);
    }

    // Store CloudSet mode sync (0=False/SyncOff 1=True/SyncOn)
    if (settings.hasOwnProperty("CloudSet")) {
        cloudSetSyncActive = parseInt(settings["CloudSet"]["0"]["mode"].toString()) ? true : false;
    }

    // Store systemType (r/w) for model naming
    if (boxType == "livex") {
        systemType = ["200415", "K800415", "K800417"].some(prefix => box_info.partnumber.startsWith(prefix)) ? "w" : "r";
    }

    // Store isClix and isClixV2
    if (PNS_BOX.hasOwnProperty(box_info.partnumber)) {
        if (PNS_BOX[box_info.partnumber].type == "xc") {
            isClix   = true;
            isClixV2 = PNS_BOX[box_info.partnumber].version > 1;
        }
    }

    // Existing system -> store system serial number and already registered flag
    if (installation_info) {
        systemSerial = installation_info.system.serialnumber;
        isAlreadyRegistered = true;
    }

    // Update UI

    // Show box serial number
    $("#bx_box").val(box_info.serialnumber);

    // Show device serial number
    $("#bx_device").val(device_serial_number);

    // Special UI changes for cliX
    if (boxType == "livex" && isClix) {
        // Always visible system SN field
        $("#bx_system_section").removeClass("d-none");
        // Update system SN label to add the word "cabinet"
        $("#bx_system_label").text(t("ss_system_serialnumber_cabinet"));
        // Show system mode field for cliX 2.0
        if (isClixV2) {
            $("#bx_sysmode_section").removeClass("d-none");
            if (settings.hasOwnProperty("SystemMode")) {
                $("#bx_sysmode").val(settings["SystemMode"]["0"]["mode"]);
            }
        }
    }

    // Show grid fuse amps
    if (settings.hasOwnProperty("SystemMode") && parseInt(settings["SystemMode"]["0"]["v5"]) > 0) {
        $("#bx_gridfuseamps").val(settings["SystemMode"]["0"]["v5"]);
    }

    // New system route
    if (!isAlreadyRegistered) {
        // Show continue button (disabled for cliX, enabled for all other)
        showSystemConfirmButton(isClix);
    }
    // Existing system route
    else {
        // Check existing system radio button
        $("#system_radio_old").prop("checked", true);
        // Disable new/existing toggle
        $("#system_radio_new, #system_radio_old").prop("disabled", true);
        // Show system serial number
        $("#bx_system").val(systemSerial);
        $("#bx_system").prop("disabled", true);
        $("#bx_system_section").removeClass("d-none");
        // Show continue or import data from cloud button
        if (cloudSetSyncActive) {
            // Sync active, show continue (enabled)
            showSystemConfirmButton();
        } else {
            // Get system data (non-fatal — import button just won't appear on error)
            const [system_data] = await get_system_data(systemSerial, customerEmail);
            // Show correct button
            if (system_data && system_data.hasOwnProperty("info")) {
                importedData = system_data;
                showSystemImportButton();
            } else {
                showSystemConfirmButton();
            }
        }
        // Show installer memo (that's the only one that is visible in the #system card directly)
        if (installation_info.hasOwnProperty("note")) {
            $("#installer_memo").val(installation_info.note);
        }
    }

    // Data loaded — hide loading card, show system section
    $("#systemLoading").addClass("d-none");
    $("#system").removeClass("d-none");

}





// MARK: Radio/SN Change



function showSystemSnError(message) {
    $("#bx_system").addClass("is-invalid");
    $("#bx_system_error").text(message).removeClass("d-none");
}

function clearSystemSnError() {
    $("#bx_system").removeClass("is-invalid is-valid");
    $("#bx_system_error").addClass("d-none").text("");
}



$("#bx_system").on("input", function() {
    if ($(this).val().trim() == "") {
        clearSystemSnError();
        showSystemConfirmButton(true);
    }
});

$("#bx_system").on("change", () => systemOnChangeListener());

$("input[name=system_radio]").on("change", function() {
    // Show/hide system SN field
    if (isClix) {
        $("#bx_system_section").removeClass("d-none");
    } else {
        if (this.value == "old") 
            $("#bx_system_section").removeClass("d-none");
        else 
            $("#bx_system_section").addClass("d-none");
    }
    // Load data and update UI
    systemOnChangeListener();
});

$("#bx_gridfuseamps").on("change", function() {
    const isEmpty = $(this).val() === "";
    if (!$("#btnSystemConfirm").hasClass("d-none")) {
        $("#btnSystemConfirm").prop("disabled", lastSystemConfirmDisabled || isEmpty);
    } else if (!$("#btnSystemImport").hasClass("d-none")) {
        $("#btnSystemImport").prop("disabled", isEmpty);
    }
});



async function systemOnChangeListener() {

    var bx_system_val = $("#bx_system").val().trim();

    // Clear any previous error
    clearSystemSnError();

    // Old system
    if (isOldSys()) {
        // SN empty
        if (bx_system_val == "") {
            // Show disabled continue button
            showSystemConfirmButton(true);
            return;
        }
        // SN not empty
        else {
            // Load cloud data
            const [system_data] = await get_system_data(bx_system_val, customerEmail);
            // Data exists
            if (system_data && system_data.hasOwnProperty("info")) {
                // Show import button
                $("#bx_system").addClass("is-valid");
                importedData = system_data;
                showSystemImportButton();
                // Populate fields visible in #system card directly
                if (system_data.info.hasOwnProperty("note")) {
                    $("#installer_memo").val(system_data.info.note);
                }
                if (isClixV2 && system_data.settings?.hasOwnProperty("SystemMode")) {
                    $("#bx_sysmode").val(system_data.settings["SystemMode"]["0"]["mode"]);
                }
            }
            // Data does not exist
            else {
                // Show error and disabled continue button
                showSystemSnError(t("ss_system_sn_not_found", { serialnumber: bx_system_val }));
                // Show disabled continue button
                showSystemConfirmButton(true);
            }
        }
    }
    // New system
    else {
        // System SN required
        if (isClix) {
            // SN empty
            if (bx_system_val == "") {
                // Show disabled continue button
                showSystemConfirmButton(true);
                return;
            }
            // SN not empty
            else {
                // Check if SN is available (not taken by another user)
                const [available, verify_error] = await verify_system(bx_system_val, customerEmail);
                if (!available || verify_error) {
                    // Show error and disabled continue button
                    showSystemSnError(t("ss_system_registered_other_user"));
                    showSystemConfirmButton(true);
                } else {
                    // Check if SN is already registered to this customer
                    const [system_data] = await get_system_data(bx_system_val, customerEmail);
                    if (system_data && system_data.hasOwnProperty("info")) {
                        // Show error and disabled continue button
                        showSystemSnError(t("ss_system_registered_other_user"));
                        showSystemConfirmButton(true);
                    } else {
                        // Final local check: S/N must be exactly 14 characters
                        if (bx_system_val.length != 14) {
                            showSystemSnError(t("ss_system_sn_not_correct"));
                            showSystemConfirmButton(true);
                        } else {
                            // Show enabled continue button
                            $("#bx_system").addClass("is-valid");
                            showSystemConfirmButton();
                        }
                    }
                }
            }
        }
        // No SN for new systems
        else {
            // Show enabled continue button
            showSystemConfirmButton();
        }
    }

}





// MARK: Import/Confirm Click



$("#btnSystemImport").on("click", async function() {
    // Disable button
    $(this).prop("disabled", true);
    // Lock system selection
    $("#system_radio_new, #system_radio_old").prop("disabled", true);
    $("#bx_system").prop("disabled", true);
    // Verify inverter is not registered with another system
    const [deviceOk, deviceErr] = await verify_device($("#bx_device").val(), (isClix || isOldSys()) ? $("#bx_system").val().trim() : "NEW");
    if (!deviceOk || deviceErr) {
        $("#system_radio_new, #system_radio_old").prop("disabled", false);
        $("#bx_system").prop("disabled", false);
        showSystemImportButton();
        if (deviceErr) alert("E014. Please refresh the page! (Error while verifying device serialnumber in cloud)");
        else $("#errorInverterRegisteredWithOtherSystem").modal("show");
        return;
    }
    // Import settings
    await importSystemSettings();
    // Get info object or null
    const info = importedData.hasOwnProperty("info") ? importedData.info : null;
    // Fetch new local settings
    const [settings, settings_error] = await get_settings();
    if (settings_error) {
        alert("E013. Please refresh the page! (" + settings_error + ")");
        return;
    }
    dataSettings = settings;
    // Update Installation Date
    if (info && info.hasOwnProperty("installation_date")) {
        installationDate = info.installation_date;
    }
    // Populate all sections
    showBatteryData(info, settings);
    showSolarData(info, settings);
    showSteuVE(info, settings);
    showReactive(info, settings);
    showOther(info, settings);
    // Reveal battery immediately; remaining sections shown progressively via Continue buttons
    hideAllSystemButtons();
    showBatterySection();
    $("#btn_battery_next").removeClass("d-none");
    $("#battery")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});



$("#btnSystemConfirm").on("click", async function() {
    // Disable button
    $(this).prop("disabled", true);
    // Lock system selection
    $("#system_radio_new, #system_radio_old").prop("disabled", true);
    $("#bx_system").prop("disabled", true);
    // Verify inverter is not registered with another system
    const [deviceOk, deviceErr] = await verify_device($("#bx_device").val(), (isClix || isOldSys()) ? $("#bx_system").val().trim() : "NEW");
    if (!deviceOk || deviceErr) {
        $("#system_radio_new, #system_radio_old").prop("disabled", false);
        $("#bx_system").prop("disabled", false);
        showSystemConfirmButton();
        if (deviceErr) alert("E014. Please refresh the page! (Error while verifying device serialnumber in cloud)");
        else $("#errorInverterRegisteredWithOtherSystem").modal("show");
        return;
    }
    // Get info object or null
    const info = installationInfo ? installationInfo : null;
    // Fetch new local settings
    const [settings, settings_error] = await get_settings();
    if (settings_error) {
        alert("E013. Please refresh the page! (" + settings_error + ")");
        return;
    }
    dataSettings = settings;
    // Update Installation Date
    if (info && info.hasOwnProperty("installation_date")) {
        installationDate = info.installation_date;
    }
    // Populate all sections
    showBatteryData(info, settings);
    showSolarData(info, settings);
    showSteuVE(info, settings);
    showReactive(info, settings);
    showOther(info, settings);
    // Reveal battery immediately; remaining sections shown progressively via Continue buttons
    hideAllSystemButtons();
    showBatterySection();
    $("#btn_battery_next").removeClass("d-none");
    $("#battery")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});





// MARK: Import Settings



async function importSystemSettings() {

    if (!importedData.hasOwnProperty("settings")) return;

    var response = importedData.settings;

    const settings = [
        { varName: "ModbusExtSolarDevice", entity: "0" },
        { varName: "InvertMeterSign",  entity: "0" },
        { varName: "UserMeter",        entity: "1" },
        { varName: "UserMeter",        entity: "2" },
        { varName: "UserMeter",        entity: "3" },
        { varName: "UserMeter",        entity: "4" },
        { varName: "EVCharger",        entity: "1" },
        { varName: "EVChargerDefault", entity: "1" },
        { varName: "EVChargerModbus",  entity: "1" },
        { varName: "EVChargerOp",      entity: "1" },
        { varName: "EVChargerPeriod",  entity: "11" },
        { varName: "EVChargerPeriod",  entity: "12" },
        { varName: "EVChargerPeriod",  entity: "13" },
        { varName: "PrepareBatteryExtension", entity: "0" },
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
        { varName: "ForecastSolar", entity: "4" },
        { varName: "ForecastSolar", entity: "5" },
        { varName: "ForecastSolar", entity: "6" },
        { varName: "ForecastSolar", entity: "7" },
        { varName: "ForecastSolar", entity: "8" },
        { varName: "ForecastSolar", entity: "101" },
        { varName: "ForecastSolar", entity: "102" },
        { varName: "ForecastSolar", entity: "103" },
        { varName: "ForecastSolar", entity: "104" },
        { varName: "ForecastSolar", entity: "105" },
        { varName: "ForecastSolar", entity: "106" },
        { varName: "ForecastSolar", entity: "107" },
        { varName: "ForecastSolar", entity: "108" }
    ];

    const totalSteps = settings.length;

    try {
        for (let currentStep = 0; currentStep < settings.length; currentStep++) {
            const { varName, entity } = settings[currentStep];
            const temp = response.hasOwnProperty(varName) && response[varName].hasOwnProperty(entity) ? response[varName][entity] : false;
            const jsonArr = temp === false ? [] : [temp.mode, temp.v1, temp.v2, temp.v3, temp.v4, temp.v5, temp.v6, temp.s1, temp.s2, temp.name];
            await importSystemSettings_applySetting(totalSteps, currentStep + 1, varName, entity, jsonArr);
        }
    } catch (error) {
        showSystemImportButton();
        alert("Error while importing settings: " + error.message);
    }

}



async function importSystemSettings_applySetting(totalSteps, currentStep, varName, entity, jsonArr) {

    showImportProgress(currentStep, totalSteps);

    if (jsonArr.length == 0) return;
    
    // Check if cloud and local setting are already the same
    if (dataSettings.hasOwnProperty(varName) && dataSettings[varName].hasOwnProperty(entity)) {
        var allAreEqual = true;
        if (jsonArr.length > 0 && dataSettings[varName][entity].mode != jsonArr[0]) allAreEqual = false;
        if (jsonArr.length > 1 && dataSettings[varName][entity].v1   != jsonArr[1]) allAreEqual = false;
        if (jsonArr.length > 2 && dataSettings[varName][entity].v2   != jsonArr[2]) allAreEqual = false;
        if (jsonArr.length > 3 && dataSettings[varName][entity].v3   != jsonArr[3]) allAreEqual = false;
        if (jsonArr.length > 4 && dataSettings[varName][entity].v4   != jsonArr[4]) allAreEqual = false;
        if (jsonArr.length > 5 && dataSettings[varName][entity].v5   != jsonArr[5]) allAreEqual = false;
        if (jsonArr.length > 6 && dataSettings[varName][entity].v6   != jsonArr[6]) allAreEqual = false;
        if (jsonArr.length > 7 && dataSettings[varName][entity].s1   != jsonArr[7]) allAreEqual = false;
        if (jsonArr.length > 8 && dataSettings[varName][entity].s2   != jsonArr[8]) allAreEqual = false;
        if (jsonArr.length > 9 && dataSettings[varName][entity].name != jsonArr[9]) allAreEqual = false;
        if (allAreEqual) {
            await sleep(250);
            return;
        }
    }

    // Keep trying to set and verify the setting until it's applied correctly
    while (true) {
        try {
            // Update setting in database
            const setResponse = await $.get({
                url: `api.php?set=command&type=11&entity=0&text1=${entity} ${varName}&text2=${encodeURIComponent(JSON.stringify(jsonArr))}`
            });
            
            if (setResponse != "1") {
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
            
            if (!getResponse || typeof getResponse != "object") {
                // Bad response, wait and try the whole process again
                await sleep(5000);
                continue;
            }
            
            dataSettings = JSON.parse(JSON.stringify(getResponse));

            if (!getResponse.hasOwnProperty(varName) || !getResponse[varName].hasOwnProperty(entity)) {
                alert("Error while writing the settings, please refresh the page! (E003) " + varName + " " + entity);
                return;
            }

            // Check if all values match
            let allMatch = true;
            if (jsonArr.length > 0 && getResponse[varName][entity].mode != jsonArr[0]) allMatch = false;
            if (jsonArr.length > 1 && getResponse[varName][entity].v1   != jsonArr[1]) allMatch = false;
            if (jsonArr.length > 2 && getResponse[varName][entity].v2   != jsonArr[2]) allMatch = false;
            if (jsonArr.length > 3 && getResponse[varName][entity].v3   != jsonArr[3]) allMatch = false;
            if (jsonArr.length > 4 && getResponse[varName][entity].v4   != jsonArr[4]) allMatch = false;
            if (jsonArr.length > 5 && getResponse[varName][entity].v5   != jsonArr[5]) allMatch = false;
            if (jsonArr.length > 6 && getResponse[varName][entity].v6   != jsonArr[6]) allMatch = false;
            if (jsonArr.length > 7 && getResponse[varName][entity].s1   != jsonArr[7]) allMatch = false;
            if (jsonArr.length > 8 && getResponse[varName][entity].s2   != jsonArr[8]) allMatch = false;
            if (jsonArr.length > 9 && getResponse[varName][entity].name != jsonArr[9]) allMatch = false;

            if (allMatch) {
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





// MARK: Show Battery



$("input[name=bx_battery_type]").on("change", function() {
    if (this.value == "") { // no battery
        $("#battery_content").hide();
    } else { // lifepo/carbon/other
        $("#battery_content").show();
        $("#battery_section_0, #battery_section_1, #battery_section_9").hide();
        $(`#battery_section_${this.value}`).show();
        if (this.value == "1") { // carbon
            $("#carbon_battery_model").trigger("change");
        }
    }
});

$("#carbon_battery_model, #carbon_battery_strings").on("change", function() {
    
    var batteryModel    = $("#carbon_battery_model").val();
    var batteryStrings  = $("#carbon_battery_strings").val();
    var batteryCapacity = 0;

         if (batteryModel == "LC+700"  ) batteryCapacity = 4 * 700 * parseInt(batteryStrings);
    else if (batteryModel == "LC+1300" ) batteryCapacity = 4 * 1300 * parseInt(batteryStrings);
    else if (batteryModel == "LC+2V500") batteryCapacity = 24 * 2 * 500 * parseInt(batteryStrings);

    $("#carbon_battery_capacity").val(`${(batteryCapacity / 1000).toLocaleString(undefined, {maximumFractionDigits: 2})} kWh`).data("wh", batteryCapacity);

});



function showBatteryData(info, settings) {

    // Show/hide radio options and BMS field based on system type
    if (boxType == "livex" && isClix) {
        // cliX: LiFePO + No Battery
        $("#battery_radio_lifepo").removeClass("d-none");
        $("#battery_radio_carbon").addClass("d-none");
        $("#battery_radio_other").addClass("d-none");
        $("#lifepo_bms_section").addClass("d-none");
        $("#bx_battery_type_0").prop("checked", true).trigger("change");
    } else if (boxType == "livex") {
        // XH: Carbon + Other + No Battery
        $("#battery_radio_lifepo").addClass("d-none");
        $("#battery_radio_carbon").removeClass("d-none");
        $("#battery_radio_other").removeClass("d-none");
        $("#lifepo_bms_section").addClass("d-none");
        $("#bx_battery_type_1").prop("checked", true).trigger("change");
    } else {
        // EMX: LiFePO + No Battery (with BMS)
        $("#battery_radio_lifepo").removeClass("d-none");
        $("#battery_radio_carbon").addClass("d-none");
        $("#battery_radio_other").addClass("d-none");
        $("#lifepo_bms_section").removeClass("d-none");
        $("#bx_battery_type_0").prop("checked", true).trigger("change");
    }

    // Set batteries info from cloud (if info exists)
    if (info && info.hasOwnProperty("batteries")) {
        // With Batteries
        if (info.batteries.length > 0 && info.batteries[0].hasOwnProperty("serialnumber") && info.batteries[0].hasOwnProperty("type")) {
            var battery = info.batteries[0];
            // LiFePO
            if (battery.type == 0 || info.batteries_bms.length > 0) {
                // Select LiFePO
                $("#bx_battery_type_0").prop("checked", true).trigger("change");
                // Set Module SNs
                var tempArr = [];
                info.batteries.forEach(battery => { tempArr.push(battery.serialnumber); });
                $("#lifepo_serialnumbers").val(tempArr.join("\n"));
                // Set BMS SNs
                tempArr = [];
                info.batteries_bms.forEach(bms => { tempArr.push(bms.serialnumber); });
                $("#lifepo_bms").val(tempArr.join("\n"));
            }
            // Carbon
            else if (battery.type == 1) {
                // Select Carbon
                $("#bx_battery_type_1").prop("checked", true).trigger("change");
                // Set carbon batteries Info
                if (battery.hasOwnProperty("capacity")) $("#carbon_battery_capacity").val(`${(battery.capacity / 1000).toLocaleString(undefined, {maximumFractionDigits: 2})} kWh`).data("wh", battery.capacity);
                if (battery.hasOwnProperty("strings")) $("#carbon_battery_strings").val(battery.strings).trigger("change");
                if (battery.hasOwnProperty("model")) $("#carbon_battery_model").val(battery.model).trigger("change");
            }
            // Other
            else if (battery.type == 9) {
                // Select Other
                $("#bx_battery_type_9").prop("checked", true).trigger("change");
                // Set other batteries info
                if (battery.hasOwnProperty("capacity")) $("#other_battery_capacity").val(battery.capacity / 1000);
            }
        }
        // No Batteries
        else {
            // Select No Battery
            $("#bx_battery_type_n").prop("checked", true).trigger("change");
        }
    }

    // Set batteries serial numbers from local settings table (works only for some devices)
    if (settings && settings.hasOwnProperty("Inverter")) {
        // Set BMS Battery Serialnumbers based on connection status and counts
        const bmsSerialnumbers = [];
        const moduleSerialnumbers = [];
        // Check if Master is connected (1001: 0=NotConnected, 1=Connected)
        const masterConnected = settings["Inverter"]["1001"] && settings["Inverter"]["1001"]["s1"] == "1";
        const masterCount = masterConnected && settings["Inverter"]["1004"] ? parseInt(settings["Inverter"]["1004"]["s1"]) || 0 : 0;
        let slavesToCheck = [];
        if (masterConnected) {
            // Add Master serial number
            if (settings["Inverter"]["1002"] && settings["Inverter"]["1002"]["s1"]) {
                bmsSerialnumbers.push(settings["Inverter"]["1002"]["s1"]);
            }
            // Determine which slaves to check based on master count
            if (masterCount >= 1) slavesToCheck.push(1);
            if (masterCount >= 2) slavesToCheck.push(2);
            if (masterCount >= 3) slavesToCheck.push(3);
        } else {
            // Master not connected, check only Slave 1 (might be connected alone)
            slavesToCheck.push(1);
        }
        // Process each relevant slave
        slavesToCheck.forEach(slaveNum => {
            const modelId = slaveNum === 1 ? 1101 : (slaveNum === 2 ? 1201 : 1301);
            const serialId = slaveNum === 1 ? 1102 : (slaveNum === 2 ? 1202 : 1302);
            const countId = slaveNum === 1 ? 1104 : (slaveNum === 2 ? 1204 : 1304);
            const moduleBaseId = slaveNum === 1 ? 1110 : (slaveNum === 2 ? 1210 : 1310);
            // Check if slave is connected (model != 0)
            const slaveConnected = settings["Inverter"][modelId] && settings["Inverter"][modelId]["s1"] != "0";
            if (slaveConnected) {
                // Add slave serial number to BMS list
                if (settings["Inverter"][serialId] && settings["Inverter"][serialId]["s1"]) {
                    bmsSerialnumbers.push(settings["Inverter"][serialId]["s1"]);
                }
                // Get slave module count
                const slaveCount = settings["Inverter"][countId] ? parseInt(settings["Inverter"][countId]["s1"]) || 0 : 0;
                // Add module serial numbers based on count (up to 10 modules)
                for (let i = 0; i < Math.min(slaveCount, 10); i++) {
                    const moduleId = moduleBaseId + i;
                    if (settings["Inverter"][moduleId] && settings["Inverter"][moduleId]["s1"]) {
                        moduleSerialnumbers.push(settings["Inverter"][moduleId]["s1"]);
                    }
                }
            }
        });
        // Populate fields if data exists
        if (bmsSerialnumbers.length > 0) {
            $("#lifepo_bms").val(bmsSerialnumbers.join("\n"));
            $("#lifepo_bms").attr("disabled", true);
        }
        if (moduleSerialnumbers.length > 0) {
            $("#lifepo_serialnumbers").val(moduleSerialnumbers.join("\n"));
            $("#lifepo_serialnumbers").attr("disabled", true);
        }
    }

    // Set battery parameters for "Other" batteries
    if (settings && settings.hasOwnProperty("Inverter")) {
        if (settings["Inverter"].hasOwnProperty("417")) $("#other_battery_maxChargingCurrent      ").val(parseInt(settings["Inverter"]["417"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("418")) $("#other_battery_maxDischargingCurrent   ").val(parseInt(settings["Inverter"]["418"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("415")) $("#other_battery_bulkChargingVoltage     ").val(parseInt(settings["Inverter"]["415"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("416")) $("#other_battery_floatChargingVoltage    ").val(parseInt(settings["Inverter"]["416"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("411")) $("#other_battery_cutoffVoltageHybrid     ").val(parseInt(settings["Inverter"]["411"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("413")) $("#other_battery_redischargeVoltageHybrid").val(parseInt(settings["Inverter"]["413"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("412")) $("#other_battery_cutoffVoltage           ").val(parseInt(settings["Inverter"]["412"]["s1"]) / 100);
        if (settings["Inverter"].hasOwnProperty("414")) $("#other_battery_redischargeVoltage      ").val(parseInt(settings["Inverter"]["414"]["s1"]) / 100);
    }

}

function showBatterySection() {
    $("#battery").removeClass("d-none");
    updateSectionButton("battery");
    return true;
}





// MARK: Show Solar



$("#batterx_strings_config_label").on("click", () => {
    $(`#batterx_strings_config_label`).addClass("d-none");
    $(`#pv_string_1`).removeClass("d-none");
    $(`#batterx_add_string`).removeClass("d-none");
});

$("#ext_strings_config_label").on("click", () => {
    $(`#ext_strings_config_label`).addClass("d-none");
    $(`#pv_string_101`).removeClass("d-none");
    $(`#ext_add_string`).removeClass("d-none");
});



$("#batterx_add_string").on("click", () => {
    for (const entity of batterxStringEntities) {
        if ($(`#pv_string_${entity}`).hasClass("d-none")) {
            $(`#pv_string_${entity}`).removeClass("d-none");
            if (entity == batterxStringEntities[batterxStringEntities.length - 1]) {
                $(`#batterx_add_string`).addClass("d-none");
            }
            return;
        }
    }
});

$("#ext_add_string").on("click", () => {
    for (const entity of externalStringEntities) {
        if ($(`#pv_string_${entity}`).hasClass("d-none")) {
            $(`#pv_string_${entity}`).removeClass("d-none");
            if (entity == externalStringEntities[externalStringEntities.length - 1]) {
                $(`#ext_add_string`).addClass("d-none");
            }
            return;
        }
    }
});



function updateFeedinKwp() {
    const internal = parseFloat($("#solar_wattpeak"    ).val()) || 0;
    const external = parseFloat($("#solar_wattpeak_ext").val()) || 0;
    const pct      = parseFloat($("#solar_feedinlimitation").val()) || 0;
    const kwp      = (internal + external) * pct / 100;
    if (kwp > 0) {
        $("#solar_feedinlimitation_kw").val(`${kwp.toLocaleString(undefined, {maximumFractionDigits: 2})} kW`);
    } else {
        $("#solar_feedinlimitation_kw").val("");
    }
}

$("#solar_wattpeak, #solar_wattpeak_ext, #solar_feedinlimitation").on("input", updateFeedinKwp);



function showExtSolarSection() {
    $("#batterx_col").removeClass("col-md-8").addClass("col-md-6");
    $("#ext_col").removeClass("col-md-4").addClass("col-md-6");
    $("#ext_solar_placeholder").addClass("d-none");
    $("#ext_solar_content").removeClass("d-none");
    updateSectionButton("solar");
}

$("#ext_solar_add_btn").on("click", showExtSolarSection);



function populateSolarString(entity, data) {
    const hasData = data && parseInt(data["v1"]);
    $(`#pv_string_${entity}_power`      ).val(hasData ? data["v1"] / 1000 : "");
    $(`#pv_string_${entity}_declination`).val(hasData && data["v2"] ? data["v2"] : "");
    $(`#pv_string_${entity}_orientation`).val(hasData && data["v3"] ? data["v3"] : "");
    $(`#pv_string_${entity}`).toggleClass("d-none", !hasData);
}



function showSolarData(info, settings) {

    // Set solar info from cloud (if available)
    if (info) {
        if (info.hasOwnProperty("device")) {
            if (info.device.hasOwnProperty("solar_watt_peak")) {
                $("#solar_wattpeak").val(info.device.solar_watt_peak / 1000);
            }
            if (info.device.hasOwnProperty("solar_watt_peak_ext") && info.device.solar_watt_peak_ext > 0) {
                $("#solar_wattpeak_ext").val(info.device.solar_watt_peak_ext / 1000);
                showExtSolarSection();
            }
            if (info.device.hasOwnProperty("grid_feedin_limitation") && !isVde4105) { // for VDE4105 we leave empty
                $("#solar_feedinlimitation").val(info.device.grid_feedin_limitation);
            }
        }
        if (info.hasOwnProperty("solar_info")) {
            $("#solar_info").val(info.solar_info);
        }
    }

    // Set PV string configuration
    if (settings && settings["ForecastSolar"]) {
        const forecastSolar = settings["ForecastSolar"];
        // Show for batterX inverter
        var batterxVisibleCount = 0;
        batterxStringEntities.forEach(entity => {
            const entityStr = entity.toString();
            populateSolarString(entityStr, forecastSolar.hasOwnProperty(entityStr) ? forecastSolar[entityStr] : null);
            if (forecastSolar.hasOwnProperty(entityStr) && parseInt(forecastSolar[entityStr]["v1"])) batterxVisibleCount += 1;
        });
        $("#batterx_strings_config_label").toggleClass("d-none", batterxVisibleCount > 0);
        $("#batterx_add_string").toggleClass("d-none", batterxVisibleCount == 0 || batterxVisibleCount == batterxStringEntities.length);
        // Show for external solar inverter
        var externalVisibleCount = 0;
        externalStringEntities.forEach(entity => {
            const entityStr = entity.toString();
            populateSolarString(entityStr, forecastSolar.hasOwnProperty(entityStr) ? forecastSolar[entityStr] : null);
            if (forecastSolar.hasOwnProperty(entityStr) && parseInt(forecastSolar[entityStr]["v1"])) externalVisibleCount += 1;
        });
        $("#ext_strings_config_label").toggleClass("d-none", externalVisibleCount > 0);
        $("#ext_add_string").toggleClass("d-none", externalVisibleCount == 0 || externalVisibleCount == externalStringEntities.length);
        // Auto-reveal external solar section if data exists
        const extWattpeak = parseFloat($("#solar_wattpeak_ext").val()) || 0;
        if (extWattpeak > 0) showExtSolarSection();
    }

    // Set E-Meter injection regulation
    if (settings && settings.hasOwnProperty("InjectionMode")) {
        $("#regulation_check").prop("checked", settings["InjectionMode"]["0"]["v5"] != 0);
    }

    // Set external solar meter connected
    if (settings && settings.hasOwnProperty("ModbusExtSolarDevice")) {
        $("#extsol_check").prop("checked", settings["ModbusExtSolarDevice"]["0"]["mode"] != 0);
        if (settings["ModbusExtSolarDevice"]["0"]["mode"] != "0") showExtSolarSection();
    }

    // Set E-Meter phase connection (for single phase inverters)
    if (isSinglePhase) {
        $("#box_emeter_phase").removeClass("d-none");
        if (settings && settings.hasOwnProperty("InjectionMode")) {
            if (settings["InjectionMode"]["0"]["v6"] != 0) {
                $("#bx_emeter_phase").val(settings["InjectionMode"]["0"]["v6"]);
            }
        }
    }

    // Show solar wide input range (for h10 with correct firmware)
    if (hasSolarWideInputRange) {
        $("#solar_wideinputrange_container").removeClass("d-none");
    }

    // Update feed-in kWp display
    updateFeedinKwp();

}

function showSolarSection() {
    $("#solar").removeClass("d-none");
    updateSectionButton("solar");
    return true;
}





// MARK: Show SteuVE



function showSteuVE(info, settings) {

    // Show only for VDE4105
    if (!isVde4105) return;

    // Set SteuVE (Controllable Load)
    if (settings) {
        if (settings.hasOwnProperty("ControlMaxChargingPowerAC")) {
            $("#controlMaxChargingPowerAC_check").prop("checked", settings["ControlMaxChargingPowerAC"]["0"]["mode"] != "0");
        }
        if (settings.hasOwnProperty("ControlMaxInjectionPower")) {
            $("#controlMaxInjectionPower_check").prop("checked", settings["ControlMaxInjectionPower"]["0"]["mode"] != "0");
        }
    }

}

function showSteuVESection() {
    if (!isVde4105) return;
    $("#steuve").removeClass("d-none");
    updateSectionButton("steuve");
    return true;
}





// MARK: Show Reactive



$("#reactive_mode").on("change", function() {
    $(`#reactive_mode1, #reactive_mode2, #reactive_mode3, #reactive_mode4`).addClass("d-none");
    if (this.value) $(`#reactive_mode${this.value}`).removeClass("d-none");
});

$("#reactive_mode1_kink").on("change", function() {
    $("#svg_reactive_mode1_kink_value").text(parseInt($("#reactive_mode1_kink").val()) / 100);
});

$("#reactive_mode3_v1, #reactive_mode3_v2, #reactive_mode3_v3, #reactive_mode3_v4").on("change input", function() {
    $("#svg_reactive_mode3_v1_value").text(($("#reactive_mode3_v1").val() == "" ? $("#reactive_mode3_v1").attr("placeholder") : $("#reactive_mode3_v1").val()) + "%");
    $("#svg_reactive_mode3_v2_value").text(($("#reactive_mode3_v2").val() == "" ? $("#reactive_mode3_v2").attr("placeholder") : $("#reactive_mode3_v2").val()) + "%");
    $("#svg_reactive_mode3_v3_value").text(($("#reactive_mode3_v3").val() == "" ? $("#reactive_mode3_v3").attr("placeholder") : $("#reactive_mode3_v3").val()) + "%");
    $("#svg_reactive_mode3_v4_value").text(($("#reactive_mode3_v4").val() == "" ? $("#reactive_mode3_v4").attr("placeholder") : $("#reactive_mode3_v4").val()) + "%");
});

$("#reactive_mode, #reactive_mode1_kink, #reactive_mode3_v1, #reactive_mode3_v2, #reactive_mode3_v3, #reactive_mode3_v4").trigger("change");



$(".tor-extended-param").on("change", function() {
    const $field = $(this);
    const value = parseFloat($field.val());        // user-entered value
    const min   = parseFloat($field.attr("min"));  // allowed minimum
    const max   = parseFloat($field.attr("max"));  // allowed maximum
    const step  = parseFloat($field.attr("step")); // step increment
    if (isNaN(value) || isNaN(min) || isNaN(max) || isNaN(step) || step <= 0) return;
    const steps   = Math.round((Math.min(Math.max(value, min), max) - min) / step); // nearest step count from min (after clamping to range)
    const clamped = Math.min(Math.max(min + steps * step, min), max);               // snap to step, re-clamp to handle float drift
    const display = clamped.toFixed(3).replace(/\.?0+$/, "");                       // format to 3 decimals, strip trailing zeros
    if (display !== $field.val()) $field.val(display);                              // update only if the displayed value actually changed
});



function showReactive(info, settings) {

    // Show only for VDE4105/TOR/Estonia
    if (!isVde4105 && !isTor && !isEstonia) return;

    // Set extended parameters
    if (settings && settings.hasOwnProperty("Inverter")) {
        var temp = settings["Inverter"];
        // For VDE4105/TOR/Estonia
        if (temp.hasOwnProperty("342")) $("#extended_lfsmoThreshold").val(temp["342"].s1);
        if (temp.hasOwnProperty("349")) $("#extended_lfsmoDroop    ").val(temp["349"].s1);
        if (temp.hasOwnProperty("350")) $("#extended_lfsmoSlope    ").val(parseInt(temp["350"].s1) / 100);
        // For TOR
        if (isTor && isAlreadyRegistered) {
            if (temp.hasOwnProperty("212")) $("#extended_maxGridVoltage    ").val(parseInt(temp["212"].s1) / 100);
            if (temp.hasOwnProperty("211")) $("#extended_minGridVoltage    ").val(parseInt(temp["211"].s1) / 100);
            if (temp.hasOwnProperty("214")) $("#extended_maxGridFrequency  ").val(parseInt(temp["214"].s1) / 100);
            if (temp.hasOwnProperty("213")) $("#extended_minGridFrequency  ").val(parseInt(temp["213"].s1) / 100);
            if (temp.hasOwnProperty("232")) $("#extended_UeffOver1         ").val(parseInt(temp["232"].s1) / 100);
            if (temp.hasOwnProperty("231")) $("#extended_UeffUnder1        ").val(parseInt(temp["231"].s1) / 100);
            if (temp.hasOwnProperty("240")) $("#extended_UeffOver2         ").val(parseInt(temp["240"].s1) / 100);
            if (temp.hasOwnProperty("239")) $("#extended_UeffUnder2        ").val(parseInt(temp["239"].s1) / 100);
            if (temp.hasOwnProperty("234")) $("#extended_fOver1            ").val(parseInt(temp["234"].s1) / 100);
            if (temp.hasOwnProperty("233")) $("#extended_fUnder1           ").val(parseInt(temp["233"].s1) / 100);
            if (temp.hasOwnProperty("236")) $("#extended_UeffOver1Time     ").val(parseInt(temp["236"].s1) / 1000);
            if (temp.hasOwnProperty("235")) $("#extended_UeffUnder1Time    ").val(parseInt(temp["235"].s1) / 1000);
            if (temp.hasOwnProperty("244")) $("#extended_UeffOver2Time     ").val(parseInt(temp["244"].s1) / 1000);
            if (temp.hasOwnProperty("243")) $("#extended_UeffUnder2Time    ").val(parseInt(temp["243"].s1) / 1000);
            if (temp.hasOwnProperty("238")) $("#extended_fOver1Time        ").val(parseInt(temp["238"].s1) / 1000);
            if (temp.hasOwnProperty("237")) $("#extended_fUnder1Time       ").val(parseInt(temp["237"].s1) / 1000);
            if (temp.hasOwnProperty("205")) $("#extended_Ueff              ").val(parseInt(temp["205"].s1) / 100);
            if (temp.hasOwnProperty("215")) $("#extended_gridConnectDelay  ").val(parseInt(temp["215"].s1));
            if (temp.hasOwnProperty("225")) $("#extended_gridReconnectDelay").val(parseInt(temp["225"].s1));
            if (temp.hasOwnProperty("336")) $("#extended_puTime            ").val(parseInt(temp["336"].s1) / 1000);
        }
    }

}

function showReactiveSection() {
    if (!isVde4105 && !isTor && !isEstonia) return;
    $("#reactive").removeClass("d-none");
    updateSectionButton("reactive");
    return true;
}





// MARK: Show Other



function updateUserMeterCount() {
    const count = ["#meter1_mode", "#meter2_mode", "#meter3_mode", "#meter4_mode"]
        .filter(id => parseInt($(id).val()) > 0).length;
    const connected = count > 0;
    const label = connected ? t("ss_other_count", { count }) : t("ss_other_none");
    $("#userMeterCount")
        .text(`(${label})`)
        .toggleClass("text-muted", !connected)
        .toggleClass("text-success fw-bold", connected);
}

$("#meter1_mode, #meter2_mode, #meter3_mode, #meter4_mode").on("change", updateUserMeterCount);



function updateWallboxCount() {
    const connected = parseInt($("#evcProducer").val()) > 0;
    $("#wallboxCount")
        .text(`(${t(connected ? "ss_other_connected" : "ss_other_none")})`)
        .toggleClass("text-muted", !connected)
        .toggleClass("text-success fw-bold", connected);
}

$("#evcProducer").on("change", function() {
    const mode = parseInt($(this).val());
    const hasProducer = mode > 0;
    $("#evcNetworkCard"   ).toggleClass("d-none", !hasProducer);
    $("#evcElectricalCard").toggleClass("d-none", !hasProducer);
    const url = EVC_PRODUCER_URLS[mode];
    if (url) {
        $("#evcProducerInfoLink").attr("href", url);
        $("#evcProducerInfoRow").removeClass("d-none");
    } else {
        $("#evcProducerInfoRow").addClass("d-none");
    }
    updateWallboxCount();
});

$("#evcMinCurrent").on("change", function() {
    if (parseInt($("#evcMaxCurrent").val()) < parseInt($(this).val())) {
        $("#evcMaxCurrent").val($(this).val());
    }
});
$("#evcMaxCurrent").on("change", function() {
    if (parseInt($("#evcMinCurrent").val()) > parseInt($(this).val())) {
        $("#evcMinCurrent").val($(this).val());
    }
});



function updateEvcVerifyButton() {
    const hasIp   = $("#evcIp"  ).val().trim() !== "";
    const hasPort = $("#evcPort").val().trim() !== "";
    $("#btnEvcVerify").prop("disabled", !(hasIp && hasPort));
}

$("#evcIp, #evcPort").on("input", () => {
    $("#evcVerifyResult").empty();
    updateEvcVerifyButton();
});

$("#btnEvcVerify").on("click", async () => {
    const $btn    = $("#btnEvcVerify");
    const $result = $("#evcVerifyResult");
    const originalText = $btn.text();

    $btn.prop("disabled", true).html(`&nbsp;<span class="spinner-border spinner-border-sm" role="status"></span>&nbsp;`);
    $result.empty();
    await sleep(1000); // to make sure that the user sees that it's loading

    try {
        const response = await $.post("cmd/evc_ping.php", {
            ip:   $("#evcIp"  ).val().trim(),
            port: $("#evcPort").val().trim()
        });
        if (response === "1") {
            $result.html(`<i class="bi bi-check-circle-fill text-success me-2" title="${t("ss_evc_verify_success")}"></i>`);
        } else {
            $result.html(`<i class="bi bi-x-circle-fill text-danger me-2" title="${t("ss_evc_verify_failed")}"></i>`);
        }
    } catch (e) {
        $result.html(`<i class="bi bi-x-circle-fill text-danger me-2" title="${t("ss_evc_verify_failed")}"></i>`);
    } finally {
        $btn.text(originalText);
        updateEvcVerifyButton();
    }
});



function showOther(info, settings) {

    // Set user meters data
    if (settings && settings.hasOwnProperty("UserMeter")) {
        if (settings["UserMeter"].hasOwnProperty("1")) {
            $("#meter1_mode ").val(settings["UserMeter"]["1"]["mode"]);
            $("#meter1_label").val(settings["UserMeter"]["1"]["s1"  ]);
        }
        if (settings["UserMeter"].hasOwnProperty("2")) {
            $("#meter2_mode ").val(settings["UserMeter"]["2"]["mode"]);
            $("#meter2_label").val(settings["UserMeter"]["2"]["s1"  ]);
        }
        if (settings["UserMeter"].hasOwnProperty("3")) {
            $("#meter3_mode ").val(settings["UserMeter"]["3"]["mode"]);
            $("#meter3_label").val(settings["UserMeter"]["3"]["s1"  ]);
        }
        if (settings["UserMeter"].hasOwnProperty("4")) {
            $("#meter4_mode ").val(settings["UserMeter"]["4"]["mode"]);
            $("#meter4_label").val(settings["UserMeter"]["4"]["s1"  ]);
        }
    }
    updateUserMeterCount();

    // Set wallbox (EVC) data
    const hasEvcBase       = settings && settings.hasOwnProperty("EVCharger"      ) && settings["EVCharger"      ].hasOwnProperty("1");
    const hasEvcModbus     = settings && settings.hasOwnProperty("EVChargerModbus") && settings["EVChargerModbus"].hasOwnProperty("1");
    const evcMode          = hasEvcBase ? parseInt(settings["EVCharger"]["1"]["mode"] || 0) : 0;
    const evcProducerText  = hasEvcBase ? (settings["EVCharger"]["1"]["s2"] || "")         : "";
    $("#evcTitle").val(hasEvcBase ? (settings["EVCharger"]["1"]["s1"] || "") : "");

    // Match #evcProducer option by value+text; append dynamic option if unknown
    $("#evcProducer option[data-dynamic]").remove();
    let evcFound = false;
    $("#evcProducer option").each(function() {
        if(parseInt($(this).val()) === evcMode && $(this).text().trim() === evcProducerText.trim()) {
            $(this).prop("selected", true);
            evcFound = true;
            return false;
        }
    });
    if(!evcFound && evcMode > 0) {
        const label = evcProducerText || String(evcMode);
        $("#evcProducer").append(`<option value="${evcMode}" data-dynamic="1" selected>${label}</option>`);
    } else if(!evcFound) {
        $("#evcProducer").val("0");
    }
    $("#evcProducer").trigger("change");

    if (hasEvcModbus) {
        $("#evcIp"  ).val(settings["EVChargerModbus"]["1"]["s1"] || "");
        $("#evcPort").val(parseInt(settings["EVChargerModbus"]["1"]["v1"]) || 502);
    }
    if (hasEvcBase) {
        const b = settings["EVCharger"]["1"];
        $("#evcWiring"    ).val(parseInt(b["v3"] || 0));
        $("#evcPhaseMode" ).val(parseInt(b["v4"] || 0));
        $("#evcMinCurrent").val(Math.round(parseInt(b["v1"] || 600 ) / 100));
        $("#evcMaxCurrent").val(Math.round(parseInt(b["v2"] || 1600) / 100));
    }
    updateWallboxCount();
    updateEvcVerifyButton();

}

function showOtherSection() {
    $("#other").removeClass("d-none");
    updateSectionButton("other");
    return true;
}





// MARK: Section Navigation



// Validators for sections that require input before continuing.
// Return true = valid (button enabled). Sections without an entry are always enabled.

const sectionValidators = {};

function updateSectionButton(section) {
    const validator = sectionValidators[section];
    $(`#btn_${section}_next`).prop("disabled", validator ? !validator() : false);
}



// System Section — no Continue button, but used for validation

sectionValidators["system"] = () => {
    if ($("#bx_gridfuseamps").val() === "") return;
    return true;
};



// Battery Section

$("#btn_battery_next").on("click", function() {
    $(this).addClass("d-none");
    showSolarSection();
    $("#btn_solar_next").removeClass("d-none");
    $("#solar")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});

sectionValidators["battery"] = () => {
    const type = $("input[name=bx_battery_type]:checked").val();
    if (type === "") {  // No Battery — nothing to fill
        return true;
    }
    if (type === "0") { // LiFePO
        if ($("#lifepo_bms_section").is(":visible") && $("#lifepo_bms").val().trim() === "") return;
        if ($("#lifepo_serialnumbers").val().trim() === "") return;
        return true;
    }
    if (type === "1") { // Carbon — selects always have a value
        return true;
    }
    if (type === "9") { // Other — all voltage/current fields required
        if ($("#other_battery_capacity"                ).val() === "") return;
        if ($("#other_battery_maxChargingCurrent"      ).val() === "") return;
        if ($("#other_battery_maxDischargingCurrent"   ).val() === "") return;
        if ($("#other_battery_bulkChargingVoltage"     ).val() === "") return;
        if ($("#other_battery_floatChargingVoltage"    ).val() === "") return;
        if ($("#other_battery_cutoffVoltageHybrid"     ).val() === "") return;
        if ($("#other_battery_redischargeVoltageHybrid").val() === "") return;
        if ($("#other_battery_cutoffVoltage"           ).val() === "") return;
        if ($("#other_battery_redischargeVoltage"      ).val() === "") return;
        return true;
    }
};

$("input[name=bx_battery_type]").on("change", () => updateSectionButton("battery"));
$("#lifepo_bms, #lifepo_serialnumbers").on("input", () => updateSectionButton("battery"));
$("#other_battery_capacity, #other_battery_maxChargingCurrent, #other_battery_maxDischargingCurrent, #other_battery_bulkChargingVoltage, #other_battery_floatChargingVoltage, #other_battery_cutoffVoltageHybrid, #other_battery_redischargeVoltageHybrid, #other_battery_cutoffVoltage, #other_battery_redischargeVoltage").on("input", () => updateSectionButton("battery"));



// Solar Section

$("#btn_solar_next").on("click", function() {
    $(this).addClass("d-none");
    if (showSteuVESection()) {
        $("#btn_steuve_next").removeClass("d-none");
        $("#steuve")[0].scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    if (showReactiveSection()) {
        $("#btn_reactive_next").removeClass("d-none");
        $("#reactive")[0].scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    showOtherSection();
    $("#btn_next").removeClass("d-none");
    $("#other")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});

sectionValidators["solar"] = () => {
    if ($("#solar_wattpeak").val() === "") return;
    if ($("#solar_feedinlimitation").val() === "") return;
    if (!$("#ext_solar_content").hasClass("d-none") && $("#solar_wattpeak_ext").val() === "") return;
    return true;
};

$("#solar_wattpeak, #solar_feedinlimitation, #solar_wattpeak_ext").on("input change", () => updateSectionButton("solar"));



// SteuVE Section

$("#btn_steuve_next").on("click", function() {
    $(this).addClass("d-none");
    if (showReactiveSection()) {
        $("#btn_reactive_next").removeClass("d-none");
        $("#reactive")[0].scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
    showOtherSection();
    $("#btn_next").removeClass("d-none");
    $("#other")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});

sectionValidators["steuve"] = () => {
    return true;
};



// Reactive Section

$("#btn_reactive_next").on("click", function() {
    $(this).addClass("d-none");
    showOtherSection();
    $("#btn_next").removeClass("d-none");
    $("#other")[0].scrollIntoView({ behavior: "smooth", block: "start" });
});

sectionValidators["reactive"] = () => {
    const mode = $("#reactive_mode").val();
    if (mode === "") {
        return;
    }
    if (mode === "3") {
        if ($("#reactive_mode3_v1"    ).val() === "") return;
        if ($("#reactive_mode3_v2"    ).val() === "") return;
        if ($("#reactive_mode3_v3"    ).val() === "") return;
        if ($("#reactive_mode3_v4"    ).val() === "") return;
        if ($("#reactive_mode3_qutime").val() === "") return;
    }
    if (mode === "4") {
        if ($("#reactive_mode4_qfix").val() === "") return;
    }
    if (isTor) {
        const torParams = $(".tor-extended-param");
        for (let i = 0; i < torParams.length; i++) {
            if ($(torParams[i]).val() === "") return;
        }
    }
    if (!hasLfsmoDroop && $("#extended_lfsmoSlope").val() === "") return;
    return true;
};

$("#reactive_mode").on("change", () => updateSectionButton("reactive"));
$("#reactive_mode3_v1, #reactive_mode3_v2, #reactive_mode3_v3, #reactive_mode3_v4, #reactive_mode3_qutime").on("input", () => updateSectionButton("reactive"));
$("#reactive_mode4_qfix").on("input", () => updateSectionButton("reactive"));
$(".tor-extended-param, #extended_lfsmoSlope").on("input", () => updateSectionButton("reactive"));
$("#modalExtendedParameters").on("hidden.bs.modal", () => updateSectionButton("reactive"));



// Other Section

sectionValidators["other"] = () => {
    return true;
};




















// MARK: Pre-Setup Confirm



function allFieldsCorrect() {
    if (sectionValidators["system" ]() !== true) {
        return false;
    }
    if (sectionValidators["battery"]() !== true) {
        return false;
    }
    if (sectionValidators["solar"]() !== true) {
        return false;
    }
    if (sectionValidators["steuve"]() !== true) {
        if (isVde4105) {
            return false;
        }
    }
    if (sectionValidators["reactive"]() !== true) {
        if (isVde4105 || isTor || isEstonia) {
            return false;
        }
    }
    if (sectionValidators["other"]() !== true) {
        return false;
    }
    return true;
}



async function mainFormSubmit() {

    // ── Return if empty fields ──
    if (!allFieldsCorrect()) return;

    // ── Verify Battery Modules ──
    if (isLiFePO()) {
        // Get system serial number
        var system_serial = (isClix || isOldSys()) ? $("#bx_system").val().trim() : "NEW";
        // Get batteries/bms serial numbers
        var batteries = [];
        var bms       = [];
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if (sn.trim() != "") batteries.push(sn.trim());
        });
        $("#lifepo_bms").val().trim().split("\n").forEach(sn => {
            if (sn.trim() != "") bms.push(sn.trim());
        });
        // Verify serial numbers
        $("#btn_next").prop("disabled", true); // Disable button
        try {
            // Verify Batteries
            for(const sn of batteries) {
                const response = await $.post({
                    url: "https://api.batterx.app/v2/install.php",
                    data: {
                        action: "verify_battery",
                        system: system_serial,
                        serialnumber: sn.trim()
                    }
                });
                if (response !== "1") {
                    $("#errorBatterySerial").val(sn.trim());
                    $("#errorBatteryNotExistOrWithOtherSystem").modal("show");
                    return;
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
                if (response !== "1") {
                    $("#errorBmsSerial").val(sn.trim());
                    $("#errorBmsNotExistOrWithOtherSystem").modal("show");
                    return;
                }
            }
        } catch (error) {
            alert("E015. Please refresh the page! (Error while verifying battery serialnumber in cloud)");
            return;
        } finally {
            $("#btn_next").prop("disabled", false); // Enable button
        }
    }

    // ── TOR: clamp values, show summary — Confirm proceeds, Modify re-opens edit modal ──
    if (isTor) {
        $(".tor-extended-param").trigger("change");
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
        const torAction = await new Promise(resolve => {
            const $m = $("#modalConfirmExtendedParameters");
            $m.off("click.tor hidden.bs.modal.tor")
              .one("click.tor", "button.confirm", () => { $m.modal("hide"); resolve("confirm"); })
              .one("click.tor", "button.modify",  () => { $m.modal("hide"); resolve("modify");  })
              .one("hidden.bs.modal.tor",         () => { resolve("dismiss"); })
              .modal("show");
        });
        if (torAction === "modify") {
            $("#modalExtendedParameters").modal("show");
            return;
        } else if (torAction !== "confirm") {
            return;
        }
    }

    // ── liveX: non-standard battery type requires confirmation ──
    if (boxType == "livex" && isOther() && $("#other_battery_capacity").val() != "0") {
        const confirmed = await new Promise(resolve => {
            const $m = $("#modalConfirmOtherBatteries");
            $m.off("click.bat hidden.bs.modal.bat")
              .one("click.bat", "button", () => { $m.modal("hide"); resolve(true); })
              .one("hidden.bs.modal.bat", () => { resolve(false); })
              .modal("show");
        });
        if (!confirmed) return;
    }

    // ── cliX v2: UPS or Backup mode requires confirmation ──
    if (boxType == "livex" && isClixV2) {
        if (isUPS()) {
            const confirmed = await new Promise(resolve => {
                const $m = $("#modalConfirmUpsMode");
                $m.off("click.ups hidden.bs.modal.ups")
                .one("click.ups", "button", () => { $m.modal("hide"); resolve(true);  })
                .one("hidden.bs.modal.ups", () => { resolve(false); })
                .modal("show");
            });
            if (!confirmed) return;
        } else if (isBackup()) {
            const confirmed = await new Promise(resolve => {
                const $m = $("#modalConfirmBackupMode");
                $m.off("click.bkp hidden.bs.modal.bkp")
                .one("click.bkp", "button", () => { $m.modal("hide"); resolve(true);  })
                .one("hidden.bs.modal.bkp", () => { resolve(false); })
                .modal("show");
            });
            if (!confirmed) return;
        }
    }

    // ── Solar regulation: confirm when feed-in is limited below 100% ──
    if ($("#regulation_check").is(":checked") && parseInt($("#solar_feedinlimitation").val()) < 100) {
        $("#modalConfirmInternalSolar .message").html(t("ss_internalsolar_message", { percent: `<b>${Math.round(100 - parseInt($("#solar_feedinlimitation").val()))}</b>` }));
        const confirmed = await new Promise(resolve => {
            const $m = $("#modalConfirmInternalSolar");
            $m.off("click.sol hidden.bs.modal.sol")
              .one("click.sol", "button", () => { $m.modal("hide"); resolve(true);  })
              .one("hidden.bs.modal.sol", () => { resolve(false); })
              .modal("show");
        });
        if (!confirmed) return;
    }

    // ── Confirm solar watt peak (if under 1 kWp) ──
    if (parseFloat($("#solar_wattpeak").val()) < 1) {
        const confirmed = await _confirm(`${t("ss_solar_size_very_low")}\n\n${t("ss_solar_size_very_low_confirm", { kwp: $("#solar_wattpeak").val() })}`);
        if (!confirmed) return;
    }

    //  ── Show Loading Modal ──
    isSettingParameters = true;
    $("#settingParamsError").addClass("d-none").text("");
    $("#modalSettingParameters").modal("show");
    $("#setupProgress").text("Setup begin...");
    await sleep(1000);

    // Continue
    updateSession();

}





// MARK: Update Session



async function updateSession() {


    // Define Object

    var tempData = {};


    // Common Parameters

    tempData.system_serial     = (isClix || isOldSys()) ? $("#bx_system").val().trim() : "NEW";
    tempData.solar_info        = $("#solar_info      ").val().trim();
    tempData.note              = $("#installer_memo  ").val().trim();
    tempData.installation_date = installationDate;


    // Reactive Power Mode

    reactive_mode   = Math.round($("#reactive_mode").val());
    reactive_kink   = "";
    reactive_cosphi = "";
    reactive_qmaxsn = "";
    reactive_v1     = "";
    reactive_v2     = "";
    reactive_v3     = "";
    reactive_v4     = "";
    reactive_qutime = "";
    reactive_qfix   = "";

    if (reactive_mode == "1") {
        reactive_kink = Math.round($("#reactive_mode1_kink").val());
    } else if (reactive_mode == "2") {
        reactive_cosphi = Math.round($("#reactive_mode2_cosphi").val());
        if ($("#reactive_mode2_cosphi_sign").val() == "1" && reactive_cosphi != 100) reactive_cosphi = -reactive_cosphi;
    } else if (reactive_mode == "3") {
        reactive_qmaxsn = parseFloat($("#reactive_mode3_qmaxsn").val());
        reactive_v1 = Math.round($("#reactive_mode3_v1").val());
        reactive_v2 = Math.round($("#reactive_mode3_v2").val());
        reactive_v3 = Math.round($("#reactive_mode3_v3").val());
        reactive_v4 = Math.round($("#reactive_mode3_v4").val());
        reactive_qutime = Math.round($("#reactive_mode3_qutime").val());
        if (reactive_qutime < 3) reactive_qutime = 3;
        if (reactive_qutime > 60) reactive_qutime = 60;
    } else if (reactive_mode == "4") {
        reactive_qfix = Math.round($("#reactive_mode4_qfix").val());
        if (reactive_qfix < -5000) reactive_qfix = -5000;
        if (reactive_qfix > 5000) reactive_qfix = 5000;
    }

    tempData.reactive_mode   = reactive_mode;
    tempData.reactive_kink   = reactive_kink;
    tempData.reactive_cosphi = reactive_cosphi;
    tempData.reactive_qmaxsn = reactive_qmaxsn;
    tempData.reactive_v1     = reactive_v1;
    tempData.reactive_v2     = reactive_v2;
    tempData.reactive_v3     = reactive_v3;
    tempData.reactive_v4     = reactive_v4;
    tempData.reactive_qutime = reactive_qutime;
    tempData.reactive_qfix   = reactive_qfix;


    // Extended Parameters (Optional)

    tempData.extended_lfsmoThreshold     = (elementExists("#extended_lfsmoThreshold"    ) && $("#extended_lfsmoThreshold    ").val() != "") ? $("#extended_lfsmoThreshold    ").val() : "";
    tempData.extended_lfsmoDroop         = (elementExists("#extended_lfsmoDroop"        ) && $("#extended_lfsmoDroop        ").val() != "") ? $("#extended_lfsmoDroop        ").val() : "";
    tempData.extended_lfsmoSlope         = (elementExists("#extended_lfsmoSlope"        ) && $("#extended_lfsmoSlope        ").val() != "") ? $("#extended_lfsmoSlope        ").val() : "";
    tempData.extended_maxGridVoltage     = (elementExists("#extended_maxGridVoltage"    ) && $("#extended_maxGridVoltage    ").val() != "") ? $("#extended_maxGridVoltage    ").val() : "";
    tempData.extended_minGridVoltage     = (elementExists("#extended_minGridVoltage"    ) && $("#extended_minGridVoltage    ").val() != "") ? $("#extended_minGridVoltage    ").val() : "";
    tempData.extended_maxGridFrequency   = (elementExists("#extended_maxGridFrequency"  ) && $("#extended_maxGridFrequency  ").val() != "") ? $("#extended_maxGridFrequency  ").val() : "";
    tempData.extended_minGridFrequency   = (elementExists("#extended_minGridFrequency"  ) && $("#extended_minGridFrequency  ").val() != "") ? $("#extended_minGridFrequency  ").val() : "";
    tempData.extended_UeffOver1          = (elementExists("#extended_UeffOver1"         ) && $("#extended_UeffOver1         ").val() != "") ? $("#extended_UeffOver1         ").val() : "";
    tempData.extended_UeffUnder1         = (elementExists("#extended_UeffUnder1"        ) && $("#extended_UeffUnder1        ").val() != "") ? $("#extended_UeffUnder1        ").val() : "";
    tempData.extended_UeffOver2          = (elementExists("#extended_UeffOver2"         ) && $("#extended_UeffOver2         ").val() != "") ? $("#extended_UeffOver2         ").val() : "";
    tempData.extended_UeffUnder2         = (elementExists("#extended_UeffUnder2"        ) && $("#extended_UeffUnder2        ").val() != "") ? $("#extended_UeffUnder2        ").val() : "";
    tempData.extended_fOver1             = (elementExists("#extended_fOver1"            ) && $("#extended_fOver1            ").val() != "") ? $("#extended_fOver1            ").val() : "";
    tempData.extended_fUnder1            = (elementExists("#extended_fUnder1"           ) && $("#extended_fUnder1           ").val() != "") ? $("#extended_fUnder1           ").val() : "";
    tempData.extended_UeffOver1Time      = (elementExists("#extended_UeffOver1Time"     ) && $("#extended_UeffOver1Time     ").val() != "") ? $("#extended_UeffOver1Time     ").val() : "";
    tempData.extended_UeffUnder1Time     = (elementExists("#extended_UeffUnder1Time"    ) && $("#extended_UeffUnder1Time    ").val() != "") ? $("#extended_UeffUnder1Time    ").val() : "";
    tempData.extended_UeffOver2Time      = (elementExists("#extended_UeffOver2Time"     ) && $("#extended_UeffOver2Time     ").val() != "") ? $("#extended_UeffOver2Time     ").val() : "";
    tempData.extended_UeffUnder2Time     = (elementExists("#extended_UeffUnder2Time"    ) && $("#extended_UeffUnder2Time    ").val() != "") ? $("#extended_UeffUnder2Time    ").val() : "";
    tempData.extended_fOver1Time         = (elementExists("#extended_fOver1Time"        ) && $("#extended_fOver1Time        ").val() != "") ? $("#extended_fOver1Time        ").val() : "";
    tempData.extended_fUnder1Time        = (elementExists("#extended_fUnder1Time"       ) && $("#extended_fUnder1Time       ").val() != "") ? $("#extended_fUnder1Time       ").val() : "";
    tempData.extended_Ueff               = (elementExists("#extended_Ueff"              ) && $("#extended_Ueff              ").val() != "") ? $("#extended_Ueff              ").val() : "";
    tempData.extended_gridConnectDelay   = (elementExists("#extended_gridConnectDelay"  ) && $("#extended_gridConnectDelay  ").val() != "") ? $("#extended_gridConnectDelay  ").val() : "";
    tempData.extended_gridReconnectDelay = (elementExists("#extended_gridReconnectDelay") && $("#extended_gridReconnectDelay").val() != "") ? $("#extended_gridReconnectDelay").val() : "";
    tempData.extended_puTime             = (elementExists("#extended_puTime"            ) && $("#extended_puTime            ").val() != "") ? $("#extended_puTime            ").val() : "";


    // Battery Parameters

    tempData.battery_type          = "";
    tempData.battery_capacity      = "";
    tempData.battery_model         = "";
    tempData.battery_strings       = "";
    tempData.battery_bms           = "";
    tempData.battery_serialnumbers = "";

    if (isLiFePO()) {
        tempData.battery_type = "lifepo";
        var bms       = [];
        var batteries = [];
        $("#lifepo_bms").val().trim().split("\n").forEach(sn => {
            if (sn.trim() != "") bms.push(sn.trim());
        });
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if (sn.trim() != "") batteries.push(sn.trim());
        });
        tempData.battery_bms = bms.join(",");
        tempData.battery_serialnumbers = batteries.join(",");

        // Battery capacity: sum capacities from cloud-resolved partnumbers (retry up to 3 times per battery, abort on persistent failure)
        $("#setupProgress").text("Reading battery capacity...");
        var totalCapacity = 0;
        for (const sn of batteries) {
            var pn = null;
            for (var attempt = 1; attempt <= 3; attempt++) {
                const [data, err] = await get_battery_partnumber(sn);
                if (!err && data) { pn = data; break; }
                if (attempt < 3) await sleep(2000);
            }
            if (!pn) return showSettingParametersError("E058. Could not resolve battery partnumber for S/N " + sn);
            if (!PNS_BATTERY.hasOwnProperty(pn) || !PNS_BATTERY[pn].capacity)
                return showSettingParametersError("E059. Unknown battery partnumber " + pn + " (S/N " + sn + ")");
            totalCapacity += parseInt(PNS_BATTERY[pn].capacity);
        }
        tempData.battery_capacity = totalCapacity;
    } else if (isCarbon()) { // only for h-Series
        tempData.battery_type     = "carbon";
        tempData.battery_capacity = $("#carbon_battery_capacity").data("wh");
        tempData.battery_model    = $("#carbon_battery_model   ").val();
        tempData.battery_strings  = $("#carbon_battery_strings ").val();
    } else if (isOther()) { // only for h-Series
        tempData.battery_type     = "other";
        tempData.battery_capacity = Math.round(parseFloat($("#other_battery_capacity").val()) * 1000);
    } else {
        // no battery
    }


    // System Model

    // Battery capacity in kWh (1 decimal) — used to name the system when LiFePO is installed
    var batteryCapacityKWh = tempData.battery_capacity ? Math.round(tempData.battery_capacity / 100) / 10 : 0;

    if (deviceModel == "batterx_h10") {
        if (isLiFePO()) {
            tempData.system_model = "batterX h10" + (systemType == "w" ? "W" : "R") + "-" + batteryCapacityKWh.toString().replace(".", ",");
        } else {
            tempData.system_model = "batterX h10";
        }
    } else if (deviceModel == "batterx_h5") {
        if (isLiFePO()) {
            tempData.system_model = "batterX h5" + (systemType == "w" ? "W" : "R") + "-" + batteryCapacityKWh.toString().replace(".", ",");
        } else {
            tempData.system_model = "batterX h5";
        }
    } else if (deviceModel == "batterx_i") {
        tempData.system_model = "batterX";
        var deviceName = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].name : "";
        if (deviceName != "") {
            tempData.system_model = batteryCapacityKWh > 0 ? `${deviceName} basic ${batteryCapacityKWh}kWh` : `${deviceName}`;
        }
    } else if (deviceModel == "batterx_c") {
        tempData.system_model = "batterX";
        var deviceName = PNS_DEVICE.hasOwnProperty(devicePartNumber) ? PNS_DEVICE[devicePartNumber].name : "";
        if (deviceName != "") {
            tempData.system_model = `${deviceName}`;
        }
    } else {
        tempData.system_model = "batterX";
    }


    // Add Values To Session

    $("#setupProgress").text("Saving session...");
    try {
        const response = await $.post({
            url: "cmd/session.php",
            data: tempData
        });
        console.log(response);
        if (response !== "1") return showSettingParametersError("E056. Please refresh the page! (Bad response while saving data to session)");
        // Start Setup
        checkParametersCounter = 0;
        if (skipSetup) {
            $("#settingParamsIcon").html('<i class="bi bi-check-circle-fill text-success lh-1" style="font-size:3rem;"></i>');
            $("#message").addClass("text-success").html(t("ss_setting_success"));
            $("#setupProgress").text(t("ss_redirecting"));
            await sleep(2500);
            window.location.href = "system_test.php";
        } else {
            beginSetup();
        }
    } catch (error) {
        showSettingParametersError("E057. Please refresh the page! (Error while saving data to session)");
    }
    

}




















// MARK: Setup





// MARK: Helpers



function showSettingParametersError(errorStr) {
    clearInterval(checkParametersInterval);
    checkParametersInterval = undefined;
    isSettingParameters = false;
    $("#modalSettingParameters").modal("hide");
    $("#settingParamsError").removeClass("d-none").text(errorStr);
    $("#btn_next").attr("disabled", false);
    $("html, body").scrollTop($(document).height());
}



async function waitForSettingsParameter(varName, entity, field, expectedValue, maxWaitTime = 30000) {
    const startTime = Date.now();
    while(Date.now() - startTime < maxWaitTime) {
        await sleep(5000); // Wait 5 seconds before checking again
        try {
            const response = await $.get({ url: "api.php?get=settings" });
            dataSettings = JSON.parse(JSON.stringify(response)); // Update dataSettings variable like we do everywhere else
            if (response?.[varName]?.[entity]?.[field] == expectedValue) return true;
        } catch (error) {
            console.log("Error checking settings:", error);
        }
    }
    return false; // Timeout reached
}



async function waitForProgramRestart() {
    await sleep(10000); // Wait for program to restart first
    let initialLogtime = null;
    const maxWaitTime = 300000; // 5 minutes
    const startTime = Date.now();
    while(Date.now() - startTime < maxWaitTime) {
        try {
            const response = await $.get({ url: "api.php?get=currentstate" });
            if (initialLogtime === null) {
                initialLogtime = response?.logtime ?? null;
            } else if (response?.logtime && response.logtime !== initialLogtime) {
                return true;
            }
        } catch (error) {
            console.log("Error checking currentstate:", error);
        }
        await sleep(5000);
    }
    return false;
}





// MARK: Begin Setup



async function beginSetup() {


    // Begin Setup
    isSettingParameters = true;
    $("#message").html(t("ss_setting_parameters")).css("color", "");


    // Set Grid InjectionPhase (single phase inverters)
    if (isSinglePhase) {
        const selectedPhase = $("#bx_emeter_phase").val();
        if (dataSettings?.["InjectionMode"]?.["0"]?.["v6"] != selectedPhase) {
            try {
                $("#setupProgress").text("Setting grid injection phase...");
                const response = await $.get({ url: "api.php?set=command&type=20736&entity=6&text2=" + selectedPhase });
                if (response !== "1") return showSettingParametersError("E017. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for grid injection phase confirmation...");
                const parameterSet = await waitForSettingsParameter("InjectionMode", "0", "v6", selectedPhase);
                if (!parameterSet) return showSettingParametersError("E018. Timeout waiting for Grid Injection Phase parameter to be applied. Please try again.");
            } catch (error) {
                return showSettingParametersError("E016. Please refresh the page! (Error while writing command to local database)");
            }
        }
    }


    // Set Grid MaxInjectionPower
    rawInjectionPower = Math.round(
        (parseFloat($("#solar_wattpeak").val() || 0) + parseFloat($("#solar_wattpeak_ext").val() || 0))
        * 1000 * parseInt($("#solar_feedinlimitation").val()) / 100
    );
    const maxGridFeedInPower = rawInjectionPower.toString();
    if (dataSettings?.["InjectionMode"]?.["0"]?.["v1"] != maxGridFeedInPower) {
        try {
            $("#setupProgress").text("Setting grid injection power...");
            const response = await $.get({ url: "api.php?set=command&type=20736&entity=1&text2=" + maxGridFeedInPower });
            if (response != "1") return showSettingParametersError("E019. Please refresh the page! (Bad response while writing command to local database)");
            // Wait for parameter to be confirmed in settings
            $("#setupProgress").text("Waiting for grid injection power confirmation...");
            const parameterSet = await waitForSettingsParameter("InjectionMode", "0", "v1", maxGridFeedInPower);
            if (!parameterSet) return showSettingParametersError("E020. Timeout waiting for Grid Max Injection Power parameter to be applied. Please try again.");
        } catch (error) {
            return showSettingParametersError("E029. Please refresh the page! (Error while writing command to local database)");
        }
    }


    // Set System Mode (cliX v2 only)
    if (isClixV2) {
        const newSystemMode = $("#bx_sysmode").val();
        if (dataSettings?.["SystemMode"]?.["0"]?.["mode"] != newSystemMode) {
            try {
                $("#setupProgress").text("Setting system mode...");
                const response = await $.get({ url: "api.php?set=command&type=20752&entity=0&text2=" + newSystemMode });
                if (response != "1") return showSettingParametersError("E030. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for program to restart (SystemMode change restarts the background program)
                $("#setupProgress").text("Waiting for program restart...");
                const programRestarted = await waitForProgramRestart();
                if (!programRestarted) return showSettingParametersError("E021. Timeout waiting for program to restart after System Mode change. Please try again.");
                // Wait for parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for system mode confirmation...");
                const parameterSet = await waitForSettingsParameter("SystemMode", "0", "mode", newSystemMode);
                if (!parameterSet) return showSettingParametersError("E022. Timeout waiting for System Mode parameter to be applied. Please try again.");
            } catch (error) {
                return showSettingParametersError("E031. Please refresh the page! (Error while writing command to local database)");
            }
        }
    }

    // Set Wide Solar Input Range
    if (hasSolarWideInputRange) {
        const newWideInputRange = $("#solar_wideinputrange").val();
        if (dataSettings?.["SystemMode"]?.["0"]?.["v4"] != newWideInputRange) {
            try {
                $("#setupProgress").text("Setting solar input range...");
                const response = await $.get({ url: "api.php?set=command&type=20752&entity=4&text2=" + newWideInputRange });
                if (response != "1") return showSettingParametersError("E032. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for solar input range confirmation...");
                const parameterSet = await waitForSettingsParameter("SystemMode", "0", "v4", newWideInputRange);
                if (!parameterSet) return showSettingParametersError("E033. Timeout waiting for Wide Solar Input Range parameter to be applied. Please try again.");
            } catch (error) {
                return showSettingParametersError("E034. Please refresh the page! (Error while writing command to local database)");
            }
        }
    }


    // Set Grid Fuse Amps
    const newGridFuseAmps = $("#bx_gridfuseamps").val();
    if (dataSettings?.["SystemMode"]?.["0"]?.["v5"] != newGridFuseAmps) {
        try {
            $("#setupProgress").text("Setting grid connection fuse...");
            const response = await $.get({ url: "api.php?set=command&type=20752&entity=5&text2=" + newGridFuseAmps });
            if (response != "1") return showSettingParametersError("E035. Please refresh the page! (Bad response while writing command to local database)");
            // Wait for parameter to be confirmed in settings
            $("#setupProgress").text("Waiting for grid fuse confirmation...");
            const parameterSet = await waitForSettingsParameter("SystemMode", "0", "v5", newGridFuseAmps);
            if (!parameterSet) return showSettingParametersError("E036. Timeout waiting for Grid Fuse Amps parameter to be applied. Please try again.");
        } catch (error) {
            return showSettingParametersError("E037. Please refresh the page! (Error while writing command to local database)");
        }
    }


    // Configure LiFePO Battery
    if (isLiFePO()) {
        try {
            if (inverterModel >= "11100") { // c-Series (R1/R2 battery)
                // Set battery type
                $("#setupProgress").text("Configuring battery...");
                const response = await $.get({ url: "api.php?set=command&type=24064&entity=401&text2=3" }); // battery type
                if (response != "1") return showSettingParametersError("E025d. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for battery type parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for battery type confirmation...");
                const parameterSet = await waitForSettingsParameter("Inverter", "401", "s1", "3");
                if (!parameterSet) return showSettingParametersError("E026b. Timeout waiting for battery type parameter to be applied. Please try again.");
                // Sleep to allow battery to start talking
                $("#setupProgress").text("Waiting for battery communication...");
                await sleep(10000);
            } else if (inverterModel >= "11000") { // i-Series (S1 BAT battery)
                // Set battery type
                $("#setupProgress").text("Configuring battery...");
                const response = await $.get({ url: "api.php?set=command&type=24064&entity=401&text2=2" }); // battery type
                if (response != "1") return showSettingParametersError("E025a. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for battery type parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for battery type confirmation...");
                const parameterSet = await waitForSettingsParameter("Inverter", "401", "s1", "2");
                if (!parameterSet) return showSettingParametersError("E026. Timeout waiting for battery type parameter to be applied. Please try again.");
                // Sleep to allow battery to start talking
                $("#setupProgress").text("Waiting for battery communication...");
                await sleep(10000);
            } else { // h-Series
                // Set battery type
                $("#setupProgress").text("Configuring battery...");
                const response1 = await $.get({ url: "api.php?set=command&type=24064&entity=401&text2=1" }); // battery type
                if (response1 != "1") return showSettingParametersError("E025b. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for battery type parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for battery type confirmation...");
                const parameterSet = await waitForSettingsParameter("Inverter", "401", "s1", "1");
                if (!parameterSet) return showSettingParametersError("E027. Timeout waiting for battery type parameter to be applied. Please try again.");
                // Set bms battery connect to "1" for communication test
                $("#setupProgress").text("Setting BMS connection...");
                const response2 = await $.get({ url: "api.php?set=command&type=24064&entity=10003&text2=1" }); // bms battery connect
                if (response2 != "1") return showSettingParametersError("E025c. Please refresh the page! (Bad response while writing command to local database)");
                // Wait for bms battery connect parameter to be confirmed in settings
                $("#setupProgress").text("Waiting for BMS connection confirmation...");
                const bmsParameterSet = await waitForSettingsParameter("Inverter", "10003", "s1", "1");
                if (!bmsParameterSet) return showSettingParametersError("E028. Timeout waiting for BMS battery connect parameter to be applied. Please try again.");
                // Sleep to allow battery to start talking
                $("#setupProgress").text("Waiting for battery communication...");
                await sleep(10000);
                // Set battery voltage
                $("#setupProgress").text("Setting battery voltage...");
                const response3 = await $.get({ url: "api.php?set=command&type=24064&entity=416&text2=5260" }); // battery voltage
                if (response3 != "1") return showSettingParametersError("E038. Please refresh the page! (Bad response while writing command to local database)");
            }
        } catch (error) {
            return showSettingParametersError("E024. Please refresh the page! (Error while writing command to local database)");
        }
    }


    // Verify Modules Communication
    if (isLiFePO()) {
        $("#setupProgress").text("Verifying battery communication...");
        const [ok, verifyError] = await verifyModulesCommunication();
        if (!ok) return showSettingParametersError(verifyError);
    }


    // Continue with the setup
    applyParams();


}





// MARK: Verify Communication



async function verifyModulesCommunication() {
    try {

        // Get current state
        const currentStateResponse = await $.get({ url: "api.php?get=currentstate" });
        if (!currentStateResponse || typeof currentStateResponse != "object")
            return [false, "E023. Please refresh the page! (Missing or malformed data in local currentstate table)"];
        dataCurrentState = JSON.parse(JSON.stringify(currentStateResponse));

        // Get needed values
        const batteryLevel = parseInt(dataCurrentState?.["3122"]?.[1]) || 0;
        const bmsCapacity  = parseInt(dataCurrentState?.["3317"]?.[1]) || 0;

        // Verify battery level
        if (batteryLevel == 0)
            return [false, t("ss_lifepo_communication_problem")];

        // Verify number of modules
        const moduleWh = inverterModel >= "11100" ? 16000 : (inverterModel >= "11000" ? 2550 : 3500);
        const recognizedModules = Math.round(parseInt(bmsCapacity) / moduleWh);
        let countModules = 0;
        $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
            if (sn.trim() != "") countModules += 1;
        });
        if (recognizedModules != countModules)
            return [false, t("ss_lifepo_recognition_problem", { count: recognizedModules })];

        // If not h10 inverter, we're done
        if (inverterModel != "10002")
            return [true, null];

        // h10 inverter: check battery charging voltage
        let tempDatetime = "";
        const h10StartTime = Date.now();
        while(true) {

            // Get settings table
            const settingsResponse = await $.get({ url: "api.php?get=settings" });
            if (!settingsResponse || typeof settingsResponse != "object" || !settingsResponse.hasOwnProperty("Inverter"))
                return [false, "E023. Please refresh the page! (Missing or malformed data in local settings table)"];
            dataSettings = JSON.parse(JSON.stringify(settingsResponse));

            // Get needed data
            const inverterData = settingsResponse["Inverter"];

            // Wait for data to change (first time or if timestamp hasn't changed)
            if (tempDatetime == "") {
                tempDatetime = inverterData["10"]["s1"];
                await sleep(5000);
                continue;
            }
            if (inverterData["10"]["s1"] == tempDatetime) {
                if (Date.now() - h10StartTime > 450000) // timeout after 7.5 minutes
                    return [false, "E040. Timeout waiting for h10 battery voltage check. Please try again."];
                await sleep(5000);
                continue;
            }

            // Verify battery charging voltage
            const floatVoltage = inverterData["416"]["s1"];
            if (!["5320", "5280"].includes(floatVoltage))
                return [false, t("ss_lifepo_communication_problem")];

            // Return success
            return [true, null];

        }

    } catch (error) {
        return [false, "E039. Please refresh the page! (Error while reading local currentstate table)"];
    }
}





// MARK: Define All Params



// [key, type, a, b, c, optional?]
// "S" → setup_sendSetting(a, b, c, value)
// "C" → setup_sendCommand(a=cmdType, b=entity, c=text1, value)
// optional=true → skip if either newP or oldP lacks the key
const PARAM_DEFS = [
    ["nominalSol",                            "S", "NominalSol",                "0",   "v1"],
    ["nominalExtSol",                         "S", "NominalExtSol",             "0",   "v1"],
    ["forecastSol1_v1",                       "S", "ForecastSolar",             "1",   "v1"],
    ["forecastSol1_v2",                       "S", "ForecastSolar",             "1",   "v2"],
    ["forecastSol1_v3",                       "S", "ForecastSolar",             "1",   "v3"],
    ["forecastSol2_v1",                       "S", "ForecastSolar",             "2",   "v1"],
    ["forecastSol2_v2",                       "S", "ForecastSolar",             "2",   "v2"],
    ["forecastSol2_v3",                       "S", "ForecastSolar",             "2",   "v3"],
    ["forecastSol3_v1",                       "S", "ForecastSolar",             "3",   "v1"],
    ["forecastSol3_v2",                       "S", "ForecastSolar",             "3",   "v2"],
    ["forecastSol3_v3",                       "S", "ForecastSolar",             "3",   "v3"],
    ["forecastSol4_v1",                       "S", "ForecastSolar",             "4",   "v1"],
    ["forecastSol4_v2",                       "S", "ForecastSolar",             "4",   "v2"],
    ["forecastSol4_v3",                       "S", "ForecastSolar",             "4",   "v3"],
    ["forecastSol5_v1",                       "S", "ForecastSolar",             "5",   "v1"],
    ["forecastSol5_v2",                       "S", "ForecastSolar",             "5",   "v2"],
    ["forecastSol5_v3",                       "S", "ForecastSolar",             "5",   "v3"],
    ["forecastSol6_v1",                       "S", "ForecastSolar",             "6",   "v1"],
    ["forecastSol6_v2",                       "S", "ForecastSolar",             "6",   "v2"],
    ["forecastSol6_v3",                       "S", "ForecastSolar",             "6",   "v3"],
    ["forecastSol7_v1",                       "S", "ForecastSolar",             "7",   "v1"],
    ["forecastSol7_v2",                       "S", "ForecastSolar",             "7",   "v2"],
    ["forecastSol7_v3",                       "S", "ForecastSolar",             "7",   "v3"],
    ["forecastSol8_v1",                       "S", "ForecastSolar",             "8",   "v1"],
    ["forecastSol8_v2",                       "S", "ForecastSolar",             "8",   "v2"],
    ["forecastSol8_v3",                       "S", "ForecastSolar",             "8",   "v3"],
    ["forecastSol101_v1",                     "S", "ForecastSolar",           "101",   "v1"],
    ["forecastSol101_v2",                     "S", "ForecastSolar",           "101",   "v2"],
    ["forecastSol101_v3",                     "S", "ForecastSolar",           "101",   "v3"],
    ["forecastSol102_v1",                     "S", "ForecastSolar",           "102",   "v1"],
    ["forecastSol102_v2",                     "S", "ForecastSolar",           "102",   "v2"],
    ["forecastSol102_v3",                     "S", "ForecastSolar",           "102",   "v3"],
    ["forecastSol103_v1",                     "S", "ForecastSolar",           "103",   "v1"],
    ["forecastSol103_v2",                     "S", "ForecastSolar",           "103",   "v2"],
    ["forecastSol103_v3",                     "S", "ForecastSolar",           "103",   "v3"],
    ["forecastSol104_v1",                     "S", "ForecastSolar",           "104",   "v1"],
    ["forecastSol104_v2",                     "S", "ForecastSolar",           "104",   "v2"],
    ["forecastSol104_v3",                     "S", "ForecastSolar",           "104",   "v3"],
    ["forecastSol105_v1",                     "S", "ForecastSolar",           "105",   "v1"],
    ["forecastSol105_v2",                     "S", "ForecastSolar",           "105",   "v2"],
    ["forecastSol105_v3",                     "S", "ForecastSolar",           "105",   "v3"],
    ["forecastSol106_v1",                     "S", "ForecastSolar",           "106",   "v1"],
    ["forecastSol106_v2",                     "S", "ForecastSolar",           "106",   "v2"],
    ["forecastSol106_v3",                     "S", "ForecastSolar",           "106",   "v3"],
    ["forecastSol107_v1",                     "S", "ForecastSolar",           "107",   "v1"],
    ["forecastSol107_v2",                     "S", "ForecastSolar",           "107",   "v2"],
    ["forecastSol107_v3",                     "S", "ForecastSolar",           "107",   "v3"],
    ["forecastSol108_v1",                     "S", "ForecastSolar",           "108",   "v1"],
    ["forecastSol108_v2",                     "S", "ForecastSolar",           "108",   "v2"],
    ["forecastSol108_v3",                     "S", "ForecastSolar",           "108",   "v3"],
    ["regulationMode",                        "S", "InjectionMode",             "0",   "v5"],
    ["extsolMode",                            "S", "ModbusExtSolarDevice",      "0", "mode"],
    ["meter1Mode",                            "S", "UserMeter",                 "1", "mode"],
    ["meter2Mode",                            "S", "UserMeter",                 "2", "mode"],
    ["meter3Mode",                            "S", "UserMeter",                 "3", "mode"],
    ["meter4Mode",                            "S", "UserMeter",                 "4", "mode"],
    ["meter1Label",                           "S", "UserMeter",                 "1",   "s1"],
    ["meter2Label",                           "S", "UserMeter",                 "2",   "s1"],
    ["meter3Label",                           "S", "UserMeter",                 "3",   "s1"],
    ["meter4Label",                           "S", "UserMeter",                 "4",   "s1"],
    ["controlMaxChargingPowerACMode",         "C", 20769,   0, ""],
    ["controlMaxInjectionPowerMode",          "C", 20770,   0, ""],
    ["evcTitle",                              "S", "EVCharger",                 "1",   "s1"],
    ["evcMode",                               "S", "EVCharger",                 "1", "mode"],
    ["evcProducerName",                       "S", "EVCharger",                 "1",   "s2"],
    ["evcIp",                                 "S", "EVChargerModbus",           "1",   "s1"],
    ["evcPort",                               "S", "EVChargerModbus",           "1",   "v1"],
    ["evcWiring",                             "S", "EVCharger",                 "1",   "v3"],
    ["evcPhaseMode",                          "S", "EVCharger",                 "1",   "v4"],
    ["evcMinCurrent",                         "S", "EVCharger",                 "1",   "v1"],
    ["evcMaxCurrent",                         "S", "EVCharger",                 "1",   "v2"],
    ["systemTimezone",                        "S", "SystemTimezone",            "0",   "s1"],
    ["prepareBatteryExtension",               "S", "PrepareBatteryExtension",   "0", "mode"],
    ["cloudSet",                              "S", "CloudSet",                  "0", "mode"],
    ["reactive_mode",                         "C", 24064, 202, "", true],
    ["pf_mode_power_factor",                  "C", 24064, 203, "", true],
    ["qt_mode_reactive_power",                "C", 24064, 204, "", true],
    ["overvoltage_10min_threshold",           "C", 24064, 205, "", true],
    ["grid_connect_lower_voltage",            "C", 24064, 211, "", true],
    ["grid_connect_upper_voltage",            "C", 24064, 212, "", true],
    ["grid_connect_lower_frequency",          "C", 24064, 213, "", true],
    ["grid_connect_upper_frequency",          "C", 24064, 214, "", true],
    ["wait_time_before_grid_connect",         "C", 24064, 215, "", true],
    ["grid_reconnect_upper_voltage",          "C", 24064, 222, "", true],
    ["wait_time_before_grid_reconnect",       "C", 24064, 225, "", true],
    ["stage_1_uv_threshold",                  "C", 24064, 231, "", true],
    ["stage_1_ov_threshold",                  "C", 24064, 232, "", true],
    ["stage_1_uf_threshold",                  "C", 24064, 233, "", true],
    ["stage_1_of_threshold",                  "C", 24064, 234, "", true],
    ["stage_1_uv_duration",                   "C", 24064, 235, "", true],
    ["stage_1_ov_duration",                   "C", 24064, 236, "", true],
    ["stage_1_uf_duration",                   "C", 24064, 237, "", true],
    ["stage_1_of_duration",                   "C", 24064, 238, "", true],
    ["stage_2_uv_threshold",                  "C", 24064, 239, "", true],
    ["stage_2_ov_threshold",                  "C", 24064, 240, "", true],
    ["stage_2_uv_duration",                   "C", 24064, 243, "", true],
    ["stage_2_ov_duration",                   "C", 24064, 244, "", true],
    ["qu_point_1_voltage",                    "C", 24064, 251, "", true],
    ["qu_point_2_voltage",                    "C", 24064, 252, "", true],
    ["qu_point_3_voltage",                    "C", 24064, 253, "", true],
    ["qu_point_4_voltage",                    "C", 24064, 254, "", true],
    ["qu_point_1_reactive_power",             "C", 24064, 255, "", true],
    ["qu_point_4_reactive_power",             "C", 24064, 258, "", true],
    ["qu_time_constant",                      "C", 24064, 260, "", true],
    ["qu_enter_power",                        "C", 24064, 261, "", true],
    ["qu_exit_power",                         "C", 24064, 262, "", true],
    ["cosfp_point_b_power",                   "C", 24064, 272, "", true],
    ["cosfp_enter_voltage",                   "C", 24064, 277, "", true],
    ["cosfp_exit_voltage",                    "C", 24064, 278, "", true],
    ["lvrt_switch",                           "C", 24064, 291, "", true],
    ["lvrt_enter_voltage",                    "C", 24064, 292, "", true],
    ["lvrt_exit_voltage",                     "C", 24064, 293, "", true],
    ["lvrt_point_5_voltage",                  "C", 24064, 298, "", true],
    ["lvrt_point_1_duration",                 "C", 24064, 299, "", true],
    ["lvrt_point_2_duration",                 "C", 24064, 300, "", true],
    ["lvrt_point_3_duration",                 "C", 24064, 301, "", true],
    ["lvrt_point_4_duration",                 "C", 24064, 302, "", true],
    ["lvrt_point_5_duration",                 "C", 24064, 303, "", true],
    ["hvrt_switch",                           "C", 24064, 311, "", true],
    ["hvrt_enter_voltage",                    "C", 24064, 312, "", true],
    ["hvrt_exit_voltage",                     "C", 24064, 313, "", true],
    ["hvrt_point_1_voltage",                  "C", 24064, 314, "", true],
    ["hvrt_point_2_voltage",                  "C", 24064, 315, "", true],
    ["hvrt_point_3_voltage",                  "C", 24064, 316, "", true],
    ["hvrt_point_3_duration",                 "C", 24064, 319, "", true],
    ["pu_time_constant",                      "C", 24064, 336, "", true],
    ["lfsmo_threshold",                       "C", 24064, 342, "", true],
    ["lfsmo_end_point_frequency",             "C", 24064, 344, "", true],
    ["lfsmo_power_recovery_rate",             "C", 24064, 348, "", true],
    ["lfsmo_droop",                           "C", 24064, 349, "", true],
    ["lfsmo_slope",                           "C", 24064, 350, "", true],
    ["battery_type",                          "C", 24064, 401, "", true],
    ["battery_cutoff_voltage_ongrid",         "C", 24064, 411, "", true],
    ["battery_cutoff_voltage_offgrid",        "C", 24064, 412, "", true],
    ["battery_recovery_voltage_ongrid",       "C", 24064, 413, "", true],
    ["battery_recovery_voltage_offgrid",      "C", 24064, 414, "", true],
    ["battery_bulk_charge_voltage",           "C", 24064, 415, "", true],
    ["battery_float_charge_voltage",          "C", 24064, 416, "", true],
    ["battery_max_charge_current",            "C", 24064, 417, "", true],
    ["battery_max_discharge_current_ongrid",  "C", 24064, 418, "", true],
];





// MARK: Make New Params



function makeNewParams() {

    const p = {};

    if (inverterModel == "10001" || inverterModel == "10002") { // for h5 and h10
        var maxChargingCurrent    = inverterModel == "10002" ? 20000 :  6000; // x0.01A
        var maxDischargingCurrent = inverterModel == "10002" ? 30000 : 15000; // x0.01A
        if (isLiFePO()) {
            var numberOfModules = 0;
            $("#lifepo_serialnumbers").val().trim().split("\n").forEach(sn => {
                if (sn.trim() != "") numberOfModules += 1;
            });
            if (dataSettings.hasOwnProperty("Inverter") && dataSettings["Inverter"].hasOwnProperty("412")) {
                p["battery_cutoff_voltage_ongrid"] = dataSettings["Inverter"]["412"].s1; // battery_cutoff_voltage_offgrid
            }
            p["battery_recovery_voltage_ongrid"     ] = "4800";
            p["battery_recovery_voltage_offgrid"    ] = "4800";
            p["battery_max_discharge_current_ongrid"] = Math.min(numberOfModules * 37 * 100, maxDischargingCurrent).toString();
        } else if (isCarbon()) {
            var batteryCapacity = $("#carbon_battery_capacity").data("wh");
            p["battery_bulk_charge_voltage"         ] = "5600";
            p["battery_float_charge_voltage"        ] = "5400";
            p["battery_cutoff_voltage_ongrid"       ] = "4680";
            p["battery_recovery_voltage_ongrid"     ] = "5200";
            p["battery_cutoff_voltage_offgrid"      ] = "4300";
            p["battery_recovery_voltage_offgrid"    ] = "4800";
            p["battery_max_charge_current"          ] = Math.min(Math.max(Math.round(batteryCapacity * 0.15 / 48), 10) * 100, maxChargingCurrent).toString();
            p["battery_max_discharge_current_ongrid"] = Math.min(Math.max(Math.round(batteryCapacity * 0.20 / 48), 20) * 100, maxDischargingCurrent).toString();
        } else if (isOther()) {
            var custom_maxChargingCurrent       =                Math.round(parseFloat($("#other_battery_maxChargingCurrent      ").val()) *  1) * 100 ;
            var custom_maxDischargingCurrent    =                Math.round(parseFloat($("#other_battery_maxDischargingCurrent   ").val()) *  1) * 100 ;
            var custom_bulkChargingVoltage      = Math.min(6000, Math.round(parseFloat($("#other_battery_bulkChargingVoltage     ").val()) * 10) *  10);
            var custom_floatChargingVoltage     = Math.min(6000, Math.round(parseFloat($("#other_battery_floatChargingVoltage    ").val()) * 10) *  10);
            var custom_cutoffVoltage            = Math.min(6000, Math.round(parseFloat($("#other_battery_cutoffVoltage           ").val()) * 10) *  10);
            var custom_redischargeVoltage       = Math.min(6000, Math.round(parseFloat($("#other_battery_redischargeVoltage      ").val()) * 10) *  10);
            var custom_cutoffVoltageHybrid      = Math.min(6000, Math.round(parseFloat($("#other_battery_cutoffVoltageHybrid     ").val()) * 10) *  10);
            var custom_redischargeVoltageHybrid = Math.min(6000, Math.round(parseFloat($("#other_battery_redischargeVoltageHybrid").val()) * 10) *  10);
            p["battery_bulk_charge_voltage"         ] = custom_bulkChargingVoltage;
            p["battery_float_charge_voltage"        ] = custom_floatChargingVoltage;
            p["battery_cutoff_voltage_ongrid"       ] = custom_cutoffVoltageHybrid;
            p["battery_recovery_voltage_ongrid"     ] = custom_redischargeVoltageHybrid;
            p["battery_cutoff_voltage_offgrid"      ] = custom_cutoffVoltage;
            p["battery_recovery_voltage_offgrid"    ] = custom_redischargeVoltage;
            p["battery_max_charge_current"          ] = Math.min(custom_maxChargingCurrent, maxChargingCurrent).toString();
            p["battery_max_discharge_current_ongrid"] = Math.min(custom_maxDischargingCurrent, maxDischargingCurrent);
        }
    }

    p["nominalSol"   ] = Math.round(parseFloat($("#solar_wattpeak"    ).val() || 0) * 1000);
    p["nominalExtSol"] = Math.round(parseFloat($("#solar_wattpeak_ext").val() || 0) * 1000);
    p["forecastSol1_v1"  ] = Math.round((parseFloat($("#pv_string_1_power"      ).val()) || 0) * 1000);
    p["forecastSol1_v2"  ] = parseInt(             $("#pv_string_1_declination" ).val()) || 0;
    p["forecastSol1_v3"  ] = parseInt(             $("#pv_string_1_orientation" ).val()) || 0;
    p["forecastSol2_v1"  ] = Math.round((parseFloat($("#pv_string_2_power"      ).val()) || 0) * 1000);
    p["forecastSol2_v2"  ] = parseInt(             $("#pv_string_2_declination" ).val()) || 0;
    p["forecastSol2_v3"  ] = parseInt(             $("#pv_string_2_orientation" ).val()) || 0;
    p["forecastSol3_v1"  ] = Math.round((parseFloat($("#pv_string_3_power"      ).val()) || 0) * 1000);
    p["forecastSol3_v2"  ] = parseInt(             $("#pv_string_3_declination" ).val()) || 0;
    p["forecastSol3_v3"  ] = parseInt(             $("#pv_string_3_orientation" ).val()) || 0;
    p["forecastSol4_v1"  ] = Math.round((parseFloat($("#pv_string_4_power"      ).val()) || 0) * 1000);
    p["forecastSol4_v2"  ] = parseInt(             $("#pv_string_4_declination"  ).val()) || 0;
    p["forecastSol4_v3"  ] = parseInt(             $("#pv_string_4_orientation"  ).val()) || 0;
    p["forecastSol5_v1"  ] = Math.round((parseFloat($("#pv_string_5_power"      ).val()) || 0) * 1000);
    p["forecastSol5_v2"  ] = parseInt(             $("#pv_string_5_declination"  ).val()) || 0;
    p["forecastSol5_v3"  ] = parseInt(             $("#pv_string_5_orientation"  ).val()) || 0;
    p["forecastSol6_v1"  ] = Math.round((parseFloat($("#pv_string_6_power"      ).val()) || 0) * 1000);
    p["forecastSol6_v2"  ] = parseInt(             $("#pv_string_6_declination"  ).val()) || 0;
    p["forecastSol6_v3"  ] = parseInt(             $("#pv_string_6_orientation"  ).val()) || 0;
    p["forecastSol7_v1"  ] = Math.round((parseFloat($("#pv_string_7_power"      ).val()) || 0) * 1000);
    p["forecastSol7_v2"  ] = parseInt(             $("#pv_string_7_declination"  ).val()) || 0;
    p["forecastSol7_v3"  ] = parseInt(             $("#pv_string_7_orientation"  ).val()) || 0;
    p["forecastSol8_v1"  ] = Math.round((parseFloat($("#pv_string_8_power"      ).val()) || 0) * 1000);
    p["forecastSol8_v2"  ] = parseInt(             $("#pv_string_8_declination"  ).val()) || 0;
    p["forecastSol8_v3"  ] = parseInt(             $("#pv_string_8_orientation"  ).val()) || 0;
    p["forecastSol101_v1"] = Math.round((parseFloat($("#pv_string_101_power"    ).val()) || 0) * 1000);
    p["forecastSol101_v2"] = parseInt(             $("#pv_string_101_declination").val()) || 0;
    p["forecastSol101_v3"] = parseInt(             $("#pv_string_101_orientation").val()) || 0;
    p["forecastSol102_v1"] = Math.round((parseFloat($("#pv_string_102_power"    ).val()) || 0) * 1000);
    p["forecastSol102_v2"] = parseInt(             $("#pv_string_102_declination").val()) || 0;
    p["forecastSol102_v3"] = parseInt(             $("#pv_string_102_orientation").val()) || 0;
    p["forecastSol103_v1"] = Math.round((parseFloat($("#pv_string_103_power"    ).val()) || 0) * 1000);
    p["forecastSol103_v2"] = parseInt(             $("#pv_string_103_declination").val()) || 0;
    p["forecastSol103_v3"] = parseInt(             $("#pv_string_103_orientation").val()) || 0;
    p["forecastSol104_v1"] = Math.round((parseFloat($("#pv_string_104_power"    ).val()) || 0) * 1000);
    p["forecastSol104_v2"] = parseInt(             $("#pv_string_104_declination").val()) || 0;
    p["forecastSol104_v3"] = parseInt(             $("#pv_string_104_orientation").val()) || 0;
    p["forecastSol105_v1"] = Math.round((parseFloat($("#pv_string_105_power"    ).val()) || 0) * 1000);
    p["forecastSol105_v2"] = parseInt(             $("#pv_string_105_declination").val()) || 0;
    p["forecastSol105_v3"] = parseInt(             $("#pv_string_105_orientation").val()) || 0;
    p["forecastSol106_v1"] = Math.round((parseFloat($("#pv_string_106_power"    ).val()) || 0) * 1000);
    p["forecastSol106_v2"] = parseInt(             $("#pv_string_106_declination").val()) || 0;
    p["forecastSol106_v3"] = parseInt(             $("#pv_string_106_orientation").val()) || 0;
    p["forecastSol107_v1"] = Math.round((parseFloat($("#pv_string_107_power"    ).val()) || 0) * 1000);
    p["forecastSol107_v2"] = parseInt(             $("#pv_string_107_declination").val()) || 0;
    p["forecastSol107_v3"] = parseInt(             $("#pv_string_107_orientation").val()) || 0;
    p["forecastSol108_v1"] = Math.round((parseFloat($("#pv_string_108_power"    ).val()) || 0) * 1000);
    p["forecastSol108_v2"] = parseInt(             $("#pv_string_108_declination").val()) || 0;
    p["forecastSol108_v3"] = parseInt(             $("#pv_string_108_orientation").val()) || 0;
    p["regulationMode"] = $("#regulation_check").is(":checked") ? "1" : "0";
    p["extsolMode"    ] = $("#extsol_check    ").is(":checked") ? "1" : "0";
    p["meter1Mode"    ] = $("#meter1_mode     ").val();
    p["meter2Mode"    ] = $("#meter2_mode     ").val();
    p["meter3Mode"    ] = $("#meter3_mode     ").val();
    p["meter4Mode"    ] = $("#meter4_mode     ").val();
    p["meter1Label"   ] = $("#meter1_label    ").val();
    p["meter2Label"   ] = $("#meter2_label    ").val();
    p["meter3Label"   ] = $("#meter3_label    ").val();
    p["meter4Label"   ] = $("#meter4_label    ").val();

    p["controlMaxChargingPowerACMode"] = $("#controlMaxChargingPowerAC_check").is(":checked") ? "1" : "0";
    p["controlMaxInjectionPowerMode" ] = $("#controlMaxInjectionPower_check" ).is(":checked") ? "1" : "0";

    p["evcTitle"       ] = $("#evcTitle"      ).val().trim();
    p["evcMode"        ] = parseInt($("#evcProducer" ).val());
    if (p["evcMode"] === 0) {
        p["evcProducerName"] = "";
        p["evcIp"          ] = "";
        p["evcPort"        ] = 0;
        p["evcWiring"      ] = 0;
        p["evcPhaseMode"   ] = 0;
        p["evcMinCurrent"  ] = 0;
        p["evcMaxCurrent"  ] = 0;
    } else {
        p["evcProducerName"] = $("#evcProducer option:selected").text().trim();
        p["evcIp"          ] = $("#evcIp"         ).val().trim();
        p["evcPort"        ] = parseInt($("#evcPort"     ).val()) || 502;
        p["evcWiring"      ] = parseInt($("#evcWiring"   ).val()) || 0;
        p["evcPhaseMode"   ] = parseInt($("#evcPhaseMode").val()) || 0;
        p["evcMinCurrent"  ] = (parseInt($("#evcMinCurrent").val()) || 0) * 100;
        p["evcMaxCurrent"  ] = (parseInt($("#evcMaxCurrent").val()) || 0) * 100;
    }

    p["systemTimezone"         ] = systemTimezone;
    p["prepareBatteryExtension"] = "0";
    p["cloudSet"               ] = "1";

    p["battery_type" ] = inverterModel >= "11100" ? "3" : (inverterModel >= "11000" ? "2" : (isLiFePO() ? "1" : "0")); // 3=lifepo c-Series (R1/R2), 2=lifepo i-Series (S1 BAT), h5/h10 → 1=lifepo, 0=carbon
    p["reactive_mode"] = "0"; // Reactive mode off

    if (elementExists("#extended_lfsmoThreshold")) p["lfsmo_threshold"] = Math.round($("#extended_lfsmoThreshold").val());
    if (elementExists("#extended_lfsmoDroop"    )) p["lfsmo_droop"    ] = Math.round($("#extended_lfsmoDroop").val());
    if (elementExists("#extended_lfsmoSlope"    )) p["lfsmo_slope"    ] = Math.round(parseFloat($("#extended_lfsmoSlope").val()) * 100);

    // VDE4105
    if (isVde4105) {
        // i-Series Only
        if (inverterModel >= "11000") {
            p["stage_1_ov_threshold"     ] = "26450";
            p["qu_enter_power"           ] = "0";
            p["qu_exit_power"            ] = "0";
            p["cosfp_enter_voltage"      ] = "23200";
            p["cosfp_exit_voltage"       ] = "20700";
            p["lvrt_enter_voltage"       ] = "19500";
            p["lvrt_exit_voltage"        ] = "19600";
            p["lvrt_point_5_voltage"     ] = "19500";
            p["lvrt_point_1_duration"    ] = "150";
            p["lvrt_point_2_duration"    ] = "750";
            p["lvrt_point_3_duration"    ] = "1600";
            p["lvrt_point_4_duration"    ] = "2700";
            p["lvrt_point_5_duration"    ] = "3000";
            p["hvrt_enter_voltage"       ] = "26400";
            p["hvrt_exit_voltage"        ] = "28750";
            p["hvrt_point_1_voltage"     ] = "26450";
            p["hvrt_point_2_voltage"     ] = "27600";
            p["hvrt_point_3_voltage"     ] = "28750";
            p["hvrt_point_3_duration"    ] = "100";
            p["lfsmo_power_recovery_rate"] = "1000";
            p["qu_time_constant"         ] = "10000";
        }
        // h-Series Only
        else {
            p["qu_time_constant"  ] = "5000";
            p["lvrt_switch"       ] = "0";
            p["hvrt_switch"       ] = "0";
            p["lfsmo_curve_switch"] = "1";
        }
    }
    // TOR
    else if (isTor) {
        // All Series
        if (elementExists("#extended_maxGridVoltage"    )) p["grid_connect_upper_voltage"     ] = Math.round(parseFloat($("#extended_maxGridVoltage").val()) * 100);
        if (elementExists("#extended_minGridVoltage"    )) p["grid_connect_lower_voltage"     ] = Math.round(parseFloat($("#extended_minGridVoltage").val()) * 100);
        if (elementExists("#extended_maxGridFrequency"  )) p["grid_connect_upper_frequency"   ] = Math.round(parseFloat($("#extended_maxGridFrequency").val()) * 100);
        if (elementExists("#extended_minGridFrequency"  )) p["grid_connect_lower_frequency"   ] = Math.round(parseFloat($("#extended_minGridFrequency").val()) * 100);
        if (elementExists("#extended_UeffOver1"         )) p["stage_1_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver1").val()) * 100);
        if (elementExists("#extended_UeffUnder1"        )) p["stage_1_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder1").val()) * 100);
        if (elementExists("#extended_UeffOver2"         )) p["stage_2_ov_threshold"           ] = Math.round(parseFloat($("#extended_UeffOver2").val()) * 100);
        if (elementExists("#extended_UeffUnder2"        )) p["stage_2_uv_threshold"           ] = Math.round(parseFloat($("#extended_UeffUnder2").val()) * 100);
        if (elementExists("#extended_fOver1"            )) p["stage_1_of_threshold"           ] = Math.round(parseFloat($("#extended_fOver1").val()) * 100);
        if (elementExists("#extended_fUnder1"           )) p["stage_1_uf_threshold"           ] = Math.round(parseFloat($("#extended_fUnder1").val()) * 100);
        if (elementExists("#extended_UeffOver1Time"     )) p["stage_1_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver1Time").val()) * 1000);
        if (elementExists("#extended_UeffUnder1Time"    )) p["stage_1_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder1Time").val()) * 1000);
        if (elementExists("#extended_UeffOver2Time"     )) p["stage_2_ov_duration"            ] = Math.round(parseFloat($("#extended_UeffOver2Time").val()) * 1000);
        if (elementExists("#extended_UeffUnder2Time"    )) p["stage_2_uv_duration"            ] = Math.round(parseFloat($("#extended_UeffUnder2Time").val()) * 1000);
        if (elementExists("#extended_fOver1Time"        )) p["stage_1_of_duration"            ] = Math.round(parseFloat($("#extended_fOver1Time").val()) * 1000);
        if (elementExists("#extended_fUnder1Time"       )) p["stage_1_uf_duration"            ] = Math.round(parseFloat($("#extended_fUnder1Time").val()) * 1000);
        if (elementExists("#extended_Ueff"              )) p["overvoltage_10min_threshold"    ] = Math.round(parseFloat($("#extended_Ueff").val()) * 100);
        if (elementExists("#extended_gridConnectDelay"  )) p["wait_time_before_grid_connect"  ] = Math.round($("#extended_gridConnectDelay").val());
        if (elementExists("#extended_puTime"            )) p["pu_time_constant"               ] = Math.round(parseFloat($("#extended_puTime").val()) * 1000);
        if (elementExists("#extended_gridReconnectDelay")) p["wait_time_before_grid_reconnect"] = Math.round($("#extended_gridReconnectDelay").val());
        p["pu_curve_switch"   ] = "1";
        p["lfsmu_curve_switch"] = "1";
        // i-Series Only
        if (inverterModel >= "11000") {
            p["grid_reconnect_upper_voltage"] = "25070";
            p["cosfp_enter_voltage"         ] = "25070";
            p["cosfp_exit_voltage"          ] = "20700";
            p["lvrt_enter_voltage"          ] = "18400";
            p["lvrt_exit_voltage"           ] = "18500";
            p["lvrt_point_5_voltage"        ] = "19500";
            p["lvrt_point_1_duration"       ] = "150";
            p["lvrt_point_2_duration"       ] = "400";
            p["lvrt_point_3_duration"       ] = "800";
            p["lvrt_point_4_duration"       ] = "1250";
            p["lfsmo_end_point_frequency"   ] = "5120";
            p["qu_time_constant"            ] = "10000";
        }
        // h-Series Only
        else {
            p["qu_time_constant"  ] = "5000";
            p["lfsmo_curve_switch"] = "1";
            p["lvrt_switch"       ] = isBackup() ? "1" : "0";
            p["hvrt_switch"       ] = isBackup() ? "1" : "0";
        }
    }
    // Estonia
    else if (isEstonia) {
        // All Series
        p["grid_connect_lower_voltage"] = "19550";
        p["grid_connect_upper_voltage"] = "26450";
        p["stage_1_uv_threshold"      ] = "19550";
        p["stage_1_uv_duration"       ] = "1200";
        p["stage_1_ov_duration"       ] = "3000";
        p["stage_1_uf_duration"       ] = "360";
        p["stage_1_of_duration"       ] = "160";
        p["stage_2_uv_threshold"      ] = "4600";
        p["stage_2_uv_duration"       ] = "360";
        p["stage_2_ov_duration"       ] = "100";
        p["lfsmu_curve_switch"        ] = "1";
        // i-Series Only
        if (inverterModel >= "11000") {
            p["grid_connect_lower_frequency"] = "4700";
            p["grid_connect_upper_frequency"] = "5200";
            p["stage_1_ov_threshold"        ] = "25530";
            p["stage_1_uf_threshold"        ] = "4740";
            p["stage_1_of_threshold"        ] = "5160";
            p["stage_2_ov_threshold"        ] = "26450";
            p["lvrt_switch"                 ] = "1";
            p["hvrt_switch"                 ] = "1";
        }
        // h-Series Only
        else {
            p["grid_connect_lower_frequency"] = "4750";
            p["grid_connect_upper_frequency"] = "5150";
            p["stage_1_ov_threshold"        ] = "26500";
            p["stage_1_uf_threshold"        ] = "4750"; // 4740 out-of-range for h-Series
            p["stage_1_of_threshold"        ] = "5150"; // 5160 out-of-range for h-Series
            p["stage_2_ov_threshold"        ] = "28500";
            p["stage_2_uf_duration"         ] = "100";
            p["stage_2_of_duration"         ] = "100";
            p["lfsmo_curve_switch"          ] = "1";
            p["lvrt_switch"                 ] = isBackup() ? "1" : "0";
            p["hvrt_switch"                 ] = isBackup() ? "1" : "0";
        }
    }

    // Reactive Mode
    if (reactive_mode == 1) {
        // cosφ(P) Curve
        p["reactive_mode"            ] = "3";
        p["cosfp_point_b_power"      ] = reactive_kink * 100;
    } else if (reactive_mode == 2) {
        // Fixed cosφ
        p["reactive_mode"            ] = "1";
        p["pf_mode_power_factor"     ] = reactive_cosphi * 10;
    } else if (reactive_mode == 3) {
        // Q(U) Curve
        p["reactive_mode"            ] = "4";
        p["qu_point_1_voltage"       ] = Math.round(Math.round(reactive_v1) * 230.94 / 10) * 10;
        p["qu_point_2_voltage"       ] = Math.round(Math.round(reactive_v2) * 230.94 / 10) * 10;
        p["qu_point_3_voltage"       ] = Math.round(Math.round(reactive_v3) * 230.94 / 10) * 10;
        p["qu_point_4_voltage"       ] = Math.round(Math.round(reactive_v4) * 230.94 / 10) * 10;
        p["qu_point_1_reactive_power"] = Math.round(reactive_qmaxsn * 100 * 100);
        p["qu_point_4_reactive_power"] = Math.round(reactive_qmaxsn * 100 * 100 * -1);
        p["qu_time_constant"         ] = Math.round(reactive_qutime * 1000);
    } else if (reactive_mode == 4) {
        // Fixed Q
        p["reactive_mode"            ] = "2";
        p["qt_mode_reactive_power"   ] = reactive_qfix / devicePower * 100 * 100;
    }

    return p;

}





// MARK: Make Old Params



function makeOldParams(response) {

    const p = {};
    const temp = response["Inverter"];

    p["nominalSol"    ] = !response.hasOwnProperty("NominalSol"   ) ? 0 : response["NominalSol"   ]["0"]["v1"];
    p["nominalExtSol" ] = !response.hasOwnProperty("NominalExtSol") ? 0 : response["NominalExtSol"]["0"]["v1"];
    p["forecastSol1_v1"  ] = parseInt(response["ForecastSolar"]?.["1"]  ?.["v1"]) || 0;
    p["forecastSol1_v2"  ] = parseInt(response["ForecastSolar"]?.["1"]  ?.["v2"]) || 0;
    p["forecastSol1_v3"  ] = parseInt(response["ForecastSolar"]?.["1"]  ?.["v3"]) || 0;
    p["forecastSol2_v1"  ] = parseInt(response["ForecastSolar"]?.["2"]  ?.["v1"]) || 0;
    p["forecastSol2_v2"  ] = parseInt(response["ForecastSolar"]?.["2"]  ?.["v2"]) || 0;
    p["forecastSol2_v3"  ] = parseInt(response["ForecastSolar"]?.["2"]  ?.["v3"]) || 0;
    p["forecastSol3_v1"  ] = parseInt(response["ForecastSolar"]?.["3"]  ?.["v1"]) || 0;
    p["forecastSol3_v2"  ] = parseInt(response["ForecastSolar"]?.["3"]  ?.["v2"]) || 0;
    p["forecastSol3_v3"  ] = parseInt(response["ForecastSolar"]?.["3"]  ?.["v3"]) || 0;
    p["forecastSol4_v1"  ] = parseInt(response["ForecastSolar"]?.["4"]  ?.["v1"]) || 0;
    p["forecastSol4_v2"  ] = parseInt(response["ForecastSolar"]?.["4"]  ?.["v2"]) || 0;
    p["forecastSol4_v3"  ] = parseInt(response["ForecastSolar"]?.["4"]  ?.["v3"]) || 0;
    p["forecastSol5_v1"  ] = parseInt(response["ForecastSolar"]?.["5"]  ?.["v1"]) || 0;
    p["forecastSol5_v2"  ] = parseInt(response["ForecastSolar"]?.["5"]  ?.["v2"]) || 0;
    p["forecastSol5_v3"  ] = parseInt(response["ForecastSolar"]?.["5"]  ?.["v3"]) || 0;
    p["forecastSol6_v1"  ] = parseInt(response["ForecastSolar"]?.["6"]  ?.["v1"]) || 0;
    p["forecastSol6_v2"  ] = parseInt(response["ForecastSolar"]?.["6"]  ?.["v2"]) || 0;
    p["forecastSol6_v3"  ] = parseInt(response["ForecastSolar"]?.["6"]  ?.["v3"]) || 0;
    p["forecastSol7_v1"  ] = parseInt(response["ForecastSolar"]?.["7"]  ?.["v1"]) || 0;
    p["forecastSol7_v2"  ] = parseInt(response["ForecastSolar"]?.["7"]  ?.["v2"]) || 0;
    p["forecastSol7_v3"  ] = parseInt(response["ForecastSolar"]?.["7"]  ?.["v3"]) || 0;
    p["forecastSol8_v1"  ] = parseInt(response["ForecastSolar"]?.["8"]  ?.["v1"]) || 0;
    p["forecastSol8_v2"  ] = parseInt(response["ForecastSolar"]?.["8"]  ?.["v2"]) || 0;
    p["forecastSol8_v3"  ] = parseInt(response["ForecastSolar"]?.["8"]  ?.["v3"]) || 0;
    p["forecastSol101_v1"] = parseInt(response["ForecastSolar"]?.["101"]?.["v1"]) || 0;
    p["forecastSol101_v2"] = parseInt(response["ForecastSolar"]?.["101"]?.["v2"]) || 0;
    p["forecastSol101_v3"] = parseInt(response["ForecastSolar"]?.["101"]?.["v3"]) || 0;
    p["forecastSol102_v1"] = parseInt(response["ForecastSolar"]?.["102"]?.["v1"]) || 0;
    p["forecastSol102_v2"] = parseInt(response["ForecastSolar"]?.["102"]?.["v2"]) || 0;
    p["forecastSol102_v3"] = parseInt(response["ForecastSolar"]?.["102"]?.["v3"]) || 0;
    p["forecastSol103_v1"] = parseInt(response["ForecastSolar"]?.["103"]?.["v1"]) || 0;
    p["forecastSol103_v2"] = parseInt(response["ForecastSolar"]?.["103"]?.["v2"]) || 0;
    p["forecastSol103_v3"] = parseInt(response["ForecastSolar"]?.["103"]?.["v3"]) || 0;
    p["forecastSol104_v1"] = parseInt(response["ForecastSolar"]?.["104"]?.["v1"]) || 0;
    p["forecastSol104_v2"] = parseInt(response["ForecastSolar"]?.["104"]?.["v2"]) || 0;
    p["forecastSol104_v3"] = parseInt(response["ForecastSolar"]?.["104"]?.["v3"]) || 0;
    p["forecastSol105_v1"] = parseInt(response["ForecastSolar"]?.["105"]?.["v1"]) || 0;
    p["forecastSol105_v2"] = parseInt(response["ForecastSolar"]?.["105"]?.["v2"]) || 0;
    p["forecastSol105_v3"] = parseInt(response["ForecastSolar"]?.["105"]?.["v3"]) || 0;
    p["forecastSol106_v1"] = parseInt(response["ForecastSolar"]?.["106"]?.["v1"]) || 0;
    p["forecastSol106_v2"] = parseInt(response["ForecastSolar"]?.["106"]?.["v2"]) || 0;
    p["forecastSol106_v3"] = parseInt(response["ForecastSolar"]?.["106"]?.["v3"]) || 0;
    p["forecastSol107_v1"] = parseInt(response["ForecastSolar"]?.["107"]?.["v1"]) || 0;
    p["forecastSol107_v2"] = parseInt(response["ForecastSolar"]?.["107"]?.["v2"]) || 0;
    p["forecastSol107_v3"] = parseInt(response["ForecastSolar"]?.["107"]?.["v3"]) || 0;
    p["forecastSol108_v1"] = parseInt(response["ForecastSolar"]?.["108"]?.["v1"]) || 0;
    p["forecastSol108_v2"] = parseInt(response["ForecastSolar"]?.["108"]?.["v2"]) || 0;
    p["forecastSol108_v3"] = parseInt(response["ForecastSolar"]?.["108"]?.["v3"]) || 0;
    p["regulationMode"] = !response.hasOwnProperty("InjectionMode"       ) ? "0" : response["InjectionMode"       ]["0"]["v5"  ];
    p["extsolMode"    ] = !response.hasOwnProperty("ModbusExtSolarDevice") ? "0" : response["ModbusExtSolarDevice"]["0"]["mode"];
    p["meter1Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? "0" : response["UserMeter"]["1"]["mode"];
    p["meter2Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? "0" : response["UserMeter"]["2"]["mode"];
    p["meter3Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? "0" : response["UserMeter"]["3"]["mode"];
    p["meter4Mode"    ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? "0" : response["UserMeter"]["4"]["mode"];
    p["meter1Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("1") ? ""  : response["UserMeter"]["1"]["s1"  ];
    p["meter2Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("2") ? ""  : response["UserMeter"]["2"]["s1"  ];
    p["meter3Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("3") ? ""  : response["UserMeter"]["3"]["s1"  ];
    p["meter4Label"   ] = !response.hasOwnProperty("UserMeter") || !response["UserMeter"].hasOwnProperty("4") ? ""  : response["UserMeter"]["4"]["s1"  ];

    p["controlMaxChargingPowerACMode"] = !response.hasOwnProperty("ControlMaxChargingPowerAC") ? "0" : response["ControlMaxChargingPowerAC"]["0"]["mode"];
    p["controlMaxInjectionPowerMode" ] = !response.hasOwnProperty("ControlMaxInjectionPower" ) ? "0" : response["ControlMaxInjectionPower" ]["0"]["mode"];

    p["evcTitle"       ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?   "" : (response["EVCharger"      ]["1"]["s1"  ] || "");
    p["evcMode"        ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?    0 : parseInt(response["EVCharger"      ]["1"]["mode"] || 0);
    p["evcProducerName"] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?   "" : (response["EVCharger"      ]["1"]["s2"  ] || "");
    p["evcIp"          ] = !response.hasOwnProperty("EVChargerModbus") || !response["EVChargerModbus"].hasOwnProperty("1") ?   "" : (response["EVChargerModbus"]["1"]["s1"  ] || "");
    p["evcPort"        ] = !response.hasOwnProperty("EVChargerModbus") || !response["EVChargerModbus"].hasOwnProperty("1") ?    0 : (parseInt(response["EVChargerModbus"]["1"]["v1"]) || 0);
    p["evcWiring"      ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?    0 : parseInt(response["EVCharger"      ]["1"]["v3"  ] || 0);
    p["evcPhaseMode"   ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?    0 : parseInt(response["EVCharger"      ]["1"]["v4"  ] || 0);
    p["evcMinCurrent"  ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?    0 : parseInt(response["EVCharger"      ]["1"]["v1"  ] || 0);
    p["evcMaxCurrent"  ] = !response.hasOwnProperty("EVCharger"      ) || !response["EVCharger"      ].hasOwnProperty("1") ?    0 : parseInt(response["EVCharger"      ]["1"]["v2"  ] || 0);

    p["systemTimezone"         ] = !response.hasOwnProperty("SystemTimezone"         ) || !response["SystemTimezone"         ].hasOwnProperty("0") ? ""  : response["SystemTimezone"         ]["0"]["s1"  ];
    p["prepareBatteryExtension"] = !response.hasOwnProperty("PrepareBatteryExtension") || !response["PrepareBatteryExtension"].hasOwnProperty("0") ? "0" : response["PrepareBatteryExtension"]["0"]["mode"];
    p["cloudSet"               ] = !response.hasOwnProperty("CloudSet"               ) || !response["CloudSet"               ].hasOwnProperty("0") ? ""  : response["CloudSet"               ]["0"]["mode"];

    if (temp.hasOwnProperty("202")) p["reactive_mode"                       ] = temp["202"].s1;
    if (temp.hasOwnProperty("203")) p["pf_mode_power_factor"                ] = temp["203"].s1;
    if (temp.hasOwnProperty("204")) p["qt_mode_reactive_power"              ] = temp["204"].s1;
    if (temp.hasOwnProperty("205")) p["overvoltage_10min_threshold"         ] = temp["205"].s1;
    if (temp.hasOwnProperty("211")) p["grid_connect_lower_voltage"          ] = temp["211"].s1;
    if (temp.hasOwnProperty("212")) p["grid_connect_upper_voltage"          ] = temp["212"].s1;
    if (temp.hasOwnProperty("213")) p["grid_connect_lower_frequency"        ] = temp["213"].s1;
    if (temp.hasOwnProperty("214")) p["grid_connect_upper_frequency"        ] = temp["214"].s1;
    if (temp.hasOwnProperty("215")) p["wait_time_before_grid_connect"       ] = temp["215"].s1;
    if (temp.hasOwnProperty("222")) p["grid_reconnect_upper_voltage"        ] = temp["222"].s1;
    if (temp.hasOwnProperty("225")) p["wait_time_before_grid_reconnect"     ] = temp["225"].s1;
    if (temp.hasOwnProperty("231")) p["stage_1_uv_threshold"                ] = temp["231"].s1;
    if (temp.hasOwnProperty("232")) p["stage_1_ov_threshold"                ] = temp["232"].s1;
    if (temp.hasOwnProperty("233")) p["stage_1_uf_threshold"                ] = temp["233"].s1;
    if (temp.hasOwnProperty("234")) p["stage_1_of_threshold"                ] = temp["234"].s1;
    if (temp.hasOwnProperty("235")) p["stage_1_uv_duration"                 ] = temp["235"].s1;
    if (temp.hasOwnProperty("236")) p["stage_1_ov_duration"                 ] = temp["236"].s1;
    if (temp.hasOwnProperty("237")) p["stage_1_uf_duration"                 ] = temp["237"].s1;
    if (temp.hasOwnProperty("238")) p["stage_1_of_duration"                 ] = temp["238"].s1;
    if (temp.hasOwnProperty("239")) p["stage_2_uv_threshold"                ] = temp["239"].s1;
    if (temp.hasOwnProperty("240")) p["stage_2_ov_threshold"                ] = temp["240"].s1;
    if (temp.hasOwnProperty("243")) p["stage_2_uv_duration"                 ] = temp["243"].s1;
    if (temp.hasOwnProperty("244")) p["stage_2_ov_duration"                 ] = temp["244"].s1;
    if (temp.hasOwnProperty("251")) p["qu_point_1_voltage"                  ] = temp["251"].s1;
    if (temp.hasOwnProperty("252")) p["qu_point_2_voltage"                  ] = temp["252"].s1;
    if (temp.hasOwnProperty("253")) p["qu_point_3_voltage"                  ] = temp["253"].s1;
    if (temp.hasOwnProperty("254")) p["qu_point_4_voltage"                  ] = temp["254"].s1;
    if (temp.hasOwnProperty("255")) p["qu_point_1_reactive_power"           ] = temp["255"].s1;
    if (temp.hasOwnProperty("258")) p["qu_point_4_reactive_power"           ] = temp["258"].s1;
    if (temp.hasOwnProperty("260")) p["qu_time_constant"                    ] = temp["260"].s1;
    if (temp.hasOwnProperty("261")) p["qu_enter_power"                      ] = temp["261"].s1;
    if (temp.hasOwnProperty("262")) p["qu_exit_power"                       ] = temp["262"].s1;
    if (temp.hasOwnProperty("272")) p["cosfp_point_b_power"                 ] = temp["272"].s1;
    if (temp.hasOwnProperty("277")) p["cosfp_enter_voltage"                 ] = temp["277"].s1;
    if (temp.hasOwnProperty("278")) p["cosfp_exit_voltage"                  ] = temp["278"].s1;
    if (temp.hasOwnProperty("291")) p["lvrt_switch"                         ] = temp["291"].s1;
    if (temp.hasOwnProperty("292")) p["lvrt_enter_voltage"                  ] = temp["292"].s1;
    if (temp.hasOwnProperty("293")) p["lvrt_exit_voltage"                   ] = temp["293"].s1;
    if (temp.hasOwnProperty("298")) p["lvrt_point_5_voltage"                ] = temp["298"].s1;
    if (temp.hasOwnProperty("299")) p["lvrt_point_1_duration"               ] = temp["299"].s1;
    if (temp.hasOwnProperty("300")) p["lvrt_point_2_duration"               ] = temp["300"].s1;
    if (temp.hasOwnProperty("301")) p["lvrt_point_3_duration"               ] = temp["301"].s1;
    if (temp.hasOwnProperty("302")) p["lvrt_point_4_duration"               ] = temp["302"].s1;
    if (temp.hasOwnProperty("303")) p["lvrt_point_5_duration"               ] = temp["303"].s1;
    if (temp.hasOwnProperty("311")) p["hvrt_switch"                         ] = temp["311"].s1;
    if (temp.hasOwnProperty("312")) p["hvrt_enter_voltage"                  ] = temp["312"].s1;
    if (temp.hasOwnProperty("313")) p["hvrt_exit_voltage"                   ] = temp["313"].s1;
    if (temp.hasOwnProperty("314")) p["hvrt_point_1_voltage"                ] = temp["314"].s1;
    if (temp.hasOwnProperty("315")) p["hvrt_point_2_voltage"                ] = temp["315"].s1;
    if (temp.hasOwnProperty("316")) p["hvrt_point_3_voltage"                ] = temp["316"].s1;
    if (temp.hasOwnProperty("319")) p["hvrt_point_3_duration"               ] = temp["319"].s1;
    if (temp.hasOwnProperty("336")) p["pu_time_constant"                    ] = temp["336"].s1;
    if (temp.hasOwnProperty("342")) p["lfsmo_threshold"                     ] = temp["342"].s1;
    if (temp.hasOwnProperty("344")) p["lfsmo_end_point_frequency"           ] = temp["344"].s1;
    if (temp.hasOwnProperty("348")) p["lfsmo_power_recovery_rate"           ] = temp["348"].s1;
    if (temp.hasOwnProperty("349")) p["lfsmo_droop"                         ] = temp["349"].s1;
    if (temp.hasOwnProperty("350")) p["lfsmo_slope"                         ] = temp["350"].s1;
    if (temp.hasOwnProperty("401")) p["battery_type"                        ] = temp["401"].s1;
    if (temp.hasOwnProperty("411")) p["battery_cutoff_voltage_ongrid"       ] = temp["411"].s1;
    if (temp.hasOwnProperty("412")) p["battery_cutoff_voltage_offgrid"      ] = temp["412"].s1;
    if (temp.hasOwnProperty("413")) p["battery_recovery_voltage_ongrid"     ] = temp["413"].s1;
    if (temp.hasOwnProperty("414")) p["battery_recovery_voltage_offgrid"    ] = temp["414"].s1;
    if (temp.hasOwnProperty("415")) p["battery_bulk_charge_voltage"         ] = temp["415"].s1;
    if (temp.hasOwnProperty("416")) p["battery_float_charge_voltage"        ] = temp["416"].s1;
    if (temp.hasOwnProperty("417")) p["battery_max_charge_current"          ] = temp["417"].s1;
    if (temp.hasOwnProperty("418")) p["battery_max_discharge_current_ongrid"] = temp["418"].s1;

    return p;

}





// MARK: Apply Params



function applyParamDiff(newP, oldP) {
    let changed = 0;
    for (const [key, type, a, b, c, optional] of PARAM_DEFS) {
        if (optional && (!newP.hasOwnProperty(key) || !oldP.hasOwnProperty(key))) continue;
        const n = newP[key], o = oldP[key];
        if (type === "S") {
            if (n == o) continue;
            changed++;
            setup_sendSetting(a, b, c, n);
        } else if (type === "C") {
            if (n == o) continue;
            changed++;
            setup_sendCommand(a, b, c, n);
        }
    }
    return changed;
}



async function setup_sendCommand(type, entity, text1, text2) {
    try {
        const response = await $.get({ url: `api.php?set=command&type=${type}&entity=${entity}&text1=${text1}&text2=${text2}` });
        if (response != "1") return showSettingParametersError("E028. Please refresh the page! (Bad response while writing command to local database)");
        if (checkParametersInterval == undefined) checkParametersInterval = setInterval(setup_checkParameters, 5000);
    } catch (error) {
        showSettingParametersError("E029. Please refresh the page! (Error while writing command to local database)");
    }
}

async function setup_sendSetting(varname, entity, field, value) {
    var bxSet = { "mode":11, "v1":21, "v2":22, "v3":23, "v4":24, "v5":25, "v6":26, "s1":31, "s2":32 };
    await setup_sendCommand(11, bxSet[field], entity + " " + varname, value);
}



async function applyParams() {

    // If feed-in limitation is 0%, turn grid injection OFF
    if (rawInjectionPower === 0)
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=0" });
    else
        $.get({ url: "api.php?set=command&type=20738&entity=0&text1=1&text2=1" });

    // Set common inverter parameters (here are set to manually, should set to auto in system_test)
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=2&text2=1" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=3&text2=0" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=4&text2=1" });
    $.get({ url: "api.php?set=command&type=20738&entity=0&text1=5&text2=0" });

    // Set all parameters
    try {

        // Get new parameters
        $("#setupProgress").text("Loading current parameters...");
        newParameters = makeNewParams();

        // Get old parameters
        const [response, settingsError] = await get_settings();
        if (settingsError) return showSettingParametersError("E026. Please refresh the page! (" + settingsError + ")");
        dataSettings = JSON.parse(JSON.stringify(response));
        previousSettings = JSON.stringify(response);
        oldParameters = makeOldParams(response);

        // Print for debug
        console.log("newParameters", newParameters);
        console.log("oldParameters", oldParameters);

        // Apply parameters
        var changed = applyParamDiff(newParameters, oldParameters);
        if (changed) $("#setupProgress").text(`Applying ${changed} parameters...`);

        // Check success
        if (!changed) {
            // Set BMS battery connect to "2" for normal operation (h-Series only)
            if (dataSettings?.["Inverter"]?.["10003"]) {
                const restoreResponse = await $.get({ url: "api.php?set=command&type=24064&entity=10003&text2=2" });
                if (restoreResponse !== "1") return showSettingParametersError("E040. Could not set BMS battery connect to 2. Please try again.");
                await waitForSettingsParameter("Inverter", "10003", "s1", "2");
            }
            // Show success
            $("#settingParamsIcon").html('<i class="bi bi-check-circle-fill text-success lh-1" style="font-size:3rem;"></i>');
            $("#message").addClass("text-success").html(t("ss_setting_success"));
            $("#setupProgress").text(t("ss_redirecting"));
            // Next step
            await sleep(2500);
            window.location.href = "system_test.php";
        } else {
            console.log("SETTING PARAMETERS");
        }

    } catch (error) {
        showSettingParametersError("E041. Please refresh the page! (Unexpected error while applying parameters)");
    }


}



var tempCheckCounter = 0;

async function setup_checkParameters() {

    // Wait for all setup_sendCommand calls to fire and clear interval
    if (!isSettingParameters) {
        await sleep(5000);
        clearInterval(checkParametersInterval);
        checkParametersInterval = undefined;
        isSettingParameters = false;
    }

    // Check all parameters
    try {

        // Get old parameters
        const [response, settingsError] = await get_settings();
        if (settingsError) return showSettingParametersError("E030. Please refresh the page! (" + settingsError + ")");
        dataSettings = JSON.parse(JSON.stringify(response));
        if (JSON.stringify(response) == previousSettings) { // Relload settings if taking too long
            tempCheckCounter += 1;
            if (tempCheckCounter > 10) {
                setTimeout(async () => {
                    try {
                        const response = await $.get({ url: "api.php?set=command&type=12&entity=0&text2=1" }); // reload settings (to avoid waiting 5 minutes)
                        console.log("RELOAD SETTINGS");
                    } catch (error) {
                        console.log("Error reloading settings:", error);
                    }
                }, 1000);
                tempCheckCounter = 0;
            }
            return false;
        }
        previousSettings = JSON.stringify(response);
        oldParameters = makeOldParams(response);

        // Print for debug
        console.log("newParameters", newParameters);
        console.log("oldParameters", oldParameters);

        // Apply parameters
        var changed = applyParamDiff(newParameters, oldParameters);
        if (changed) $("#setupProgress").text(`Verifying parameters... ${changed} still pending`);

        // Check success
        if (!changed) {
            // Set BMS battery connect to "2" for normal operation (h-Series only)
            if (dataSettings?.["Inverter"]?.["10003"]) {
                const restoreResponse = await $.get({ url: "api.php?set=command&type=24064&entity=10003&text2=2" });
                if (restoreResponse !== "1") return showSettingParametersError("E040. Could not set BMS battery connect to 2. Please try again.");
                await waitForSettingsParameter("Inverter", "10003", "s1", "2");
            }
            // Show success
            $("#settingParamsIcon").html('<i class="bi bi-check-circle-fill text-success lh-1" style="font-size:3rem;"></i>');
            $("#message").addClass("text-success").html(t("ss_setting_success"));
            $("#setupProgress").text(t("ss_redirecting"));
            // Next step
            await sleep(2500);
            window.location.href = "system_test.php";
        } else {
            checkParametersCounter++;
            if (checkParametersCounter < 5) {
                // Show Retrying
                console.log(`RETRYING, ${checkParametersCounter + 1}/5, PLEASE WAIT!`);
            } else {
                // Show Error - Parameter Not Accepted
                const failedDef = PARAM_DEFS.find(([key, , , , , optional]) => {
                    if (optional && (!newParameters.hasOwnProperty(key) || !oldParameters.hasOwnProperty(key))) return false;
                    const n = newParameters[key], o = oldParameters[key];
                    if (n === undefined || o === undefined) return false;
                    return n != o;
                });
                if (failedDef) {
                    showSettingParametersError(`Problem when setting ${failedDef[0]}`);
                } else {
                    showSettingParametersError("E042. Parameters not accepted after 5 retries. Please try again.");
                }
            }
        }

    } catch (error) {
        showSettingParametersError("E031. Please refresh the page! (Unexpected error while checking parameters)");
    }

}




















// MARK: Page Load



initialLoad();



setInterval(() => {
    $("#btn_next").attr("disabled", isSettingParameters || !allFieldsCorrect());
}, 1000);



$("#btn_next").on("click", () => mainFormSubmit());
