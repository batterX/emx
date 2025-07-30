$progress.trigger("step", 8);





$("#checkboxAccept1, #checkboxAccept2, #checkboxAccept3").on("click", () => {
	if($("#checkboxAccept1").is(":checked") && $("#checkboxAccept2").is(":checked") && $("#checkboxAccept3").is(":checked"))
		$("#btnFinish").css("visibility", "visible");
	else
		$("#btnFinish").css("visibility", "hidden");
});





function getImageDimensions(file) {
	return new Promise (function (resolved, rejected) {
		var i = new Image();
		i.onload = function() { resolved({ w: i.width, h: i.height }) };
		i.src = file;
	});
}





$("#btnFinishInstallation").on("click", () => {

	$("#btnFinishInstallation").attr("disabled", "disabled");

	if(dataObj.hasOwnProperty("system_serial") && dataObj["system_serial"] == "NEW") {
		generateSystemSerial((sn) => {
			if(!sn) return alert("E001. Please refresh the page! (Bad response while generating new system serialnumber from cloud)");
			$("#systemSerial").html(sn);
			dataObj.system_serial = sn;
			finishInstallation();
		});
	} else {
		finishInstallation();
	}

});





function generateSystemSerial(callback) {

	$.post({
		url: "https://api.batterx.app/v2/install.php",
		data: {
			action: "generate_system_serial",
			begin: "IE01" + new Date().getFullYear().toString().substr(-2)
		},
		error: () => { alert("E002. Please refresh the page! (Error while generating new system serialnumber from cloud)"); },
		success: (response) => {
			// Show Not Registered
			callback(response);
		}
	});

}





function finishInstallation() {

	$("#btnFinishInstallation").attr("disabled", "disabled");

	var data = new FormData();

	data.append("action", "finish_installation");
	data.append("has_device", "1");

	data.append("auth_code", bx_auth_code);

	data.append("lang", ["de","fr","cs","es"].includes($("#lang").val()) ? $("#lang").val() : "en");

	if(dataObj.hasOwnProperty("installation_date"     ) && dataObj["installation_date"     ] != "") data.append("installation_date"     , dataObj["installation_date"     ]);
	
	if(dataObj.hasOwnProperty("installer_og_company"  ) && dataObj["installer_og_company"  ] != "") data.append("installer_og_company"  , dataObj["installer_og_company"  ]);
	if(dataObj.hasOwnProperty("installer_og_country"  ) && dataObj["installer_og_country"  ] != "") data.append("installer_og_country"  , dataObj["installer_og_country"  ]);
	if(dataObj.hasOwnProperty("installer_og_email"    ) && dataObj["installer_og_email"    ] != "") data.append("installer_og_email"    , dataObj["installer_og_email"    ]);
	if(dataObj.hasOwnProperty("installer_og_firstname") && dataObj["installer_og_firstname"] != "") data.append("installer_og_firstname", dataObj["installer_og_firstname"]);
	if(dataObj.hasOwnProperty("installer_og_gender"   ) && dataObj["installer_og_gender"   ] != "") data.append("installer_og_gender"   , dataObj["installer_og_gender"   ]);
	if(dataObj.hasOwnProperty("installer_og_lastname" ) && dataObj["installer_og_lastname" ] != "") data.append("installer_og_lastname" , dataObj["installer_og_lastname" ]);
	if(dataObj.hasOwnProperty("installer_og_telephone") && dataObj["installer_og_telephone"] != "") data.append("installer_og_telephone", dataObj["installer_og_telephone"]);

	if(dataObj.hasOwnProperty("installer_gender"      ) && dataObj["installer_gender"      ] != "") data.append("installer_gender"      , dataObj["installer_gender"      ]);
	if(dataObj.hasOwnProperty("installer_firstname"   ) && dataObj["installer_firstname"   ] != "") data.append("installer_firstname"   , dataObj["installer_firstname"   ]);
	if(dataObj.hasOwnProperty("installer_lastname"    ) && dataObj["installer_lastname"    ] != "") data.append("installer_lastname"    , dataObj["installer_lastname"    ]);
	if(dataObj.hasOwnProperty("installer_company"     ) && dataObj["installer_company"     ] != "") data.append("installer_company"     , dataObj["installer_company"     ]);
	if(dataObj.hasOwnProperty("installer_telephone"   ) && dataObj["installer_telephone"   ] != "") data.append("installer_telephone"   , dataObj["installer_telephone"   ]);
	if(dataObj.hasOwnProperty("installer_email"       ) && dataObj["installer_email"       ] != "") data.append("installer_email"       , dataObj["installer_email"       ]);
	if(dataObj.hasOwnProperty("installer_password"    ) && dataObj["installer_password"    ] != "") data.append("installer_password"    , dataObj["installer_password"    ]);
	if(dataObj.hasOwnProperty("installer_on_site"     ) && dataObj["installer_on_site"     ] != "") data.append("installer_on_site"     , dataObj["installer_on_site"     ]);

	if(dataObj.hasOwnProperty("customer_gender"       ) && dataObj["customer_gender"       ] != "") data.append("customer_gender"       , dataObj["customer_gender"       ]);
	if(dataObj.hasOwnProperty("customer_firstname"    ) && dataObj["customer_firstname"    ] != "") data.append("customer_firstname"    , dataObj["customer_firstname"    ]);
	if(dataObj.hasOwnProperty("customer_lastname"     ) && dataObj["customer_lastname"     ] != "") data.append("customer_lastname"     , dataObj["customer_lastname"     ]);
	if(dataObj.hasOwnProperty("customer_email"        ) && dataObj["customer_email"        ] != "") data.append("customer_email"        , dataObj["customer_email"        ]);
	if(dataObj.hasOwnProperty("customer_telephone"    ) && dataObj["customer_telephone"    ] != "") data.append("customer_telephone"    , dataObj["customer_telephone"    ]);
	if(dataObj.hasOwnProperty("customer_company"      ) && dataObj["customer_company"      ] != "") data.append("customer_company"      , dataObj["customer_company"      ]);
	if(dataObj.hasOwnProperty("customer_country"      ) && dataObj["customer_country"      ] != "") data.append("customer_country"      , dataObj["customer_country"      ]);
	if(dataObj.hasOwnProperty("customer_city"         ) && dataObj["customer_city"         ] != "") data.append("customer_city"         , dataObj["customer_city"         ]);
	if(dataObj.hasOwnProperty("customer_zipcode"      ) && dataObj["customer_zipcode"      ] != "") data.append("customer_zipcode"      , dataObj["customer_zipcode"      ]);
	if(dataObj.hasOwnProperty("customer_address"      ) && dataObj["customer_address"      ] != "") data.append("customer_address"      , dataObj["customer_address"      ]);

	if(dataObj.hasOwnProperty("installation_country"  ) && dataObj["installation_country"  ] != "") data.append("installation_country"  , dataObj["installation_country"  ]);
	if(dataObj.hasOwnProperty("installation_city"     ) && dataObj["installation_city"     ] != "") data.append("installation_city"     , dataObj["installation_city"     ]);
	if(dataObj.hasOwnProperty("installation_zipcode"  ) && dataObj["installation_zipcode"  ] != "") data.append("installation_zipcode"  , dataObj["installation_zipcode"  ]);
	if(dataObj.hasOwnProperty("installation_address"  ) && dataObj["installation_address"  ] != "") data.append("installation_address"  , dataObj["installation_address"  ]);

	if(dataObj.hasOwnProperty("system_model"          ) && dataObj["system_model"          ] != "") data.append("system_model"          , dataObj["system_model"          ]); else data.append("system_model", "batterX");
	if(dataObj.hasOwnProperty("system_serial"         ) && dataObj["system_serial"         ] != "") data.append("system_serial"         , dataObj["system_serial"         ]);

	if(dataObj.hasOwnProperty("device_serial"         ) && dataObj["device_serial"         ] != "") data.append("device_serial"         , dataObj["device_serial"         ]);
	if(dataObj.hasOwnProperty("device_partnumber"     ) && dataObj["device_partnumber"     ] != "") data.append("device_partnumber"     , dataObj["device_partnumber"     ]);
	if(dataObj.hasOwnProperty("solar_wattpeak"        ) && dataObj["solar_wattpeak"        ] != "") data.append("solar_wattpeak"        , dataObj["solar_wattpeak"        ]);
	if(dataObj.hasOwnProperty("solar_feedinlimitation") && dataObj["solar_feedinlimitation"] != "") data.append("solar_feedinlimitation", dataObj["solar_feedinlimitation"]);
	if(dataObj.hasOwnProperty("solar_info"            )                                           ) data.append("solar_info"            , dataObj["solar_info"            ]);
	if(dataObj.hasOwnProperty("note"                  )                                           ) data.append("note"                  , dataObj["note"                  ]);

	if(dataObj.hasOwnProperty("box_apikey"            ) && dataObj["box_apikey"            ] != "") data.append("box_apikey"            , dataObj["box_apikey"            ]);
	if(dataObj.hasOwnProperty("box_serial"            ) && dataObj["box_serial"            ] != "") data.append("box_serial"            , dataObj["box_serial"            ]);
	if(dataObj.hasOwnProperty("box_partnumber"        ) && dataObj["box_partnumber"        ] != "") data.append("box_partnumber"        , dataObj["box_partnumber"        ]);
	if(dataObj.hasOwnProperty("software_version"      ) && dataObj["software_version"      ] != "") data.append("software_version"      , dataObj["software_version"      ]);

	if(dataObj.hasOwnProperty("battery_type")) {
		if(dataObj["battery_type"] == "lifepo") {
			data.append("has_battery"    , "1"     );
			data.append("battery_type"   , "lifepo");
			data.append("battery_voltage", "51"    );
			if(dataObj.hasOwnProperty("battery_serialnumbers") && dataObj["battery_serialnumbers"] != "") data.append("battery_serialnumbers", dataObj["battery_serialnumbers"]);
			if(dataObj.hasOwnProperty("battery_bms"          ) && dataObj["battery_bms"          ] != "") data.append("battery_bms"          , dataObj["battery_bms"          ]);
		} else {
			data.append("has_battery", "0");
		}
	} else {
		data.append("has_battery", "0");
	}

	$("#confirmLoadCorrect").removeClass("d-none");

	html2canvas(document.querySelector("#summary"), {
		windowWidth: 1200,
		scale: 2
	}).then(async canvas => {

		var img = canvas.toDataURL("image/jpeg");
		var dimensions = await getImageDimensions(img);

		var ratio = dimensions.w / dimensions.h;
		var w = 190, h = 190 / ratio;
		if(ratio < 0.68) { h = 277; w = 277 * ratio; }

		var pdf = new jsPDF("portrait", "mm", "a4");
		pdf.addImage(img, "JPEG", (210 - w) / 2, (297 - h) / 2, w, h); // img, type, x, y, width, height
		var pdfBlob = pdf.output("blob");

		// HIDE FIELD AFTER CREATION

		$("#confirmLoadCorrect").addClass("d-none");

		// USE BLOB TO SAVE PDF-FILE TO CLOUD

		data.append("pdf_file", pdfBlob, lang.summary.installation_summary);

		$.post({
			url: "https://api.batterx.app/v2/install.php",
			data: data,
			processData: false,
			contentType: false,
			cache: false,
			error: () => { alert("E003. Please refresh the page! (Error while registering installation data to cloud)"); },
			success: (response) => {
				if(response == "1") {
					showSuccess();
					$("#confirmLoadCorrect").removeClass("d-none");
				} else {
					$("#btnFinishInstallation").removeAttr("disabled");
					alert("Error: " + response);
				}
			}
		});

	});

}





function showSuccess() {
	$("#summary   ").hide();
	$("#confirm   ").hide();
	$("#btnFinish ").hide();
	$("#successBox").show();
	$("body").addClass("show-success");
}





$("#btnDownload").on("click", function() {
	html2canvas(document.querySelector("#summary"), {
		windowWidth: 1200,
		scale: 2,
		onclone: (clonedDoc) => { clonedDoc.getElementById("summary").style.display = "block"; }
	}).then(async canvas => {
		var img = canvas.toDataURL("image/jpeg");
		var dimensions = await getImageDimensions(img);
		var ratio = dimensions.w / dimensions.h;
		var w = 190, h = 190 / ratio;
		if(ratio < 0.68) { h = 277; w = 277 * ratio; }
		var pdf = new jsPDF("portrait", "mm", "a4");
		pdf.addImage(img, "JPEG", (210 - w) / 2, (297 - h) / 2, w, h); // img, type, x, y, width, height
		pdf.save(lang.summary.installation_summary + ".pdf");
	});
});





var checkRebootInterval;

$("#btnReboot").on("click", () => {
	$.post({
		url: "cmd/reboot.php",
		success: (response) => { console.log(response); },
		error  : (response) => { console.log(response); }
	});
	setTimeout(() => { checkRebootInterval = setInterval(checkReboot_waitForError, 5000); }, 2500);
	// Disable Button
	$("#btnReboot").attr("disabled", "disabled");
	// Show Loading
	$(".notif").removeClass("loading error success").addClass("loading");
});

function checkReboot_waitForError() {
	$.get({
		url: "cmd/working.txt",
		cache: false,
		timeout: 2500,
		success: (response) => {
			if(!response) {
				clearInterval(checkRebootInterval);
				checkRebootInterval = undefined;
				checkRebootInterval = setInterval(checkReboot_waitForSuccess, 5000);
			}
		},
		error: () => {
			clearInterval(checkRebootInterval);
			checkRebootInterval = undefined;
			checkRebootInterval = setInterval(checkReboot_waitForSuccess, 5000);
		}
	});
}

function checkReboot_waitForSuccess() {
	$.get({
		url: "cmd/working.txt",
		cache: false,
		timeout: 2500,
		success: (response) => {
			if(response) {
				clearInterval(checkRebootInterval);
				checkRebootInterval = undefined;
				// Show Success
				$(".notif").removeClass("loading error success").addClass("success");
			}
		}
	});
}










var bx_auth_code = "";

setTimeout(() => { $("#modalSkipSetup input").val(""); }, 2500);
$("#modalSkipSetup input").on("keypress", (e) => {
    if(e.which == 13) {
        bx_auth_code = $("#modalSkipSetup input").val();
		$("#modalSkipSetup").modal("hide");
    }
});
