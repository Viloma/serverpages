function createCookie(name, value, hours) {
    var expires;

    if (days) {
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

function getServerPageToken(){
	console.log('calling token timer');
	Meteor.call('getServerPageToken', function(err, id){
		console.log(err, id);
		if(!err)
			createCookie('serverPageToken', id, 6);
	});
}

var tokenTimer;

if(Meteor.isClient){
	Tracker.autorun(function() {
	  if(Meteor.user){
		if (Meteor.userId()) {
			console.log('logged in - getting token');
			getServerPageToken();
			tokenTimer = setInterval(function () {getServerPageToken()}, 5* 60 * 1000);
		}
		else{
			console.log('logged out');
			eraseCookie('serverPageToken');
			window.clearInterval(tokenTimer)
		}
	  }
	});
}