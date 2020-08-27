const fs = require("fs");
var filePath;

function setFile(file){
  filePath = file;
}
exports.setFile = setFile;

function get(file, path){
  var output
  fs.readFile(file, 'utf-8', function(err, data) {
	  if (err) throw err
    var localPath = this.path;
	  var arrayOfObjects = JSON.parse(data)
	  this.output = arrayOfObjects.localPath;
    
  });
  return output;
}
exports.get = get;

function set(file, path, newData) {
  var output;
  fs.readFile(filePath, 'utf-8', function(err, data) {
	  if (err) throw err

	  var arrayOfObjects = JSON.parse(data);
	  arrayOfObjects.path = newData;
    
    fs.writeFile(filePath, JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
		  if (err) throw err
		  console.log('Done!')
	  });
  });
}
exports.set = set;