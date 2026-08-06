<?php

session_start();

if(empty($_POST)) exit();
if(!isset($_POST["ip"])   || empty($_POST["ip"]))   exit();
if(!isset($_POST["port"]) || empty($_POST["port"])) exit();

$ip   = trim($_POST["ip"]);
$port = (int)$_POST["port"];

if(!filter_var($ip, FILTER_VALIDATE_IP)) { echo "0"; exit(); }
if($port < 1 || $port > 65535)           { echo "0"; exit(); }

$errno  = 0;
$errstr = "";
$fp = @fsockopen($ip, $port, $errno, $errstr, 5);
if($fp) {
    fclose($fp);
    echo "1";
} else {
    echo "0";
}
