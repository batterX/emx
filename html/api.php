<?php





header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, GET, POST");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");





// GET CurrentState

if(isset($_GET["get"]) && strtolower($_GET["get"]) == "currentstate") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/ram/currentD.db3");

	// Return single value from CurrentState table
	// ?get=currentstate&type=273&entity=1
	if(isset($_GET["type"]) && isset($_GET["entity"])) {
		$sql = "SELECT type, entity, entityvalue, logtime FROM CurrentState WHERE type = :type AND entity = :entity AND logtime > DATETIME(CURRENT_TIMESTAMP, '-5 minutes')";
		if($stmt = $db->prepare($sql)) {
			$stmt->bindParam(":type", $_GET["type"], PDO::PARAM_INT);
			$stmt->bindParam(":entity", $_GET["entity"], PDO::PARAM_INT);
			$stmt->execute();
			$row = $stmt->fetch();
			echo $row["entityvalue"];
		}
	}

	// Returns the full CurrentState table
	// ?get=currentstate
	else {
		$result = $db->query("SELECT type, entity, entityvalue, logtime FROM CurrentState", PDO::FETCH_ASSOC);
		$dbh = new stdClass();
		foreach($result as $row) {
			$type = (string) $row["type"];
			$entity = (string) $row["entity"];
			if(!isset($dbh->$type)) $dbh->$type = new stdClass();
			$dbh->$type->$entity = intval($row["entityvalue"]);
			$dbh->logtime = (string) $row["logtime"];
		}
		header("Content-Type: application/json");
		echo json_encode($dbh, JSON_FORCE_OBJECT);
	}

}





// GET Warnings

else if(isset($_GET["get"]) && strtolower($_GET["get"]) == "warnings") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/usv.db3");

	// Return JSON Object with all warnings since YYYYMMDD
	// ?get=warnings&from=YYYYMMDD
	if(isset($_GET["from"])) {
		if(strlen($_GET["from"]) != 8) exit();
		$from = substr($_GET["from"], 0, 4) . "-" . substr($_GET["from"], 4, 2) . "-" . substr($_GET["from"], 6, 2) . " 00:00:00";
		$sql = "SELECT * FROM (SELECT id, value, logtime FROM WarningsData WHERE logtime > :logtime ORDER BY id DESC) ORDER BY id ASC";
		if($stmt = $db->prepare($sql)) {
			$stmt->bindParam(":logtime", $from, PDO::PARAM_STR);
			$stmt->execute();
			$array = (array) [];
			foreach($stmt as $row) {
				$values = (array) [];
				if(trim($row["value"]))
					$values = array_map("intval", explode(" ", str_replace("  ", " ", trim($row["value"]))));
				$logtime = (string) $row["logtime"];
				$array[] = array($logtime, $values);
			}
			header("Content-Type: application/json");
			echo json_encode($array);
		}
	}

	// Returns JSON Object with the latest X entries from the Warnings Table
	// ?get=warnings&count=5
	else {
		$count = "1";
		if(isset($_GET["count"]) && ctype_digit($_GET["count"])) $count = $_GET["count"];
		$result = $db->query("SELECT * FROM (SELECT id, value, logtime FROM WarningsData ORDER BY id DESC LIMIT " . $count . ") ORDER BY id ASC", PDO::FETCH_ASSOC);
		$array = (array) [];
		foreach($result as $row) {
			$values = (array) [];
			if(trim($row["value"]))
				$values = array_map("intval", explode(" ", str_replace("  ", " ", trim($row["value"]))));
			$logtime = (string) $row["logtime"];
			$array[] = array($logtime, $values);
		}
		header("Content-Type: application/json");
		echo json_encode($array);
	}

}





// GET History

else if(isset($_GET["get"]) && strtolower($_GET["get"]) == "history") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/usv.db3");

	// Returns History for Selected Range
	// ?get=history&from=YYYYMMDD
	// ?get=history&from=YYYYMMDD&to=YYYYMMDD
	if(!isset($_GET["to"])) $_GET["to"] = date("Ymd", strtotime("+1 day"));
	if(isset($_GET["from"]) && isset($_GET["to"]) && strlen($_GET["from"]) == 8 && strlen($_GET["to"]) == 8) {
		$from = substr($_GET["from"], 0, 4) . "-" . substr($_GET["from"], 4, 2) . "-" . substr($_GET["from"], 6, 2);
		$to   = substr($_GET["to"  ], 0, 4) . "-" . substr($_GET["to"  ], 4, 2) . "-" . substr($_GET["to"  ], 6, 2);
		$result = $db->query('SELECT * FROM History WHERE logtime > "' . $from . ' 00:00:00" AND logtime < "' . $to . ' 23:59:59"', PDO::FETCH_ASSOC);
		$arr = (array) [];
		foreach($result as $row) {
			$arr[] = [
				$row["logtime"],
				$row["battery_voltage_minus"] === null ? null : intval($row["battery_voltage_minus"]),
				$row["battery_voltage_plus" ] === null ? null : intval($row["battery_voltage_plus" ]),
				$row["battery_level_minus"  ] === null ? null : intval($row["battery_level_minus"  ]),
				$row["battery_level_plus"   ] === null ? null : intval($row["battery_level_plus"   ]),
				$row["battery_power_from"   ] === null ? null : intval($row["battery_power_from"   ]),
				$row["battery_power_to"     ] === null ? null : intval($row["battery_power_to"     ]),
				$row["input_power_from"     ] === null ? null : intval($row["input_power_from"     ]),
				$row["input_power_to"       ] === null ? null : intval($row["input_power_to"       ]),
				$row["grid_power_from"      ] === null ? null : intval($row["grid_power_from"      ]),
				$row["grid_power_to"        ] === null ? null : intval($row["grid_power_to"        ]),
				$row["load_power"           ] === null ? null : intval($row["load_power"           ]),
				$row["house_power"          ] === null ? null : intval($row["house_power"          ]),
				$row["solar_power"          ] === null ? null : intval($row["solar_power"          ]),
				$row["extsol_power"         ] === null ? null : intval($row["extsol_power"         ]),
				$row["gridsol_power"        ] === null ? null : intval($row["gridsol_power"        ]),
				$row["extstor_power_from"   ] === null ? null : intval($row["extstor_power_from"   ]),
				$row["extstor_power_to"     ] === null ? null : intval($row["extstor_power_to"     ])
			];
		}
		header("Content-Type: application/json");
		echo json_encode($arr);
	}

}





// GET Settings

else if(isset($_GET["get"]) && strtolower($_GET["get"]) == "settings") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/usv.db3");

	// Returns the full Settings table
	// ?get=settings
	$result = $db->query("SELECT VarName, entity, Name, InUse, Mode, V1, V2, V3, V4, V5, V6, S1, S2, UpDateTime FROM Settings", PDO::FETCH_ASSOC);
	$dbh = new stdClass();
	foreach($result as $row) {
		$VarName = (string) $row["VarName"];
		$entity = (string) $row["entity"];
		if(!isset($dbh->$VarName)) $dbh->$VarName = new stdClass();
		$dbh->$VarName->$entity = (array) [
			"varname"    => $row["VarName"   ],
			"entity"     => $row["entity"    ] === null ? null : intval($row["entity"]),
			"name"       => $row["Name"      ] === null ? null :        $row["Name"  ] ,
			"inuse"      => $row["InUse"     ] === null ? null : intval($row["InUse" ]),
			"mode"       => $row["Mode"      ] === null ? null : intval($row["Mode"  ]),
			"v1"         => $row["V1"        ] === null ? null : intval($row["V1"    ]),
			"v2"         => $row["V2"        ] === null ? null : intval($row["V2"    ]),
			"v3"         => $row["V3"        ] === null ? null : intval($row["V3"    ]),
			"v4"         => $row["V4"        ] === null ? null : intval($row["V4"    ]),
			"v5"         => $row["V5"        ] === null ? null : intval($row["V5"    ]),
			"v6"         => $row["V6"        ] === null ? null : intval($row["V6"    ]),
			"s1"         => $row["S1"        ] === null ? null :        $row["S1"    ] ,
			"s2"         => $row["S2"        ] === null ? null :        $row["S2"    ] ,
			"updatetime" => $row["UpDateTime"]
		];
	}

	header("Content-Type: application/json");
	echo json_encode($dbh, JSON_FORCE_OBJECT);

}





// SET Command

else if(isset($_GET["set"]) && strtolower($_GET["set"]) == "command") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/ram/currentC.db3");

	// Build Command
	$type = ""; $entity = "0"; $text1 = ""; $text2 = "";
	if(isset($_GET["type"  ])) $type   = $_GET["type"  ];
	if(isset($_GET["entity"])) $entity = $_GET["entity"];
	if(isset($_GET["text1" ])) $text1  = $_GET["text1" ];
	if(isset($_GET["text2" ])) $text2  = $_GET["text2" ];

	// Send Command to Database
	if($type != "" && $entity != "") {
		$sql = "INSERT INTO `CommandsIn` (`type`, `entity`, `text1`, `text2`) VALUES (".$type.", ".$entity.", '".$text1."', '".$text2."')";
		try {
			$stmt = $db->prepare($sql);
			$stmt->execute();
			if($stmt->rowCount() == 1) echo "1";
			$stmt->closeCursor();
		} catch(PDOException $e) {}
	}

}





// POST CurrentState

else if(isset($_GET["post"]) && strtolower($_GET["post"]) == "currentstate") {

	try {

		// Connect to Database
		$db = new PDO("sqlite:/srv/bx/ram/currentP.db3");

		// Get the raw POST data
		$json_str = file_get_contents("php://input");

		// Decode the JSON data
		$data = json_decode($json_str, true);

		// Check if data is was received and decoded correctly
		if($data === null) exit();

		// Prepare an insert statement
		$stmt = $db->prepare("INSERT OR REPLACE INTO CurrentState (`type`, `entity`, `entityvalue`) VALUES (:type, :entity, :value)");

		// Insert data
		foreach($data as $type => $entities) {
			foreach($entities as $entity => $value) {
				$stmt->bindValue(':type', $type, PDO::PARAM_INT);
				$stmt->bindValue(':entity', $entity, PDO::PARAM_INT);
				$stmt->bindValue(':value', $value, PDO::PARAM_INT);
				$stmt->execute();
			}
		}

		// Success
		echo "1";

	} catch(Exception $e) {}

}





// COUNT CommandsIn

else if(isset($_GET["count"]) && strtolower($_GET["count"]) == "commands") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/ram/currentC.db3");

	// Returns the number of rows in the CommandsIn table
	// ?count=commands
	$result = $db->query("SELECT COUNT(*) FROM CommandsIn")->fetchColumn();
	echo strval($result);

}





// CLEAR DATABASE

else if(isset($_GET["cleardb"]) && $_GET["cleardb"] == "1") {

	// Connect to Database
	$db = new PDO("sqlite:/srv/bx/usv.db3");

	// Send Command to Database
	$db->query("DELETE FROM TempState");
	$db->query("DELETE FROM Settings");
	$db->query("REPLACE INTO Settings (VarName, entity, Name, InUse, Mode, V1, V2, V3, V4, V5, V6, S1, S2, UpDateTime) VALUES ('CloudSet', 0, '', 1, 0, 0, 0, 0, 0, 0, 0, '', '', CURRENT_TIMESTAMP)");
	echo "1";

}
