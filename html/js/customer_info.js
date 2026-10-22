let hasAccessToUser    = true;
let installation_data  = {};

let installationMap    = null;
let installationMarker = null;

function validateForm() {
    const sameAddress = $("#sameAddress").is(":checked");

    const customerOk =
        $("#firstname"       ).val().trim() !== "" &&
        $("#lastname"        ).val().trim() !== "" &&
        $("#email"           ).val().trim() !== "" &&
        validateEmail($("#email").val().trim())    &&
        $("#telephone"       ).val().trim() !== "" &&
        $("#customer-country").val().trim() !== "" &&
        $("#customer-city"   ).val().trim() !== "" &&
        $("#customer-zip"    ).val().trim() !== "" &&
        $("#customer-address").val().trim() !== "";

    const installationOk = sameAddress || (
        $("#installation-country").val().trim() !== "" &&
        $("#installation-city"   ).val().trim() !== "" &&
        $("#installation-zip"    ).val().trim() !== "" &&
        $("#installation-address").val().trim() !== ""
    );

    const installerOk = $("#installer-on-site").val().trim() !== "";

    const coordsOk = $("#installationLat").val() !== "" && $("#installationLon").val() !== "";

    $("#btn_continue").prop("disabled", !customerOk || !installationOk || !installerOk || !hasAccessToUser || !coordsOk);
}

// Map: update hidden inputs + coords display, then revalidate
function updateInstallationCoords(lat, lon) {
    $("#installationLat").val(lat);
    $("#installationLon").val(lon);
    $("#installationLocationCoords").text(lat + "°, " + lon + "°");
    validateForm();
}

// Map: place or move draggable marker; pan=true also zooms to location (used for geocoding/restore)
function setInstallationMarker(lat, lon, pan = true) {
    if(!installationMap) return;
    if(installationMarker) {
        installationMarker.setLatLng([lat, lon]);
    } else {
        installationMarker = L.marker([lat, lon], {draggable: true}).addTo(installationMap);
        installationMarker.on("dragend", function(e) {
            const ll = e.target.getLatLng();
            updateInstallationCoords(parseFloat(ll.lat.toFixed(6)), parseFloat(ll.lng.toFixed(6)));
        });
    }
    if(pan) installationMap.setView([lat, lon], 15);
    updateInstallationCoords(parseFloat(parseFloat(lat).toFixed(6)), parseFloat(parseFloat(lon).toFixed(6)));
}

// Map: initialise Leaflet once
function initInstallationMap() {
    if(installationMap) { installationMap.invalidateSize(); return; }

    installationMap = L.map("installationLocationMap").setView([50, 10], 5);
    installationMap.attributionControl.setPrefix(false);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        maxZoom: 19
    }).addTo(installationMap);

    // Place marker if coords already stored
    const lat = parseFloat($("#installationLat").val());
    const lon = parseFloat($("#installationLon").val());
    if(!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
        setInstallationMarker(lat, lon);
    }

    // Click anywhere on the map to place/move the marker without changing zoom
    installationMap.on("click", function(e) {
        setInstallationMarker(e.latlng.lat, e.latlng.lng, false);
    });
}

// Map: geocode via Nominatim using current address fields
async function geocodeInstallationAddress() {
    const sameAddress = $("#sameAddress").is(":checked");

    const address = sameAddress ? $("#customer-address").val().trim() : $("#installation-address").val().trim();
    const zip     = sameAddress ? $("#customer-zip"    ).val().trim() : $("#installation-zip"    ).val().trim();
    const city    = sameAddress ? $("#customer-city"   ).val().trim() : $("#installation-city"   ).val().trim();
    const country = sameAddress ? $("#customer-country").val().trim() : $("#installation-country").val().trim();

    if(!address || !city || !country) return;

    const $btn = $("#btnUseInstallationAddress");
    $btn.prop("disabled", true);

    try {
        const q = [address, zip, city, country].filter(Boolean).join(", ");
        const results = await $.get({
            url: "https://nominatim.openstreetmap.org/search",
            data: { format: "json", limit: 1, q: q }
        });

        if(results && results.length > 0) {
            setInstallationMarker(parseFloat(results[0].lat), parseFloat(results[0].lon));
        }
    } catch {
        // Silently ignore — user can still drag the marker manually
    } finally {
        $btn.prop("disabled", false);
    }
}

// Map: auto-geocode only when no marker exists yet
function tryAutoGeocode() {
    if($("#installationLat").val() !== "") return; // marker already placed
    geocodeInstallationAddress();
}

// Load previously saved SystemLocation from device settings and pre-fill hidden inputs
async function loadSavedLocation() {
    try {
        const settings = await $.get({ url: "api.php?get=settings" });
        if( settings && settings.hasOwnProperty("SystemLocation") &&
            settings["SystemLocation"].hasOwnProperty("0")
        ) {
            const loc = settings["SystemLocation"]["0"];
            const lat = parseInt(loc.v1) / 1000000;
            const lon = parseInt(loc.v2) / 1000000;
            if(lat !== 0 || lon !== 0) {
                $("#installationLat").val(lat);
                $("#installationLon").val(lon);
                $("#installationLocationCoords").text(lat + "°, " + lon + "°");
                validateForm();
            }
        }
    } catch {
        // Silently ignore — map will just start empty
    }
}

async function getInstallationInfo() {
    try {
        const json = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: { action: "get_installation_info", apikey: apikey }
        });

        if(!json) return;

        installation_data = json;

        if(json.hasOwnProperty("customer")) {
            const c = json.customer;
            if( c.hasOwnProperty("gender"   ) && c.hasOwnProperty("firstname") &&
                c.hasOwnProperty("lastname" ) && c.hasOwnProperty("company"  ) &&
                c.hasOwnProperty("email"    ) && c.hasOwnProperty("telephone") &&
                c.hasOwnProperty("country"  ) && c.hasOwnProperty("city"     ) &&
                c.hasOwnProperty("zipcode"  ) && c.hasOwnProperty("address"  ) &&
                c.hasOwnProperty("verified" )
            ) {
                $("#email"           ).val(c.email).prop("disabled", c.verified == "1");
                $("#gender"          ).val(c.gender);
                $("#firstname"       ).val(c.firstname);
                $("#lastname"        ).val(c.lastname);
                $("#company"         ).val(c.company);
                $("#telephone"       ).val(c.telephone);
                $("#customer-country").val(c.country);
                $("#customer-city"   ).val(c.city);
                $("#customer-zip"    ).val(c.zipcode);
                $("#customer-address").val(c.address);
            }
        }

        if(json.hasOwnProperty("installation")) {
            const i = json.installation;
            if(i.hasOwnProperty("country")) $("#installation-country").val(i.country);
            if(i.hasOwnProperty("city"   )) $("#installation-city"   ).val(i.city);
            if(i.hasOwnProperty("zipcode")) $("#installation-zip"    ).val(i.zipcode);
            if(i.hasOwnProperty("address")) $("#installation-address").val(i.address);

            // Auto-check "same address" if installation matches customer
            if( $("#installation-country").val().trim() === $("#customer-country").val().trim() &&
                $("#installation-city"   ).val().trim() === $("#customer-city"   ).val().trim() &&
                $("#installation-zip"    ).val().trim() === $("#customer-zip"    ).val().trim() &&
                $("#installation-address").val().trim() === $("#customer-address").val().trim()
            ) {
                $("#sameAddress").prop("checked", true).trigger("change");
            }
        }

        validateForm();
        tryAutoGeocode();
        overlayImportedCustomer();

    } catch {
        alert("E001. Please refresh the page! (Error while getting installation info from cloud)");
        overlayImportedCustomer();
    }
}

async function getCustomerInfo(email) {
    try {
        const json = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action:    "get_customer_info",
                customer:  email,
                installer: installerEmail.trim().toLowerCase()
            }
        });

        if(json.hasOwnProperty("has_access") && json.has_access === false) {
            hasAccessToUser = false;
            $("#errorNoAccess").removeClass("d-none");
            validateForm();
            return;
        }

        hasAccessToUser = true;
        $("#errorNoAccess").addClass("d-none");

        if( json.hasOwnProperty("gender"   ) && json.hasOwnProperty("firstname") &&
            json.hasOwnProperty("lastname" ) && json.hasOwnProperty("telephone") &&
            json.hasOwnProperty("company"  ) && json.hasOwnProperty("country"  ) &&
            json.hasOwnProperty("city"     ) && json.hasOwnProperty("zipcode"  ) &&
            json.hasOwnProperty("address"  ) && json.hasOwnProperty("verified" )
        ) {
            $("#email"           ).prop("disabled", json.verified == "1");
            $("#gender"          ).val(json.gender);
            $("#firstname"       ).val(json.firstname);
            $("#lastname"        ).val(json.lastname);
            $("#company"         ).val(json.company);
            $("#telephone"       ).val(json.telephone);
            $("#customer-country").val(json.country);
            $("#customer-city"   ).val(json.city);
            $("#customer-zip"    ).val(json.zipcode);
            $("#customer-address").val(json.address);
        }

        validateForm();
        overlayImportedCustomer();

    } catch {
        alert("E002. Please refresh the page! (Error while getting customer info from cloud)");
        validateForm();
        overlayImportedCustomer();
    }
}

async function submitForm() {
    const sameAddress = $("#sameAddress").is(":checked");
    const email = $("#email").val().trim().toLowerCase();

    if(email === installerEmail.trim().toLowerCase()) {
        $("#errorSameInstaller").removeClass("d-none");
        return;
    }

    if(!hasAccessToUser) {
        $("#errorNoAccess").removeClass("d-none");
        return;
    }

    $("#btn_continue").prop("disabled", true);

    let sessionResponse;
    try {
        sessionResponse = await $.post({
            url: "cmd/session.php",
            data: {
                customer_gender:        $("#gender"          ).val().trim(),
                customer_firstname:     $("#firstname"       ).val().trim(),
                customer_lastname:      $("#lastname"        ).val().trim(),
                customer_email:         email,
                customer_telephone:     $("#telephone"       ).val().trim(),
                customer_company:       $("#company"         ).val().trim(),
                customer_country:       $("#customer-country").val().trim(),
                customer_city:          $("#customer-city"   ).val().trim(),
                customer_zipcode:       $("#customer-zip"    ).val().trim(),
                customer_address:       $("#customer-address").val().trim(),
                installer_on_site:      $("#installer-on-site").val().trim(),
                installation_country:   sameAddress ? $("#customer-country").val().trim() : $("#installation-country").val().trim(),
                installation_city:      sameAddress ? $("#customer-city"   ).val().trim() : $("#installation-city"   ).val().trim(),
                installation_zipcode:   sameAddress ? $("#customer-zip"    ).val().trim() : $("#installation-zip"    ).val().trim(),
                installation_address:   sameAddress ? $("#customer-address").val().trim() : $("#installation-address").val().trim(),
                installer_og_email:     installation_data?.installer?.email?.toLowerCase()   ?? "",
                installer_og_gender:    installation_data?.installer?.gender                 ?? "0",
                installer_og_firstname: installation_data?.installer?.firstname              ?? "",
                installer_og_lastname:  installation_data?.installer?.lastname               ?? "",
                installer_og_company:   installation_data?.installer?.company                ?? "",
                installer_og_telephone: installation_data?.installer?.telephone              ?? "",
                installer_og_country:   installation_data?.installer?.country                ?? ""
            }
        });
    } catch {
        alert("E003. Please refresh the page! (Error while saving data to session)");
        validateForm();
        return;
    }

    if(sessionResponse !== "1") {
        alert("E004. Please refresh the page! (Bad response while saving data to session)");
        validateForm();
        return;
    }

    // Save installation coordinates to device settings DB
    const lat = parseFloat($("#installationLat").val());
    const lon = parseFloat($("#installationLon").val());
    if(!isNaN(lat) && !isNaN(lon)) {
        try {
            await $.post({
                url: "api.php",
                data: {
                    set:     "setting",
                    varname: "SystemLocation",
                    entity:  0,
                    v1:      Math.round(lat * 1000000),
                    v2:      Math.round(lon * 1000000)
                }
            });
        } catch {
            console.warn("Warning: Could not save SystemLocation to device settings.");
        }
    }

    window.location.href = "system_detect.php";
}

// Same address toggle
$("#sameAddress").on("change", function() {
    if($(this).is(":checked")) {
        $("#installationAddress").hide();
    } else {
        $("#installationAddress").show();
    }
    validateForm();
    tryAutoGeocode();
});

// Email change — validate access
$("#email").on("change", function() {
    const email = $(this).val().trim().toLowerCase();

    $("#errorSameInstaller, #errorNoAccess").addClass("d-none");

    if(!validateEmail(email)) { validateForm(); return; }

    if(email === installerEmail.trim().toLowerCase()) {
        $("#errorSameInstaller").removeClass("d-none");
        hasAccessToUser = false;
        validateForm();
        return;
    }

    hasAccessToUser = true;
    getCustomerInfo(email);
});

// Validate on any input/change
$("#firstname, #lastname, #company, #telephone, #customer-city, #customer-zip, #customer-address, #installer-on-site, #installation-city, #installation-zip, #installation-address").on("input", validateForm);
$("#gender, #customer-country, #installation-country").on("change", validateForm);

// Auto-geocode when installation address street is filled
$("#installation-address").on("blur", tryAutoGeocode);

// Auto-geocode when customer address street is filled (applies when sameAddress is checked)
$("#customer-address").on("blur", function() {
    if($("#sameAddress").is(":checked")) tryAutoGeocode();
});

// Submit on Enter from technician field
$("#installer-on-site").on("keydown", function(e) {
    if(e.key === "Enter" && !$("#btn_continue").prop("disabled")) submitForm();
});

// Map: manual geocode button
$("#btnUseInstallationAddress").on("click", geocodeInstallationAddress);

// Submit
$("#btn_continue").on("click", submitForm);

// Init — load saved location first so the map can place the marker immediately
(async () => {
    await loadSavedLocation();
    initInstallationMap();
    getInstallationInfo(); // async; tryAutoGeocode() inside will skip if lat already set
    validateForm();
})();










// Import batterX Project — module-scope state used by overlayImportedCustomer + cloud fetch tail-calls
let importedProject = null;

function importVal(v) {
    return (typeof v === "string" && v !== "") ? v : undefined;
}

function overlayImportedCustomer() {
    if (!importedProject) return;

    const c = importedProject.customer     ?? {};
    const i = importedProject.installation ?? {};

    // Customer card — skipped entirely when #email is disabled
    // (existing customer is already assigned to this system, don't overwrite their info).
    // System_setup fields are still imported downstream from the session blob.
    if (!$("#email").is(":disabled")) {
        if (importVal(c.email))     $("#email"           ).val(c.email);
        if (importVal(c.gender))    $("#gender"          ).val(c.gender);
        if (importVal(c.firstname)) $("#firstname"       ).val(c.firstname);
        if (importVal(c.lastname))  $("#lastname"        ).val(c.lastname);
        if (importVal(c.company))   $("#company"         ).val(c.company);
        if (importVal(c.telephone)) $("#telephone"       ).val(c.telephone);
        if (importVal(c.country))   $("#customer-country").val(c.country);
        if (importVal(c.city))      $("#customer-city"   ).val(c.city);
        if (importVal(c.zipcode))   $("#customer-zip"    ).val(c.zipcode);
        if (importVal(c.address))   $("#customer-address").val(c.address);
    }

    // Installation card — all-or-nothing overlay. Country is server-rendered pre-filled, so we don't
    // gate on it. If city + zip + address are ALL empty, apply all 4 (including country) from the file.
    // If ANY of the three is already filled (from cloud or installer typing), skip the whole block.
    // Applies whether or not #email is disabled.
    const cityEmpty    = $("#installation-city"   ).val().trim() === "";
    const zipEmpty     = $("#installation-zip"    ).val().trim() === "";
    const addressEmpty = $("#installation-address").val().trim() === "";
    if (cityEmpty && zipEmpty && addressEmpty) {
        if (importVal(i.country)) $("#installation-country").val(i.country);
        if (importVal(i.city))    $("#installation-city"   ).val(i.city);
        if (importVal(i.zipcode)) $("#installation-zip"    ).val(i.zipcode);
        if (importVal(i.address)) $("#installation-address").val(i.address);
    }

    // Auto-check "same address" if customer + installation addresses now match (whichever source they came from)
    if ($("#customer-country").val().trim() !== "" && $("#customer-country").val().trim() === $("#installation-country").val().trim()
        && $("#customer-city"   ).val().trim() !== "" && $("#customer-city"   ).val().trim() === $("#installation-city"   ).val().trim()
        && $("#customer-zip"    ).val().trim() !== "" && $("#customer-zip"    ).val().trim() === $("#installation-zip"    ).val().trim()
        && $("#customer-address").val().trim() !== "" && $("#customer-address").val().trim() === $("#installation-address").val().trim()) {
        $("#sameAddress").prop("checked", true).trigger("change");
    }

    validateForm();
    tryAutoGeocode();
}

// Drop zone + hidden file input (guarded server-side via $canImportProject)
(function() {
    const $dropZone = $("#importProjectDropZone");
    if (!$dropZone.length) return;
    const $fileInput = $("#importProjectFile");

    async function handleProjectFile(file) {
        if (!file.name.toLowerCase().endsWith(".batterx")) {
            _alert(t("ci_import_invalid_file"));
            return;
        }

        let text;
        try { text = await file.text(); }
        catch { _alert(t("ci_import_read_error")); return; }

        let parsed;
        try { parsed = JSON.parse(text); }
        catch { _alert(t("ci_import_parse_error")); return; }

        if (parsed?.type !== "batterx_project") {
            _alert(t("ci_import_wrong_type"));
            return;
        }

        // Email-mismatch guard: if #email is disabled and file's email differs, reject
        const currentEmail = $("#email").val().trim().toLowerCase();
        const fileEmail    = (parsed?.customer?.email ?? "").trim().toLowerCase();
        if ($("#email").is(":disabled") && fileEmail && fileEmail !== currentEmail) {
            _alert(t("ci_import_email_mismatch", { file: fileEmail, current: currentEmail }));
            return;
        }

        // Persist to session so system_detect + system_setup can consume
        try {
            const resp = await $.post({ url: "cmd/session.php", data: { imported_project: text } });
            if (resp !== "1") throw new Error("bad response");
        } catch {
            _alert(t("ci_import_save_error"));
            return;
        }

        importedProject = parsed;

        // Hide drop zone (permanent for this page visit; session clears on next page load)
        $("#importProjectSectionWrap").addClass("d-none");

        // If email differs and field isn't disabled → set + trigger change (which fires getCustomerInfo → overlay at end)
        if (fileEmail && fileEmail !== currentEmail && !$("#email").is(":disabled")) {
            $("#email").val(fileEmail).trigger("change");
        } else {
            overlayImportedCustomer();
        }
    }

    $fileInput.on("change", function() {
        const file = this.files[0];
        if (file) handleProjectFile(file);
        $(this).val(""); // reset so the same file can be picked again
    });

    $dropZone.on("dragover", function(e) {
        e.preventDefault();
        $(this).addClass("dragover");
    });
    $dropZone.on("dragleave dragend", function(e) {
        e.preventDefault();
        $(this).removeClass("dragover");
    });
    $dropZone.on("drop", function(e) {
        e.preventDefault();
        $(this).removeClass("dragover");
        const files = e.originalEvent.dataTransfer?.files;
        if (files && files.length) handleProjectFile(files[0]);
    });
})();
