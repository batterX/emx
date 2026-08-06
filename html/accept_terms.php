<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 7;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




// Fetch the historically-correct warranty markdown from the selector on api.batterx.app.
// The selector picks the file based on installer country, installation date, and device partnumber
// (which encodes the inverter series), returning the version that was in force at install time.
$warrantyUrl = "https://api.batterx.app/warranty/select.php?" . http_build_query([
    "installer_country" => $_SESSION["installer_country"]  ?? "",
    "installation_date" => $_SESSION["installation_date"]  ?? "",
    "device_partnumber" => $_SESSION["device_partnumber"]  ?? "",
    "file_type"         => "md",
]);
$warrantyMd = @file_get_contents($warrantyUrl) ?: null;

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/accept_terms.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">


        <h1 class="mb-4"><?php echo t("at_title"); ?></h1>


        <!-- Warranty Card -->
        <div class="card text-start mb-4 mb-md-5">
            <div class="card-body p-0">

                <!-- Error -->
                <div id="warrantyError" class="text-center p-5 d-none">
                    <i class="bi bi-exclamation-circle text-danger mb-3 d-block lh-1" style="font-size:3rem;"></i>
                    <div class="text-danger mb-4" id="warrantyErrorMessage" style="font-size:1.25rem;font-weight:300;"></div>
                    <button id="btnRetry" class="btn btn-success btn-wide ripple"><?php echo t("btn_reload_page"); ?></button>
                </div>

                <!-- Rendered markdown -->
                <div id="warrantyContent" class="d-none p-4"></div>

            </div>
        </div>


        <!-- Acceptance Section (revealed after warranty document loads) -->
        <div class="text-start d-none" id="acceptSection">
            <div class="form-check mb-4 mb-md-5">
                <input type="checkbox" class="form-check-input" id="checkboxAccept">
                <label class="form-check-label" for="checkboxAccept">
                    <?php echo $lang["at_accept_label"]; ?>
                </label>
            </div>
            <button id="btn_next" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple" style="visibility: hidden;"><?= t("btn_continue") ?></button>
        </div>


    </div>




    <?php include_once "common/footer.php"; ?>

    <script>const warrantyMd = <?php echo json_encode($warrantyMd); ?>;</script>
    <script src="js/accept_terms.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
