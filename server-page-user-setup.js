// some function to read write cookie
function createCookie(name, value, hours) {
    var expires;

    if (hours) {
        var date = new Date();
        date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// this function gets a token for the user and writes it out to a cookie
function getServerPageToken(){
	console.log('calling token timer');
	Meteor.call('getServerPageToken', function(err, id){
		if(!err){
			createCookie('serverPageToken', id, 24 * 14); // 2 weeks expiry
		}
		else
			console.log('error getting token :' +err);
	});
}

//var tokenTimer;

if(Meteor.isClient){
	Tracker.autorun(function() {
		// on client if user accounts is defined then keep track of user login/logout
		// and setup a timer to update user token periodically
		// this only works while the user has a meteor window open - not moved over to a Server Page window
	  if(Meteor.user){
		if (Meteor.userId()) {
			console.log('logged in - getting token');
			getServerPageToken();
//			tokenTimer = setInterval(function () {getServerPageToken()}, 60* 60 * 1000);
		}
		else{
			console.log('logged out');
			eraseCookie('serverPageToken');
//			window.clearInterval(tokenTimer)
		}
	  }
	});
}
/*
Meteor.startup(function(){
	if( Package['iron:router']){
		console.log('found iron router');
		var Router = Package['iron:router'].Router;
		Router.route('/serverPageLogin', function () {
			console.log('got request for serverPageLogin');
		  	this.render('serverPageLogin');
		});
	}
	else
		console.log('no iron router');
});*/