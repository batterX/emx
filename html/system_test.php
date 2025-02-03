<?php

/*
	System Test
*/

// Include Base
include_once "common/base.php";
// Set Step
$step = 6;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
	header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

$noBattery  = (!isset($_SESSION["battery_type"]) || ($_SESSION["battery_type"] == "other" && $_SESSION["battery_capacity"] == "0")) ? true : false;
$backupMode = (isset($_SESSION["system_mode"]) && $_SESSION["system_mode"] == "1") ? true : false;
$batteryType = isset($_SESSION["battery_type"]) ? $_SESSION["battery_type"] : "";

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
		<link rel="stylesheet" href="css/system_test.css?v=<?php echo $versionHash ?>">

	</head>

	<body>





		<!-- Progress Bar -->
		<div id="progress" class="shadow-lg">
			<div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
			<div><button id="btn_next" class="btn btn-success ripple" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
		</div>
		<!-- Progress Bar -->





		<div class="modal" id="warningsModal" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title text-center w-100" style="color:red"><?php echo $lang["system_test"]["warning"] ?></h5>
					</div>
					<div class="modal-body">
						<p class="m-0 text-center"></p>
					</div>
				</div>
			</div>
		</div>





		<div class="container pb-5 pt-5">

			<h1 class="card-header bg-transparent border-0 text-center"><?php echo $lang["system_test"]["system_test"]; ?></h1>

			<div class="card elevate-1">
				<div class="card-body">
					<div class="row m-0 p-0">

						<div class="col-lg-6 m-0 p-3">

							<div id="testEnergyMeter" class="status d-flex align-items-center">
								<div class="notif"></div>
								<span><?php echo $lang["system_test"]["energy_meter"]; ?></span>
							</div>

							<div id="testBatteryCharging" class="status d-flex align-items-center mt-4" <?php echo $noBattery ? "style='display:none !important'" : "" ?>>
								<div class="notif"></div>
								<span><?php echo $lang["system_test"]["battery_charging"]; ?><span></span></span>
							</div>

							<div id="testUpsMode" class="status d-flex align-items-center mt-4" <?php echo $noBattery || $backupMode ? "style='display:none !important'" : "" ?>>
								<div class="notif"></div>
								<span><?php echo $lang["system_test"]["ups_mode"]; ?><span></span></span>
							</div>

						</div>

						<div id="log" class="col-lg-6 m-0 pl-lg-3 rounded mt-3 mt-lg-0"></div>

					</div>
				</div>
			</div>

		</div>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/dist/moment.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>
			const lang        = <?php echo json_encode($lang) ?>;
			const noBattery   = <?php echo $noBattery  ? "true" : "false" ?>;
			const backupMode  = <?php echo $backupMode ? "true" : "false" ?>;
			const hasExtSol   = <?php echo (isset($_SESSION["has_extsol" ]) && $_SESSION["has_extsol" ] == "1") ? "true" : "false" ?>;
			const hasMeter1   = <?php echo (isset($_SESSION["has_meter1" ]) && $_SESSION["has_meter1" ] == "1") ? "true" : "false" ?>;
			const hasMeter2   = <?php echo (isset($_SESSION["has_meter2" ]) && $_SESSION["has_meter2" ] == "1") ? "true" : "false" ?>;
			const hasMeter3   = <?php echo (isset($_SESSION["has_meter3" ]) && $_SESSION["has_meter3" ] == "1") ? "true" : "false" ?>;
			const hasMeter4   = <?php echo (isset($_SESSION["has_meter4" ]) && $_SESSION["has_meter4" ] == "1") ? "true" : "false" ?>;
			const batteryType = "<?php echo $batteryType ?>";
		</script>
		<script src="js/system_test.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
