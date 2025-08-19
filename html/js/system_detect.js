$progress.trigger("step", 4);





step1();





var objGridStandards = {
    "0": "Unknown",
    "1": "VDE0126",
    "2": "VDE4105",
    "3": "TOR",
    "4": "EN50438",
    "5": "EN50549",
    "6": "Sweden",
    "7": "Belgium",
    "8": "Czech",
    "9": "Estonia"
}

var inverterModel = "";
var gridStandard = "";
var isVde4105 = "";
var isVde0126 = "";
var isTor     = "";
var isEstonia = "";
var isGridLoss = true;





// Get CurrentState (Verify if inverter is working)

var previousLogtime = null;

function step1() {

    $.get({
        url: "api.php?get=currentstate",
        error: () => { setTimeout(step1, 5000); },
        success: (json) => {
            console.log(json);
            if(!json || typeof json != "object" || !json.hasOwnProperty("logtime")) {
                setTimeout(step1, 5000);
                return;
            }
            var curtime   = moment.utc().subtract(1, "minute").format("YYYY-MM-DD hh:mm:ss");
            var isWorking = moment(json["logtime"]).isAfter(moment(curtime));
            if(!isWorking) {
                if(previousLogtime == null) previousLogtime = json["logtime"];
                else if(previousLogtime != json["logtime"]) alert("Error! PC or LiveX/EMX time/timezone not set correctly.");
                setTimeout(step1, 5000);
                return;
            }
            // Update Variables
            isGridLoss = false;
            if(json.hasOwnProperty("273") && json["273"].hasOwnProperty("1") && json["273"]["1"] < 18400) isGridLoss = true;
            if(json.hasOwnProperty("274") && json["274"].hasOwnProperty("1") && json["274"]["1"] < 18400) isGridLoss = true;
            if(json.hasOwnProperty("275") && json["275"].hasOwnProperty("1") && json["275"]["1"] < 18400) isGridLoss = true;
            // Continue Next Step
            step2();
        }
    });

}





// Get Inverter Serial-Number

function step2() {

    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E001. Please refresh the page! (Error while reading settings table from local database)"); },
        success: (json) => {
            console.log(json);
            if(!json || typeof json != "object" || !json.hasOwnProperty("Inverter") || !json["Inverter"].hasOwnProperty("1") || !json["Inverter"].hasOwnProperty("2"))
                return alert("E002. Please refresh the page! (Missing or malformed data in local settings table)");
            var inverter_model = json["Inverter"]["1"]["s1"];
            var serial_number = json["Inverter"]["2"]["s1"];
            inverterModel = inverter_model;
            $(".serialnumber b").html(serial_number);
            if(inverter_model == "10001") {
                $("#inverterDetected h1 .model").html("h5");
                $("#inverterDetected img").attr("src", "img/device_batterx_h5.png");
            } else if(inverter_model == "10002") {
                $("#inverterDetected h1 .model").html("h10");
                $("#inverterDetected img").attr("src", "img/device_batterx_h10.png");
            } else if(inverter_model >= "11000") {
                $("#inverterDetected h1 .model").html("i-Series");
                $("#inverterDetected img").attr("src", "img/device_batterx_i.png");
            } else {
                $("#inverterDetected h1 .model").html("");
                $("#inverterDetected img").attr("src", "");
            }
            // Continue Next Step
            step3(json);
        }
    });

}





// Check if Inverter registered in Cloud & Show Working Status

function step3(json) {

    var serial_number = json["Inverter"]["2"]["s1"];

    $.post({
        url: "https://api.batterx.app/v2/install.php",
        data: {
            action: "verify_device",
            serialnumber: serial_number
        },
        error: () => { alert("E003. Please refresh the page! (Error while verifying device serialnumber in cloud)"); },
        success: (response) => {
            // Show Not Registered
            if(response != "1") {
                $(".notif").removeClass("loading error success").addClass("error");
                $(".message").html(lang.system_detect.inverter_not_registered + "<br>" + "(S/N: " + serial_number + ")").css("color", "red");
                return;
            }
            // Show Working
            $("#inverterUnknown").addClass("d-none");
            $("#inverterDetected").removeClass("d-none");
            // Continue Next Step
            step4(json);
        }
    });

}





// Show Certificate Status

function step4(json) {

    // Log Response
    console.log(json);

    // Check If MachineModel Exists
    if(!json["Inverter"].hasOwnProperty("201"))
        return alert("Please wait one minute, then refresh the page!");

    // Populate machineModelSelect with available values
    try {
        var availableGridStandards = json["Inverter"]["201"]["s2"];
        if(availableGridStandards != "") {
            var tempArr = JSON.parse(availableGridStandards);
            var options = "";
            tempArr.forEach(item => {
                if(objGridStandards.hasOwnProperty(item.toString()))
                    options += `<option value="${item}">${objGridStandards[item.toString()]}</option>`;
                else
                    options += `<option value="${item}">${item}</option>`
            });
            $("#machineModelSelect").html(options);
        }
    } catch(error) {
        console.log("There are no grid standards available for setting up!");
    }

    // Get Machine Model
    gridStandard = json["Inverter"]["201"]["s1"];
    isVde4105 = gridStandard == "2" ? "1" : "0";
    isVde0126 = gridStandard == "1" ? "1" : "0";
    isTor     = gridStandard == "3" ? "1" : "0";
    isEstonia = gridStandard == "9" ? "1" : "0";

    $("#germanyMachineModelSelect").val(gridStandard).trigger("change");
    $("#machineModelSelect").val(gridStandard).trigger("change");
    $("#modalConfirmDeviceStandardValue").text(objGridStandards[gridStandard]);

    // Germany (2=VDE4105 | 1=VDE0126)
    if(installationCountry == "de") {
        $(".standard").text("VDE4105");
        // Show Status
        if(isVde4105 != "1" && isVde0126 != "1") {
            $(".standard").css("color", "red");
            $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#machineModelBox").removeClass("d-none");
        } else {
            if(isVde4105 == "1") {
                $(".standard").css("color", "#28a745");
                $(".cert-status").removeClass("loading error success").addClass("success").css("display", "block");
            } else {
                $(".standard").css("color", "red");
                $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            }
            $(`#germanyMachineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#germanyMachineModelBox").removeClass("d-none");
        }
    }
    // Austria (3=TOR)
    else if(installationCountry == "at") {
        $(".standard").text("TOR");
        // Show Status
        if(isTor != "1") {
            $(".standard").css("color", "red");
            $(".cert-status").removeClass("loading error success").addClass("error").css("display", "block");
            $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
            $("#machineModelBox").removeClass("d-none");
        } else {
            $(".standard").css("color", "#28a745");
            $(".cert-status").removeClass("loading error success").addClass("success").css("display", "block");
        }
    }
    // Other
    else {
        // Show Status
        $(".standard").css("color", "black").html(`${objGridStandards.hasOwnProperty(gridStandard) ? objGridStandards[gridStandard] : '-'}`);
        $(".cert-status").addClass("d-none");
        $("#machineModelSelect").removeClass("border-danger").addClass("border-secondary");
        $(`#machineModelSelect option[value="${gridStandard}"]`).append("*");
        $("#machineModelBtn").removeClass("btn-danger").addClass("btn-secondary");
        $("#machineModelBox").removeClass("d-none");
    }

    // Store Certificate Variable
    $.post({
        url: "cmd/session.php",
        data: {
            vde4105: isVde4105,
            tor:     isTor,
            estonia: isEstonia
        },
        error: () => { alert("E006. Please refresh the page! (Error while saving data to session)"); },
        success: (response) => {
            console.log(response);
            if(response === "1") $("#btn_next").attr("disabled", false);
            else alert("E007. Please refresh the page! (Bad response while saving data to session)");
        }
    });

}





// MachineModel Select

$("#germanyMachineModelSelect").on("input change", function() {
    if($(this).val() == gridStandard || isGridLoss)
        $("#germanyMachineModelBtn").prop("disabled", true);
    else
        $("#germanyMachineModelBtn").prop("disabled", false);
});

$("#machineModelSelect").on("input change", function() {
    if($(this).val() == gridStandard || isGridLoss)
        $("#machineModelBtn").prop("disabled", true);
    else
        $("#machineModelBtn").prop("disabled", false);
});





// Button MachineModel onClick

$("#germanyMachineModelBtn").on("click", () => {
    $("#machineModelSelect").val($("#germanyMachineModelSelect").val());
    $("#machineModelBtn").trigger("click");
});

$("#machineModelBtn").on("click", () => {
    // Switch to Selected MachineModel
    $.get({
        url: "api.php?set=command&type=24064&entity=201&text2=" + $("#machineModelSelect").val(),
        error: () => { alert("E008. Please refresh the page! (Error while writing command to local database)"); },
        success: () => {
            $("#germanyMachineModelBox").hide();
            $("#machineModelBox").hide();
            $("#btn_next").attr("disabled", true);
            $(".cert-loading").css("display", "block");
            checkParameters();
        }
    });
});

var deviceDatetime = "";
function checkParameters() {
    $.get({
        url: "api.php?get=settings",
        error: () => { alert("E009. Please refresh the page! (Error while reading local settings table)"); },
        success: (response) => {
            console.log(response);
            if(!response || typeof response != "object" || !response.hasOwnProperty("Inverter"))
                return alert("E010. Please refresh the page! (Missing or malformed data in local settings table)");
            response = response["Inverter"];
            if(deviceDatetime == "") { deviceDatetime = response["10"]["s1"]; setTimeout(checkParameters, 5000); return; }
            if(response["10"]["s1"] == deviceDatetime) { setTimeout(checkParameters, 5000); return; }
            location.reload();
        }
    });
}





// Button Next On-Click

$("#btn_next").on("click", () => {
        
    // Show Confirmation Modal IF Germany Without VDE4105
    if(installationCountry == "de" && isVde4105 != "1") {
        $("#modalConfirmDeviceStandard").modal("show");
        $("#modalConfirmDeviceStandardBtn").unbind().on("click", () => {
            setTimeout(() => { window.location.href = "system_setup.php"; }, 1000);
            $("#modalConfirmDeviceStandard").modal("hide");
        });
    }
    // Else Continue To Next Page
    else {
        setTimeout(() => { window.location.href = "system_setup.php"; }, 1000);
    }

});
