// Write your package code here!

var fs = Npm.require('fs');

// ConnectR is used to serve static files
// thanks to https://github.com/williamledoux/meteor-static-server/blob/master/staticserver.js
// cannot use that module as dependency - because it gives error that code sould run in fiber
var connect  = Npm.require('connect');
var connectr = Npm.require('connectr');
var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');

var ServerPageTokens = null;

// in development mode - file reload support etc is needed
var inDevelopment = function () {
  return process.env.NODE_ENV === "development";
};

// enabling dynamic connect modification on connecthandlers
connectr.patch(WebApp.connectHandlers);

// these files are ignored by meteor
var ignore_files = [
    /~$/, /^\.#/, /^#.*#$/,
    /^\.DS_Store$/, /^ehthumbs\.db$/, /^Icon.$/, /^Thumbs\.db$/,
    /^\.meteor$/, /* avoids scanning N^2 files when bundling all packages */
    /^\.git$/ /* often has too many files to watch */
];

// check if the files are not in the ignore list
function toBeIgnored(filename){
	for(var i in ignore_files){
		if(filename.match(ignore_files[i]))
			return true;
	}
	return false;
} 

function getCookies(c) {
    var cookie = c, v = 0, cookies = {};
    if (cookie.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
        c = RegExp.$1;
        v = 1;
    }
    if (v === 0) {
        c.split(/[,;]/).map(function(cookie) {
            var parts = cookie.split(/=/, 2),
                name = decodeURIComponent(parts[0].trimLeft()),
                value = parts.length > 1 ? decodeURIComponent(parts[1].trimRight()) : null;
            cookies[name] = value;
        });
    } else {
        c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function($0, $1) {
            var name = $0,
                value = $1.charAt(0) === '"'
                          ? $1.substr(1, -1).replace(/\\(.)/g, "$1")
                          : $1;
            cookies[name] = value;
        });
    }
    return cookies;
}

// this is the object exported from this package - to support Server pages
// it basically supports 
// - setupPublicFolder - which makes files from folder on disk - available on the web
// - compileTemplate - which loads a file containing multiple templates and heads using SSR
// - setupTemplateFolder - which loads all templates from a folder 
// - render - which renders the page on the server and servers it out
// - getUserInsecure - if accounts is used - then this api - lets SSR routes find out the userId
//				- this api uses Cookies which has known vulnerabilities - so it should NOT be used for sensitive information
//				- this api should be used for SSR customization purposes only - all transactions should happen over client side Meteor
ServerPages = {
	inDev: inDevelopment(),
	templates: {},
	setupPublicFolder : function(path, folder){
		// if folder exists
	    if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
	    		// setting up directory under a Fiber context - to modify the meteor webapp connection handlers
				Fiber(function () {
					// also wraping the connect.static callback in wrapAsyn
			    	WebApp.connectHandlers.use(path, Meteor.wrapAsync(connect.static(folder), connect));
			    }).run();

			return true;
	    }
		else
			console.log('location is not a directory');
		return false;
	},
	compileTemplate : function(txt, tag){
		// find template sections with name and inner text section in the template text
		var myRegexp = /\<template\s+name\s*=\s*['"](\S+)['"]\s*\>([\s\S]*?)\<\/template\s*>/g;
		var match = myRegexp.exec(txt);

//		console.log('compiling '+tag);
		while (match != null) {
//		    console.log('compiling '+match[1]);
				
			try{
				// for all the matches - compile the name(1) to text(2) using SSR
				SSR.compileTemplate(match[1], match[2]);
			}catch(e){
				console.log('failed to compile template '+match[1] +' error:'+e);
			}

			// save this data in template 
			ServerPages.templates[match[1]] = { tag: tag, inSync: true, text: match[2]};

			// get next match
		    match = myRegexp.exec(txt);
		}
	}, 
	compileFile : function(filename){
			var txt = fs.readFileSync(filename, {encoding: 'utf-8'});
			ServerPages.compileTemplate(txt, filename);
	},
	setupTemplateFolder : function(folder){
		var dirs = [];

		// check the file exists
	    if (! (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory())) {
	    	console.log('could not setupTemplateFolder as '+folder+' is not a directory');
	    	return false;
	    }
		
		// in dev mode - we watch the template folder - and mark template as dirty if something changes
		// we are using the .spages folder - so that project does not restart on every change
		// but we still want template changes to be picked up during development - the watch here does that
		if(ServerPages.inDev){
			fs.watch(folder, function(event, filename){
				console.log('changed '+filename);
				var tmplKeys = Object.keys(ServerPages.templates);
				var fullpath = folder + '/' + filename;
				for(var t in tmplKeys){
					var tmplInfo = ServerPages.templates[tmplKeys[t]];
					// if the template came from this file - then mark template as not inSync
					if(tmplInfo.tag === fullpath && tmplInfo.inSync){
						tmplInfo.inSync = false;
						//console.log('setting templ in sync to false '+tmplKeys[t]);
					}
				}
			});
		}

		// read files in the folder and comple templates
		dirs = fs.readdirSync(folder);
		for(var d in dirs){
			console.log('compiling '+dirs[d]);
			// ignore bad files
			if(!toBeIgnored(dirs[d])){
				var filename = folder+'/'+dirs[d];
				if(fs.lstatSync(filename).isFile())
					ServerPages.compileFile(filename);
				else // recursively setup child folders
					ServerPages.setupTemplateFolder(filename);
			}
		}
		return true;
	},
	checkTemplateExists: function(templatename){
		return templates[templatename];
	},
	render : function (template, data, response, meta){
		// in dev mode - if the temlate has been marked dirty then reload it
	      if(ServerPages.inDev){
	      		var tmpl = ServerPages.templates[template];
	      		if(!tmpl.inSync){
	      			console.log('reloading template '+ template+' from file '+tmpl.tag);
	      			// reload by re-compiling file
	      			ServerPages.compileFile(tmpl.tag);
	      		}
	      }

	      // render the template itself using SSR
	      var res = SSR.render(template, data);

	      var output = "<!DOCTYPE html><html><head>";

	      // append a common head template - if present
	      if(ServerPages.templates[template+"-head"])
	      		output += ServerPages.templates[template+"-head"].text;	      
	      else if(ServerPages.templates["head"])
	      		output += ServerPages.templates["head"].text;

	      	// if template specific head is present - append that
	      if(ServerPages.templates["head-"+template])
	      		output += ServerPages.templates["head-"+template].text;

//			output += "<meta name='viewport' content='width=device-width, initial-scale=1'><meta charset='utf-8'>";

			var contentType = "text/html";
			// if meta has been defined in code - append it to the head
			if(meta){
				var keys = Object.keys(meta);				
				for(var k in keys){
					var key = keys[k];
					var val = meta[key];
				  if(key === "title")
					output= output + "<title>"+val+"</title>";
				  else{
					  if(val === "css")
						 output +="<link rel='stylesheet' href='"+key+"'>";
					  else{
					  		if(val == "script")
					  			output += "<script src='"+key+"'></script>"
					  		else{
					  			if(val == "content-type")
					  				contentType = key;
					  			else
								    output += "<meta name='"+key+"' content='"+val+"'>";
					  		}
						}
					}
				}
			}

			// append result
			output += "</head><body>"+res+"</body></html>";

	      //in dev mode - disable caching of responses 
	      if(ServerPages.inDev){
			response.setHeader('cache-control', 'no-cache');
			response.setHeader('expires', '0');
			response.setHeader('charset', 'utf-8');
	      }

	      // write out the whole result
	      response.writeHead(200, {'Content-Type': contentType});
	      response.write(output);
	      response.end();
	},
// - getUserInsecure - if accounts is used - then this api - lets SSR routes find out the userId
//				- this api uses Cookies which has known vulnerabilities - so it should NOT be used for sensitive information
//				- this api should be used for SSR customization purposes only - all transactions should happen over client side Meteor
	getIndicativeUserId : function(request){
		if(request && request.headers && request.headers.cookie){
			// serverPageToken is set by server-page-user-setup.js if accounts package is present
			var token = getCookies(request.headers.cookie)['serverPageToken'];
			//console.log('got token '+token);
			if(token){
				// find the user corresponding to the token
				var tokenRec = ServerPageTokens.findOne({_id: token});
				if(tokenRec)
					return tokenRec.user;
				else
					console.log('no token rec '+token);

			}
		}
	},
	getIndicativeUser: function(request){
		var userId = getIndicativeUserId(request);
		if(userId)
			return Meteor.users.findOne(userId);
	}
}; 
if (Meteor.isServer) { 
	Meteor.startup(function(){

		// setup using .spages as the static page folder
		// if uat/prod - then the file will be in assets - otherwise in .spages in root folder
		// there does not seem to be a good way of telling which folder - other than hardcoding it here
		var prefix = 'assets/packages/viloma_server-pages/';
		if(ServerPages.inDev)
			prefix =  '../../../../../.spages/';
		console.log( ' isDev '+ServerPages.inDev + ' cwd: '+ process.cwd());

		// setup /files to point to .spages/public folder
		ServerPages.setupPublicFolder('/files', prefix + 'public');

		// load all templates in .spages/templates folder
		ServerPages.setupTemplateFolder( prefix + 'templates'); 

		if(Meteor.users)
		{
			// if this project uses accounts package then serup getServerPageToken
			if(ServerPageTokens == null)
				ServerPageTokens = new Mongo.Collection("serverpagetokens");
			Meteor.methods({
			  	getServerPageToken: function () {
			  		if(Meteor.userId()){
				  		// assign a new token to every call of this function
			  			var userRec = ServerPageTokens.findOne({user: Meteor.userId()});
			  			if(!userRec){
			  				userRec = {_id: Meteor.uuid(), user: Meteor.userId(), date : new Date()};
				  			ServerPageTokens.insert(userRec);
				  		}
				  		return userRec._id;
				  	}
				}
			});

 
		}
		else
			console.log('no accounts package');
	});

}
