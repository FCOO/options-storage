
module.exports = function(grunt) {

	"use strict";

	var stripJsonComments	= require('strip-json-comments');
	var semver						= require('semver');

	function readFile(filename, isJSON, defaultContents){
		if (grunt.file.exists(filename)){
			var contents = grunt.file.read(filename) ;
			return isJSON ? JSON.parse( stripJsonComments(contents) ) : contents;
		}
		else
			return defaultContents;
	}

	//*******************************************************
	// Variables to define the type of repository
	var gruntfile_setup =	readFile('Gruntfile_setup.json', true, {	
													isApplication			: false,	//true for stand-alone applications. false for packages/plugins
													haveStyleSheet		: false,	//true if the packages have css and/or scss-files
													haveJavaScript		: true,		//true if the packages have js-files
													exitOnJSHintError	: true,		//if false any error in JSHint will not exit the task		
													beforeProdCmd			: "",			//Cmd to be run at the start of prod-task
													beforeDevCmd			: "",			//Cmd to be run at the start of dev-task
													afterProdCmd			: "",			//Cmd to be run at the end of prod-task
													afterDevCmd				: "",			//Cmd to be run at the end of dev-task
												}),
			isApplication		= !!gruntfile_setup.isApplication,
			haveStyleSheet	= !!gruntfile_setup.haveStyleSheet,
			haveJavaScript	= !!gruntfile_setup.haveJavaScript,

			//new variable for easy syntax	
			isPackage				= !isApplication;
	
	//*******************************************************
	var today						= grunt.template.today("yyyy-mm-dd-HH-MM-ss"),
			todayStr				= grunt.template.today("dd-mmm-yyyy HH:MM"),
			bwr							= grunt.file.readJSON('bower.json'),
			currentVersion	= bwr.version,
			name						= bwr.name,
			adjustedName		= name.toLowerCase().replace(' ','_'),
			name_today			= adjustedName +'_' + today,
			githubTasks			= [];


	//Capture the log.header function to remove the 'Running tast SOMETHING" message
	grunt.log.header = function(txt){
		//only for test: grunt.log.writeln('-'+txt+'-');
	};

	//writelnColor(msg, color, mgs2, color2,..,msgN, colorN) writeln msg in color
	function writelnColor(){ 
		for(var i=0; i<arguments.length; i=i+2)
			grunt.log.write(arguments[i][arguments[i+1]]); 
		grunt.log.writeln(''); 
	}

	//writelnYellow(msg) writeln msg in yellow
	function writelnYellow(msg){ writelnColor(msg, 'yellow'); };

	//writelnRed(msg) writeln msg in red
	function writelnRed(msg){ writelnColor(msg, 'red'); };

	//merge: Merge all the options given into a new object
	function merge(){
		var result = {};
		for(var i=0; i<arguments.length; i++)
			for(var key in arguments[i])
				if(arguments[i].hasOwnProperty(key))
					result[key] = arguments[i][key];
		return result;
	}

	function srcExclude_(mask){
		mask = typeof mask === 'string' ? [mask] : mask;
		mask.push('!**/_*/**', '!**/_*.*');
		return mask;
	}


	//runCmd. useCmdOutput = true => the command output direct to std 
	function runCmd(cmd, useCmdOutput){
		if (!useCmdOutput)
		  grunt.log.writeln(cmd['grey']);

		var shell = require('shelljs'),
				result = shell.exec(cmd, {silent:!useCmdOutput});

		if (result.code === 0){
			if (!useCmdOutput)
			  grunt.log.writeln(result.output['white']);
		}
		else {
			if (!useCmdOutput){
				grunt.log.writeln();
				grunt.log.writeln(result.output['yellow']);
			}
			grunt.fail.warn('"'+cmd+'" failed.');
		}
	}

	var src_to_src_files				= { expand: true,	cwd: 'src',				dest: 'src'				},	//src/**/*.* => src/**/*.*
			temp_to_temp_files			= { expand: true,	cwd: 'temp',			dest: 'temp'			},	//temp/**/*.* => temp/**/*.*
			temp_to_temp_dist_files	=	{ expand: true,	cwd: 'temp',			dest: 'temp_dist'	},	//temp/**/*.* => temp_dist/**/*.*
			temp_to_src_files				=	{ expand: true,	cwd: 'src',				dest: 'temp'			},	//src/**/*.* => temp/**/*.*

//			temp_dist_to_dist_files	=	{ expand: true,	cwd: 'temp_dist',	dest: 'dist'			},	//temp_dist/**/*.* => dist/**/*.*


			sass_to_css_files = {	src: srcExclude_('**/*.scss'), ext: '.css'	}, //*.scss => *.css

			src_sass_to_src_css_files		= merge( src_to_src_files,		sass_to_css_files ), //src/*.scss => src/*.css
			temp_sass_to_temp_css_files	= merge( temp_to_src_files,	sass_to_css_files	), //temp/*.scss => temp/*.css

			bower_concat_options	= readFile('bower_main.json', true, {}),
			jshint_options				= readFile('.jshintrc', true, {}),			

			title = 'fcoo.dk - ' + name,

			head_contents = '',
			body_contents = '',
				
			link_js		= '',
			link_css	= '';

			
	if (isApplication){
		//Read the contents for the <HEAD>..</HEAD> and <BODY</BODY>
		head_contents = readFile('src/head.html', false, '');
		body_contents = readFile('src/body.html', false, 'BODY IS MISSING');
	}			

	//***********************************************
	grunt.initConfig({
		//** clean **
		clean: {
		  temp						: ["temp"],
		  temp_dist				: ["temp_dist"],
		  dist						:	["dist"],
			temp_disk_jscss	: ["temp_dist/*.js", "temp_dist/*.css"]
			
		},

		//** concat **
    concat: {
      options: { separator: ';' },
			temp_to_temp_dist_srcjs:			{	files: { 'temp_dist/src.js'			: ['temp/**/*.js']				} },
			temp_to_temp_dist_srccss:			{	files: { 'temp_dist/src.css'		: ['temp/**/*.css']			} },
			temp_to_temp_dist_srcminjs:		{ files: { 'temp_dist/src.min.js'	: ['temp/**/*.min.js']	} },
			temp_to_temp_dist_srcmincss:	{ files: { 'temp_dist/src.min.css': ['temp/**/*.min.css']	} },

			temp_dist_js_to_appnamejs					: {	dest: 'dist/'+name_today+'.js',				src: ['temp_dist/bower_components.js',	'temp_dist/src.js'			] }, //Combine the src.js and bower_components.js => APPLICATIONNAME_TODAY.js
			temp_dist_css_to_appnamecss				: {	dest: 'dist/'+name_today+'.css',			src: ['temp_dist/bower_components.css',	'temp_dist/src.css'			] }, //Combine the src.css and bower_components.css => APPLICATIONNAME_TODAY.css
			temp_dist_minjs_to_appnameminjs		: {	dest: 'dist/'+name_today+'.min.js',		src: ['temp_dist/bower_components.js',	'temp_dist/src.min.js'	] }, //Combine the src.min.js and bower_components.js => APPLICATIONNAME_TODAY.min.js
			temp_dist_mincss_to_appnamemincss	: {	dest: 'dist/'+name_today+'.min.css',	src: ['temp_dist/bower_components.css',	'temp_dist/src.min.css'	] }, //Combine the src.min.css and bower_components.css => APPLICATIONNAME_TODAY.min.css
		},

		//** copy **
		copy: {
			temp_images_to_temp_dist: merge( temp_to_temp_dist_files,  { flatten: true, src: srcExclude_(['**/images/*.*']),	dest: 'temp_dist/images'	} ),	
			temp_fonts_to_temp_dist	:	merge( temp_to_temp_dist_files,  { flatten: true, src: srcExclude_(['**/fonts/*.*']),		dest: 'temp_dist/fonts'}	),

			temp_dist_to_dist	: { expand: true, cwd: 'temp_dist', src: ['**/*.*'], dest: 'dist' },
			temp_dist_to_dev	: { expand: true, cwd: 'temp_dist', src: ['**/*.*'], dest: 'dev'	},
			temp_dist_to_demo	: { expand: true, cwd: 'temp_dist', src: ['**/*.*'], dest: 'demo' },


			//Copies alle files in src to temp, excl. '_*.*' and *.min.js/css
			src_to_temp							: { expand: true,		filter: 'isFile',	cwd: 'src/',				src: srcExclude_(['**/*.*', '!**/*.min.js', '!**/*.min.css']),	dest: 'temp'	},
			
			//Copy all *.js and *.css from temp_dist to dist
			temp_dist_jscss_to_dist	: { expand: false,	filter: 'isFile',	cwd: 'temp_dist/',	src: ['*.js', '*.css'],	dest: 'dist'	},

			//Copy src/index_TEMPLATE.html to dist/index.html
			src_indexhtml_to_dist			: { expand: false,	filter: 'isFile',	cwd: '',	src: ['src/index_TEMPLATE.html'],	dest: 'dist/index.html'	},
			src_indexhtml_to_dist_dev	: { expand: false,	filter: 'isFile',	cwd: '',	src: ['src/index_TEMPLATE.html'],	dest: 'dist/index-dev.html'	},

			//Copy src/index_TEMPLATE-DEV.html to dev/index.html
			src_indexhtml_to_dev			: { expand: false,	filter: 'isFile',	cwd: '',	src: ['src/index_TEMPLATE-DEV.html'],	dest: 'dev/index.html'	},
		},
		
		//** rename **	
		rename: { 
			srcjs_to_namejs: {
				files: [
					{src: ['temp_dist/src.js'],			dest: 'temp_dist/'+name+'.js'},
					{src: ['temp_dist/src.min.js'],	dest: 'temp_dist/'+name+'.min.js'}
				]
			},
			srccss_to_namecss: {
				files: [
					{src: ['temp_dist/src.css'],			dest: 'temp_dist/'+name+'.css'},
					{src: ['temp_dist/src.min.css'],	dest: 'temp_dist/'+name+'.min.css'}
				]
			}

		},

		//** sass **
		sass: {
			//check: Check syntax - no files generated
	    check: {
				options	: { 
					noCache		: true,
					sourcemap	: 'none',
					check			: true, 
					update		: true,
				},
				files: [src_sass_to_src_css_files],
			},
			//compile: Generate css-files with debug-info in same folder as scss-files
			compile: {
				options: {
					//sourcemap		: 'auto',
					sourceMap		: true,
					debugInfo		: true,
					lineNumbers	: true,
					update			: false,
					style				: 'expanded',
				},	
				files: [src_sass_to_src_css_files],
		  },
			//build: Generate 'normal' css-files in same folder as scss-files
			build: {
				options: {
					debugInfo		: false,
					lineNumbers	: false,
					update			: false,
					noCache			: true,
					sourcemap		: 'none',
					style				: 'nested',
				},	
				files: [temp_sass_to_temp_css_files],
		  }
		},


		//** bower: Copy all main-files from /bower_components to /temp/. Only used to get all images and fonts into /temp **
		bower: {
			to_temp: {
				base: 'bower_components', 
				dest: 'temp',
				options: {
					checkExistence: false, 
					debugging			: false, 
					paths: {
						bowerDirectory	: 'bower_components',
						bowerrc					: '.bowerrc',
						bowerJson				: 'bower.json'
					}
				}
			}
		},

		//** bower_concat **
		bower_concat: {
			options: { separator : ';' },
			all: {
				dest		: 'temp_dist/bower_components.js',
				cssDest	: 'temp_dist/bower_components.css',

				dependencies: bower_concat_options.dependencies	|| {},
				exclude			: bower_concat_options.exclude			|| {},
				mainFiles		: bower_concat_options.mainFiles		|| {},
			}
		},
		
		//** jshint **
	  jshint: {
			options	:	merge( 
									{	force: !gruntfile_setup.exitOnJSHintError },
									jshint_options																	//All options are placed in .jshintrc allowing jshint to be run as stand-alone command
								),
		  all			: srcExclude_('src/**/*.js'), //['src/**/*.js'],
		},

		// ** uglify **		
		uglify: {	'temp_js'		:	{	files: [{ expand: true,		filter: 'isFile',	src: srcExclude_(['temp/**/*.js', '!**/*.min.js']),		dest: '',	ext: '.min.js',		extDot: 'first' }] } },

		// ** cssmin
		cssmin: {	'temp_css'	: {	files: [{ expand: true,		filter: 'isFile',	src: srcExclude_(['temp/**/*.css', '!**/*.min.css']),	dest: '',	ext: '.min.css',	extDot: 'first'	}] } },

		
		// ** exec **
		exec: {
			bower_update: 'bower update',
			npm_install	: 'npm install'
		},

		// ** replace **
		replace: {
		  'dist_indexhtml_meta': {
				src					: ['dist/index.html', 'dist/index-dev.html'],
		    overwrite		: true,
				replacements: [
					{from: '{APPLICATION_NAME}',	to: bwr.name							},
					{from: '{BUILD}',							to: todayStr							},
					{from: '{TITLE}',							to: title									},
					{from: '{HEAD}',							to: head_contents					},
					{from: '{BODY}',							to: body_contents					},
				]
		  },
		  'dist_indexhtml_jscss': {
				src					: ['dist/index.html'],
		    overwrite		: true,
				replacements: [
					{from: '{CSS_FILE_NAME}',			to: name_today+'.min.css'	},
					{from: '{JS_FILE_NAME}',			to: name_today+'.min.js'	}
				]
		  },
			'dist_indexdevhtml_jscss': {
				src					: ['dist/index-dev.html'],
		    overwrite		: true,
				replacements: [
					{from: '{CSS_FILE_NAME}',	to: name_today+'.css'	},
					{from: '{JS_FILE_NAME}',	to: name_today+'.js'	}
				]
		  },
		  'dev_indexhtml_metalink': {
				src					: ['dev/index.html'],
		    overwrite		: true,
				replacements: [
					{from: '{APPLICATION_NAME}',	to: bwr.name			},
					{from: '{TITLE}',							to: title					},
					{from: '{HEAD}',							to: head_contents	},
					{from: '{BODY}',							to: body_contents	},
					{from: '{LINK_CSS}',					to: function(){return link_css;} },
					{from: '{LINK_JS}',						to: function(){return link_js; } }
				]
		  },

		  'dist_indexhtml_version': { src: ['dist/index.html'], overwrite: true,	replacements: [{ from: '{VERSION}', to: bwr.version }]	},
		  'dist_html_version'			: { src: ['dist/*.html'],			overwrite: true,	replacements: [{ from: '{VERSION}', to: bwr.version }]	},
		  'dist_js_version'				: { src: ['dist/*.js'],				overwrite: true,	replacements: [{ from: '{VERSION}', to: bwr.version }]  }


		}, 

		// ** grunt-prompt **
		prompt: {
		  github: {
		    options: {
		      questions: [
						{
							config	: 'build',	
							type		: 'confirm', 
							message	: 'Build/compile the '+(isApplication ? 'application' : 'packages')+'?', // Question to ask the user, function needs to return a string, 
						},
		        {
		          config:  'newVersion',
		          type:    'list',
		          message: 'Current version of "' + name +'" is ' + currentVersion + '. Select new release version:',
		          choices: [
		            {	value: 'patch',		name: 'Patch : ' + semver.inc(currentVersion, 'patch') + ' Backwards-compatible bug fixes.' },
		            {	value: 'minor',		name: 'Minor : ' + semver.inc(currentVersion, 'minor') + ' Add functionality in a backwards-compatible manner.' },
		            { value: 'major',		name:	'Major : ' + semver.inc(currentVersion, 'major') + ' Incompatible API changes.'},
		            { value: 'none',		name:	'None  : No new version. Just commit and push.'},
		          ]
		        },
						{	config: 'ghpages',				type: 'confirm',	message: 'Merge "master" branch into "gh-pages" branch?'},
		        { config: 'commitMessage',	type: 'input',		message: 'Message/description for new version:'	        },
					]
				}
			}, //end of prompt.github

			continue: {
		    options: {
		      questions: [
						{ config: 'continue',	type: 'confirm', message: 'Continue?' }
					]
				}
			} //end of prompt.continue
		}
	});//end of grunt.initConfig({...

	//****************************************************************
	require('load-grunt-tasks')(grunt);

	//Load grunt-packages
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-rename');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-continue');

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('main-bower-files');
	grunt.loadNpmTasks('grunt-bower-concat');

	grunt.loadNpmTasks('grunt-exec');

	grunt.loadNpmTasks('grunt-prompt');

	//*********************************************************
	//CREATE THE "DEFAULT" TAST
	//*********************************************************
	grunt.registerTask('default', function() {
		writelnYellow('*************************************************************************');
		writelnYellow('Run one of the following commands:');
		writelnColor('>grunt check  ', 'white', '=> Check the syntax of all .js and .scss files', 'yellow');
		writelnColor('>grunt dev    ', 'white', '=> Creates a development version', 'yellow');
		writelnColor('>grunt prod   ', 'white', '=> Creates a production version in /dist', 'yellow');
		writelnColor('>grunt github ', 'white', '=> Create a new Github release incl. new version and tag', 'yellow');
		writelnYellow('*************************************************************************');
	});

	//*********************************************************
	//CREATE THE "CHECK" TAST
	//*********************************************************
	//'jshint:all' = Check the syntax of all .js-files with jshint
	//'sass:check' = Check the syntax of all .scss-files in scr		
	var checkTasks = [];
	if (haveJavaScript)
	  checkTasks.push('jshint:all');
	if (haveStyleSheet)
	  checkTasks.push('sass:check');
	grunt.registerTask('check', checkTasks);


	//*********************************************************
	//CREATE THE "GITHUB" TAST
	//*********************************************************
	grunt.registerTask('github', [
		'prompt:github',
		'_github_confirm',
		'prompt:continue',
		'_github_run_tasks'
	]	);


	/**************************************************
	_before_prod and / _before_dev: run at the start of "grunt prod" / "grunt dev"
	_after_prod and / _after_dev: run after "grunt prod" / "grunt dev"
	**************************************************/
	function _runACmd(cmd){
		if (!cmd)
			return 0;
		var cmdList = cmd.split('&');
		for (var i=0; i<cmdList.length; i++ )
			runCmd(cmdList[i].trim());
	}
	grunt.registerTask('_before_prod',	function(){ _runACmd(gruntfile_setup.beforeProdCmd);	});
	grunt.registerTask('_before_dev',		function(){ _runACmd(gruntfile_setup.beforeDevCmd);		}); 
	grunt.registerTask('_after_prod',		function(){ _runACmd(gruntfile_setup.afterProdCmd);		});
	grunt.registerTask('_after_dev',		function(){ _runACmd(gruntfile_setup.afterDevCmd);		}); 

	/**************************************************
	_github_confirm: write all selected action
	**************************************************/
	grunt.registerTask('_github_confirm', function() {  
		grunt.log.writeln();
		writelnYellow('**************************************************');
		writelnYellow('git status:');
		runCmd('git status', true);
		writelnYellow('Actions:');
		if (grunt.config('build'))
			writelnYellow('- Build/compile the '+(isApplication ? 'application' : 'packages'));
		if (grunt.config('newVersion') == 'none')
			writelnYellow('- Commit all files');
		else {
			var newVersion = semver.inc(currentVersion, grunt.config('newVersion'));
			writelnYellow('- Bump \'version: "'+newVersion+'"\' to bower.json and package.json');
			writelnYellow('- Commit all files and create new tag="'+newVersion+'"');
		}
		if (grunt.config('ghpages'))
			writelnYellow('- Merge "master" branch into "gh-pages" branch');
		else
			grunt.config.set('release.options.afterRelease', []); //Remove all git merge commands

		if (grunt.config('newVersion') == 'none')
			writelnYellow('- Push all branches to GitHub');
		else
			writelnYellow('- Push all branches and tags to GitHub');
		writelnYellow('**************************************************');
	});


	/*******************************************************
	_github_run_tasks: Run all the needed github-commands
	*******************************************************/
	grunt.registerTask('_github_run_tasks', function() {  
		function writeHeader(header){
			grunt.log.writeln('');
			writelnYellow('**************************************************');
			writelnYellow(header.toUpperCase());
		};

		if (!grunt.config('continue'))
			return 0;

		//Get new version and commit ang tag messages
		var newVersion		=	grunt.config('newVersion') == 'none' ? '' : semver.inc(currentVersion, grunt.config('newVersion')),
				promptMessage	= grunt.config('commitMessage') || '',
				commitMessage,
				tagMessage;

		if (newVersion){
			//Create commitMessage and tagMessage
			var postMessage = '';
			if (promptMessage)
				postMessage += '-m "' + promptMessage + '" ';
			postMessage += '-m "Released by '+bwr.authors+' ' +todayStr +'"';

			commitMessage = ' -m "Release '  + newVersion + '" ' + postMessage; 
			tagMessage		= ' -m "Version '  + newVersion + '" ' + postMessage; 

			//Update bwr
			bwr.version = newVersion;
		} 
		else 
			commitMessage = ' -m "' + (promptMessage || '* No message *') +'"';

		//Build application/packages
		if (grunt.config('build')){
			writeHeader('Build/compile the '+(isApplication ? 'application' : 'packages'));
			runCmd('grunt prod', true);
		};

		//Bump bower.json and packages.json
		if (newVersion){
			writeHeader('Bump \'version: "'+newVersion+'"\' to bower.json and package.json');
			var files = ['bower.json', 'package.json'], file, json;
			for (var i=0; i<files.length; i++ ){
				file = files[i];
				json = grunt.file.readJSON(file);
				json.version = newVersion;
				grunt.file.write(file, JSON.stringify(json, null, '  ') + '\n');
				grunt.log.writeln(file+'-OK');
			}

			//Replace {VERSION] with newVersion in all js or html files in dist
			runCmd('grunt replace:'+(isApplication ? 'dist_html_version' : 'dist_js_version') );
		}

		//add, commit adn tag 
		writeHeader('Commit all files' + (newVersion ? ' and create new tag="'+newVersion+'"' : ''));

		//git add all
		runCmd('git add -A');

		//git commit
		runCmd('git commit' + commitMessage);
		
		//git tag
		if (newVersion)
			runCmd('git tag ' + newVersion + tagMessage);
		
		//git push (and push tag)
		writeHeader('Push all branches '+(newVersion ? 'and tags ' : '')+'to GitHub');

		runCmd('git push "origin" HEAD');

		if (newVersion)
			runCmd('git push "origin" ' + newVersion);

	
		//Merge "master" into "gh-pages"
		if (grunt.config('ghpages')){
			writeHeader('Merge "master" branch into "gh-pages" branch');
			runCmd('git checkout -B "gh-pages"');
			runCmd('git merge master');
			runCmd('git checkout master');
			runCmd('git push "origin" gh-pages');		
		}
	});

	
	//*********************************************************
	//CREATE THE "DEV" AND "PROD" TAST
	//*********************************************************

	//First create the task _create_dev_links
	grunt.registerTask('_create_dev_links', function(){
		function findFiles(ext){
			//Find all files in src with .ext but excl. .min.ext
			return grunt.file.expand( srcExclude_(['src/**/*.' + ext, '!src/**/*.min.' + ext]) );
		}

		//Find all js-files
		writelnYellow('Including all js-files');
		var jsFiles = findFiles('js'),
				jsFile;
		link_js = '';
		for (var i=0; i<jsFiles.length; i++ ){
			jsFile = jsFiles[i];
			grunt.log.writeln(jsFile);
			link_js += '  <script src="../'+jsFile+'"></script>\n';
		}


		//Find all css-files
		writelnYellow('Including all css-files');
		link_css	= '';

		//To ensure that all furture css-files are included, all scss-files are included as css-file.
		var scssFiles = findFiles('scss');
		for (var i=0; i<scssFiles.length; i++ )
			scssFiles[i] = scssFiles[i].replace(".scss", ".css");
		
		var cssFiles = findFiles('css');

		//concat cssFiles and scssFilesand remove duplicate items
		cssFiles.concat(scssFiles);
		for(var i=0; i<cssFiles.length; ++i) 
			for(var j=i+1; j<cssFiles.length; ++j)
				if(cssFiles[i] === cssFiles[j])
					cssFiles.splice(j--, 1);

		var cssFile;
		for (var i=0; i<cssFiles.length; i++ ){
			cssFile = cssFiles[i];
			grunt.log.writeln(cssFile);
			link_css += '  <link  href="../'+cssFile+'" rel="stylesheet">\n';
		}
	});	
	//********************************************************************

	
	var tasks				= [],
			isProdTasks = true,
			isDevTasks;
			
	for (var i=0; i<2; i++ ){
		tasks = [];
		isDevTasks = !isProdTasks;
		
		//Run "before-commands" (if any)
		tasks.push( isProdTasks ? '_before_prod' : '_before_dev');

		//ALWAYS CLEAN /temp, AND /temp_dist AND CHECK SYNTAX
		tasks.push( 
			'clean:temp',
			'clean:temp_dist',
			'check'
		); 

		//BUILD JS (AND CSS) FROM SRC
		if (isProdTasks){
			tasks.push(
				'clean:dist',
				'copy:src_to_temp'	//Copy all ** from src to temp
			);

			if (haveJavaScript)
				tasks.push( 
					'concat:temp_to_temp_dist_srcjs',		//Concat all *.js files from temp into temp_dist/src.js
					'uglify:temp_js',										//Minify *.js
					'concat:temp_to_temp_dist_srcminjs'	//Concat all *.min.js files from temp into temp_dist/src.min.js
				);

			if (haveStyleSheet)
				tasks.push(			  
					'sass:build',													//compile all sass
					'concat:temp_to_temp_dist_srccss',		//Concat all *.css files from temp into temp_dist/src.css
					'cssmin:temp_css',										//Minify all *.css (but not *.min.css) to *.min.css
					'concat:temp_to_temp_dist_srcmincss'	//Concat all *.min.css files from temp into temp_dist/src.min.css
				);	

			tasks.push(
				'copy:temp_images_to_temp_dist',	//Copy all image-files from temp to temp_dist/images
				'copy:temp_fonts_to_temp_dist',		//Copy all font-files from temp to temp_dist/fonts
				'clean:temp'											//clean /temp
			);

		} //end of if (isProdTasks){...


		//BUILD BOWER COMPONENTS
		if (isDevTasks || isApplication){
			//Build bower_components.js/css and /images, and /fonts from the bower components
			tasks.push( 
				'clean:temp',					//clean /temp
				'exec:bower_update',	//Update all bower components
				'bower',							//Copy all "main" files to /temp
				'bower_concat'				//Create bower_components.js and bower_components.css in temp_dist
			);
		
			tasks.push( 
				'copy:temp_images_to_temp_dist',	//Copy all image-files from temp to temp_dist/images
				'copy:temp_fonts_to_temp_dist',		//Copy all font-files from temp to temp_dist/fonts
				'clean:temp'											//clean /temp
			);
		}


		//MODIFY (RENAME AND/OR MOVE) FILES IN DEV OR IN TEMP_DIST BEFORE THEY ARE MOVED TO DIST
		if (isApplication && isProdTasks){
			//Concat js/css files to APPLICATIONNAME_TODAY[.min].js/css in DIST and delete from test_dist
			tasks.push(
				'concat:temp_dist_js_to_appnamejs',					//Combine the src.js and bower_components.js => APPLICATIONNAME_TODAY.js
				'concat:temp_dist_css_to_appnamecss',				//Combine the src.css and bower_components.css => APPLICATIONNAME_TODAY.css
				'concat:temp_dist_minjs_to_appnameminjs',		//Combine the src.min.js and bower_components.js => APPLICATIONNAME_TODAY.min.js
				'concat:temp_dist_mincss_to_appnamemincss',	//Combine the src.min.css and bower_components.css => APPLICATIONNAME_TODAY.min.css
						
				'copy:src_indexhtml_to_dist',								//Copy index_TEMPLATE.html from src => dist/index.html
				'copy:src_indexhtml_to_dist_dev',						//Copy index_TEMPLATE.html from src => dist/index-dev.html
				'replace:dist_indexhtml_meta',							//Insert meta-data in dist/index.html and dist/index-dev.html
				'replace:dist_indexhtml_jscss',							//Insert links into dist/index.html
				'replace:dist_indexdevhtml_jscss',					//Insert links into dist/index-dev.html
				
				'clean:temp_disk_jscss'											//Delete *.js/css from temp_dist
			 );
		}

		if (isApplication && isDevTasks){
			//Copy src/index_TEMPLATE-DEV.html to \dev and insert meta-data AND create links for all js- and css-files in src
			tasks.push(
				'copy:src_indexhtml_to_dev',	//Copy index_TEMPLATE-DEV.html from src => dev/index.html
				'_create_dev_links',			
				'replace:dev_indexhtml_metalink' //Insert meta-data and <link...> in dev/index.html
			);
		}

		if (isPackage && isProdTasks){
			//Rename all src.* to "name".* 
			if (haveJavaScript)
				tasks.push('rename:srcjs_to_namejs');
			if (haveStyleSheet)
				tasks.push('rename:srccss_to_namecss');
		}		
		
		if (isPackage && isDevTasks){
			tasks.push( 'copy:temp_dist_to_demo' );	//Copy all files from temp_dist to demo
		}
		
		if (isProdTasks){
			tasks.push( 'copy:temp_dist_to_dist' );	//Copy all files from temp_dist to dist
		}

		if (isApplication && isDevTasks){
			tasks.push( 'copy:temp_dist_to_dev' );	//Copy all files from temp_dist to dev
		}

		tasks.push( 'clean:temp_dist');

		
		//Run "after-commands" (if any)
		tasks.push( isProdTasks ? '_after_prod' : '_after_dev');

	
		//Register tasks
		grunt.registerTask(isProdTasks ? 'prod' : 'dev'	,	tasks);

		isProdTasks = !isProdTasks;
	}

};