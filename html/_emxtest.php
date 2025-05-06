<?php

/*
    Special Menu For Factory Testing
*/

// Include Base
include_once "common/base.php";

// Password Restricted Page
$secretPass = '$2y$10$QYvlEkra/hEHExIfbCytAOjhGYhsMKyvP.shug0qH4RMzqGIQwYhu';
if(empty($_POST["secretPass"]) || !password_verify($_POST["secretPass"], $secretPass)) {
    echo '
        <html>
            <head>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 90vh;
                        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";
                        color: black;
                        background: #f0f0f0;
                    }
                    form {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    h1 {
                        text-align: center;
                    }
                    input {
                        font-size: 1.25rem;
                        background: #ffffff;
                        color: black;
                        padding: 1rem 2rem;
                        border: 1px solid #aaaaaa;
                        border-radius: 4px;
                        text-align: center;
                    }
                    button {
                        background-color: #cccccc;
                        border: 1px solid #aaaaaa;
                        color: black;
                        padding: 0.75rem 3rem;
                        margin-top: 1.5rem;
                        text-align: center;
                        display: inline-block;
                        border-radius: 4px;
                        cursor: pointer;
                        text-transform: uppercase;
                        text-decoration: none;
                        font-size: 1.25rem;
                    }
                    button:hover {
                        background-color: #aaaaaa;
                    }
                </style>
            </head>
            <body>
                <form method="POST" action="'.$_SERVER['REQUEST_URI'].'">
                    <h1>Password Eingeben</h1>
                    <input type="password" name="secretPass" placeholder="Password Eingeben">
                    <button>Weiter</button>
                </form>
            </body>
        </html>
    ';
    exit();
}

// Get Apikey
$output = shell_exec("cat /proc/cpuinfo");
$find = "Serial";
$pos = strpos($output, $find);
$serial = substr($output, $pos + 10, 16);
$apikey = sha1(strval($serial));

?>










<!DOCTYPE html>

<html>

	<head>

		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="author" content="Ivan Gavrilov">

		<title>batterX Factory Test</title>

		<link rel="stylesheet" href="css/dist/bundle.css?v=<?php echo $versionHash ?>">
        <link rel="stylesheet" href="css/common.css?v=<?php echo $versionHash ?>">
		<link rel="stylesheet" href="css/_emxtest.css?v=<?php echo $versionHash ?>">

	</head>

	<body>

        <main class="container">










            <!-- Modals -->

            <div class="modal fade" id="modal_gpio_test" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-dialog-centered" style="max-width:120px">
                    <div class="modal-content modal-sm">
                        <div class="modal-body text-center">
                            <img class="img-fluid rounded" src="data:image/jpeg;base64,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"/>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modals -->










            <h1>EMX Update</h1>
            
            <div class="card p-4 elevate" id="emx_update">

                <div class="log"></div>
                
            </div>










            <h1>Emeter Test</h1>
            
            <div class="card p-4 elevate" id="emeter_test">

                <p class="step-info">Connect Energy Meter to the EMX, then press <u>Begin Test</u> below.</p>
                <button class="step-start btn btn-sm btn-primary w-40 w-md-20 ripple">Begin Test</button>

                <div class="log"></div>

            </div>










            <h1>GPIO Test</h1>
            
            <div class="card p-4 elevate" id="gpio_test">

                <p class="step-info">
                    Connect GPIO Outputs and Inputs together, then press <u>Begin Test</u> below.
                    <span class="badge badge-info info-popup" data-toggle="modal" data-target="#modal_gpio_test">INFO</span>
                </p>
                <button class="step-start btn btn-sm btn-primary w-40 w-md-20 ripple">Begin Test</button>

                <div class="step-content row m-0 p-0 d-none text-muted">
                    <div class="out1 col-3 text-center pb-3">Output 1</div>
                    <div class="out2 col-3 text-center pb-3">Output 2</div>
                    <div class="out3 col-3 text-center pb-3">Output 3</div>
                    <div class="out4 col-3 text-center pb-3">Output 4</div>
                    <div class="in1  col-3 text-center">Input 1</div>
                    <div class="in2  col-3 text-center">Input 2</div>
                    <div class="in3  col-3 text-center">Input 3</div>
                    <div class="in4  col-3 text-center">Input 4</div>
                </div>

                <div class="log"></div>

            </div>










            <h1>Generate Report</h1>
            
            <div class="card p-4 elevate" id="generate_report" style="overflow-x:auto">
                <div id="report" class="d-none">

                    <table class="table table-borderless mb-4">
                        <tbody>
                            <tr>
                                <td>Date</td>
                                <td id="report_date"><?php echo date('Y-m-d') ?></td>
                            </tr>
                            <tr>
                                <td>Apikey</td>
                                <td id="report_apikey"><?php echo $apikey ?></td>
                            </tr>
                            <tr>
                                <td>S/N</td>
                                <td><input id="report_sn" type="text" class="form-control-plaintext p-0" placeholder="Type here…"></td>
                            </tr>
                            <tr>
                                <td>Software</td>
                                <td id="report_software"><?php echo $softwareVersion ?></td>
                            </tr>
                            <tr>
                                <td>Passed Tests</td>
                                <td id="report_tests">
                                    EMX Update<br>
                                    Inverter Communication<br>
                                    E.Meter Communication<br>
                                    GPIO Outputs & Inputs
                                </td>
                            </tr>
                            <tr>
                                <td>Note</td>
                                <td>
                                    <textarea id="report_note" class="form-control-plaintext p-0" placeholder="Type here…" rows="1" style="height:26px"></textarea>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div>
                        <button id="report_send" class="btn btn-success w-40 w-md-20 ripple">Send Report</button>
                        <button id="report_download" class="btn btn-primary w-40 w-md-20 ripple" disabled>Download</button>
                    </div>

                </div>
            </div>










            <h1>Finish Test / Shutdown EMX</h1>
            
            <div class="card p-4 elevate" id="finish_test">

                <div class="row p-0 m-0">
                    <div class="col-md-6 pl-4 pr-4">
                        <button id="finish_cleardb" class="btn btn-lg btn-primary w-100 ripple">Clear Database</button>
                    </div>
                    <div class="col-md-6 pl-4 pr-4 pt-3 pt-md-0">
                        <button id="finish_shutdown" class="btn btn-lg btn-danger w-100 ripple" disabled>Shutdown</button>
                    </div>
                </div>

            </div>










        </main>

		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
        <script>
            const softwareVersion = <?php echo json_encode($softwareVersion) ?>;
        </script>
		<script src="js/_emxtest.js?v=<?php echo $versionHash ?>"></script>

	</body>

</html>
