<?php
// Map each step to (file, translated tooltip label). Step 1 (software_update) is NOT clickable — it's below the back-nav boundary (installer_login is the terminal back point).
$stepMap = [
    1 => ["file" => "software_update.php",       "label" => t("su_title")],
    2 => ["file" => "installer_login.php",       "label" => t("il_title")],
    3 => ["file" => "customer_info.php",         "label" => t("ci_title")],
    4 => ["file" => "system_detect.php",         "label" => t("sd_title")],
    5 => ["file" => "system_setup.php",          "label" => t("ss_title")],
    6 => ["file" => "system_test.php",           "label" => t("st_title")],
    7 => ["file" => "accept_terms.php",          "label" => t("at_title")],
    8 => ["file" => "installation_summary.php",  "label" => t("is_title")],
];
function renderStep($n, $current, $stepMap) {
    $state       = ($n == $current) ? "active" : (($n < $current) ? "done" : "");
    $isClickable = ($n === $current - 1 && isset($stepMap[$n]));
    if($n < $current) {
        // Done: checkmark by default; back-arrow on hover when clickable
        $content = '<i class="bi bi-check-lg step-icon-default"></i>';
        if($isClickable) $content .= '<i class="bi bi-chevron-left step-icon-hover"></i>';
    } else {
        $content = $n;
    }
    $dot = "<span class=\"step {$state}\">{$content}</span>";
    if($isClickable) {
        $file  = $stepMap[$n]["file"];
        $label = $stepMap[$n]["label"];
        return "<a href=\"{$file}\" class=\"text-decoration-none\" data-bs-toggle=\"tooltip\" data-bs-placement=\"bottom\" data-bs-title=\"{$label}\">{$dot}</a>";
    }
    return $dot;
}
?>

<div class="steps d-flex align-items-center justify-content-center mb-4 mb-md-5">
    <?php echo renderStep(1, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 1 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(2, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 2 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(3, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 3 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(4, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 4 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(5, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 5 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(6, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 6 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(7, $step, $stepMap); ?>
    <div class="step-line <?php echo $step > 7 ? 'done' : ''; ?>"></div>
    <?php echo renderStep(8, $step, $stepMap); ?>
</div>
