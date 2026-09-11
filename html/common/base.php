<?php

/*
    Included on begin of every main .php file
*/




// MARK: Constants

$boxType         = "emx";
$softwareVersion = "v26.8.3";

$versionHash     = time();




// MARK: Initial Stuff

// Set character encoding to UTF-8
mb_internal_encoding("UTF-8");
mb_http_output("UTF-8");

// Secure Session Cookie
$cookieParams = session_get_cookie_params();
session_set_cookie_params($cookieParams["lifetime"], $cookieParams["path"], $cookieParams["domain"], false, true);

// Start Session
session_start();
session_regenerate_id();




// MARK: Part Numbers

function loadPartNumbers() {
    $url = 'https://api.batterx.app/v2/partnumbers.json';
    $jsonData = @file_get_contents($url);
    if($jsonData === FALSE) return [ "device" => [], "box" => [], "battery" => [], "bms" => [] ];
    $data = json_decode($jsonData, true);
    if(json_last_error() !== JSON_ERROR_NONE) return [ "device" => [], "box" => [], "battery" => [], "bms" => [] ];
    return $data;
}

$partNumbers = loadPartNumbers();

define("PNS_DEVICE", (array) $partNumbers['device']);
define("PNS_BOX", (array) $partNumbers['box']);
define("PNS_BATTERY", (array) $partNumbers['battery']);
define("PNS_BMS", (array) $partNumbers['bms']);




// MARK: Language

$_SESSION["lang"] = isset($_GET["lang"]) ? $_GET["lang"] : (isset($_SESSION["lang"]) ? $_SESSION["lang"] : "en");
if(!in_array($_SESSION["lang"], ["en", "de", "fr", "cs", "es"])) $_SESSION["lang"] = "en";

$lang_en   = json_decode(file_get_contents("common/langs/en.json"), true) ?? [];
$lang_curr = ($_SESSION["lang"] !== "en") ? (json_decode(file_get_contents("common/langs/" . $_SESSION["lang"] . ".json"), true) ?? []) : $lang_en;

$lang = array_merge($lang_en, $lang_curr);

function tRaw($key, $replacements = []) {
    global $lang;
    $text = $lang[$key] ?? $key;
    foreach($replacements as $placeholder => $value)
        $text = str_replace('{' . $placeholder . '}', $value, $text);
    return $text;
}

function t($key, $replacements = []) {
    return htmlspecialchars(tRaw($key, $replacements), ENT_QUOTES, 'UTF-8');
}




// MARK: Firmware Update Variables

$iArmLatestVersion        = ["09", "18"];
$iDspSmLatestVersion      = ["04", "04"];
$iDspLgLatestVersion      = ["06", "10"];
$iBmsLatestVersion        = ["95", "51"];
$iArmEstimatedDuration    = 5;
$iDspSmEstimatedDuration  = 8;
$iDspLgEstimatedDuration  = 8;
$iBmsEstimatedDuration    = 10;

$cMergedLatestVersion     = ["09", "06", "04", "45"]; // [aa, bb, cc, dd] → V1-{aa}{bb}-{cc}{dd}_H4100.bin
$cMergedEstimatedDuration = 8;
