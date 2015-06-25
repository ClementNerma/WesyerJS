#!/usr/bin/env node

/* Define system functions */

/* Make a directory */
function mkdir(dir) {
	try {
		if(fs.existsSync(dir) && fs.lstatSync(dir).isDirectory())
			return true;

		fs.mkdirSync(dir);
		return true;
	}

	catch(e) {
		return false;
	}
}

/* Read a file */
function readFile(file, encoding) {
	try {
		return fs.readFileSync(file, encoding);
	}

	catch(e) {}
}

/* Write a file */
function writeFile(file, content, encoding) {
	try {
		fs.writeFileSync(file, content, encoding);
		return true;
	}

	catch(e) {
		return false;
	}
}

/* Read a directory */
function readDir(dir) {
	try {
		return fs.readdirSync(dir);
	}

	catch(e) {
		return false;
	}
}

/* Delete a non-empty folder */
var deleteFolderRecursive = function(dir) {
  if( fs.existsSync(dir) ) {
    fs.readdirSync(dir).forEach(function(file,index){
      var curPath = dir + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
};

/* Merge two objects recursively */
function MergeRecursive(obj1, obj2) {


  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}

/* Load NodeJS modules */
try {
	var colors  = require('chalk');
	var fs      = require('fs');
	var http    = require('http');
	var glob    = require('glob');
	var path    = require('path');
}

catch(e) {
	if(typeof colors !== 'undefined')
		console.error(colors.red('Can\'t load NodeJS required modules :\n\n' + e.stack));
	else
		console.error('Can\'t load NodeJS required modules :\n\n' + e.stack);

	process.exit();
}

/* Change here the taskfile name */
var taskfile_name = 'taskfile.js';

/* Extract command-line arguments */
var unsorted_args = process.argv.slice(2);

function argument(_short, _long) {
	return short[_short] || long[_long];
}

var args = [];
var short = {};
var long = {};

for(var i = 0; i < unsorted_args.length; i++) {
	
	if(unsorted_args[i].substr(0, 1) === '-') {

		var isLong = unsorted_args[i].substr(0, 2) === '--';
		var hasEqual = unsorted_args[i].indexOf('=') !== -1;

		(isLong ? long : short)[hasEqual ? unsorted_args[i].substr(1 + isLong, unsorted_args[i].indexOf('=') - 1 - isLong) : unsorted_args[i].substr(1 + isLong)] = (hasEqual ? unsorted_args[i].substr(unsorted_args[i].indexOf('=') + 1) : true);

	} else {

		args.push(unsorted_args[i]);

	}

}

if(!args[0]) {
	args[0] = 'default';
	//return console.error(colors.red('Missing action parameter.') + '\nSyntax : wesyer [action]');
}

/* Define Wesyer global interface */

var Wesyer = function() {

	var _tasks = {};
	var _modules = {};

	this.File = function(input, match, encoding) {

		var _inputEncoding = encoding || config.encoding;
		var _path = input;
		var _match = match;
		var _basename = _path.substr(_path.lastIndexOf('/') + 1);
		
		try {
			var _content = fs.readFileSync(input, encoding);
		}

		catch(e) {
			console.error(colors.red('Can\'t read file ') + colors.cyan(input) + colors.red('\nProcess aborted'));
			process.exit();
		}

		this.path = function() {
			return _path;
		};

		this.encoding = function() {
			return _inputEncoding;
		}

		this.basename = function() {
			return _basename;
		}

		this.match = function() {
			return _match;
		}

		this.pipe = function(module) {
			var output = Wesyer.module(module, this);

			if(typeof output !== 'undefined')
				_content = output;

			return this;
		};

		this.apply = function(callback) {
			return callback(_content);
		};

		this.do = function(callback) {
			try {
				_content = callback(_content);
				return this;
			}

			catch(e) {
				return false;
			}
		}

		this.out = function(output, options) {

			if(!options) options = {};

			var out;

			if(!options.root) {
				out = path.join(output, _path);
			} else {
				out = path.join(output, _basename);
			}

			try {
	    		fs.writeFileSync(out, _content, options.encoding || _inputEncoding);
	    		
	    		if(argument('v', 'verbose') || config.verbose)
	    			console.info(colors.cyan('Successfully writed file ') + colors.green(_path) + colors.cyan(' (' + out + ')'));
	    		
	    		return this;
	    	}

	    	catch(e) {
	    		console.error(colors.red('Can\'t write file : ' + colors.cyan(_path) + ' to directory ' + colors.green(output)));

	    		if(argument('v', 'verbose') || config.verbose)
	    			console.error(colors.red(e.stack));

	    		return false;
	    	}

		};

	};

	this.Files = function(from, encoding) {

		var _inputEncoding = encoding || config.encoding;
		var _glob = glob.sync(from);
		var _files = [];

		if(!_glob.length)
			console.log('[TASK] No files found for ' + colors.green(from));

		for(var i = 0; i < _glob.length; i++) {
			//_files[_glob[i]] = new Wesyer.File(_glob[i], _inputEncoding);
			_files.push(new Wesyer.File(_glob[i], from, _inputEncoding));
		}

		this.match = function() {
			return _files;
		};

		this.encoding = function() {
			return _inputEncoding;
		}

		this.pipe = function(module) {

			for(var i = 0; i < _files.length; i++) {
				_files[i].pipe(module);
			}

			return this;

		};

	    this.forEach = function(callback) {
	    	
	    	for(var i = 0; i < _files.length; i++) {
	    		_files[files[i]].apply(callback);
	    	}

	    	return this;

	    };

	    this.out = function(output, options) {

	    	if(!options) options = {};
	    	if(!options.encoding) options.encoding = _inputEncoding;

	    	for(var i = 0; i < _files.length; i++) {
	    		_files[i].out(output, options);
	    	}

	    	return this;

	    };

	};

	this.task = function(name, callback) {

		if(typeof name !== 'string' || typeof callback !== 'function')
			return false;

		_tasks[name] = callback;
		return this;

	};

	this.run = function(task, args, context) {

		if(!_tasks[task])
			return console.error(colors.red('Task not found : ') + colors.green(task));

		if(!args)
			args = [];

		return _tasks[task].apply(context || null, args);

	};

	this.for = function(from, encoding) {

		try {
			return new this.Files(from, encoding);
		}

		catch(e) {
			console.error(colors.red('Can\'t get match for ') + colors.green(from) + colors.red('\nTask aborted\n\n' + e.stack));
			process.exit();
		}

	};

	this.module = function(module, applyTo) {

		if(_modules[module])
			return applyTo ? _modules[module](applyTo, this) : _modules[module];

		if(!/^([a-zA-Z0-9_\-]+)$/.test(module)) {
			console.error(colors.red('Invalid module name : ') + colors.green(module));
			process.exit();
		}

		var moduleDir = path.join('.wesyer', module);
		var files = readDir(moduleDir);

		if(!files) {
			console.error(colors.red('Can\'t read module directory : ') + colors.green(module));
			process.exit();
		}

		if(files.indexOf('package.json') === -1) {
			console.error(colors.red('Module ') + colors.cyan(module) + colors.red(' has no ') + colors.green('package.json') + colors.red(' file'));
			process.exit();
		}

		var pkg = readFile(path.join(moduleDir, 'package.json'), 'utf-8');

		if(typeof pkg === 'undefined') {
			console.error(colors.red('Can\'t read ') + colors.cyan('package.json') + colors.red(' file of module ') + colors.green(module));
			process.exit();
		}

		try {
			pkg = JSON.parse(pkg);
		}

		catch(e) {
			console.error(colors.cyan('package.json') + colors.red(' file of module ') + colors.green(module) + colors.red(' is not a valid JSON file'));
			process.exit();
		}

		var main = readFile(path.join(moduleDir, pkg.main), pkg.encoding || 'utf-8');

		if(typeof main === 'undefined') {
			console.error(colors.red('Can\'t read main file ') + colors.cyan('(' + pkg.main + ')') + colors.red(' of module ') + colors.green(module));
			process.exit();
		}

		_modules[module] = new Function(['input', 'Wesyer'], main);
		return applyTo ? _modules[module](applyTo, this) : _modules[module];

	};

};

/* Load native and user-defined taskfile */

var native_taskfile = readFile(path.join(__dirname, taskfile_name), 'utf-8');

if(typeof native_taskfile === 'undefined') {
	console.error(colors.red('Can\'t read native taskfile ') + colors.green('(' + path.join(__dirname, taskfile_name) + ')') + colors.red(' !'));
	return ;
}

var taskfile = readFile(taskfile_name, 'utf-8');

Wesyer = new Wesyer(config, configModel);

try {
	var config = {};

	eval(native_taskfile);

	if(taskfile)
		eval(taskfile);

	/* Add missing configuration properties */
	var configModel = {
		description: '',
		author: '',
		license: 'Apache 2.0',
		encoding: 'utf-8',

		modules: {
			repository: 'https://wesyerjs.olympe.in/modules'
		},

		verbose: false,

		server: {
			port: 8080,
			rootFile: ['index.html'],
			encoding: 'utf-8',
			templates: {},
			verbose: false,
			'mime-types': {}
		}
	};

	config = MergeRecursive(configModel, config);

}

catch(e) {
	console.error('An error has occured in the taskfile ' + colors.green('(' + taskfile_name + ')') + colors.red(' :\n' + e.stack));
	return ;
}

var cmd = args[0];
args = args.slice(1);

/* Package initialization model */

var packageInitModel = [
	{
		name: 'name',
		required: true,
		validator: /^([a-zA-Z0-9_\-]){3,30}$/,
		warning: 'Name must contains only letters, undersources and dashes (length must be between 3 and 30 characters)',
		store: function(packageModel, val) {
			packageModel.name = val;
		}
	},
	{
		name: 'description',
		required: true,
		validator: /^([a-zA-Z0-9_\- ]+){10,200}$/,
		warning: 'Description must contains only letters, digits, spaces, underscores and dashes (length must be between 10 and 200 characters)',
		store: function(packageModel, val) {
			packageModel.description = val;
		}
	},
	{
		name: 'author',
		required: true,
		warning: 'Author name is required',
		store: function(packageModel, val) {
			packageModel.author = val;
		}
	},
	{
		name: 'main',
		default: 'index.js',
		store: function(packageModel, val) {
			packageModel.main = val;
		}
	},
	{
		name: 'license',
		default: 'Apache 2.0',
		store: function(packageModel, val) {
			packageModel.license = val;
		}
	},
	{
		name: 'version',
		validator: /^([0-9]){1,2}\.([0-9]){1,2}\.([0-9]){1,2}$/,
		warning: 'Version must be three numbers (one or two digits) separed by dots (example: 1.12.0)',
		default: '0.0.0',
		store: function(packageModel, val) {
			packageModel.version = val;
		}
	}
];

Wesyer.run(cmd, args);
