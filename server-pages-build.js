
console.log('ok building server-pages \n');
var fs = Npm.require('fs');

function addAllAssets(dir, compileStep){
	var files = fs.readdirSync(dir);
	for(var f in files){
		var fullpath = dir + '/' + files[f];

		console.log('copying file '+fullpath);
		if(fs.lstatSync(fullpath).isFile()){
			var bin = fs.readFileSync(fullpath);
			compileStep.addAsset({path: fullpath.substr(7), data:bin});
		}
		else
			addAllAssets(fullpath, compileStep);
	}
}
var handleSpages = function(compileStep){
	addAllAssets('.spages', compileStep);
}
Plugin.registerSourceHandler("spages", handleSpages);