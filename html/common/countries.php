<?php

/*
    Country helpers.
    Requires base.php (provides $lang array).
    Defines renderCountrySelect($id, $selected, $label) and getTimezoneByCountry($country).
    When adding a new country, add it to the relevant code array AND the timezone switch.
*/

$_country_codes_europe = ["at","by","be","hr","cy","cz","dk","ee","fi","fr","ge","de","gr","hu","is","ie","it","lv","lt","lu","mt","md","nl","no","pl","pt","ro","ru","sk","si","es","se","ch","tr","ua","gb"];
$_country_codes_africa  = ["cd","gh","ci","ke","ng","re","sn","za","tg","tn","ug"];
$_country_codes_top     = ["de","at","be"];

function renderCountrySelect($id, $selected, $label) {
    global $lang, $_country_codes_top, $_country_codes_europe, $_country_codes_africa;

    $groupEurope = htmlspecialchars($lang["ci_countries_europe"] ?? "Europe",  ENT_QUOTES, "UTF-8");
    $groupAfrica = htmlspecialchars($lang["ci_countries_africa"] ?? "Africa",  ENT_QUOTES, "UTF-8");

    $html  = "<label for=\"$id\" class=\"form-label form-label-sm required\">" . htmlspecialchars($label, ENT_QUOTES, "UTF-8") . "</label>";
    $html .= "<select id=\"$id\" class=\"form-select\" required>";

    foreach($_country_codes_top as $code) {
        $name = htmlspecialchars($lang["country_$code"] ?? $code, ENT_QUOTES, "UTF-8");
        $sel  = $selected === $code ? " selected" : "";
        $html .= "<option value=\"$code\"$sel>$name</option>";
    }

    $html .= "<optgroup label=\"$groupEurope\">";
    foreach($_country_codes_europe as $code) {
        $name = htmlspecialchars($lang["country_$code"] ?? $code, ENT_QUOTES, "UTF-8");
        $sel  = $selected === $code ? " selected" : "";
        $html .= "<option value=\"$code\"$sel>$name</option>";
    }
    $html .= "</optgroup>";

    $html .= "<optgroup label=\"$groupAfrica\">";
    foreach($_country_codes_africa as $code) {
        $name = htmlspecialchars($lang["country_$code"] ?? $code, ENT_QUOTES, "UTF-8");
        $sel  = $selected === $code ? " selected" : "";
        $html .= "<option value=\"$code\"$sel>$name</option>";
    }
    $html .= "</optgroup>";

    $html .= "</select>";

    return $html;
}

function getTimezoneByCountry($country) {
    switch($country) {
        case 'at': return 'Europe/Vienna';
        case 'by': return 'Europe/Minsk';
        case 'be': return 'Europe/Brussels';
        case 'hr': return 'Europe/Zagreb';
        case 'cy': return 'Asia/Nicosia';
        case 'cz': return 'Europe/Prague';
        case 'dk': return 'Europe/Copenhagen';
        case 'ee': return 'Europe/Tallinn';
        case 'fi': return 'Europe/Helsinki';
        case 'fr': return 'Europe/Paris';
        case 'ge': return 'Asia/Tbilisi';
        case 'de': return 'Europe/Berlin';
        case 'gr': return 'Europe/Athens';
        case 'hu': return 'Europe/Budapest';
        case 'is': return 'Atlantic/Reykjavik';
        case 'ie': return 'Europe/Dublin';
        case 'it': return 'Europe/Rome';
        case 'lv': return 'Europe/Riga';
        case 'lt': return 'Europe/Vilnius';
        case 'lu': return 'Europe/Luxembourg';
        case 'mt': return 'Europe/Malta';
        case 'md': return 'Europe/Chisinau';
        case 'nl': return 'Europe/Amsterdam';
        case 'no': return 'Europe/Oslo';
        case 'pl': return 'Europe/Warsaw';
        case 'pt': return 'Europe/Lisbon';
        case 'ro': return 'Europe/Bucharest';
        case 'ru': return 'Europe/Moscow';
        case 'sk': return 'Europe/Bratislava';
        case 'si': return 'Europe/Ljubljana';
        case 'es': return 'Europe/Madrid';
        case 'se': return 'Europe/Stockholm';
        case 'ch': return 'Europe/Zurich';
        case 'tr': return 'Europe/Istanbul';
        case 'ua': return 'Europe/Kiev';
        case 'gb': return 'Europe/London';
        case 'cd': return 'Africa/Kinshasa';
        case 'gh': return 'Africa/Accra';
        case 'ci': return 'Africa/Abidjan';
        case 'ke': return 'Africa/Nairobi';
        case 'ng': return 'Africa/Lagos';
        case 're': return 'Indian/Reunion';
        case 'sn': return 'Africa/Dakar';
        case 'za': return 'Africa/Johannesburg';
        case 'tg': return 'Africa/Lome';
        case 'tn': return 'Africa/Tunis';
        case 'ug': return 'Africa/Kampala';
        default:   return 'Europe/Berlin';
    }
}
