<?php

// Include Base
include_once "common/base.php";

// Make sure it's liveX software
if($boxType != "livex") {
    http_response_code(404);
    echo "404 - Page Not Found";
    exit();
}

// Get List with available SSIDs
$ssidArr = shell_exec('sudo iwlist wlan0 scan|grep SSID');
$ssidArr = preg_split("/\r\n|\n|\r/", trim($ssidArr));
foreach ($ssidArr as $key => $value) {
    $value = trim($value);
    if(preg_match('/"(.*?)"/', $value, $match) == 1)
        $ssidArr[$key] = $match[1];
    if($ssidArr[$key] == "")
        unset($ssidArr[$key]);
}

// Disconnect current WiFi network on POST
if(isset($_POST['disconnect']) && $_POST['disconnect'] == "1")
{
    // 1) Remove All WiFi Networks
    exec('sudo sed -i -e \'/network={/,$d\' /etc/wpa_supplicant/wpa_supplicant.conf');
    // 2) Restart Services
    exec('sudo systemctl daemon-reload; sudo systemctl restart dhcpcd');
    // 3) Sleep for 15 seconds
    sleep(15);
}

// Connect to selected WiFi on POST
if(isset($_POST['ssid_name']) && isset($_POST['ssid_password']))
{
    $ssid = $_POST['ssid_name'    ]; $ssid = str_replace('"', '\\"', $ssid);
    $psk  = $_POST['ssid_password']; $psk  = str_replace('"', '\\"', $psk );

    // 1) Remove All WiFi Networks
    exec('sudo sed -i -e \'/network={/,$d\' /etc/wpa_supplicant/wpa_supplicant.conf');
    // 2) Add New WiFi Network
    exec("sudo sed -i -e \"\\\$anetwork={\\nssid=\\\"" . $ssid . "\\\"\\npsk=\\\"" . $psk . "\\\"\\n}\" /etc/wpa_supplicant/wpa_supplicant.conf");
    // 3) Restart Services
    exec('sudo systemctl daemon-reload; sudo systemctl restart dhcpcd');
    // 4) Sleep for 15 seconds
    sleep(15);
}

// Show if connected to Wi-Fi or not
$connectedTo = trim(shell_exec('iwgetid'));
if(preg_match('/"(.*?)"/', $connectedTo, $match) == 1)
    $connectedTo = $match[1];

?>




<!DOCTYPE html>

<html>

    <head>

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <meta name="author" content="Ivan Gavrilov">
        <link rel="icon" href="img/favicon.png">

        <title>batterX liveX</title>

        <link rel="stylesheet" href="css/bundle.css?v=<?php echo $versionHash; ?>">
        <link rel="stylesheet" href="css/common.css?v=<?php echo $versionHash; ?>">

        <style>
            body {
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 0;
            }
            .connect-box,
            .active-box {
                width: 20rem;
                background: #ffffff;
            }
        </style>

    </head>

    <body class="py-5">

        <?php if($connectedTo != ""): ?>
            <div class="card active-box p-3 mb-3">
                <form method="post" autocomplete="off">
                    <input type="hidden" name="disconnect" value="1">
                    <div class="alert alert-success text-center w-100 p-3 m-0">
                        <p class="mb-3">Connected to <b><?php echo $connectedTo; ?></b></p>
                        <button type="submit" class="btn btn-danger btn-sm ripple" style="font-size: 0.75rem">DISCONNECT</button>
                    </div>
                </form>
            </div>
        <?php elseif(isset($_POST['ssid_name']) && isset($_POST['ssid_password'])): ?>
            <div class="card active-box p-3 mb-3">
                <div class="alert alert-danger text-center w-100 p-3 m-0">
                    Connection Problem<br>Please try again!
                </div>
            </div>
        <?php endif; ?>

        <div class="card connect-box p-5">
            <form id="wifi_connect_form" method="post" autocomplete="off">
                <h1 class="h3 text-center m-0">Connect to Wi-Fi</h1>
                <select id="ssid_name" name="ssid_name" class="form-select font-monospace mt-5" autocomplete="off" required>
                    <?php foreach ($ssidArr as $key => $value) { echo '<option value="' . htmlspecialchars($value) . '">' . htmlspecialchars($value) . '</option>'; } ?>
                </select>
                <input id="ssid_password" name="ssid_password" type="password" class="form-control font-monospace mt-4" placeholder="Password" autocomplete="off" required>
                <button type="submit" class="btn btn-success d-block w-100 font-monospace mt-4 ripple">CONNECT</button>
                <div class="progress mt-4" style="height:38px;border-radius:.25rem;display:none">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" style="width:0%"></div>
                </div>
            </form>
        </div>

        <script src="js/bundle.js?v=<?php echo $versionHash; ?>"></script>
        <script src="js/common.js?v=<?php echo $versionHash; ?>"></script>

        <script>
            $('#wifi_connect_form').on('submit', () => {
                $('#wifi_connect_form button').attr('disabled', true).hide();
                $('#wifi_connect_form .progress').show();
                var currentValue = 0;
                setInterval(() => {
                    currentValue = currentValue > 99 ? currentValue : currentValue + 1;
                    $('#wifi_connect_form .progress .progress-bar').css('width', currentValue + '%');
                }, 150);
            });
        </script>

    </body>

</html>
