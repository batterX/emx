<?php

/*
    Software Update
*/

// Include Base
include_once "common/base.php";

// Set Step
$step = 1;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
    header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

?>





<!DOCTYPE html>

<html>

    <head>

        <?php include_once "common/head.php"; ?>

        <link rel="stylesheet" href="css/software_update.css?v=<?php echo $versionHash; ?>">

    </head>

    <body>





        <!-- Progress Bar -->
        <div id="progress" class="shadow-lg">
            <div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
            <div><button id="btn_next" class="btn btn-success ripple" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
        </div>
        <!-- Progress Bar -->





        <main>
            
            <div class="container elevate-1">
                <h1><?php echo $lang["software_update"]["software_update"] ?></h1>
                <div>
                    <div id="notif" class="loading"></div>
                    <span id="message"><?php echo $lang["software_update"]["checking_internet_connection"] ?></span>
                </div>
                <span id="errorInfo" class="d-none"><?php echo $lang["software_update"]["check_network_cable_connection"]; ?></span>
            </div>

            <div id="downloadProgress" class="small mt-3"></div>

        </main>

        



        <?php include_once "common/footer.php"; ?>

        <script src="js/software_update.js?v=<?php echo $versionHash; ?>"></script>

    </body>

</html>
