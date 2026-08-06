// MARK: Translation Support

window.t = function(key, replacements) {
    if(typeof window.translations === 'undefined') return key;
    let text = window.translations[key] || key;
    if(replacements) {
        Object.keys(replacements).forEach(placeholder => {
            text = text.replace('{' + placeholder + '}', replacements[placeholder]);
        });
    }
    return text;
};




// MARK: Init Ripple

var init_ripple = () => { $.ripple({ ".ripple": { touchDelay: 300 } }); }

init_ripple();




// MARK: Utilities

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

function isLogtimeRecent(logtime, thresholdSeconds = 60) {
    const logtimeUnix = Math.floor(new Date(logtime.replace(" ", "T") + "Z").getTime() / 1000);
    return logtimeUnix > getServerTime() - thresholdSeconds;
}




// MARK: Tooltips

$(document).ready(() => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
});




// MARK: Keep Session Active

setInterval(() => {
    $.post({
        url: "cmd/session.php",
        error:   () => { console.log("Error: Keep Session Active"); },
        success: (response) => { console.log(response); }
    });
}, 60000);




// MARK: Alert Modal
// Replace alert("TEXT") with await _alert("TEXT")

function _alert(message) {

    return new Promise(resolve => {

        if(document.activeElement) document.activeElement.blur();

        message = message.replaceAll("\n", "<br>");

        var temp_id = "_alert" + Math.floor(Math.random() * 1000);

        var temp_modal = $(`
            <div id="${temp_id}" class="modal fade" style="z-index: 1057 !important">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content">
                        <div class="modal-body">${message}</div>
                    </div>
                </div>
            </div>
        `);

        $("body").append(temp_modal);

        $(`#${temp_id}`).on('show.bs.modal', function () {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "1056");
        });

        $(`#${temp_id}`).modal("show");

        $(`#${temp_id}`).on("hidden.bs.modal", () => {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "");
            $(`#${temp_id}`).remove();
            resolve();
        });

    });

}




// MARK: Confirm Modal
// Replace bool = confirm("TEXT") with await _confirm("TEXT")

function _confirm(message) {

    return new Promise(resolve => {

        if(document.activeElement) document.activeElement.blur();

        message = message.replaceAll("\n", "<br>");

        var temp_id = "_confirm" + Math.floor(Math.random() * 1000);

        var temp_modal = $(`
            <div id="${temp_id}" class="modal fade" style="z-index: 1057 !important">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content">
                        <div class="modal-body pb-0">${message}</div>
                        <div class="modal-footer border-top-0">
                            <button class="confirm btn btn-sm btn-success px-4 ripple">OK</button>
                            <button class="cancel btn btn-sm border ripple">CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $("body").append(temp_modal);

        $(`#${temp_id}`).on('show.bs.modal', function () {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "1056");
        });

        $(`#${temp_id}`).on("shown.bs.modal", () => {
            $(`#${temp_id} .confirm`).trigger("focus");
        });

        $(`#${temp_id}`).modal("show");

        var flag_sent = false;

        $(`#${temp_id} .confirm`).on("click", () => {
            $(`#${temp_id}`).modal("hide");
            if(!flag_sent) {
                flag_sent = true;
                resolve(true);
            }
        });

        $(`#${temp_id} .cancel`).on("click", () => {
            $(`#${temp_id}`).modal("hide");
            if(!flag_sent) {
                flag_sent = true;
                resolve(false);
            }
        });

        $(`#${temp_id}`).on("hidden.bs.modal", () => {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "");
            $(`#${temp_id}`).remove();
            if(!flag_sent) {
                flag_sent = true;
                resolve(false);
            }
        });

        init_ripple();

    });

}




// MARK: Prompt Dialog
// Replace str = prompt("TEXT") with await _prompt("TEXT")

function _prompt(message, options) {

    return new Promise(resolve => {

        if(!options) options = {};
        let _value       = options && options.hasOwnProperty("value"      ) ? options.value       : "";
        let _readonly    = options && options.hasOwnProperty("readonly"   ) ? options.readonly    : false;
        let _textarea    = options && options.hasOwnProperty("textarea"   ) ? options.textarea    : false;
        let _placeholder = options && options.hasOwnProperty("placeholder") ? options.placeholder : "";

        if(document.activeElement) document.activeElement.blur();

        message = message.replaceAll("\n", "<br>");

        var temp_id = "_prompt" + Math.floor(Math.random() * 1000);

        let html_input = "";
        if(_textarea)
            html_input = `<textarea class="form-control" placeholder="${_placeholder}" ${_readonly ? "readonly" : ""}>${_value}</textarea>`;
        else
            html_input = `<input type="text" class="form-control" placeholder="${_placeholder}" value="${_value}" ${_readonly ? "readonly" : ""}>`;

        var temp_modal = $(`
            <div id="${temp_id}" class="modal fade" style="z-index: 1057 !important">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content">
                        <div class="modal-body pb-0">
                            <p class="${message == "" ? "m-0" : ""}">${message}</p>
                            ${html_input}
                        </div>
                        <div class="modal-footer border-top-0">
                            <button class="confirm btn btn-sm btn-success px-4 ripple">OK</button>
                            <button class="cancel btn btn-sm border ripple">CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $("body").append(temp_modal);

        $(`#${temp_id}`).on('show.bs.modal', function () {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "1056");
        });

        $(`#${temp_id}`).on("shown.bs.modal", () => {
            $(`#${temp_id} .form-control`).trigger("focus");
        });

        $(`#${temp_id}`).modal("show");

        var flag_sent = false;

        $(`#${temp_id} .form-control`).on("keydown", (e) => {
            if(e.which == 13) {
                $(`#${temp_id}`).modal("hide");
                if(!flag_sent) { flag_sent = true; resolve($(`#${temp_id} .form-control`).val()); }
            }
        });

        $(`#${temp_id} .confirm`).on("click", () => {
            $(`#${temp_id}`).modal("hide");
            if(!flag_sent) { flag_sent = true; resolve($(`#${temp_id} .form-control`).val()); }
        });

        $(`#${temp_id} .cancel`).on("click", () => {
            $(`#${temp_id}`).modal("hide");
            if(!flag_sent) { flag_sent = true; resolve(null); }
        });

        $(`#${temp_id}`).on("hidden.bs.modal", () => {
            if($(".modal-backdrop").length > -1) $(".modal-backdrop:last").css("z-index", "");
            $(`#${temp_id}`).remove();
            if(!flag_sent) { flag_sent = true; resolve(null); }
        });

        init_ripple();

    });

}
