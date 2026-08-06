<?php

// Include Base
include_once "common/base.php";

// Set Step
$step = 0;

?>




<!DOCTYPE html>

<html>

<head>

    <?php include_once "common/head.php"; ?>

    <link rel="stylesheet" href="css/index.css?v=<?php echo $versionHash; ?>">

</head>

<body class="p-4 p-md-5 pb-5">




    <div class="langs-card card text-center p-4 p-md-5">

        <img class="logo" src="<?php echo $boxType == "livex" ? "img/logo_livex.svg" : "img/logo_emx.svg"; ?>" alt="batterX">

        <h1 class="my-4 my-md-5">Select Language</h1>

        <div class="row lang justify-content-center">
            <div id="lang_en" class="box col-6 col-sm-4 col-md p-3 p-md-4 ripple"><div class="flag"></div><span class="label">English</span></div>
            <div id="lang_de" class="box col-6 col-sm-4 col-md p-3 p-md-4 ripple"><div class="flag"></div><span class="label">Deutsch</span></div>
            <div id="lang_fr" class="box col-6 col-sm-4 col-md p-3 p-md-4 ripple"><div class="flag"></div><span class="label">Français</span></div>
            <div id="lang_cs" class="box col-6 col-sm-4 col-md p-3 p-md-4 ripple"><div class="flag"></div><span class="label">Čeština</span></div>
            <div id="lang_es" class="box col-6 col-sm-4 col-md p-3 p-md-4 ripple"><div class="flag"></div><span class="label">Español</span></div>
        </div>

    </div>

    <span id="softwareVersion" class="z-n1"><?php echo $softwareVersion; ?></span>




    <?php include_once "common/footer.php"; ?>

    <script src="js/index.js?v=<?php echo $versionHash; ?>"></script>

</body>

</html>
