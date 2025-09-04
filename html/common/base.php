<?php

/*
    Included on begin of every main .php file
*/





/*
    Secure Session Cookie
*/

$cookieParams = session_get_cookie_params();
session_set_cookie_params($cookieParams["lifetime"], $cookieParams["path"], $cookieParams["domain"], false, true);





/*
    Start Session
*/

session_start();
session_regenerate_id();





/*
    Part Numbers
*/

function loadPartNumbers() {
    $url = 'https://api.batterx.app/v2/partnumbers.json';
    $jsonData = @file_get_contents($url);
    if($jsonData === FALSE) return [ "device" => [], "box" => [] ];
    $data = json_decode($jsonData, true);
    if(json_last_error() !== JSON_ERROR_NONE) return [ "device" => [], "box" => [] ];
    return $data;
}

$partNumbers = loadPartNumbers();

define("PNS_DEVICE", (array) $partNumbers['device']);
define("PNS_BOX", (array) $partNumbers['box']);





/*
    Load Language
*/

$_SESSION["lang"] = isset($_GET["lang"]) ? $_GET["lang"] : (isset($_SESSION["lang"]) ? $_SESSION["lang"] : "en");
if(!in_array($_SESSION["lang"], ["en", "de", "fr", "cs", "es"])) $_SESSION["lang"] = "en";

// Get Language Strings
$lang = file_get_contents("common/langs/" . $_SESSION["lang"] . ".json");
$lang = json_decode($lang, true);





/*
    Set Constant Variables
*/

$versionHash = time();

$boxType = "emx";

$softwareVersion = "v25.9.1";
