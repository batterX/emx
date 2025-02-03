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



			<?php if($installerCountry == "de"): ?>



				<h1>Systemgarantie batterX Home & COM</h1>

				<p class="text-center mb-5">gültig zwischen VISION UPS Systems Sàrl und in Deutschland ansässigen Vertriebspartnern<br>und für oben genannte Speichersysteme sowie autorisierte Speichererweiterungen<br>Version 010521 vom 01.05.2021</p>

				<p>VISION UPS gewährt zusätzlich zu den gesetzlichen Gewährleistungsansprüchen und den Allgemeinen Geschäftsbedingungen eine Garantie nach Maßgabe der folgenden Bedingungen. Die Garantie ist nicht übertragbar und auf den Vertriebspartner beschränkt.</p>

				<h2>1. Garantieumfang Wechselrichter und cliX-Schrank</h2>
				<p>VISION UPS gewährt auf Wechselrichter der batterX Home-Serie und cliX-Schränke eine Standardgarantie von 5 Jahren ab Installationsdatum, jedoch maximal 5,5 Jahren nach Verkauf EXW Beiler (Datum Lieferschein). Von VISION UPS erbrachte Garantieleistungen bewirken weder eine Verlängerung der Garantiefrist, noch setzen sie eine neue Garantiefrist in Lauf.</p>
				<p>a) Die Garantie wird in der Form geleistet, dass Teile, die nachweislich trotz sachgemäßer Behandlung und Beachtung der Gebrauchsanweisung, aufgrund von Fabrikations- und/oder Materialfehlern defekt geworden sind, nach Wahl von und bei VISION UPS kostenlos repariert werden. Reparaturen beim Vertriebspartner werden nur in Ausnahmefällen und kostenpflichtig geleistet. Alternativ hierzu behält VISION UPS sich vor, das reklamierte Gerät gegen ein Ersatzgerät mit vergleichbarem Funktionsumfang auszutauschen. Handbücher, evtl. mitgelieferte Software einschließlich Firmware und Ersatzgeräte sowie Ersatzteile sind von der Garantie ausgeschlossen. Auf Wunsch des Vertriebspartners können im Garantiefall statt einer Reparatur Ersatzteile bereitgestellt und kostenlos an eine vom Vertriebspartner bekanntzugebende Adresse in Deutschland versandt werden.</p>
				<p>b) Die Kosten für Material und Arbeitszeit zur Reparatur eines Produktes seitens VISION UPS werden von VISION UPS getragen.</p>
				<p>c) Ersetzte Teile gehen in das Eigentum von VISION UPS über.</p>
				<p>d) VISION UPS ist berechtigt, über die Instandsetzung und den Austausch hinaus, technische Änderungen (z. B. Firmware-Updates) vorzunehmen um das Gerät dem aktuellen Stand der Technik anzupassen. Hierfür entstehen dem Vertriebspartner keine zusätzlichen Kosten. Ein Rechtsanspruch hierauf besteht nicht.</p>

				<h2>2. Garantieumfang Batteriemodul LFP3500</h2>
				<p>Der Vertriebspartner als Garantieberechtigter kann im Garantiefall, das Produkt ersetzen oder erstatten lassen.</p>
				<p>Der Garantiefall tritt ein, wenn die Kapazität der Batteriezellen 70% (siebzig Prozent) der Nennkapazität unterschreitet.</p>
				<p>Die Garantiefrist von 10 Jahren ist gültig a) nach Erstinstallation des Produktes oder b) maximal 10 Jahre und 6 Monate zuzüglich zum Herstellungsdatum.</p>

				<h2>3. Voraussetzungen für einen Garantieanspruch</h2>
				<p>Ein Garantieanspruch kann nur dann zur Prüfung eingereicht werden, wenn das Gerät über eine Internetverbindung verfügt und ausreichend Analysedaten in der Cloud des Herstellers verfügbar gemacht wurden. Davon kann ausgegangen werden, wenn die Zeit ohne Internetverbindung insgesamt zwei Wochen pro Jahr nicht übersteigt.</p>
				<p>Weitere Bedingungen sind:</p>
				<p>a) Das System besitzt eine gültige Seriennummer,</p>
				<p>b) Es ist in Deutschland installiert worden,</p>
				<p>c) Es wurde nach der Bedienungsanleitung und den gültigen Vorschriften installiert, betrieben und gewartet.</p>
				<p>d) Es wurde eine regelmäßige Reinigung der Ventilatoren durchgeführt, falls der Wechselrichter in staubiger Umgebung installiert wurde.</p>
				<p>e) Es nimmt nicht mehr als 365 Volladezyklen pro Jahr vor.</p>
				<p>f) Speichererweiterungen wurden gegebenenfalls in den vom Hersteller vorgesehenen Kapazitätsstufen von einem geschulten Techniker nicht länger als 18 Monate nach dem Datum der Erstinstallation durchgeführt, wobei nur Originalkomponenten verwendet wurden und gemäß dem Produkthandbuch vorgegangen wurde.</p>

				<h2>4. Abwicklung des Garantieanspruches</h2>
				<p>a) Zeigen sich innerhalb der Garantiezeit Fehler des Gerätes, so sind Garantieansprüche unverzüglich, spätestens jedoch innerhalb von achtundzwanzig Kalendertagen mittels offiziellem batterX-Fehlerbericht vom Vertriebspartner oder jenem Installateur, der laut liveX für die Installation verantwortlich ist, an die E-Mail-Adresse info@visionups.com geltend zu machen. VISION UPS kann die Garantieabwicklung verweigern, wenn die Fehlerbeschreibung keine Anhaltspunkte für das Vorliegen eines Garantiefalles ergibt.</p>
				<p>b) VISION UPS Systems Sàrl stellt bei Anerkennung des Garantiefalls je nach Schwierigkeit der Reparatur Ersatzteile oder ein Austauschgerät (ohne Zubehör) zur Verfügung und versendet diese an eine vom Vertriebspartner oder Installateur bekanntzugebende Adresse in Deutschland. Bei Stellung eines Ersatzgerätes holt VISION UPS das defekte Gerät auf eigene Kosten zur Prüfung zurück. Nach Ablauf der Gewährleistungsfrist gilt dieselbe Prozedur, jedoch werden alle Leistungen und Teile ab Werk, also exklusive Versandkosten zur Verfügung gestellt.</p>
				<p>c) Das Tauschgerät verbleibt beim Kunden, auch wenn Vision UPS das eingesandte Gerät erfolgreich repariert.</p>
				<p>e) Stellt sich bei Prüfung eines eingesandten Gerätes heraus, dass kein Garantiefall vorliegt, wird es kostenpflichtig repariert, wobei sämtliche Material- und Transportkosten (Rückholung des Gerätes vom Kunden, Versand des Tauschgerätes, Rückholung des Tauschgerätes) an den Kunden bzw. den Installateur verrechnet werden. Der Hersteller behält sich das Recht vor, bei nicht fristgemäßer Erstattung der Kosten, die cloudbasierten Serviceleistungen an Installateur oder Kunden bis zur vollständigen Erstattung auszusetzen.</p>
				<p>b) Der Vertriebspartner oder Installateur hat das Gerät vor der Versendung zu VISION UPS oder dessen Servicepartner transportsicher zu verpacken. Die von VISION UPS mitgeteilte Warenrücksendegenehmigung (RMA) ist deutlich sichtbar außen auf der Transportverpackung anzubringen. Auf Verlangen ist VISION UPS das Rechnungsoriginal vorzulegen.</p>
				<p>c) Kommt es auf dem Transport von VISION UPS zum Vertriebspartner zu einem Transportschaden, der äußerlich erkennbar ist, muss die Ware unter Vorbehalt angenommen und der Transportschaden auf dem Abliefernachweis vermerkt werden. Die Annahme kann auch verweigert werden. In beiden Fällen ist dies unverzüglich gegenüber dem mit dem Transport beauftragten Unternehmen und gegenüber VISION UPS anzuzeigen. Äußerlich nicht erkennbare Schäden sind unverzüglich nach Entdeckung, spätestens jedoch innerhalb von drei Tagen nach Anlieferung, schriftlich gegenüber dem Transportunternehmen und VISION UPS mitzuteilen. Für Transportschäden, die im Rahmen der Erstauslieferung von VISION UPS-Produkten durch den Fachhandel auftreten, übernimmt VISION UPS keine Haftung.</p>

				<h2>5. Servicepauschale</h2>
				<p>VISION UPS unterstützt seine Vertriebspartnern und Installateure bei Garantiefällen in Form einer Servicepauschalen. Pro Garantiefall beträgt die Servicepauschale 100 Euro und wird nach Erledigung der erforderlichen Reparatur- bzw. Austauschleistungen auf offene Rechnung des Vertriebspartners bzw. Installateurs bezahlt.</p>

				<h2>6. Nicht angemeldete Retouren</h2>
				<p>Im Falle von nichtautorisierter Rücksendung kann die Bearbeitungsdauer bis zu 4 Wochen betragen. VISION UPS oder seine Servicepartner erstellen dem Vertriebspartner, im Falle eines kostenpflichtigen Austausches, ein Angebot. Sollte innerhalb von 3 Wochen kein Auftrag für den Austausch erfolgt sein, wird VISION UPS das zurückgesendete Gerät kostenpflichtig entsorgen.</p>

				<h2>7. Fehleranalysen und Messungen am Batteriemodul LFP3500</h2>
				<p>Zur genauen Analyse kann das Batteriemodul an VISION UPS gesandt werden, um eine Rechtfertigung der Garantieanspruches zu prüfen.</p>
				<p>Bei nicht zufriedenstellender, abschließender Beurteilung, wird das Produkt bei einem unabhängigen, zertifizierten Labor eingereicht. Wenn ein gerechtfertigter Anspruch besteht, übernimmt VISION UPS die Kosten der Überprüfung, ansonsten muss sie der Vertriebspartner tragen.</p>
				<p>Bei jeglicher Prüfung der Kapazität bzw. Messung für die Anmeldung eines Garantiefalls, sind folgende Bedingungen einzuhalten:</p>
				<p>a) die mittlere Umgebungstemperatur beträgt: 25°C±2°C</p>
				<p>b) die anfängliche Betriebstemperatur der Batterie beträgt: 25°C±1°C</p>
				<p>c) nach 100% Vollladung, wird mit einer Stromstärke von 10A entladen.</p>
				<p>Sofern das Produkt nicht mehr verfügbar ist, kann der Hersteller es durch ein wiederaufbereitetes oder ein anderes Produkt bzw. benötigte Teile zu ersetzen, sofern sie dem erworbenen, technischen Stand entsprechen.</p>

				<h2>8. Datensicherung</h2>
				<p>Es obliegt dem Vertriebspartner, von ihm auf das Gerät aufgespielte oder dort gespeicherte Software und/oder Daten, insbesondere die Konfiguration des Geräts, zu sichern. VISION UPS ist berechtigt, die Konfiguration des vom Vertriebspartner eingesandten Geräts zu löschen und/oder dieses Gerät oder ein Austauschgerät mit einer anderen Version der Firmware zurückzusenden. Für Schäden, die durch Datenverluste, durch einen Gerätetausch oder durch das Aufspielen einer anderen Version der Firmware im Rahmen der Garantieabwicklung entstehen, übernimmt VISION UPS keine Haftung. Der Vertriebspartner hat keinen Anspruch auf Wiederherstellung seiner hard- oder softwareseitigen Konfiguration.</p>

				<h2>9. Ausschluss der Garantie (Wechselrichter und cliX-Schrank)</h2>
				<p>Jegliche Garantieansprüche sind insbesondere ausgeschlossen,</p>
				<p>a) wenn der Aufkleber mit der Seriennummer vom Gerät entfernt worden ist,</p>
				<p>b) wenn das Gerät durch den Einfluss höherer Gewalt oder durch Vernachlässigung beschädigt oder zerstört wurde.</p>
				<p>c) wenn das Gerät durch Umwelteinflüsse, für welche die Schutzklasse IP20 des Gerätes nicht geeignet ist (Feuchtigkeit, Blitzschlag, Staub, Feuer, korrodierendes Gas, Witterungsverhältnisse), beschädigt oder zerstört wurde,</p>
				<p>d) wenn das Gerät unter Bedingungen gelagert oder betrieben wurde, die außerhalb der technischen Spezifikationen in Datenblatt und Bedienungsanleitung liegen,</p>
				<p>e) wenn die Schäden durch unsachgemäße Behandlung – insbesondere durch Nichtbeachtung der Systembeschreibung und der Betriebsanleitung – aufgetreten sind,</p>
				<p>f) wenn es sich um Defekte an beweglichen Teilen handelt.</p>
				<p>g) wenn das Gerät durch nicht von VISION UPS beauftragte oder durch nicht autorisierte Personen geöffnet, repariert oder modifiziert wurde,</p>
				<p>h) wenn das Gerät mechanische Beschädigungen irgendwelcher Art aufweist, gleichgültig ob diese bei Transport oder danach entstanden sind,</p>
				<p>i) wenn der Wechselrichter (unabhängig vom Systemmodus) mehr als 3 Mal bei Netzausfall einer Überlast von mehr als 3300W pro Phase ausgesetzt war (zB. wenn das Gerät im Verlauf eines Netzausfalles und gleichzeitiger Überlast mehr als 2 Mal vom Kunden manuell wieder eingeschaltet wird).</p>
				<p>j) wenn das Gesamtsystem im Ersatzstrommodus mit mehr als 32/35 A überlastet wurde.</p>
				<p>k) wenn der Wechselrichter mit nicht von Vision UPS Systems Sarl für dieses System verkauften Batterien oder anderen Systemteilen bzw. nicht vom Hersteller autorisierten Komponenten betrieben wurde.</p>
				<p>l) wenn der Garantieanspruch nicht den Garantiebedingungen entsprechend angemeldet worden ist, oder Transportschäden nicht gemäß den Garantiebedingungen angezeigt wurden.</p>
				<p>m) Bei Fehlen der Voraussetzungen aus Punkt 3.</p>
				
				<h2>10. Ausschluss der Garantie (Batteriemodul LFP3500)</h2>
				<p>Erweiternd zu den gesetzlichen Bestimmungen führen folgende Beschädigungen, Defekte oder Fehlverhalten am Produkt zu einem Garantieausschluss:</p>
				<p>a) Entfernung der Aufkleber mit der Seriennummer</p>
				<p>b) Lagerung der Batteriebei einer Temperatur von weniger als 5°C oder mehr als 40°C bzw.</p>
				<p>c) Fehlfunktion des Wechselrichters außer, es handelt sich bei dieser Fehlfunktion um einen Wechselrichter-Garantiefall seitens des Wechselrichter-Herstellers</p>
				<p>d) Verwendung mit anderen Wechselrichtern als batterX Home Series h10.</p>
				<p>e) Verwendung bei Umgebungs¬temperaturen außerhalb einer Temperatur von 5°C und 40°C sowie einer Temperatur von weniger als 15°C oder mehr als 30°C im Mittel,</p>
				<p>f) Verwendung der Batterie unterhalb der maximalen Entladetiefe.</p>
				<p>g) wenn der Wechselrichter (unabhängig vom Systemmodus) mehr als 3 Mal bei Netzausfall einer Überlast von mehr als 3300W pro Phase ausgesetzt war (zB. wenn das Gerät im Verlauf eines Netzausfalles und gleichzeitiger Überlast mehr als 2 Mal vom Kunden manuell wieder eingeschaltet wird).</p>
				<p>h) jegliche physische Beschädigung</p>
				<p>i) Öffnung, Reparatur, Modifikationen oder Programmierung durch nicht von VISION UPS oder dessen Vertriebspartner beauftragte bzw. autorisierte Personen,</p>
				<p>j) Wasser, Kälte, Feuer, Staub, korrodierendes Gas, für welche die Schutzklasse IP20 des Geräts nicht geeignet ist</p>
				<p>k) Verwendung mit anderen Typen von Batterien</p>
				<p>l) anderweitige Verwendung, als in der Bedienungsanleitung angegeben</p>
				<p>m) Beschädigung der Batterien durch Feuer, Frost, Vernachlässigung, höhere Gewalt, Missbrauch oder Zerstörung</p>
				<p>n) Wenn der Garantieanspruch nicht den Garantiebedingungen entsprechend angemeldet worden ist, oder Transportschäden nicht gemäß den Garantiebedingungen angezeigt wurden.</p>
				<p>o) Bei Fehlen der Voraussetzungen aus Punkt 3.</p>

				<h2>11. Bedienungsfehler</h2>
				<p>Stellt sich heraus, dass die gemeldete Fehlfunktion des Gerätes offensichtlich durch Fremd-Hardware, Fremd-Software, Installation oder Bedienung verursacht wurde oder stellt sich die Fehlerbeschreibung des Vertriebspartners als offensichtlich irreführend heraus, behält VISION UPS sich vor, den entstandenen Aufwand dem Vertriebspartner zu berechnen.</p>

				<h2>12. Ergänzende Regelungen</h2>
				<p>a) Durch diese Garantie werden weitergehende Ansprüche, insbesondere solche auf Schadensersatz (Ersatz von entgangenem Gewinn, mittelbaren oder Folgeschäden etc.), Rücktritt oder Minderung, nicht begründet. Gesetzliche Ansprüche, z.B. bei Personenschäden oder Schäden an privat genutzten Sachen nach dem Produkthaftungsgesetz oder in Fällen des Vorsatzes oder der groben Fahrlässig-keit, bleiben unberührt.</p>
				<p>b) Die Garantie wird lediglich dem Vertriebspartner gewährt.</p>
				<p>c) Mit Abschluss des Kaufs erkennt der Vertriebspartner die Garantiebestimmungen sowie die Allgemeinen Geschäftsbedingungen von VISION UPS Systems Sàrl an.</p>
				<p>d) Weitergehende oder andere Ansprüche, insbesondere solche auf Ersatz außerhalb des Gerätes entstandener Schäden sind, sofern eine Haftung nicht zwingend gesetzlich angeordnet ist, ausgeschlossen.</p>
				<p>e) Die Garantiebedingungen gelten jeweils in der Version, welche aktuell auf der Webseite von VISION UPS Systems Sàrl (www.visionups.com) hinterlegt bzw. verlinkt ist.</p>
				<p>f) Auf diese Garantie findet das Recht des Großherzogtums Luxemburg Anwendung.</p>

				<h2>13. Zehn-Jahres-Zeitwertersatzgarantie für das LiFePO4 Batteriemodul LFP3500</h2>

				<p>Für die im Rahmen des Batteriespeichersystems gelieferten Batterien von VISION UPS Systems Sàrl des Typs LFP3500 (LiFePo4, 3500Wh nominal), nachfolgend "Batterien" genannt, wird eine Zeitwertersatzgarantie für einen Zeitraum von 10 Jahren gewährt. Diese Zeitwertersatzgarantie ist ausschließlich im Zusammenhang mit der Teilnahme an einem Förderprogramm in der Bundesrepublik Deutschland und unter Einhaltung der im Rahmen dieses Förderprogramms definierten Förderbedingungen gültig. Sie kann lediglich durch den am Förderprogramm teilnehmenden Endkäufer (nachfolgend „Käufer" genannt) der Batterien in Anspruch genommen werden.</p>
				<p>Die Garantiezeit beginnt mit der Auslieferung der Batterien an den Käufer.</p>
				<p>Bei einem Garantiefall wird unter Einschränkung der Ausschlussgründe unter Punkt B. der Zeitwert der vom Garantiefall (Definition s.u.) betroffenen Batterien ersetzt. Dieser berechnet sich anhand einer über den Zeitraum von 10 Jahren linear angenommenen jährlichen Abschreibung bezogen auf den durch den Käufer der Batterien bezahlten Kaufpreis auf die Zellen. Der Zeitwert basiert auf dem Kaufpreis zum Zeitpunkt des Erwerbs. Ein Garantiefall im Sinne dieser Zeitwertersatzgarantie ist gegeben, wenn die max. verfügbare Kapazität unter 70% der Nennkapazität fällt.</p>
				<p>Der Ersatz des Zeitwertes der vom Garantiefall betroffenen Batterien erfolgt grundsätzlich über die Lieferung neuer Batterien zum Zeitpunkt der Feststellung des Garantiefalles aktuellen Kaufpreis unter Anrechnung des zu diesem Zeitpunkt aktuellen Zeitwertes der mangelhaften Batterien. Der aktuelle Kaufpreis berechnet sich auf Grundlage des vom Käufer bezahlten Kaufpreises. Die Entwicklung des Zeitwertes über die Garantielaufzeit ist der Abbildung zu entnehmen.</p>

				<p class="mt-3">Die Zeitwertersatzgarantie gewährt eine Gutschrift auf den Listenpreis zum Zeitpunkt der Beanstandung für die Ersatzlieferung von Batterien. Der Betrag der Gutschrift ergibt sich durch den Zeitwert der Batterie. Dieser basiert auf den Kaufpreis zum Zeitpunkt des Erwerbs. Eine Übersicht zu Zeiten und Anspruchshöhen bezogen auf das Ende des Jahres der besagten Laufzeit ist der folgenden Tabelle zu entnehmen:</p>

				<div class="d-flex justify-content-center">
					<table class="table small table-bordered text-center w-auto mt-3">
						<tr>
							<th class="px-2 py-1">Laufzeit zum<br>Zeitpunkt am Ende<br>des Jahres</th>
							<th class="px-2 py-1 align-middle">Garantie</th>
							<th class="px-2 py-1">Zeitwertersatzgarantieanspruch<br>in % vom Listenpreis<br>zum Zeitpunkt des Erwerbs</th>
						</tr>
						<tr><td class="px-2 py-1">0</td><td class="px-2 py-1">Gewährleistung</td><td class="px-2 py-1">100%</td></tr>
						<tr><td class="px-2 py-1">1</td><td class="px-2 py-1">Gewährleistung</td><td class="px-2 py-1">100%</td></tr>
						<tr><td class="px-2 py-1">2</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">90%</td></tr>
						<tr><td class="px-2 py-1">3</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">80%</td></tr>
						<tr><td class="px-2 py-1">4</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">70%</td></tr>
						<tr><td class="px-2 py-1">5</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">60%</td></tr>
						<tr><td class="px-2 py-1">6</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">50%</td></tr>
						<tr><td class="px-2 py-1">7</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">40%</td></tr>
						<tr><td class="px-2 py-1">8</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">30%</td></tr>
						<tr><td class="px-2 py-1">9</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">20%</td></tr>
						<tr><td class="px-2 py-1">10</td><td class="px-2 py-1">Zeitwertersatz</td><td class="px-2 py-1">10%</td></tr>
					</table>
				</div>

				<p>Die gesetzlichen Gewährleistungsansprüche (Gewährleistungsfrist von grundsätzlich 2 Jahren) des Käufers gegen den Verkäufer der Batterien bleiben hiervon unberührt. Die im Rahmen des Garantieanspruchs ersetzten Batterien und sonstige Komponenten gehen in Eigentum von VISION UPS Systems Sàrl über. Die Garantieleistung bezieht sich ausschließlich auf den Zeitwertersatz der Batterien. Die bei der Feststellung und Umsetzung eines Garantieanspruches anfallenden Kosten (Service-Einsatz, Kapazitätstest, Ausbau- und Einbaukosten, Transportkosten etc.) sind nicht durch die Garantieleistung erfasst. Die hierbei entstandenen Kosten werden dem Käufer in Rechnung gestellt. Die Feststellung und Umsetzung des Garantieanspruchs ist ausschließlich durch die VISION UPS Sàrl oder deren zertifizierten Partner vorzunehmen. Bei den im Falle eines Garantieanspruches gelieferten neuen oder reparierten Batterien läuft die bisherige Garantiezeit weiter. Die Neulieferung der Batterien im Rahmen eines Garantiefalles begründet nicht den Neubeginn der Garantielaufzeit.</p>



			<?php elseif(in_array($installerCountry, ["at", "ch"])): ?>



				<h1>Systemgarantie batterX Home&COM</h1>

				<p class="text-center mb-5">gültig zwischen VISION UPS Systems Sàrl und Vertriebspartnern<br>in deutschsprachigen Ländern und Gebieten außerhalb der Bundesrepublik Deutschland<br>und für oben genannte Speichersysteme sowie autorisierte Speichererweiterungen<br>Version 010521 vom 01.05.2021</p>

				<p>VISION UPS gewährt zusätzlich zu den gesetzlichen Gewährleistungsansprüchen und den Allgemeinen Geschäftsbedingungen eine Garantie nach Maßgabe der folgenden Bedingungen. Die Garantie ist nicht übertragbar und auf den Vertriebspartner beschränkt.</p>

				<h2>1. Garantieumfang Wechselrichter und cliX-Schrank</h2>
				<p>VISION UPS gewährt auf Wechselrichter der batterX Home-Serie und cliX-Schränke eine Standardgarantie von 5 Jahren ab Installationsdatum, jedoch maximal 5,5 Jahren nach Verkauf EXW Beiler (Datum Lieferschein). Von VISION UPS erbrachte Garantieleistungen bewirken weder eine Verlängerung der Garantiefrist, noch setzen sie eine neue Garantiefrist in Lauf.</p>
				<p>a) Die Garantie wird in der Form geleistet, dass Teile, die nachweislich trotz sachgemäßer Behandlung und Beachtung der Gebrauchsanweisung, aufgrund von Fabrikations- und/oder Materialfehlern defekt geworden sind, nach Wahl von und bei VISION UPS kostenlos repariert werden. Reparaturen beim Vertriebspartner werden nur in Ausnahmefällen und kostenpflichtig geleistet. Alternativ hierzu behält VISION UPS sich vor, das reklamierte Gerät gegen ein Ersatzgerät mit vergleichbarem Funktionsumfang auszutauschen. Handbücher, evtl. mitgelieferte Software einschließlich Firmware und Ersatzgeräte sowie Ersatzteile sind von der Garantie ausgeschlossen. Auf Wunsch des Vertriebspartners können im Garantiefall statt einer Reparatur Ersatzteile ab Werk bereitgestellt werden.</p>
				<p>b) Die Kosten für Material und Arbeitszeit zur Reparatur eines Produktes von VISION UPS werden von VISION UPS getragen.</p>
				<p>c) Ersetzte Teile gehen in das Eigentum von VISION UPS über.</p>
				<p>d) VISION UPS ist berechtigt, über die Instandsetzung und den Austausch hinaus, technische Änderungen (z. B. Firmware-Updates) vorzunehmen um das Gerät dem aktuellen Stand der Technik anzupassen. Hierfür entstehen dem Vertriebspartner keine zusätzlichen Kosten. Ein Rechtsanspruch hierauf besteht nicht.</p>

				<h2>2. Garantieumfang Batteriemodul LFP3500</h2>
				<p>Der Vertriebspartner als Garantieberechtigter kann im Garantiefall, das Produkt ersetzen oder erstatten lassen.</p>
				<p>Der Garantiefall tritt ein, wenn die Kapazität der Batteriezellen 70% (siebzig Prozent) der Nennkapazität unterschreitet.</p>
				<p>Die Garantiefrist von 10 Jahren ist gültig a) nach Erstinstallation des Produktes oder b) maximal 10 Jahre und 6 Monate zuzüglich zum Herstellungsdatum.</p>

				<h2>3. Voraussetzungen für einen Garantieanspruch</h2>
				<p>Ein Garantieanspruch kann nur dann zur Prüfung eingereicht werden, wenn das Gerät über eine Internetverbindung verfügt und ausreichend Analysedaten in der Cloud des Herstellers verfügbar gemacht wurden. Davon kann ausgegangen werden, wenn die Zeit ohne Internetverbindung insgesamt zwei Wochen pro Jahr nicht übersteigt.</p>
				<p>Weitere Bedingungen sind:</p>
				<p>a. Das System besitzt eine gültige Seriennummer,</p>
				<p>b. es ist in in Österreich, der Schweiz, dem deutschsprachigen Teil Belgiens, Luxemburg, Liechtenstein, Südtirol oder auf den Balearischen Inseln installiert worden.</p>
				<p>c. es wurde nach der Bedienungsanleitung und den gültigen Vorschriften von einem bei VISION UPS geschulten Techniker, welcher im Besitz eines gültigen Schulungszertifikates (nicht älter als 3 Jahre) installiert, betrieben und gewartet.</p>
				<p>d. es wurde eine regelmäßige Reiningung der Geräte, insbesondere der Ventilatoren durchgeführt.</p>
				<p>e. es nimmt nicht mehr als 365 Volladezyklen pro Jahr vor.</p>

				<h2>4. Abwicklung des Garantieanspruches</h2>
				<p>a) Zeigen sich innerhalb der Garantiezeit Fehler des Gerätes, so sind Garantieansprüche unverzüglich, spätestens jedoch innerhalb von vierzehn Kalendertagen mittels offiziellem batterX-Fehlerbericht an die E-Mail-Adresse info@visionups.com geltend zu machen. VISION UPS kann die Garantieabwicklung verweigern, wenn die Fehlerbeschreibung des Vertriebspartners keine Anhaltspunkte für das Vorliegen eines Garantiefalles ergibt.</p>
				<p>b) VISION UPS Systems Sàrl stellt bei Anerkennung des Garantiefalles Ersatzteile oder ein Austauschgerät ab Werk zur Verfügung. Im Zweifelsfall kann der Vertriebspartner das Gerät zur Prüfung an VISION UPS senden.</p>
				<p>b) Der Vertriebspartner hat das Gerät vor der Versendung zu VISION UPS oder seiner Servicepartner transportsicher zu verpacken. Die von VISION UPS mitgeteilte Warenrücksendegenehmigung (RMA) ist deutlich sichtbar außen auf der Transportverpackung anzubringen. Auf Verlangen ist VISION UPS das Rechnungsoriginal vorzulegen.</p>
				<p>c) Der Transport zu VISION UPS oder einem seiner Servicepartner geschieht auf eigene Gefahr und Kosten. VISION UPS stellt Ersatzteile bzw. ein Ersatzgeräte ab Werk kostenlos zur Verfügung.</p>
				<p>Kommt es auf dem Transport von VISION UPS zum Vertriebspartner zu einem Transportschaden, der äußerlich erkennbar ist, muss die Ware unter Vorbehalt angenommen und der Transportschaden auf dem Abliefernachweis vermerkt werden. Die Annahme kann auch verweigert werden. In beiden Fällen ist dies unverzüglich gegenüber dem mit dem Transport beauftragten Unternehmen und gegenüber VISION UPS anzuzeigen. Äußerlich nicht erkennbare Schäden sind unverzüglich nach Entdeckung, spätestens jedoch innerhalb von drei Tagen nach Anlieferung, schriftlich gegenüber dem Transportunternehmen und VISION UPS mitzuteilen. Für Transportschäden, die im Rahmen der Erstauslieferung von VISION UPS-Produkten durch den Fachhandel auftreten, übernimmt VISION UPS keine Haftung.</p>
				<p>d) Im Lieferumfang des Austauschgerätes ist grundsätzlich kein Zubehör enthalten.</p>

				<h2>5. Nicht angemeldete Retouren</h2>
				<p>VISION UPS behält sich vor, nicht angemeldete und authorisierte Retouren abzulehnen. Auch im Fall einer Annahme der Retoure muß mit einer längeren Bearbeitungszeit gerechnet werden.</p>

				<h2>6. Fehleranalysen und Messungen am Batteriemodul LFP3500</h2>
				<p>Zur genauen Analyse kann das Batteriemodul an VISION UPS gesandt werden, um eine Rechtfertigung der Garantieanspruches zu prüfen.</p>
				<p>Bei nicht zufriedenstellender, abschließender Beurteilung, wird das Produkt bei einem unabhängigen, zertifizierten Labor eingereicht. Wenn ein gerechtfertigter Anspruch besteht, übernimmt VISION UPS die Kosten der Überprüfung, ansonsten muß sie der Vertriebspartner tragen.</p>
				<p>Bei jeglicher Prüfung der Kapazität bzw. Messung für die Anmeldung eines Garantiefalls, sind folgende Bedingungen einzuhalten:</p>
				<p>a. die mittlere Umgebungstemperatur beträgt: 25°C±2°C</p>
				<p>b. die anfängliche Betriebstemperatur der Batterie beträgt: 25°C±1°C</p>
				<p>c. nach 100% Vollladung, wird mit einer Stromstärke von 10A entladen.</p>
				<p>Sofern das Produkt nicht mehr verfügbar ist, kann der Hersteller es durch ein wiederaufbereitetes oder ein anderes Produkt bzw. benötigte Teile zu ersetzen, sofern sie dem erworbenen, technischen Stand entsprechen.</p>

				<h2>7. Datensicherung</h2>
				<p>Es obliegt dem Vertriebspartner, von ihm auf das Gerät aufgespielte oder dort gespeicherte Software und/oder Daten, insbesondere die Konfiguration des Geräts, zu sichern. VISION UPS ist berechtigt, die Konfiguration des vom Vertriebspartner eingesandten Geräts zu löschen und/oder dieses Gerät oder ein Austauschgerät mit einer anderen Version der Firmware zurückzusenden. Für Schäden, die durch Datenverluste, durch einen Gerätetausch oder durch das Aufspielen einer anderen Version der Firmware im Rahmen der Garantieabwicklung entstehen, übernimmt VISION UPS keine Haftung. Der Vertriebspartner hat keinen Anspruch auf Wiederherstellung seiner hard- oder softwareseitigen Konfiguration.</p>

				<h2>8. Ausschluss der Garantie (Wechselrichter und cliX-Schrank)</h2>
				<p>Jegliche Garantieansprüche sind insbesondere ausgeschlossen,</p>
				<p>a. wenn der Aufkleber mit der Seriennummer vom Gerät entfernt worden ist,</p>
				<p>b. wenn das Gerät durch den Einfluss höherer Gewalt oder durch Vernachlässigung beschädigt oder zertört wurde.</p>
				<p>c. wenn das Gerät durch Umwelteinflüsse, für welche die Schutzklasse IP20 des Gerätes nicht geeignet ist (Feuchtigkeit, Blitzschlag, Staub, Feuer, korrodierendes Gas, Witterungsverhältnisse), beschädigt oder zerstört wurde,</p>
				<p>d. wenn das Gerät unter Bedingungen gelagert oder betrieben wurde, die außerhalb der technischen Spezifikationen in Datenblatt und Bedienungsanleitung liegen,</p>
				<p>e. wenn die Schäden durch unsachgemäße Behandlung – insbesondere durch Nichtbeachtung der Systembeschreibung und der Betriebsanleitung – aufgetreten sind,</p>
				<p>f. wenn das Gerät durch nicht von VISION UPS beauftragte oder durch nicht autorisierte Personen geöffnet, repariert oder modifiziert wurde,</p>
				<p>g. wenn das Gerät mechanische Beschädigungen irgendwelcher Art aufweist, gleichgültig ob diese bei Transport oder danach entstanden sind,</p>
				<p>h. wenn der Wechselrichter (unabhängig vom Systemmodus) mehr als 3 Mal bei Netzausfall einer Überlast von mehr als 3300W pro Phase ausgesetzt war (zB. wenn das Gerät im Verlauf eines Netzausfalles und gleichzeitiger Überlast mehr als 2 Mal vom Kunden manuell wieder eingeschaltet wird).</p>
				<p>i. wenn der Wechselrichter mit nicht von Vision UPS Systems Sarl für dieses System verkauften Batterien oder anderen Systemteilen bzw. nicht vom Hersteller authorisierten Komponenten betrieben wurde.</p>
				<p>j. wenn der Garantieanspruch nicht den Garantiebedingungen entsprechend angemeldet worden ist, oder Transportschäden nicht gemäß den Garantiebedingungen angezeigt wurden.</p>
				<p>k. Bei Fehlen der Voraussetzungen aus Punkt 3.</p>
				
				<h2>9. Ausschluss der Garantie (Batteriemodul LFP3500)</h2>
				<p>Erweiternd zu den gesetzlichen Bestimmungen führen folgende Beschädigungen, Defekte oder Fehlverhalten am Produkt zu einem Garantieausschluß:</p>
				<p>a. Entfernung der Aufkleber mit der Seriennummer</p>
				<p>b. Lagerung der Batteriebei einer Temperatur von weniger als 5°C oder mehr als 40°C bzw.</p>
				<p>c. Fehlfunktion des Wechselrichters außer, es handelt sich bei dieser Fehlfunktion um einen Wechselrichter-Garantiefall seitens des Wechselrichter-Herstellers</p>
				<p>d. Verwendung mit anderen Wechselrichtern als batterX Home Series h10.</p>
				<p>e. Verwendung bei Umgebungs¬temperaturen außerhalb einer Temperatur von 5°C und 40°C sowie einer Temperatur von weniger als 15°C oder mehr als 30°C im Mittel,</p>
				<p>f. Verwendung der Batterie unterhalb der maximalen Entladetiefe.</p>
				<p>g. wenn der Wechselrichter (unabhängig vom Systemmodus) mehr als 3 Mal bei Netzausfall einer Überlast von mehr als 3300W pro Phase ausgesetzt war (zB. wenn das Gerät im Verlauf eines Netzausfalles und gleichzeitiger Überlast mehr als 2 Mal vom Kunden manuell wieder eingeschaltet wird).</p>
				<p>h. jegliche physische Beschädigung</p>
				<p>i. Öffnung, Reparatur, Modifikationen oder Programmierung durch nicht von VISION UPS oder dessen Vertriebspartner beauftragte bzw. autorisierte Personen,</p>
				<p>j. Wasser, Kälte, Feuer, Staub, korrodierendes Gas, für welche die Schutzklasse IP20 des Geräts nicht geeignet ist</p>
				<p>k. Verwendung mit anderen Typen von Batterien</p>
				<p>l. anderweitige Verwendung, als in der Bedienungsanleitung angegeben</p>
				<p>m. Beschädigung der Batterien durch Feuer, Frost, Vernachlässigung, höhere Gewalt, Missbrauch oder Zerstörung.</p>
				<p>n. Wenn der Garantieanspruch nicht den Garantiebedingungen entsprechend angemeldet worden ist, oder Transportschäden nicht gemäß den Garantiebedingungen angezeigt wurden.</p>
				<p>o. Bei Fehlen der Voraussetzungen aus Punkt 3.</p>

				<h2>10. Bedienungsfehler</h2>
				<p>Stellt sich heraus, dass die gemeldete Fehlfunktion des Gerätes offensichtlich durch Fremd-Hardware, Fremd-Software, Installation oder Bedienung verursacht wurde oder stellt sich die Fehlerbeschreibung des Vertriebspartners als offensichtlich irreführend heraus, behält VISION UPS sich vor, den entstandenen Aufwand dem Vertriebspartner zu berechnen.</p>

				<h2>11. Ergänzende Regelungen</h2>
				<p>a) Durch diese Garantie werden weitergehende Ansprüche, insbesondere solche auf Schadensersatz (Ersatz von entgangenem Gewinn, mittelbaren oder Folgeschäden etc.), Rücktritt oder Minderung, nicht begründet. Gesetzliche Ansprüche, z.B. bei Personenschäden oder Schäden an privat genutzten Sachen nach dem Produkthaftungsgesetz oder in Fällen des Vorsatzes oder der groben Fahrlässig-keit, bleiben unberührt.</p>
				<p>b) Die Garantie wird lediglich dem Vertriebspartner gewährt.</p>
				<p>c) Mit Abschluss des Kaufs erkennt der Vertriebspartner die Garantiebestimmungen sowie die Allgemeinen Geschäftsbedingungen von VISION UPS Systems Sàrl an.</p>
				<p>d) Weitergehende oder andere Ansprüche, insbesondere solche auf Ersatz außerhalb des Gerätes entstandener Schäden sind, sofern eine Haftung nicht zwingend gesetzlich angeordnet ist, ausgeschlossen.</p>
				<p>e) Die Garantiebedingungen gelten jeweils in der Version, welche aktuell auf der Webseite von VISION UPS Systems Sàrl (www.visionups.com) hinterlegt bzw. verlinkt ist.</p>
				<p>f) Auf diese Garantie findet das Recht des Großherzogtums Luxemburg Anwendung.</p>



			<?php else: ?>



				<h1>System warranty batterX Home&COM</h1>

				<p class="text-center mb-5">Valid between VISION UPS Systems Sàrl and Distributors.<br>Version 120521 of May 12, 2021<br><br>The warranty applies to the above storage systems</p>

				<p>In addition to the General Terms and Conditions, VISION UPS grants a warranty in accordance with the following conditions. The warranty is non-transferable and limited to the Distributor.</p>

				<h2>1. Warranty inverter and cliX cabinet</h2>
				<p>VISION UPS grants a standard warranty of 5 years on batterX Home series inverters and cliX cabinets from the date of installation, but no longer than 5.5 years after sale EXW Beiler (date of delivery). Warranty services provided by VISION UPS do not extend the warranty period, nor initiate a new warranty period.</p>
				<p>a) The warranty is provided in the form that parts which are demonstrably defective due to manufacturing and/or material defects despite proper handling and observance of the instructions for use shall be repaired free of charge at VISION UPS's discretion. Repairs on-site are only carried out in exceptional cases and are subject to a charge. Alternatively, VISION UPS reserves the right to replace the device complained of with a replacement device with a comparable range of functions. Manuals, any software supplied with the product including firmware and replacement devices as well as spare parts are excluded from the warranty.</p>
				<p>b) The cost of materials used to repair a product shall be borne by VISION UPS.</p>
				<p>c) Replaced parts become the property of VISION UPS.</p>
				<p>d) VISION UPS is entitled to make technical changes (e.g. firmware updates) beyond repair and replacement in order to adapt the device to the current state of the art. The sales partner does not incur any additional costs for this. A legal claim to this does not exist.</p>

				<h2>2. Scope of warranty for Battery module LFP3500</h2>
				<p>The warranty claim occurs when the capacity of the battery cells falls below 60% (sixty percent) of the nominal capacity.</p>
				<p>The warranty period of 10 years is valid a) after initial installation of the product or for a maximum of 10 years and 6 months after the date of manufacturing.</p>

				<h2>3. Requirements for a warranty claim</h2>
				<p>A warranty claim can only be submitted for review if the device has an Internet connection and sufficient analysis data has been made available in the manufacturer's cloud. This can be assumed if the time without an Internet connection does not exceed a total of two weeks per year.</p>
				<p>Other terms are:</p>
				<p>a) The system has a valid serial number,</p>
				<p>b) it has been installed, operated and maintained in accordance with the operating instructions and applicable regulations by an engineer who was trained by VISION UPS and has a valid training certificate (not older than three years).</p>
				<p>c) regular cleaning of the system components, especially the fans has been carried out.</p>
				<p>d) it does not perform more than 365 full charge cycles per year.</p>

				<h2>4. Processing of warranty claims</h2>
				<p>a) If defects of the device become apparent within the warranty period, warranty claims must be asserted immediately, but at the latest within fourteen calendar days, by means of an official batterX error report sent to the e-mail address info@visionups.com. VISION UPS may refuse to process a warranty claim if the description of the fault by the Distributor does not provide any indication of a warranty claim.</p>
				<p>b) VISION UPS Systems Sàrl will provide spare parts or a replacement unit ex works upon acceptance of the warranty claim. In case of doubt, the distributor may send the defective device to VISION UPS for inspection.</p>
				<p>b) The sales partner must pack the device securely for transportation before it is shipped to VISION UPS or its service partners. The Return Material Authorization (RMA) notified by VISION UPS must be clearly visible on the outside of the transport packaging. The original invoice must be presented to VISION UPS upon request.</p>
				<p>c) Transportation to VISION UPS or one of its service partners is at your own risk and expense. VISION UPS provides spare parts or a replacement device ex works free of charge.</p>
				<p>If the transportation from VISION UPS to the distribution partner is result of a transport damage that is externally recognizable, the goods must be accepted with reservation and the transport damage noted on the proof of delivery. Acceptance may also be refused. In both cases, this must be reported immediately to the company commissioned with the transportation and to VISION UPS. Externally undetectable damage must be reported in writing to the transport company and VISION UPS immediately after discovery, at the latest within three days of delivery. VISION UPS is not liable for transport damages that occur during the initial delivery of VISION UPS products by the retailer.</p>
				<p>d) The scope of delivery of the exchange unit does not include any accessories.</p>

				<h2>5. Non-registered returns</h2>
				<p>In case of unauthorized return VISION UPS may refuse the processing of the claim.</p>

				<h2>6. Error analyses and measurements on the battery module LFP3500</h2>
				<p>For accurate analysis, the battery module can be sent to VISION UPS to verify justification of warranty claim.</p>
				<p>In case of dissatisfaction with the results of the analysis for the expected products, final evaluation of the product will be submitted to an independent, certified laboratory. If the claim is justified, VISION UPS will bear the cost of the verification, otherwise it will be the responsibility of the Distributor.</p>
				<p>The following conditions must be met for any capacity test or measurement for warranty claim notification:</p>
				<p>a. the average ambient temperature is: 25°C±2°C</p>
				<p>b. the initial operating temperature of the battery is: 25°C±1°C</p>
				<p>c. after 100% full charge, is discharged with a current of 10A.</p>
				<p>If the product is no longer available, the manufacturer may replace it with a remanufactured or another product or required parts, provided which are correspond to the acquired technical standard.</p>

				<h2>7. Data Backup</h2>
				<p>It is the Distributor's responsibility to back up any software and/or data, in particular the configuration of the Device, that he has installed on or stored on the Device. VISION UPS may delete the configuration of the Device submitted by Distributor and/or return the Device or a replacement Device with a different version of the firmware. VISION UPS shall not be liable for any damage resulting from loss of data, replacement of equipment, or installation of any other version of the firmware under warranty. The Sales partner is not entitled has no right to restore its hardware or software configuration.</p>

				<h2>8. Exclusion of warranty (inverter and cliX cabinet)</h2>
				<p>Any warranty claims are particularly excluded, if</p>
				<p>a. the serial number label has been removed from the unit,</p>
				<p>b. the device has been damaged or destroyed by force majeure or neglect.</p>
				<p>c. the device has been damaged or destroyed by environmental influences for which the protection class IP20 of the device is not suitable (moisture, lightning, dust, fire, corrosive gas, weather conditions),</p>
				<p>d. the device has been stored or operated under conditions that are outside the technical specifications in the data sheet and operating instructions,</p>
				<p>e. the damage has occurred due to improper handling - in particular due to non-observance of the system description and the operating instructions,</p>
				<p>f. the device has been opened, repaired or modified by persons not authorized by VISION UPS or by unauthorized persons,</p>
				<p>g. the device shows mechanical damage of any kind, regardless of whether it was caused during or after transportation,</p>
				<p>h. the inverter has been subjected to an overload (independent of the system mode) of more than 3300W per phase more than 3 times during UPS operation (e.g. if the device is manually switched on again by the customer more than 2 times during a power failure and simultaneous overload).</p>
				<p>i. if the complete system has been overloaded with more than 32/35A in backup mode.</p>
				<p>j. the inverter has been operated with batteries or other system components not sold by Vision UPS Systems Sarl for this system, or with components not authorized by the manufacturer.</p>
				<p>k. the warranty claim has not been notified in accordance with the warranty conditions, or if transport damage has not been notified in accordance with the warranty conditions</p>
				<p>l. In the absence of the conditions set out in point 3.</p>
				
				<h2>9. Warranty exclusion (battery module LFP3500)</h2>
				<p>In addition to the statutory provisions, the following damage, defects or malfunctions to the product lead to the exclusion of the warranty:</p>
				<p>a. the serial number label has been removed from the unit,</p>
				<p>b. storage of the battery at a temperature of less than 5°C or more than 40°C;</p>
				<p>c. malfunction of the inverter, except if this malfunction is an inverter warranty case on the part of the inverter manufacturer</p>
				<p>d. use with inverters other than batterX Home Series h10.</p>
				<p>e. use at ambient temperatures outside a of 5°C and 40°C and a temperature of less than 15°C or more than 30°C on average,</p>
				<p>f. use of the battery below the maximum discharge depth.</p>
				<p>g. the inverter has been exposed to an overload (independent of the system mode) of more than 3300W per phase more than 3 times in UPS operation (e.g. if the device is manually switched on again more than 2 times by the customer during a power failure and simultaneous overload).</p>
				<p>h. any physical damage</p>
				<p>i. opening, repair, modification or programming by persons not authorized or authorized by VISION UPS or its distributors,</p>
				<p>j. water, cold, fire, dust, corrosive gas, for which the IP20 protection class of the device is not suitable.</p>
				<p>k. Use with other types of batteries</p>
				<p>l. Usage of the system in another way than that specified in the instruction manual</p>
				<p>m. Damage to batteries due to fire, frost, neglect, force majeure, abuse or destruction.</p>
				<p>n. the warranty claim has not been reported in accordance with the warranty conditions, or transport damage has not been reported in accordance with the warranty conditions.</p>
				<p>o. In the absence of the conditions set out in point 3.</p>

				<h2>10. Operating error</h2>
				<p>In case when the reported malfunction of the device was obviously caused by third-party hardware, third-party software, installation or operation, or if the description of the fault by the sales partner turns out to be obviously misleading, VISION UPS reserves the right to charge the sales partner for the expenses incurred.</p>

				<h2>11. Supplementary regulations</h2>
				<p>a) Further claims, in particular claims for damages (compensation for loss of profit, indirect or consequential damages, etc.), rescission or loss of profit, indirect or consequential damages, etc.), rescission or reduction, not substantiated. Legal claims, e.g. in the case of personal injury or damage to privately used items under the Product Liability Act or in cases of intent or gross negligence, shall remain unaffected.</p>
				<p>b) The guarantee is only granted to the sales partner of VISION UPS.</p>
				<p>c) By concluding the purchase, the Distributor acknowledges the warranty conditions and the General Terms and Conditions of VISION UPS Systems Sàrl.</p>
				<p>d) Further or other claims, in particular claims for compensation for damages incurred outside the device, are excluded unless liability is mandatory by law.</p>
				<p>e) The warranty conditions apply in the version currently posted or linked on the VISION UPS Systems Sàrl website (www.visionups.com).</p>
				<p>f) This warranty shall be governed by the laws of the Grand Duchy of Luxembourg.</p>



			<?php endif; ?>



		</div>





		<div class="d-print-none">
			
			<div class="divider"><hr></div>

			<div id="confirm" class="container py-5">
				<div class="custom-control custom-checkbox py-2">
					<input type="checkbox" class="custom-control-input" id="checkboxAccept">
					<?php if(in_array($installerCountry, ["de", "at", "ch"])): ?>
						<label class="custom-control-label" for="checkboxAccept">Ich bestätige, dass ich alle <a href="#">Garantiebestimmungen</a> sowie <a href="https://www.batterx.io/datenschutz/" target="_blank">Datenschutz</a> und <a href="https://www.batterx.io/datenschutz/" target="_blank">Cookie-Richtlinien</a> gelesen und sie vollständig verstanden und akzeptiert habe.</label>
					<?php else: ?>
						<label class="custom-control-label" for="checkboxAccept">I confirm that I have read all <a href="#">warranty conditions</a> as well as <a href="https://www.batterx.io/datenschutz/" target="_blank">privacy</a> and <a href="https://www.batterx.io/datenschutz/" target="_blank">cookie policies</a> and that I fully understand and accept them.</label>
					<?php endif; ?>
				</div>
			</div>

		</div>





		<script src="js/dist/bundle.js?v=<?php echo $versionHash ?>"></script>
		<script src="js/common.js?v=<?php echo $versionHash ?>"></script>
		<script>const lang = <?php echo json_encode($lang) ?>;</script>
		<script src="js/accept_terms.js?v=<?php echo $versionHash ?>"></script>





	</body>

</html>
