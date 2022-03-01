var lift_settings = {};
window.lift.extend(lift_settings,window.liftJQuery);
window.lift.extend(lift_settings,{"liftPath": "/lift", "ajaxRetryCount": 1, "ajaxPostTimeout": 60000, "gcPollingInterval": 180000, "gcFailureRetryTimeout": 15000, "cometGetTimeout": 140000, "cometFailureRetryTimeout": 10000, "cometServer": null, "logError": function(msg) {}, "ajaxOnFailure": function() {alert("The server cannot be contacted at this time");}, "ajaxOnStart": function() {jQuery('#'+"ajax-loader").show();}, "ajaxOnEnd": function() {jQuery('#'+"ajax-loader").hide();}});
window.lift.init(lift_settings);