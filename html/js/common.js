const PNS_DEVICE = {
    ""          : { "type" : ""              , "version" : 0 , "name" : ""                             },
    "K800301"   : { "type" : "batterx_i"     , "version" : 1 , "name" : "batterX i10"                  },
    "K800302"   : { "type" : "batterx_i"     , "version" : 1 , "name" : "batterX i15"                  },
    "K800303"   : { "type" : "batterx_i"     , "version" : 1 , "name" : "batterX i20"                  },
    "K800304"   : { "type" : "batterx_i"     , "version" : 1 , "name" : "batterX i30"                  },
    "K010000-2" : { "type" : "batterx_h10"   , "version" : 2 , "name" : "batterX h10"                  },
    "100384"    : { "type" : "batterx_h10"   , "version" : 1 , "name" : "batterX h10"                  },
    "100339"    : { "type" : "batterx_h5"    , "version" : 1 , "name" : "batterX h5"                   },
    "200468"    : { "type" : "batterx_h5000" , "version" : 1 , "name" : "batterX h5000"                },
    "200310"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 10 KVA / 9 KW"    },
    "100355"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 15 KVA / 13.5 KW" },
    "100346"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 20 KVA / 18 KW"   },
    "100350"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 30 KVA / 27 KW"   },
    "100356"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 40 KVA / 36 KW"   },
    "100366"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 60 KVA / 54 KW"   },
    "100202"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 80 KVA / 72 KW"   },
    "100203"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 100 KVA / 90 KW"  },
    "100204"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 120 KVA / 108 KW" },
    "100394"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 160 KVA / 144 KW" },
    "100206"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 200 KVA / 180 KW" },
    "100207"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 250 KVA / 225 KW" },
    "100208"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 300 KVA / 270 KW" },
    "100209"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 400 KVA / 360 KW" },
    "100210"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 500 KVA / 450 KW" },
    "200603"    : { "type" : "batterx_ups"   , "version" : 1 , "name" : "batterX UPS 600 KVA / 540 KW" }
}

const PNS_BOX = {
    ""          : { "type" : ""   , "version" : 0 , "name" : ""               },
    "K800311"   : { "type" : "ie" , "version" : 1 , "name" : "batterX EMX"    },
    "K800414-8" : { "type" : "xc" , "version" : 7 , "name" : "cliX 2.0"       },
    "K800415-8" : { "type" : "xc" , "version" : 7 , "name" : "cliX 2.0"       },
    "K800414-7" : { "type" : "xc" , "version" : 6 , "name" : "cliX 2.0"       },
    "K800415-7" : { "type" : "xc" , "version" : 6 , "name" : "cliX 2.0"       },
    "K800414-6" : { "type" : "xc" , "version" : 5 , "name" : "cliX 2.0"       },
    "K800415-6" : { "type" : "xc" , "version" : 5 , "name" : "cliX 2.0"       },
    "K800414-5" : { "type" : "xc" , "version" : 4 , "name" : "cliX 2.0"       },
    "K800415-5" : { "type" : "xc" , "version" : 4 , "name" : "cliX 2.0"       },
    "K800414-4" : { "type" : "xc" , "version" : 3 , "name" : "cliX 2.0"       },
    "K800415-4" : { "type" : "xc" , "version" : 3 , "name" : "cliX 2.0"       },
    "200414-21" : { "type" : "xc" , "version" : 2 , "name" : "cliX 2.0"       },
    "200415-21" : { "type" : "xc" , "version" : 2 , "name" : "cliX 2.0"       },
    "200414"    : { "type" : "xc" , "version" : 1 , "name" : "cliX 1.0"       },
    "200415"    : { "type" : "xc" , "version" : 1 , "name" : "cliX 1.0"       },
    "100408"    : { "type" : "xh" , "version" : 1 , "name" : "liveX home"     },
    "100389"    : { "type" : "xb" , "version" : 1 , "name" : "liveX business" },
    "200951"    : { "type" : "xt" , "version" : 1 , "name" : "traX 2"         },
    "200950"    : { "type" : "xt" , "version" : 1 , "name" : "traX 1"         }
}





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
