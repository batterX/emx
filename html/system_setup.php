<?php

// Include Base
include_once "common/base.php";
include_once "common/countries.php";

// Set Step
$step = 5;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




$gridStandard = $_SESSION["grid_standard"] ?? "";
$isVde4105    = $gridStandard === "2";
$isTor        = $gridStandard === "3";
$isEstonia    = $gridStandard === "9";

$customerEmail = $_SESSION["customer_email"] ?? "";

// Imported batterX Project (if any) — normalized to safe JS via json_encode round-trip
$importedProjectJs = "null";
if (!empty($_SESSION["imported_project"])) {
    $decoded = json_decode($_SESSION["imported_project"], true);
    if ($decoded !== null) $importedProjectJs = json_encode($decoded);
}

// Get Settings Table
$dataSettings = json_decode(file_get_contents("http://localhost/api.php?get=settings"), true);
$inverterModel = $dataSettings["Inverter"]["1"]["s1"];
$firmwareVersion = $dataSettings["Inverter"]["3"]["s1"];
$hasGridReconnectDelay = isset($dataSettings["Inverter"]["225"]);
$hasLfsmoDroop = isset($dataSettings["Inverter"]["349"]);
$isSinglePhase = $inverterModel == "10001";
$hasSolarWideInputRange = $inverterModel == "10002" && substr(explode(',', $firmwareVersion)[0], 4) >= "23-11-15";

// Get System Timezone (based on country)
$installationCountry = $_SESSION["installation_country"] ?? "de";

$systemTimezone = getTimezoneByCountry($installationCountry);
if(isset($dataSettings["SystemTimezone"]["0"]) && $dataSettings["SystemTimezone"]["0"]["mode"] == 1 && $dataSettings["SystemTimezone"]["0"]["s1"] != "") {
    $systemTimezone = $dataSettings["SystemTimezone"]["0"]["s1"]; // Manual Overwrite
}

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/system_setup.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">


        <h1 class="mb-4"><?php echo t("ss_title"); ?></h1>


        <!-- Section: Loading State -->
        <div id="systemLoading" class="card text-center p-4 p-md-5 mb-4">
            <div id="loadingStatusIcon">
                <div class="spinner-border text-success"></div>
            </div>
            <p id="loadingText" class="mt-3 mb-0"><?php echo t("ss_loading"); ?></p>
        </div>
        <button id="loadingReload" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none" onclick="location.reload()"><?php echo t("ss_reload"); ?></button>


        <!-- Section: Box Not Registered Error -->
        <div id="boxNotRegistered" class="card text-center p-4 p-md-5 mb-4 d-none">
            <div>
                <i class="bi bi-exclamation-circle-fill text-danger" style="font-size: 3rem; line-height: 1;"></i>
            </div>
            <p class="my-4 px-md-5"><?php echo $boxType === "livex" ? t("ss_livex_not_registered") : t("ss_emx_not_registered"); ?></p>
            <div class="px-md-5">
                <label class="form-label fw-bold text-muted mb-1">APIKEY</label>
                <input type="text" class="form-control text-center font-monospace" value="<?php echo $_SESSION["box_apikey"]; ?>" readonly>
            </div>
        </div>


        <!-- Section: System -->
        <div id="system" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-cpu"></i>
                    <?php echo t("ss_section_system"); ?>
                </div>

                <div class="card-body p-0">
                    <div class="p-4">
                        <!-- New/existing system toggle -->
                        <div>
                            <div class="form-check">
                                <input type="radio" id="system_radio_new" name="system_radio" class="form-check-input" value="new" checked>
                                <label class="form-check-label" for="system_radio_new"><?php echo t("ss_system_new"); ?></label>
                            </div>
                            <div class="form-check mt-1">
                                <input type="radio" id="system_radio_old" name="system_radio" class="form-check-input" value="old">
                                <label class="form-check-label" for="system_radio_old"><?php echo t("ss_system_old"); ?></label>
                            </div>
                        </div>
                        <!-- System SN -->
                        <div id="bx_system_section" class="mt-3 d-none">
                            <label id="bx_system_label" for="bx_system" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_system_serialnumber"); ?></label>
                            <input id="bx_system" class="form-control text-uppercase" type="text" placeholder="<?php echo t("serialnumber"); ?>">
                            <div id="bx_system_error" class="text-danger small lh-sm mt-1 d-none"></div>
                        </div>
                    </div>
                    <div class="p-4 border-top">
                        <!-- Inverter SN -->
                        <div>
                            <label for="bx_device" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_inverter_serialnumber"); ?></label>
                            <input id="bx_device" class="form-control text-uppercase" type="text" placeholder="<?php echo t("serialnumber"); ?>" value="" disabled>
                        </div>
                        <!-- Box SN -->
                        <div class="mt-3">
                            <label for="bx_box" class="form-label text-muted lh-sm mb-1"><?php echo $boxType == "livex" ? t("ss_livex_serialnumber") : t("ss_emx_serialnumber"); ?></label>
                            <input id="bx_box" class="form-control text-uppercase" type="text" placeholder="<?php echo t("serialnumber"); ?>" value="" disabled>
                        </div>
                    </div>
                    <div class="p-4 border-top">
                        <!-- XC cliX v2 only: System Mode — hidden by default, shown by JS -->
                        <div id="bx_sysmode_section" class="mb-3 d-none">
                            <label for="bx_sysmode" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_system_mode"); ?></label>
                            <select id="bx_sysmode" class="form-select">
                                <option value="0"><?php echo t("ss_mode_ups"); ?></option>
                                <option value="1"><?php echo t("ss_mode_backup"); ?></option>
                            </select>
                        </div>
                        <!-- Grid Fuse Amps -->
                        <div>
                            <label for="bx_gridfuseamps" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_system_grid_fuse") ?></label>
                            <select id="bx_gridfuseamps" class="form-select">
                                <option value=""></option>
                                <option value="10">10 A</option>
                                <option value="16">16 A</option>
                                <option value="20">20 A</option>
                                <option value="25">25 A</option>
                                <option value="32">32 A</option>
                                <option value="35">35 A</option>
                                <option value="40">40 A</option>
                                <option value="50">50 A</option>
                                <option value="63">63 A</option>
                                <option value="80">80 A</option>
                                <option value="100">100 A</option>
                                <option value="125">125 A</option>
                                <option value="160">160 A</option>
                                <option value="200">200 A</option>
                                <option value="224">224 A</option>
                                <option value="250">250 A</option>
                                <option value="315">315 A</option>
                                <option value="355">355 A</option>
                                <option value="400">400 A</option>
                                <option value="500">500 A</option>
                                <option value="630">630 A</option>
                                <option value="800">800 A</option>
                                <option value="1000">1000 A</option>
                                <option value="1250">1250 A</option>
                                <option value="1600">1600 A</option>
                            </select>
                        </div>
                    </div>
                    <div class="px-4 py-2 border-top">
                        <!-- Installer Memo — always shown -->
                        <button id="btnInstallerMemo" type="button" class="btn btn-transparent text-uppercase d-block w-100 ripple" data-bs-toggle="modal" data-bs-target="#modalInstallerMemo"><small><b><?php echo t("ss_installer_memo"); ?></b></small></button>
                    </div>
                </div>

            </div>

            <button id="btnSystemImport" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none"><?php echo t("ss_import_cloud"); ?></button>

            <button id="btnSystemConfirm" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none" disabled><?php echo t("btn_continue"); ?></button>

            <div id="importProgress" class="text-center d-none">
                <div class="spinner-border text-success mb-2" role="status" style="--bs-spinner-border-width:0.2em;"></div>
                <p class="mb-1"><?php echo t("ss_importing_cloud"); ?></p>
                <p id="importProgressStep" class="text-muted mb-0" style="font-size:0.8em;">-</p>
            </div>

        </div>


        <!-- Section: Battery -->
        <div id="battery" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-battery-half"></i>
                    <?php echo t("ss_battery") ?>
                </div>

                <div class="card-body p-0">
                    <div class="p-4">

                        <div id="battery_radio_lifepo" class="form-check d-inline-block me-4">
                            <input type="radio" id="bx_battery_type_0" name="bx_battery_type" class="form-check-input" value="0" checked>
                            <label class="form-check-label" for="bx_battery_type_0"><?php echo t("ss_battery_lifepo") ?></label>
                        </div>
                        <div id="battery_radio_carbon" class="form-check d-inline-block me-4">
                            <input type="radio" id="bx_battery_type_1" name="bx_battery_type" class="form-check-input" value="1">
                            <label class="form-check-label" for="bx_battery_type_1"><?php echo t("ss_battery_carbon") ?></label>
                        </div>
                        <div id="battery_radio_other" class="form-check d-inline-block me-4">
                            <input type="radio" id="bx_battery_type_9" name="bx_battery_type" class="form-check-input" value="9">
                            <label class="form-check-label" for="bx_battery_type_9"><?php echo t("ss_battery_other") ?></label>
                        </div>
                        <div class="form-check d-inline-block">
                            <input type="radio" id="bx_battery_type_n" name="bx_battery_type" class="form-check-input" value="">
                            <label class="form-check-label" for="bx_battery_type_n"><?php echo t("ss_battery_none") ?></label>
                        </div>

                    </div>
                    <div id="battery_content" class="p-4 border-top">

                        <div id="battery_section_0">
                            <div id="lifepo_sn_read_delay" class="alert alert-primary small mb-3 d-none" role="alert">
                                <?php echo t("ss_lifepo_sn_read_delay") ?>
                                <div class="progress" style="margin-top: 0.75rem; height: 0.5rem;">
                                    <div id="lifepoSnProgressBar" class="progress-bar progress-bar-striped progress-bar-animated" style="width:0%;"></div>
                                </div>
                                <div id="lifepoSnProgressText" class="mt-1"></div>
                            </div>
                            <div id="lifepo_bms_section">
                                <label for="lifepo_bms" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_battery_bms_sn") ?></label>
                                <textarea id="lifepo_bms" class="form-control text-uppercase mb-3" placeholder="xxxxxxxxxxxxxxxx" rows="2"></textarea>
                            </div>
                            <div>
                                <label for="lifepo_serialnumbers" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_battery_module_sn") ?></label>
                                <textarea id="lifepo_serialnumbers" class="form-control text-uppercase" placeholder="xxxxxxxxxxxxxxxx&#10;" rows="10"></textarea>
                            </div>
                        </div>

                        <div id="battery_section_1" style="display: none">
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="carbon_battery_model"><?php echo t("ss_battery_carbon_model") ?></label>
                                <div class="col-6">
                                    <select id="carbon_battery_model" class="form-select">
                                        <option value="LC+700">LC+700 (4x12V)</option>
                                        <option value="LC+1300">LC+1300 (4x12V)</option>
                                        <option value="LC+2V500">LC+2V500 (24x2V)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row g-2 mb-4 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="carbon_battery_strings"><?php echo t("ss_battery_carbon_strings") ?></label>
                                <div class="col-6">
                                    <select id="carbon_battery_strings" class="form-select">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row g-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="carbon_battery_capacity"><?php echo t("ss_battery_capacity") ?></label>
                                <div class="col-6">
                                    <input id="carbon_battery_capacity" type="text" class="form-control" disabled>
                                </div>
                            </div>
                        </div>

                        <div id="battery_section_9" style="display: none">
                            <div class="row g-2 mb-4 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_capacity"><?php echo t("ss_battery_other_capacity") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_capacity" type="number" step="0.01" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">kWh</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_maxChargingCurrent"><?php echo t("ss_battery_max_charge_current") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_maxChargingCurrent" type="number" step="0.1" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">A</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-4 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_maxDischargingCurrent"><?php echo t("ss_battery_max_discharge_current") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_maxDischargingCurrent" type="number" step="1" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">A</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_bulkChargingVoltage"><?php echo t("ss_battery_bulk_voltage") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_bulkChargingVoltage" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-4 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_floatChargingVoltage"><?php echo t("ss_battery_float_voltage") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_floatChargingVoltage" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_cutoffVoltageHybrid"><?php echo t("ss_battery_cutoff_hybrid") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_cutoffVoltageHybrid" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_redischargeVoltageHybrid"><?php echo t("ss_battery_redischarge_hybrid") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_redischargeVoltageHybrid" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_cutoffVoltage"><?php echo t("ss_battery_cutoff") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_cutoffVoltage" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label class="col-6 col-form-label text-muted" for="other_battery_redischargeVoltage"><?php echo t("ss_battery_redischarge") ?></label>
                                <div class="col-4">
                                    <input id="other_battery_redischargeVoltage" type="number" step="0.1" max="60" class="form-control">
                                </div>
                                <div class="col-2">
                                    <span class="text-muted">V</span>
                                </div>
                            </div>
                        </div>

                        <div id="battery_section_n" style="display: none">
                            <!-- There's nothing here -->
                        </div>

                    </div>
                </div>

            </div>

            <button id="btn_battery_next" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none mt-3" disabled><?php echo t("btn_continue"); ?></button>

        </div>


        <!-- Section: Solar -->
        <div id="solar" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-sun"></i>
                    <?php echo t("ss_solar") ?>
                </div>

                <div class="card-body p-0">

                    <!-- PV System Sizes + Strings (two-column) -->
                    <div class="p-0">
                        <div class="row g-0">
                            <div id="batterx_col" class="col-md-8 border-md-end">

                                <div class="p-4">

                                    <!-- Left: batterX -->
                                     
                                    <div class="mb-3" style="font-size:1.125rem;"><?php echo t("ss_col_batterx_inverter"); ?></div>

                                    <label for="solar_wattpeak" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_solar_size"); ?></label>
                                    <div class="row g-2 mb-3 align-items-center">
                                        <div class="col-10"><input id="solar_wattpeak" type="number" step="0.01" min="0" class="form-control"></div>
                                        <div class="col-2"><span class="text-muted">kWp</span></div>
                                    </div>

                                    <a href="javascript:void(0)" id="batterx_strings_config_label" class="d-inline-block small mt-2"><?php echo t("ss_pv_strings_config"); ?></a>

                                    <div id="pv_string_1" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 1</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_1_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_1_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_1_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_1_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_1_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_1_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_2" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 2</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="2" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_2_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_2_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_2_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_2_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_2_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_2_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_3" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 3</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="3" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_3_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_3_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_3_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_3_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_3_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_3_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_4" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 4</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="4" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_4_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_4_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_4_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_4_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_4_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_4_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_5" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 5</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="5" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_5_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_5_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_5_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_5_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_5_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_5_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_6" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 6</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="6" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_6_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_6_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_6_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_6_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_6_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_6_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_7" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 7</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="7" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_7_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_7_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_7_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_7_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_7_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_7_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_8" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 8</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="8" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_8_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_8_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_8_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_8_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_8_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_8_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <a href="javascript:void(0)" id="batterx_add_string" class="d-inline-block small mt-2 d-none"><?php echo t("ss_solar_add_string"); ?></a>

                                    <!-- Wide Input Range -->
                                    <div id="solar_wideinputrange_container" class="mt-4 d-none">
                                        <label class="form-label text-muted lh-sm mb-1" for="solar_wideinputrange"><?php echo t("ss_solar_wide_input_range") ?></label>
                                        <select id="solar_wideinputrange" class="form-select">
                                            <option value=""></option>
                                            <option value="0"><?php echo t("ss_solar_disabled") ?></option>
                                            <option value="1"><?php echo t("ss_solar_enabled") ?></option>
                                        </select>
                                    </div>

                                    <!-- E-Meter Phase (single phase only) -->
                                    <div id="box_emeter_phase" class="mt-3 d-none">
                                        <label class="form-label text-muted lh-sm mb-1" for="bx_emeter_phase"><?php echo t("ss_solar_emeter_phase") ?></label>
                                        <select id="bx_emeter_phase" class="form-select">
                                            <option value="1">Phase 1</option>
                                            <option value="2">Phase 2</option>
                                            <option value="3">Phase 3</option>
                                        </select>
                                    </div>

                                </div>

                            </div>
                            <div id="ext_col" class="col-md-4 border-top border-md-0">

                                <div id="ext_solar_placeholder" class="p-4 h-100 d-flex justify-content-center align-items-center">
                                    <button type="button" id="ext_solar_add_btn" class="btn btn-outline-success btn-sm ripple"><?php echo t("ss_add_ext_inverter"); ?></button>
                                </div>

                                <div id="ext_solar_content" class="p-4 d-none">

                                    <!-- Right: External -->

                                    <div class="d-flex align-items-center gap-2 mb-3">
                                        <span style="font-size:1.125rem;"><?php echo t("ss_col_ext_inverter"); ?></span>
                                        <a href="javascript:void(0)" id="ext_solar_remove_btn" class="text-danger lh-1 rounded-pill ripple" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_ext_solar_remove'); ?>">
                                            <i class="bi bi-x" style="font-size:1.5rem;"></i>
                                        </a>
                                    </div>

                                    <label for="solar_wattpeak_ext" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_solar_size"); ?></label>
                                    <div class="row g-2 mb-3 align-items-center">
                                        <div class="col-10"><input id="solar_wattpeak_ext" type="number" step="0.01" min="0" class="form-control"></div>
                                        <div class="col-2"><span class="text-muted">kWp</span></div>
                                    </div>

                                    <a href="javascript:void(0)" id="ext_strings_config_label" class="d-inline-block small mt-2"><?php echo t("ss_pv_strings_config"); ?></a>

                                    <div id="pv_string_101" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 1</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="101" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_101_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_101_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_101_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_101_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_101_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_101_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_102" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 2</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="102" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_102_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_102_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_102_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_102_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_102_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_102_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_103" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 3</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="103" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_103_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_103_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_103_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_103_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_103_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_103_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_104" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 4</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="104" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_104_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_104_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_104_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_104_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_104_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_104_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_105" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 5</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="105" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_105_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_105_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_105_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_105_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_105_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_105_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_106" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 6</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="106" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_106_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_106_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_106_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_106_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_106_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_106_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_107" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 7</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="107" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_107_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_107_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_107_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_107_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_107_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_107_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <div id="pv_string_108" class="d-none">
                                        <div class="d-flex align-items-center gap-2 py-2">
                                            <span class="text-muted small"><?php echo t("ss_pv_string"); ?> 8</span>
                                            <a href="javascript:void(0)" class="pv-string-remove text-danger lh-1 rounded-pill ripple" data-entity="108" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_pv_string_remove'); ?>">
                                                <i class="bi bi-x fs-5"></i>
                                            </a>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_108_power"><?php echo t("ss_installed_power"); ?></label>
                                            <div class="col-4"><input id="pv_string_108_power" type="number" step="0.01" min="0" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">kWp</span></div>
                                        </div>
                                        <div class="row g-2 mb-1 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_108_declination"><?php echo t("ss_declination"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_declination_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_108_declination" type="number" step="1" min="0" max="90" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-1"></div>
                                            <label class="col-5 col-form-label col-form-label-sm text-muted" for="pv_string_108_orientation"><?php echo t("ss_orientation"); ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_orientation_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                            <div class="col-4"><input id="pv_string_108_orientation" type="number" step="1" min="0" max="360" class="form-control form-control-sm"></div>
                                            <div class="col-2"><span class="text-muted small">deg</span></div>
                                        </div>
                                    </div>

                                    <a href="javascript:void(0)" id="ext_add_string" class="d-inline-block small mt-2 d-none"><?php echo t("ss_solar_add_string"); ?></a>

                                    <!-- Ext Solar Meter -->
                                    <div class="form-check mt-4">
                                        <input type="checkbox" class="form-check-input" id="extsol_check">
                                        <label class="form-check-label" for="extsol_check"><?php echo t("ss_solar_ext_meter") ?></label>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Feed-in Limitation -->
                    <div class="p-4 border-top">
                        <label class="form-label text-muted lh-sm mb-2" for="solar_feedinlimitation"><?php echo t("ss_solar_feedin_limitation") ?></label>
                        <div class="row g-2 align-items-center">
                            <div class="col"><input id="solar_feedinlimitation" class="form-control" type="number" step="1" min="0" max="100" value="<?php echo $isVde4105 ? "" : "100" ?>"></div>
                            <div class="col-auto pe-4"><span class="text-muted">%</span></div>
                            <div class="col-auto ps-4"><span class="text-muted">=</span></div>
                            <div class="col"><input id="solar_feedinlimitation_kw" class="form-control" type="text" disabled></div>
                        </div>
                        <div class="form-check mt-4">
                            <input type="checkbox" class="form-check-input" id="regulation_check">
                            <label class="form-check-label" for="regulation_check"><?php echo t("ss_solar_regulation_check") ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_regulation_check_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                        </div>
                    </div>

                    <!-- Solar Info -->
                    <div class="p-4 border-top">
                        <label for="solar_info" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_solar_info") ?></label>
                        <textarea id="solar_info" class="form-control form-control-sm" rows="5" placeholder="Paneltyp: ...&#10;&#10;MPPT 1&#10;  String 1: ...&#10;  String 2: ...&#10;MPPT 2&#10;  String 1: ...&#10;  String 2: ..."></textarea>
                    </div>

                </div>

            </div>

            <button id="btn_solar_next" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none mt-3" disabled><?php echo t("btn_continue"); ?></button>

        </div>


        <!-- Section: SteuVE (Controllable Load) -->
        <div id="steuve" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-sliders"></i>
                    <?php echo t("ss_steuve_title") ?>
                </div>

                <div class="card-body p-0">
                    <!-- Control Signal Connection -->
                    <div class="p-4">
                        <label for="steuve_connection" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_steuve_connection") ?></label>
                        <select id="steuve_connection" class="form-select">
                            <option value="0"><?php echo t("ss_steuve_not_connected") ?></option>
                            <option value="1">FNN-2Bit</option>
                            <option value="2"><?php echo t("ss_steuve_terminal_strip") ?></option>
                        </select>
                        <img id="steuve_image_fnn2bit" src="img/gridoperatorcontrol_fnn2bit.png" class="img-fluid border rounded d-block mx-auto mt-3 d-none" alt="FNN-2Bit">
                        <img id="steuve_image_terminal_strip" src="img/gridoperatorcontrol_klemmleiste.png" class="img-fluid border rounded d-block mx-auto mt-3 d-none" alt="<?php echo t("ss_steuve_terminal_strip") ?>">
                    </div>
                    <div id="steuve_content" class="d-none">
                        <!-- Power Generation Unit (§9 EEG) -->
                        <div class="p-4 border-top">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="steuve_generation_check">
                                <label class="form-check-label" for="steuve_generation_check"><?php echo t("ss_steuve_max_injection") ?> (§9 EEG)</label>
                            </div>
                        </div>
                        <!-- Controllable Consumption Device (§14a EnWG) -->
                        <div class="p-4 border-top">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="steuve_consumption_check">
                                <label class="form-check-label" for="steuve_consumption_check"><?php echo t("ss_steuve_max_charge_ac") ?> (§14a EnWG)</label>
                            </div>
                            <div id="steuve_consumption_content" class="d-none mt-3 px-5">
                                <div class="form-check mb-3">
                                    <input type="checkbox" class="form-check-input" id="steuve_wallbox_check">
                                    <label class="form-check-label" for="steuve_wallbox_check"><?php echo t("ss_steuve_wallbox_limit") ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_steuve_wallbox_limit_tooltip'); ?>" class="text-decoration-none">(?)</a></label>
                                </div>
                                <label for="steuve_device_count" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_steuve_device_count") ?></label>
                                <input id="steuve_device_count" class="form-control mb-3" type="text" value="1" disabled>
                                <label for="steuve_pmin" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_steuve_pmin") ?></label>
                                <div class="row g-2 align-items-center">
                                    <div class="col"><input id="steuve_pmin" class="form-control" type="number" step="0.01" min="0" value="4.2"></div>
                                    <div class="col-auto"><span class="text-muted">kW</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <button id="btn_steuve_next" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none mt-3" disabled><?php echo t("btn_continue"); ?></button>

        </div>


        <!-- Section: Reactive Power -->
        <div id="reactive" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-activity"></i>
                    <?php echo $isTor ? t("ss_reactive_title_tor") : t("ss_reactive_title") ?>
                </div>

                <div class="card-body p-0">

                    <div class="p-4">
                        <label for="reactive_mode" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_reactive_select_mode") ?></label>
                        <select class="form-select" id="reactive_mode">
                            <option value=""  <?php echo ($isVde4105 || $isTor || $isEstonia) == "1" ? "selected" : "" ?>></option>
                            <option value="0" <?php echo ($isVde4105 || $isTor || $isEstonia) == "1" ? "" : "selected" ?>><?php echo t("ss_reactive_mode_0") ?></option>
                            <option value="2"><?php echo t("ss_reactive_mode_2") ?></option>
                            <option value="3"><?php echo t("ss_reactive_mode_3") ?></option>
                            <option value="1"><?php echo t("ss_reactive_mode_1") ?></option>
                            <?php if($isTor): ?><option value="4"><?php echo t("ss_reactive_mode_4") ?></option><?php endif; ?>
                        </select>
                    </div>

                    <div id="reactive_mode1" class="p-4 border-top d-none">
                        <div class="row g-4">
                            <div class="col-1 d-none d-md-block"></div>
                            <div class="col-md-4 d-flex flex-column justify-content-center">
                                <div>
                                    <label for="reactive_mode1_kink" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_reactive_kinkpoint") ?></label>
                                    <select class="form-select" id="reactive_mode1_kink">
                                        <option value="50">0.5</option>
                                        <option value="40">0.4</option>
                                        <option value="30">0.3</option>
                                        <option value="20">0.2</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-7">
                                <svg id="svg_reactive_mode1" xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="0 0 1200 900"><style type="text/css">.st0{fill:#808080;}.st1{fill:#007BFF;}.st3{font-family:Roboto;}.st4{font-size:36px;}</style><rect x="289.3" y="107.5" width="5" height="700"/><rect x="289.3" y="455" width="702.5" height="5"/><polygon points="283.2 107.5 291.8 92.5 300.5 107.5 "/><polygon points="991.8 448.8 1006.8 457.5 991.8 466.2 "/><rect x="689.3" y="680" class="st0" width="30" height="5"/><rect x="639.3" y="680" class="st0" width="30" height="5"/><rect x="589.3" y="680" class="st0" width="30" height="5"/><rect x="539.3" y="680" class="st0" width="30" height="5"/><rect x="489.3" y="680" class="st0" width="30" height="5"/><rect x="439.3" y="680" class="st0" width="30" height="5"/><rect x="389.3" y="680" class="st0" width="30" height="5"/><rect x="339.3" y="680" class="st0" width="30" height="5"/><rect x="289.3" y="680" class="st0" width="30" height="5"/><rect x="291.8" y="455" class="st1" width="193.2" height="5"/><path d="M203.4 132.6c1.1 0 2.2-0.4 3-1.1s1.3-1.6 1.3-2.6h3.1l0 0.1c0.1 1.6-0.7 3.1-2.2 4.4s-3.3 1.9-5.3 1.9c-2.8 0-4.9-0.9-6.3-2.7s-2.2-4.1-2.2-6.8v-0.7c0-2.7 0.7-5 2.2-6.8s3.6-2.7 6.3-2.7c2.2 0 4 0.7 5.5 2s2.1 2.9 2 4.8l0 0.1h-3.1c0-1.2-0.4-2.1-1.2-3s-1.9-1.2-3.1-1.2c-1.8 0-3.1 0.7-3.9 2s-1.2 2.9-1.2 4.8v0.7c0 1.9 0.4 3.6 1.2 4.9S201.6 132.6 203.4 132.6z"/><path d="M214 125.2c0-2.8 0.8-5.1 2.3-7s3.6-2.7 6.2-2.7c2.6 0 4.7 0.9 6.2 2.7s2.3 4.1 2.3 7v0.4c0 2.8-0.8 5.2-2.3 7s-3.6 2.7-6.2 2.7 -4.7-0.9-6.2-2.7 -2.3-4.1-2.3-7V125.2zM217.4 125.6c0 2 0.4 3.7 1.3 5 0.8 1.3 2.1 2 3.8 2 1.7 0 2.9-0.7 3.8-2 0.9-1.3 1.3-3 1.3-5v-0.4c0-2-0.4-3.6-1.3-5s-2.1-2-3.8-2c-1.7 0-2.9 0.7-3.8 2s-1.3 3-1.3 5V125.6z"/><path d="M246.3 129.9c0-0.8-0.3-1.4-0.9-1.9s-1.7-0.9-3.3-1.3c-2.3-0.5-4-1.2-5.2-2s-1.7-2-1.7-3.5c0-1.5 0.7-2.9 2-3.9s3-1.6 5.1-1.6c2.2 0 4 0.6 5.3 1.7s1.9 2.5 1.9 4.1l0 0.1h-3.3c0-0.8-0.3-1.6-1-2.2s-1.6-1-2.8-1c-1.2 0-2.1 0.3-2.7 0.8s-0.9 1.2-0.9 2c0 0.8 0.3 1.3 0.8 1.8s1.6 0.8 3.2 1.2c2.4 0.5 4.2 1.2 5.4 2.1s1.8 2.1 1.8 3.6c0 1.7-0.7 3.1-2 4.1s-3.1 1.6-5.4 1.6c-2.4 0-4.3-0.6-5.7-1.8s-2.1-2.7-2-4.3l0-0.1h3.3c0.1 1.2 0.5 2.1 1.4 2.7s1.9 0.8 3 0.8c1.2 0 2.2-0.2 2.9-0.7S246.3 130.7 246.3 129.9z"/><path d="M265.9 115.9c2.7 0 5 0.9 6.9 2.8s2.9 4.2 2.9 7c0 2.6-0.8 4.7-2.4 6.5s-4 2.8-7.3 3v8.1h-3.5v-8.1c-3.2-0.3-5.6-1.4-7.1-3.3 -1.5-1.9-2.3-4.2-2.3-6.9 0-1.8 0.2-3.4 0.6-4.9s0.9-2.9 1.5-4.2h3.6c-0.7 1.6-1.2 3.1-1.6 4.6 -0.4 1.5-0.6 3-0.6 4.5 0 1.8 0.5 3.4 1.4 4.8 1 1.4 2.4 2.2 4.4 2.5l0.1 0v-16.3H265.9zM272.1 125.7c0-1.9-0.6-3.6-1.7-4.9 -1.1-1.4-2.6-2.1-4.4-2l-0.1 0v13.5l0.1 0c2.1-0.2 3.6-1 4.6-2.3S272.1 127.4 272.1 125.7z"/><path d="M887.3 494.7v10.3h-3.5v-25.6h9.8c2.7 0 4.9 0.7 6.4 2.1s2.3 3.3 2.3 5.6c0 2.3-0.8 4.2-2.3 5.6s-3.6 2.1-6.4 2.1H887.3zM887.3 491.9h6.3c1.7 0 3-0.5 3.9-1.4 0.9-0.9 1.3-2.1 1.3-3.5 0-1.4-0.4-2.6-1.3-3.5 -0.9-0.9-2.2-1.4-3.9-1.4h-6.3V491.9z"/><path d="M907 507.1h-3l10.7-27.8h2.9L907 507.1z"/><path d="M925.3 494.7v10.3h-3.5v-25.6h9.8c2.7 0 4.9 0.7 6.4 2.1s2.3 3.3 2.3 5.6c0 2.3-0.8 4.2-2.3 5.6s-3.6 2.1-6.4 2.1H925.3zM925.3 491.9h6.3c1.7 0 3-0.5 3.9-1.4 0.9-0.9 1.3-2.1 1.3-3.5 0-1.4-0.4-2.6-1.3-3.5 -0.9-0.9-2.2-1.4-3.9-1.4h-6.3V491.9z"/><path d="M954 497h-7.8v6.1h9v1.8h-11.3v-17.1H955v1.8h-8.9v5.5h7.8V497z"/><path d="M959.5 492.2l0.2 1.7c0.4-0.6 0.9-1.1 1.6-1.4s1.4-0.5 2.2-0.5 1.6 0.2 2.2 0.6 1.1 1 1.4 1.8c0.4-0.7 0.9-1.3 1.6-1.7s1.4-0.6 2.3-0.6c1.3 0 2.3 0.4 3.1 1.3s1.1 2.2 1.1 4v7.6h-2.3v-7.6c0-1.3-0.2-2.1-0.6-2.7s-1.1-0.8-1.9-0.8c-0.8 0-1.4 0.3-1.9 0.8s-0.8 1.2-0.9 2.1v0.1 8.1h-2.3v-7.6c0-1.2-0.2-2.1-0.7-2.6s-1.1-0.8-1.9-0.8c-0.7 0-1.3 0.1-1.7 0.4s-0.8 0.7-1 1.2v9.4h-2.3v-12.7H959.5z"/><path d="M986.2 504.9c-0.1-0.4-0.1-0.7-0.2-1s-0.1-0.6-0.1-0.9c-0.4 0.6-1 1.1-1.7 1.5s-1.4 0.6-2.2 0.6c-1.3 0-2.3-0.3-3-1s-1-1.6-1-2.8c0-1.2 0.5-2.2 1.5-2.8s2.3-1 4-1h2.5v-1.3c0-0.7-0.2-1.3-0.7-1.8s-1.1-0.7-1.9-0.7c-0.7 0-1.3 0.2-1.8 0.6s-0.7 0.8-0.7 1.4h-2.2l0-0.1c0-0.9 0.4-1.8 1.3-2.5s2.1-1.1 3.6-1.1c1.4 0 2.6 0.4 3.5 1.1s1.3 1.8 1.3 3.2v6.1c0 0.5 0 0.9 0.1 1.3s0.1 0.8 0.3 1.2H986.2zM982.4 503.2c0.8 0 1.6-0.2 2.3-0.6 0.7-0.4 1.1-0.9 1.3-1.5v-2.1h-2.6c-0.9 0-1.7 0.2-2.2 0.7 -0.6 0.5-0.8 1-0.8 1.6 0 0.6 0.2 1 0.5 1.3S981.7 503.2 982.4 503.2z"/><path d="M995.9 496.9l2.7-4.7h2.7l-4.1 6.3 4.2 6.4h-2.6l-2.8-4.8 -2.8 4.8h-2.7l4.2-6.4 -4.1-6.3h2.7L995.9 496.9z"/><path d="M228.6 232.4c0 3.3-0.7 5.8-2.2 7.5s-3.4 2.6-6 2.6 -4.5-0.9-6-2.6 -2.2-4.2-2.2-7.5v-6.1c0-3.3 0.7-5.8 2.2-7.5s3.4-2.6 6-2.6c2.5 0 4.5 0.9 6 2.6s2.2 4.3 2.2 7.5V232.4zM225.1 225.6c0-2.2-0.4-3.9-1.2-5 -0.8-1.1-2-1.7-3.5-1.7s-2.7 0.6-3.5 1.7c-0.8 1.1-1.2 2.8-1.2 5v7.5c0 2.2 0.4 3.9 1.2 5s2 1.7 3.5 1.7 2.7-0.6 3.5-1.7 1.2-2.8 1.2-5V225.6z"/><path d="M236.9 242.2h-3.5v-3.6h3.5V242.2z"/><path d="M249.2 239.8c1.7 0 3-0.6 4.1-1.9s1.5-3.2 1.5-5.7v-1.2c-0.6 0.8-1.3 1.5-2.2 1.9s-1.8 0.6-2.9 0.6c-2.5 0-4.4-0.8-5.9-2.3s-2.2-3.6-2.2-6.3c0-2.6 0.8-4.7 2.3-6.3s3.4-2.5 5.6-2.5c2.7 0 4.8 0.8 6.3 2.5 1.5 1.7 2.3 4.1 2.3 7.4v6.1c0 3.3-0.8 5.9-2.5 7.7 -1.7 1.8-3.8 2.7-6.5 2.7 -0.9 0-1.8-0.1-2.8-0.3 -0.9-0.2-1.8-0.4-2.5-0.8l0.5-2.7c0.7 0.4 1.4 0.6 2.2 0.8S248.3 239.8 249.2 239.8zM249.8 230.9c1.3 0 2.3-0.3 3.2-0.8s1.5-1.3 1.8-2.1v-2.2c0-2.2-0.4-3.9-1.3-5.1s-2.1-1.7-3.8-1.7c-1.3 0-2.3 0.6-3.2 1.7s-1.3 2.6-1.3 4.3c0 1.8 0.4 3.2 1.2 4.3S248.4 230.9 249.8 230.9z"/><path d="M318.7 401.1v3.2h-2.9v-3.2H318.7zM318.7 407.9v3.2h-2.9v-3.2H318.7zM320.9 398.1h14.5c2.3 0 4.1 0.8 5.3 2.3 1.2 1.5 1.8 3.5 1.8 5.9 0 2.3-0.6 4.2-1.9 5.7 -1.2 1.5-3 2.2-5.3 2.2h-14.5v-2.9h14.4c1.6 0 2.8-0.5 3.7-1.4s1.3-2.1 1.3-3.6c0-1.6-0.4-2.9-1.3-3.8s-2.1-1.5-3.7-1.5h-14.4V398.1z"/><path d="M334.9 380.4c2.3 0 4.1 0.5 5.5 1.6 1.4 1.1 2.1 2.6 2.1 4.5 0 1-0.2 2-0.6 2.7s-1 1.4-1.8 1.9l2.1 0.4v2.4h-22.9V391h8.9c-0.7-0.5-1.2-1.1-1.6-1.9 -0.4-0.7-0.6-1.6-0.6-2.6 0-2 0.8-3.5 2.3-4.6s3.6-1.6 6.2-1.6H334.9zM334.6 383.3c-1.8 0-3.3 0.3-4.4 1s-1.7 1.7-1.7 3.1c0 0.9 0.2 1.6 0.7 2.2s1 1.1 1.8 1.5h6.9c0.8-0.4 1.4-0.9 1.8-1.5 0.4-0.6 0.7-1.4 0.7-2.3 0-1.4-0.5-2.4-1.5-3s-2.2-1-3.8-1H334.6z"/><path d="M342.5 370.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 367.9 342.5 369 342.5 370.3zM328.3 370.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 368.6 328.3 369.5 328.3 370.7z"/><path d="M328.9 353.5l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 353.5z"/><path d="M342.5 344.4c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 342 342.5 343.1 342.5 344.4zM328.3 344.9c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 342.8 328.3 343.7 328.3 344.9z"/><path d="M328.9 327.6l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 327.6z"/><path d="M328.9 317.4l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 317.4z"/><path d="M342.5 308.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 305.8 342.5 307 342.5 308.3zM328.3 308.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 306.6 328.3 307.5 328.3 308.7z"/><path d="M334.6 299.6c-2.5 0-4.6-0.6-6.2-1.7s-2.3-2.7-2.3-4.6c0-1 0.2-1.9 0.6-2.7s1-1.4 1.8-1.9l-2.1-0.4v-2.3h15.9c2 0 3.6 0.6 4.7 1.8s1.6 2.9 1.6 5.1c0 0.8-0.1 1.6-0.3 2.5 -0.2 0.9-0.5 1.7-0.9 2.3l-2.2-0.7c0.3-0.5 0.5-1.1 0.7-1.9s0.3-1.5 0.3-2.2c0-1.4-0.3-2.4-1-3.1 -0.6-0.6-1.6-1-2.9-1h-1.8c0.7 0.5 1.2 1.1 1.5 1.9s0.5 1.6 0.5 2.5c0 1.9-0.7 3.5-2.1 4.6s-3.2 1.7-5.5 1.7H334.6zM334.9 296.7c1.6 0 2.9-0.3 3.8-1s1.5-1.7 1.5-3.1c0-0.9-0.2-1.6-0.6-2.2s-1-1.1-1.7-1.5h-7.3c-0.7 0.4-1.2 0.9-1.6 1.5s-0.6 1.3-0.6 2.2c0 1.4 0.6 2.4 1.7 3.1s2.6 1 4.4 1H334.9z"/><path d="M322.5 278.1h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1V281h-3.8V278.1z"/><path d="M320.9 628.3h14.5c2.3 0 4.1 0.8 5.3 2.3 1.2 1.5 1.8 3.5 1.8 5.9 0 2.3-0.6 4.2-1.9 5.7 -1.2 1.5-3 2.2-5.3 2.2h-14.5v-2.9h14.4c1.6 0 2.8-0.5 3.7-1.4s1.3-2.1 1.3-3.6c0-1.6-0.4-2.9-1.3-3.8s-2.1-1.5-3.7-1.5h-14.4V628.3z"/><path d="M326.3 621.5l2.4-0.2c-0.8-0.5-1.5-1.2-2-2 -0.5-0.8-0.7-1.7-0.7-2.7 0-1.7 0.5-3 1.5-4s2.5-1.4 4.6-1.4h10v2.9h-9.9c-1.4 0-2.4 0.3-3 0.8s-0.9 1.4-0.9 2.5c0 0.8 0.2 1.6 0.6 2.2 0.4 0.6 0.9 1.2 1.6 1.5h11.6v2.9h-15.8V621.5z"/><path d="M322.5 603.3h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1v-2.5h-3.8V603.3z"/><path d="M342.5 590.1c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 587.7 342.5 588.8 342.5 590.1zM328.3 590.6c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0V587h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 588.5 328.3 589.4 328.3 590.6z"/><path d="M328.9 573.3l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 573.3z"/><path d="M342.5 564.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 561.8 342.5 562.9 342.5 564.3zM328.3 564.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 562.6 328.3 563.5 328.3 564.7z"/><path d="M328.9 547.5l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 547.5z"/><path d="M328.9 537.2l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 537.2z"/><path d="M342.5 528.1c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 525.7 342.5 526.8 342.5 528.1zM328.3 528.5c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 526.4 328.3 527.3 328.3 528.5z"/><path d="M334.6 519.4c-2.5 0-4.6-0.6-6.2-1.7s-2.3-2.7-2.3-4.6c0-1 0.2-1.9 0.6-2.7s1-1.4 1.8-1.9l-2.1-0.4v-2.3h15.9c2 0 3.6 0.6 4.7 1.8s1.6 2.9 1.6 5.1c0 0.8-0.1 1.6-0.3 2.5 -0.2 0.9-0.5 1.7-0.9 2.3l-2.2-0.7c0.3-0.5 0.5-1.1 0.7-1.9s0.3-1.5 0.3-2.2c0-1.4-0.3-2.4-1-3.1 -0.6-0.6-1.6-1-2.9-1h-1.8c0.7 0.5 1.2 1.1 1.5 1.9s0.5 1.6 0.5 2.5c0 1.9-0.7 3.5-2.1 4.6s-3.2 1.7-5.5 1.7H334.6zM334.9 516.6c1.6 0 2.9-0.3 3.8-1s1.5-1.7 1.5-3.1c0-0.9-0.2-1.6-0.6-2.2s-1-1.1-1.7-1.5h-7.3c-0.7 0.4-1.2 0.9-1.6 1.5s-0.6 1.3-0.6 2.2c0 1.4 0.6 2.4 1.7 3.1s2.6 1 4.4 1H334.9z"/><path d="M322.5 498h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1v-2.5h-3.8V498z"/><rect x="714.3" y="430" class="st0" width="5" height="30"/><rect x="714.3" y="380" class="st0" width="5" height="30"/><rect x="714.3" y="330" class="st0" width="5" height="30"/><rect x="714.3" y="280" class="st0" width="5" height="30"/><rect x="689.3" y="230" class="st0" width="30" height="5"/><rect x="639.3" y="230" class="st0" width="30" height="5"/><rect x="589.3" y="230" class="st0" width="30" height="5"/><rect x="539.3" y="230" class="st0" width="30" height="5"/><rect x="489.3" y="230" class="st0" width="30" height="5"/><rect x="439.3" y="230" class="st0" width="30" height="5"/><rect x="389.3" y="230" class="st0" width="30" height="5"/><rect x="339.3" y="230" class="st0" width="30" height="5"/><rect x="289.3" y="230" class="st0" width="30" height="5"/><rect x="291.8" y="455" class="st1" width="216.9" height="5"/><rect x="714.3" y="455" class="st0" width="5" height="30"/><rect x="714.3" y="505" class="st0" width="5" height="30"/><rect x="714.3" y="555" class="st0" width="5" height="30"/><rect x="714.3" y="605" class="st0" width="5" height="30"/><rect x="714.3" y="655" class="st0" width="5" height="30"/><rect x="714.3" y="230" class="st0" width="5" height="30"/><rect x="457.9" y="567.7" transform="matrix(-0.682 -0.7314 0.7314 -0.682 612.4574 1406.7548)" class="st1" width="308.4" height="5"/><text class="st3 st4" id="svg_reactive_mode1_kink_value" transform="matrix(1 0 0 1 480 430)">0.5</text><path d="M744 430h-3.5v-22.2l-5.2 0.1v-2.5l8.7-0.9V430z"/><rect x="714.3" y="442.5" width="5" height="30"/><rect x="506.2" y="442.5" width="5" height="30"/><rect x="714.3" y="442.5" width="5" height="30"/><rect x="276.8" y="230" width="30" height="5"/><rect x="276.8" y="680" width="30" height="5"/><path d="M228.6 682.4c0 3.3-0.7 5.8-2.2 7.5s-3.4 2.6-6 2.6 -4.5-0.9-6-2.6 -2.2-4.2-2.2-7.5v-6.1c0-3.3 0.7-5.8 2.2-7.5s3.4-2.6 6-2.6c2.5 0 4.5 0.9 6 2.6s2.2 4.3 2.2 7.5V682.4zM225.1 675.6c0-2.2-0.4-3.9-1.2-5 -0.8-1.1-2-1.7-3.5-1.7s-2.7 0.6-3.5 1.7c-0.8 1.1-1.2 2.8-1.2 5v7.5c0 2.2 0.4 3.9 1.2 5 0.8 1.1 2 1.7 3.5 1.7s2.7-0.6 3.5-1.7c0.8-1.1 1.2-2.8 1.2-5V675.6z"/><path d="M236.9 692.2h-3.5v-3.6h3.5V692.2z"/><path d="M249.2 689.8c1.7 0 3-0.6 4.1-1.9 1-1.3 1.5-3.2 1.5-5.7v-1.2c-0.6 0.8-1.3 1.5-2.2 1.9s-1.8 0.6-2.9 0.6c-2.5 0-4.4-0.8-5.9-2.3s-2.2-3.6-2.2-6.3c0-2.6 0.8-4.7 2.3-6.3s3.4-2.5 5.6-2.5c2.7 0 4.8 0.8 6.3 2.5 1.5 1.7 2.3 4.1 2.3 7.4v6.1c0 3.3-0.8 5.9-2.5 7.7 -1.7 1.8-3.8 2.7-6.5 2.7 -0.9 0-1.8-0.1-2.8-0.3 -0.9-0.2-1.8-0.4-2.5-0.8l0.5-2.7c0.7 0.4 1.4 0.6 2.2 0.8S248.3 689.8 249.2 689.8zM249.8 680.9c1.3 0 2.3-0.3 3.2-0.8 0.8-0.6 1.5-1.3 1.8-2.1v-2.2c0-2.2-0.4-3.9-1.3-5.1 -0.9-1.1-2.1-1.7-3.8-1.7 -1.3 0-2.3 0.6-3.2 1.7 -0.9 1.1-1.3 2.6-1.3 4.3 0 1.8 0.4 3.2 1.2 4.3C247.2 680.3 248.4 680.9 249.8 680.9z"/><rect x="276.8" y="455" width="30" height="5"/><path d="M252.6 467.2h-3.5V445l-5.2 0.1v-2.5l8.7-0.9V467.2z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div id="reactive_mode2" class="p-4 border-top d-none">
                        <div class="row g-2">
                            <label for="reactive_mode2_cosphi" class="col-3 col-form-label text-muted">cosφ</label>
                            <div class="col-4">
                                <select class="form-select" id="reactive_mode2_cosphi_sign">
                                    <option value="0"><?php echo t("ss_reactive_overexcited") ?></option>
                                    <option value="1"><?php echo t("ss_reactive_underexcited") ?></option>
                                </select>
                            </div>
                            <div class="col-5">
                                <select class="form-select" id="reactive_mode2_cosphi">
                                    <option value="90">0.90</option>
                                    <option value="91">0.91</option>
                                    <option value="92">0.92</option>
                                    <option value="93">0.93</option>
                                    <option value="94">0.94</option>
                                    <option value="95">0.95</option>
                                    <option value="96">0.96</option>
                                    <option value="97">0.97</option>
                                    <option value="98">0.98</option>
                                    <option value="99">0.99</option>
                                    <option value="100" selected>1.00</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div id="reactive_mode3" class="p-4 border-top d-none">
                        <div class="row g-0">
                            <div class="col-md-4 d-flex flex-column justify-content-center">
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="reactive_mode3_v1" class="col-auto col-form-label text-muted text-end">U1</label>
                                    <div class="col"><input value="<?php echo $isTor ?  "92" :  "93" ?>" placeholder="<?php echo $isTor ?  "92" :  "93" ?>" type="number" class="form-control" id="reactive_mode3_v1"></div>
                                    <div class="col-auto" style="min-width:2.5rem;"><span class="text-muted">%</span></div>
                                </div>
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="reactive_mode3_v2" class="col-auto col-form-label text-muted text-end">U2</label>
                                    <div class="col"><input value="<?php echo $isTor ?  "96" :  "97" ?>" placeholder="<?php echo $isTor ?  "96" :  "97" ?>" type="number" class="form-control" id="reactive_mode3_v2"></div>
                                    <div class="col-auto" style="min-width:2.5rem;"><span class="text-muted">%</span></div>
                                </div>
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="reactive_mode3_v3" class="col-auto col-form-label text-muted text-end">U3</label>
                                    <div class="col"><input value="<?php echo $isTor ? "105" : "103" ?>" placeholder="<?php echo $isTor ? "105" : "103" ?>" type="number" class="form-control" id="reactive_mode3_v3"></div>
                                    <div class="col-auto" style="min-width:2.5rem;"><span class="text-muted">%</span></div>
                                </div>
                                <div class="row g-2 mb-3 align-items-center">
                                    <label for="reactive_mode3_v4" class="col-auto col-form-label text-muted text-end">U4</label>
                                    <div class="col"><input value="<?php echo $isTor ? "108" : "107" ?>" placeholder="<?php echo $isTor ? "108" : "107" ?>" type="number" class="form-control" id="reactive_mode3_v4"></div>
                                    <div class="col-auto" style="min-width:2.5rem;"><span class="text-muted">%</span></div>
                                </div>
                                <div class="mb-3">
                                    <label for="reactive_mode3_qmaxsn" class="form-label text-muted lh-sm mb-1">Qmax/Sn</label>
                                    <div class="row g-2 align-items-center">
                                        <div class="col">
                                            <select class="form-select" id="reactive_mode3_qmaxsn">
                                                <option value="0.436">0.436</option>
                                                <option value="0.415">0.415</option>
                                                <option value="0.392">0.392</option>
                                                <option value="0.368">0.368</option>
                                                <option value="0.341">0.341</option>
                                                <option value="0.312">0.312</option>
                                                <option value="0.280">0.280</option>
                                                <option value="0.243">0.243</option>
                                                <option value="0.199">0.199</option>
                                                <option value="0.141">0.141</option>
                                                <option value="0.000">0.000</option>
                                            </select>
                                        </div>
                                        <div class="col-auto" style="min-width:2.5rem;"></div>
                                    </div>
                                </div>
                                <div>
                                    <label for="reactive_mode3_qutime" class="form-label text-muted lh-sm mb-1"><?php echo t("ss_reactive_qutime") ?></label>
                                    <div class="row g-2 align-items-center">
                                        <div class="col"><input value="5" placeholder="5" type="number" class="form-control" id="reactive_mode3_qutime"></div>
                                        <div class="col-auto" style="min-width:2.5rem;"><span class="text-muted">sec</span></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-8 mt-4 mt-md-0 d-flex justify-content-center align-items-center">
                                <svg id="svg_reactive_mode3" xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="0 0 1600 900"><style type="text/css">.st0{fill:#808080;}.st1{fill:#007BFF;}.st2{fill:none;}.st3{font-family:Roboto;}.st4{font-size:36px;}.st5{font-size:24px;}.st7{font-size:30px;}</style><rect x="797.5" y="100" width="5" height="700"/><rect x="100" y="447.5" width="1400" height="5"/><polygon points="791.3 100 800 85 808.7 100 "/><polygon points="1500 441.3 1515 450 1500 458.7 "/><rect x="322.5" y="672.5" class="st0" width="30" height="5"/><rect x="372.5" y="672.5" class="st0" width="30" height="5"/><rect x="422.5" y="672.5" class="st0" width="30" height="5"/><rect x="472.5" y="672.5" class="st0" width="30" height="5"/><rect x="522.5" y="672.5" class="st0" width="30" height="5"/><rect x="572.5" y="672.5" class="st0" width="30" height="5"/><rect x="622.5" y="672.5" class="st0" width="30" height="5"/><rect x="672.5" y="672.5" class="st0" width="30" height="5"/><rect x="722.5" y="672.5" class="st0" width="30" height="5"/><rect x="772.5" y="672.5" class="st0" width="30" height="5"/><rect x="606.8" y="447.5" class="st1" width="193.2" height="5"/><rect x="760.2" y="103.8" class="st2" width="33.5" height="35.5"/><text transform="matrix(1 0 0 1 760.1667 131.265)" class="st3 st4">Q</text><rect x="1420.8" y="468.3" class="st2" width="86.7" height="35.5"/><text transform="matrix(1 0 0 1 1420.8328 495.7585)"><tspan class="st3 st4">U&#x2F;U</tspan><tspan x="59.9" class="st3 st5">n</tspan></text><rect x="708.2" y="207.3" class="st2" width="84.1" height="35.5"/><text transform="matrix(1 0 0 1 708.1667 234.6816)"><tspan class="st3 st4">Q</tspan><tspan x="23" class="st3 st5">max</tspan></text><rect x="1355" y="319.8" class="st2" width="160" height="35.5"/><text transform="matrix(1 0 0 1 1355 342.6099)" class="st3 st7"><?php echo t("ss_reactive_underexcited") ?></text><rect x="1355" y="589.8" class="st2" width="160" height="35.5"/><text transform="matrix(1 0 0 1 1355 612.6868)" class="st3 st7"><?php echo t("ss_reactive_overexcited") ?></text><rect x="827.8" y="657.3" class="st2" width="94.5" height="35.5"/><text transform="matrix(1 0 0 1 827.7602 684.6816)"><tspan class="st3 st4">-Q</tspan><tspan x="32.3" class="st3 st5">max</tspan></text><rect x="1322.5" y="422.5" class="st0" width="5" height="30"/><rect x="1322.5" y="372.5" class="st0" width="5" height="30"/><rect x="1322.5" y="322.5" class="st0" width="5" height="30"/><rect x="1322.5" y="272.5" class="st0" width="5" height="30"/><rect x="1247.5" y="222.5" class="st0" width="30" height="5"/><rect x="1197.5" y="222.5" class="st0" width="30" height="5"/><rect x="1147.5" y="222.5" class="st0" width="30" height="5"/><rect x="1097.5" y="222.5" class="st0" width="30" height="5"/><rect x="1047.5" y="222.5" class="st0" width="30" height="5"/><rect x="997.5" y="222.5" class="st0" width="30" height="5"/><rect x="947.5" y="222.5" class="st0" width="30" height="5"/><rect x="897.5" y="222.5" class="st0" width="30" height="5"/><rect x="847.5" y="222.5" class="st0" width="30" height="5"/><rect x="797.5" y="222.5" class="st0" width="30" height="5"/><rect x="800" y="447.5" class="st1" width="193.2" height="5"/><rect x="272.5" y="447.5" class="st0" width="5" height="30"/><rect x="272.5" y="497.5" class="st0" width="5" height="30"/><rect x="272.5" y="547.5" class="st0" width="5" height="30"/><rect x="272.5" y="597.5" class="st0" width="5" height="30"/><rect x="272.5" y="647.5" class="st0" width="5" height="30"/><rect x="272.5" y="672.5" class="st0" width="30" height="5"/><rect x="1297.5" y="222.5" class="st0" width="30" height="5"/><rect x="1322.5" y="222.5" class="st0" width="5" height="30"/><rect x="238.9" y="560" transform="matrix(0.829 -0.5592 0.5592 0.829 -239.1897 342.6775)" class="st1" width="403.8" height="5"/><rect x="199.8" y="672.5" class="st1" width="75" height="5"/><rect x="957.3" y="335" transform="matrix(-0.829 0.5592 -0.5592 -0.829 2308.863 -30.9006)" class="st1" width="403.8" height="5"/><rect x="1325.2" y="222.5" class="st1" width="72.3" height="5"/><rect x="814.5" y="465.3" class="st2" width="61.5" height="35.5"/><text transform="matrix(1 0 0 1 814.5 492.6816)"><tspan class="st3 st4">U</tspan><tspan x="22.9" class="st3 st5">Q0</tspan></text><rect x="210" y="390.4" class="st2" width="130" height="35.5"/><text transform="matrix(1 0 0 1 243.6146 417.8488)" class="st3 st4" id="svg_reactive_mode3_v1_value">93%</text><rect x="547.6" y="390.4" class="st2" width="118.4" height="35.5"/><text transform="matrix(1 0 0 1 575.4271 417.8488)" class="st3 st4" id="svg_reactive_mode3_v2_value">97%</text><rect x="928.3" y="478.9" class="st2" width="122.4" height="35.5"/><text transform="matrix(1 0 0 1 948.646 506.3483)" class="st3 st4" id="svg_reactive_mode3_v3_value">103%</text><rect x="1256" y="478.9" class="st2" width="130.6" height="35.5"/><text transform="matrix(1 0 0 1 1280.459 506.3483)" class="st3 st4" id="svg_reactive_mode3_v4_value">107%</text><rect x="272.5" y="435" width="5" height="30"/><rect x="604.3" y="435" width="5" height="30"/><rect x="990.7" y="435" width="5" height="30"/><rect x="1322.5" y="435" width="5" height="30"/><rect x="785" y="222.5" width="30" height="5"/><rect x="785" y="672.5" width="30" height="5"/></svg>
                            </div>
                        </div>
                    </div>

                    <div id="reactive_mode4" class="p-4 border-top d-none">
                        <div class="row g-2 align-items-center">
                            <label for="reactive_mode4_qfix" class="col-3 col-form-label text-muted">Qfix</label>
                            <div class="col">
                                <input value="0" placeholder="0" type="number" class="form-control" id="reactive_mode4_qfix">
                            </div>
                            <div class="col-auto"><span class="text-muted">VAR</span></div>
                        </div>
                    </div>

                    <div class="px-4 py-2 border-top">
                        <!-- Extended Parameters -->
                        <button id="btnExtendedParameters" class="btn btn-transparent text-uppercase d-block w-100 ripple" data-bs-toggle="modal" data-bs-target="#modalExtendedParameters"><small><b><?php echo t("ss_reactive_extended_params") ?></b></small></button>
                    </div>

                </div>
            </div>

            <button id="btn_reactive_next" type="button" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none mt-3" disabled><?php echo t("btn_continue"); ?></button>

        </div>


        <!-- Section: Other (Other Devices) -->
        <div id="other" class="d-none">

            <div class="card mb-4 text-start">

                <div class="card-header">
                    <i class="bi bi-plugin"></i> <?php echo t("ss_other_devices") ?>
                </div>

                <div class="card-body p-0">
                    <div class="px-4 py-2">
                        <button id="btnEnergyMeters" type="button" class="btn btn-transparent d-block w-100 ripple" data-bs-toggle="modal" data-bs-target="#modalEnergyMeters">
                            <div class="fw-bold"><?php echo t("ss_energy_meters") ?></div>
                            <div id="energyMeterCount" class="text-muted small text-center"></div>
                        </button>
                    </div>
                    <div class="px-4 py-2 border-top">
                        <button id="btnWallbox" type="button" class="btn btn-transparent d-block w-100 ripple" data-bs-toggle="modal" data-bs-target="#modalWallbox">
                            <div class="fw-bold"><?php echo t("ss_wallbox") ?></div>
                            <div id="wallboxCount" class="text-muted small text-center"></div>
                        </button>
                    </div>
                    <div id="generatorRow" class="px-4 py-2 border-top d-none">
                        <button id="btnGenerator" type="button" class="btn btn-transparent d-block w-100 ripple" data-bs-toggle="modal" data-bs-target="#modalGenerator">
                            <div class="fw-bold"><?php echo t("ss_generator") ?></div>
                            <div id="generatorStatus" class="text-muted small text-center"></div>
                        </button>
                    </div>
                </div>

            </div>


        </div>


        <!-- Message & Submit Button -->
        <div id="settingParamsError" class="text-danger text-center mt-4 mt-md-5 mb-3 mb-md-4 d-none" style="font-size:1.25rem;"></div>
        <button id="btn_next" class="btn btn-lg btn-success btn-wide d-none" type="button" disabled><?php echo t("btn_continue"); ?></button>


    </div>




    <!-- Modal: Setting Parameters -->
    <div id="modalSettingParameters" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body text-center px-4 py-5">
                    <div id="settingParamsIcon" class="mt-2 mb-3">
                        <div class="spinner-border text-success" style="width:3rem;height:3rem;"></div>
                    </div>
                    <p id="message" class="mb-0" style="font-size:1.25rem;"><?php echo t("ss_setting_parameters") ?></p>
                    <div id="setupProgress" class="text-muted text-truncate small mt-2"></div>
                </div>
            </div>
        </div>
    </div>

    
    <!-- Modal: Installer memo -->
    <div class="modal fade" id="modalInstallerMemo" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_installer_memo"); ?></h5>
                </div>
                <div class="modal-body">
                    <textarea id="installer_memo" class="form-control" rows="5"></textarea>
                    <p class="text-muted mt-3 mb-0" style="font-size:0.8rem"><i><?php echo t("ss_installer_memo_note"); ?></i></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success ripple" style="min-width:100px;" data-bs-dismiss="modal"><?php echo t("btn_save") ?></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Energy Meters -->
    <?php
        $energyMeterCards = [
            ["key" => "grid",    "titleKey" => "ss_em_grid",    "modbusId" => 1,   "conn" => "grid",   "hasLabel" => false,            "icon" => "bi-speedometer2"],
            ["key" => "extsol",  "titleKey" => "ss_em_extsol",  "modbusId" => 2,   "conn" => "extsol", "hasLabel" => false,            "icon" => "bi-sun"         ],
            ["key" => "extstor", "titleKey" => "ss_em_extstor", "modbusId" => 4,   "conn" => "yesno",  "hasLabel" => false,            "icon" => "bi-battery-half"],
            ["key" => "meter1",  "titleKey" => "ss_user_meter", "modbusId" => 101, "conn" => "user",   "hasLabel" => true, "num" => 1, "icon" => "bi-1-circle"    ],
            ["key" => "meter2",  "titleKey" => "ss_user_meter", "modbusId" => 102, "conn" => "user",   "hasLabel" => true, "num" => 2, "icon" => "bi-2-circle"    ],
            ["key" => "meter3",  "titleKey" => "ss_user_meter", "modbusId" => 103, "conn" => "user",   "hasLabel" => true, "num" => 3, "icon" => "bi-3-circle"    ],
            ["key" => "meter4",  "titleKey" => "ss_user_meter", "modbusId" => 104, "conn" => "user",   "hasLabel" => true, "num" => 4, "icon" => "bi-4-circle"    ],
        ];
    ?>
    <div class="modal fade" id="modalEnergyMeters" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_energy_meters") ?></h5>
                </div>
                <div class="modal-body p-3 pb-0">
                    <?php foreach ($energyMeterCards as $card): ?>
                        <?php
                            $key       = $card["key"];
                            $modbusId  = $card["modbusId"];
                            $conn      = $card["conn"];
                            $hasLabel  = $card["hasLabel"];
                            $isDisabled = ($conn === "grid" || $conn === "extsol");
                            $title = ($card["titleKey"] === "ss_user_meter") ? t("ss_user_meter") . " " . $card["num"] : t($card["titleKey"]);
                        ?>
                        <div class="card mb-3">
                            <div class="card-header h6">
                                <i class="bi <?php echo $card["icon"]; ?>"></i> <?php echo $title; ?>
                            </div>
                            <div class="card-body p-3">
                                <!-- Connected -->
                                <div class="row g-2 align-items-center">
                                    <label class="col-6 col-form-label col-form-label-sm text-muted" for="<?php echo $key; ?>_mode">
                                        <?php echo t("ss_meter_connected") ?>
                                        <?php if ($conn === "extsol"): ?>
                                            <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_em_extsol_connected_tooltip') ?>" class="text-decoration-none">(?)</a>
                                        <?php endif; ?>
                                    </label>
                                    <div class="col-6">
                                        <select id="<?php echo $key; ?>_mode" class="form-select form-select-sm"<?php echo $isDisabled ? " disabled" : ""; ?>>
                                            <?php if ($conn === "grid"): ?>
                                                <option value="1" selected><?php echo t("ss_em_yes_required") ?></option>
                                            <?php elseif ($conn === "extsol" || $conn === "yesno"): ?>
                                                <option value="0" selected><?php echo t("btn_no") ?></option>
                                                <option value="1"><?php echo t("btn_yes") ?></option>
                                            <?php else: /* user */ ?>
                                                <option value="0" selected><?php echo t("btn_no") ?></option>
                                                <option value="1"><?php echo t("btn_yes") ?></option>
                                                <option value="2"><?php echo t("ss_meter_external_load") ?></option>
                                            <?php endif; ?>
                                        </select>
                                    </div>
                                </div>
                                <!-- Config block (Model + Modbus ID / IP + Verify) -->
                                <div id="<?php echo $key; ?>_config" class="mt-2 d-none">
                                    <?php if ($hasLabel): ?>
                                        <!-- Label (user meters only) -->
                                        <div class="row g-2 mb-2 align-items-center">
                                            <label class="col-6 col-form-label col-form-label-sm text-muted" for="<?php echo $key; ?>_label"><?php echo t("ss_meter_label") ?></label>
                                            <div class="col-6"><input id="<?php echo $key; ?>_label" class="form-control form-control-sm" type="text" placeholder="<?php echo t("ss_user_meter") ?> <?php echo $card["num"]; ?>"></div>
                                        </div>
                                    <?php endif; ?>
                                    <!-- Model select -->
                                    <div class="row g-2 mb-2 align-items-center">
                                        <label class="col-6 col-form-label col-form-label-sm text-muted" for="<?php echo $key; ?>_tcp_model"><?php echo t("ss_em_model") ?></label>
                                        <div class="col-6">
                                            <select id="<?php echo $key; ?>_tcp_model" class="form-select form-select-sm">
                                                <option value="0"><?php echo t("ss_em_model_default") ?></option>
                                                <option value="1">Eastron SDM630 TCP</option>
                                            </select>
                                        </div>
                                    </div>
                                    <!-- Modbus ID (RTU) -->
                                    <div id="<?php echo $key; ?>_modbus_id_row" class="row g-2 align-items-center">
                                        <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_em_modbus_id") ?></label>
                                        <div class="col-6"><input type="text" class="form-control form-control-sm" value="<?php echo $modbusId; ?>" disabled></div>
                                    </div>
                                    <!-- IP + Verify (TCP) -->
                                    <div id="<?php echo $key; ?>_tcp_rows" class="d-none">
                                        <div class="row g-2 mb-2 align-items-center">
                                            <label class="col-6 col-form-label col-form-label-sm text-muted" for="<?php echo $key; ?>_tcp_ip"><?php echo t("ss_em_ip_address") ?></label>
                                            <div class="col-6"><input type="text" id="<?php echo $key; ?>_tcp_ip" class="form-control form-control-sm" placeholder="192.168.1.100"></div>
                                        </div>
                                        <div class="row g-2 align-items-center">
                                            <div class="col-6"></div>
                                            <div class="col-6 d-flex align-items-center">
                                                <span id="<?php echo $key; ?>_verify_result" class="lh-1" style="font-size:1.5rem"></span>
                                                <button type="button" id="<?php echo $key; ?>_verify_btn" class="btn btn-sm btn-outline-success d-flex justify-content-center align-items-center flex-grow-1 ripple" disabled><?php echo t("ss_em_verify_communication") ?></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success ripple" style="min-width:100px;" data-bs-dismiss="modal"><?php echo t("btn_save") ?></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Wallbox (EV Charger) -->
    <div id="modalWallbox" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_wallbox") ?></h5>
                </div>
                <div class="modal-body p-0">

                    <!-- Name + Producer / Model -->
                     <div class="p-3">
                        <div class="row g-2 mb-2 align-items-center">
                            <label for="evcTitle" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_name") ?></label>
                            <div class="col-6">
                                <input type="text" id="evcTitle" class="form-control form-control-sm" placeholder="Garage, Carport...">
                            </div>
                        </div>
                        <div class="row g-2 align-items-center">
                            <label for="evcProducer" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_producer") ?></label>
                            <div class="col-6">
                                <select id="evcProducer" class="form-select form-select-sm">
                                    <option value="0"><?php echo t("ss_evc_disabled") ?></option>
                                    <option value="1">Spelsberg Wallbox Smart Pro</option>
                                </select>
                            </div>
                        </div>
                        <div id="evcProducerInfoRow" class="d-none text-center mt-3">
                            <a id="evcProducerInfoLink" href="#" target="_blank" class="small">
                                <?php echo t("ss_evc_producer_info") ?>
                            </a>
                        </div>
                    </div>

                    <!-- Network Configuration -->
                    <div id="evcNetworkCard" class="p-3 border-top d-none">
                        <div class="card">
                            <div class="card-header h6">
                                <i class="bi bi-ethernet"></i> <?php echo t("ss_evc_network_config") ?>
                            </div>
                            <div class="card-body p-3">
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="evcIp" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_ip_address") ?></label>
                                    <div class="col-6">
                                        <input type="text" id="evcIp" class="form-control form-control-sm" placeholder="192.168.1.100">
                                    </div>
                                </div>
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="evcPort" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_port") ?></label>
                                    <div class="col-6">
                                        <input type="number" id="evcPort" class="form-control form-control-sm" min="1" max="65535" placeholder="502">
                                    </div>
                                </div>
                                <div class="row g-2 align-items-center">
                                    <div class="col-6"></div>
                                    <div class="col-6 d-flex align-items-center">
                                        <span id="evcVerifyResult" class="lh-1" style="font-size:1.875rem"></span>
                                        <button type="button" id="btnEvcVerify" class="btn btn-sm btn-outline-success d-flex justify-content-center align-items-center flex-grow-1 ripple" disabled>
                                            <?php echo t("ss_evc_verify_communication"); ?>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Electrical Wiring -->
                    <div id="evcElectricalCard" class="px-3 pb-3 d-none">
                        <div class="card">
                            <div class="card-header h6">
                                <i class="bi bi-lightning-charge"></i> <?php echo t("ss_evc_electrical_wiring") ?>
                            </div>
                            <div class="card-body p-3">
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="evcWiring" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_physical_wiring") ?></label>
                                    <div class="col-6">
                                        <select id="evcWiring" class="form-select form-select-sm">
                                            <option value="0"><?php echo t("ss_evc_wiring_3phase") ?></option>
                                            <option value="1"><?php echo t("ss_evc_wiring_l1") ?></option>
                                            <option value="2"><?php echo t("ss_evc_wiring_l2") ?></option>
                                            <option value="3"><?php echo t("ss_evc_wiring_l3") ?></option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="evcPhaseMode" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_phase_switching") ?></label>
                                    <div class="col-6">
                                        <select id="evcPhaseMode" class="form-select form-select-sm">
                                            <option value="0"><?php echo t("ss_evc_phase_auto") ?></option>
                                            <option value="1"><?php echo t("ss_evc_phase_1phase") ?></option>
                                            <option value="3"><?php echo t("ss_evc_phase_3phase") ?></option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-2 mb-2 align-items-center">
                                    <label for="evcMinCurrent" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_min_current") ?></label>
                                    <div class="col-6">
                                        <select id="evcMinCurrent" class="form-select form-select-sm">
                                            <option value="6">6 A</option>
                                            <option value="7">7 A</option>
                                            <option value="8">8 A</option>
                                            <option value="9">9 A</option>
                                            <option value="10">10 A</option>
                                            <option value="11">11 A</option>
                                            <option value="12">12 A</option>
                                            <option value="13">13 A</option>
                                            <option value="14">14 A</option>
                                            <option value="15">15 A</option>
                                            <option value="16">16 A</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-2 align-items-center">
                                    <label for="evcMaxCurrent" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_evc_max_current") ?></label>
                                    <div class="col-6">
                                        <select id="evcMaxCurrent" class="form-select form-select-sm">
                                            <option value="6">6 A</option>
                                            <option value="7">7 A</option>
                                            <option value="8">8 A</option>
                                            <option value="9">9 A</option>
                                            <option value="10">10 A</option>
                                            <option value="11">11 A</option>
                                            <option value="12">12 A</option>
                                            <option value="13">13 A</option>
                                            <option value="14">14 A</option>
                                            <option value="15">15 A</option>
                                            <option value="16">16 A</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <?php if ($isVde4105): ?>
                    <!-- §14a EnWG limit (display-only, mirrored from the SteuVE section) -->
                    <div id="evcSteuveCard" class="px-3 pb-3 d-none">
                        <div class="card">
                            <div class="card-header h6">
                                <i class="bi bi-sliders"></i> <?php echo t("ss_steuve_title") ?>
                            </div>
                            <div class="card-body p-3">
                                <div class="form-check">
                                    <input type="checkbox" class="form-check-input" id="evcSteuveLimit" disabled>
                                    <label class="form-check-label" for="evcSteuveLimit"><?php echo t("ss_evc_steuve_limit") ?> <a href="javascript:;" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="<?php echo t('ss_evc_steuve_limit_tooltip') ?>" class="text-decoration-none">(?)</a></label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success ripple" style="min-width:100px;" data-bs-dismiss="modal"><?php echo t("btn_save") ?></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Generator -->
    <div id="modalGenerator" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_generator") ?></h5>
                </div>
                <div class="modal-body p-0">

                    <!-- Type + Power (Mobile, Stationary, Off-grid) -->
                    <div class="p-3">
                        <div class="row g-2 align-items-center">
                            <label for="generatorType" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_type") ?></label>
                            <div class="col-6">
                                <select id="generatorType" class="form-select form-select-sm">
                                    <option value="0"><?php echo t("ss_gen_type_none") ?></option>
                                    <option value="1"><?php echo t("ss_gen_type_mobile") ?></option>
                                    <option value="2"><?php echo t("ss_gen_type_stationary") ?></option>
                                    <option value="3"><?php echo t("ss_gen_type_offgrid") ?></option>
                                </select>
                            </div>
                        </div>
                        <div id="generatorPowerRows" class="d-none mt-2">
                            <div class="row g-2 mb-2 align-items-center">
                                <label for="generatorRatedPower" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_rated_power") ?></label>
                                <div class="col-6">
                                    <div class="input-group input-group-sm">
                                        <input type="number" id="generatorRatedPower" class="form-control" min="0.1" max="6000" step="0.1">
                                        <span class="input-group-text">kVA</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-2 align-items-center">
                                <label for="generatorDesiredPower" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_desired_power") ?></label>
                                <div class="col-6">
                                    <div class="input-group input-group-sm">
                                        <input type="number" id="generatorDesiredPower" class="form-control" min="1" max="100" step="1">
                                        <span class="input-group-text">%</span>
                                    </div>
                                </div>
                            </div>
                            <p class="text-muted mt-3 mb-0" style="font-size: 0.8rem;"><?php echo t("ss_gen_power_info") ?></p>
                        </div>
                    </div>

                    <!-- Automatic start (Stationary, Off-grid) -->
                    <div id="generatorAutoRows" class="p-3 border-top d-none">
                        <div class="row g-2 mb-2 align-items-center">
                            <label for="generatorStartSoc" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_start_soc") ?></label>
                            <div class="col-6">
                                <div class="input-group input-group-sm">
                                    <input type="number" id="generatorStartSoc" class="form-control" min="15" max="100" step="1">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                        </div>
                        <div class="row g-2 mb-2 align-items-center">
                            <label for="generatorStopSoc" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_stop_soc") ?></label>
                            <div class="col-6">
                                <div class="input-group input-group-sm">
                                    <input type="number" id="generatorStopSoc" class="form-control" min="15" max="100" step="1">
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                        </div>
                        <div class="row g-2 align-items-center">
                            <label for="generatorGpioOutput" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_gpio_output") ?></label>
                            <div class="col-6">
                                <select id="generatorGpioOutput" class="form-select form-select-sm">
                                    <option value="" hidden></option>
                                    <?php foreach ([1, 2, 3, 4] as $n): ?>
                                    <option value="<?php echo $n ?>"><?php echo t("ss_gen_output") ?> <?php echo $n ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                        <p class="text-muted mt-3 mb-0" style="font-size: 0.8rem;"><?php echo t("ss_gen_auto_info") ?></p>
                    </div>

                    <!-- Quiet time (Off-grid) -->
                    <div id="generatorQuietSection" class="p-3 border-top d-none">
                        <div class="row g-2 align-items-center">
                            <label for="generatorQuietMode" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_quiet_time") ?></label>
                            <div class="col-6">
                                <select id="generatorQuietMode" class="form-select form-select-sm">
                                    <option value="0"><?php echo t("ss_gen_quiet_off") ?></option>
                                    <option value="1"><?php echo t("ss_gen_quiet_on") ?></option>
                                </select>
                            </div>
                        </div>
                        <div id="generatorQuietRows" class="d-none mt-2">
                            <div class="row g-2 mb-2 align-items-center">
                                <label for="generatorQuietStart" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_quiet_start") ?></label>
                                <div class="col-6">
                                    <input type="time" id="generatorQuietStart" class="form-control form-control-sm">
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label for="generatorQuietEnd" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_quiet_end") ?></label>
                                <div class="col-6">
                                    <input type="time" id="generatorQuietEnd" class="form-control form-control-sm">
                                </div>
                            </div>
                            <div class="row g-2 mb-2 align-items-center">
                                <label for="generatorQuietTargetSoc" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_quiet_target_soc") ?></label>
                                <div class="col-6">
                                    <div class="input-group input-group-sm">
                                        <input type="number" id="generatorQuietTargetSoc" class="form-control" min="0" max="100" step="1">
                                        <span class="input-group-text">%</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-2 align-items-center">
                                <label for="generatorQuietEmergencySoc" class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_gen_quiet_emergency_soc") ?></label>
                                <div class="col-6">
                                    <div class="input-group input-group-sm">
                                        <input type="number" id="generatorQuietEmergencySoc" class="form-control" min="0" max="100" step="1">
                                        <span class="input-group-text">%</span>
                                    </div>
                                </div>
                            </div>
                            <p class="text-muted mt-3 mb-0" style="font-size: 0.8rem;"><?php echo t("ss_gen_quiet_info") ?></p>
                        </div>
                    </div>

                    <!-- Generator info (all types) -->
                    <div id="generatorInfoSection" class="p-3 border-top d-none">
                        <label for="generatorInfo" class="form-label small text-muted mb-1"><?php echo t("ss_gen_info") ?></label>
                        <textarea id="generatorInfo" class="form-control form-control-sm" rows="4" placeholder="<?php echo t("ss_gen_info_placeholder") ?>"></textarea>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success ripple" style="min-width:100px;" data-bs-dismiss="modal"><?php echo t("btn_save") ?></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Extended Parameters -->
    <div class="modal fade" id="modalExtendedParameters" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_reactive_extended_params") ?></h5>
                </div>
                <div class="modal-body p-0">

                    <?php if($isTor): ?>

                        <?php
                            // Get limits for extended parameter
                            function getExtendedParameterLimits($dataSettings, $parameterId, $unitMultiplier, $fallbackMin, $fallbackMax, $fallbackStep) {
                                if (!isset($dataSettings["Inverter"][$parameterId])) {
                                    return [
                                        'min'  => $fallbackMin,
                                        'max'  => $fallbackMax,
                                        'step' => $fallbackStep
                                    ];
                                }
                                $setting = $dataSettings["Inverter"][$parameterId];
                                $min  = $setting["v1"] * $unitMultiplier;
                                $max  = $setting["v2"] * $unitMultiplier;
                                $step = $setting["v3"] * $unitMultiplier;
                                return [
                                    'min'  => rtrim(rtrim(number_format($min,  3, '.', ''), '0'), '.'),
                                    'max'  => rtrim(rtrim(number_format($max,  3, '.', ''), '0'), '.'),
                                    'step' => rtrim(rtrim(number_format($step, 3, '.', ''), '0'), '.')
                                ];
                            }
                            // Add extended parameter to modal
                            function template_add_extended_parameter($id, $name, $value, $unit, $parameterId, $unitMultiplier, $fallbackStep, $fallbackMin, $fallbackMax) {
                                global $dataSettings;
                                $limits = getExtendedParameterLimits($dataSettings, $parameterId, $unitMultiplier, $fallbackMin, $fallbackMax, $fallbackStep);
                                return "
                                    <div class='row g-2 mb-1 align-items-center'>
                                        <label class='col-6 col-form-label col-form-label-sm text-muted' for='{$id}'>{$name}</label>
                                        <div class='col d-flex align-items-center'>
                                            <input id='{$id}' class='form-control form-control-sm tor-extended-param' type='number' step='{$limits['step']}' min='{$limits['min']}' max='{$limits['max']}' value='{$value}' placeholder='{$limits['min']} – {$limits['max']}' title='Range: {$limits['min']} - {$limits['max']}'>
                                        </div>
                                        <div class='col-auto' style='min-width:2rem;'>
                                            <span class='small text-muted'>{$unit}</span>
                                        </div>
                                    </div>
                                ";
                            }
                        ?>

                        <div class="p-3 border-bottom">
                            <div class="small fw-bold mb-2"><?php echo t("ss_ext_grid_connection") ?></div>
                            <?php echo template_add_extended_parameter("extended_maxGridVoltage", t("ss_ext_maxgridvoltage"), ($inverterModel >= "11000" ? "257.6" : "255.3"), "V", "212", 0.01, "0.1", "230.0", "264.5"); ?>
                            <?php echo template_add_extended_parameter("extended_minGridVoltage", t("ss_ext_mingridvoltage"), ($inverterModel >= "11000" ? "195.0" : "184.0"), "V", "211", 0.01, "0.1", "184.0", "230.0"); ?>
                            <?php echo template_add_extended_parameter("extended_maxGridFrequency", t("ss_ext_maxgridfrequency"), "51.5", "Hz", "214", 0.01, "0.01", "50.00", "51.50"); ?>
                            <?php echo template_add_extended_parameter("extended_minGridFrequency", t("ss_ext_mingridfrequency"), "47.5", "Hz", "213", 0.01, "0.01", "47.50", "50.00"); ?>
                        </div>

                        <div class="p-3 border-bottom">
                            <div class="small fw-bold mb-2"><?php echo t("ss_ext_grid_decoupling") ?></div>
                            <?php echo template_add_extended_parameter("extended_UeffOver1", "Ueff >", ($inverterModel >= "11000" ? "255.4" : "255.3"), "V", "232", 0.01, "0.1", "230.0", "299.0"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffUnder1", "Ueff <", "184.0", "V", "231", 0.01, "0.1", "23.0", "230.0"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffOver2", "Ueff >>", "264.5", "V", "240", 0.01, "0.1", "230.0", "299.0"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffUnder2", "Ueff <<", "57.5", "V", "239", 0.01, "0.1", "23.0", "230.0"); ?>
                            <?php echo template_add_extended_parameter("extended_fOver1", "f >", "51.5", "Hz", "234", 0.01, "0.01", "50.00", "55.00"); ?>
                            <?php echo template_add_extended_parameter("extended_fUnder1", "f <", "47.5", "Hz", "233", 0.01, "0.01", "45.00", "50.00"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffOver1Time", "Ueff >", "0.1", "sec", "236", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffUnder1Time", "Ueff <", "1.5", "sec", "235", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffOver2Time", "Ueff >>", "0.1", "sec", "244", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_UeffUnder2Time", "Ueff <<", "0.5", "sec", "243", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_fOver1Time", "f >", "0.1", "sec", "238", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_fUnder1Time", "f <", "0.1", "sec", "237", 0.001, "0.02", "0", "1000.000"); ?>
                            <?php echo template_add_extended_parameter("extended_Ueff", t("ss_ext_ueff"), "255.3", "V", "205", 0.01, "0.1", "230.0", "299.0"); ?>
                            <?php
                                if($hasGridReconnectDelay) {
                                    echo template_add_extended_parameter("extended_gridConnectDelay", t("ss_ext_gridconnectdelay"), "60", "sec", "215", 1, "1", "1", "300");
                                    echo template_add_extended_parameter("extended_gridReconnectDelay", t("ss_ext_gridreconnectdelay"), "300", "sec", "225", 1, "1", "1", "300");
                                } else {
                                    echo template_add_extended_parameter("extended_gridConnectDelay", t("ss_ext_gridconnectdelay"), "300", "sec", "215", 1, "1", "1", "300");
                                }
                            ?>
                        </div>

                        <div class="p-3 border-bottom">
                            <div class="small fw-bold mb-2"><?php echo t("ss_ext_overvoltage_reduction") ?></div>
                            <?php echo template_add_extended_parameter("extended_puTime", t("ss_ext_putime"), "5", "sec", "336", 0.001, "1", "3", "60"); ?>
                        </div>

                    <?php endif; ?>

                    <?php if($isVde4105 || $isTor || $isEstonia): ?>
                        <div class="p-3">
                            <div class="small fw-bold mb-2"><?php echo t("ss_ext_overfrequency_reduction") ?></div>
                            <div class="row g-2 mb-1 align-items-center">
                                <label class="col-6 col-form-label col-form-label-sm text-muted" for="extended_lfsmoThreshold"><?php echo t("ss_ext_start_of_reduction") ?></label>
                                <div class="col d-flex align-items-center">
                                    <select id="extended_lfsmoThreshold" class="form-select form-select-sm">
                                        <option value="5020">50.2 Hz</option>
                                        <option value="5030">50.3 Hz</option>
                                        <option value="5040">50.4 Hz</option>
                                        <option value="5050">50.5 Hz</option>
                                    </select>
                                </div>
                            </div>
                            <?php if($hasLfsmoDroop): ?>
                                <div class="row g-2 mb-0 align-items-center">
                                    <label class="col-6 col-form-label col-form-label-sm text-muted" for="extended_lfsmoDroop"><?php echo t("ss_ext_droop") ?></label>
                                    <div class="col d-flex align-items-center">
                                        <select id="extended_lfsmoDroop" class="form-select form-select-sm">
                                            <option value="200">2 %</option>
                                            <option value="300">3 %</option>
                                            <option value="400">4 %</option>
                                            <option value="500">5 %</option>
                                            <option value="600">6 %</option>
                                            <option value="700">7 %</option>
                                            <option value="800">8 %</option>
                                            <option value="900">9 %</option>
                                            <option value="1000">10 %</option>
                                            <option value="1100">11 %</option>
                                            <option value="1200">12 %</option>
                                        </select>
                                    </div>
                                </div>
                            <?php else: ?>
                                <div class="row g-2 mb-0 align-items-center">
                                    <label class="col-6 col-form-label col-form-label-sm text-muted" for="extended_lfsmoSlope"><?php echo t("ss_ext_gradient") ?></label>
                                    <div class="col d-flex align-items-center">
                                        <input id="extended_lfsmoSlope" class="form-control form-control-sm" type="number" step="1" min="10" max="100" value="40" placeholder="40">
                                    </div>
                                    <div class="col-auto" style="min-width:2rem;">
                                        <span class="small text-muted">%</span>
                                    </div>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-success ripple" style="min-width:100px;" data-bs-dismiss="modal"><?php echo t("btn_save") ?></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Error, inverter registered with other system -->
    <div class="modal fade" id="errorInverterRegisteredWithOtherSystem" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center">
                    <span style="color: red"><b><?php echo t("ss_inverter_registered_other") ?></b></span>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Error, battery not exist or with other system -->
    <div class="modal fade" id="errorBatteryNotExistOrWithOtherSystem" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center">
                    <span style="color: red"><b><?php echo t("ss_battery_not_exist_or_other") ?></b></span>
                    <div class="mt-3">
                        <span class="d-block"><b><?php echo t("serialnumber") ?></b></span>
                        <input id="errorBatterySerial" type="text" class="form-control text-center mt-2 px-2" style="font-size:95%" readonly>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Error, bms not exist or with other system -->
    <div class="modal fade" id="errorBmsNotExistOrWithOtherSystem" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-body text-center">
                    <span style="color: red"><b><?php echo t("ss_bms_not_exist_or_other") ?></b></span>
                    <div class="mt-3">
                        <span class="d-block"><b><?php echo t("serialnumber") ?></b></span>
                        <input id="errorBmsSerial" type="text" class="form-control text-center mt-2 px-2" style="font-size:95%" readonly>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Confirm UPS/Backup Mode -->
    <div class="modal fade" id="modalConfirmUpsMode" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_upsmode_confirm_title") ?></h5>
                </div>
                <div class="modal-body">
                    <p><?php echo t("ss_upsmode_confirm_message") ?></p>
                    <img class="img-fluid rounded" src="img/clix_ups_mode.png">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo t("btn_confirm") ?></b></button>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade" id="modalConfirmBackupMode" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_backupmode_confirm_title") ?></h5>
                </div>
                <div class="modal-body">
                    <p><?php echo t("ss_backupmode_confirm_message") ?></p>
                    <img class="img-fluid rounded" src="img/clix_backup_mode.png">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo t("btn_confirm") ?></b></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Confirm other batteries -->
    <div class="modal fade" id="modalConfirmOtherBatteries" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_otherbatteries_confirm_title") ?></h5>
                </div>
                <div class="modal-body">
                    <p class="mb-3"><?php echo t("ss_otherbatteries_confirm_message1") ?></p>
                    <p class="mb-0" style="color:red"><?php echo t("ss_otherbatteries_confirm_message2") ?></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo t("btn_confirm") ?></b></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Confirm PE on protected output (i/c/k-Series) -->
    <div class="modal fade" id="modalConfirmPeOutput" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_pe_confirm_title") ?></h5>
                </div>
                <div class="modal-body">
                    <p class="mb-3"><?php echo t("ss_pe_confirm_message1") ?></p>
                    <p class="mb-0" style="color:red"><?php echo t("ss_pe_confirm_message2") ?></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo t("btn_confirm") ?></b></button>
                </div>
            </div>
        </div>
    </div>


    <!-- Modal: Confirm internal solar -->
    <div class="modal fade" id="modalConfirmInternalSolar" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title"><?php echo t("ss_internalsolar_confirm_title") ?></h5></div>
                <div class="modal-body">
                    <p class="message mb-0"></p>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo t("btn_confirm") ?></b></button></div>
            </div>
        </div>
    </div>


    <!-- Modal: Confirm Extended Parameters -->
    <div class="modal fade" id="modalConfirmExtendedParameters" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?php echo t("ss_extendedparams_confirm_title") ?></h5>
                </div>
                <div class="modal-body p-0">

                    <div class="p-3 border-bottom">
                        <p class="message text-muted mb-0"><?php echo t("ss_extendedparams_confirm_message") ?></p>
                    </div>

                    <div class="p-3 border-bottom">
                        <div class="small fw-bold mb-2"><?php echo t("ss_ext_grid_connection") ?></div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_maxgridvoltage") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_maxGridVoltage" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_mingridvoltage") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_minGridVoltage" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_maxgridfrequency") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_maxGridFrequency" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">Hz</span></div>
                        </div>
                        <div class="row g-2 mb-0 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_mingridfrequency") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_minGridFrequency" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">Hz</span></div>
                        </div>
                    </div>

                    <div class="p-3 border-bottom">
                        <div class="small fw-bold mb-2"><?php echo t("ss_ext_grid_decoupling") ?></div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff ></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffOver1" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff <</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffUnder1" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff >></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffOver2" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff <<</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffUnder2" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">f ></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_fOver1" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">Hz</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">f <</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_fUnder1" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">Hz</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff ></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffOver1Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff <</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffUnder1Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff >></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffOver2Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">Ueff <<</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_UeffUnder2Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">f ></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_fOver1Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted">f <</label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_fUnder1Time" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <div class="row g-2 mb-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_ueff") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_Ueff" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">V</span></div>
                        </div>
                        <div class="row g-2 mb-0 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_gridconnectdelay") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_gridConnectDelay" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <?php if($hasGridReconnectDelay): ?>
                        <div class="row g-2 mb-0 pt-1 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_gridreconnectdelay") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_gridReconnectDelay" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                        <?php endif; ?>
                    </div>

                    <div class="p-3 border-bottom">
                        <div class="small fw-bold mb-2"><?php echo t("ss_ext_overvoltage_reduction") ?></div>
                        <div class="row g-2 mb-0 align-items-center">
                            <label class="col-6 col-form-label col-form-label-sm text-muted"><?php echo t("ss_ext_putime") ?></label>
                            <div class="col d-flex align-items-center"><input id="confirmExtended_puTime" class="form-control form-control-sm" type="text" disabled></div>
                            <div class="col-auto" style="min-width:2rem;"><span class="small text-muted">sec</span></div>
                        </div>
                    </div>

                </div>
                <div class="modal-footer justify-content-between">
                    <button type="button" class="modify  btn btn-primary ripple" style="min-width:40%"><?php echo t("btn_modify") ?></button>
                    <button type="button" class="confirm btn btn-success ripple" style="min-width:40%"><?php echo t("btn_confirm") ?></button>
                </div>
            </div>
        </div>
    </div>




    <?php include_once "common/footer.php"; ?>

    <script>
        const apikey = <?php echo json_encode($_SESSION["box_apikey"] ?? ""); ?>;

        const isVde4105              = <?php echo $isVde4105              ? "true" : "false"; ?>;
        const isTor                  = <?php echo $isTor                  ? "true" : "false"; ?>;
        const isEstonia              = <?php echo $isEstonia              ? "true" : "false"; ?>;
        const customerEmail          = <?php echo json_encode($customerEmail); ?>;
        const inverterModel          = <?php echo json_encode($inverterModel); ?>;
        const systemTimezone         = <?php echo json_encode($systemTimezone); ?>;
        const isSinglePhase          = <?php echo $isSinglePhase          ? "true" : "false"; ?>;
        const hasSolarWideInputRange = <?php echo $hasSolarWideInputRange ? "true" : "false"; ?>;
        const hasGridReconnectDelay  = <?php echo $hasGridReconnectDelay  ? "true" : "false"; ?>;
        const hasLfsmoDroop          = <?php echo $hasLfsmoDroop          ? "true" : "false"; ?>;

        const importedProject        = <?php echo $importedProjectJs; ?>;
    </script>

    <script src="js/system_setup.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
