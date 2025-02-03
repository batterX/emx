<?php

/*
	System Setup
*/

// Include Base
include_once "common/base.php";
// Set Step
$step = 5;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
	header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

// Unset Certificate Stuff From Session
if(isset($_SESSION["reactive_mode"  ])) unset($_SESSION["reactive_mode"  ]);
if(isset($_SESSION["reactive_kink"  ])) unset($_SESSION["reactive_kink"  ]);
if(isset($_SESSION["reactive_cosphi"])) unset($_SESSION["reactive_cosphi"]);
if(isset($_SESSION["reactive_q"     ])) unset($_SESSION["reactive_qmaxsn"]);
if(isset($_SESSION["reactive_v1"    ])) unset($_SESSION["reactive_v1"    ]);
if(isset($_SESSION["reactive_v2"    ])) unset($_SESSION["reactive_v2"    ]);
if(isset($_SESSION["reactive_v3"    ])) unset($_SESSION["reactive_v3"    ]);
if(isset($_SESSION["reactive_v4"    ])) unset($_SESSION["reactive_v4"    ]);
if(isset($_SESSION["reactive_qutime"])) unset($_SESSION["reactive_qutime"]);
if(isset($_SESSION["reactive_qfix"  ])) unset($_SESSION["reactive_qfix"  ]);

// Get Apikey
$output = shell_exec("cat /proc/cpuinfo");
$find = "Serial";
$pos = strpos($output, $find);
$serial = substr($output, $pos + 10, 16);
$apikey = sha1(strval($serial));
$_SESSION["box_apikey"] = $apikey;

$isVde4105 = isset($_SESSION["vde4105"]) && $_SESSION["vde4105"] == "1";
$isTor     = isset($_SESSION["tor"    ]) && $_SESSION["tor"    ] == "1";
$isEstonia = isset($_SESSION["estonia"]) && $_SESSION["estonia"] == "1";

$customerEmail = empty($_SESSION["customer_email"]) ? "" : $_SESSION["customer_email"];

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
		<link rel="stylesheet" href="css/system_setup.css?v=<?php echo $versionHash ?>">

	</head>

	<body>





		<!-- Progress Bar -->
		<div id="progress" class="shadow-lg">
			<div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
			<div data-toggle="modal" data-target="#modalSkipSetup" style="position:absolute;width:1rem;height:1rem;z-index:100;bottom:0;left:0"></div>
			<div><button id="btn_next" class="btn btn-success ripple" type="submit" form="mainForm" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
		</div>
		<!-- Progress Bar -->





		<div class="modal fade" id="modalSkipSetup" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center p-0">
						<input type="password" class="form-control form-control-outline border-0 text-center p-4" value="">
					</div>
				</div>
			</div>
		</div>
		
		<div class="modal fade" id="errorBoxNotRegistered" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["system_setup"]["msg_emx_not_registered"] ?></b></span>
						<div class="mt-3">
							<span class="d-block"><b>APIKEY</b></span>
							<input type="text" class="form-control form-control-outline text-center mt-2 px-2" style="font-size:95%" value="<?php echo $apikey ?>" readonly>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="errorSystemRegisteredWithOtherUser" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["system_setup"]["msg_system_registered_with_other_user"] ?></b></span>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="errorInverterRegisteredWithOtherSystem" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["system_setup"]["msg_inverter_registered_with_other_system"] ?></b></span>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="errorBatteryNotExistOrWithOtherSystem" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["system_setup"]["msg_battery_not_exist_or_registered_with_other_system"] ?></b></span>
						<div class="mt-3">
							<span class="d-block"><b><?php echo $lang["common"]["serialnumber"] ?></b></span>
							<input id="errorBatterySerial" type="text" class="form-control form-control-outline text-center mt-2 px-2" style="font-size:95%" readonly>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="errorBmsNotExistOrWithOtherSystem" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center">
						<span style="color: red"><b><?php echo $lang["bs_system_setup"]["msg_bms_not_exist_or_registered_with_other_system"] ?></b></span>
						<div class="mt-3">
							<span class="d-block"><b><?php echo $lang["common"]["serialnumber"] ?></b></span>
							<input id="errorBmsSerial" type="text" class="form-control form-control-outline text-center mt-2 px-2" style="font-size:95%" readonly>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalInstallerMemo" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<h5 class="modal-header mb-0"><?php echo $lang["system_setup"]["system_installer_memo"]; ?></h5>
					<div class="modal-body"><textarea id="installer_memo" class="form-control form-control-outline"></textarea></div>
					<div class="modal-footer"><button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" data-dismiss="modal"><b><?php echo $lang["btn"]["save"] ?></b></button></div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalExtendedParameters" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<h5 class="modal-header mb-0"><?php echo $lang["system_setup"]["extended_parameters"] ?></h5>
					<div class="modal-body">

						<?php if($isTor): ?>

							<?php
								function template_add_extended_parameter($id, $name, $value, $unit, $step, $min, $max) {
									return "
										<div class='form-group row mb-2'>
											<label class='col-6 col-form-label col-form-label-sm'>{$name}</label>
											<div class='col-6 d-flex align-items-center'>
												<div class='input-group input-group-sm'>
													<input id='{$id}' class='form-control form-control-outline text-monospace' type='number' step='{$step}' min='{$min}' max='{$max}' value='{$value}' placeholder='{$value}' title='Range: {$min} - {$max}'>
													<div class='input-group-append'><span class='input-group-text'>{$unit}</span></div>
												</div>
											</div>
										</div>
									";
								}
							?>

							<h6 class="pb-2 mt-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["extended_grid_connection_conditions"] ?></b></h6>

							<?php echo template_add_extended_parameter("extended_maxGridVoltage", $lang["system_setup"]["extended_maxgridvoltage"], "257.6", "V", "0.1", "230.0", "264.5"); ?>
							<?php echo template_add_extended_parameter("extended_minGridVoltage", $lang["system_setup"]["extended_mingridvoltage"], "195.0", "V", "0.1", "184.0", "230.0"); ?>
							<?php echo template_add_extended_parameter("extended_maxGridFrequency", $lang["system_setup"]["extended_maxgridfrequency"], "51.5", "Hz", "0.01", "50.00", "51.50"); ?>
							<?php echo template_add_extended_parameter("extended_minGridFrequency", $lang["system_setup"]["extended_mingridfrequency"], "47.5", "Hz", "0.01", "47.50", "50.00"); ?>

							<hr>

							<h6 class="pb-2 mt-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["extended_grid_decoupling_protection"] ?></b></h6>

							<?php echo template_add_extended_parameter("extended_UeffOver1", "Ueff >", "255.4", "V", "0.1", "230.0", "299.0"); ?>
							<?php echo template_add_extended_parameter("extended_UeffUnder1", "Ueff <", "184.0", "V", "0.1", "23.0", "230.0"); ?>
							<?php echo template_add_extended_parameter("extended_UeffOver2", "Ueff >>", "264.5", "V", "0.1", "230.0", "299.0"); ?>
							<?php echo template_add_extended_parameter("extended_UeffUnder2", "Ueff <<", "57.5", "V", "0.1", "23.0", "230.0"); ?>
							<?php echo template_add_extended_parameter("extended_fOver1", "f >", "51.5", "Hz", "0.01", "50.00", "55.00"); ?>
							<?php echo template_add_extended_parameter("extended_fUnder1", "f <", "47.5", "Hz", "0.01", "45.00", "50.00"); ?>
							<?php echo template_add_extended_parameter("extended_UeffOver1Time", "Ueff >", "0.1", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_UeffUnder1Time", "Ueff <", "1.5", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_UeffOver2Time", "Ueff >>", "0.1", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_UeffUnder2Time", "Ueff <<", "0.5", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_fOver1Time", "f >", "0.1", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_fUnder1Time", "f <", "0.1", "sec", "0.02", "0", "1000.000"); ?>
							<?php echo template_add_extended_parameter("extended_Ueff", $lang["system_setup"]["extended_ueff"], "255.3", "V", "0.1", "230.0", "299.0"); ?>
							<?php echo template_add_extended_parameter("extended_gridConnectDelay", $lang["system_setup"]["extended_gridconnectdelay"], "60", "sec", "1", "1", "300"); ?>
							<?php echo template_add_extended_parameter("extended_gridReconnectDelay", $lang["system_setup"]["extended_gridreconnectdelay"], "300", "sec", "1", "1", "300"); ?>

							<hr>

							<h6 class="pb-2 mt-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["summary"]["extended_overvoltage_reduction"] ?></b></h6>

							<?php echo template_add_extended_parameter("extended_puTime", $lang["system_setup"]["extended_putime"], "5", "sec", "1", "3", "60"); ?>

							<hr>

						<?php endif; ?>

						<h6 class="pb-2 mt-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["extended_overfrequency_reduction"] ?></b></h6>
						<div class="form-group row mb-2">
							<label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_start_of_reduction"] ?></label>
							<div class="col-6 d-flex align-items-center">
								<select id="extended_lfsmoThreshold" class="form-control form-control-sm form-control-outline text-monospace">
									<option value="5020">50.2 Hz</option>
									<option value="5030">50.3 Hz</option>
									<option value="5040">50.4 Hz</option>
									<option value="5050">50.5 Hz</option>
								</select>
							</div>
						</div>
						<div class="form-group row mb-0">
							<label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_droop"] ?></label>
							<div class="col-6 d-flex align-items-center">
								<select id="extended_lfsmoDroop" class="form-control form-control-sm form-control-outline text-monospace">
									<option value="200">2 %</option>
									<option value="300">3 %</option>
									<option value="400">4 %</option>
									<option value="500">5 %</option>
									<option value="600">6 %</option>
									<option value="700">7 %</option>
									<option value="800">8 %</option>
									<option value="900">9 %</option>
									<option value="1000">10 %</option>
									<option value="1100">11 %</option>
									<option value="1200">12 %</option>
								</select>
							</div>
						</div>

					</div>
					<div class="modal-footer"><button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" data-dismiss="modal"><b><?php echo $lang["btn"]["save"] ?></b></button></div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalUserMeters" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<h5 class="modal-header mb-0"><?php echo $lang["system_setup"]["user_meters"] ?></h5>
					<div class="modal-body">
						
						<h6 class="py-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["user_meter"] ?> 1 (Modbus ID 101)</b></h6>
						<div class="form-row mt-2">
							<label for="meter1_mode" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["connected"] ?></label>
							<div class="col-6"><select id="meter1_mode" class="form-control form-control-outline form-control-sm"><option value="1"><?php echo $lang["common"]["yes"] ?></option><option value="0" selected=""><?php echo $lang["common"]["no"] ?></option></select></div>
						</div>
						<div class="form-row mt-2">
							<label for="meter1_label" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["label"] ?></label>
							<div class="col-6"><input id="meter1_label" class="form-control form-control-outline form-control-sm" type="text" placeholder="<?php echo $lang["system_setup"]["user_meter"] ?> 1"></div>
						</div>

						<br>

						<h6 class="py-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["user_meter"] ?> 2 (Modbus ID 102)</b></h6>
						<div class="form-row mt-2">
							<label for="meter2_mode" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["connected"] ?></label>
							<div class="col-6"><select id="meter2_mode" class="form-control form-control-outline form-control-sm"><option value="1"><?php echo $lang["common"]["yes"] ?></option><option value="0" selected=""><?php echo $lang["common"]["no"] ?></option></select></div>
						</div>
						<div class="form-row mt-2">
							<label for="meter2_label" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["label"] ?></label>
							<div class="col-6"><input id="meter2_label" class="form-control form-control-outline form-control-sm" type="text" placeholder="<?php echo $lang["system_setup"]["user_meter"] ?> 2"></div>
						</div>

						<br>

						<h6 class="py-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["user_meter"] ?> 3 (Modbus ID 103)</b></h6>
						<div class="form-row mt-2">
							<label for="meter3_mode" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["connected"] ?></label>
							<div class="col-6"><select id="meter3_mode" class="form-control form-control-outline form-control-sm"><option value="1"><?php echo $lang["common"]["yes"] ?></option><option value="0" selected=""><?php echo $lang["common"]["no"] ?></option></select></div>
						</div>
						<div class="form-row mt-2">
							<label for="meter3_label" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["label"] ?></label>
							<div class="col-6"><input id="meter3_label" class="form-control form-control-outline form-control-sm" type="text" placeholder="<?php echo $lang["system_setup"]["user_meter"] ?> 3"></div>
						</div>

						<br>

						<h6 class="py-2 mb-2" style="font-size:0.875rem"><b><?php echo $lang["system_setup"]["user_meter"] ?> 4 (Modbus ID 104)</b></h6>
						<div class="form-row mt-2">
							<label for="meter4_mode" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["connected"] ?></label>
							<div class="col-6"><select id="meter4_mode" class="form-control form-control-outline form-control-sm"><option value="1"><?php echo $lang["common"]["yes"] ?></option><option value="0" selected=""><?php echo $lang["common"]["no"] ?></option></select></div>
						</div>
						<div class="form-row mt-2">
							<label for="meter4_label" class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["label"] ?></label>
							<div class="col-6"><input id="meter4_label" class="form-control form-control-outline form-control-sm" type="text" placeholder="<?php echo $lang["system_setup"]["user_meter"] ?> 4"></div>
						</div>
						
					</div>
					<div class="modal-footer"><button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" data-dismiss="modal"><b><?php echo $lang["btn"]["save"] ?></b></button></div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalConfirmExtendedParameters" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<h5 class="modal-header mb-0"><?php echo $lang["system_setup"]["extendedconfirm_title"] ?></h5>
					<div class="modal-body">
						<p class="message mb-3"><?php echo $lang["system_setup"]["extendedconfirm_message"] ?></p>
						<hr>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_maxgridvoltage"] ?>    </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_maxGridVoltage"     class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_mingridvoltage"] ?>    </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_minGridVoltage"     class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_maxgridfrequency"] ?>  </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_maxGridFrequency"   class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">Hz </span></div></div></div></div>
						<div class="form-group row mb-3"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_mingridfrequency"] ?>  </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_minGridFrequency"   class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">Hz </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff >                                                            </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffOver1"          class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff <                                                            </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffUnder1"         class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff >>                                                           </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffOver2"          class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff <<                                                           </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffUnder2"         class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">f >                                                               </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_fOver1"             class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">Hz </span></div></div></div></div>
						<div class="form-group row mb-3"><label class="col-6 col-form-label col-form-label-sm">f <                                                               </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_fUnder1"            class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">Hz </span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff >                                                            </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffOver1Time"      class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff <                                                            </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffUnder1Time"     class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff >>                                                           </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffOver2Time"      class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">Ueff <<                                                           </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_UeffUnder2Time"     class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm">f >                                                               </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_fOver1Time"         class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-3"><label class="col-6 col-form-label col-form-label-sm">f <                                                               </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_fUnder1Time"        class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-2"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_ueff"] ?>              </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_Ueff"               class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">V  </span></div></div></div></div>
						<div class="form-group row mb-3"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_gridconnectdelay"] ?>  </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_gridConnectDelay"   class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-3"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_gridreconnectdelay"] ?></label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_gridReconnectDelay" class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
						<div class="form-group row mb-0"><label class="col-6 col-form-label col-form-label-sm"><?php echo $lang["system_setup"]["extended_putime"] ?>            </label><div class="col-6 d-flex align-items-center"><div class="input-group input-group-sm"><input id="confirmExtended_puTime"             class="form-control form-control-outline text-monospace" type="text" disabled><div class="input-group-append"><span class="input-group-text">sec</span></div></div></div></div>
					</div>
					<div class="modal-footer justify-content-between">
						<button type="button" class="modify  btn btn-sm px-4 py-2 btn-primary ripple" style="min-width:40%"><b><?php echo $lang["system_setup"]["extendedconfirm_modify"] ?></b></button>
						<button type="button" class="confirm btn btn-sm px-4 py-2 btn-success ripple" style="min-width:40%"><b><?php echo $lang["system_setup"]["extendedconfirm_confirm"] ?></b></button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalConfirmInternalSolar" tabindex="-1" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<h5 class="modal-header mb-0"><?php echo $lang["system_setup"]["internalsolarconfirm_title"] ?></h5>
					<div class="modal-body">
						<p class="message mb-0"><?php echo $lang["system_setup"]["internalsolarconfirm_message"] ?></p>
					</div>
					<div class="modal-footer"><button type="button" class="btn btn-sm px-4 py-2 btn-success ripple" style="min-width:50%"><b><?php echo $lang["system_setup"]["internalsolarconfirm_confirm"] ?></b></button></div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="importingDataFromCloud" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false">
			<div class="modal-dialog modal-dialog-centered modal-sm">
				<div class="modal-content">
					<div class="modal-body text-center py-4">
						<span><b><?php echo $lang["system_setup"]["msg_importing_data_from_cloud"] ?></b></span>
						<span class="d-block mt-3"><b><?php echo $lang["system_setup"]["msg_please_wait"] ?></b></span>
						<span id="importingDataFromCloud_step" class="d-block mt-2 text-monospace"><b>-</b></span>
					</div>
				</div>
			</div>
		</div>





		<div class="container pb-5">
			<form id="mainForm" class="pb-4">

				<div class="row">

					<!-- batterX Home -->
					<div class="col-lg-3 d-xl-none"></div>
					<div id="bxHome" class="col-lg-6 col-xl-4 pt-5">

						<h1 class="card-header bg-transparent border-0"><?php echo $lang["system_setup"]["system"]; ?></h1>

						<div class="main-card card elevate-1 h-100">
							<div id="system_co_box" class="card-body border-bottom">
								<div class="custom-control custom-radio">
									<input type="radio" id="system_co_new" name="system_co_radio" class="custom-control-input" value="new" checked>
									<label class="custom-control-label" for="system_co_new"><?php echo $lang["system_setup"]["system_new"]; ?></label>
								</div>
								<div class="custom-control custom-radio mt-1">
									<input type="radio" id="system_co_old" name="system_co_radio" class="custom-control-input" value="old">
									<label class="custom-control-label" for="system_co_old"><?php echo $lang["system_setup"]["system_existing"]; ?></label>
								</div>
								<input id="system_co_sn" class="form-control form-control-outline mt-3" style="display: none" type="text" placeholder="<?php echo $lang["common"]["serialnumber"]; ?>" value="">
							</div>
							<div class="card-body border-bottom pt-3">
								<label for="bx_device"><?php echo $lang["system_setup"]["system_serialnumber_inverter"]; ?></label>
								<input id="bx_device" class="form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["serialnumber"]; ?>" value="" disabled required>
							</div>
							<div class="card-body border-bottom pt-3">
								<label for="bx_box"><?php echo $lang["system_setup"]["system_serialnumber_emx"]; ?></label>
								<input id="bx_box" class="form-control form-control-outline" type="text" placeholder="<?php echo $lang["common"]["serialnumber"]; ?>" value="" disabled required>
							</div>
							<div class="card-body p-2">
								<button id="btnInstallerMemo" type="button" class="btn btn-block ripple p-2" data-toggle="modal" data-target="#modalInstallerMemo"><small><b><?php echo $lang["system_setup"]["system_installer_memo"]; ?></b></small></button>
							</div>
						</div>

						<div class="import-data-card card elevate-1 mt-3 d-none" style="height: auto !important">
							<div class="card-body p-2">
								<button id="btnImportDataFromCloud" type="button" class="btn btn-block ripple p-2" style="color:darkorange"><small><b><?php echo $lang["system_setup"]["import_data_from_cloud"] ?></b></small></button>
							</div>
						</div>

					</div>
					<div class="col-lg-3 d-xl-none"></div>

					<!-- Solar Panels -->
					<div id="solar" class="col-lg-6 col-xl-4 pt-5">

						<h1 class="card-header bg-transparent border-0"><?php echo $lang["system_setup"]["solar"] ?></h1>

						<div class="card elevate-1 h-100" style="height: calc(100% - 3.75rem - 4.5rem) !important">
							<div class="card-body border-bottom">
								<label for="solar_wattpeak"><?php echo $lang["system_setup"]["solar_size"]; ?></label>
								<div class="row m-0 p-0">
									<div class="col-6 d-flex align-items-center m-0 p-0"><input id="solar_wattpeak" class="form-control form-control-outline" type="number" step="1" min="0" required></div>
									<div class="col-6 d-flex align-items-center m-0 py-0 pr-0 pl-2"><span><?php echo $lang["system_setup"]["solar_watt_peak"]; ?></span></div>
								</div>
							</div>
							<div class="card-body border-bottom pt-3">
								<label for="solar_feedinlimitation"><?php echo $lang["system_setup"]["solar_feed_in_limitation"]; ?></label>
								<div class="row m-0 p-0">
									<div class="col-6 d-flex align-items-center m-0 p-0"><input id="solar_feedinlimitation" class="form-control form-control-outline" type="number" step="1" min="0" max="100" value="100" required></div>
									<div class="col-6 d-flex align-items-center m-0 py-0 pr-0 pl-2"><span>%</span></div>
								</div>
								<div class="custom-control custom-checkbox pt-3">
									<input type="checkbox" class="custom-control-input" id="regulation_check">
									<label class="custom-control-label" for="regulation_check"><?php echo $lang["system_setup"]["global_regulation_check"]; ?></label>
								</div>
							</div>
							<div class="card-body pt-3">
								<label for="solar_info"><?php echo $lang["system_setup"]["solar_info"]; ?></label>
								<textarea id="solar_info" class="form-control form-control-outline" placeholder="Paneltyp: ...

MPPT 1
	String 1: ...
	String 2: ...
MPPT 2
	String 1: ...
	String 2: ..."></textarea>
							</div>
							<div class="card-body border-top">
								<div class="custom-control custom-checkbox">
									<input type="checkbox" class="custom-control-input" id="extsol_check">
									<label class="custom-control-label" for="extsol_check"><?php echo $lang["system_setup"]["extsol_meter"]; ?></label>
								</div>
							</div>
						</div>

						<div class="card elevate-1 mt-3" style="height: auto !important">
							<div class="card-body p-2">
								<button id="btnUserMeters" type="button" class="btn btn-block ripple p-2" data-toggle="modal" data-target="#modalUserMeters"><small><b><?php echo $lang["system_setup"]["user_meters"]; ?></b></small></button>
							</div>
						</div>

					</div>

					<!-- Batteries -->
					<div id="battery" class="col-lg-6 col-xl-4 pt-5">

						<h1 class="card-header bg-transparent border-0"><?php echo $lang["system_setup"]["batteries"] ?></h1>

						<div class="card elevate-1 h-100">
						
							<div class="card-body">
								<div class="custom-control custom-radio d-inline-block">
									<input type="radio" id="bx_battery_type_0" name="bx_battery_type" class="custom-control-input" value="0" checked>
									<label class="custom-control-label" for="bx_battery_type_0"><?php echo $lang["system_setup"]["batteries_lifepo"] ?></label>
								</div>
								<div class="custom-control custom-radio d-inline-block ml-4">
									<input type="radio" id="bx_battery_type_n" name="bx_battery_type" class="custom-control-input" value="">
									<label class="custom-control-label" for="bx_battery_type_n"><?php echo $lang["system_setup"]["batteries_none"] ?></label>
								</div>
							</div>

							<div class="card-body border-top">

								<div id="battery_section_0">
									<label for="lifepo_bms"><?php echo $lang["system_setup"]["batteries_lifepo_sn_bms"] ?></label>
									<textarea id="lifepo_bms" class="form-control form-control-outline" placeholder="xxxxxxxxxxxxxxxx"></textarea>
									<label class="mt-3" for="lifepo_serialnumbers"><?php echo $lang["system_setup"]["batteries_lifepo_sn_battery"] ?></label>
									<textarea id="lifepo_serialnumbers" class="form-control form-control-outline" placeholder="xxxxxxxxxxxxxxxx"></textarea>
								</div>

								<div id="battery_section_n" style="display: none">
									<!-- There's nothing here -->
								</div>

							</div>
						</div>

					</div>

					<!-- Reactive Power Generation -->
					<div class="col-12 pt-5 <?php echo $isTor ? "tor" : "vde4105" ?> <?php echo ($isVde4105 || $isTor || $isEstonia) ? "" : "d-none" ?>">

						<h1 class="card-header bg-transparent border-0"><?php echo $isTor ? $lang["system_setup"]["reactive_title_tor"] : $lang["system_setup"]["reactive_title"] ?></h1>

						<div class="card elevate-1">
							<div class="card-body">
								<div class="row p-0 m-0">
									<div class="col-12 m-0 p-0">
										<div class="form-group row mx-n2 mb-0">
											<label for="reactive_mode" class="col-lg-3 col-5 col-form-label px-2"><?php echo $lang["system_setup"]["reactive_select_mode"] ?></label>
											<div class="col-lg-9 col-7 px-2">
												<select class="form-control form-control-outline" id="reactive_mode">
													<option value=""  <?php echo ($isVde4105 || $isTor || $isEstonia) == "1" ? "selected" : "" ?>></option>
													<option value="0" <?php echo ($isVde4105 || $isTor || $isEstonia) == "1" ? "" : "selected" ?>><?php echo $lang["dict_reactive_mode"]["0"] ?></option>
													<option value="2"><?php echo $lang["dict_reactive_mode"]["2"] ?></option>
													<option value="3"><?php echo $lang["dict_reactive_mode"]["3"] ?></option>
													<option value="1"><?php echo $lang["dict_reactive_mode"]["1"] ?></option>
													<?php if($isTor): ?><option value="4"><?php echo $lang["dict_reactive_mode"]["4"] ?></option><?php endif; ?>
												</select>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="reactive_mode1" class="card-body border-top d-none">
								<div class="row p-0 m-0">
									<div class="col-lg-2"></div>
									<div class="col-lg-3 m-0 p-0 d-flex flex-column justify-content-center">
										<div class="form-group row mx-n2 mb-0">
											<label for="reactive_mode1_kink" class="col-12 col-form-label px-3"><?php echo $lang["system_setup"]["reactive_kinkpoint"] ?></label>
											<div class="col-12 px-2">
												<select class="form-control form-control-outline" id="reactive_mode1_kink">
													<option value="50">0.5</option>
													<option value="40">0.4</option>
													<option value="30">0.3</option>
													<option value="20">0.2</option>
												</select>
											</div>
										</div>
									</div>
									<div class="col-lg-6 m-0 p-0">
										<svg id="svg_reactive_mode1" xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="0 0 1200 900"><style type="text/css">.st0{fill:#808080;}.st1{fill:#007BFF;}.st3{font-family:Roboto;}.st4{font-size:36px;}</style><rect x="289.3" y="107.5" width="5" height="700"/><rect x="289.3" y="455" width="702.5" height="5"/><polygon points="283.2 107.5 291.8 92.5 300.5 107.5 "/><polygon points="991.8 448.8 1006.8 457.5 991.8 466.2 "/><rect x="689.3" y="680" class="st0" width="30" height="5"/><rect x="639.3" y="680" class="st0" width="30" height="5"/><rect x="589.3" y="680" class="st0" width="30" height="5"/><rect x="539.3" y="680" class="st0" width="30" height="5"/><rect x="489.3" y="680" class="st0" width="30" height="5"/><rect x="439.3" y="680" class="st0" width="30" height="5"/><rect x="389.3" y="680" class="st0" width="30" height="5"/><rect x="339.3" y="680" class="st0" width="30" height="5"/><rect x="289.3" y="680" class="st0" width="30" height="5"/><rect x="291.8" y="455" class="st1" width="193.2" height="5"/><path d="M203.4 132.6c1.1 0 2.2-0.4 3-1.1s1.3-1.6 1.3-2.6h3.1l0 0.1c0.1 1.6-0.7 3.1-2.2 4.4s-3.3 1.9-5.3 1.9c-2.8 0-4.9-0.9-6.3-2.7s-2.2-4.1-2.2-6.8v-0.7c0-2.7 0.7-5 2.2-6.8s3.6-2.7 6.3-2.7c2.2 0 4 0.7 5.5 2s2.1 2.9 2 4.8l0 0.1h-3.1c0-1.2-0.4-2.1-1.2-3s-1.9-1.2-3.1-1.2c-1.8 0-3.1 0.7-3.9 2s-1.2 2.9-1.2 4.8v0.7c0 1.9 0.4 3.6 1.2 4.9S201.6 132.6 203.4 132.6z"/><path d="M214 125.2c0-2.8 0.8-5.1 2.3-7s3.6-2.7 6.2-2.7c2.6 0 4.7 0.9 6.2 2.7s2.3 4.1 2.3 7v0.4c0 2.8-0.8 5.2-2.3 7s-3.6 2.7-6.2 2.7 -4.7-0.9-6.2-2.7 -2.3-4.1-2.3-7V125.2zM217.4 125.6c0 2 0.4 3.7 1.3 5 0.8 1.3 2.1 2 3.8 2 1.7 0 2.9-0.7 3.8-2 0.9-1.3 1.3-3 1.3-5v-0.4c0-2-0.4-3.6-1.3-5s-2.1-2-3.8-2c-1.7 0-2.9 0.7-3.8 2s-1.3 3-1.3 5V125.6z"/><path d="M246.3 129.9c0-0.8-0.3-1.4-0.9-1.9s-1.7-0.9-3.3-1.3c-2.3-0.5-4-1.2-5.2-2s-1.7-2-1.7-3.5c0-1.5 0.7-2.9 2-3.9s3-1.6 5.1-1.6c2.2 0 4 0.6 5.3 1.7s1.9 2.5 1.9 4.1l0 0.1h-3.3c0-0.8-0.3-1.6-1-2.2s-1.6-1-2.8-1c-1.2 0-2.1 0.3-2.7 0.8s-0.9 1.2-0.9 2c0 0.8 0.3 1.3 0.8 1.8s1.6 0.8 3.2 1.2c2.4 0.5 4.2 1.2 5.4 2.1s1.8 2.1 1.8 3.6c0 1.7-0.7 3.1-2 4.1s-3.1 1.6-5.4 1.6c-2.4 0-4.3-0.6-5.7-1.8s-2.1-2.7-2-4.3l0-0.1h3.3c0.1 1.2 0.5 2.1 1.4 2.7s1.9 0.8 3 0.8c1.2 0 2.2-0.2 2.9-0.7S246.3 130.7 246.3 129.9z"/><path d="M265.9 115.9c2.7 0 5 0.9 6.9 2.8s2.9 4.2 2.9 7c0 2.6-0.8 4.7-2.4 6.5s-4 2.8-7.3 3v8.1h-3.5v-8.1c-3.2-0.3-5.6-1.4-7.1-3.3 -1.5-1.9-2.3-4.2-2.3-6.9 0-1.8 0.2-3.4 0.6-4.9s0.9-2.9 1.5-4.2h3.6c-0.7 1.6-1.2 3.1-1.6 4.6 -0.4 1.5-0.6 3-0.6 4.5 0 1.8 0.5 3.4 1.4 4.8 1 1.4 2.4 2.2 4.4 2.5l0.1 0v-16.3H265.9zM272.1 125.7c0-1.9-0.6-3.6-1.7-4.9 -1.1-1.4-2.6-2.1-4.4-2l-0.1 0v13.5l0.1 0c2.1-0.2 3.6-1 4.6-2.3S272.1 127.4 272.1 125.7z"/><path d="M887.3 494.7v10.3h-3.5v-25.6h9.8c2.7 0 4.9 0.7 6.4 2.1s2.3 3.3 2.3 5.6c0 2.3-0.8 4.2-2.3 5.6s-3.6 2.1-6.4 2.1H887.3zM887.3 491.9h6.3c1.7 0 3-0.5 3.9-1.4 0.9-0.9 1.3-2.1 1.3-3.5 0-1.4-0.4-2.6-1.3-3.5 -0.9-0.9-2.2-1.4-3.9-1.4h-6.3V491.9z"/><path d="M907 507.1h-3l10.7-27.8h2.9L907 507.1z"/><path d="M925.3 494.7v10.3h-3.5v-25.6h9.8c2.7 0 4.9 0.7 6.4 2.1s2.3 3.3 2.3 5.6c0 2.3-0.8 4.2-2.3 5.6s-3.6 2.1-6.4 2.1H925.3zM925.3 491.9h6.3c1.7 0 3-0.5 3.9-1.4 0.9-0.9 1.3-2.1 1.3-3.5 0-1.4-0.4-2.6-1.3-3.5 -0.9-0.9-2.2-1.4-3.9-1.4h-6.3V491.9z"/><path d="M954 497h-7.8v6.1h9v1.8h-11.3v-17.1H955v1.8h-8.9v5.5h7.8V497z"/><path d="M959.5 492.2l0.2 1.7c0.4-0.6 0.9-1.1 1.6-1.4s1.4-0.5 2.2-0.5 1.6 0.2 2.2 0.6 1.1 1 1.4 1.8c0.4-0.7 0.9-1.3 1.6-1.7s1.4-0.6 2.3-0.6c1.3 0 2.3 0.4 3.1 1.3s1.1 2.2 1.1 4v7.6h-2.3v-7.6c0-1.3-0.2-2.1-0.6-2.7s-1.1-0.8-1.9-0.8c-0.8 0-1.4 0.3-1.9 0.8s-0.8 1.2-0.9 2.1v0.1 8.1h-2.3v-7.6c0-1.2-0.2-2.1-0.7-2.6s-1.1-0.8-1.9-0.8c-0.7 0-1.3 0.1-1.7 0.4s-0.8 0.7-1 1.2v9.4h-2.3v-12.7H959.5z"/><path d="M986.2 504.9c-0.1-0.4-0.1-0.7-0.2-1s-0.1-0.6-0.1-0.9c-0.4 0.6-1 1.1-1.7 1.5s-1.4 0.6-2.2 0.6c-1.3 0-2.3-0.3-3-1s-1-1.6-1-2.8c0-1.2 0.5-2.2 1.5-2.8s2.3-1 4-1h2.5v-1.3c0-0.7-0.2-1.3-0.7-1.8s-1.1-0.7-1.9-0.7c-0.7 0-1.3 0.2-1.8 0.6s-0.7 0.8-0.7 1.4h-2.2l0-0.1c0-0.9 0.4-1.8 1.3-2.5s2.1-1.1 3.6-1.1c1.4 0 2.6 0.4 3.5 1.1s1.3 1.8 1.3 3.2v6.1c0 0.5 0 0.9 0.1 1.3s0.1 0.8 0.3 1.2H986.2zM982.4 503.2c0.8 0 1.6-0.2 2.3-0.6 0.7-0.4 1.1-0.9 1.3-1.5v-2.1h-2.6c-0.9 0-1.7 0.2-2.2 0.7 -0.6 0.5-0.8 1-0.8 1.6 0 0.6 0.2 1 0.5 1.3S981.7 503.2 982.4 503.2z"/><path d="M995.9 496.9l2.7-4.7h2.7l-4.1 6.3 4.2 6.4h-2.6l-2.8-4.8 -2.8 4.8h-2.7l4.2-6.4 -4.1-6.3h2.7L995.9 496.9z"/><path d="M228.6 232.4c0 3.3-0.7 5.8-2.2 7.5s-3.4 2.6-6 2.6 -4.5-0.9-6-2.6 -2.2-4.2-2.2-7.5v-6.1c0-3.3 0.7-5.8 2.2-7.5s3.4-2.6 6-2.6c2.5 0 4.5 0.9 6 2.6s2.2 4.3 2.2 7.5V232.4zM225.1 225.6c0-2.2-0.4-3.9-1.2-5 -0.8-1.1-2-1.7-3.5-1.7s-2.7 0.6-3.5 1.7c-0.8 1.1-1.2 2.8-1.2 5v7.5c0 2.2 0.4 3.9 1.2 5s2 1.7 3.5 1.7 2.7-0.6 3.5-1.7 1.2-2.8 1.2-5V225.6z"/><path d="M236.9 242.2h-3.5v-3.6h3.5V242.2z"/><path d="M249.2 239.8c1.7 0 3-0.6 4.1-1.9s1.5-3.2 1.5-5.7v-1.2c-0.6 0.8-1.3 1.5-2.2 1.9s-1.8 0.6-2.9 0.6c-2.5 0-4.4-0.8-5.9-2.3s-2.2-3.6-2.2-6.3c0-2.6 0.8-4.7 2.3-6.3s3.4-2.5 5.6-2.5c2.7 0 4.8 0.8 6.3 2.5 1.5 1.7 2.3 4.1 2.3 7.4v6.1c0 3.3-0.8 5.9-2.5 7.7 -1.7 1.8-3.8 2.7-6.5 2.7 -0.9 0-1.8-0.1-2.8-0.3 -0.9-0.2-1.8-0.4-2.5-0.8l0.5-2.7c0.7 0.4 1.4 0.6 2.2 0.8S248.3 239.8 249.2 239.8zM249.8 230.9c1.3 0 2.3-0.3 3.2-0.8s1.5-1.3 1.8-2.1v-2.2c0-2.2-0.4-3.9-1.3-5.1s-2.1-1.7-3.8-1.7c-1.3 0-2.3 0.6-3.2 1.7s-1.3 2.6-1.3 4.3c0 1.8 0.4 3.2 1.2 4.3S248.4 230.9 249.8 230.9z"/><path d="M318.7 401.1v3.2h-2.9v-3.2H318.7zM318.7 407.9v3.2h-2.9v-3.2H318.7zM320.9 398.1h14.5c2.3 0 4.1 0.8 5.3 2.3 1.2 1.5 1.8 3.5 1.8 5.9 0 2.3-0.6 4.2-1.9 5.7 -1.2 1.5-3 2.2-5.3 2.2h-14.5v-2.9h14.4c1.6 0 2.8-0.5 3.7-1.4s1.3-2.1 1.3-3.6c0-1.6-0.4-2.9-1.3-3.8s-2.1-1.5-3.7-1.5h-14.4V398.1z"/><path d="M334.9 380.4c2.3 0 4.1 0.5 5.5 1.6 1.4 1.1 2.1 2.6 2.1 4.5 0 1-0.2 2-0.6 2.7s-1 1.4-1.8 1.9l2.1 0.4v2.4h-22.9V391h8.9c-0.7-0.5-1.2-1.1-1.6-1.9 -0.4-0.7-0.6-1.6-0.6-2.6 0-2 0.8-3.5 2.3-4.6s3.6-1.6 6.2-1.6H334.9zM334.6 383.3c-1.8 0-3.3 0.3-4.4 1s-1.7 1.7-1.7 3.1c0 0.9 0.2 1.6 0.7 2.2s1 1.1 1.8 1.5h6.9c0.8-0.4 1.4-0.9 1.8-1.5 0.4-0.6 0.7-1.4 0.7-2.3 0-1.4-0.5-2.4-1.5-3s-2.2-1-3.8-1H334.6z"/><path d="M342.5 370.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 367.9 342.5 369 342.5 370.3zM328.3 370.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 368.6 328.3 369.5 328.3 370.7z"/><path d="M328.9 353.5l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 353.5z"/><path d="M342.5 344.4c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 342 342.5 343.1 342.5 344.4zM328.3 344.9c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 342.8 328.3 343.7 328.3 344.9z"/><path d="M328.9 327.6l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 327.6z"/><path d="M328.9 317.4l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 317.4z"/><path d="M342.5 308.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 305.8 342.5 307 342.5 308.3zM328.3 308.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 306.6 328.3 307.5 328.3 308.7z"/><path d="M334.6 299.6c-2.5 0-4.6-0.6-6.2-1.7s-2.3-2.7-2.3-4.6c0-1 0.2-1.9 0.6-2.7s1-1.4 1.8-1.9l-2.1-0.4v-2.3h15.9c2 0 3.6 0.6 4.7 1.8s1.6 2.9 1.6 5.1c0 0.8-0.1 1.6-0.3 2.5 -0.2 0.9-0.5 1.7-0.9 2.3l-2.2-0.7c0.3-0.5 0.5-1.1 0.7-1.9s0.3-1.5 0.3-2.2c0-1.4-0.3-2.4-1-3.1 -0.6-0.6-1.6-1-2.9-1h-1.8c0.7 0.5 1.2 1.1 1.5 1.9s0.5 1.6 0.5 2.5c0 1.9-0.7 3.5-2.1 4.6s-3.2 1.7-5.5 1.7H334.6zM334.9 296.7c1.6 0 2.9-0.3 3.8-1s1.5-1.7 1.5-3.1c0-0.9-0.2-1.6-0.6-2.2s-1-1.1-1.7-1.5h-7.3c-0.7 0.4-1.2 0.9-1.6 1.5s-0.6 1.3-0.6 2.2c0 1.4 0.6 2.4 1.7 3.1s2.6 1 4.4 1H334.9z"/><path d="M322.5 278.1h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1V281h-3.8V278.1z"/><path d="M320.9 628.3h14.5c2.3 0 4.1 0.8 5.3 2.3 1.2 1.5 1.8 3.5 1.8 5.9 0 2.3-0.6 4.2-1.9 5.7 -1.2 1.5-3 2.2-5.3 2.2h-14.5v-2.9h14.4c1.6 0 2.8-0.5 3.7-1.4s1.3-2.1 1.3-3.6c0-1.6-0.4-2.9-1.3-3.8s-2.1-1.5-3.7-1.5h-14.4V628.3z"/><path d="M326.3 621.5l2.4-0.2c-0.8-0.5-1.5-1.2-2-2 -0.5-0.8-0.7-1.7-0.7-2.7 0-1.7 0.5-3 1.5-4s2.5-1.4 4.6-1.4h10v2.9h-9.9c-1.4 0-2.4 0.3-3 0.8s-0.9 1.4-0.9 2.5c0 0.8 0.2 1.6 0.6 2.2 0.4 0.6 0.9 1.2 1.6 1.5h11.6v2.9h-15.8V621.5z"/><path d="M322.5 603.3h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1v-2.5h-3.8V603.3z"/><path d="M342.5 590.1c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 587.7 342.5 588.8 342.5 590.1zM328.3 590.6c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0V587h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 588.5 328.3 589.4 328.3 590.6z"/><path d="M328.9 573.3l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 573.3z"/><path d="M342.5 564.3c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 561.8 342.5 562.9 342.5 564.3zM328.3 564.7c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 562.6 328.3 563.5 328.3 564.7z"/><path d="M328.9 547.5l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 547.5z"/><path d="M328.9 537.2l-0.1 1.5c0 0.8 0.2 1.4 0.5 1.9 0.4 0.5 0.9 0.9 1.5 1.2h11.3v2.9h-15.8v-2.6l2.3-0.3c-0.8-0.4-1.5-1-1.9-1.7 -0.5-0.7-0.7-1.4-0.7-2.3 0-0.2 0-0.4 0.1-0.6s0.1-0.4 0.1-0.5L328.9 537.2z"/><path d="M342.5 528.1c0 2.2-0.7 4-2.2 5.3 -1.5 1.3-3.4 2-5.7 2h-0.6c-2.3 0-4.1-0.7-5.6-2 -1.5-1.3-2.2-2.9-2.2-4.8 0-2.1 0.6-3.8 1.9-4.8s3-1.6 5.2-1.6h1.8v10.3l0.1 0c1.5 0 2.8-0.4 3.7-1.2 1-0.7 1.5-1.8 1.5-3.1 0-1-0.1-1.8-0.4-2.6s-0.7-1.4-1.1-1.9l1.9-1.1c0.6 0.6 1 1.3 1.4 2.2C342.3 525.7 342.5 526.8 342.5 528.1zM328.3 528.5c0 1 0.4 1.8 1.2 2.5 0.8 0.7 1.8 1.1 3.1 1.3l0.1 0v-7.3h-0.4c-1.1 0-2.1 0.3-2.8 0.9C328.7 526.4 328.3 527.3 328.3 528.5z"/><path d="M334.6 519.4c-2.5 0-4.6-0.6-6.2-1.7s-2.3-2.7-2.3-4.6c0-1 0.2-1.9 0.6-2.7s1-1.4 1.8-1.9l-2.1-0.4v-2.3h15.9c2 0 3.6 0.6 4.7 1.8s1.6 2.9 1.6 5.1c0 0.8-0.1 1.6-0.3 2.5 -0.2 0.9-0.5 1.7-0.9 2.3l-2.2-0.7c0.3-0.5 0.5-1.1 0.7-1.9s0.3-1.5 0.3-2.2c0-1.4-0.3-2.4-1-3.1 -0.6-0.6-1.6-1-2.9-1h-1.8c0.7 0.5 1.2 1.1 1.5 1.9s0.5 1.6 0.5 2.5c0 1.9-0.7 3.5-2.1 4.6s-3.2 1.7-5.5 1.7H334.6zM334.9 516.6c1.6 0 2.9-0.3 3.8-1s1.5-1.7 1.5-3.1c0-0.9-0.2-1.6-0.6-2.2s-1-1.1-1.7-1.5h-7.3c-0.7 0.4-1.2 0.9-1.6 1.5s-0.6 1.3-0.6 2.2c0 1.4 0.6 2.4 1.7 3.1s2.6 1 4.4 1H334.9z"/><path d="M322.5 498h3.8v-3h2.1v3h9.6c0.7 0 1.3-0.2 1.6-0.5 0.3-0.3 0.5-0.7 0.5-1.2 0-0.2 0-0.3-0.1-0.5s-0.1-0.4-0.1-0.5l2-0.4c0.2 0.2 0.3 0.5 0.4 0.9s0.2 0.8 0.2 1.3c0 1.2-0.4 2.1-1.1 2.8s-1.8 1-3.3 1h-9.6v2.5h-2.1v-2.5h-3.8V498z"/><rect x="714.3" y="430" class="st0" width="5" height="30"/><rect x="714.3" y="380" class="st0" width="5" height="30"/><rect x="714.3" y="330" class="st0" width="5" height="30"/><rect x="714.3" y="280" class="st0" width="5" height="30"/><rect x="689.3" y="230" class="st0" width="30" height="5"/><rect x="639.3" y="230" class="st0" width="30" height="5"/><rect x="589.3" y="230" class="st0" width="30" height="5"/><rect x="539.3" y="230" class="st0" width="30" height="5"/><rect x="489.3" y="230" class="st0" width="30" height="5"/><rect x="439.3" y="230" class="st0" width="30" height="5"/><rect x="389.3" y="230" class="st0" width="30" height="5"/><rect x="339.3" y="230" class="st0" width="30" height="5"/><rect x="289.3" y="230" class="st0" width="30" height="5"/><rect x="291.8" y="455" class="st1" width="216.9" height="5"/><rect x="714.3" y="455" class="st0" width="5" height="30"/><rect x="714.3" y="505" class="st0" width="5" height="30"/><rect x="714.3" y="555" class="st0" width="5" height="30"/><rect x="714.3" y="605" class="st0" width="5" height="30"/><rect x="714.3" y="655" class="st0" width="5" height="30"/><rect x="714.3" y="230" class="st0" width="5" height="30"/><rect x="457.9" y="567.7" transform="matrix(-0.682 -0.7314 0.7314 -0.682 612.4574 1406.7548)" class="st1" width="308.4" height="5"/><text class="st3 st4" id="svg_reactive_mode1_kink_value" transform="matrix(1 0 0 1 480 430)">0.5</text><path d="M744 430h-3.5v-22.2l-5.2 0.1v-2.5l8.7-0.9V430z"/><rect x="714.3" y="442.5" width="5" height="30"/><rect x="506.2" y="442.5" width="5" height="30"/><rect x="714.3" y="442.5" width="5" height="30"/><rect x="276.8" y="230" width="30" height="5"/><rect x="276.8" y="680" width="30" height="5"/><path d="M228.6 682.4c0 3.3-0.7 5.8-2.2 7.5s-3.4 2.6-6 2.6 -4.5-0.9-6-2.6 -2.2-4.2-2.2-7.5v-6.1c0-3.3 0.7-5.8 2.2-7.5s3.4-2.6 6-2.6c2.5 0 4.5 0.9 6 2.6s2.2 4.3 2.2 7.5V682.4zM225.1 675.6c0-2.2-0.4-3.9-1.2-5 -0.8-1.1-2-1.7-3.5-1.7s-2.7 0.6-3.5 1.7c-0.8 1.1-1.2 2.8-1.2 5v7.5c0 2.2 0.4 3.9 1.2 5 0.8 1.1 2 1.7 3.5 1.7s2.7-0.6 3.5-1.7c0.8-1.1 1.2-2.8 1.2-5V675.6z"/><path d="M236.9 692.2h-3.5v-3.6h3.5V692.2z"/><path d="M249.2 689.8c1.7 0 3-0.6 4.1-1.9 1-1.3 1.5-3.2 1.5-5.7v-1.2c-0.6 0.8-1.3 1.5-2.2 1.9s-1.8 0.6-2.9 0.6c-2.5 0-4.4-0.8-5.9-2.3s-2.2-3.6-2.2-6.3c0-2.6 0.8-4.7 2.3-6.3s3.4-2.5 5.6-2.5c2.7 0 4.8 0.8 6.3 2.5 1.5 1.7 2.3 4.1 2.3 7.4v6.1c0 3.3-0.8 5.9-2.5 7.7 -1.7 1.8-3.8 2.7-6.5 2.7 -0.9 0-1.8-0.1-2.8-0.3 -0.9-0.2-1.8-0.4-2.5-0.8l0.5-2.7c0.7 0.4 1.4 0.6 2.2 0.8S248.3 689.8 249.2 689.8zM249.8 680.9c1.3 0 2.3-0.3 3.2-0.8 0.8-0.6 1.5-1.3 1.8-2.1v-2.2c0-2.2-0.4-3.9-1.3-5.1 -0.9-1.1-2.1-1.7-3.8-1.7 -1.3 0-2.3 0.6-3.2 1.7 -0.9 1.1-1.3 2.6-1.3 4.3 0 1.8 0.4 3.2 1.2 4.3C247.2 680.3 248.4 680.9 249.8 680.9z"/><rect x="276.8" y="455" width="30" height="5"/><path d="M252.6 467.2h-3.5V445l-5.2 0.1v-2.5l8.7-0.9V467.2z"/></svg>
									</div>
								</div>
							</div>
							<div id="reactive_mode2" class="card-body border-top d-none">
								<div class="row p-0 m-0">
									<div class="col-12 m-0 p-0">
										<div class="form-group row mx-n2 mb-0">
											<label for="reactive_mode2_cosphi" class="col-3 col-form-label px-2">cosφ</label>
											<div class="col-3 px-2">
												<select class="form-control form-control-outline" id="reactive_mode2_cosphi_sign">
													<option value="0"><?php echo $lang["system_setup"]["reactive_overexcited"] ?></option>
													<option value="1"><?php echo $lang["system_setup"]["reactive_underexcited"] ?></option>
												</select>
											</div>
											<div class="col-6 px-2">
												<select class="form-control form-control-outline" id="reactive_mode2_cosphi">
													<option value="90">0.90</option>
													<option value="91">0.91</option>
													<option value="92">0.92</option>
													<option value="93">0.93</option>
													<option value="94">0.94</option>
													<option value="95">0.95</option>
													<option value="96">0.96</option>
													<option value="97">0.97</option>
													<option value="98">0.98</option>
													<option value="99">0.99</option>
													<option value="100" selected>1.00</option>
												</select>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div id="reactive_mode3" class="card-body border-top d-none">
								<div class="row p-0 m-0">
									<div class="col-lg-4 m-0 p-0 d-flex flex-column justify-content-center">
										<div class="form-group row mx-n2 mb-2"><label for="reactive_mode3_v1" class="col-3 col-form-label px-2 text-center">U1</label><div class="col-7 px-2"><input value="<?php echo $isTor ?  "92" :  "93" ?>" placeholder="<?php echo $isTor ?  "92" :  "93" ?>" type="number" class="form-control form-control-outline" id="reactive_mode3_v1"></div><label class="col-2 col-form-label px-2">%</label></div>
										<div class="form-group row mx-n2 mb-2"><label for="reactive_mode3_v2" class="col-3 col-form-label px-2 text-center">U2</label><div class="col-7 px-2"><input value="<?php echo $isTor ?  "96" :  "97" ?>" placeholder="<?php echo $isTor ?  "96" :  "97" ?>" type="number" class="form-control form-control-outline" id="reactive_mode3_v2"></div><label class="col-2 col-form-label px-2">%</label></div>
										<div class="form-group row mx-n2 mb-2"><label for="reactive_mode3_v3" class="col-3 col-form-label px-2 text-center">U3</label><div class="col-7 px-2"><input value="<?php echo $isTor ? "105" : "103" ?>" placeholder="<?php echo $isTor ? "105" : "103" ?>" type="number" class="form-control form-control-outline" id="reactive_mode3_v3"></div><label class="col-2 col-form-label px-2">%</label></div>
										<div class="form-group row mx-n2 mb-4"><label for="reactive_mode3_v4" class="col-3 col-form-label px-2 text-center">U4</label><div class="col-7 px-2"><input value="<?php echo $isTor ? "108" : "107" ?>" placeholder="<?php echo $isTor ? "108" : "107" ?>" type="number" class="form-control form-control-outline" id="reactive_mode3_v4"></div><label class="col-2 col-form-label px-2">%</label></div>
										<div class="form-group row mx-n2 mb-4">
											<label for="reactive_mode3_qmaxsn" class="col-3 col-form-label px-2 text-center">Qmax/Sn</label>
											<div class="col-7 px-2">
												<select class="form-control form-control-outline" id="reactive_mode3_qmaxsn">
													<option value="0.436">0.436</option>
													<option value="0.415">0.415</option>
													<option value="0.392">0.392</option>
													<option value="0.368">0.368</option>
													<option value="0.341">0.341</option>
													<option value="0.312">0.312</option>
													<option value="0.280">0.280</option>
													<option value="0.243">0.243</option>
													<option value="0.199">0.199</option>
													<option value="0.141">0.141</option>
													<option value="0.000">0.000</option>
												</select>
											</div>
											<label class="col-2 col-form-label px-2"></label>
										</div>
										<div class="form-group row mx-n2 mb-0">
											<label for="reactive_mode3_qutime" class="col-12 col-form-label px-3"><?php echo $lang["system_setup"]["reactive_qutime"] ?></label>
											<div class="col-10 px-2"><input value="5" placeholder="5" type="number" class="form-control form-control-outline" id="reactive_mode3_qutime"></div>
											<label class="col-2 col-form-label px-2">sec</label></div>
									</div>
									<div class="col-lg-8 m-0 p-0">
										<svg id="svg_reactive_mode3" xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="0 0 1600 900"><style type="text/css">.st0{fill:#808080;}.st1{fill:#007BFF;}.st2{fill:none;}.st3{font-family:Roboto;}.st4{font-size:36px;}.st5{font-size:24px;}.st7{font-size:30px;}</style><rect x="797.5" y="100" width="5" height="700"/><rect x="100" y="447.5" width="1400" height="5"/><polygon points="791.3 100 800 85 808.7 100 "/><polygon points="1500 441.3 1515 450 1500 458.7 "/><rect x="322.5" y="672.5" class="st0" width="30" height="5"/><rect x="372.5" y="672.5" class="st0" width="30" height="5"/><rect x="422.5" y="672.5" class="st0" width="30" height="5"/><rect x="472.5" y="672.5" class="st0" width="30" height="5"/><rect x="522.5" y="672.5" class="st0" width="30" height="5"/><rect x="572.5" y="672.5" class="st0" width="30" height="5"/><rect x="622.5" y="672.5" class="st0" width="30" height="5"/><rect x="672.5" y="672.5" class="st0" width="30" height="5"/><rect x="722.5" y="672.5" class="st0" width="30" height="5"/><rect x="772.5" y="672.5" class="st0" width="30" height="5"/><rect x="606.8" y="447.5" class="st1" width="193.2" height="5"/><rect x="760.2" y="103.8" class="st2" width="33.5" height="35.5"/><text transform="matrix(1 0 0 1 760.1667 131.265)" class="st3 st4">Q</text><rect x="1420.8" y="468.3" class="st2" width="86.7" height="35.5"/><text transform="matrix(1 0 0 1 1420.8328 495.7585)"><tspan class="st3 st4">U&#x2F;U</tspan><tspan x="59.9" class="st3 st5">n</tspan></text><rect x="708.2" y="207.3" class="st2" width="84.1" height="35.5"/><text transform="matrix(1 0 0 1 708.1667 234.6816)"><tspan class="st3 st4">Q</tspan><tspan x="23" class="st3 st5">max</tspan></text><rect x="1355" y="319.8" class="st2" width="160" height="35.5"/><text transform="matrix(1 0 0 1 1355 342.6099)" class="st3 st7"><?php echo $lang["system_setup"]["reactive_underexcited"] ?></text><rect x="1355" y="589.8" class="st2" width="160" height="35.5"/><text transform="matrix(1 0 0 1 1355 612.6868)" class="st3 st7"><?php echo $lang["system_setup"]["reactive_overexcited"] ?></text><rect x="827.8" y="657.3" class="st2" width="94.5" height="35.5"/><text transform="matrix(1 0 0 1 827.7602 684.6816)"><tspan class="st3 st4">-Q</tspan><tspan x="32.3" class="st3 st5">max</tspan></text><rect x="1322.5" y="422.5" class="st0" width="5" height="30"/><rect x="1322.5" y="372.5" class="st0" width="5" height="30"/><rect x="1322.5" y="322.5" class="st0" width="5" height="30"/><rect x="1322.5" y="272.5" class="st0" width="5" height="30"/><rect x="1247.5" y="222.5" class="st0" width="30" height="5"/><rect x="1197.5" y="222.5" class="st0" width="30" height="5"/><rect x="1147.5" y="222.5" class="st0" width="30" height="5"/><rect x="1097.5" y="222.5" class="st0" width="30" height="5"/><rect x="1047.5" y="222.5" class="st0" width="30" height="5"/><rect x="997.5" y="222.5" class="st0" width="30" height="5"/><rect x="947.5" y="222.5" class="st0" width="30" height="5"/><rect x="897.5" y="222.5" class="st0" width="30" height="5"/><rect x="847.5" y="222.5" class="st0" width="30" height="5"/><rect x="797.5" y="222.5" class="st0" width="30" height="5"/><rect x="800" y="447.5" class="st1" width="193.2" height="5"/><rect x="272.5" y="447.5" class="st0" width="5" height="30"/><rect x="272.5" y="497.5" class="st0" width="5" height="30"/><rect x="272.5" y="547.5" class="st0" width="5" height="30"/><rect x="272.5" y="597.5" class="st0" width="5" height="30"/><rect x="272.5" y="647.5" class="st0" width="5" height="30"/><rect x="272.5" y="672.5" class="st0" width="30" height="5"/><rect x="1297.5" y="222.5" class="st0" width="30" height="5"/><rect x="1322.5" y="222.5" class="st0" width="5" height="30"/><rect x="238.9" y="560" transform="matrix(0.829 -0.5592 0.5592 0.829 -239.1897 342.6775)" class="st1" width="403.8" height="5"/><rect x="199.8" y="672.5" class="st1" width="75" height="5"/><rect x="957.3" y="335" transform="matrix(-0.829 0.5592 -0.5592 -0.829 2308.863 -30.9006)" class="st1" width="403.8" height="5"/><rect x="1325.2" y="222.5" class="st1" width="72.3" height="5"/><rect x="814.5" y="465.3" class="st2" width="61.5" height="35.5"/><text transform="matrix(1 0 0 1 814.5 492.6816)"><tspan class="st3 st4">U</tspan><tspan x="22.9" class="st3 st5">Q0</tspan></text><rect x="210" y="390.4" class="st2" width="130" height="35.5"/><text transform="matrix(1 0 0 1 243.6146 417.8488)" class="st3 st4" id="svg_reactive_mode3_v1_value">93%</text><rect x="547.6" y="390.4" class="st2" width="118.4" height="35.5"/><text transform="matrix(1 0 0 1 575.4271 417.8488)" class="st3 st4" id="svg_reactive_mode3_v2_value">97%</text><rect x="928.3" y="478.9" class="st2" width="122.4" height="35.5"/><text transform="matrix(1 0 0 1 948.646 506.3483)" class="st3 st4" id="svg_reactive_mode3_v3_value">103%</text><rect x="1256" y="478.9" class="st2" width="130.6" height="35.5"/><text transform="matrix(1 0 0 1 1280.459 506.3483)" class="st3 st4" id="svg_reactive_mode3_v4_value">107%</text><rect x="272.5" y="435" width="5" height="30"/><rect x="604.3" y="435" width="5" height="30"/><rect x="990.7" y="435" width="5" height="30"/><rect x="1322.5" y="435" width="5" height="30"/><rect x="785" y="222.5" width="30" height="5"/><rect x="785" y="672.5" width="30" height="5"/></svg>
									</div>
								</div>
							</div>
							<div id="reactive_mode4" class="card-body border-top d-none">
								<div class="row p-0 m-0">
									<div class="col-12 m-0 p-0">
										<div class="form-group row mx-n2 mb-0">
											<label for="reactive_mode4_qfix" class="col-3 col-form-label px-2">Qfix</label>
											<div class="col-7 px-2">
												<input value="0" placeholder="0" type="number" class="form-control form-control-outline" id="reactive_mode4_qfix">
											</div>
											<label class="col-2 col-form-label px-2">VAR</label>
										</div>
									</div>
								</div>
							</div>
							<div class="card-body p-2 border-top d-flex justify-content-end align-items-center">
								<button id="btnExtendedParameters" type="button" class="btn ripple px-3 py-2" data-toggle="modal" data-target="#modalExtendedParameters"><small><b><?php echo $lang["system_setup"]["extended_parameters"] ?></b></small></button>
							</div>
						</div>

					</div>

				</div>

				<div class="text-center">
					<div class="setting-progress pt-4 mt-5 d-none">
						<div class="d-flex align-items-center justify-content-center">
							<div id="notif" class="loading d-block"></div>
							<span id="message"><?php echo $lang["system_setup"]["msg_setting_parameters"]; ?></span>
						</div>
					</div>
				</div>

				<input id="installation_date" type="hidden" value="<?php echo date("Y-m-d"); ?>">

			</form>

		</div>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script>const apikey = <?php echo json_encode($apikey) ?>;</script>
		<script>const isVde4105 = <?php echo $isVde4105 ? "true" : "false" ?>;</script>
		<script>const isTor = <?php echo $isTor ? "true" : "false" ?>;</script>
		<script>const isEstonia = <?php echo $isEstonia ? "true" : "false" ?>;</script>
		<script>const customerEmail = <?php echo json_encode($customerEmail) ?>;</script>
		<script src="js/system_setup.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
