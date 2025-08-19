$progress.trigger("step", 1);





var newVersion = softwareVersion;

var checkUpdateInterval;





function performUpdate() {

    $.get({
        url: "https://api.batterx.app",
        dataType: "text",
        cache: false,
        error: () => {
            // Connection Lost
            $("#notif").removeClass("loading error success").addClass("error");
            $("#message").html(lang.software_update.no_internet_connection).css("color", "red");
            $("#errorInfo").removeClass("d-none");
            setTimeout(performUpdate, 5000); // Retry after 5 seconds
        },
        success: () => {

            // Search for Updates
            $("#notif").removeClass("loading error success").addClass("loading");
            $("#message").html(lang.software_update.searching_for_updates).css("color", "black");
            $("#errorInfo").addClass("d-none");

            // Get Latest Version Number
            $.get({
                url: repositoryVersionLink,
                dataType: "text",
                cache: false,
                error: () => {
                    $("#notif").removeClass("loading error success").addClass("error");
                    $("#message").html(lang.software_update.no_internet_connection).css("color", "red");
                    $("#errorInfo").removeClass("d-none");
                    setTimeout(performUpdate, 5000);
                },
                success: (versionNum) => {

                    // Compare Versions
                    if(softwareVersion != versionNum) {
                        newVersion = versionNum;
                        // Download Update
                        $.post("cmd/update.php");
                        // Downloading Update...
                        $("#message").html(lang.software_update.downloading_update);
                        clearInterval(checkUpdateInterval);
                        checkUpdateInterval = undefined;
                        checkUpdateInterval = setInterval(checkUpdate_waitForError, 5000);
                        showUpdateProgress();
                    } else {
                        // Update Completed
                        $("#notif").removeClass("loading error success").addClass("success");
                        $("#message").html(lang.software_update.update_completed).css("color", "#28a745");
                        $("#btn_next").attr("disabled", false);
                        setTimeout(() => { window.location.href = "installer_login.php?software_version=" + newVersion; }, 5000);
                    }

                }
            });

        }
    });

}

performUpdate();





function checkUpdate_waitForError() {
    $.get({
        url: "cmd/working.txt",
        cache: false,
        timeout: 5000,
        error: () => {
            // Rebooting...
            $("#message").html(lang.software_update.rebooting);
            clearInterval(checkUpdateInterval);
            checkUpdateInterval = undefined;
            checkUpdateInterval = setInterval(checkUpdate_waitForSuccess, 5000);
        },
        success: (response) => {
            if(response) return;
            // Rebooting...
            $("#message").html(lang.software_update.rebooting);
            clearInterval(checkUpdateInterval);
            checkUpdateInterval = undefined;
            checkUpdateInterval = setInterval(checkUpdate_waitForSuccess, 5000);
        }
    });
}

function checkUpdate_waitForSuccess() {
    $.get({
        url: "cmd/working.txt",
        cache: false,
        timeout: 5000,
        success: (response) => {
            if(!response) return;
            // Finishing Update...
            $("#message").html(lang.software_update.finishing_update);
            clearInterval(checkUpdateInterval);
            checkUpdateInterval = undefined;
            setTimeout(() => {
                // Update Completed
                $("#notif").removeClass("loading error success").addClass("success");
                $("#message").html(lang.software_update.update_completed).css("color", "#28a745");
                $("#btn_next").attr("disabled", false);
                setTimeout(() => { window.location.href = "installer_login.php?software_version=" + newVersion; }, 5000);
            }, 60000);
        }
    });
}





let updateSize = 0; // Load from GitHub (Size in MB)

function showUpdateProgress() {
    $.get({
        url: repositorySizeLink,
        dataType: "text",
        cache: false,
        error: () => {
            setTimeout(showUpdateProgress, 5000);
        },
        success: (size) => {
            updateSize = size;
            updateProgress();
            setInterval(updateProgress, 5000);
        }
    });
}

function updateProgress() {
    if(updateSize > 0) {
        $.get({
            url: "cmd/updatesize.php",
            cache: false,
            error: () => {
                // TODO: Maybe we can use this to show that it's rebooting? instead of the working.txt file
            },
            success: (response) => {
                if(!response) return;
                let total = parseInt(updateSize) * 1048576 // MB = 2^20
                let current = parseInt(response);
                if(current > total) current = total;
                $("#downloadProgress").html(`${Math.round(current / 1048576)} / ${Math.round(total / 1048576)} MB (${Math.min(100, Math.round(current / total * 100))} %)`);
            }
        });
    }
}





$("#btn_next").on("click", () => { window.location.href = "installer_login.php?software_version=" + newVersion; });
