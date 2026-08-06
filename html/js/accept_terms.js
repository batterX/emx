if (warrantyMd) {
    const $content = $("#warrantyContent");
    $content.html(marked.parse(warrantyMd));
    $content.find("table").addClass("table table-bordered table-sm");
    $content.removeClass("d-none");
    $("#acceptSection").removeClass("d-none");
} else {
    $("#warrantyErrorMessage").text(t("at_error"));
    $("#warrantyError").removeClass("d-none");
}

$("#checkboxAccept").on("change", function () {
    $("#btn_next").css("visibility", $(this).is(":checked") ? "visible" : "hidden");
});

$("#btn_next").on("click", () => {
    window.location.href = "installation_summary.php";
});

$("#btnRetry").on("click", () => {
    location.reload();
});
