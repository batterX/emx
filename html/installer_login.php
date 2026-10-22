<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 2;

// Reset session - preserve lang + software_version
$lang_keep = $_SESSION["lang"] ?? "en";
session_unset();
$_SESSION["lang"]             = $lang_keep;
$_SESSION["software_version"] = $softwareVersion;




// Save "box_apikey" to SESSION
$output = shell_exec("cat /proc/cpuinfo");
$pos    = strpos($output, "Serial");
$serial = substr($output, $pos + 10, 16);
$apikey = sha1(strval($serial));
$_SESSION["box_apikey"] = $apikey;

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/installer_login.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">

        <h1 class="mb-4"><?php echo t("il_title"); ?></h1>

        <div class="card p-4 p-md-5">
            <form id="loginForm" novalidate>
                <div class="login-inner">

                    <div class="form-floating mb-3">
                        <input id="email" type="email" class="form-control" placeholder="<?php echo t("il_email"); ?>" autocomplete="email" required autofocus>
                        <label for="email"><?php echo t("il_email"); ?></label>
                    </div>

                    <div class="form-floating mb-2 password-field">
                        <input id="password" type="password" class="form-control" placeholder="<?php echo t("il_password"); ?>" autocomplete="current-password" required>
                        <label for="password"><?php echo t("il_password"); ?></label>
                        <button type="button" id="btn_toggle_password" class="password-toggle" tabindex="-1" aria-label="Toggle password visibility">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>

                    <div class="mb-4 text-center">
                        <a href="https://batterx.app/forgotpassword.php" target="_blank" class="small"><?php echo t("il_forgot_password"); ?></a>
                    </div>

                    <p id="errorMsg" class="d-none mb-3"><?php echo t("il_wrong_credentials"); ?></p>
                    <p id="warningMsg" class="d-none mb-3"><?php echo t("il_wrong_installer"); ?></p>

                    <button id="btn_login" type="submit" class="btn btn-lg btn-success btn-wide d-block mx-auto ripple" disabled><?php echo t("btn_login"); ?></button>

                </div>
            </form>
        </div>

    </div>




    <?php include_once "common/footer.php"; ?>

    <script>
        const apikey = <?php echo json_encode($apikey); ?>;
    </script>

    <script src="js/installer_login.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
