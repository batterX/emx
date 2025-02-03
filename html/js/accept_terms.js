$progress.trigger("step", 7);

$("#checkboxAccept").on("click", function() {
	$("#btn_next").attr("disabled", !$(this).is(":checked"));
	$("#btn_next").on("click", () => { window.location.href = "installation_summary.php"; });
});
