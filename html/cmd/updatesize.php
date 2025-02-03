<?php

session_start();

$output = trim(shell_exec("du -s -B1 /home/pi/emx"));

if($output) {
    $output = explode("\t", $output);
    if(count($output) > 0) echo $output[0];
}
