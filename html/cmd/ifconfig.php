<?php

session_start();

$output = shell_exec("ifconfig");

echo "<pre>" . $output . "</pre>";
