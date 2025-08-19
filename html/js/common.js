/*
    Ripple Script
*/

$.ripple({ ".ripple": { touchDelay: 300 } });





/*
    Bullet Progress Bar
*/

var stepsSum = 8;

var $progress = $('#progress .progress-bar');
  
// Attach 'step' event on container.
$progress.on('step', function(e, stepIndex) {
    $progress.css('width', (stepIndex / stepsSum * 100) + '%');
});
  
// Trigger first bullet
$progress.trigger('step', 0);





/*
    Keep Session Active
*/

setInterval(() => {
    $.post({
        url: "cmd/session.php",
        error: () => { console.log("Error Keep Session Active"); },
        success: (response) => { console.log(response); }
    });
}, 60000);
