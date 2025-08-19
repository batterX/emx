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
    text += `S/N:      ${$("#report_sn      ").val ()}\n`;
    text += `\n`;
    text += `Passed Tests:\n`;
    text += `- EMX Update\n`;
    text += `- Inverter Communication\n`;
    text += `- E.Meter Communication\n`;
    text += `- GPIO Outputs & Inputs\n`;
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
    EMX UPDATE
*/

var emx_update_newVersion = softwareVersion;
var emx_update_interval;
var emx_update_isFinished = false;

function emx_update() {

    enableStep("emx_update");

    logMsg("emx_update", "", `Installed Version: <b>${softwareVersion}</b>`);

    $.get({
        url: "https://api.batterx.app",
        dataType: "text",
        cache: false,
        error: () => {
            logMsg("emx_update", "mt-4 red", "No Internet Connection");
            setTimeout(emx_update, 5000); // Retry after 5 seconds
        },
        success: () => {

            logMsg("emx_update", "", "Searching For Update");

            // Get Latest Version Number
            $.get({
                url: "https://raw.githubusercontent.com/batterX/emx/master/version.txt",
                dataType: "text",
                cache: false,
                error: () => {
                    removeLastMsg("emx_update");
                    logMsg("emx_update", "mt-4 red", "No Internet Connection");
                    setTimeout(emx_update, 5000);
                },
                success: (versionNum) => {

                    removeLastMsg("emx_update");
                    logMsg("emx_update", "", `Available Version: <b>${versionNum}</b>`);

                    // Compare Versions
                    if(softwareVersion != versionNum) {
                        emx_update_newVersion = versionNum;
                        // Download Update
                        $.post("cmd/update.php");
                        // Downloading Update...
                        logMsg("emx_update", "mt-4", "Downloading Update. Please wait…");
                        clearInterval(emx_update_interval);
                        emx_update_interval = undefined;
                        emx_update_interval = setInterval(emx_update_waitForError, 5000);
                    } else {
                        // Update Completed
                        logMsg("emx_update", "mt-4 green text-center", "<b>CONTINUE NEXT STEP</b>");
                        finishStep("emx_update");
                        emeter_test();
                    }

                }
            });

        }
    });

}

function emx_update_waitForError() {
    $.get({
        url: "cmd/working.txt",
        cache: false,
        error: () => {
            // Rebooting...
            removeLastMsg("emx_update");
            logMsg("emx_update", "mt-4", "Rebooting. Please wait…");
            clearInterval(emx_update_interval);
            emx_update_interval = undefined;
            emx_update_interval = setInterval(emx_update_waitForSuccess, 5000);
        },
        success: (response) => {
            if(response) return;
            // Rebooting...
            removeLastMsg("emx_update");
            logMsg("emx_update", "mt-4", "Rebooting. Please wait…");
            clearInterval(emx_update_interval);
            emx_update_interval = undefined;
            emx_update_interval = setInterval(emx_update_waitForSuccess, 5000);
        }
    });
}

function emx_update_waitForSuccess() {
    $.get({
        url: "cmd/working.txt",
        cache: false,
        success: (response) => {
            if(!response) return;
            // Finishing Update...
            removeLastMsg("emx_update");
            logMsg("emx_update", "mt-4", "Finishing Update. Please wait…");
            clearInterval(emx_update_interval);
            emx_update_interval = undefined;
            setTimeout(() => {
                // Update Completed
                removeLastMsg("emx_update");
                logMsg("emx_update", "mt-4 green", "Update Completed");
                setTimeout(() => { window.location.reload(true); }, 5000);
            }, 60000);
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
                generate_report();
            });
        }
    });
}




















/*
    GENERATE REPORT
*/

function generate_report() {
    enableStep("generate_report");
    $("#report_sn").text("");
    $("#report").removeClass("d-none");
    /*$.post({
        url: "https://api.batterx.app/v2/_emxtest.php",
        data: {
            action: "get_emx_serialnumber",
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
    });*/
}

$("#report_send").on("click", () => {
    if($("#report_sn").val() == "") return alert("Please enter EMX S/N");
    $("#report_sn  ").prop("disabled", true);
    $("#report_send").prop("disabled", true);
    $("#report_note").prop("disabled", true);
    $.post({
        url: "https://api.batterx.app/v2/_emxtest.php",
        data: {
            action                : "register_emx",
            apikey                : $("#report_apikey  ").text(),
            serialnumber          : $("#report_sn      ").val (),
            serialnumber_producer : "",
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
    download(`${$("#report_sn").val()}.txt`, getReport());
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
    if(!confirm("Are you sure you want to SHUTDOWN the EMX?")) return false;
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

emx_update();
