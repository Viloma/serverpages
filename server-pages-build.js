
console.log('ok building server-pages \n');
var fs = Npm.require('fs');

function addAllAssets(dir, compileStep){
	try{
	    if (fs.existsSync(dir) &&  fs.lstatSync(dir).isDirectory()) {
			var files = fs.readdirSync(dir);
			for(var f in files){
				var fullpath = dir + '/' + files[f];

				if(fs.lstatSync(fullpath).isFile()){
					var bin = fs.readFileSync(fullpath);
					compileStep.addAsset({path: fullpath.substr(7), data:bin});
				}
				else
					addAllAssets(fullpath, compileStep);
			}
		}
	}catch(e){
		console.log('could not add assets '+e);
	}
}
var handleSpages = function(compileStep){
	addAllAssets('.spages', compileStep);
	var fileContents = compileStep.read().toString('utf8');
	compileStep.addAsset({path: 'public/spages-check.js', data: fileContents});
}
Plugin.registerSourceHandler("spages", handleSpages);