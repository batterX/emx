<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="author" content="Ivan Gavrilov">
<link rel="icon" href="img/favicon.png">

<title><?php echo $boxType == "livex" ? "batterX liveX" : "batterX EMX"; ?></title>

<link rel="stylesheet" href="css/dist/bundle.css?v=<?php echo $versionHash; ?>">
<link rel="stylesheet" href="css/common.css?v=<?php echo $versionHash; ?>">

<script>
    const PNS_DEVICE = <?php echo json_encode(PNS_DEVICE); ?>;
    const PNS_BOX = <?php echo json_encode(PNS_BOX); ?>;
    const lang = <?php echo json_encode($lang) ?>;
    const versionHash = <?php echo json_encode($versionHash); ?>;
    const boxType = <?php echo json_encode($boxType); ?>;
    const softwareVersion = <?php echo json_encode($softwareVersion); ?>;

    const repositoryVersionLink = "<?php echo $boxType == "livex" ? "https://raw.githubusercontent.com/batterX/LiveSmart-Home/master/version.txt" : "https://raw.githubusercontent.com/batterX/emx/main/version.txt"; ?>";
    const repositorySizeLink = "<?php echo $boxType == "livex" ? "https://raw.githubusercontent.com/batterX/LiveSmart-Home/master/size.txt" : "https://raw.githubusercontent.com/batterX/emx/main/size.txt"; ?>";

    // Server time synchronization (fixes offline detection when PC clock is incorrect)
    const serverTime = <?php echo time(); ?>; // Server time in seconds (Unix timestamp) - static at page load

    // Calculate offset between server time and local time (for dynamic updates)
    const serverTimeOffset = <?php echo time(); ?> - Math.floor(Date.now() / 1000);

    // Get current server time (dynamically calculated)
    function getServerTime() {
        return Math.floor(Date.now() / 1000) + serverTimeOffset;
    }
</script>
