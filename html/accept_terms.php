<?php

/*
	Accept Terms
*/

// Include Base
include_once "common/base.php";
// Set Step
$step = 7;

// Disable Back Button
if(!isset($_SESSION["last_step"])) header("location: index.php");
if($_SESSION["last_step"] != $step && $_SESSION["last_step"] != $step - 1)
	header("location: " . (isset($_SESSION["back_url"]) ? $_SESSION["back_url"] : "index.php"));
$_SESSION["back_url" ] = $_SERVER["REQUEST_URI"];
$_SESSION["last_step"] = $step;

// Get Installer Country
$installerCountry = isset($_SESSION["installer_country"]) ? $_SESSION["installer_country"] : "";

?>





<!DOCTYPE html>

<html>

	<head>

		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
		<meta name="author" content="Ivan Gavrilov">
		<link rel="icon" href="img/favicon.png">

		<title>batterX EMX</title>

		<link rel="stylesheet" href="css/dist/bundle.css?v=<?php echo $versionHash ?>">
		<link rel="stylesheet" href="css/common.css?v=<?php echo $versionHash ?>">
		<link rel="stylesheet" href="css/accept_terms.css?v=<?php echo $versionHash ?>">

	</head>

	<body>





		<!-- Progress Bar -->
		<div id="progress" class="shadow-lg d-print-none">
			<div><div class="progress"><div class="progress-bar progress-bar-striped bg-success progress-bar-animated"></div></div></div>
			<div><button id="btn_next" class="btn btn-success ripple" disabled><?php echo $lang["btn"]["continue"]; ?></button></div>
		</div>
		<!-- Progress Bar -->





		<div class="container pb-5">



			<h1>Systemgarantie batterX home i-Serie</h1>
			<p>Stand 01.05.2025</p>

			<p>Die batterX GmbH, Ettore-Bugatti-Straße 51, 51149 Köln („batterX“) vertreibt die im Anhang A bezeichneten Komponenten der i- Serie(„Waren“) Für die Waren gibt batterX dem Erwerber („Kunde“) eine Garantieerklärung gemäß den Bestimmungen dieser Garantiebedingung („Garantie“) ab.</p>

			<ol type="1">
				<li>
					<i>Garantiezeit</i>
					<ol type="a">
						<li>Die Garantiezeit beginnt mit Installation des Produktes spätestens aber 30 Tage nach Versand von batterX Werk.</li>
						<li>Die Garantiedauer für die Ware ergibt sich aus Anhang A dieser Garantie</li>
						<li>Erbringt batterX dem Kunden gegenüber einer Leistung unter dieser Garantie (Reparatur oder Ersatz der Ware), verlängert sich durch solche Leistung die Garantie nicht.</li>
						<li>Die Garantiezeit teilt sich in Standardgarantie und Ersatzteilgarantie. Im Anschluss an die Standardgarantie greift die Ersatzteilgarantie.</li>
					</ol>
				</li>
				<li>
					Umfang der Garantie
					<ol type="a">
						<li>Diese Garantie gilt für die in Anhang A genannten batterX Produkte, die direkt über die autorisierten Vertriebskanäle von batterX gekauft worden.</li>
						<li>
							Beim defekt einer Ware wird batterX (nach eigenem Ermessen)
							<ol type="i">
								<li>Ein Ersatzgerät zu senden, dass durch einen Servicepartner vor Ort ausgetauscht werden muss</li>
								<li>Mit eigenen Technikern ein Ersatzgerät innerhalb des Systems auszutauschen oder zu reparieren. Dabei ist batterX berechtigt Änderungen (z.B. Firmwareupdate) an der Ware durchzuführen, um die Ware auf den aktuellen Stand der Technik zu bringen</li>
								<li>Den Austauschaufwand durch einen Servicerabatt kompensieren, welcher dem Alter, Zustand und Kapazität der Ware angemessen ist</li>
							</ol>
						</li>
						<li>Diese Standardgarantie deckt die Kosten für ein hinsichtlich Produkttyp, Nennleistungsklasse oder Alter gleichwertiges Ersatzgerät sowie dessen Versand und die Rücksendung des defekten Gerätes während der definierten Garantiezeit im Rahmen und gemäß den hier festgelegten Bedingungen ab dem Datum des Beginns der Garantiezeit. </li>
						<li>Die Ersatzteilgarantie deckt nur die Materialkosten ab, die zur Wiederherstellung der Betriebsbereitschaft des Geräts erforderlich sind. Sie schließt Transportkosten oder Arbeitskosten für Austausch-/Vor-Ort-Serviceleistungen aus.</li>
						<li>Die Leistungsgarantie (für Batterien) sichert zu, dass die Ware nach Ablauf der Garantiezeit (Anhang A) mindestens 80% der ursprünglichen Nennkapazität beibehält oder innerhalb der Nutzungszeit mindestens einen Gesamtenergiedurchsatz erreicht. Um die genannte Leistungsgarantie in Anspruch nehmen zu können, muss die Leistung der Batteriezellen nach dem in Anhang B beschriebenen Verfahren gemessen werden.</li>
						<li>Im Falle, dass ein Ersatzgerät gesendet wird, muss der Garantieantragsteller ein Ersatzgerät akzeptieren, auch wenn es kosmetische Mängel aufweist, die die Energieerzeugung oder die Einhaltung der Sicherheitsvorschriften nicht beeinträchtigen. batterX wird nach eigenem Ermessen neue und/oder gleichwertige neue Geräte oder Teile in der ursprünglichen oder verbesserten Ausführung verwenden. </li>
						<li>Wenn das vornehmlich defekte Produkt nicht innerhalb von 4 Wochen nach Erhalt des Ersatzgeräts durch den Antragsteller zurückgeschickt wird, oder wenn bei der Überprüfung des zurückgeschickten Produkts kein Garantieschaden festgestellt wird, stellt batterX dem Antragsteller das Ersatzgerät zusätzlich zu den Liefer- und damit verbundenen Servicekosten in Rechnung.</li>
						<li>Die in dieser Garantie genannten Rechte geben die ausschließlichen Rechte des Garantieantragstellers gemäß dieser Garantie wieder. Alle anderen Ansprüche - einschließlich, aber nicht beschränkt auf Ansprüche auf Ersatz von direkten oder indirekten Schäden, die durch das defekte Gerät verursacht wurden, Ansprüche auf Ersatz von Kosten, die durch die Demontage oder Installation entstanden sind, und/oder Verlust von Stromerzeugung oder Gewinn - werden von der Garantie nicht abgedeckt.</li>
					</ol>
				</li>
				<li>
					Garantieablauf
					<ol type="a">
						<li>Ein vermuteter Garantiefall muss der Betreiber des Systems dem zuständigen Installationspartner melden. Wenn dieser nicht eigenständig eine Problemlösung herbeiführen kann und keinen Garantieausschluss feststellt, muss ein batterX Fehlerbericht über das liveX Onlineportal ausgelöst werden. Die Meldung muss innerhalb von 14 Tagen nach entdecken des Fehlers erfolgen. Der Fehlerbericht wird automatisch an die E-Mailadresse: info@visionups.com geschickt</li>
						<li>batterX stimmt die möglichen Maßnahmen mit dem Installationspartner ab und stellt nach eigenem Ermessen ein Austauschgerät (ohne Zubehör) zur Verfügung. Gleichzeitig wird von batterX die defekte Ware zurückgeholt. Die defekte Ware muss batterX innerhalb von 3 Wochen nach Meldungseingang zur Garantieprüfung vorliegen.</li>
						<li>Der Vertriebspartner oder Installateur hat das Gerät vor der Versendung transportsicher zu verpacken. Die im Garantiebericht mitgeteilte Garantienummer (RMA) ist deutlich sichtbar außen auf der Transportverpackung anzubringen. Auf Verlangen ist das Rechnungsoriginal vorzulegen.</li>
						<li>Der gemeldete Garantiefall wird von batterX anhand des zurückgesendeten Produkts und der Schadensmeldung geprüft. Die Anerkennung des Garantiefalls und Durchführung der Garantieleistung erfolgt vorbehaltlich der Prüfung des Defekts und der Ursache. Sofern es sich um keinen Garantiefall handelt, werden die erbrachten Serviceleistungen in Rechnung gestellt.</li>
						<li>Der Kunde verpflichtet sich alle Informationen zur Verfügung zu stellen, um den Garantiefall analysieren zu können. (z.B. Bilder vom Installationsort)</li>
						<li>Die Ware, welche zum Austausch an batterX zurückgeschickt oder Gutgeschrieben wird, wird Eigentum von batterX. </li>
					</ol>
				</li>
				<li>
					Ausschluss der Garantie
					<ol type="a">
						<li>
							Ausgeschlossen von der Garantie sind
							<ol type="i">
								<li>Alle Schäden, die nicht auf einen Materialfehler der Ware zurückzuführen sind</li>
								<li>Alle Schäden an Waren, bei denen angebrachte Farbrikations- oder Serialnummer entfernt oder unkenntlich gemacht wurden</li>
								<li>Alle Schäden oder Ausfälle, die durch den Betrieb, die Reparatur, die Demontage oder die Änderung durch nicht autorisierte Personen verursacht wurden.</li>
								<li>Schäden, die durch unvorhersehbare Faktoren oder höhere Gewalt verursacht werden, wie z. B. Erdbeben, Unwetter, Überschwemmungen, Überspannungen, Blitzschlag, Feuer und Schädlinge usw. </li>
								<li>Äußere Einflüsse, einschließlich mechanischer oder elektrischer Belastungen (Überspannung, hoher Einschaltstrom, Blitzschlag, , Stürze, versehentliches zerbrechen, Betätigung des Schützes usw.) </li>
								<li>Schäden, die aufgrund unsachgemäßer Lagerung und Transport entstanden sind. </li>
								<li>wenn die Ware unter Bedingungen gelagert oder betrieben wurde, die außerhalb der technischen Spezifikationen in Datenblatt und Bedienungsanleitung liegen, </li>
								<li>alle Schäden, die unter Missachtung oder verstoß gegen etwaige von batterX bereitgestellte Montage-, Bedienungs-, Installations- oder sonstige Verwendungsanleitung für die Ware entstanden sind</li>
								<li>Schäden oder Ausfälle, die durch die Verwendung von Komponenten oder Firmware verursacht werden, die nicht von batterX stammen, wie z. B. die Nichtverwendung der Originalstecker aus der Zubehörbox</li>
								<li>Vorsätzliche Zerstörung, unauslöschliche Markierungen oder Diebstahl usw. </li>
								<li>Normale Abnutzung oder Alterung, Oberflächenfehler, Dellen oder Kratzer. </li>
								<li>Zubehör und Verschleißteile, einschließlich, aber nicht beschränkt auf Kabel, Stecker und Werkzeuge, sind nicht durch die oben genannten Garantien und Leistungen abgedeckt. </li>
								<li>Der Garantienehmer hält sich bei der Geltendmachung von Ansprüchen gegenüber batterX nicht an das unter „3. Garantieablauf“ beschriebene Verfahren. </li>
								<li>Schäden oder Ausfälle, die durch den Betrieb oder die Verwendung außerhalb der einschlägigen nationalen Normen oder Industriestandards sowie durch Installationen oder Vorgänge verursacht werden, die gegen die von batterX festgelegten Installationsbedingungen verstoßen.  </li>
								<li>Geräte an denen Siegel entfernt und ohne Autorisierung von batterX geöffnet oder beschädigt wurden</li>
								<li>Geräte, die nicht im Onlineportal(liveX) registriert sind oder länger als 7 Tage keine Internetanbindung haben.</li>
								<li>Alle Schäden, die an Waren von batterX entstanden sind, die nicht in Anhang A aufgeführt sind</li>
								<li>Alle Schäden, die aus nicht Beachtung lokaler Vorschriften, Normen und Sicherheitsstandards des jeweiligen Installationsortes entstehen.</li>
								<li>Wenn es zu den Beschädigten Komponenten kein Ordnungsgemäßes Inbetriebnahmeprotokoll gibt</li>
								<li>Wenn aufgrund einer fehlenden Internetverbindung keine Daten zur Analyse des Fehlers zur Verfügung stehen.</li>
								<li>Verpolung und/oder Kurzschluss, Beschädigung von Steckern oder BMS-Sicherungen </li>
								<li>Versäumnis, das BMS über CAN an den Wechselrichter anzuschließen (die Batterie darf nicht verwendet werden, ohne dass das BMS/CAN angeschlossen ist und vom Wechselrichter erkannt wird). </li>
								<li>Schäden, die Aufgrund falsch gewählten Aufstellort entstanden sind. Insbesondere Installation in unbelüfteten Räumen und/oder nicht vorschriftsmäßige Verwendung und Wartung; Vorhandensein von Oxidation, Kondensationsschäden oder Verschmutzung durch Salze, Dämpfe säurehaltiger Lösungsmittel usw., die Schäden an Schaltkreisen und Schutzvorrichtungen verursachen können</li>
								<li>Schäden, die aus </li>
								<li>Fehlender Schutz vor Flüssigkeiten, einschließlich zerstäubter Flüssigkeiten, vor direktem oder indirektem Aufprall von Wasser oder anderen Flüssigkeiten, die nicht nur zum sofortigen Verlust der Garantie führen, sondern auch eine Gefahr für die Benutzer darstellen können</li>
							</ol>
						</li>
					</ol>
				</li>
				<li>
					Schlussbestimmungen
					<ol type="a">
						<li>Für die Garantie und alle hiermit im Zusammenhang stehenden Ansprüche gilt ausschließlich materielles deutsches recht unter Ausschluss des UN-Kaufrechts und des Kollisionsrechts; Art 3 Abs. 3, Abs. 4 Rom I bleibt unberührt.</li>
						<li>Sofern von diesen Garantiebedingungen Übersetzungen in andere Sprache als deutsch gefertigt werden, ist ausschließlich die deutsche Fassung rechtlich verbindlich.</li>
						<li>Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder ein öffentlich-rechtliches Sondervermögen Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder ein öffentlich-rechtliches Sondervermögen, ist ausschließlicher, auch internationaler Gerichtsstand für alle sich aus dem Vertragsverhältnis unmittelbar oder mittelbar ergebenden Streitigkeiten Köln. Dasselbe gilt, wenn der Kunde keinen allgemeinen Gerichtsstand in Deutschland hat oder Wohnsitz oder gewöhnlicher Aufenthalt im Zeitpunkt der Klageerhebung nicht bekannt sind. Renusol ist berechtigt, den Kunden an seinem allgemeinen Gerichtsstand in Anspruch zu nehmen.</li>
						<li>Änderungen oder Ergänzungen der Garantie sowie alle auf die Garantie bezogenen Erklärungen und Mitteilungen bedürfen zu ihrer Wirksamkeit der Textform (insb. Brief, Fax, E-Mail). Dies gilt auch für die Aufhebung dieses Formerfordernisses.</li>
						<li>Sollten einzelne Bestimmungen dieser Garantie ganz oder teilweise unwirksam sein oder werden, wird hierdurch die Gültigkeit der Bestimmungen im Übrigen nicht berührt. Anstelle der ungültigen Bestimmung gilt das Gesetz. Dies gilt entsprechend für nicht von den Parteien vorhergesehene Lücken dieser Bestimmungen</li>
					</ol>
				</li>
			</ol>

			<h2 class="pt-5">Anhang A</h2>

			<ol type="1">
				<li style="font-weight:normal">
					<span>Die gesamte Garantiezeit ergibt sich aus der Addition der Standartgarantie und der Ersatzteilgarantie</span>
					<div class="d-flex">
						<table class="table table-bordered w-auto mt-3 mb-0">
							<tr>
								<td class="px-2 py-1">Produkt</td>
								<td class="px-2 py-1 text-center">Standardgarantie</td>
								<td class="px-2 py-1 text-center">Ersatzteilgarantie</td>
								<td class="px-2 py-1 text-center">Gesamt</td>
							</tr>
							<tr><td class="px-2 py-1">batterX home i10 Wechselrichter</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
							<tr><td class="px-2 py-1">batterX home i20 Wechselrichter</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
							<tr><td class="px-2 py-1">batterX home i30 Wechselrichter</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">5 Jahre</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
							<tr><td class="px-2 py-1">Energie Meter für i-Serie 15-120A</td><td class="px-2 py-1 text-center">2 Jahre</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">2 Jahre</td></tr>
							<tr><td class="px-2 py-1">Energie Meter für i-Serie 35-300A</td><td class="px-2 py-1 text-center">2 Jahre</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">2 Jahre</td></tr>
							<tr><td class="px-2 py-1">batterX home S1 BMS</td><td class="px-2 py-1 text-center">10 Jahre</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
							<tr><td class="px-2 py-1">batterX home S1 BAT 2.5</td><td class="px-2 py-1 text-center">10 Jahre*</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">10 Jahre*</td></tr>
							<tr><td class="px-2 py-1">batterX home S1 MULTI</td><td class="px-2 py-1 text-center">10 Jahre</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
							<tr><td class="px-2 py-1">batterX home EMX</td><td class="px-2 py-1 text-center">10 Jahre</td><td class="px-2 py-1 text-center">-</td><td class="px-2 py-1 text-center">10 Jahre</td></tr>
						</table>
					</div>
					<span>* 80% der Nennkapazität</span>
				</li>
				<li style="font-weight:normal">
					<span>Für Batterien wird neben der Zeitgarantie, bei der noch 80 % der Nennkapazität zur Verfügung steht ein Gesamtenergiedurchsatz garantiert, welche die Batterie innerhalb der Nutzungszeit mindestens erreicht. Der Gesamtenergiedurchsatz wird wie folgt berechnet:</span>
					<span class="d-block mt-3">Produkt: batterX home S1</span>
					<div class="d-flex">
						<table class="table table-bordered w-auto mt-3 mb-0">
							<tr>
								<td class="px-2 py-1"></td>
								<td class="px-2 py-1">Einzelner Cluster / Batterieturm</td>
								<td class="px-2 py-1">Multi-Cluster / mehrere Batterietürme</td>
							</tr>
							<tr>
								<td class="px-2 py-1">Durchsatz /MWh</td>
								<td class="px-2 py-1">Energie des Systems (kWh) * 3.2</td>
								<td class="px-2 py-1">Energie des Systems (kWh) * 3.2 * 0.98</td>
							</tr>
						</table>
					</div>
				</li>
			</ol>

			<h2 class="pt-5">Anhang B</h2>

			<p>Die Tests zur Leistungsgarantie müssen nur im Falle eines Garantieanspruchs durchgeführt werden. Die Tests werden von einem Labor durchgeführt, das von batterX in Europa autorisiert wurde: Beschreibung des Verfahrens:</p>

			<ol>
				<li>Legen Sie die Batterie für mindestens 30 Minuten in die Klimakammer: Bevor die Testphase beginnt, muss die vom BMS gemessene Temperatur der Zellen 25°C +/-1°C betragen.  </li>
				<li>Schließen Sie direkt an den Minus- und Pluspol des Batteriemoduls an und entladen Sie mit einem konstanten Strom von 0,5C entladen, bis das Feld 41 VDC erreicht. </li>
				<li>Direkt an den Minus- und Pluspol des Zellenfeldes anschließen und mit einem konstanten Strom von 0,2C laden, bis das Feld die Schutzgrenze des BMS erreicht. </li>
				<li>Warten Sie 30 Minuten und starten Sie dann den Ladevorgang bei konstanter Spannung mit 0,05C erneut, bis das BMS wieder 100% oder den Grenzwert der Überspannungsstufe 1 erreicht hat. </li>
				<li>Wiederholen Sie den obigen Entlade-/Ladezyklus, bis der Spannungsunterschied zwischen den Zellen weniger als 0,05 V beträgt. </li>
				<li>Lassen Sie das Batteriemodul ruhen, bis die vom BMS gemessene Zellentemperatur 25°C +/-1°C beträgt. </li>
				<li>Wenn die Zellen 25°C +/-1°C erreicht haben, schließen Sie sie direkt an den Minus- und Pluspol des Batteriemoduls an und entladen Sie sie mit einem konstanten Strom von 0,5C, bis das Feld 41V erreicht, und messen Sie die Kapazität an den Minus- und Pluspolen des Zellenfelds mit einem zertifizierten Gleichstrommessgerät mit 1-Sekunden-Datenloggerfrequenz.   </li>
				<li>Die Kapazitätsprüfung wird am einzelnen Batteriemodul und nicht auf Clusterebene durchgeführt. Das Batteriemodul muss gemäß den von der PC-Software angezeigten spezifischen Spannungsgrenzwerten, wie z. B. Über- und Unterspannung Stufe 1, geprüft werden.</li>
			</ol>

			<p>Wird eine Überprüfung angefordert, muss die Batterie innerhalb von 10 Tagen ab dem Datum der Aufforderung Versand werden.</p>

			<p><b>Natürlicher Verschleiß</b></p>

			<p>Der Kapazitätsrückgang ist nicht linear und kann in den ersten 5 Jahren oder 1500 Zyklen größer sein als der dekadische gewichtete Durchschnitt.</p>

			<p>Die Batterie unterliegt aufgrund ihrer Chemie einem natürlichen Kapazitätsrückgang, der während der ersten 1000 Zyklen und/oder 12-18 Monate größer sein kann als während der restlichen Zyklen. Die Batterie wird auch dann schwächer, wenn sie nicht benutzt wird, und sogar während der Lagerung im Lager.</p>

			<p>Diese Umstände können in keiner Weise als Fehler in der Qualität und/oder Leistung des Produkts angesehen werden.</p>



		</div>





		<div class="d-print-none">
			
			<div class="divider"><hr></div>

			<div id="confirm" class="container py-5">
				<div class="custom-control custom-checkbox py-2">
					<input type="checkbox" class="custom-control-input" id="checkboxAccept">
					<label class="custom-control-label" for="checkboxAccept">Ich bestätige, dass ich alle <a href="#">Garantiebestimmungen</a> sowie <a href="https://www.batterx.io/datenschutz/" target="_blank">Datenschutz</a> und <a href="https://www.batterx.io/datenschutz/" target="_blank">Cookie-Richtlinien</a> gelesen und sie vollständig verstanden und akzeptiert habe.</label>
				</div>
			</div>

		</div>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script src="js/accept_terms.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
