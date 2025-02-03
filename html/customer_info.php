<?php

/*
	Customer Info
*/

// Include Base
include_once "common/base.php";
// Set Step
$step = 3;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
	header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

// Get Apikey
$output = shell_exec("cat /proc/cpuinfo");
$find = "Serial";
$pos = strpos($output, $find);
$serial = substr($output, $pos + 10, 16);
$apikey = sha1(strval($serial));
$_SESSION["box_apikey"] = $apikey;

// Get Installer Country
$installerCountry = isset($_SESSION["installer_country"]) ? $_SESSION["installer_country"] : "";

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
		<link rel="stylesheet" href="css/customer_info.css?v=<?php echo $versionHash ?>">

	</head>

	<body>





		<!-- Progress Bar -->
		<div id="progress" class="shadow-lg">
			<div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
			<div><button id="btn_next" class="btn btn-success ripple" type="submit" form="mainForm" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
		</div>
		<!-- Progress Bar -->





		<div class="modal fade" id="errorSameAsInstaller" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["customer_info"]["customer_same_as_installer"] ?></b></span>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="errorNoAccessToUser" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["customer_info"]["wrong_customer_installer"] ?></b></span>
					</div>
				</div>
			</div>
		</div>
		




		<div class="container pb-5">
			<form id="mainForm" class="pb-4">

				<h1 class="card-header customer-information bg-transparent border-0 mt-5"><?php echo $lang["customer_info"]["customer_information"]; ?></h1>

				<div class="card elevate-1">
					<div class="card-body">
						<div id="customerInformation" class="row m-n1">

							<div class="col-md-2 p-1">
								<select class="gender form-control form-control-outline" required>
									<option value="0"><?php echo $lang["dict_gender"]["0"] ?></option>
									<option value="1"><?php echo $lang["dict_gender"]["1"] ?></option>
								</select>
							</div>
							<div class="col-md-5 p-1">
								<input class="first-name form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["first_name"]; ?>" required>
							</div>
							<div class="col-md-5 p-1">
								<input class="last-name form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["last_name"]; ?>" required>
							</div>

							<div class="col-md-4 p-1">
								<input class="company form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["company"]; ?>">
							</div>
							<div class="col-md-4 p-1">
								<input class="email form-control form-control-outline" type="email" placeholder="<?php echo $lang["common"]["email"]; ?>" required>
							</div>
							<div class="col-md-4 p-1">
								<input class="telephone form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["telephone"]; ?>" required>
							</div>

							<div class="w-100" style="padding: 0.375rem"></div>

							<div class="col-md-4 p-1">
								<select class="location-country form-control form-control-outline" required>
									<option value="de" <?php echo $installerCountry == "de" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["de"] ?></option>
									<option value="at" <?php echo $installerCountry == "at" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["at"] ?></option>
									<option value="be" <?php echo $installerCountry == "be" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["be"] ?></option>
									<optgroup label="<?php echo $lang["dict_countries"]["europe"] ?>">
										<option value="at" <?php echo $installerCountry == "at" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["at"] ?></option>
										<option value="by" <?php echo $installerCountry == "by" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["by"] ?></option>
										<option value="be" <?php echo $installerCountry == "be" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["be"] ?></option>
										<option value="hr" <?php echo $installerCountry == "hr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["hr"] ?></option>
										<option value="cy" <?php echo $installerCountry == "cy" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cy"] ?></option>
										<option value="cz" <?php echo $installerCountry == "cz" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cz"] ?></option>
										<option value="dk" <?php echo $installerCountry == "dk" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["dk"] ?></option>
										<option value="ee" <?php echo $installerCountry == "ee" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ee"] ?></option>
										<option value="fi" <?php echo $installerCountry == "fi" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["fi"] ?></option>
										<option value="fr" <?php echo $installerCountry == "fr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["fr"] ?></option>
										<option value="ge" <?php echo $installerCountry == "ge" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ge"] ?></option>
										<option value="de" <?php echo $installerCountry == "de" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["de"] ?></option>
										<option value="gr" <?php echo $installerCountry == "gr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gr"] ?></option>
										<option value="hu" <?php echo $installerCountry == "hu" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["hu"] ?></option>
										<option value="is" <?php echo $installerCountry == "is" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["is"] ?></option>
										<option value="ie" <?php echo $installerCountry == "ie" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ie"] ?></option>
										<option value="it" <?php echo $installerCountry == "it" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["it"] ?></option>
										<option value="lv" <?php echo $installerCountry == "lv" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lv"] ?></option>
										<option value="lt" <?php echo $installerCountry == "lt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lt"] ?></option>
										<option value="lu" <?php echo $installerCountry == "lu" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lu"] ?></option>
										<option value="mt" <?php echo $installerCountry == "mt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["mt"] ?></option>
										<option value="md" <?php echo $installerCountry == "md" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["md"] ?></option>
										<option value="nl" <?php echo $installerCountry == "nl" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["nl"] ?></option>
										<option value="no" <?php echo $installerCountry == "no" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["no"] ?></option>
										<option value="pl" <?php echo $installerCountry == "pl" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["pl"] ?></option>
										<option value="pt" <?php echo $installerCountry == "pt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["pt"] ?></option>
										<option value="ro" <?php echo $installerCountry == "ro" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ro"] ?></option>
										<option value="ru" <?php echo $installerCountry == "ru" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ru"] ?></option>
										<option value="sk" <?php echo $installerCountry == "sk" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["sk"] ?></option>
										<option value="si" <?php echo $installerCountry == "si" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["si"] ?></option>
										<option value="es" <?php echo $installerCountry == "es" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["es"] ?></option>
										<option value="se" <?php echo $installerCountry == "se" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["se"] ?></option>
										<option value="ch" <?php echo $installerCountry == "ch" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ch"] ?></option>
										<option value="tr" <?php echo $installerCountry == "tr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tr"] ?></option>
										<option value="ua" <?php echo $installerCountry == "ua" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ua"] ?></option>
										<option value="gb" <?php echo $installerCountry == "gb" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gb"] ?></option>
									</optgroup>
									<optgroup label="<?php echo $lang["dict_countries"]["africa"] ?>">
										<option value="cd" <?php echo $installerCountry == "cd" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cd"] ?></option>
										<option value="gh" <?php echo $installerCountry == "gh" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gh"] ?></option>
										<option value="ci" <?php echo $installerCountry == "ci" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ci"] ?></option>
										<option value="ke" <?php echo $installerCountry == "ke" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ke"] ?></option>
										<option value="ng" <?php echo $installerCountry == "ng" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ng"] ?></option>
										<option value="re" <?php echo $installerCountry == "re" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["re"] ?></option>
										<option value="sn" <?php echo $installerCountry == "sn" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["sn"] ?></option>
										<option value="za" <?php echo $installerCountry == "za" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["za"] ?></option>
										<option value="tg" <?php echo $installerCountry == "tg" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tg"] ?></option>
										<option value="tn" <?php echo $installerCountry == "tn" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tn"] ?></option>
										<option value="ug" <?php echo $installerCountry == "ug" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ug"] ?></option>
									</optgroup>
								</select>
							</div>
							<div class="col-md-4 p-1">
								<input class="location-city form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["city"]; ?>" required>
							</div>
							<div class="col-md-4 p-1">
								<input class="location-zip form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["zip_code"]; ?>" required>
							</div>

							<div class="col-md-12 p-1">
								<input class="location-address form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["address"]; ?>" required>
							</div>

						</div>
					</div>
				</div>

				<div class="card elevate-1 mt-3">
					<div class="card-body">
						<input id="installerOnSite" class="form-control form-control-outline" type="text" placeholder="<?php echo $lang["customer_info"]["installer_on_site"] . " (" . $lang["common"]["name"] . ")"; ?>" required>
					</div>
				</div>



				<h1 class="card-header installation-address bg-transparent border-0 mt-5"><?php echo $lang["customer_info"]["installation_address"]; ?></h1>

				<div class="card elevate-1">
					<div class="card-body">
					
						<div class="custom-control custom-checkbox">
							<input type="checkbox" class="custom-control-input" id="sameAddress">
							<label class="custom-control-label" for="sameAddress"><?php echo $lang["customer_info"]["same_as_customer_address"]; ?></label>
						</div>

						<div id="installationAddress" class="row mx-n1 mb-n1 mt-3">

							<div class="col-md-4 p-1">
								<select class="location-country form-control form-control-outline">
									<option value="de" <?php echo $installerCountry == "de" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["de"] ?></option>
									<option value="at" <?php echo $installerCountry == "at" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["at"] ?></option>
									<option value="be" <?php echo $installerCountry == "be" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["be"] ?></option>
									<optgroup label="<?php echo $lang["dict_countries"]["europe"] ?>">
										<option value="at" <?php echo $installerCountry == "at" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["at"] ?></option>
										<option value="by" <?php echo $installerCountry == "by" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["by"] ?></option>
										<option value="be" <?php echo $installerCountry == "be" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["be"] ?></option>
										<option value="hr" <?php echo $installerCountry == "hr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["hr"] ?></option>
										<option value="cy" <?php echo $installerCountry == "cy" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cy"] ?></option>
										<option value="cz" <?php echo $installerCountry == "cz" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cz"] ?></option>
										<option value="dk" <?php echo $installerCountry == "dk" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["dk"] ?></option>
										<option value="ee" <?php echo $installerCountry == "ee" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ee"] ?></option>
										<option value="fi" <?php echo $installerCountry == "fi" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["fi"] ?></option>
										<option value="fr" <?php echo $installerCountry == "fr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["fr"] ?></option>
										<option value="ge" <?php echo $installerCountry == "ge" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ge"] ?></option>
										<option value="de" <?php echo $installerCountry == "de" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["de"] ?></option>
										<option value="gr" <?php echo $installerCountry == "gr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gr"] ?></option>
										<option value="hu" <?php echo $installerCountry == "hu" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["hu"] ?></option>
										<option value="is" <?php echo $installerCountry == "is" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["is"] ?></option>
										<option value="ie" <?php echo $installerCountry == "ie" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ie"] ?></option>
										<option value="it" <?php echo $installerCountry == "it" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["it"] ?></option>
										<option value="lv" <?php echo $installerCountry == "lv" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lv"] ?></option>
										<option value="lt" <?php echo $installerCountry == "lt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lt"] ?></option>
										<option value="lu" <?php echo $installerCountry == "lu" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["lu"] ?></option>
										<option value="mt" <?php echo $installerCountry == "mt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["mt"] ?></option>
										<option value="md" <?php echo $installerCountry == "md" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["md"] ?></option>
										<option value="nl" <?php echo $installerCountry == "nl" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["nl"] ?></option>
										<option value="no" <?php echo $installerCountry == "no" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["no"] ?></option>
										<option value="pl" <?php echo $installerCountry == "pl" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["pl"] ?></option>
										<option value="pt" <?php echo $installerCountry == "pt" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["pt"] ?></option>
										<option value="ro" <?php echo $installerCountry == "ro" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ro"] ?></option>
										<option value="ru" <?php echo $installerCountry == "ru" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ru"] ?></option>
										<option value="sk" <?php echo $installerCountry == "sk" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["sk"] ?></option>
										<option value="si" <?php echo $installerCountry == "si" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["si"] ?></option>
										<option value="es" <?php echo $installerCountry == "es" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["es"] ?></option>
										<option value="se" <?php echo $installerCountry == "se" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["se"] ?></option>
										<option value="ch" <?php echo $installerCountry == "ch" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ch"] ?></option>
										<option value="tr" <?php echo $installerCountry == "tr" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tr"] ?></option>
										<option value="ua" <?php echo $installerCountry == "ua" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ua"] ?></option>
										<option value="gb" <?php echo $installerCountry == "gb" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gb"] ?></option>
									</optgroup>
									<optgroup label="<?php echo $lang["dict_countries"]["africa"] ?>">
										<option value="cd" <?php echo $installerCountry == "cd" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["cd"] ?></option>
										<option value="gh" <?php echo $installerCountry == "gh" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["gh"] ?></option>
										<option value="ci" <?php echo $installerCountry == "ci" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ci"] ?></option>
										<option value="ke" <?php echo $installerCountry == "ke" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ke"] ?></option>
										<option value="ng" <?php echo $installerCountry == "ng" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ng"] ?></option>
										<option value="re" <?php echo $installerCountry == "re" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["re"] ?></option>
										<option value="sn" <?php echo $installerCountry == "sn" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["sn"] ?></option>
										<option value="za" <?php echo $installerCountry == "za" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["za"] ?></option>
										<option value="tg" <?php echo $installerCountry == "tg" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tg"] ?></option>
										<option value="tn" <?php echo $installerCountry == "tn" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["tn"] ?></option>
										<option value="ug" <?php echo $installerCountry == "ug" ? "selected" : "" ?>><?php echo $lang["dict_countries"]["ug"] ?></option>
									</optgroup>
								</select>
							</div>
							<div class="col-md-4 p-1">
								<input class="location-city form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["city"] ?>" required>
							</div>
							<div class="col-md-4 p-1">
								<input class="location-zip form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["zip_code"] ?>" required>
							</div>
						
							<div class="col-md-12 p-1">
								<input class="location-address form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["address"] ?>" required>
							</div>

						</div>

					</div>
				</div>



				<div id="installationAddressCopy" class="row mx-n1 mb-n1 mt-3 invisible" style="display: none">
					<div class="col-md-4  p-1"><input class="form-control form-control-outline" type="text"></div>
					<div class="col-md-4  p-1"><input class="form-control form-control-outline" type="text"></div>
					<div class="col-md-4  p-1"><input class="form-control form-control-outline" type="text"></div>
					<div class="col-md-12 p-1"><input class="form-control form-control-outline" type="text"></div>
				</div>



			</form>
		</div>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script>const apikey = <?php echo json_encode($apikey) ?>;</script>
		<script>const installerEmail = <?php echo json_encode($_SESSION["installer_email"]) ?>;</script>
		<script src="js/customer_info.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
