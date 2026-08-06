$("#lang_en").on("click", () => { window.location.href = "software_update.php?lang=en"; });
$("#lang_de").on("click", () => { window.location.href = "software_update.php?lang=de"; });
$("#lang_fr").on("click", () => { window.location.href = "software_update.php?lang=fr"; });
$("#lang_cs").on("click", () => { window.location.href = "software_update.php?lang=cs"; });
$("#lang_es").on("click", () => { window.location.href = "software_update.php?lang=es"; });

const selectLanguageArray = [
    "Select Language",
    "Sprache auswählen",
    "Choisir la langue",
    "Zvolte jazyk",
    "Seleccione el idioma"
];

let count = 0;
setInterval(() => {
    count++;
    $("h1").fadeOut(500, function() {
        $(this).text(selectLanguageArray[count % selectLanguageArray.length]).fadeIn(500);
    });
}, 2500);
