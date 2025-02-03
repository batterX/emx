<?php

session_start();

$output = shell_exec("cat /proc/cpuinfo");
$find = "Serial";
$pos = strpos($output, $find);

$serial = substr($output, $pos + 10, 16);

$apikey = sha1(strval($serial));

$_SESSION["box_apikey"] = $apikey;

echo $apikey;
