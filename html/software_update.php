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

		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="author" content="Ivan Gavrilov">
		<link rel="icon" href="img/favicon.png">

		<title>batterX EMX</title>

		<link rel="stylesheet" href="css/dist/bundle.css?v=<?php echo $versionHash ?>">
		<link rel="stylesheet" href="css/common.css?v=<?php echo $versionHash ?>">
		<link rel="stylesheet" href="css/software_update.css?v=<?php echo $versionHash ?>">

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

		



		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script>const softwareVersion = <?php echo json_encode($softwareVersion) ?>;</script>
		<script src="js/software_update.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
