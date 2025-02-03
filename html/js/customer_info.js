$progress.trigger("step", 3);





function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

$("#sameAddress").on("change", function() {
	if($(this).is(":checked")) {
		$("#installationAddress    ").hide();
		$("#installationAddressCopy").show();
	} else {
		$("#installationAddress    ").show();
		$("#installationAddressCopy").hide();
	}
});

var hasAccessToUser = true;





$.post({
	url: "https://api.batterx.app/v2/install.php",
	data: {
		action: "get_installation_info",
		apikey: apikey
	},
	error: () => { alert("E001. Please refresh the page! (Error while getting installation info from cloud)"); },
	success: (json) => {

		console.log(json);

		if(!json) return;

		// Set Customer Information
		if(json.hasOwnProperty("customer")) {
			if( json.customer.hasOwnProperty("gender"   ) &&
				json.customer.hasOwnProperty("firstname") &&
				json.customer.hasOwnProperty("lastname" ) &&
				json.customer.hasOwnProperty("company"  ) &&
				json.customer.hasOwnProperty("email"    ) &&
				json.customer.hasOwnProperty("telephone") &&
				json.customer.hasOwnProperty("country"  ) &&
				json.customer.hasOwnProperty("city"     ) &&
				json.customer.hasOwnProperty("zipcode"  ) &&
				json.customer.hasOwnProperty("address"  ) &&
				json.customer.hasOwnProperty("verified" )
			) {
				// Set Input Values
				$("#customerInformation .email           ").val(json.customer.email    ).attr("disabled", json.customer.verified == "1");
				$("#customerInformation .gender          ").val(json.customer.gender   );
				$("#customerInformation .first-name      ").val(json.customer.firstname);
				$("#customerInformation .last-name       ").val(json.customer.lastname );
				$("#customerInformation .telephone       ").val(json.customer.telephone);
				$("#customerInformation .company         ").val(json.customer.company  );
				$("#customerInformation .location-country").val(json.customer.country  );
				$("#customerInformation .location-city   ").val(json.customer.city     );
				$("#customerInformation .location-zip    ").val(json.customer.zipcode  );
				$("#customerInformation .location-address").val(json.customer.address  );
			}
		}
		
		// Set Installation Address
		if(json.hasOwnProperty("installation")) {
			if(json.installation.hasOwnProperty("country")) $("#installationAddress .location-country").val(json.installation.country);
			if(json.installation.hasOwnProperty("city"   )) $("#installationAddress .location-city   ").val(json.installation.city   );
			if(json.installation.hasOwnProperty("zipcode")) $("#installationAddress .location-zip    ").val(json.installation.zipcode);
			if(json.installation.hasOwnProperty("address")) $("#installationAddress .location-address").val(json.installation.address);
			// Same as customer address
			if( $("#installationAddress .location-country").val().trim() == $("#customerInformation .location-country").val().trim() &&
				$("#installationAddress .location-city   ").val().trim() == $("#customerInformation .location-city   ").val().trim() &&
				$("#installationAddress .location-zip    ").val().trim() == $("#customerInformation .location-zip    ").val().trim() &&
				$("#installationAddress .location-address").val().trim() == $("#customerInformation .location-address").val().trim()
			) $("#sameAddress").attr("checked", true).trigger("change");
		}

		// Set Installer on Site
		$("#installerOnSite").val("");

	}
});





$("#customerInformation .email").on("change", function() {
	
	var email = $(this).val().trim();
	
	if(!validateEmail(email)) return;

	// Email can't be same as installer mail
	if(email.trim().toLowerCase() == installerEmail.trim().toLowerCase()) return $("#errorSameAsInstaller").modal("show");
	
	$.post({
		url: "https://api.batterx.app/v2/install.php",
		data: {
			action    : "get_customer_info",
			customer  : email,
			installer : installerEmail
		},
		error: () => { alert("E002. Please refresh the page! (Error while getting customer info from cloud)"); },
		success: (json) => {

			console.log(json);

			if(json.hasOwnProperty("has_access") && json.has_access == false) {
				hasAccessToUser = false;
				return $("#errorNoAccessToUser").modal("show");
			}

			if( json.hasOwnProperty("gender"   ) &&
				json.hasOwnProperty("firstname") &&
				json.hasOwnProperty("lastname" ) &&
				json.hasOwnProperty("telephone") &&
				json.hasOwnProperty("company"  ) &&
				json.hasOwnProperty("country"  ) &&
				json.hasOwnProperty("city"     ) &&
				json.hasOwnProperty("zipcode"  ) &&
				json.hasOwnProperty("address"  ) &&
				json.hasOwnProperty("verified" )
			) {
				// Set Input Values
				$("#customerInformation .email           ").attr("disabled", json.verified == "1");
				$("#customerInformation .gender          ").val(json.gender   );
				$("#customerInformation .first-name      ").val(json.firstname);
				$("#customerInformation .last-name       ").val(json.lastname );
				$("#customerInformation .telephone       ").val(json.telephone);
				$("#customerInformation .company         ").val(json.company  );
				$("#customerInformation .location-country").val(json.country  );
				$("#customerInformation .location-city   ").val(json.city     );
				$("#customerInformation .location-zip    ").val(json.zipcode  );
				$("#customerInformation .location-address").val(json.address  );
			}

			hasAccessToUser = true;

		}
	});

});





setInterval(() => {

	if( $("#customerInformation .gender          ").val().trim() == "" ||
		$("#customerInformation .first-name      ").val().trim() == "" ||
		$("#customerInformation .last-name       ").val().trim() == "" ||
		$("#customerInformation .email           ").val().trim() == "" ||
		$("#customerInformation .telephone       ").val().trim() == "" ||
		$("#customerInformation .location-country").val().trim() == "" ||
		$("#customerInformation .location-city   ").val().trim() == "" ||
		$("#customerInformation .location-zip    ").val().trim() == "" ||
		$("#customerInformation .location-address").val().trim() == "" ||
		$("#installerOnSite                      ").val().trim() == "" ||
		!validateEmail($("#customerInformation .email").val().trim())
	) return $("#btn_next").attr("disabled", true);

	if($("#sameAddress").is(":checked")) {
		$("#installationAddress .location-country").attr("required", false);
		$("#installationAddress .location-city   ").attr("required", false);
		$("#installationAddress .location-zip    ").attr("required", false);
		$("#installationAddress .location-address").attr("required", false);
		$("#btn_next").attr("disabled", false);
	} else {
		$("#installationAddress .location-country").attr("required", true);
		$("#installationAddress .location-city   ").attr("required", true);
		$("#installationAddress .location-zip    ").attr("required", true);
		$("#installationAddress .location-address").attr("required", true);
		if( $("#installationAddress .location-country").val().trim() == "" ||
			$("#installationAddress .location-city   ").val().trim() == "" ||
			$("#installationAddress .location-zip    ").val().trim() == "" ||
			$("#installationAddress .location-address").val().trim() == ""
		) { $('#btn_next').attr('disabled', true); }
		else { $('#btn_next').attr('disabled', false); }
	}

}, 1000);





$("#mainForm").on("submit", (e) => {

	e.preventDefault();

	if( $("#customerInformation .gender          ").val().trim() != "" &&
		$("#customerInformation .first-name      ").val().trim() != "" &&
		$("#customerInformation .last-name       ").val().trim() != "" &&
		$("#customerInformation .email           ").val().trim() != "" &&
		$("#customerInformation .telephone       ").val().trim() != "" &&
		$("#customerInformation .location-country").val().trim() != "" &&
		$("#customerInformation .location-city   ").val().trim() != "" &&
		$("#customerInformation .location-zip    ").val().trim() != "" &&
		$("#customerInformation .location-address").val().trim() != "" &&
		$("#installerOnSite                      ").val().trim() != "" &&
		(
			$("#sameAddress").is(":checked") ||
			(
				$("#installationAddress .location-country").val().trim() != "" &&
				$("#installationAddress .location-city   ").val().trim() != "" &&
				$("#installationAddress .location-zip    ").val().trim() != "" &&
				$("#installationAddress .location-address").val().trim() != ""
			)
		)
	) {

		if($("#customerInformation .email").val().trim().toLowerCase() == installerEmail.trim().toLowerCase())
			return $("#errorSameAsInstaller").modal("show");

		if(!hasAccessToUser)
			return $("#errorNoAccessToUser").modal("show");

		// Set to Session
		$.post({
			url: "cmd/session.php",
			data: {
				customer_gender:      $("#customerInformation .gender          ").val().trim(),
				customer_firstname:   $("#customerInformation .first-name      ").val().trim(),
				customer_lastname:    $("#customerInformation .last-name       ").val().trim(),
				customer_email:       $("#customerInformation .email           ").val().trim(),
				customer_telephone:   $("#customerInformation .telephone       ").val().trim(),
				customer_company:     $("#customerInformation .company         ").val().trim(),
				customer_country:     $("#customerInformation .location-country").val().trim(),
				customer_city:        $("#customerInformation .location-city   ").val().trim(),
				customer_zipcode:     $("#customerInformation .location-zip    ").val().trim(),
				customer_address:     $("#customerInformation .location-address").val().trim(),
				installer_on_site:    $("#installerOnSite                      ").val().trim(),
				installation_country: $("#sameAddress").is(":checked") ? $("#customerInformation .location-country").val().trim() : $("#installationAddress  .location-country").val().trim(),
				installation_city:    $("#sameAddress").is(":checked") ? $("#customerInformation .location-city   ").val().trim() : $("#installationAddress  .location-city   ").val().trim(),
				installation_zipcode: $("#sameAddress").is(":checked") ? $("#customerInformation .location-zip    ").val().trim() : $("#installationAddress  .location-zip    ").val().trim(),
				installation_address: $("#sameAddress").is(":checked") ? $("#customerInformation .location-address").val().trim() : $("#installationAddress  .location-address").val().trim()
			},
			error: () => { alert("E003. Please refresh the page! (Error while saving data to session)"); },
			success: (response) => {
				console.log(response);
				if(response == "1")
					window.location.href = "system_detect.php";
				else
					alert("E004. Please refresh the page! (Bad response while saving data to session)");
			}
		});

	}

});
