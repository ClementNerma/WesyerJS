
/* Install a module */
Wesyer.task('install', function() {
	if(!args[0])
		return console.error(colors.red('Missing module name'));

	if(!fs.existsSync('.wesyer'))
		return console.error(colors.red('Wesyer is noti'))

	if(fs.existsSync(path.join('.wesyer', args[0])))
		return console.error(colors.red('Module ') + colors.green(args[0]) + colors.red(' already exists !'));

	if(!argument('l', 'local')) {

		var http = config.modules.repository + '/' + args[0] + '/archive.zip';

		console.error(colors.yellow.bgGreen.bold('WY') + ' ' + colors.yellow.bgBlue.bold('GET') + ' ' + colors.cyan.bold(http));

		(new (require('download')))
		  .get(http)
		  .dest('.wesyer')
		  .run(function (err, files) {

		  	if(err) {
		  		console.error(colors.yellow.bgGreen.bold('WY') + ' ' + colors.yellow.bgBlue.bold(err.code) + ' ' + colors.cyan.bold(http));

		  		var msg = 'Unknwon reason';

		  		if(typeof err.code === 'number') {
		  			if(err.code === 404)
		  				msg = 'Module not found';
		  			else if(err.code === 403)
		  				msg = 'Forbidden access';
		  			else if(err.code === 500)
		  				msg = 'Internal server error';
		  			else
		  				msg = 'Unkwon reason (server returned ' + colors.cyan(err.code) + ' status)';
		  		} else if(err.code) {
		  			msg = err.code;
		  		}

		  		console.error(colors.red('Failed to download module ') + colors.green(args[0]) + colors.blue(' : ' + msg));
		  	} else {
		  		console.error(colors.yellow.bgGreen.bold('WY') + ' ' + colors.yellow.bgBlue.bold('GOT') + ' ' + colors.cyan.bold(http));
		  		// extract module
		  		require('node-zip');
				var zip = new JSZip(fs.readFileSync(path.join('.wesyer', 'archive.zip')));

				fs.mkdirSync(path.join('.wesyer', args[0]));

				Object.keys(zip.files).forEach(function(filename) {
				  var content = zip.files[filename].asNodeBuffer();
				  fs.writeFileSync(path.join('.wesyer', args[0], filename), content);
				});

				try {
					fs.unlinkSync('.wesyer/archive.zip');
				} catch(e) {}

				console.info(colors.cyan('Successfully installed module ') + colors.green(args[0]))
	  		}

		  });
	} else  {

		require('node-zip');
		var zip = new JSZip(fs.readFileSync(args[1]));

		fs.mkdirSync(path.join('.wesyer', args[0]));

		Object.keys(zip.files).forEach(function(filename) {
		  var content = zip.files[filename].asNodeBuffer();
		  fs.writeFileSync(path.join('.wesyer', args[0], filename), content);
		});

		console.info(colors.cyan('Successfully installed module ') + colors.green(args[0]))

	}
});

/* Remove a module */
Wesyer.task('remove', function() {
	if(!args[0])
		return console.error(colors.red('Missing module name'));

	if(!fs.existsSync('.wesyer/' + args[0]))
		return console.error(colors.red('Module ') + colors.green(args[0]) + colors.red(' not found'));

	try {
		deleteFolderRecursive('.wesyer/' + args[0]);
		return console.info(colors.cyan('Module ') + colors.green(args[0]) + colors.cyan(' successfully removed !'));
	}

	catch(e) {
		return console.error(colors.red('Can\'t remove module ') + colors.green(args[0]) + colors.red('\n' + e.stack));
	}
});

/* Initialize the package.json file to create a module */
Wesyer.task('create-module', function() {
	if(args[0]) {
		try {
			fs.mkdirSync(args[0]);
		}

		catch(e) {
			console.error(colors.red('Can\'t make module directory ') + colors.green('(' + args[0] + ')'));

			if(config.verbose)
				console.error(e.stack);

			process.exit();
		}

		process.chdir(args[0]);
		packageInitModel[0].default = args[0].substr(args[0].lastIndexOf('/') + 1);
	}

	if(fs.existsSync('package.json') && !argument('f', 'force')) {
		return console.error(colors.red('There is already a ') + colors.green('package.json') + colors.red(' file in this folder.') + '\nTo force wesyer create a new configuration file, use ' + colors.blue('-f') + ' or ' + colors.blue('--force') + ' argument');
	}

	var cprompt = require('sync-prompt').prompt;

	var packageModel = {
		files: []
	};

	var initDatas = {}, val, success;

	for(var i = 0; i < packageInitModel.length; i++) {
		success = false;
		while(!success) {
			val = cprompt(colors.blue(packageInitModel[i].name) + ' ' + colors.green('(' + (packageInitModel[i].default || '') + ')') + ' ');

			if(!val) {
				if(packageInitModel[i].required && !packageInitModel[i].default) {
					console.error(colors.yellow(packageInitModel[i].warning));
				} else {
					packageInitModel[i].store(packageModel, packageInitModel[i].default || '');
					success = true;
				}
			} else {
				if(packageInitModel[i].validator && !packageInitModel[i].validator.test(val)) {
					console.error(colors.yellow(packageInitModel[i].warning));
				} else {
					packageInitModel[i].store(packageModel, val);
					success = true;
				}
			}
		}
	}

	packageModel.files.push(packageModel.main);

	if(writeFile('package.json', JSON.stringify(packageModel, null, 4), 'utf-8')) {
		console.info(colors.green('package.json') + colors.cyan(' has been created !'));

		if(writeFile(packageModel.main, '', 'utf-8')) {
			console.info(colors.green(packageModel.main) + colors.cyan(' has been created !'));
		} else {
			console.info(colors.yellow('Failed to create main module file ') + colors.green('(' + packageModel.main + ')') + colors.yellow(' think to create it !'));
		}
	} else {
		console.error(colors.red('Can\'t write ') + colors.green(taskfile_name) + colors.red(' !'));
	}
});

/* Build a module */
Wesyer.task('build-module', function() {
	var pkg = readFile('package.json');

	if(typeof pkg === 'undefined')
		return console.error(colors.green('package.json') + colors.red(' file was not found'));

	try {
		pkg = JSON.parse(pkg);
	}

	catch(e) {
		return console.error(colors.red('package.json') + colors.red(' is not a valid JSON file'));
	}

	if(!args[0]) {
		args[0] = pkg.name + '.zip';
		console.warn(colors.yellow('No output file specified, default used ') + colors.green('(' + pkg.name + '.zip)'));
	}

	// validate json
	// create zip to args[1]

	var found;

	for(var i in pkg) {
		if(pkg.hasOwnProperty(i)) {
			found = false;

			for(var j = 0; j < packageInitModel.length; j++) {
				if(packageInitModel[j].name === i) {
					found = true;

					if(packageInitModel[j].validator && !packageInitModel[j].validator.test(pkg[i]))
						return console.error(colors.red('Invalid field ') + colors.green(i) + ' ' + colors.cyan(packageInitModel[j].warning));
				}
			}

			if(!found && i !== 'files')
				console.warn(colors.yellow('Unused property ') + colors.cyan(i));
		}
	}

	if(!Array.isArray(pkg.files))
		return console.error(colors.red('Invalid field ') + colors.green('files') + colors.cyan(' must be an array'));

	require('node-zip');
	var zip = new JSZip();
	pkg.files.push('package.json');

	for(var i = 0; i < pkg.files.length; i++) {
		if(!fs.existsSync(pkg.files[i])) {
			return console.error(colors.red('Not found : ') + colors.green(pkg.files[i]));
		}

		try {
			if(fs.lstatSync(pkg.files[i]).isDirectory()) {
				return console.error(colors.red('Directories are not supported for the moment !'))
				//zip.addLocalFolder(pkg.files[i], pkg.name);
			} else {
				zip.file(pkg.files[i], fs.readFileSync(pkg.files[i]));
			}
		}

		catch(e) {
			return console.error(colors.red('Can\'t add ') + colors.green(pkg.files[i]) + ' to the zip package' + (config.verbose ? '\n' + e.stack : ''));
		}
	}

	try {
		fs.writeFileSync(args[0], zip.generate({base64: false, compression: 'DEFLATE'}), 'binary');
		return console.info(colors.cyan('Successfully created module zip package to : ') + colors.green(args[0]));
	}

	catch(e) {
		return console.error(colors.red('Can\'t write module zip package ') + colors.green('(' + args[0] + ')') + (config.verbose ? colors.red('\n' + e.stack) : ''));
	}
});

/* Initialize a Wesyer directory with taskfile_name file and .wesyer directory */
Wesyer.task('init', function() {
	
	if(args[0]) {
		try {
			fs.mkdirSync(args[0]);
		}

		catch(e) {
			console.error(colors.red('Can\'t make project directory ') + colors.green('(' + args[0] + ')'));

			if(config.verbose)
				console.error(colors.red(e.stack));

			process.exit();
		}

		process.chdir(args[0]);
	}

	if(fs.existsSync('.wesyer')) {
		return console.error(colors.red('WesyerJS is already installed on this directory !\nPlease uninstall WesyerJS before install it again, by using :\n\n    ') + colors.cyan('wy uninstall'));
	}

	var cprompt = require('sync-prompt').prompt;

	var initModel = [
		{
			name: 'description',
			validator: /^([a-zA-Z0-9_\- ]+)$/,
			warning: 'Description must contains only letters, digits, spaces, underscores and dashes',
			store: function(val) {
				configModel.description = val;
			}
		},
		{
			name: 'author',
			store: function(val) {
				configModel.author = val;
			}
		},
		{
			name: 'license',
			default: configModel.license,
			store: function(val) {
				configModel.license = val;
			}
		},
		{
			name: 'verbose',
			validator: /^(true|false)$/,
			warning: 'Verbose must be "true" or "false"',
			default: 'false',
			store: function(val) {
				configModel.verbose = val;
			}
		},
		{
			name: 'server port',
			validator: /^([0-9]){2,}$/,
			default: configModel.server.port.toString(),
			warning: 'Port must be a number',
			store: function(val) {
				configModel.server.port = parseInt(val);
			}
		},
		{
			name: 'root file - separate by comas',
			default: configModel.server.rootFile.join(','),
			store: function(val) {
				configModel.server.rootFile = val.split(',');
			}
		},
		{
			name: 'encoding',
			default: configModel.encoding,
			store: function(val) {
				configModel.encoding = val;
			}
		},
		{
			name: 'server encoding',
			validator: /^([a-zA-Z0-9\-]+)$/,
			default: configModel.server.encoding,
			warning: 'Wrong encoding',
			store: function(val) {
				configModel.server.encoding = val;
			}
		},
		{
			name: 'server verbose',
			validator: /^(true|false)$/,
			warning: 'Verbose must be "true" or "false"',
			default: 'false',
			store: function(val) {
				configModel.server.verbose = val;
			}
		},
	];

	if(args[0])
		initModel[0].default = args[0].substr(args[0].lastIndexOf('/') + 1);

	var initDatas = {}, val, success;

	for(var i = 0; i < initModel.length; i++) {
		success = false;
		while(!success) {
			val = cprompt(colors.blue(initModel[i].name) + ' ' + colors.green('(' + (initModel[i].default || '') + ')') + ' ');

			if(!val) {
				initModel[i].store(initModel[i].default || '');
				success = true;
			} else {
				if(initModel[i].validator && !initModel[i].validator.test(val)) {
					console.error(colors.yellow(initModel[i].warning));
				} else {
					initModel[i].store(val);
					success = true;
				}
			}
		}
	}

	if(mkdir('.wesyer')) {
		console.info(colors.green('wesyer module directory') + colors.green(' (.wesyer)') + colors.cyan(' has been created !'));
	
		if(!fs.existsSync(taskfile_name)) {
			if(writeFile(taskfile_name, '// Wesyer task file\n\nvar config = ' + JSON.stringify(configModel, null, 4) + ';', 'utf-8'))
				console.info(colors.green(taskfile_name) + colors.cyan(' has been created !'));
			else
				console.error(colors.red('Can\'t write ') + colors.green(taskfile_name) + colors.red(' !'));
		} else {
			console.warn(colors.yellow('Found a ') + colors.green(taskfile_name) + colors.yellow(' taskfile in this directory. Ignored.'));
		}
	} else
		console.error(colors.red('Can\'t create ') + colors.cyan(' wesyer module directory') + colors.green(' (.wesyer)'))

});

/* Remove all wesyer files from the current directory */
Wesyer.task('uninstall', function() {
	if(!fs.existsSync('.wesyer')) {
		return console.error(colors.red('WesyerJS is not installed on this directory !\nPlease install WesyerJS by using :\n\n    ') + colors.cyan('wy init'));
	}

	try {
		deleteFolderRecursive('.wesyer');
	}

	catch(e) {
		return console.error(colors.red('Can\'t remove ') + colors.green('.wesyer') + colors.red(' folder' + (config.verbose ? e.stack : '')));
	}

	if(!fs.existsSync(taskfile_name)) {
		try {
			fs.unlinkSync(taskfile_name);
		}

		catch(e) {
			return console.error(colors.red('Can\'t remove ') + colors.green(taskfile_name) + colors.red(' file' + (config.verbose ? e.stack : '')));
		}
	}
});

/* Create a server */
var serverConfig; // global server configuration, used in the server handler
Wesyer.task('serve', function() {

	serverConfig = MergeRecursive({
		port: 8080,
		encoding: 'utf-8',
		rootFile: ['index.html'],
		templates: {},
		verbose: false,
		'mime-types': {}
	}, config.server)

	for(var i = 0; i < arguments.length; i++) {

		if(typeof arguments[i] === 'string' && arguments[i].match(/^\-\-([a-zA-Z_]+)=(.*)$/g)) {
			var val = arguments[i].substr(arguments[i].indexOf('=') + 1);
			var name = arguments[i].substr(0, arguments[i].indexOf('=')).substr(2);

			if(name === 'port')
				val = parseInt(val);
			else if(name === 'rootFile')
				val = val.split(',');
			else if(name === 'verbose')
				val = (val === 'true');

			serverConfig[name] = val;
		}

	}

	var server = http.createServer(function (request, response){

		function send404() {

			console.error(colors.red('404 Not Found : ') + colors.green(request.url));
			
			if(serverConfig.templates[404]) {
				try {
					var content = fs.readFileSync(serverConfig.templates[404], serverConfig.encoding);
					send(serverConfig.templates[404], content, 404);
					console.info(colors.blue('Delivered 404 template : ') + colors.green('/' + serverConfig.templates[404]) + '\n');
					return ;
				}

				catch(e) {
					console.error(colors.red('Cannot read 404 error template (') + colors.green(serverConfig.templates[404]) + colors.red(')' + (serverConfig.verbose ? e.stack : '')));
				}
			}

			send('', '', 404);
			console.log('');
			return ;

		}

		function send(file, content, code) {

			var ext = file.split('/')[file.split('/').length - 1];

			var s = ext.split('.');
			ext = s.length > 1 ? s[s.length - 1] : false;

			var types = {
				txt: 'text/plain',
				js: 'application/javascript',
				css: 'text/css',
				json: 'application/json'
			};

			response.writeHead(code || 200, {
				'Content-Type': config.server['mime-types'][ext] || types[ext] || config.server['default-mime-type'] || 'text/html',
				'Content-Length': content.length					
			});

			response.end(content);

		}

		if(request.url === '/') {
			for(var i in serverConfig.rootFile) {
				try {
					var content = fs.readFileSync(serverConfig.rootFile[i], serverConfig.encoding);
					send(serverConfig.rootFile[i], content);
					console.info(colors.blue('Delivered : ') + colors.green('/') + ' | redirected to : ' + colors.cyan(serverConfig.rootFile[i]) + '\n');
					return ;
				}

				catch(e) {
					if(serverConfig.verbose) {
						console.error(colors.red('Failed to read index file : ') + colors.green(serverConfig.rootFile[i]));
					}
				}
			}

			send404();
			return ;
		}

		try {

			var content = fs.readFileSync(request.url.substr(1), serverConfig.encoding);
			send(request.url.substr(1), content);
			console.info(colors.blue('Delivered : ') + colors.green(request.url) + '\n');
			return ;

		}

		catch(e) {

			send404();
			return ;

		}

	});

	server.listen(serverConfig.port, function(){
	    console.log('Server running at ' + colors.blue('http://localhost:') + colors.green(serverConfig.port) + '\nPress Ctrl+C to stop\n');
	});

});
