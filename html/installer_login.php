<?php

/*
	Installer Login
*/

// Include Base
include_once "common/base.php";
// Set Step
$step = 2;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
	header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

// Set "software_version" to SESSION
if(isset($_GET["software_version"])) $_SESSION["software_version"] = $_GET["software_version"];

// Get Apikey
$output = shell_exec("cat /proc/cpuinfo");
$find = "Serial";
$pos = strpos($output, $find);
$serial = substr($output, $pos + 10, 16);
$apikey = sha1(strval($serial));
$_SESSION["box_apikey"] = $apikey;

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
		<link rel="stylesheet" href="css/installer_login.css?v=<?php echo $versionHash ?>">

	</head>

	<body>





		<!-- Progress Bar -->
		<div id="progress" class="shadow-lg">
			<div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
			<div><button id="btn_next" class="btn btn-success ripple" type="submit" form="loginForm" disabled><?php echo $lang["btn"]["login"]; ?></button></div>
		</div>
		<!-- Progress Bar -->





		<main>

			<div class="container elevate-1">
				<h1><?php echo $lang["installer_login"]["installer_login"]; ?></h1>
				<form id="loginForm">
					<div class="mb-4"><input id="email"    class="form-control form-control-outline rounded-pill" type="email"    placeholder="<?php echo $lang["common"]["email"   ]; ?>" required></div>
					<div class="mb-2"><input id="password" class="form-control form-control-outline rounded-pill" type="password" placeholder="<?php echo $lang["common"]["password"]; ?>" required></div>
					<span id="errorMsg"   class="d-none mt-4"><?php echo $lang["installer_login"]["wrong_email_or_password"]; ?></span>
					<span id="warningMsg" class="d-none mt-4"><?php echo $lang["installer_login"]["wrong_system_installer" ]; ?></span>
				</form>

			</div>

		</main>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script>const apikey = <?php echo json_encode($apikey) ?>;</script>
		<script>const softwareVersion = <?php echo json_encode($softwareVersion) ?>;</script>
		<script src="js/installer_login.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
