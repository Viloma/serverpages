
//console.log('building server-pages \n');

// Upon building server pages - it basically copies files from .spages directory into assets

// the way package manager works - only way to get access to a compileStep object -
// is to register a handler for a file extension - and have a file of that type
// We dont need any special file types - but to get access to compileStep - we will create 
// a dummy file type .spages - with callback handleSpages - where we do the rest

var fs = Npm.require('fs');

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
// copy all files from .spages into assets
function addAllAssets(dir, compileStep){
	var fileNo = 0;
	try{
	    if (fs.existsSync(dir) &&  fs.lstatSync(dir).isDirectory()) {
	    	// read all files in the directory
			var files = fs.readdirSync(dir);
			for(var f in files){

				// file maybe on ignore list - the ignore
				if(!toBeIgnored(files[f]))
				{
					var fullpath = dir + '/' + files[f];

					// if it is a file then copy it 
					if(fs.lstatSync(fullpath).isFile()){
						var bin = fs.readFileSync(fullpath);
						compileStep.addAsset({path: fullpath.substr(7), data:bin});
						fileNo++;
					}
					else // for directory - recursively copy
						fileNo += addAllAssets(fullpath, compileStep);
				}
			}
		}
	}catch(e){
		console.log('could not add assets '+e);
	}
	return fileNo;
}
var handleSpages = function(compileStep){
 	var fileNo = addAllAssets('.spages', compileStep);
 	/*
 	// server-page-user-check.spages is a dummy file to trigger the callback.
 	// we can use it as a SSR rendered client only javascript file - but this will require some cleanup
	var fileContents = compileStep.read().toString('utf8');
	if(fs.existsSync('.spages') && fs.existsSync('.spages/public') && !fs.existsSync('.spages/public/spages-check.js')){
		console.log('writing file');
		fs.writeFile('.spages/public/spages-check.js', fileContents);
	}
	compileStep.addAsset({path: 'public/spages-check.js', data: fileContents});
	*/
	console.log('spages copied '+fileNo+' files from .spages');
}

// the way package manager works - only way to get access to a compileStep object -
// is to register a handler for a file extension - and have a file of that type
// We dont need any special file types - but to get access to compileStep - we will create 
// a dummy file type .spages - with callback handleSpages - where we do the rest
Plugin.registerSourceHandler("spages", handleSpages);