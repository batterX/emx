// MARK: Font and logo loading

var _robotoFontsReady = null;
var _logoReady = null;

function bufToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunks = [];
    for(let i = 0; i < bytes.length; i += 8192) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    }
    return btoa(chunks.join(""));
}

function ensureFonts() {
    if(!_robotoFontsReady) {
        _robotoFontsReady = Promise.all([
            fetch("fonts/Roboto-Regular.ttf").then(r => r.arrayBuffer()).then(bufToBase64),
            fetch("fonts/Roboto-Bold.ttf").then(r => r.arrayBuffer()).then(bufToBase64)
        ]).then(([regular, bold]) => ({ regular, bold }));
    }
    return _robotoFontsReady;
}

function ensureLogo() {
    if(!_logoReady) {
        _logoReady = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload  = () => resolve(img);
            img.onerror = () => resolve(null); // non-fatal: PDF renders without logo on failure
            img.src = "img/batterx_logo.png";
        });
    }
    return _logoReady;
}

Promise.all([ensureFonts(), ensureLogo()]).catch(() => {});










// MARK: Auth code input

var bx_auth_code = "";

setTimeout(() => { $("#authCodeInput").val(""); }, 2500);

$("#authCodeTrigger").on("click", () => {
    $("#authCodeInput").val("");
    $("#modalAuthCode").modal("show");
});

$("#authCodeInput").on("keypress", (e) => {
    if(e.which === 13) {
        bx_auth_code = $("#authCodeInput").val();
        $("#modalAuthCode").modal("hide");
    }
});










// MARK: Generate PDF

async function generatePdf() {
    
    const [fonts, logo] = await Promise.all([ensureFonts(), ensureLogo()]);
    const pdf = new jspdf.jsPDF("p", "mm", "a4");
    pdf.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
    pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    pdf.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
    pdf.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    const M         = 12;
    const CW        = 186;
    const LW        = 0.38;
    const headerPad = 4;
    const logoH_mm  = 12;
    let y               = M;
    let firstPageHeader = true;

    function drawPageHeader() {
        y = M;
        if(logo) {
            const logoW_mm = logoH_mm * (logo.naturalWidth / logo.naturalHeight);
            pdf.addImage(logo, "PNG", M + CW - logoW_mm, y + headerPad, logoW_mm, logoH_mm);
        }
        pdf.setFont("Roboto", "bold");
        pdf.setFontSize(15);
        pdf.setTextColor(0, 0, 0);
        pdf.text(t("is_title"), M, y + headerPad + logoH_mm / 2 + 2);
        pdf.setDrawColor(51, 51, 51);
        pdf.setLineWidth(0.5);
        pdf.line(M, y + headerPad + logoH_mm + headerPad, M + CW, y + headerPad + logoH_mm + headerPad);
        y += headerPad + logoH_mm + headerPad + (firstPageHeader ? 0 : 3.2);
        firstPageHeader = false;
    }

    pdf.internal.events.subscribe("addPage", drawPageHeader);
    drawPageHeader();

    function need(h) {
        if(y + h > 285) { pdf.addPage(); }
    }

    function sectionHeader(title) {
        y += 3.2;
        need(10);
        pdf.setFillColor(200, 200, 200);
        pdf.rect(M, y, CW, 7, "F");
        pdf.setFont("Roboto", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, M + 2, y + 4.8);
        y += 7;
    }

    function row(label, value) {
        if(value === null || value === undefined || value === "") return;
        // Set font first so splitTextToSize wraps against the correct metrics
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(10);
        const labelLines = pdf.splitTextToSize(String(label), CW * LW - 2);
        const valueSegments = String(value).split("\n");
        const valueLines = [];
        valueSegments.forEach(seg => pdf.splitTextToSize(seg, CW * (1 - LW) - 2).forEach(l => valueLines.push(l)));
        const maxLines = Math.max(labelLines.length, valueLines.length);
        const rowH = 6.6 + Math.max(0, maxLines - 1) * 5.3;
        need(rowH);
        // Re-set font in case need() triggered a page break — drawPageHeader ends at bold 15pt
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text(labelLines, M + 2, y + 4.1, { lineHeightFactor: 1.5 });
        pdf.setTextColor(0, 0, 0);
        pdf.text(valueLines, M + 2 + CW * LW, y + 4.1, { lineHeightFactor: 1.5 });
        pdf.setDrawColor(200, 200, 200);
        pdf.line(M, y + rowH - 0.3, M + CW, y + rowH - 0.3);
        y += rowH;
    }

    function fullRow(text) {
        if(text === null || text === undefined || text === "") return;
        const segments = String(text).split("\n");
        const lines = [];
        segments.forEach(seg => pdf.splitTextToSize(seg, CW - 4).forEach(l => lines.push(l)));
        const rowH = 6.6 + Math.max(0, lines.length - 1) * 5.3;
        need(rowH);
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(lines, M + 2, y + 4.1, { lineHeightFactor: 1.5 });
        pdf.setDrawColor(200, 200, 200);
        pdf.line(M, y + rowH - 0.3, M + CW, y + rowH - 0.3);
        y += rowH;
    }

    function pvStringsRow(label, rows) {
        if(!rows || rows.length === 0) return;
        const valueX  = M + 2 + CW * LW;
        const cPower  = valueX;
        const cDecl   = valueX + 30;
        const cOrient = valueX + 60;
        const rowH    = 4.2;
        need(rowH * (rows.length + 1) + 2.2);
        // Extra top padding to match standard row spacing (label:4.1 vs 3)
        y += 1.1;
        // Row label in muted color
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(40, 40, 40);
        pdf.text(label, M + 2, y + 3);
        // Table header — nudged up slightly so smaller-font caps align visually with label caps
        pdf.setFontSize(8.5);
        pdf.setTextColor(40, 40, 40);
        pdf.text(t("is_power"),       cPower,  y + 2.5);
        pdf.text(t("is_declination"), cDecl,   y + 2.5);
        pdf.text(t("is_orientation"), cOrient, y + 2.5);
        y += rowH - 0.5;
        // Data rows
        pdf.setTextColor(0, 0, 0);
        for(const r of rows) {
            pdf.text(r.power,  cPower,  y + 3);
            pdf.text(r.decl,   cDecl,   y + 3);
            pdf.text(r.orient, cOrient, y + 3);
            y += rowH;
        }
        // Row divider
        pdf.setDrawColor(200, 200, 200);
        pdf.line(M, y + 0.7, M + CW, y + 0.7);
        y += 1.4;
    }

    // ── Installation ──
    sectionHeader(t("is_section_installation"));
    row(t("is_installation_date"),    pdfData.installation_date);
    row(t("is_latest_maintenance"),   pdfData.latest_maintenance);
    row(t("is_installation_address"), pdfData.installation_address);

    // ── Installer ──
    sectionHeader(t("is_section_installer"));
    row(t("is_company"),                       pdfData.installer_og);
    row(t("is_email"),                         pdfData.installer_og_email);
    row(t("is_telephone"),                     pdfData.installer_og_telephone);
    row(t("is_technician_on_site"),            pdfData.installer_on_site);
    row(t("is_installer_for_commissioning"),   pdfData.installer_for_commissioning);
    // Installer memo — removed from summary (may contain installer-only info; customer will see this doc in future)
    // row(t("is_installer_memo"),                pdfData.installer_memo);

    // ── Customer ──
    sectionHeader(t("is_section_customer"));
    row(t("is_name"),      pdfData.customer_name);
    row(t("is_company"),   pdfData.customer_company);
    row(t("is_email"),     pdfData.customer_email);
    row(t("is_telephone"), pdfData.customer_telephone);
    row(t("is_address"),   pdfData.customer_address);

    // ── System ──
    sectionHeader(t("is_section_system"));
    row(t("is_system_name"),       pdfData.system_name);
    row(t("is_system_mode"),       pdfData.system_mode);
    row(pdfData.system_sn_label,   pdfData.system_sn);
    row(t("is_inverter_sn"),       pdfData.inverter_sn);
    row(t("is_nominal_power"),     pdfData.nominal_power);
    row(pdfData.box_sn_label,      pdfData.box_sn);
    row(t("is_grid_fuse"),         pdfData.grid_fuse);

    // ── Battery ──
    if(pdfData.battery_type) {
        sectionHeader(t("is_section_battery"));
        row(t("is_battery_capacity"), pdfData.battery_capacity);
        if(pdfData.battery_type === "lifepo") {
            row(t("is_bms_module_sn"),     pdfData.battery_bms_sn);
            row(t("is_battery_module_sn"), pdfData.battery_module_sn);
        } else if(pdfData.battery_type === "carbon") {
            row(t("is_battery_model"), pdfData.battery_model);
        } else if(pdfData.battery_type === "other") {
            row(t("is_max_charging_current"),           pdfData.battery_max_charging_current);
            row(t("is_max_discharging_current"),        pdfData.battery_max_discharging_current);
            row(t("is_bulk_charging_voltage"),          pdfData.battery_bulk_charging_voltage);
            row(t("is_float_charging_voltage"),         pdfData.battery_float_charging_voltage);
            row(t("is_cutoff_voltage_hybrid"),          pdfData.battery_cutoff_voltage_hybrid);
            row(t("is_redischarge_voltage_hybrid"),     pdfData.battery_redischarge_voltage_hybrid);
            row(t("is_cutoff_voltage"),                 pdfData.battery_cutoff_voltage);
            row(t("is_redischarge_voltage"),            pdfData.battery_redischarge_voltage);
        }
    }

    // ── Solar ──
    sectionHeader(t("is_section_solar"));
    row(t("is_pv_size_batterx"), pdfData.pv_size_batterx);
    if(pdfData.pv_strings_batterx.length > 0) {
        pvStringsRow(t("is_pv_strings_batterx"), pdfData.pv_strings_batterx);
    } else {
        row(t("is_pv_strings_batterx"), t("is_not_configured"));
    }
    if(pdfData.show_external_solar) {
        row(t("is_pv_size_external"), pdfData.pv_size_external);
        if(pdfData.pv_strings_external.length > 0) {
            pvStringsRow(t("is_pv_strings_external"), pdfData.pv_strings_external);
        } else {
            row(t("is_pv_strings_external"), t("is_not_configured"));
        }
    }
    row(t("is_grid_feedin_limitation"), pdfData.grid_feedin_limitation);
    if(pdfData.show_external_solar) {
        row(t("is_ext_solar_meter"), pdfData.ext_solar_meter);
    }
    if(pdfData.show_wide_solar_input_range) {
        row(t("is_wide_solar_input_range"), pdfData.wide_solar_input_range);
    }
    row(t("is_solar_info"), pdfData.solar_info);

    // ── Controllable Load ──
    if(isVde4105) {
        sectionHeader(t("is_section_controllable_load"));
        row(t("is_steuve_connection"), pdfData.steuve_connection);
        if(pdfData.steuve_connected) {
            row(t("is_steuve_generation_unit")    + " (§9 EEG)",   pdfData.steuve_generation);
            row(t("is_steuve_consumption_device") + " (§14a EnWG)", pdfData.steuve_consumption);
        }
    }

    // ── Grid Parameters ──
    if(isVde4105 || isTor || isEstonia) {
        sectionHeader(t("is_section_grid"));
        row(t("is_reactive_power_supply"), pdfData.reactive_power_supply);
        // LFSMO
        row(t("is_active_power_reduction_overfreq"), pdfData.lfsmo);
        // TOR extended
        if(isTor) {
            row(t("is_power_reduction_overvoltage"), pdfData.overvoltage_reduction);
            row(t("is_lvrt"),                        pdfData.lvrt);
            row(t("is_grid_connection_conditions"),  pdfData.grid_connection);
            row(t("is_grid_decoupling_protection"),  pdfData.grid_decoupling);
        }
        // Estonia: hardcoded fixed protection thresholds
        if(isEstonia) {
            row(t("is_extended_parameters"), pdfData.extended_parameters);
        }
    }

    // ── Wallbox (EV Charger) ──
    if(pdfData.wallbox_show) {
        sectionHeader(t("is_section_wallbox"));
        row(t("is_producer_model"),        pdfData.wallbox_producer);
        row(t("is_serial_number"),         pdfData.wallbox_serial);
        row(t("is_network_configuration"), pdfData.wallbox_network);
        row(t("is_electrical_wiring"),     pdfData.wallbox_electrical);
        row(t("is_evc_steuve_limit"),      pdfData.wallbox_steuve_limit);
    }

    // ── Generator ──
    if(pdfData.generator_show) {
        sectionHeader(t("is_section_generator"));
        row(t("is_gen_type"),       pdfData.generator_type);
        row(t("is_gen_power"),      pdfData.generator_power);
        row(t("is_gen_auto_start"), pdfData.generator_auto_start);
        row(t("is_gen_quiet_time"), pdfData.generator_quiet);
        row(t("is_gen_info"),       pdfData.generator_info);
    }

    // ── Confirmation ──
    sectionHeader(t("is_section_confirmation"));
    fullRow(pdfConfirmLoad);
    fullRow(pdfConfirmUserDocs);

    // ── Pagination ── (drawn last so we know total page count)
    const totalPages = pdf.internal.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`${i} / ${totalPages}`, M + CW / 2, 291, { align: "center" });
    }

    // return pdf.output("blob");

    // ── Append external PDF(s) ── (injected server-side as base64 in installation_summary.php to avoid CORS)
    const ourBytes = pdf.output("arraybuffer");
    try {
        if(typeof attachmentPdfsB64 === "undefined" || attachmentPdfsB64.length === 0) {
            return new Blob([ourBytes], { type: "application/pdf" });
        }
        const merged = await PDFLib.PDFDocument.load(ourBytes);
        for(const b64 of attachmentPdfsB64) {
            const extBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            const ext = await PDFLib.PDFDocument.load(extBytes);
            const pages = await merged.copyPages(ext, ext.getPageIndices());
            pages.forEach(p => merged.addPage(p));
        }
        const mergedBytes = await merged.save();
        return new Blob([mergedBytes], { type: "application/pdf" });
    } catch(e) {
        console.warn("PDF attachment failed, falling back to our PDF only:", e);
        return new Blob([ourBytes], { type: "application/pdf" });
    }

}










// MARK: Build Form Data

function buildFormData(authCode, pdfBlob) {

    const d = dataObj;
    const fd = new FormData();

    fd.append("action",     "finish_installation");
    fd.append("has_device", "1");
    fd.append("auth_code",  authCode);

    fd.append("lang", (d["lang"] && ["de","fr","cs","es"].includes(d["lang"])) ? d["lang"] : "en");

    if(d.hasOwnProperty("installation_date"      ) && d["installation_date"      ] != "") fd.append("installation_date"      , d["installation_date"      ]);

    if(d.hasOwnProperty("installer_og_company"   ) && d["installer_og_company"   ] != "") fd.append("installer_og_company"   , d["installer_og_company"   ]);
    if(d.hasOwnProperty("installer_og_country"   ) && d["installer_og_country"   ] != "") fd.append("installer_og_country"   , d["installer_og_country"   ]);
    if(d.hasOwnProperty("installer_og_email"     ) && d["installer_og_email"     ] != "") fd.append("installer_og_email"     , d["installer_og_email"     ]);
    if(d.hasOwnProperty("installer_og_firstname" ) && d["installer_og_firstname" ] != "") fd.append("installer_og_firstname" , d["installer_og_firstname" ]);
    if(d.hasOwnProperty("installer_og_gender"    ) && d["installer_og_gender"    ] != "") fd.append("installer_og_gender"    , d["installer_og_gender"    ]);
    if(d.hasOwnProperty("installer_og_lastname"  ) && d["installer_og_lastname"  ] != "") fd.append("installer_og_lastname"  , d["installer_og_lastname"  ]);
    if(d.hasOwnProperty("installer_og_telephone" ) && d["installer_og_telephone" ] != "") fd.append("installer_og_telephone" , d["installer_og_telephone" ]);

    if(d.hasOwnProperty("installer_gender"       ) && d["installer_gender"       ] != "") fd.append("installer_gender"       , d["installer_gender"       ]);
    if(d.hasOwnProperty("installer_firstname"    ) && d["installer_firstname"    ] != "") fd.append("installer_firstname"    , d["installer_firstname"    ]);
    if(d.hasOwnProperty("installer_lastname"     ) && d["installer_lastname"     ] != "") fd.append("installer_lastname"     , d["installer_lastname"     ]);
    if(d.hasOwnProperty("installer_company"      ) && d["installer_company"      ] != "") fd.append("installer_company"      , d["installer_company"      ]);
    if(d.hasOwnProperty("installer_telephone"    ) && d["installer_telephone"    ] != "") fd.append("installer_telephone"    , d["installer_telephone"    ]);
    if(d.hasOwnProperty("installer_email"        ) && d["installer_email"        ] != "") fd.append("installer_email"        , d["installer_email"        ]);
    if(d.hasOwnProperty("installer_password"     ) && d["installer_password"     ] != "") fd.append("installer_password"     , d["installer_password"     ]);
    if(d.hasOwnProperty("installer_on_site"      ) && d["installer_on_site"      ] != "") fd.append("installer_on_site"      , d["installer_on_site"      ]);

    if(d.hasOwnProperty("customer_gender"        ) && d["customer_gender"        ] != "") fd.append("customer_gender"        , d["customer_gender"        ]);
    if(d.hasOwnProperty("customer_firstname"     ) && d["customer_firstname"     ] != "") fd.append("customer_firstname"     , d["customer_firstname"     ]);
    if(d.hasOwnProperty("customer_lastname"      ) && d["customer_lastname"      ] != "") fd.append("customer_lastname"      , d["customer_lastname"      ]);
    if(d.hasOwnProperty("customer_email"         ) && d["customer_email"         ] != "") fd.append("customer_email"         , d["customer_email"         ]);
    if(d.hasOwnProperty("customer_telephone"     ) && d["customer_telephone"     ] != "") fd.append("customer_telephone"     , d["customer_telephone"     ]);
    if(d.hasOwnProperty("customer_company"       ) && d["customer_company"       ] != "") fd.append("customer_company"       , d["customer_company"       ]);
    if(d.hasOwnProperty("customer_country"       ) && d["customer_country"       ] != "") fd.append("customer_country"       , d["customer_country"       ]);
    if(d.hasOwnProperty("customer_city"          ) && d["customer_city"          ] != "") fd.append("customer_city"          , d["customer_city"          ]);
    if(d.hasOwnProperty("customer_zipcode"       ) && d["customer_zipcode"       ] != "") fd.append("customer_zipcode"       , d["customer_zipcode"       ]);
    if(d.hasOwnProperty("customer_address"       ) && d["customer_address"       ] != "") fd.append("customer_address"       , d["customer_address"       ]);

    if(d.hasOwnProperty("installation_country"   ) && d["installation_country"   ] != "") fd.append("installation_country"   , d["installation_country"   ]);
    if(d.hasOwnProperty("installation_city"      ) && d["installation_city"      ] != "") fd.append("installation_city"      , d["installation_city"      ]);
    if(d.hasOwnProperty("installation_zipcode"   ) && d["installation_zipcode"   ] != "") fd.append("installation_zipcode"   , d["installation_zipcode"   ]);
    if(d.hasOwnProperty("installation_address"   ) && d["installation_address"   ] != "") fd.append("installation_address"   , d["installation_address"   ]);

    if(d.hasOwnProperty("system_model"           ) && d["system_model"           ] != "") fd.append("system_model"           , d["system_model"           ]); else fd.append("system_model", "batterX");
    if(d.hasOwnProperty("system_serial"          ) && d["system_serial"          ] != "") fd.append("system_serial"          , d["system_serial"          ]);

    if(d.hasOwnProperty("device_serial"          ) && d["device_serial"          ] != "") fd.append("device_serial"          , d["device_serial"          ]);
    if(d.hasOwnProperty("device_partnumber"      ) && d["device_partnumber"      ] != "") fd.append("device_partnumber"      , d["device_partnumber"      ]);

    // Solar values derived from settings
    const solBxWp  = parseInt(dataSettings?.["NominalSol"]?.["0"]?.["v1"])    || 0;
    const solExtWp = parseInt(dataSettings?.["NominalExtSol"]?.["0"]?.["v1"]) || 0;
    const injWp    = parseInt(dataSettings?.["InjectionMode"]?.["0"]?.["v1"]) || 0;
    const totalWp  = solBxWp + solExtWp;

    fd.append("solar_wattpeak",         d.hasOwnProperty("solar_wattpeak"        ) && d["solar_wattpeak"        ] != "" ? d["solar_wattpeak"        ] : String(solBxWp));
    fd.append("solar_wattpeak_ext",     d.hasOwnProperty("solar_wattpeak_ext"    ) && d["solar_wattpeak_ext"    ] != "" ? d["solar_wattpeak_ext"    ] : String(solExtWp));
    fd.append("solar_feedinlimitation", d.hasOwnProperty("solar_feedinlimitation") && d["solar_feedinlimitation"] != "" ? d["solar_feedinlimitation"] : String(totalWp > 0 ? Math.round(injWp / totalWp * 100) : 0));

    if(d.hasOwnProperty("solar_info")) fd.append("solar_info", d["solar_info"]);
    if(d.hasOwnProperty("generator_info")) fd.append("generator_info", d["generator_info"]);
    if(d.hasOwnProperty("note"      )) fd.append("note",       d["note"      ]);

    if(d.hasOwnProperty("box_apikey"      ) && d["box_apikey"      ] != "") fd.append("box_apikey"      , d["box_apikey"      ]);
    if(d.hasOwnProperty("box_serial"      ) && d["box_serial"      ] != "") fd.append("box_serial"      , d["box_serial"      ]);
    if(d.hasOwnProperty("box_partnumber"  ) && d["box_partnumber"  ] != "") fd.append("box_partnumber"  , d["box_partnumber"  ]);
    fd.append("software_version", d["software_version"] || softwareVersion); // never empty — cloud requires it

    // Battery
    const bt = d["battery_type"];
    if(bt === "lifepo") {
        fd.append("has_battery",     "1");
        fd.append("battery_type",    "lifepo");
        if(d.hasOwnProperty("battery_voltage"      ) && d["battery_voltage"      ] != "") fd.append("battery_voltage"      , d["battery_voltage"      ]);
        if(d.hasOwnProperty("battery_serialnumbers") && d["battery_serialnumbers"] != "") fd.append("battery_serialnumbers", d["battery_serialnumbers"]);
        if(d.hasOwnProperty("battery_bms"          ) && d["battery_bms"          ] != "") fd.append("battery_bms"          , d["battery_bms"          ]);
    } else if(bt === "carbon") {
        fd.append("has_battery",     "1");
        fd.append("battery_type",    "carbon");
        fd.append("battery_voltage", "48");
        if(d.hasOwnProperty("battery_model"   ) && d["battery_model"   ] != "") fd.append("battery_model"   , d["battery_model"   ]);
        if(d.hasOwnProperty("battery_strings" ) && d["battery_strings" ] != "") fd.append("battery_strings" , d["battery_strings" ]);
        if(d.hasOwnProperty("battery_capacity") && d["battery_capacity"] != "") fd.append("battery_capacity", d["battery_capacity"]);
    } else if(bt === "other") {
        if(d.hasOwnProperty("battery_capacity") && d["battery_capacity"] != "" && d["battery_capacity"] != "0") {
            fd.append("has_battery",      "1");
            fd.append("battery_type",     "other");
            fd.append("battery_voltage",  "48");
            fd.append("battery_capacity", d["battery_capacity"]);
        } else {
            fd.append("has_battery", "0");
        }
    } else {
        fd.append("has_battery", "0");
    }

    fd.append("pdf_file", pdfBlob, t("is_title"));

    return fd;

}










// MARK: Submit Installation

$("#btn_finish").on("click", async () => {
    $("#btn_finish").prop("disabled", true);
    $("#submitError").addClass("d-none").text("");
    await submitInstallation(bx_auth_code);
    $("#btn_finish").prop("disabled", false);
});

async function submitInstallation(authCode) {

    // Step 1: Generate serial if NEW
    if(!dataObj["system_serial"] || dataObj["system_serial"] === "NEW") {
        const prefix = (boxType === "livex" ? "XH01" : "IE01") + new Date().getFullYear().toString().slice(-2);
        try {
            const serial = await $.post({
                url:  "https://api.batterx.app/v2/install.php",
                data: { action: "generate_system_serial", begin: prefix }
            });
            if(!serial) {
                showSubmitError("E001: Bad response while generating system serial number.");
                return;
            }
            dataObj["system_serial"] = serial;
            pdfData.system_sn        = serial;
            pdfData.system_sn_is_new = false;
            const snEl = document.getElementById("is_system_sn");
            if(snEl) snEl.textContent = serial;
        } catch {
            showSubmitError("E001: Error while generating system serial number.");
            return;
        }
    }

    // Step 2: generate PDF
    let pdfBlob;
    try {
        pdfBlob = await generatePdf();
    } catch(e) {
        showSubmitError("E002: Error while generating PDF — " + e.message);
        return;
    }

    // Step 3: build FormData + POST to cloud
    const fd = buildFormData(authCode, pdfBlob);
    try {
        const res = await $.ajax({
            url:         "https://api.batterx.app/v2/install.php",
            type:        "POST",
            data:        fd,
            processData: false,
            contentType: false
        });
        if(res == "1") {
            // Persist the generated serial + finished flag so a page refresh shows success directly
            try {
                await $.post("cmd/session.php", {
                    system_serial:         dataObj["system_serial"],
                    installation_finished: "1"
                });
            } catch {}
            // Show success
            showSuccess();
        } else {
            showSubmitError("E003: Cloud rejected the installation: " + res);
        }
    } catch {
        showSubmitError("E004: Network error while submitting installation to cloud.");
    }
}

function showSubmitError(msg) {
    $("#submitError").text(msg).removeClass("d-none");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function showSuccess() {
    $("body").addClass("success-shown");
}










// MARK: Reboot

$("#btn_reboot").on("click", async () => {
    $("#btn_reboot").prop("disabled", true);
    $("#rebootStatus").html(`<span class="spinner-border spinner-border-sm border-2 me-2" role="status"></span>${t("is_reboot_rebooting")}`).removeClass("d-none");
    try { await $.post("cmd/reboot.php"); } catch {}
    await waitForReboot();
    $("#rebootStatus").removeClass("text-muted").addClass("text-success").html(`<i class="bi bi-check-circle-fill me-2"></i>${t("is_reboot_success")}. ${t("is_reboot_can_close")}`);
    // Button stays disabled; page stays on success screen — installer is done.
});

async function waitForReboot() {
    // Wait until the device stops responding (rebooting)
    while(true) {
        try {
            const response = await $.get({ url: "cmd/working.txt", cache: false, timeout: 5000 });
            if(!response) break;
        } catch {
            break;
        }
        await sleep(5000);
    }
    $("#rebootStatus").html(`<span class="spinner-border spinner-border-sm border-2 me-2" role="status"></span>${t("is_reboot_waiting")}`);
    // Wait until the device responds again
    while(true) {
        try {
            const response = await $.get({ url: "cmd/working.txt", cache: false, timeout: 5000 });
            if(response) break;
        } catch {
            // still down
        }
        await sleep(5000);
    }
}










// MARK: Other

// Show or hide finish installation button
$("#checkboxAccept1, #checkboxAccept2, #checkboxAccept3").on("change", () => {
    const allChecked = $("#checkboxAccept1").is(":checked")
                    && $("#checkboxAccept2").is(":checked")
                    && $("#checkboxAccept3").is(":checked");
    $("#btn_finish").css("visibility", allChecked ? "visible" : "hidden");
});

// Download PDF
$("#btn_download").on("click", async () => {
    try {
        const blob = await generatePdf();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = t("is_title") + ".pdf";
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) {
        alert("Error generating PDF: " + e.message);
    }
});
