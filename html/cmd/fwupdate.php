<?php

session_start();

if(empty($_POST)) exit();

$fwActions = ["status", "start"];
$fwTypes = ["arm", "dsp-sm", "dsp-lg", "bms", "multi"];

if(!isset($_POST["action"]) || empty($_POST["action"])) exit();
if(!in_array($_POST["action"], $fwActions)) exit();

if($_POST["action"] == "start") {
    if(!isset($_POST["type"]) || empty($_POST["type"])) exit();
    if(!isset($_POST["version"]) || empty($_POST["version"])) exit();
    if(!in_array($_POST["type"], $fwTypes)) exit();
}

if($_POST["action"] == "status") {
    $jsonFilePath = '/srv/bx/ram/FWUpdate.json';
    if(!file_exists($jsonFilePath)) {
        echo "{}";
        exit();
    }
    $jsonContent = false;
    for($i = 0; $i < 3; $i++) {
        $jsonContent = file_get_contents($jsonFilePath);
        if($jsonContent !== false) break;
    }
    if($jsonContent === false) {
        echo "";
        exit();
    }
    echo $jsonContent;
    exit();
}

if($_POST["action"] == "start") {
    exec("pgrep -x FWUpdate", $processes, $grepReturnCode);
    if($grepReturnCode === 0 && !empty($processes)) {
        echo "1";
        exit();
    }
    $type = $_POST["type"];
    $version = $_POST["version"];
    $baseUrl = "https://api.batterx.app/special/firmware/i-series/";
    switch($type) {
        case "arm": $url = $baseUrl . "arm/WA0-00001-" . $version . ".bin"; break;
        case "bms": $url = $baseUrl . "bms/WA1-00003-00(00OLP_E1_2" . $version . "_EBS-C).bin"; break;
        case "dsp-lg": $url = $baseUrl . "dsp-lg/WDM-03200-" . $version . ".bin"; break;
        case "dsp-sm": $url = $baseUrl . "dsp-sm/WDM-03000-" . $version . ".bin"; break;
        case "multi": $url = $baseUrl . "multi/WA1-00003-00(00OLP_C1_" . $version . "_EBS-P).bin"; break;
        default: echo "0"; exit();
    }
    $command = "sudo nsenter -t 1 -m sh -c \"nohup /home/pi/FWUpdate " . escapeshellarg($url) . " > /dev/null 2>&1 &\" && sleep 5 && pgrep FWUpdate > /dev/null && echo 'FWUpdate_OK' || echo 'FWUpdate_NOK'";
    exec($command, $output, $returnCode);
    $result = !empty($output) ? trim(end($output)) : "";
    echo ($result === "FWUpdate_OK") ? "1" : "0";
    exit();
}
