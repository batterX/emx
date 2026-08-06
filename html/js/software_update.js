let newVersion   = softwareVersion;
let updateSize   = 0;
const retryDelay = 5;




// MARK: UI Helpers

function showLoading(msg) {
    $("#statusIcon").html('<div class="spinner-border text-success" role="status"></div>');
    $("#message").html(msg);
    $("#errorInfo").addClass("d-none");
    $("#retryCountdown").addClass("d-none");
}

async function showError(msg) {
    $("#statusIcon").html('<i class="bi bi-exclamation-circle-fill text-danger"></i>');
    $("#message").html(msg);
    $("#errorInfo").removeClass("d-none");
    // Show countdown
    let seconds = retryDelay;
    $("#retryCountdown").text(t("su_retrying_in", { seconds })).removeClass("d-none");
    for(let i = retryDelay - 1; i >= 0; i--) {
        await sleep(1000);
        $("#retryCountdown").text(t("su_retrying_in", { seconds: i }));
    }
    // Show loading for 2 seconds
    showLoading(t("su_retrying"));
    await sleep(1000);
}

function showSuccess(msg) {
    $("#statusIcon").html('<i class="bi bi-check-circle-fill text-success"></i>');
    $("#message").html(msg);
    $("#errorInfo").addClass("d-none");
}




// MARK: Update Flow

async function performUpdate() {

    // Check internet connection
    try {
        await $.get({ url: "https://api.batterx.app", dataType: "text", cache: false });
    } catch {
        await showError(t("su_no_internet"));
        return performUpdate();
    }

    // Search for updates
    showLoading(t("su_searching_updates"));
    await sleep(1000);

    let versionNum;
    try {
        versionNum = await $.get({ url: repositoryVersionLink, dataType: "text", cache: false });
        versionNum = versionNum.trim();
    } catch {
        await showError(t("su_no_internet"));
        return performUpdate();
    }

    if(softwareVersion !== versionNum) {

        // Start download (fire and forget)
        newVersion = versionNum;
        $.post("cmd/update.php");

        showLoading(t("su_downloading_update"));

        // Show download progress in background
        showUpdateProgress();

        await waitForReboot();
        await waitForReturn();

        showLoading(t("su_finishing_update"));
        $("#downloadProgress").addClass("d-none");

        for(let i = 60; i >= 1; i--) {
            $("#retryCountdown").text(t("su_finishing_in", { seconds: i })).removeClass("d-none");
            await sleep(1000);
        }
        $("#retryCountdown").addClass("d-none");
    }

    // Up to date or update complete
    showSuccess(t("su_update_completed"));
    $("#btn_next").removeClass("d-none");

    for(let i = 5; i >= 1; i--) {
        $("#retryCountdown").text(t("su_redirecting_in", { seconds: i })).removeClass("d-none");
        await sleep(1000);
    }

    $("#retryCountdown").text(t("su_redirecting"));

    window.location.href = "installer_login.php?software_version=" + newVersion;
}

async function showUpdateProgress() {
    while(true) {
        try {
            const size = await $.get({ url: repositorySizeLink, dataType: "text", cache: false });
            updateSize = parseInt(size);
            break;
        } catch {
            await sleep(5000);
        }
    }

    $("#downloadProgress").removeClass("d-none");

    while(true) {
        try {
            const response = await $.get({ url: "cmd/updatesize.php", cache: false });
            if(response && updateSize > 0) {
                const total   = updateSize * 1048576;
                const current = Math.min(parseInt(response), total);
                const percent = Math.min(100, Math.round(current / total * 100));
                $("#downloadProgress").html(`${Math.round(current / 1048576)} / ${Math.round(total / 1048576)} MB (${percent}%)`);
            }
        } catch {}
        await sleep(2000);
    }
}

async function waitForReboot() {
    while(true) {
        try {
            const response = await $.get({ url: "cmd/working.txt", cache: false, timeout: 5000 });
            if(!response) break;
        } catch {
            break;
        }
        await sleep(5000);
    }
    if(updateSize > 0) {
        const totalMB = Math.round(updateSize);
        $("#downloadProgress").html(`${totalMB} / ${totalMB} MB (100%)`);
    }
    showLoading(t("su_rebooting"));
}

async function waitForReturn() {
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




// MARK: Button

$("#btn_next").on("click", () => { window.location.href = "installer_login.php?software_version=" + newVersion; });

performUpdate();
