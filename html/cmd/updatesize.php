<?php

// Include Base
include_once "../common/base.php";

$cmd = $boxType == "livex" ? "du -s -B1 /home/pi/livesmart-home" : "du -s -B1 /home/pi/emx";

$output = trim(shell_exec($cmd));

if($output) {
    $output = explode("\t", $output);
    if(count($output) > 0) echo $output[0];
}
