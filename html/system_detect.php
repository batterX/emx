<?php

/*
    System Detect
*/

// Include Base
include_once "common/base.php";

// Set Step
$step = 4;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
    header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

// Get Installation Country
$installationCountry = isset($_SESSION["installation_country"]) ? $_SESSION["installation_country"] : "de";

?>





<!DOCTYPE html>

<html>

    <head>

        <?php include_once "common/head.php"; ?>

        <link rel="stylesheet" href="css/system_detect.css?v=<?php echo $versionHash; ?>">

    </head>

    <body>





        <!-- Progress Bar -->
        <div id="progress" class="shadow-lg">
            <div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
            <div><button id="btn_next" class="btn btn-success ripple" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
        </div>
        <!-- Progress Bar -->





        <main>



            <div id="inverterUnknown" class="container elevate-1">
                <h1><?php echo $lang["system_detect"]["inverter_unknown"] ?></h1>
                <div>
                    <div class="notif loading"></div>
                    <span class="message"><?php echo $lang["system_detect"]["please_connect_inverter"]; ?></span>
                </div>
            </div>



            <div id="inverterDetected" class="container d-none">

                <div class="card elevate-1">
                    <div class="card-body">
                        <h1>batter<span class="x">X</span> <span class="model"></span></h1>
                        <img src="">
                        <span class="serialnumber">S/N: <b></b></span>
                    </div>
                </div>

                <div id="firmwareUpdateSuccess" class="card elevate-1 mt-3 py-2 d-none">
                    <div class="card-body d-flex justify-content-center align-items-center py-3">
                        <div class="cert-status notif success d-block mr-3"></div>
                        <div class="fw-update-title text-success"><?php echo $lang["system_detect"]["firmware_update"]; ?></div>
                    </div>
                </div>

                <div id="firmwareUpdateContainer" class="card elevate-1 mt-3 py-2 d-none">
                    <div class="card-body py-4">
                        <div class="fw-update-title"><?php echo $lang["system_detect"]["firmware_update"]; ?></div>
                        <div class="mt-4">
                            <div class="small"><?php echo $lang["system_detect"]["installed_version"]; ?></div>
                            <div id="installedVersion" class="text-monospace small mt-1" style="line-height: 1.25"></div>
                        </div>
                        <div class="mt-3">
                            <div class="small"><?php echo $lang["system_detect"]["latest_version"]; ?></div>
                            <div id="latestVersion" class="text-monospace small mt-1" style="line-height: 1.25"></div>
                        </div>
                        <div id="estimatedDurationContainer" class="mt-4" style="font-size:0.9rem"><?php echo $lang["system_detect"]["estimated_duration"]; ?>: <b id="estimatedDuration"></b></div>
                        <div class="px-2 mx-1 mt-2">
                            <button id="firmwareUpdateStart" class="btn btn-sm px-4 py-2 btn-success ripple"><b><?php echo $lang["system_detect"]["start_firmware_update"]; ?></b></button>
                            <div id="firmwareUpdateProgress" class="d-none mt-4 pt-2 px-4">
                                <div class="progress">
                                    <div id="firmwareUpdateProgressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar"></div>
                                </div>
                                <div id="firmwareUpdateProgressText" class="text-center mt-2 small"><?php echo $lang["system_detect"]["updating_firmware"]; ?></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="machineModelContainer" class="card elevate-1 mt-3 py-2 d-none">
                    <div class="card-body py-4">
                        <div class="standard-cont">
                            <div class="cert-status notif loading"></div>
                            <span class="standard">TOR</span>
                        </div>
                        <div>
                            <div id="germanyMachineModelBox" class="mt-4 mb-2 d-none">
                                <select id="germanyMachineModelSelect" class="custom-select custom-select-outline border-secondary">
                                    <option value="2">VDE4105</option>
                                    <option value="1">VDE0126</option>
                                </select>
                                <button id="germanyMachineModelBtn" class="btn btn-secondary ripple"><?php echo $lang["btn"]["apply"] ?></button>
                            </div>
                        </div>
                        <div>
                            <div id="machineModelBox" class="mt-4 mb-2 d-none">
                                <select id="machineModelSelect" class="custom-select custom-select-outline border-danger"></select>
                                <button id="machineModelBtn" class="btn btn-danger ripple"><?php echo $lang["btn"]["apply"] ?></button>
                            </div>
                        </div>
                        <div>
                            <div class="cert-loading loading mt-4 mb-2"></div>
                        </div>
                    </div>
                </div>

            </div>



        </main>





        <div class="modal fade" id="modalConfirmDeviceStandard" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <h5 class="modal-header mb-0">Bestätigung</h5>
                    <div class="modal-body">
                        <p class="message mb-0">Möchten Sie die Auswall der Norm <b id="modalConfirmDeviceStandardValue">___</b> bestätigen?</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-sm btn-block btn-danger px-4 py-2 w-auto flex-grow-1 ripple" data-dismiss="modal"><b>Nein</b></button>
                        <button id="modalConfirmDeviceStandardBtn" type="button" class="btn btn-sm px-4 py-2 w-auto flex-grow-1 btn-success ripple"><b>Ja</b></button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalConfirmNoBattery" data-backdrop="static" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <h5 class="modal-header mb-0"><?php echo $lang["system_detect"]["no_battery_detected"]; ?></h5>
                    <div class="modal-body">
                        <p><?php echo $lang["system_detect"]["no_battery_detected_refresh_info"]; ?></p>
                        <div class="text-center">
                            <button type="button" class="refresh btn btn-sm px-4 py-2 btn-success w-100 ripple"><b><?php echo $lang["system_detect"]["no_battery_detected_refresh_btn"]; ?></b></button>
                        </div>
                        <p class="mt-3"><?php echo $lang["system_detect"]["no_battery_detected_confirm_info"]; ?></p>
                        <div class="text-center">
                            <button type="button" class="confirm btn btn-sm px-4 py-2 btn-warning w-100 ripple"><b><?php echo $lang["system_detect"]["no_battery_detected_confirm_btn"]; ?></b></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalConfirmFirmwareUpdate" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <h5 class="modal-header mb-0"><?php echo $lang["system_detect"]["please_note"]; ?></h5>
                    <div class="modal-body">
                        <p><?php echo $lang["system_detect"]["please_note_info_1"]; ?></p>
                        <p><?php echo $lang["system_detect"]["please_note_info_2"]; ?></p>
                        <div class="text-center mt-3">
                            <button type="button" class="confirm btn btn-sm px-4 py-2 btn-success w-100 ripple"><b><?php echo $lang["system_detect"]["start_firmware_update"]; ?></b></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>





        <?php include_once "common/footer.php"; ?>

        <script>
            const installationCountry = <?php echo json_encode($installationCountry); ?>;
            
            const armLatestVersion = <?php echo json_encode($armLatestVersion); ?>;
            const dspSmLatestVersion = <?php echo json_encode($dspSmLatestVersion); ?>;
            const dspLgLatestVersion = <?php echo json_encode($dspLgLatestVersion); ?>;
            const bmsLatestVersion = <?php echo json_encode($bmsLatestVersion); ?>;

            const armEstimatedDuration = <?php echo json_encode($armEstimatedDuration); ?>;
            const dspSmEstimatedDuration = <?php echo json_encode($dspSmEstimatedDuration); ?>;
            const dspLgEstimatedDuration = <?php echo json_encode($dspLgEstimatedDuration); ?>;
            const bmsEstimatedDuration = <?php echo json_encode($bmsEstimatedDuration); ?>;
        </script>

        <script src="js/dist/moment.js?v=<?php echo $versionHash; ?>"></script>
        <script src="js/system_detect.js?v=<?php echo $versionHash; ?>"></script>

    </body>

</html>
