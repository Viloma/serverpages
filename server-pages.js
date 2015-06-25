// Write your package code here!

var fs = Npm.require('fs');
var ServerPageTokens = null;

var inDevelopment = function () {
  return false;//process.env.NODE_ENV === "development";
};
 

ServerPages = {
	inDev: inDevelopment(),
	templates: {},
	setupPublicFolder : function(path, folder){
		StaticServer.add(path, folder);
	},
	compileTemplate : function(txt, tag){
		var parts = txt.split("!!!"); 
		for(var p in parts){
			var subparts = parts[p].split("!:!");
			if(subparts.length == 2){
				console.log('compiling '+subparts[0]);
				SSR.compileTemplate(subparts[0], subparts[1]);
				ServerPages.templates[subparts[0]] = { tag: tag, inSync: true};
			}
	    else
	        console.log('could not compile  '+ parts[p]);   	
	 	}
	}, 
	compileFile : function(filename){
			var txt = fs.readFileSync(filename, {encoding: 'utf-8'});
			ServerPages.compileTemplate(txt, filename);
	},
	setupTemplateFolder : function(folder){
		var dirs = [];
		
		if(ServerPages.inDev){
			fs.watch(folder, function(event, filename){
				console.log('changed '+filename);
				var tmplKeys = Object.keys(ServerPages.templates);
				var fullpath = folder + '/' + filename;
				for(var t in tmplKeys){
					var tmplInfo = ServerPages.templates[tmplKeys[t]];
					if(tmplInfo.tag === fullpath && tmplInfo.inSync){
						tmplInfo.inSync = false;
						console.log('setting templ in sync to false '+tmplKeys[t]);
					}
				}
			});
		}

		dirs = fs.readdirSync(folder);
		for(var d in dirs){
			console.log('compiling '+dirs[d]);
			var filename = folder+'/'+dirs[d];
			ServerPages.compileFile(filename);
		}
	},
	render : function (template, data, response, meta){
	    //return "{{>header}}{{>"+template+"}}{{>footer}}";
	      if(ServerPages.inDev){
	      		var tmpl = ServerPages.templates[template];
	      		if(!tmpl.inSync){
	      			console.log('reloading template '+tmpl.tag);
	      			ServerPages.compileFile(tmpl.tag);
	      		}
	      		else
	      			console.log('template in sync '+template);
	      }

	      var res = SSR.render(template, data);
	      var output = "<!DOCTYPE html><html><head>";
	      if(ServerPages.templates["head"])
	      		ouptut = output + ServerPages.templates["head"];

			output += "<meta name='viewport' content='width=device-width, initial-scale=1'><meta charset='utf-8'>";

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
					  		else
							    output += "<meta name='"+key+"' content='"+val+"'>";
						}
					}
				}
			}
			if(Meteor.users)
				output =  output + "<script src='/files/spages-check.js'></script>";
			output += "</head><body>"+res+"</body></html>";

	      //return res;
	      if(ServerPages.inDev){
			response.setHeader('cache-control', 'no-cache');
			response.setHeader('expires', '0');
			response.setHeader('charset', 'utf-8');
	      }
	      response.writeHead(200, {'Content-Type': 'text/html'});
	      response.write(output);
	      response.end();
	}
}; 
if (Meteor.isServer) { 
	Meteor.startup(function(){
		var prefix = 'assets/packages/viloma_server-pages/';
		if(ServerPages.inDev)
			prefix =  '../../../../../.spages/';
		console.log( ' isDev '+ServerPages.inDev + ' cwd: '+ process.cwd());
		ServerPages.setupPublicFolder('/files', prefix + 'public');
		ServerPages.setupTemplateFolder( prefix + 'templates'); 
	});

	if(Meteor.isServer && Meteor.users)
	{
		if(ServerPageTokens == null)
			ServerPageTokens = new Mongo.Collection("serverpagetokens");
		Meteor.methods({
		  	getServerPageToken: function () {
		  		if(Meteor.userId()){
		  			var token = Meteor.uuid();
		  			ServerPageTokens.insert({_id: token, date : new Date()});
			  		return token;
			  	}
			}
		});
	}
}