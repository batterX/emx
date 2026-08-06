<?php

// Include Base
include_once "common/base.php";
include_once "common/countries.php";

// Set Step
$step = 3;

// Enforce Installer Login
if(empty($_SESSION["installer_email"])) { header("location: installer_login.php"); exit; }




// Pre-select installer's country in dropdowns
$installerCountry = isset($_SESSION["installer_country"]) ? $_SESSION["installer_country"] : "de";

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/customer_info.css?v=<?php echo $versionHash; ?>">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">

        <h1 class="mb-4"><?php echo t("ci_title"); ?></h1>

        <!-- Card 1: Customer Information -->
        <div class="card mb-4 text-start">

            <div class="card-header">
                <i class="bi bi-person-circle"></i>
                <?php echo t("ci_section_customer"); ?>
            </div>

            <div class="card-body p-4">

                <div class="row g-2">

                    <div class="col-12">
                        <label for="email" class="form-label form-label-sm required"><?php echo t("ci_email_address"); ?></label>
                        <input id="email" type="email" class="form-control" required autofocus>
                        <p id="errorSameInstaller" class="d-none text-danger small lh-sm mt-1 mb-0"><?php echo t("ci_error_same_installer"); ?></p>
                        <p id="errorNoAccess"      class="d-none text-danger small lh-sm mt-1 mb-0"><?php echo t("ci_error_no_access"); ?></p>
                    </div>

                </div>

                <div class="row g-2 mt-3">

                    <div class="col-md-4">
                        <label for="gender" class="form-label form-label-sm"><?php echo t("ci_salutation"); ?></label>
                        <select id="gender" class="form-select">
                            <option value="0"><?php echo t("ci_gender_mr"); ?></option>
                            <option value="1"><?php echo t("ci_gender_ms"); ?></option>
                        </select>
                    </div>

                    <div class="col-md-4">
                        <label for="firstname" class="form-label form-label-sm required"><?php echo t("ci_firstname"); ?></label>
                        <input id="firstname" type="text" class="form-control" required>
                    </div>

                    <div class="col-md-4">
                        <label for="lastname" class="form-label form-label-sm required"><?php echo t("ci_lastname"); ?></label>
                        <input id="lastname" type="text" class="form-control" required>
                    </div>

                    <div class="col-md-6">
                        <label for="company" class="form-label form-label-sm"><?php echo t("ci_company"); ?></label>
                        <input id="company" type="text" class="form-control">
                    </div>

                    <div class="col-md-6">
                        <label for="telephone" class="form-label form-label-sm required"><?php echo t("ci_telephone"); ?></label>
                        <input id="telephone" type="text" class="form-control" required>
                    </div>

                </div>

                <div class="row g-2 mt-3">

                    <div class="col-md-4">
                        <?php echo renderCountrySelect("customer-country", $installerCountry, t("ci_country")); ?>
                    </div>

                    <div class="col-md-4">
                        <label for="customer-city" class="form-label form-label-sm required"><?php echo t("ci_city"); ?></label>
                        <input id="customer-city" type="text" class="form-control" required>
                    </div>

                    <div class="col-md-4">
                        <label for="customer-zip" class="form-label form-label-sm required"><?php echo t("ci_zip"); ?></label>
                        <input id="customer-zip" type="text" class="form-control" required>
                    </div>

                    <div class="col-12">
                        <label for="customer-address" class="form-label form-label-sm required"><?php echo t("ci_address"); ?></label>
                        <input id="customer-address" type="text" class="form-control" required>
                    </div>

                </div>

            </div>

        </div>

        <!-- Card 2: Installation Address -->
        <div class="card mb-4 text-start">

            <div class="card-header">
                <i class="bi bi-house-door"></i>
                <?php echo t("ci_section_installation"); ?>
            </div>

            <div class="card-body p-4">

                <div class="form-check m-0">
                    <input class="form-check-input" type="checkbox" id="sameAddress">
                    <label class="form-check-label" for="sameAddress"><?php echo t("ci_same_address"); ?></label>
                </div>

                <div id="installationAddress" class="row g-2 mt-3">

                    <div class="col-md-4">
                        <?php echo renderCountrySelect("installation-country", $installerCountry, t("ci_country")); ?>
                    </div>

                    <div class="col-md-4">
                        <label for="installation-city" class="form-label form-label-sm required"><?php echo t("ci_city"); ?></label>
                        <input id="installation-city" type="text" class="form-control" required>
                    </div>

                    <div class="col-md-4">
                        <label for="installation-zip" class="form-label form-label-sm required"><?php echo t("ci_zip"); ?></label>
                        <input id="installation-zip" type="text" class="form-control" required>
                    </div>

                    <div class="col-12">
                        <label for="installation-address" class="form-label form-label-sm required"><?php echo t("ci_address"); ?></label>
                        <input id="installation-address" type="text" class="form-control" required>
                    </div>

                </div>

                <!-- Location Map — always visible, even when same address is checked -->
                <div class="mt-4">
                    <label class="form-label form-label-sm required"><?php echo t("ci_location_map"); ?></label>
                    <div id="installationLocationMap" class="mb-0 rounded"></div>
                    <div class="d-flex justify-content-between align-items-center flex-wrap">
                        <small>
                            <button id="btnUseInstallationAddress" class="btn btn-link text-success p-0 text-nowrap"
                                    style="text-transform:none; font-size:inherit; vertical-align:baseline;">
                                <?php echo t("ci_use_installation_address"); ?>
                            </button>
                        </small>
                        <small class="text-muted text-nowrap" id="installationLocationCoords">&nbsp;</small>
                    </div>
                </div>
                <input id="installationLat" type="hidden">
                <input id="installationLon" type="hidden">

            </div>

        </div>

        <!-- Card 3: Technician on Site -->
        <div class="card mb-4 text-start">

            <div class="card-header">
                <i class="bi bi-person-gear"></i>
                <?php echo t("ci_installer_on_site"); ?>
            </div>

            <div class="card-body p-4">

                <label for="installer-on-site" class="form-label form-label-sm required"><?php echo t("ci_full_name"); ?></label>
                <input id="installer-on-site" type="text" class="form-control" required>

            </div>

        </div>

        <button id="btn_continue" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple" disabled><?php echo t("btn_continue"); ?></button>

    </div>




    <?php include_once "common/footer.php"; ?>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script>
        const apikey         = <?php echo json_encode($_SESSION["box_apikey"] ?? ""); ?>;
        const installerEmail = <?php echo json_encode($_SESSION["installer_email"] ?? ""); ?>;
    </script>

    <script src="js/customer_info.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
