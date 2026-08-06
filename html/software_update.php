<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 1;

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/software_update.css?v=<?php echo $versionHash; ?>">

</head>

<body class="has-steps p-4 p-md-5">

    <?php include_once "common/steps.php"; ?>




    <div class="page-container">

        <h1 class="mb-4"><?php echo t("su_title"); ?></h1>

        <div class="card text-center p-4 p-md-5">

            <div id="statusIcon">
                <div class="spinner-border text-success" role="status"></div>
            </div>

            <p id="message" class="mt-3 mb-0"><?php echo t("su_checking_internet"); ?></p>

            <p id="errorInfo" class="d-none text-danger small mt-2"><?php echo t("su_check_network"); ?></p>

            <p id="retryCountdown" class="d-none text-muted small mt-2 mb-0"></p>

            <div id="downloadProgress" class="text-muted small mt-2 d-none"></div>

            <button id="btn_next" class="btn btn-lg btn-success btn-wide mx-auto mt-4 ripple d-none"><?php echo t("btn_continue"); ?></button>

        </div>

    </div>




    <?php include_once "common/footer.php"; ?>

    <script src="js/software_update.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
