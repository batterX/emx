<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 8;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




// Fetch external PDFs to append to the generated PDF (server-side to avoid CORS).
// Warranty PDF: selector on api.batterx.app returns the historically-correct conditions
// based on installer country + installation date + device partnumber.
$attachmentPdfUrls = [
    "https://api.batterx.app/warranty/select.php?" . http_build_query([
        "installer_country" => $_SESSION["installer_country"]  ?? "",
        "installation_date" => $_SESSION["installation_date"]  ?? "",
        "device_partnumber" => $_SESSION["device_partnumber"]  ?? "",
        "file_type"         => "pdf",
    ]),
];
$attachmentPdfsB64 = [];
foreach($attachmentPdfUrls as $url) {
    $bytes = @file_get_contents($url);
    if($bytes !== false) $attachmentPdfsB64[] = base64_encode($bytes);
}




// Normalize installer_og_* from installer_* if not yet set (first installation or same installer)
if(empty($_SESSION["installer_og_email"])) {
    $_SESSION["installer_og_email"    ] = $_SESSION["installer_email"    ] ?? "";
    $_SESSION["installer_og_gender"   ] = $_SESSION["installer_gender"   ] ?? "";
    $_SESSION["installer_og_firstname"] = $_SESSION["installer_firstname"] ?? "";
    $_SESSION["installer_og_lastname" ] = $_SESSION["installer_lastname" ] ?? "";
    $_SESSION["installer_og_company"  ] = $_SESSION["installer_company"  ] ?? "";
    $_SESSION["installer_og_telephone"] = $_SESSION["installer_telephone"] ?? "";
    $_SESSION["installer_og_country"  ] = $_SESSION["installer_country"  ] ?? "";
}




// Define string helpers

$genderMap = [
    "0" => t("ci_gender_mr"),
    "1" => t("ci_gender_ms"),
];

$objDeviceStandards = [
    "0" => "Unknown",
    "1" => "VDE0126",
    "2" => "VDE4105",
    "3" => "TOR",
    "4" => "EN50438",
    "5" => "EN50549",
    "6" => "Sweden",
    "7" => "Belgium",
    "8" => "Czech",
    "9" => "Estonia"
];





// Define function helpers

// Session value helper
function sv($key) { return isset($_SESSION[$key]) ? $_SESSION[$key] : ""; }

// Gender helper
function genderDisplay($val) {
    global $genderMap;
    return isset($genderMap[$val]) ? $genderMap[$val] : "";
}

// Country display from flat lang keys (returns raw text — caller must escape at output)
function countryDisplay($code) {
    return $code ? tRaw("country_" . strtolower($code)) : "";
}

// kWp formatter (up to 2 decimals, trailing zeros stripped — matches JS toLocaleString({maximumFractionDigits:2}))
function formatKwp($wp) {
    $kwp = $wp / 1000;
    return rtrim(rtrim(number_format($kwp, 2, '.', ''), '0'), '.');
}

// HHMM int → "HH:MM" (2200 → "22:00")
function formatHHMM($hhmm) {
    $v = intval($hhmm);
    return sprintf("%02d:%02d", intdiv($v, 100), $v % 100);
}

// Serial number pairs helper: groups SNs 2 per line
function formatSNPairs($raw, $perLine = 2) {
    $arr = array_values(array_filter(array_map('trim', preg_split('/[\n,]+/', $raw))));
    $lines = [];
    for ($i = 0; $i < count($arr); $i += $perLine) {
        $lines[] = implode(", ", array_slice($arr, $i, $perLine));
    }
    return implode("\n", $lines);
}




// Fetch live settings
$dataSettings = json_decode(@file_get_contents("http://localhost/api.php?get=settings"), true) ?: [];

// Backup mode from live settings
$backupMode = (isset($dataSettings["SystemMode"]["0"]["mode"]) && $dataSettings["SystemMode"]["0"]["mode"] == "1");

// Grid standard flags (read from live settings — Inverter[201][s1])
$gridStandard = isset($dataSettings["Inverter"]["201"]["s1"]) ? $dataSettings["Inverter"]["201"]["s1"] : "0";
$isVde4105    = ($gridStandard == "2");
$isTor        = ($gridStandard == "3");
$isEstonia    = ($gridStandard == "9");

// Grid standard display name
$pdfGridStandard = isset($objDeviceStandards[$gridStandard]) ? $objDeviceStandards[$gridStandard] : "";

// Battery type
$batteryType = isset($_SESSION["battery_type"]) ? $_SESSION["battery_type"] : "";
if($batteryType == "other" && (empty($_SESSION["battery_capacity"]) || $_SESSION["battery_capacity"] == "0")) $batteryType = "";

// Is Clix
$isClix = isset(PNS_BOX[sv("box_partnumber")]["type"]) && PNS_BOX[sv("box_partnumber")]["type"] == "xc";

// Device partnumber
$devicePartnumber = isset($_SESSION["device_partnumber"]) ? $_SESSION["device_partnumber"] : "";

// Live settings display values (SYSTEM + SOLAR sections)
$solBxWp    = isset($dataSettings["NominalSol"   ]["0"]["v1"]) ? intval($dataSettings["NominalSol"   ]["0"]["v1"]) : 0;
$solExtWp   = isset($dataSettings["NominalExtSol"]["0"]["v1"]) ? intval($dataSettings["NominalExtSol"]["0"]["v1"]) : 0;
$injPowerWp = isset($dataSettings["InjectionMode"]["0"]["v1"]) ? intval($dataSettings["InjectionMode"]["0"]["v1"]) : 0;
$totalSolWp = $solBxWp + $solExtWp;

// Solar strings (batterx)
$batterxStrings = [];
foreach([1, 2, 3, 4, 5, 6, 7, 8] as $entity) {
    $str = $dataSettings["ForecastSolar"][$entity] ?? null;
    if($str && intval($str["v1"] ?? 0) > 0)
        $batterxStrings[] = ["num" => $entity, "v1" => intval($str["v1"]), "v2" => intval($str["v2"] ?? 0), "v3" => intval($str["v3"] ?? 0)];
}

// Solar strings (external)
$externalStrings = [];
foreach([101, 102, 103, 104, 105, 106, 107, 108] as $entity) {
    $str = $dataSettings["ForecastSolar"][$entity] ?? null;
    if($str && intval($str["v1"] ?? 0) > 0)
        $externalStrings[] = ["num" => $entity - 100, "v1" => intval($str["v1"]), "v2" => intval($str["v2"] ?? 0), "v3" => intval($str["v3"] ?? 0)];
}

// Other solar parameters
$feedinPct = $totalSolWp > 0 ? (int)round($injPowerWp / $totalSolWp * 100) : 0;
$wideInput = isset($dataSettings["SystemMode"]["0"]["v4"]) && $dataSettings["SystemMode"]["0"]["v4"] == "1";
$hasExtSol = (isset($dataSettings["ModbusExtSolarDevice"]["0"]["mode"]) && $dataSettings["ModbusExtSolarDevice"]["0"]["mode"] == "1");

// Check if has solar wide input range
$inverterModel   = $dataSettings["Inverter"]["1"]["s1"] ?? "";
$firmwareVersion = $dataSettings["Inverter"]["3"]["s1"] ?? "";
$hasSolarWideInputRange = $inverterModel == "10002" && substr(explode(',', $firmwareVersion)[0], 4) >= "23-11-15";

// Extended parameters
$hasLfsmoDroop = sv("extended_lfsmoDroop") !== "";
$hasLfsmoSlope = sv("extended_lfsmoSlope") !== "";




// Pre-composed strings shared between HTML rendering and the PDF (JS reads via json_encode($pdfData))

$pdfData = [];

// Installation

$pdfData["installation_date"] = sv("installation_date");

$pdfData["latest_maintenance"] = date("Y-m-d");

$pdfData["installation_address"] = sv("installation_address");
$pdfData["installation_address"] .= "\n" . sv("installation_zipcode") . " " . sv("installation_city") . ", " . countryDisplay(sv("installation_country"));

// Installer

$pdfData["installer_og"] = genderDisplay(sv("installer_og_gender")) . " " . sv("installer_og_firstname") . " " . sv("installer_og_lastname") . (sv("installer_og_company") ? " (" . sv("installer_og_company") . ")" : "");

$pdfData["installer_og_email"] = sv("installer_og_email");

$pdfData["installer_og_telephone"] = sv("installer_og_telephone");

$pdfData["installer_on_site"] = sv("installer_on_site");

$pdfData["installer_for_commissioning"] = "";
if(sv("installer_og_email") !== sv("installer_email")) { // not the same installer
    $pdfData["installer_for_commissioning"] = genderDisplay(sv("installer_gender")) . " " . sv("installer_firstname") . " " . sv("installer_lastname") . (sv("installer_company") ? " (" . sv("installer_company") . ")" : "");
    $pdfData["installer_for_commissioning"] .= "\n" . "• " . tRaw("is_email") . ": " . sv("installer_email");
    $pdfData["installer_for_commissioning"] .= "\n" . "• " . tRaw("is_telephone") . ": " . sv("installer_telephone");
}

// Installer memo — removed from summary (may contain installer-only info; customer will see this doc in future)
// $pdfData["installer_memo"] = sv("note");

// Customer

$pdfData["customer_name"] = genderDisplay(sv("customer_gender")) . " " . sv("customer_firstname") . " " . sv("customer_lastname");

$pdfData["customer_company"] = sv("customer_company");

$pdfData["customer_email"] = sv("customer_email");

$pdfData["customer_telephone"] = sv("customer_telephone");

$pdfData["customer_address"] = sv("customer_address");
$pdfData["customer_address"] .= "\n" . sv("customer_zipcode") . " " . sv("customer_city") . ", " . countryDisplay(sv("customer_country"));

// System

$pdfData["system_name"] = sv("system_model");
if($isVde4105) $pdfData["system_name"] .= "\n(" . tRaw("is_system_note_vde4105") . ")";
if($isTor)     $pdfData["system_name"] .= "\n(" . tRaw("is_system_note_tor")     . ")";

$pdfData["system_mode"] = $backupMode ? tRaw("is_system_mode_backup") : tRaw("is_system_mode_ups");

$pdfData["system_sn_label"]  = $isClix ? tRaw("is_system_sn_cabinet") : tRaw("is_system_sn");
$pdfData["system_sn_is_new"] = sv("system_serial") == "NEW";
$pdfData["system_sn"]        = $pdfData["system_sn_is_new"] ? tRaw("is_system_sn_new") : sv("system_serial");

$pdfData["inverter_sn"] = ($dataSettings["Inverter"]["2"]["s1"] ?? "") . " (" . PNS_DEVICE[$devicePartnumber]["name"] . ") (" . $devicePartnumber . ") (" . $pdfGridStandard . ")";

$pdfData["nominal_power"] = isset(PNS_DEVICE[$devicePartnumber]["rated_power"]) ? formatKwp(PNS_DEVICE[$devicePartnumber]["rated_power"]) . " kW" : "";

$pdfData["box_sn_label"] = $boxType == "livex" ? tRaw("is_box_sn_livex") : tRaw("is_box_sn_emx");
$pdfData["box_sn"]       = sv("box_serial") . " (" . PNS_BOX[sv("box_partnumber")]["name"] . ") (" . sv("box_partnumber") . ") (" . sv("software_version") . ")";

$pdfData["grid_fuse"] = isset($dataSettings["SystemMode"]["0"]["v5"]) && intval($dataSettings["SystemMode"]["0"]["v5"]) > 0 ? $dataSettings["SystemMode"]["0"]["v5"] . " A" : "";

// Controllable Load

// GridOperatorControl[0]: mode = connection, v1 = §14a consumption, v2 = §9 EEG generation, v3 = Pmin (W, 0 = not set → 4200)
$goc        = $dataSettings["GridOperatorControl"]["0"] ?? [];
$gocMode    = intval($goc["mode"] ?? 0);
$gocWallbox = intval($dataSettings["EVCharger"]["1"]["v6"] ?? 0) === 1; // §14a limit applies to the batterX wallbox

$connectionMap = [
    0 => tRaw("is_steuve_not_connected"),
    1 => "FNN-2Bit",
    2 => tRaw("is_steuve_terminal_strip"),
];
$pdfData["steuve_connection"] = $connectionMap[$gocMode] ?? (string) $gocMode;
$pdfData["steuve_connected"]  = $gocMode > 0; // gates the two control rows

$pdfData["steuve_generation"] = intval($goc["v2"] ?? 0) === 1 ? tRaw("is_enabled") : tRaw("is_disabled");

if(intval($goc["v1"] ?? 0) === 1) {
    $pminW = intval($goc["v3"] ?? 0);
    $pdfData["steuve_consumption"] = implode("\n", [
        tRaw("is_enabled"),
        tRaw("is_steuve_device_count") . " = " . ($gocWallbox ? "2" : "1"),
        tRaw("is_steuve_pmin")         . " = " . formatKwp($pminW > 0 ? $pminW : 4200) . " kW",
    ]);
} else {
    $pdfData["steuve_consumption"] = tRaw("is_disabled");
}

// Solar

$pdfData["pv_size_batterx"] = formatKwp($solBxWp) . " kWp";

$pdfData["pv_strings_batterx"] = [];
foreach($batterxStrings as $s) {
    $pdfData["pv_strings_batterx"][] = [
        "power"  => formatKwp($s["v1"]) . " kWp",
        "decl"   => $s["v2"] . "°",
        "orient" => $s["v3"] . "°",
    ];
}

$pdfData["show_external_solar"] = $solExtWp > 0 || count($externalStrings) > 0 || $hasExtSol;

$pdfData["pv_size_external"] = formatKwp($solExtWp) . " kWp";

$pdfData["pv_strings_external"] = [];
foreach($externalStrings as $s) {
    $pdfData["pv_strings_external"][] = [
        "power"  => formatKwp($s["v1"]) . " kWp",
        "decl"   => $s["v2"] . "°",
        "orient" => $s["v3"] . "°",
    ];
}

$pdfData["grid_feedin_limitation"] = $feedinPct . "% (" . formatKwp($injPowerWp) . " kW)";

$pdfData["ext_solar_meter"] = $hasExtSol ? tRaw("is_connected") : tRaw("is_not_connected");

$pdfData["show_wide_solar_input_range"] = $wideInput || $hasSolarWideInputRange;
$pdfData["wide_solar_input_range"]      = $wideInput ? tRaw("is_enabled") : tRaw("is_disabled");

$pdfData["solar_info"] = sv("solar_info");

// Battery

$pdfData["battery_type"] = $batteryType;

if($batteryType !== "") {
    $pdfData["battery_capacity"] = round(intval(sv("battery_capacity")) / 1000, 1) . " kWh";
}

if($batteryType === "lifepo") {
    $pdfData["battery_bms_sn"]    = sv("battery_bms")           ? formatSNPairs(sv("battery_bms"))           : "";
    $pdfData["battery_module_sn"] = sv("battery_serialnumbers") ? formatSNPairs(sv("battery_serialnumbers")) : "";
}

if($batteryType === "carbon") {
    // "12x LC+1300" style (batteries × strings)
    $pdfData["battery_model"] = "";
    if(sv("battery_model") && sv("battery_strings")) {
        $pdfData["battery_model"] = (intval(sv("battery_strings")) * (sv("battery_model") == "LC+2V500" ? 24 : 4)) . "x " . sv("battery_model");
    }
}

if($batteryType === "other") {
    // Pre-formatted "N A" / "N V" strings (or "— A/V" when missing)
    $otherReg = function($id, $unit) use ($dataSettings) {
        return isset($dataSettings["Inverter"][$id]["s1"])
            ? round(intval($dataSettings["Inverter"][$id]["s1"]) / 100, 2) . " " . $unit
            : "— " . $unit;
    };
    $pdfData["battery_max_charging_current"]       = $otherReg("417", "A");
    $pdfData["battery_max_discharging_current"]    = $otherReg("418", "A");
    $pdfData["battery_bulk_charging_voltage"]      = $otherReg("415", "V");
    $pdfData["battery_float_charging_voltage"]     = $otherReg("416", "V");
    $pdfData["battery_cutoff_voltage_hybrid"]      = $otherReg("411", "V");
    $pdfData["battery_redischarge_voltage_hybrid"] = $otherReg("413", "V");
    $pdfData["battery_cutoff_voltage"]             = $otherReg("412", "V");
    $pdfData["battery_redischarge_voltage"]        = $otherReg("414", "V");
}

// Grid Parameters

$pdfData["reactive_power_supply"] = "";
if($isVde4105 || $isTor || $isEstonia) {
    switch(sv("reactive_mode")) {
        case "1":
            $pdfData["reactive_power_supply"] =
                tRaw("is_reactive_mode_1") . "\n" .
                tRaw("is_reactive_kinkpoint") . " = 0." . sv("reactive_kink");
            break;
        case "2":
            $cosphi = sv("reactive_cosphi");
            if($cosphi == "100") {
                $pdfData["reactive_power_supply"] = tRaw("is_reactive_mode_2") . " = 1.00";
            } else {
                $sign = intval($cosphi) < 0 ? " = -0." : " = 0.";
                $pdfData["reactive_power_supply"] = tRaw("is_reactive_mode_2") . $sign . abs(intval($cosphi));
            }
            break;
        case "3":
            $qmax = round(floatval(sv("reactive_qmaxsn")), 3);
            $pdfData["reactive_power_supply"] =
                tRaw("is_reactive_mode_3") . "\n" .
                "U1 = " . sv("reactive_v1") . "%   U2 = " . sv("reactive_v2") . "%   U3 = " . sv("reactive_v3") . "%   U4 = " . sv("reactive_v4") . "%\n" .
                "Qmax/Sn = " . $qmax . "   -Qmax/S = -" . $qmax . "\n" .
                tRaw("is_reactive_minimum_cosphi") . " = 0.4   " . tRaw("is_reactive_qutime") . " = " . sv("reactive_qutime") . " sec";
            break;
        case "4":
            $pdfData["reactive_power_supply"] = tRaw("is_reactive_mode_4") . " = " . sv("reactive_qfix") . " VAR";
            break;
        default:
            $pdfData["reactive_power_supply"] = tRaw("is_reactive_mode_2") . " = 1.00";
            break;
    }
}

$pdfData["lfsmo"] = "";
if(sv("extended_lfsmoThreshold")) {
    $lfsmoLines = [tRaw("is_enabled")];
    $lfsmoLines[] = tRaw("is_start_of_power_reduction") . " = " . round(intval(sv("extended_lfsmoThreshold")) / 100, 1) . " Hz";
    if($hasLfsmoDroop) $lfsmoLines[] = tRaw("is_droop")    . " = " . round(intval(sv("extended_lfsmoDroop")) / 100, 1) . "%";
    if($hasLfsmoSlope) $lfsmoLines[] = tRaw("is_gradient") . " = " . round(intval(sv("extended_lfsmoSlope")), 0) . "% PN/Hz";
    $pdfData["lfsmo"] = implode("\n", $lfsmoLines);
}

$pdfData["overvoltage_reduction"] = "";
if($isTor) {
    $pdfData["overvoltage_reduction"] =
        tRaw("is_enabled") . "\n" .
        tRaw("is_start_point") . " = 110 [% Un]\n" .
        tRaw("is_end_point")   . " = 112 [% Un]\n" .
        tRaw("is_pu_time")     . " = " . sv("extended_puTime") . " sec";
}

$pdfData["lvrt"] = "";
if($isTor) {
    $lvrtPoints = ($boxType == "livex")
        ? ["LVRT Point 1 = 0.30 Un / 0.15 sec",
           "LVRT Point 2 = 0.75 Un / 0.40 sec",
           "LVRT Point 3 = 0.85 Un / 0.95 sec"]
        : ["LVRT Point 1 = 0.15 Un / 0.15 sec",
           "LVRT Point 2 = 0.30 Un / 0.40 sec",
           "LVRT Point 3 = 0.50 Un / 0.80 sec",
           "LVRT Point 4 = 0.75 Un / 1.25 sec",
           "LVRT Point 5 = 0.85 Un / 1.50 sec"];
    $pdfData["lvrt"] = tRaw("is_enabled") . "\n" . implode("\n", $lvrtPoints);
}

$pdfData["grid_connection"] = "";
if($isTor) {
    $pdfData["grid_connection"] =
        tRaw("is_max_grid_voltage")   . " = " . sv("extended_maxGridVoltage")   . " V\n"  .
        tRaw("is_min_grid_voltage")   . " = " . sv("extended_minGridVoltage")   . " V\n"  .
        tRaw("is_max_grid_frequency") . " = " . sv("extended_maxGridFrequency") . " Hz\n" .
        tRaw("is_min_grid_frequency") . " = " . sv("extended_minGridFrequency") . " Hz";
}

$pdfData["grid_decoupling"] = "";
if($isTor) {
    $gdLines = [];
    $gdLines[] = "Ueff > = "  . sv("extended_UeffOver1")  . " V ("  . sv("extended_UeffOver1Time")  . " s)";
    $gdLines[] = "Ueff < = "  . sv("extended_UeffUnder1") . " V ("  . sv("extended_UeffUnder1Time") . " s)";
    $gdLines[] = "Ueff >> = " . sv("extended_UeffOver2")  . " V ("  . sv("extended_UeffOver2Time")  . " s)";
    $gdLines[] = "Ueff << = " . sv("extended_UeffUnder2") . " V ("  . sv("extended_UeffUnder2Time") . " s)";
    $gdLines[] = "f > = "     . sv("extended_fOver1")     . " Hz (" . sv("extended_fOver1Time")     . " s)";
    $gdLines[] = "f < = "     . sv("extended_fUnder1")    . " Hz (" . sv("extended_fUnder1Time")    . " s)";
    $gdLines[] = tRaw("is_ueff")               . " = " . sv("extended_Ueff")             . " V";
    $gdLines[] = tRaw("is_grid_connect_delay") . " = " . sv("extended_gridConnectDelay") . " sec";
    if($boxType != "livex") {
        $gdLines[] = tRaw("is_grid_reconnect_delay") . " = " . sv("extended_gridReconnectDelay") . " sec";
    }
    $pdfData["grid_decoupling"] = implode("\n", $gdLines);
}

$pdfData["extended_parameters"] = "";
if($isEstonia) {
    $epLines = [];
    $epLines[] = "Ueff > = 1.11 Un";
    $epLines[] = "Ueff < = 0.85 Un";
    $epLines[] = "Ueff >> = 1.15 Un";
    $epLines[] = "Ueff << = 0.20 Un";
    $epLines[] = "f > = 51.6 Hz";
    $epLines[] = "f < = 47.4 Hz";
    $epLines[] = tRaw("is_max_grid_voltage")   . " = 264.5 V";
    $epLines[] = tRaw("is_min_grid_voltage")   . " = 195.5 V";
    $epLines[] = tRaw("is_max_grid_frequency") . " = 52.0 Hz";
    $epLines[] = tRaw("is_min_grid_frequency") . " = 47.0 Hz";
    $pdfData["extended_parameters"] = implode("\n", $epLines);
}

// Wallbox (EV Charger)

$pdfData["wallbox_show"] = false;
$evcMode = intval($dataSettings["EVCharger"]["1"]["mode"] ?? 0);
if($evcMode > 0) {
    $pdfData["wallbox_show"] = true;

    // Producer / Model
    $pdfData["wallbox_producer"] = $dataSettings["EVCharger"]["1"]["s2"] ?? "";

    // Serial number
    $pdfData["wallbox_serial"] = $dataSettings["EVChargerInfo"]["1"]["s1"] ?? "";

    // Network Configuration — IP + Port, one per line
    $pdfData["wallbox_network"] =
        tRaw("is_ip_address") . " = " . ($dataSettings["EVChargerModbus"]["1"]["s1"] ?? "") . "\n" .
        tRaw("is_port")       . " = " . ($dataSettings["EVChargerModbus"]["1"]["v1"] ?? "");

    // Electrical Wiring — 4 rows, one per line
    $wiringMap = [
        "0" => tRaw("is_evc_wiring_3phase"),
        "1" => tRaw("is_evc_wiring_l1"),
        "2" => tRaw("is_evc_wiring_l2"),
        "3" => tRaw("is_evc_wiring_l3"),
    ];
    $phaseMap = [
        "0" => tRaw("is_evc_phase_auto"),
        "1" => tRaw("is_evc_phase_1phase"),
        "3" => tRaw("is_evc_phase_3phase"),
    ];
    $wiring    = $dataSettings["EVCharger"]["1"]["v3"] ?? "0";
    $phaseMode = $dataSettings["EVCharger"]["1"]["v4"] ?? "0";
    $minCur    = round(intval($dataSettings["EVCharger"]["1"]["v1"] ?? 600)  / 100);
    $maxCur    = round(intval($dataSettings["EVCharger"]["1"]["v2"] ?? 1600) / 100);
    $pdfData["wallbox_electrical"] =
        tRaw("is_physical_wiring") . " = " . ($wiringMap[$wiring]   ?? "") . "\n" .
        tRaw("is_phase_switching") . " = " . ($phaseMap[$phaseMode] ?? "") . "\n" .
        tRaw("is_min_current")     . " = " . $minCur . " A\n" .
        tRaw("is_max_current")     . " = " . $maxCur . " A";

    // §14a limit (EVCharger[1].v6) — VDE4105 only, "" hides the row
    $pdfData["wallbox_steuve_limit"] = $isVde4105 ? ($gocWallbox ? tRaw("is_enabled") : tRaw("is_disabled")) : "";
}

// Generator

$generator     = $dataSettings["Generator"]["0"] ?? null;
$generatorMode = intval($generator["mode"] ?? 0);
$pdfData["generator_show"] = !empty(PNS_DEVICE[sv("device_partnumber")]["generator"] ?? false) && $generator !== null && $generatorMode > 0;
if($pdfData["generator_show"]) {

    // Type
    $genTypeMap = [
        1 => tRaw("is_gen_type_mobile"),
        2 => tRaw("is_gen_type_stationary"),
        3 => tRaw("is_gen_type_offgrid"),
    ];
    $pdfData["generator_type"] = $genTypeMap[$generatorMode] ?? (string)$generatorMode;

    // Power — rated power + desired share (kVA in brackets)
    $ratedVa    = intval($generator["v1"] ?? 0);
    $desiredPct = intval($generator["v2"] ?? 0);
    $pdfData["generator_power"] =
        tRaw("is_gen_rated_power")   . " = " . formatKwp($ratedVa) . " kVA\n" .
        tRaw("is_gen_desired_power") . " = " . $desiredPct . " % (" . formatKwp($ratedVa * $desiredPct / 100) . " kVA)";

    // Automatic start — Stationary and Off-grid only
    $pdfData["generator_auto_start"] = "";
    if($generatorMode >= 2) {
        $genOutput     = intval($generator["v5"] ?? 0);
        $genOutputName = trim($dataSettings["BxOutPin"][$genOutput]["name"] ?? "");
        $pdfData["generator_auto_start"] =
            tRaw("is_gen_start_soc")   . " = " . intval($generator["v3"] ?? 0) . " %\n" .
            tRaw("is_gen_stop_soc")    . " = " . intval($generator["v4"] ?? 0) . " %\n" .
            tRaw("is_gen_gpio_output") . " = " . tRaw("is_gen_output") . " " . $genOutput . ($genOutputName !== "" ? " (" . $genOutputName . ")" : "");
    }

    // Quiet time — Off-grid only, when the row exists; SoC 0 = off
    $pdfData["generator_quiet"] = "";
    $genQuiet = $dataSettings["GeneratorQuiet"]["0"] ?? null;
    if($generatorMode === 3 && $genQuiet !== null) {
        if(intval($genQuiet["mode"] ?? 0) === 1) {
            $genQuietSoc = function($v) { return intval($v) > 0 ? intval($v) . " %" : tRaw("is_disabled"); };
            $pdfData["generator_quiet"] =
                tRaw("is_enabled") . "\n" .
                tRaw("is_gen_quiet_start")         . " = " . formatHHMM($genQuiet["v1"] ?? 0) . "\n" .
                tRaw("is_gen_quiet_end")           . " = " . formatHHMM($genQuiet["v2"] ?? 0) . "\n" .
                tRaw("is_gen_quiet_target_soc")    . " = " . $genQuietSoc($genQuiet["v3"] ?? 0) . "\n" .
                tRaw("is_gen_quiet_emergency_soc") . " = " . $genQuietSoc($genQuiet["v4"] ?? 0);
        } else {
            $pdfData["generator_quiet"] = tRaw("is_disabled");
        }
    }

    // Generator info (free text from setup)
    $pdfData["generator_info"] = sv("generator_info");
}

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/installation_summary.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5<?php echo !empty($_SESSION["installation_finished"]) ? " success-shown" : ""; ?>">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">


        <h1 id="pageTitle" class="mb-4"><?php echo t("is_title"); ?></h1>


        <!-- Summary Card -->
        <div class="card text-start mb-5" id="summaryCard">
            <div class="card-body p-0">
                <div id="summary" class="p-4">

                    <!-- Header -->
                    <div class="is-header">
                        <span class="is-header-title"><?php echo t("is_title"); ?></span>
                        <img src="img/batterx_logo.png" class="is-header-logo" alt="batterX">
                    </div>

                    <!-- Installation -->
                    <div class="is-section-head"><?php echo t("is_section_installation"); ?></div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_installation_date"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["installation_date"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_latest_maintenance"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["latest_maintenance"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_installation_address"); ?></span>
                        <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["installation_address"]); ?></span>
                    </div>

                    <!-- Installer -->
                    <div class="is-section-head"><?php echo t("is_section_installer"); ?></div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_company"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["installer_og"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_email"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["installer_og_email"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_telephone"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["installer_og_telephone"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_technician_on_site"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["installer_on_site"]); ?></span>
                    </div>
                    <?php if($pdfData["installer_for_commissioning"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_installer_for_commissioning"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["installer_for_commissioning"]); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php /* Installer memo — removed from summary (may contain installer-only info; customer will see this doc in future) ?>
                    <?php if($pdfData["installer_memo"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_installer_memo"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["installer_memo"]); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php */ ?>

                    <!-- Customer -->
                    <div class="is-section-head"><?php echo t("is_section_customer"); ?></div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_name"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["customer_name"]); ?></span>
                    </div>
                    <?php if($pdfData["customer_company"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_company"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["customer_company"]); ?></span>
                        </div>
                    <?php endif; ?>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_email"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["customer_email"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_telephone"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["customer_telephone"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_address"); ?></span>
                        <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["customer_address"]); ?></span>
                    </div>

                    <!-- System -->
                    <div class="is-section-head"><?php echo t("is_section_system"); ?></div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_system_name"); ?></span>
                        <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["system_name"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_system_mode"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["system_mode"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo htmlspecialchars($pdfData["system_sn_label"]); ?></span>
                        <span class="is-value" id="is_system_sn"><?php echo $pdfData["system_sn_is_new"] ? '<i class="text-muted">' . htmlspecialchars($pdfData["system_sn"]) . '</i>' : htmlspecialchars($pdfData["system_sn"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_inverter_sn"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["inverter_sn"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_nominal_power"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["nominal_power"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo htmlspecialchars($pdfData["box_sn_label"]); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["box_sn"]); ?></span>
                    </div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_grid_fuse"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["grid_fuse"]); ?></span>
                    </div>

                    <!-- Battery -->
                    <?php if($pdfData["battery_type"] !== ""): ?>
                        <div class="is-section-head"><?php echo t("is_section_battery"); ?></div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_battery_capacity"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_capacity"]); ?></span>
                        </div>
                        <?php if($pdfData["battery_type"] === "lifepo"): ?>
                            <?php if($pdfData["battery_bms_sn"] !== ""): ?>
                                <div class="is-row">
                                    <span class="is-label"><?php echo t("is_bms_module_sn"); ?></span>
                                    <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["battery_bms_sn"]); ?></span>
                                </div>
                            <?php endif; ?>
                            <?php if($pdfData["battery_module_sn"] !== ""): ?>
                                <div class="is-row">
                                    <span class="is-label"><?php echo t("is_battery_module_sn"); ?></span>
                                    <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["battery_module_sn"]); ?></span>
                                </div>
                            <?php endif; ?>
                        <?php elseif($pdfData["battery_type"] === "carbon"): ?>
                            <?php if($pdfData["battery_model"] !== ""): ?>
                                <div class="is-row">
                                    <span class="is-label"><?php echo t("is_battery_model"); ?></span>
                                    <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_model"]); ?></span>
                                </div>
                            <?php endif; ?>
                        <?php elseif($pdfData["battery_type"] === "other"): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_max_charging_current"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_max_charging_current"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_max_discharging_current"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_max_discharging_current"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_bulk_charging_voltage"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_bulk_charging_voltage"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_float_charging_voltage"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_float_charging_voltage"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_cutoff_voltage_hybrid"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_cutoff_voltage_hybrid"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_redischarge_voltage_hybrid"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_redischarge_voltage_hybrid"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_cutoff_voltage"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_cutoff_voltage"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_redischarge_voltage"); ?></span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["battery_redischarge_voltage"]); ?></span>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <!-- Solar -->
                    <div class="is-section-head"><?php echo t("is_section_solar"); ?></div>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_pv_size_batterx"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["pv_size_batterx"]); ?></span>
                    </div>
                    <?php if(count($pdfData["pv_strings_batterx"]) > 0): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_pv_strings_batterx"); ?></span>
                            <span class="is-value">
                                <table class="pv-strings">
                                    <thead>
                                        <tr>
                                            <th><?php echo t("is_power"); ?></th>
                                            <th><?php echo t("is_declination"); ?></th>
                                            <th><?php echo t("is_orientation"); ?></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach($pdfData["pv_strings_batterx"] as $s): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($s["power"]);  ?></td>
                                            <td><?php echo htmlspecialchars($s["decl"]);   ?></td>
                                            <td><?php echo htmlspecialchars($s["orient"]); ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </span>
                        </div>
                    <?php else: ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_pv_strings_batterx"); ?></span>
                            <span class="is-value"><?php echo t("is_not_configured"); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php if($pdfData["show_external_solar"]): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_pv_size_external"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["pv_size_external"]); ?></span>
                        </div>
                        <?php if(count($pdfData["pv_strings_external"]) > 0): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_pv_strings_external"); ?></span>
                                <span class="is-value">
                                    <table class="pv-strings">
                                        <thead>
                                            <tr>
                                                <th><?php echo t("is_power"); ?></th>
                                                <th><?php echo t("is_declination"); ?></th>
                                                <th><?php echo t("is_orientation"); ?></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach($pdfData["pv_strings_external"] as $s): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($s["power"]);  ?></td>
                                                    <td><?php echo htmlspecialchars($s["decl"]);   ?></td>
                                                    <td><?php echo htmlspecialchars($s["orient"]); ?></td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </span>
                            </div>
                        <?php else: ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_pv_strings_external"); ?></span>
                                <span class="is-value"><?php echo t("is_not_configured"); ?></span>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>
                    <div class="is-row">
                        <span class="is-label"><?php echo t("is_grid_feedin_limitation"); ?></span>
                        <span class="is-value"><?php echo htmlspecialchars($pdfData["grid_feedin_limitation"]); ?></span>
                    </div>
                    <?php if($pdfData["show_external_solar"]): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_ext_solar_meter"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["ext_solar_meter"]); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php if($pdfData["show_wide_solar_input_range"]): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_wide_solar_input_range"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["wide_solar_input_range"]); ?></span>
                        </div>
                    <?php endif; ?>
                    <?php if($pdfData["solar_info"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_solar_info"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["solar_info"]); ?></span>
                        </div>
                    <?php endif; ?>

                    <!-- Controllable Load -->
                    <?php if($isVde4105): ?>
                        <div class="is-section-head"><?php echo t("is_section_controllable_load"); ?></div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_steuve_connection"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["steuve_connection"]); ?></span>
                        </div>
                        <?php if($pdfData["steuve_connected"]): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_steuve_generation_unit"); ?> (§9 EEG)</span>
                                <span class="is-value"><?php echo htmlspecialchars($pdfData["steuve_generation"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_steuve_consumption_device"); ?> (§14a EnWG)</span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["steuve_consumption"]); ?></span>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <!-- Grid Parameters -->
                    <?php if($isVde4105 || $isTor || $isEstonia): ?>
                        <div class="is-section-head"><?php echo t("is_section_grid"); ?></div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_reactive_power_supply"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["reactive_power_supply"]); ?></span>
                        </div>
                        <?php if($pdfData["lfsmo"] !== ""): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_active_power_reduction_overfreq"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["lfsmo"]); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if($isTor): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_power_reduction_overvoltage"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["overvoltage_reduction"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_lvrt"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["lvrt"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_grid_connection_conditions"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["grid_connection"]); ?></span>
                            </div>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_grid_decoupling_protection"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["grid_decoupling"]); ?></span>
                            </div>
                        <?php endif; ?>
                        <?php if($isEstonia): ?>
                            <div class="is-row">
                                <span class="is-label"><?php echo t("is_extended_parameters"); ?></span>
                                <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["extended_parameters"]); ?></span>
                            </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <!-- Wallbox (EV Charger) -->
                    <?php if($pdfData["wallbox_show"]): ?>
                        <div class="is-section-head"><?php echo t("is_section_wallbox"); ?></div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_producer_model"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["wallbox_producer"]); ?></span>
                        </div>
                        <?php if($pdfData["wallbox_serial"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_serial_number"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["wallbox_serial"]); ?></span>
                        </div>
                        <?php endif; ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_network_configuration"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["wallbox_network"]); ?></span>
                        </div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_electrical_wiring"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["wallbox_electrical"]); ?></span>
                        </div>
                        <?php if($pdfData["wallbox_steuve_limit"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_evc_steuve_limit"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["wallbox_steuve_limit"]); ?></span>
                        </div>
                        <?php endif; ?>
                    <?php endif; ?>

                    <!-- Generator -->
                    <?php if($pdfData["generator_show"]): ?>
                        <div class="is-section-head"><?php echo t("is_section_generator"); ?></div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_gen_type"); ?></span>
                            <span class="is-value"><?php echo htmlspecialchars($pdfData["generator_type"]); ?></span>
                        </div>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_gen_power"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["generator_power"]); ?></span>
                        </div>
                        <?php if($pdfData["generator_auto_start"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_gen_auto_start"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["generator_auto_start"]); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if($pdfData["generator_quiet"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_gen_quiet_time"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["generator_quiet"]); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if($pdfData["generator_info"] !== ""): ?>
                        <div class="is-row">
                            <span class="is-label"><?php echo t("is_gen_info"); ?></span>
                            <span class="is-value" style="white-space: pre-wrap"><?php echo htmlspecialchars($pdfData["generator_info"]); ?></span>
                        </div>
                        <?php endif; ?>
                    <?php endif; ?>

                </div>
            </div>
        </div>


        <!-- Confirm Section -->
        <div id="confirmSection" class="text-start">
            <div class="form-check mb-3">
                <input type="checkbox" class="form-check-input" id="checkboxAccept1">
                <label class="form-check-label" for="checkboxAccept1">
                    <?php echo t("is_confirm_info"); ?>
                </label>
            </div>
            <div class="form-check mb-3">
                <input type="checkbox" class="form-check-input" id="checkboxAccept2">
                <label class="form-check-label" for="checkboxAccept2">
                    <?php echo $backupMode ? t("is_confirm_load_backup") : t("is_confirm_load_ups"); ?>
                </label>
            </div>
            <div class="form-check mb-4 mb-md-5">
                <input type="checkbox" class="form-check-input" id="checkboxAccept3">
                <label class="form-check-label" for="checkboxAccept3">
                    <?php echo t("is_confirm_userdocs"); ?>
                </label>
            </div>
            <div id="submitError" class="d-none alert alert-danger text-center mb-4" role="alert"></div>
            <button id="btn_finish" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple" style="visibility:hidden"><?php echo t("is_finish_installation"); ?></button>
        </div>


        <!-- Success Section (hidden initially) -->
        <div id="successSection" class="d-none">
            <div class="card text-start">
                <div class="card-body p-5">
                    <h1 class="text-success mb-4"><?php echo t("is_final_congratulations"); ?></h1>
                    <p class="mt-4"><?php echo t("is_final_text1"); ?></p>
                    <p><?php echo t("is_final_text2"); ?></p>
                    <p><?php echo t("is_final_text3"); ?></p>
                    <p class="mt-4"><?php echo t("is_final_text4"); ?>:<br>
                        <a href="https://batterx.app" target="_blank">batterx.app</a>
                    </p>
                    <p class="mt-4"><?php echo t("is_final_text5"); ?></p>
                    <button id="btn_download" class="btn btn-success btn-wide ripple mb-2">
                        <i class="bi bi-download me-2"></i><?php echo t("is_final_download_pdf"); ?>
                    </button>
                    <p class="mt-4"><?php echo t("is_final_text6"); ?></p>
                    <button id="btn_reboot" class="btn btn-primary btn-wide ripple">
                        <i class="bi bi-arrow-clockwise me-2"></i><?php echo $boxType == "livex" ? t("is_final_reboot_livex") : t("is_final_reboot_emx"); ?>
                    </button>
                    <div id="rebootStatus" class="text-muted d-none pt-2 mt-4"></div>
                </div>
            </div>
        </div>


    </div>




    <!-- Auth code: invisible 1.5rem trigger at bottom-left corner (same pattern as old installation_summary.php) -->
    <div id="authCodeTrigger" style="position:fixed;width:1rem;height:1rem;z-index:100;bottom:0;left:0;"></div>

    <!-- Modal: Auth Code (triggered by hidden corner click, not by Finish button) -->
    <div id="modalAuthCode" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center p-0">
                    <input type="password" class="form-control border-0 text-center p-4" id="authCodeInput"
                           placeholder="Enter batterX auth-code and press enter" autocomplete="off">
                </div>
            </div>
        </div>
    </div>




    <?php include_once "common/footer.php"; ?>

    <script>
        const dataObj              = <?php echo json_encode($_SESSION); ?>;
        const dataSettings         = <?php echo json_encode($dataSettings); ?>;
        const pdfData              = <?php echo json_encode($pdfData); ?>;
        const isVde4105            = <?php echo json_encode($isVde4105); ?>;
        const isTor                = <?php echo json_encode($isTor); ?>;
        const isEstonia            = <?php echo json_encode($isEstonia); ?>;
        const pdfConfirmLoad       = <?php echo json_encode($backupMode ? tRaw("is_confirm_load_final_backup") : tRaw("is_confirm_load_final_ups")); ?>;
        const pdfConfirmUserDocs   = <?php echo json_encode(tRaw("is_confirm_userdocs_final")); ?>;
        const attachmentPdfsB64    = <?php echo json_encode($attachmentPdfsB64); ?>;
    </script>

    <script src="js/installation_summary.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
