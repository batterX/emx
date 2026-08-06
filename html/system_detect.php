<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 4;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




// Use for country-specific grid standard UI
$installationCountry = isset($_SESSION["installation_country"]) ? $_SESSION["installation_country"] : "de";

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/system_detect.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">

        <h1 id="pageTitle" class="mb-4">batterX</h1>

        <!-- Loading State -->
        <div id="inverterLoading" class="card text-center p-4 p-md-5">
            <div id="loadingStatusIcon">
                <div class="spinner-border text-success"></div>
            </div>
            <p id="loadingText" class="mt-3 mb-0"><?= $lang["sd_connecting"] ?></p>
            <p id="loadingHint" class="d-none text-danger small mt-2"><?= $lang["sd_hint"] ?></p>
            <p id="loadingCountdown" class="d-none text-muted small mt-2 mb-0"></p>
        </div>

        <!-- Detected State (hidden until inverter confirmed) -->
        <div id="inverterDetected" class="d-none">

            <!-- Card: Device Info -->
            <div class="card mb-4">
                <div class="card-body p-4 text-center">
                    <img id="deviceImage" src="" class="device-img mb-3" alt="">
                    <p id="serialNumber" class="fs-5 mb-0"></p>
                </div>
            </div>

            <!-- Card: Firmware Up To Date -->
            <div id="firmwareUpToDate" class="card text-start mb-4 d-none">
                <div class="card-body p-4 d-flex align-items-center justify-content-center gap-2">
                    <i class="bi bi-check-circle-fill text-success fs-4 flex-shrink-0"></i>
                    <?= $lang["sd_firmware_up_to_date"] ?>
                </div>
            </div>

            <!-- Card: Firmware Update Needed -->
            <div id="firmwareUpdate" class="card mb-4 text-start d-none">
                <div class="card-header">
                    <i class="bi bi-arrow-up-circle"></i>
                    <?= $lang["sd_firmware_update"] ?>
                </div>
                <div class="card-body p-4 text-center">

                    <div class="row g-3 mb-3">
                        <div class="col-12 col-sm-6">
                            <div class="p-2 border rounded">
                                <p class="small mb-1"><?= $lang["sd_installed_version"] ?></p>
                                <div class="small">
                                    <div id="installedVersion" class="font-monospace small"></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-sm-6">
                            <div class="p-2 border rounded">
                                <p class="small mb-1"><?= $lang["sd_latest_version"] ?></p>
                                <div class="small">
                                    <div id="latestVersion" class="font-monospace small"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="estimatedDurationContainer" class="mb-3">
                        <?= $lang["sd_estimated_duration"] ?> <b id="estimatedDuration"></b>
                    </div>

                    <div>
                        <button id="firmwareUpdateStart" class="btn btn-success btn-wide ripple"><?= $lang["sd_begin_fw_update"] ?></button>
                    </div>

                    <div id="firmwareUpdateProgress" class="mt-4 d-none">
                        <div class="progress mb-2">
                            <div id="firmwareUpdateProgressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width:0%;"></div>
                        </div>
                        <p id="firmwareUpdateProgressText" class="text-muted small mb-0"><?= $lang["sd_updating_fw_wait"] ?></p>
                    </div>

                </div>
            </div>

            <!-- Card: Grid Standard -->
            <div id="gridStandardCard" class="card mb-4 text-start d-none">
                <div class="card-header">
                    <i class="bi bi-lightning-charge"></i>
                    <?= $lang["sd_grid_standard"] ?>
                </div>
                <div class="card-body p-4">

                    <div id="gridStatus" class="d-flex align-items-center justify-content-center gap-2">
                        <i id="gridStatusIcon" class="bi fs-4"></i>
                        <span id="gridStatusText"></span>
                    </div>

                    <!-- Germany-specific selector (VDE4105 / VDE0126) -->
                    <div id="germanySelector" class="mt-3 d-none">
                        <div class="d-flex gap-2 justify-content-center">
                            <select id="germanyMachineModelSelect" class="form-select">
                                <option value="2">VDE4105</option>
                                <option value="1">VDE0126</option>
                            </select>
                            <button id="germanyMachineModelBtn" class="btn btn-secondary ripple flex-shrink-0" disabled><?= $lang["sd_apply"] ?></button>
                        </div>
                    </div>

                    <!-- General selector (all available standards) -->
                    <div id="generalSelector" class="mt-3 d-none">
                        <div class="d-flex gap-2 justify-content-center">
                            <select id="machineModelSelect" class="form-select"></select>
                            <button id="machineModelBtn" class="btn btn-secondary ripple flex-shrink-0" disabled><?= $lang["sd_apply"] ?></button>
                        </div>
                    </div>

                    <!-- Applying spinner -->
                    <div id="gridApplying" class="d-none">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                            <div class="spinner-border text-success" style="width:1.5rem;height:1.5rem;border-width:2px;"></div>
                            <span><?= $lang["sd_applying_standard"] ?></span>
                        </div>
                    </div>

                </div>
            </div>

        </div>

        <button id="btn_continue" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none" disabled><?= $lang["btn_continue"] ?></button>

    </div>




    <!-- Modal: Confirm device standard (Germany without VDE4105) -->
    <div class="modal fade" id="modalConfirmDeviceStandard" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?= $lang["sd_confirm_title"] ?></h5>
                </div>
                <div class="modal-body">
                    <p id="modalConfirmDeviceStandardBody" class="mb-0"></p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary flex-grow-1 ripple" data-bs-dismiss="modal"><?= $lang["btn_no"] ?></button>
                    <button id="modalConfirmDeviceStandardBtn" class="btn btn-success flex-grow-1 ripple"><?= $lang["btn_yes"] ?></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: No battery detected -->
    <div class="modal fade" id="modalNoBattery" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?= $lang["sd_no_battery_title"] ?></h5>
                </div>
                <div class="modal-body">
                    <p><?= $lang["sd_no_battery_check"] ?></p>
                    <button type="button" class="refresh btn btn-success w-100 mb-3 ripple"><?= $lang["sd_no_battery_refresh"] ?></button>
                    <p><?= $lang["sd_no_battery_confirm_text"] ?></p>
                    <button type="button" class="confirm btn btn-warning w-100 ripple"><?= $lang["sd_no_battery_confirm"] ?></button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Confirm firmware update -->
    <div class="modal fade" id="modalConfirmFirmwareUpdate" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><?= $lang["sd_fw_note_title"] ?></h5>
                </div>
                <div class="modal-body">
                    <p><?= $lang["sd_fw_note_body1"] ?></p>
                    <p class="mb-3"><?= $lang["sd_fw_note_body2"] ?></p>
                    <button type="button" class="confirm btn btn-success w-100 ripple"><?= $lang["sd_begin_fw_update"] ?></button>
                </div>
            </div>
        </div>
    </div>




    <?php include_once "common/footer.php"; ?>

    <script>
        const installationCountry      = <?php echo json_encode($installationCountry); ?>;

        const iArmLatestVersion        = <?php echo json_encode($iArmLatestVersion); ?>;
        const iDspSmLatestVersion      = <?php echo json_encode($iDspSmLatestVersion); ?>;
        const iDspLgLatestVersion      = <?php echo json_encode($iDspLgLatestVersion); ?>;
        const iBmsLatestVersion        = <?php echo json_encode($iBmsLatestVersion); ?>;
        const iArmEstimatedDuration    = <?php echo json_encode($iArmEstimatedDuration); ?>;
        const iDspSmEstimatedDuration  = <?php echo json_encode($iDspSmEstimatedDuration); ?>;
        const iDspLgEstimatedDuration  = <?php echo json_encode($iDspLgEstimatedDuration); ?>;
        const iBmsEstimatedDuration    = <?php echo json_encode($iBmsEstimatedDuration); ?>;

        const cMergedLatestVersion     = <?php echo json_encode($cMergedLatestVersion); ?>;
        const cMergedEstimatedDuration = <?php echo json_encode($cMergedEstimatedDuration); ?>;
    </script>

    <script src="js/system_detect.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
