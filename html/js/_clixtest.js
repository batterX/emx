/*
	HELPER FUNCTIONS
*/

function getCurrentState(callback) {
    $.get({
        url: "api.php?get=currentstate",
        error: () => { callback(null); },
        success: (json) => { callback(json); }
    });
}
function getSettings(callback) {
    $.get({
        url: "api.php?get=settings",
        error: () => { callback(null); },
        success: (json) => { callback(json); }
    });
}
function getWarnings(callback) {
	$.get({
		url: "api.php?get=warnings",
		error: () => { callback(null); },
		success: (json) => { callback(json); }
	});
}

function enableStep (stepId) { $(`#${stepId}`).addClass   ("enable-step"); }
function disableStep(stepId) { $(`#${stepId}`).removeClass("enable-step"); }
function finishStep (stepId) { $(`#${stepId}`).removeClass("enable-step").addClass("finish-step"); }

function showError(stepId, msg) {
	$(`#${stepId}`).removeClass("enable-step").addClass("error-step");
	logMsg(stepId, "mt-4 red text-center", "<b>ERROR</b>");
	logMsg(stepId, "text-center", msg);
}

function logMsg(viewId, cls, msg) {
	if(msg == $(`#${viewId} .log .msg:last-child`).html()) return;
	$(`#${viewId} .log`).append(`<div class="msg ${cls}">${msg}</div>`);
}

function removeLastMsg(viewId) {
	$(`#${viewId} .log .msg:last-child`).remove();
}

function download(filename, text) {
	var element = document.createElement("a");
	element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	element.setAttribute("download", filename);
	element.style.display = "none";
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

function getReport() {
	var text = "";
	text += `Date:     ${$("#report_date    ").text()}\n`;
	text += `Software: ${$("#report_software").text()}\n`;
	text += `Apikey:   ${$("#report_apikey  ").text()}\n`;
	text += `S/N:      ${$("#report_sn      ").text()}\n`;
	text += `EW S/N:   ${$("#report_ewsn    ").val ()}\n`;
	text += `\n`;
	text += `Passed Tests:\n`;
	text += `- liveX Update\n`;
	text += `- UPS Mode\n`;
	text += `- GPIO\n`;
	text += `- E.Meter\n`;
	text += `- Backup Mode\n`;
	text += `\n`;
	text += `Note:\n`;
	text += `${$("#report_note").val()}\n`;
	return text;
}

var tempLogtime = "";
function getCurrentStateUpdate(callback) {
	setTimeout(() => {
		tempLogtime = "";
		getCurrentState((json) => {
			if(!json || !json.hasOwnProperty("logtime")) {
				getCurrentStateUpdate(callback);
			} else {
				tempLogtime = json.logtime;
				getCurrentStateUpdate_2(callback);
			}
		});
	}, 2500);
}
function getCurrentStateUpdate_2(callback) {
	setTimeout(() => {
		getCurrentState((json) => {
			if(!json || !json.hasOwnProperty("logtime")) {
				getCurrentStateUpdate_2(callback);
			} else {
				if(tempLogtime == json.logtime)
					getCurrentStateUpdate_2(callback);
				else
					callback(json);
			}
		});
	}, 2500);
}




















/*
    LIVEX UPDATE
*/

var livex_update_newVersion = softwareVersion;
var livex_update_interval;
var livex_update_isFinished = false;

function livex_update() {

	enableStep("livex_update");

	logMsg("livex_update", "", `Installed Version: <b>${softwareVersion}</b>`);

    $.get({
		url: "https://api.batterx.app",
		dataType: "text",
		cache: false,
		error: () => {
			logMsg("livex_update", "mt-4 red", "No Internet Connection");
            setTimeout(livex_update, 5000); // Retry after 5 seconds
		},
		success: () => {

			logMsg("livex_update", "", "Searching For Update");

			// Get Latest Version Number
			$.get({
				url: "https://raw.githubusercontent.com/batterX/LiveSmart-Home/master/version.txt",
				dataType: "text",
				cache: false,
				error: () => {
					removeLastMsg("livex_update");
					logMsg("livex_update", "mt-4 red", "No Internet Connection");
					setTimeout(livex_update, 5000);
				},
				success: (versionNum) => {

					removeLastMsg("livex_update");
					logMsg("livex_update", "", `Available Version: <b>${versionNum}</b>`);

					// Compare Versions
					if(softwareVersion != versionNum) {
						livex_update_newVersion = versionNum;
						// Download Update
						$.post("cmd/update.php");
						// Downloading Update...
						logMsg("livex_update", "mt-4", "Downloading Update. Please wait…");
						clearInterval(livex_update_interval);
						livex_update_interval = undefined;
						livex_update_interval = setInterval(livex_update_waitForError, 5000);
					} else {
						// Update Completed
						logMsg("livex_update", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
						finishStep("livex_update");
						check_warnings();
					}

				}
			});

		}
	});

}

function livex_update_waitForError() {
	$.get({
		url: "cmd/working.txt",
		cache: false,
		error: () => {
			// Rebooting...
			removeLastMsg("livex_update");
			logMsg("livex_update", "mt-4", "Rebooting. Please wait…");
			clearInterval(livex_update_interval);
			livex_update_interval = undefined;
			livex_update_interval = setInterval(livex_update_waitForSuccess, 5000);
		},
		success: (response) => {
			if(response) return;
			// Rebooting...
			removeLastMsg("livex_update");
			logMsg("livex_update", "mt-4", "Rebooting. Please wait…");
			clearInterval(livex_update_interval);
			livex_update_interval = undefined;
			livex_update_interval = setInterval(livex_update_waitForSuccess, 5000);
		}
	});
}

function livex_update_waitForSuccess() {
	$.get({
		url: "cmd/working.txt",
		cache: false,
		success: (response) => {
			if(!response) return;
			// Finishing Update...
			removeLastMsg("livex_update");
			logMsg("livex_update", "mt-4", "Finishing Update. Please wait…");
			clearInterval(livex_update_interval);
			livex_update_interval = undefined;
			setTimeout(() => {
				// Update Completed
				removeLastMsg("livex_update");
				logMsg("livex_update", "mt-4 green", "Update Completed");
				setTimeout(() => { window.location.reload(true); }, 5000);
			}, 60000);
		}
	});
}

function check_warnings() {
	getWarnings((json) => {
		if(json == null) { check_warnings(); return; }
		if(json.length == 0) {
			emeter_test();
		} else {
			var tempArr = json[0][1];
			if(tempArr.includes(16640)) return alert("WARNING ... AC Input Loss (W02 W04)");
			if(tempArr.includes(16642)) return alert("WARNING ... AC Input Phase Dislocation (W9)");
			if(tempArr.includes(17427)) return alert("WARNING ... Battery Under (W14)");
			if(tempArr.includes(17408)) return alert("WARNING ... Battery Open (W15)");
			if(tempArr.includes(17443)) return alert("WARNING ... Battery Low In Hybrid Mode (W16)");
			emeter_test();
		}
	});
}




















/*
    E.METER TEST
*/

function emeter_test() {
	enableStep("emeter_test");
	$("#emeter_test .step-start").on("click", () => {
		$("#emeter_test .step-info, #emeter_test .step-start").addClass("d-none");
		emeter_test_start();
	});
}

function emeter_test_start() {
	removeLastMsg("emeter_test");
	logMsg("emeter_test", "", "Testing E.Meter Connection. Please wait...")
	getCurrentStateUpdate((json) => {
		if(json == null) { emeter_test_start(); return; }
		if(!json.hasOwnProperty(2913) || !json[2913].hasOwnProperty(0)) {
			removeLastMsg("emeter_test");
			logMsg("emeter_test", "red", "E.Meter Connection Problem");
			setTimeout(() => { emeter_test_start(); }, 2500);
			return;
		}
		removeLastMsg("emeter_test");
		logMsg("emeter_test", "green", "E.Meter Test OK");
		logMsg("emeter_test", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
		finishStep("emeter_test");
		ups_mode_test();
	});
}




















/*
    UPS MODE TEST
*/

function ups_mode_test() {
	enableStep("ups_mode_test");
	$("#ups_mode_test .step-start").on("click", () => {
		$("#ups_mode_test .step-info, #ups_mode_test .step-start").addClass("d-none");
		ups_mode_test_1();
	});
}

function ups_mode_test_1() {
	removeLastMsg("ups_mode_test");
	logMsg("ups_mode_test", "", "Setting System Mode to UPS. Please wait... (±60 sec)");
	// [NEW] Set BatteryType to LiFePO (Not Tested Yet)
	$.get({ url: "api.php?set=command&type=24069&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Set SystemMode to UPS
	setTimeout(() => {
		$.get({ url: "api.php?set=command&type=20752&text1=0&text2=0", success: (response) => { console.log(response); } });
		// Wait 15 seconds, then check if SystemMode is UPS
		setTimeout(() => {
			getCurrentStateUpdate(() => {
				getSettings((json) => {
					if(json == null) { ups_mode_test_1(); return; }
					// Check SystemMode
					if(!json.hasOwnProperty("SystemMode")) { ups_mode_test_1(); return; }
					if(json["SystemMode"]["0"]["mode"] != "0") { ups_mode_test_1(); return; }
					removeLastMsg("ups_mode_test");
					logMsg("ups_mode_test", "green", "System Mode = UPS");
					logMsg("ups_mode_test", "", "");
					ups_mode_test_2();
				});
			});
		}, 15000);
	}, 5000);
}

function ups_mode_test_2() {
	removeLastMsg("ups_mode_test");
	logMsg("ups_mode_test", "", "Turning UPS Output ON. Please wait...");
	// Turn Output ON
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Check if Output ON
	getCurrentStateUpdate((json) => {
		if(json == null) { ups_mode_test_2(); return; }
		// Check UPS Output
		if(json[1297][1] < 20000) { ups_mode_test_2(); return; }
		if(json[1298][1] < 20000) { ups_mode_test_2(); return; }
		if(json[1299][1] < 20000) { ups_mode_test_2(); return; }
		removeLastMsg("ups_mode_test");
		logMsg("ups_mode_test", "green", "UPS Output = ON");
		logMsg("ups_mode_test", "", "");
		ups_mode_test_3();
	});
}

function ups_mode_test_3() {
	removeLastMsg("ups_mode_test");
	logMsg("ups_mode_test", "", "&nbsp");
	setTimeout(() => {
		removeLastMsg("ups_mode_test");
		logMsg("ups_mode_test", "", "Verifying. Please wait...");
		// Check Voltages & Powers
		getCurrentStateUpdate(() => {
			getCurrentStateUpdate(() => {
				getCurrentStateUpdate(() => {
					getCurrentStateUpdate((json) => {
						if(json == null) { ups_mode_test_3(); return; }
						// Check UPS Output Voltage
						if(json[1297][1] < 20000) { alert("UPS Output L1 Voltage < 200V\nPlease Turn-ON UPS Output"); ups_mode_test_3(); return; }
						if(json[1298][1] < 20000) { alert("UPS Output L2 Voltage < 200V\nPlease Turn-ON UPS Output"); ups_mode_test_3(); return; }
						if(json[1299][1] < 20000) { alert("UPS Output L3 Voltage < 200V\nPlease Turn-ON UPS Output"); ups_mode_test_3(); return; }
						// Check UPS Input Voltage
						if(json[273][1] < 20000) { alert("UPS Input L1 Voltage < 200V\nPlease Turn-ON UPS Input"); ups_mode_test_3(); return; }
						if(json[274][1] < 20000) { alert("UPS Input L2 Voltage < 200V\nPlease Turn-ON UPS Input"); ups_mode_test_3(); return; }
						if(json[275][1] < 20000) { alert("UPS Input L3 Voltage < 200V\nPlease Turn-ON UPS Input"); ups_mode_test_3(); return; }
						// Check E.Meter Voltage
						if(json[2833][0] < 20000) { alert("E.Meter L1 Voltage < 200V\nPlease Turn-ON Grid Input"); ups_mode_test_3(); return; }
						if(json[2834][0] < 20000) { alert("E.Meter L2 Voltage < 200V\nPlease Turn-ON Grid Input"); ups_mode_test_3(); return; }
						if(json[2835][0] < 20000) { alert("E.Meter L3 Voltage < 200V\nPlease Turn-ON Grid Input"); ups_mode_test_3(); return; }
						// Check UPS Output Power
						if(json[1377][1] < 300) { alert("UPS Output Power < 300W\nPlease Connect Larger Load"); ups_mode_test_3(); return; }
						if(json[1377][1] > 2500) { alert("UPS Output Power > 2500W\nPlease Connect Smaller Load"); ups_mode_test_3(); return; }
						// Check Unprotected Power
						if(json[2913][2] > 300) { showError("ups_mode_test", "Unprotected Power > 300W"); return; }
						ups_mode_test_4();
					});
				});
			});
		});
	}, 1000);
}

function ups_mode_test_4() {
	removeLastMsg("ups_mode_test");
	logMsg("ups_mode_test", "", "&nbsp");
	// Turn Output OFF
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=0", success: (response) => { console.log(response); } });
	// Wait 5 seconds, then check if working
	setTimeout(() => {
		removeLastMsg("ups_mode_test");
		logMsg("ups_mode_test", "", "Testing System UPS Mode. Please wait...");
		setTimeout(() => {
			getCurrentStateUpdate(() => {
				getCurrentStateUpdate(() => {
					getCurrentStateUpdate(() => {
						getCurrentStateUpdate((json) => {
							if(json == null) { ups_mode_test_4(); return; }
							// Check UPS Output Voltage
							if(json[1297][1] != 0) { alert("UPS Output L1 Voltage > 0V\nPlease Turn-OFF UPS Output"); ups_mode_test_4(); return; }
							if(json[1298][1] != 0) { alert("UPS Output L2 Voltage > 0V\nPlease Turn-OFF UPS Output"); ups_mode_test_4(); return; }
							if(json[1299][1] != 0) { alert("UPS Output L3 Voltage > 0V\nPlease Turn-OFF UPS Output"); ups_mode_test_4(); return; }
							// Check UPS Input Voltage
							if(json[273][1] < 20000) { showError("ups_mode_test", "UPS Input L1 Voltage < 200V"); return; }
							if(json[274][1] < 20000) { showError("ups_mode_test", "UPS Input L2 Voltage < 200V"); return; }
							if(json[275][1] < 20000) { showError("ups_mode_test", "UPS Input L3 Voltage < 200V"); return; }
							// Check E.Meter Voltage
							if(json[2833][0] < 20000) { showError("ups_mode_test", "E.Meter L1 Voltage < 200V"); return; }
							if(json[2834][0] < 20000) { showError("ups_mode_test", "E.Meter L2 Voltage < 200V"); return; }
							if(json[2835][0] < 20000) { showError("ups_mode_test", "E.Meter L3 Voltage < 200V"); return; }
							// Check UPS Output Power
							if(json[1377][1] > 0) { showError("ups_mode_test", "UPS Output Power > 0W"); return; }
							// Check Unprotected Power
							if(json[2913][2] < 300) { showError("ups_mode_test", "Unprotected Power < 300W"); return; }
							// TEST OK
							removeLastMsg("ups_mode_test");
							logMsg("ups_mode_test", "green", "Test = OK");
							logMsg("ups_mode_test", "", "");
							ups_mode_test_5();
						});
					});
				});
			});
		}, 5000);
	}, 1000);
}

function ups_mode_test_5() {
	removeLastMsg("ups_mode_test");
	logMsg("ups_mode_test", "", "Finishing Test. Please wait...");
	// Turn Output ON
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Check if Output ON
	getCurrentStateUpdate((json) => {
		if(json == null) { ups_mode_test_5(); return; }
		// Check UPS Output
		if(json[1297][1] < 20000) { ups_mode_test_5(); return; }
		if(json[1298][1] < 20000) { ups_mode_test_5(); return; }
		if(json[1299][1] < 20000) { ups_mode_test_5(); return; }
		removeLastMsg("ups_mode_test");
		logMsg("ups_mode_test", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
		finishStep("ups_mode_test");
		gpio_test();
	});
}




















/*
    GPIO TEST
*/

function gpio_test() {
	enableStep("gpio_test");
	// Attention! Output 4 is inverted!
	$("#gpio_test .step-start, #gpio_test .step-content").on("click", () => {
		$("#gpio_test .step-info, #gpio_test .step-start").addClass("d-none");
		$("#gpio_test .step-content").removeClass("d-none");
		gpio_test_start();
	});
}

function gpio_test_start() {
	// Turn-Off Outputs
	$.get({ url: "api.php?set=command&type=20737&text1=1&text2=0", success: (response) => { console.log(response); } });
	$.get({ url: "api.php?set=command&type=20737&text1=2&text2=0", success: (response) => { console.log(response); } });
	$.get({ url: "api.php?set=command&type=20737&text1=3&text2=0", success: (response) => { console.log(response); } });
	$.get({ url: "api.php?set=command&type=20737&text1=4&text2=0", success: (response) => { console.log(response); } });
	// Check inputs & outputs
	getCurrentStateUpdate((json) => {
		if(json == null) { gpio_test_start(); return; }
		// Check Outputs (Must be forced-off)
		if(json[2337][1] != 10) { gpio_test_start(); return; }
		if(json[2337][2] != 10) { gpio_test_start(); return; }
		if(json[2337][3] != 10) { gpio_test_start(); return; }
		if(json[2337][4] != 10) { gpio_test_start(); return; }
		// Check Inputs (1/2/3 Off, 4 On)
		if(json[2321][1] !=  0) { alert("Input 1 is ON, should be OFF\nPlease verify the GPIO connectors"); gpio_test_start(); return; }
		if(json[2321][2] !=  0) { alert("Input 2 is ON, should be OFF\nPlease verify the GPIO connectors"); gpio_test_start(); return; }
		if(json[2321][3] !=  0) { alert("Input 3 is ON, should be OFF\nPlease verify the GPIO connectors"); gpio_test_start(); return; }
		if(json[2321][4] !=  1) { alert("Input 4 is OFF, should be ON\nPlease verify the GPIO connectors"); gpio_test_start(); return; }
		// Begin Test
		gpio_test_1();
	});
}

function gpio_test_1() {
	$.get({
		url: "api.php?set=command&type=20737&text1=1&text2=1",
		error: () => { alert("API Not Responding"); gpio_test_1(); return; },
		success: (response) => {
			console.log(response);
			$("#gpio_test .out1").addClass("red");
			$("#gpio_test .in1").addClass("red");
			getCurrentStateUpdate((json) => {
				if(json == null) { gpio_test_1(); return; }
				if(json[2337][1] != 11) { gpio_test_1(); return; }
				$("#gpio_test .out1").addClass("green");
				if(json[2321][1] != 1) { alert("Input 1 is OFF, should be ON\nPlease verify the GPIO connectors"); gpio_test_1(); return; }
				$("#gpio_test .in1").addClass("green");
				$.get({ url: "api.php?set=command&type=20737&text1=1&text2=0", success: (response) => { console.log(response); } });
				gpio_test_2();
			});
		}
	});
}

function gpio_test_2() {
	$.get({
		url: "api.php?set=command&type=20737&text1=2&text2=1",
		error: () => { alert("API Not Responding"); gpio_test_2(); return; },
		success: (response) => {
			console.log(response);
			$("#gpio_test .out2").addClass("red");
			$("#gpio_test .in2").addClass("red");
			getCurrentStateUpdate((json) => {
				if(json == null) { gpio_test_2(); return; }
				if(json[2337][2] != 11) { gpio_test_2(); return; }
				$("#gpio_test .out2").addClass("green");
				if(json[2321][2] != 1) { alert("Input 2 is OFF, should be ON\nPlease verify the GPIO connectors"); gpio_test_2(); return; }
				$("#gpio_test .in2").addClass("green");
				$.get({ url: "api.php?set=command&type=20737&text1=2&text2=0", success: (response) => { console.log(response); } });
				gpio_test_3();
			});
		}
	});
}

function gpio_test_3() {
	$.get({
		url: "api.php?set=command&type=20737&text1=3&text2=1",
		error: () => { alert("API Not Responding"); gpio_test_3(); return; },
		success: (response) => {
			console.log(response);
			$("#gpio_test .out3").addClass("red");
			$("#gpio_test .in3").addClass("red");
			getCurrentStateUpdate((json) => {
				if(json == null) { gpio_test_3(); return; }
				if(json[2337][3] != 11) { gpio_test_3(); return; }
				$("#gpio_test .out3").addClass("green");
				if(json[2321][3] != 1) { alert("Input 3 is OFF, should be ON\nPlease verify the GPIO connectors"); gpio_test_3(); return; }
				$("#gpio_test .in3").addClass("green");
				$.get({ url: "api.php?set=command&type=20737&text1=3&text2=0", success: (response) => { console.log(response); } });
				if(json[2321][4] != 1) { alert("Input 4 is OFF, should be ON\nPlease verify the GPIO connectors"); gpio_test_3(); return; } // Check if inverted
				gpio_test_4();
			});
		}
	});
}

function gpio_test_4() {
	$.get({
		url: "api.php?set=command&type=20737&text1=4&text2=1",
		error: () => { alert("API Not Responding"); gpio_test_4(); return; },
		success: (response) => {
			console.log(response);
			$("#gpio_test .out4").addClass("red");
			$("#gpio_test .in4").addClass("red");
			getCurrentStateUpdate((json) => {
				if(json == null) { gpio_test_4(); return; }
				if(json[2337][4] != 11) { gpio_test_4(); return; }
				$("#gpio_test .out4").addClass("green");
				if(json[2321][4] != 0) { alert("Input 4 is ON, should be OFF\nPlease verify the GPIO connectors"); gpio_test_4(); return; }
				$("#gpio_test .in4").addClass("green");
				$.get({ url: "api.php?set=command&type=20737&text1=4&text2=0", success: (response) => { console.log(response); } });
				// Test Completed
				logMsg("gpio_test", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
				finishStep("gpio_test");
				backup_mode_test();
			});
		}
	});
}




















/*
    BACKUP MODE TEST
*/

function backup_mode_test() {
	enableStep("backup_mode_test");
	$("#backup_mode_test .step-start-1").on("click", () => {
		$("#backup_mode_test .step-info-1, #backup_mode_test .step-start-1").addClass("d-none");
		backup_mode_test_start();
	});
}

function backup_mode_test_start() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Verifying. Please wait...");
	// Turn-On Output 3
	$.get({ url: "api.php?set=command&type=20737&text1=3&text2=1", success: (response) => { console.log(response); } });
	// Check if Output 3 is On
	getCurrentStateUpdate((json) => {
		if(json == null) { backup_mode_test_start(); return; }
		// Check Output 3 (Must be forced-on)
		if(json[2337][3] != 11) { backup_mode_test_start(); return; }
		// Check Input 3 (Must be On)
		if(json[2321][3] != 0) { alert("The GPIO connectors are still connected\nPlease disconnect all GPIO connectors"); backup_mode_test_start(); return; }
		// Turn-Off Output 3
		$.get({ url: "api.php?set=command&type=20737&text1=3&text2=0", success: (response) => { console.log(response); } });
		// Continue Test
		backup_mode_test_2();
	});
}

function backup_mode_test_2() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Turning UPS Output OFF. Please wait...");
	// Turn Output OFF
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=0", success: (response) => { console.log(response); } });
	// Check if Output OFF
	getCurrentStateUpdate((json) => {
		if(json == null) { backup_mode_test_2(); return; }
		// Check UPS Output
		if(json[1297][1] != 0) { backup_mode_test_2(); return; }
		if(json[1298][1] != 0) { backup_mode_test_2(); return; }
		if(json[1299][1] != 0) { backup_mode_test_2(); return; }
		backup_mode_test_3();
	});
}

function backup_mode_test_3() {
	removeLastMsg("backup_mode_test");
	$("#backup_mode_test .step-info-2, #backup_mode_test .step-start-2").removeClass("d-none");
	$("#backup_mode_test .step-start-2").on("click", () => {
		$("#backup_mode_test .step-info-2, #backup_mode_test .step-start-2").addClass("d-none");
		backup_mode_test_4();
	});
}

function backup_mode_test_4() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Turning UPS Output ON. Please wait...");
	// Turn Output ON
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Check if Output ON
	getCurrentStateUpdate((json) => {
		if(json == null) { backup_mode_test_4(); return; }
		// Check UPS Output
		if(json[1297][1] < 20000) { backup_mode_test_4(); return; }
		if(json[1298][1] < 20000) { backup_mode_test_4(); return; }
		if(json[1299][1] < 20000) { backup_mode_test_4(); return; }
		removeLastMsg("backup_mode_test");
		logMsg("backup_mode_test", "green", "UPS Output = ON");
		logMsg("backup_mode_test", "", "");
		backup_mode_test_5();
	});
}

function backup_mode_test_5() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Setting System Mode to BACKUP. Please wait... (±60 sec)");
	// Set SystemMode to BACKUP
	$.get({ url: "api.php?set=command&type=20752&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Wait 15 seconds, then check if SystemMode is BACKUP
	setTimeout(() => {
		getCurrentStateUpdate(() => {
			getSettings((json) => {
				if(json == null) { backup_mode_test_5(); return; }
				// Check SystemMode
				if(!json.hasOwnProperty("SystemMode")) { backup_mode_test_5(); return; }
				if(json["SystemMode"]["0"]["mode"] != "1") { backup_mode_test_5(); return; }
				removeLastMsg("backup_mode_test");
				logMsg("backup_mode_test", "green", "System Mode = BACKUP");
				logMsg("backup_mode_test", "", "");
				backup_mode_test_6();
			});
		});
	}, 15000);
}

function backup_mode_test_6() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "&nbsp");
	setTimeout(() => {
		removeLastMsg("backup_mode_test");
		logMsg("backup_mode_test", "", "Verifying. Please wait...");
		getCurrentStateUpdate(() => {
			getCurrentStateUpdate(() => {
				getCurrentStateUpdate(() => {
					getCurrentStateUpdate((json) => {
						if(json == null) { backup_mode_test_6(); return; }
						// Check UPS Output Voltage
						if(json[1297][1] < 20000) { alert("UPS Output L1 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_6(); return; }
						if(json[1298][1] < 20000) { alert("UPS Output L2 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_6(); return; }
						if(json[1299][1] < 20000) { alert("UPS Output L3 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_6(); return; }
						// Check UPS Input Voltage
						if(json[273][1] < 20000) { showError("backup_mode_test", "UPS Input L1 Voltage < 200V"); return; }
						if(json[274][1] < 20000) { showError("backup_mode_test", "UPS Input L2 Voltage < 200V"); return; }
						if(json[275][1] < 20000) { showError("backup_mode_test", "UPS Input L3 Voltage < 200V"); return; }
						// Check E.Meter Voltage
						if(json[2833][0] < 20000) { showError("backup_mode_test", "E.Meter L1 Voltage < 200V"); return; }
						if(json[2834][0] < 20000) { showError("backup_mode_test", "E.Meter L2 Voltage < 200V"); return; }
						if(json[2835][0] < 20000) { showError("backup_mode_test", "E.Meter L3 Voltage < 200V"); return; }
						// Check UPS Output Power
						if(json[1377][1] > 100) { showError("backup_mode_test", "UPS Output Power > 100W"); return; }
						// Check Unprotected Power
						if(json[2913][2] < 300) { showError("backup_mode_test", "Unprotected Power < 300W"); return; }
						// Continue
						backup_mode_test_7();
					});
				});
			});
		});
	}, 1000);
}

function backup_mode_test_7() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "mt-4", "<b>Please Turn Grid Input OFF</b>");
	// Wait Until Grid Input OFF
	getCurrentStateUpdate((json) => {
		if(json == null) { backup_mode_test_7(); return; }
		// Check UPS Input
		if(json[273][1] != 0) { backup_mode_test_7(); return; }
		if(json[274][1] != 0) { backup_mode_test_7(); return; }
		if(json[275][1] != 0) { backup_mode_test_7(); return; }
		removeLastMsg("backup_mode_test");
		logMsg("backup_mode_test", "green", "Grid Input = OFF");
		logMsg("backup_mode_test", "", "");
		backup_mode_test_8();
	});
}

function backup_mode_test_8() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Testing. Please wait...");
	// Wait 5 seconds, then test voltage/power
	setTimeout(() => {
		getCurrentStateUpdate(() => {
			getCurrentStateUpdate(() => {
				getCurrentStateUpdate(() => {
					getCurrentStateUpdate((json) => {
						if(json == null) { backup_mode_test_8(); return; }
						// Check UPS Output Voltage
						if(json[1297][1] < 20000) { showError("backup_mode_test", "UPS Output L1 Voltage < 200V"); return; }
						if(json[1298][1] < 20000) { showError("backup_mode_test", "UPS Output L2 Voltage < 200V"); return; }
						if(json[1299][1] < 20000) { showError("backup_mode_test", "UPS Output L3 Voltage < 200V"); return; }
						// Check UPS Output Power
						if(json[1377][1] < 300) { showError("backup_mode_test", "UPS Output Power < 300W"); return; }
						// Continue
						removeLastMsg("backup_mode_test");
						logMsg("backup_mode_test", "green", "Test = OK");
						logMsg("backup_mode_test", "", "");
						backup_mode_test_9();
					});
				});
			});
		});
	}, 5000);
}

function backup_mode_test_9() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "mt-4", "<b>Please Turn Grid Input ON</b>");
	// Wait Until Grid Input ON
	getCurrentState((json) => {
		if(json == null) { backup_mode_test_9(); return; }
		// Check UPS Input
		if(json[273][1] < 20000) { backup_mode_test_9(); return; }
		if(json[274][1] < 20000) { backup_mode_test_9(); return; }
		if(json[275][1] < 20000) { backup_mode_test_9(); return; }
		removeLastMsg("backup_mode_test");
		logMsg("backup_mode_test", "green", "Grid Input = ON");
		logMsg("backup_mode_test", "", "");
		backup_mode_test_10();
	});
}

function backup_mode_test_10() {
	removeLastMsg("backup_mode_test");
	logMsg("backup_mode_test", "", "Testing. Please wait...");
	// Wait 5 seconds, then test voltage/power
	setTimeout(() => {
		getCurrentStateUpdate(() => {
			getCurrentStateUpdate(() => {
				getCurrentStateUpdate(() => {
					getCurrentStateUpdate((json) => {
						if(json == null) { backup_mode_test_10(); return; }
						// Check UPS Output Voltage
						if(json[1297][1] < 20000) { alert("UPS Output L1 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_10(); return; }
						if(json[1298][1] < 20000) { alert("UPS Output L2 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_10(); return; }
						if(json[1299][1] < 20000) { alert("UPS Output L3 Voltage < 200V\nPlease Turn-ON UPS Output"); backup_mode_test_10(); return; }
						// Check UPS Output Power
						if(json[1377][1] > 100) { showError("backup_mode_test", "UPS Output Power > 100W"); return; }
						// Check Unprotected Power
						if(json[2913][2] < 300) { showError("backup_mode_test", "Unprotected Power < 300W"); return; }
						// Test Completed
						removeLastMsg("backup_mode_test");
						logMsg("backup_mode_test", "green", "Test = OK");
						logMsg("backup_mode_test", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
						finishStep("backup_mode_test");
						setTimeout(() => { connect_default_mode(); }, 2500);
					});
				});
			});
		});
	}, 5000);
}




















/*
    CONNECT DEFAULT MODE
*/

function connect_default_mode() {
	enableStep("connect_default_mode");
	removeLastMsg("connect_default_mode");
	logMsg("connect_default_mode", "", "Turning UPS Output OFF. Please wait...");
	// Turn Output OFF
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=0", success: (response) => { console.log(response); } });
	// Check if Output OFF
	getCurrentStateUpdate((json) => {
		if(json == null) { connect_default_mode(); return; }
		// Check UPS Output
		if(json[1297][1] != 0) { connect_default_mode(); return; }
		if(json[1298][1] != 0) { connect_default_mode(); return; }
		if(json[1299][1] != 0) { connect_default_mode(); return; }
		connect_default_mode_2();
	});
}

function connect_default_mode_2() {
	removeLastMsg("connect_default_mode");
	$("#connect_default_mode .step-info, #connect_default_mode .step-start").removeClass("d-none");
	$("#connect_default_mode .step-start").on("click", () => {
		$("#connect_default_mode .step-info, #connect_default_mode .step-start").addClass("d-none");
		connect_default_mode_3();
	});
}

function connect_default_mode_3() {
	removeLastMsg("connect_default_mode");
	logMsg("connect_default_mode", "", "Turning UPS Output ON. Please wait...");
	// Turn Output ON
	$.get({ url: "api.php?set=command&type=24224&text1=0&text2=1", success: (response) => { console.log(response); } });
	// Check if Output ON
	getCurrentStateUpdate((json) => {
		if(json == null) { connect_default_mode_3(); return; }
		// Check UPS Output
		if(json[1297][1] < 20000) { connect_default_mode_3(); return; }
		if(json[1298][1] < 20000) { connect_default_mode_3(); return; }
		if(json[1299][1] < 20000) { connect_default_mode_3(); return; }
		removeLastMsg("connect_default_mode");
		logMsg("connect_default_mode", "green", "UPS Output = ON");
		logMsg("connect_default_mode", "", "");
		connect_default_mode_4();
	});
}

function connect_default_mode_4() {
	removeLastMsg("connect_default_mode");
	logMsg("connect_default_mode", "", "Setting System Mode to UPS. Please wait... (±60 sec)");
	// Set SystemMode to UPS
	$.get({ url: "api.php?set=command&type=20752&text1=0&text2=0", success: (response) => { console.log(response); } });
	// Wait 15 seconds, then check if SystemMode is UPS
	setTimeout(() => {
		getCurrentStateUpdate(() => {
			getSettings((json) => {
				if(json == null) { connect_default_mode_4(); return; }
				// Check SystemMode
				if(!json.hasOwnProperty("SystemMode")) { connect_default_mode_4(); return; }
				if(json["SystemMode"]["0"]["mode"] != "0") { connect_default_mode_4(); return; }
				removeLastMsg("connect_default_mode");
				logMsg("connect_default_mode", "green", "System Mode = UPS");
				logMsg("connect_default_mode", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
				finishStep("connect_default_mode");
				generate_report();
			});
		});
	}, 15000);
}




















/*
    GENERATE REPORT
*/

function generate_report() {
	enableStep("generate_report");
	$.post({
		url: "https://api.batterx.app/v2/_clixtest.php",
		data: {
			action: "get_livex_serialnumber",
			apikey: $("#report_apikey").text()
		},
		error: () => {
			setTimeout(() => {
				generate_report();
			}, 10000);
		},
		success: (response) => {
			$("#report_sn").text(response);
			$("#report").removeClass("d-none");
		}
	});
}

$("#report_send").on("click", () => {
	if($("#report_ewsn").val() == "" && !confirm("Continue without EW S/N?")) return;
	$("#report_ewsn").prop("disabled", true);
	$("#report_send").prop("disabled", true);
	$("#report_note").prop("disabled", true);
	$.post({
		url: "https://api.batterx.app/v2/_clixtest.php",
		data: {
			action                : "register_livex",
			apikey                : $("#report_apikey  ").text(),
			serialnumber          : $("#report_sn      ").text(),
			serialnumber_producer : $("#report_ewsn    ").val (),
			software_version      : $("#report_software").text(),
			date_tested           : $("#report_date    ").text(),
			report                : getReport()
		},
		error: () => { alert("CLOUD ERROR - TRY AGAIN"); },
		success: (response) => {
			console.log(response);
			if(response != "1") {
				$("#report_send").prop("disabled", false);
				alert(response);
			} else {
				$("#report_download").trigger("click");
			}
			$("#report_download").prop("disabled", false);
			finish_test();
		}
	});
});

$("#report_download").on("click", () => {
	download(`${$("#report_sn").text()}.txt`, getReport());
});




















/*
    FINISH TEST
*/

function finish_test() {
	enableStep("finish_test");
}

$("#finish_cleardb").on("click", () => {
	$.get({
        url: "api.php?cleardb=1",
        error: () => { alert("API ERROR - TRY AGAIN"); },
        success: (response) => {
			if(response == "1")
				$("#finish_shutdown").prop("disabled", false);
			else
				alert(response);
		}
    });
});

$("#finish_shutdown").on("click", () => {
	if(!confirm("Are you sure you want to SHUTDOWN the liveX?")) return false;
	$.get({
		url: "cmd/shutdown.php",
		complete: function(res) {
			setTimeout(function() {
				alert("SHUTDOWN SUCCESS");
				location.reload(1);
			}, 5000);
		}
	});
	$("#finish_cleardb").attr("disabled", true);
	$("#finish_shutdown").attr("disabled", true);
});




















/*
	BEGIN TEST
*/

livex_update();
