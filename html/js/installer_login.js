let canContinue = false;
let isLoggedIn  = false;

function updateLoginButton() {
    const email = $("#email").val().trim().toLowerCase();
    const pass  = $("#password").val().trim();
    $("#btn_login").prop("disabled", !email || !pass || !validateEmail(email) || !canContinue);
}

async function checkVersion() {
    try {
        const versionNum = await $.get({ url: repositoryVersionLink, dataType: "text", cache: false });
        if(softwareVersion !== versionNum.trim()) {
            window.location.href = "software_update.php";
            return;
        }
    } catch {
        // Can't reach repo — allow login anyway
    }
    canContinue = true;
    updateLoginButton();
}

async function doLogin() {
    if(isLoggedIn) {
        window.location.href = "customer_info.php";
        return;
    }

    const email = $("#email").val().trim().toLowerCase();
    const pass  = $("#password").val();

    if(!email || !pass || !validateEmail(email)) return;

    $("#btn_login").prop("disabled", true);
    $("#errorMsg, #warningMsg").addClass("d-none");

    try {
        const response = await $.post({
            url: "https://api.batterx.app/v2/install.php",
            data: {
                action:   "installer_login",
                email:    email,
                password: pass,
                apikey:   apikey
            }
        });

        if(!response || typeof response !== "object") {
            $("#errorMsg").removeClass("d-none");
            updateLoginButton();
            return;
        }

        const correctInstaller = !response.hasOwnProperty("correct_installer") || response.correct_installer !== false;

        let sessionResponse;
        try {
            sessionResponse = await $.post({
                url: "cmd/session.php",
                data: {
                    installer_email:     email,
                    installer_password:  pass,
                    installer_gender:    response.gender     ?? "0",
                    installer_firstname: response.firstname  ?? "",
                    installer_lastname:  response.lastname   ?? "",
                    installer_company:   response.company    ?? "",
                    installer_telephone: response.telephone  ?? "",
                    installer_country:   response.country    ?? ""
                }
            });
        } catch {
            alert("E002. Please refresh the page! (Error while saving data to session)");
            updateLoginButton();
            return;
        }

        if(sessionResponse !== "1") {
            alert("E003. Please refresh the page! (Bad response while saving data to session)");
            updateLoginButton();
            return;
        }

        if(correctInstaller) {
            window.location.href = "customer_info.php";
        } else {
            $("#warningMsg").removeClass("d-none");
            isLoggedIn = true;
            updateLoginButton();
        }

    } catch {
        alert("E001. Please refresh the page! (Error during cloud installer login process)");
        updateLoginButton();
    }
}

$("#btn_toggle_password").on("click", () => {
    const $input = $("#password");
    const $icon  = $("#btn_toggle_password i");
    if($input.attr("type") === "password") {
        $input.attr("type", "text");
        $icon.removeClass("bi-eye").addClass("bi-eye-slash");
    } else {
        $input.attr("type", "password");
        $icon.removeClass("bi-eye-slash").addClass("bi-eye");
    }
});

$("#email, #password").on("input change", () => {
    isLoggedIn = false;
    updateLoginButton();
});

$("#loginForm").on("submit", (e) => {
    e.preventDefault();
    doLogin();
});

checkVersion();
updateLoginButton();
