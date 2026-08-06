<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 6;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




$batteryType     = isset($_SESSION["battery_type"])     ? $_SESSION["battery_type"]             : "";
$batteryCapacity = isset($_SESSION["battery_capacity"]) ? intval($_SESSION["battery_capacity"]) : 0;
$systemMode      = isset($_SESSION["system_mode"])      ? $_SESSION["system_mode"]              : "0";
$noBattery       = ($batteryType == "other" && $batteryCapacity == 0) || $batteryType == "";
$backupMode      = ($systemMode == "1");

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/system_test.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">


        <h1 class="mb-4"><?php echo t("st_title"); ?></h1>


        <!-- Section: Energy Meter (always shown) -->
        <div class="card text-start mb-4" id="testEnergyMeterCard">
            <div class="card-header">
                <i class="bi bi-lightning-charge"></i> <?php echo t("st_energy_meter"); ?>
            </div>
            <div class="card-body p-4">
                <div class="d-flex align-items-center gap-3">
                    <div id="testEnergyMeterIcon" class="test-icon">
                        <i class="bi bi-circle text-secondary opacity-50"></i>
                    </div>
                    <div id="testEnergyMeterStatus" class="opacity-50">Waiting...</div>
                </div>
            </div>
        </div>


        <!-- Section: Battery Charging (hidden when no battery) -->
        <?php if (!$noBattery): ?>
        <div class="card text-start mb-4" id="testBatteryChargingCard">
            <div class="card-header">
                <i class="bi bi-battery-charging"></i> <?php echo t("st_battery_charging"); ?>
            </div>
            <div class="card-body p-4">
                <div class="d-flex align-items-center gap-3">
                    <div id="testBatteryChargingIcon" class="test-icon">
                        <i class="bi bi-circle text-secondary opacity-50"></i>
                    </div>
                    <div id="testBatteryChargingStatus" class="opacity-50">Waiting...</div>
                </div>
                <div id="testBatteryChargingAction" class="d-none alert alert-danger mt-4 mb-0" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i><span id="testBatteryChargingActionMessage"></span>
                </div>
            </div>
        </div>
        <?php endif; ?>


        <!-- Section: UPS Mode (hidden when no battery or in backup mode) -->
        <?php if (!$noBattery && !$backupMode): ?>
        <div class="card text-start mb-4" id="testUpsModeCard">
            <div class="card-header">
                <i class="bi bi-power"></i> <?php echo t("st_ups_mode"); ?>
            </div>
            <div class="card-body p-4">
                <div class="d-flex align-items-center gap-3">
                    <div id="testUpsModeIcon" class="test-icon">
                        <i class="bi bi-circle text-secondary opacity-50"></i>
                    </div>
                    <div id="testUpsModeStatus" class="opacity-50">Waiting...</div>
                </div>
                <div id="testUpsModeAction" class="d-none alert alert-danger mt-4 mb-0" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i><span id="testUpsModeActionMessage"></span>
                </div>
            </div>
        </div>
        <?php endif; ?>


        <!-- Continue Button -->

        <button id="btn_next" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple d-none" disabled><?= $lang["btn_continue"] ?></button>


    </div>




    <!-- Modal: Warnings (static backdrop, no close button, just reload page button) -->
    <div id="warningsModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header justify-content-center">
                    <h5 class="modal-title text-danger"><?php echo t("st_warning_title"); ?></h5>
                </div>
                <div class="modal-body text-center" id="warningMessage">
                </div>
                <div class="modal-footer">
                    <button id="btnWarningRetry" class="btn btn-success w-100 ripple"><?php echo t("btn_reload_page"); ?></button>
                </div>
            </div>
        </div>
    </div>




    <?php include_once "common/footer.php"; ?>

    <script>
        const batteryType = <?php echo json_encode($batteryType); ?>;
        const noBattery   = <?php echo json_encode($noBattery);   ?>;
        const backupMode  = <?php echo json_encode($backupMode);   ?>;
    </script>

    <script src="js/system_test.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
