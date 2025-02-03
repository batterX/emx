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
    Device Models
*/

define("PNS_DEVICE", (array) [
    ""          => (array) [ "type" => ""              , "version" => 0 , "name" => ""                             ],
    "K800301"   => (array) [ "type" => "batterx_i"     , "version" => 1 , "name" => "batterX i10"                  ],
    "K800302"   => (array) [ "type" => "batterx_i"     , "version" => 1 , "name" => "batterX i15"                  ],
    "K800303"   => (array) [ "type" => "batterx_i"     , "version" => 1 , "name" => "batterX i20"                  ],
    "K800304"   => (array) [ "type" => "batterx_i"     , "version" => 1 , "name" => "batterX i30"                  ],
    "K010000-2" => (array) [ "type" => "batterx_h10"   , "version" => 2 , "name" => "batterX h10"                  ],
    "100384"    => (array) [ "type" => "batterx_h10"   , "version" => 1 , "name" => "batterX h10"                  ],
    "100339"    => (array) [ "type" => "batterx_h5"    , "version" => 1 , "name" => "batterX h5"                   ],
    "200468"    => (array) [ "type" => "batterx_h5000" , "version" => 1 , "name" => "batterX h5000"                ],
    "200310"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 10 KVA / 9 KW"    ],
    "100355"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 15 KVA / 13.5 KW" ],
    "100346"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 20 KVA / 18 KW"   ],
    "100350"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 30 KVA / 27 KW"   ],
    "100356"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 40 KVA / 36 KW"   ],
    "100366"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 60 KVA / 54 KW"   ],
    "100202"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 80 KVA / 72 KW"   ],
    "100203"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 100 KVA / 90 KW"  ],
    "100204"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 120 KVA / 108 KW" ],
    "100394"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 160 KVA / 144 KW" ],
    "100206"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 200 KVA / 180 KW" ],
    "100207"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 250 KVA / 225 KW" ],
    "100208"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 300 KVA / 270 KW" ],
    "100209"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 400 KVA / 360 KW" ],
    "100210"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 500 KVA / 450 KW" ],
    "200603"    => (array) [ "type" => "batterx_ups"   , "version" => 1 , "name" => "batterX UPS 600 KVA / 540 KW" ]
]);

define("PNS_BOX", (array) [
    ""          => (array) [ "type" => ""   , "version" => 0 , "name" => ""               ],
    "K800311"   => (array) [ "type" => "ie" , "version" => 1 , "name" => "batterX EMX"    ],
    "K800414-6" => (array) [ "type" => "xc" , "version" => 5 , "name" => "cliX 2.0"       ],
    "K800415-6" => (array) [ "type" => "xc" , "version" => 5 , "name" => "cliX 2.0"       ],
    "K800414-5" => (array) [ "type" => "xc" , "version" => 4 , "name" => "cliX 2.0"       ],
    "K800415-5" => (array) [ "type" => "xc" , "version" => 4 , "name" => "cliX 2.0"       ],
    "K800414-4" => (array) [ "type" => "xc" , "version" => 3 , "name" => "cliX 2.0"       ],
    "K800415-4" => (array) [ "type" => "xc" , "version" => 3 , "name" => "cliX 2.0"       ],
    "200414-21" => (array) [ "type" => "xc" , "version" => 2 , "name" => "cliX 2.0"       ],
    "200415-21" => (array) [ "type" => "xc" , "version" => 2 , "name" => "cliX 2.0"       ],
    "200414"    => (array) [ "type" => "xc" , "version" => 1 , "name" => "cliX 1.0"       ],
    "200415"    => (array) [ "type" => "xc" , "version" => 1 , "name" => "cliX 1.0"       ],
    "100408"    => (array) [ "type" => "xh" , "version" => 1 , "name" => "liveX home"     ],
    "100389"    => (array) [ "type" => "xb" , "version" => 1 , "name" => "liveX business" ],
    "200951"    => (array) [ "type" => "xt" , "version" => 1 , "name" => "traX 2"         ],
    "200950"    => (array) [ "type" => "xt" , "version" => 1 , "name" => "traX 1"         ]
]);





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

$softwareVersion = "v25.1.0";
