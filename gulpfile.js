var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var plumber = require('gulp-plumber');
var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.PORT || config.defaultPort;
// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var util = require('gulp-util');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');

gulp.task('vet', function(){
	log('Analyzing source with JSHint and JSCs');
	return gulp.src(config.alljs)
	.pipe($.if(args.verbose, $.print()))
	.pipe($.jscs())
	.pipe($.jshint())
	.pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
	.pipe($.jshint.reporter('fail'));
});

gulp.task('styles', ['clean-styles'],function(){
	log('Compiling less to CSS');
	return gulp
		.src(config.less) //TODO
		.pipe($.plumber())
		.pipe($.less())
		//.on('error', errorLogger)
		.pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
		.pipe(gulp.dest(config.temp));
});

gulp.task('clean-styles', function(){
	var files = config.temp + '**/*.css';
	clean(files);
});

function clean(path){
	log('Cleaning files at ' + path);
	del(path);
}

gulp.task('less-watcher', function(){
	gulp.watch([config.less], ['styles']);
});

gulp.task('wiredep', function(){
	log('wireup bower css js and our app js into the html');
	var options = config.getWiredepDefaultOptions();
	var wiredep = require('wiredep').stream;

	return gulp
					.src(config.index)
					.pipe(wiredep(options))
					.pipe($.inject(gulp.src(config.js)))
					.pipe(gulp.dest(config.client));
});

gulp.task('inject', ['wiredep', 'styles'], function(){
	log('wireup our app css into the html');
	return gulp
					.src(config.index)
					.pipe($.inject(gulp.src(config.css)))
					.pipe(gulp.dest(config.client));
});

gulp.task('server-dev', ['inject'], function(){
	log('server to run the app locally');
	var isDev = true;
	var nodeOptions = {
		script: config.nodeServer //TODO
		,delayTime: 1
		,env: {
			'PORT': port,
			'NODE_ENV': isDev ? 'dev' : 'build'
		},
		watch: [config.server]  //TODO
	};
	return $.nodemon(nodeOptions)
					.on('restart', ['vet'], function(ev){
						log('*** NODEMON restarted');
						log('files changed on restart\n' + ev);
					})
					.on('start', function(){
							log('*** NODEMON started');
					})
					.on('crash', function(){
						log('*** NODEMON crashed');
					})
					.on('exit', function(){
						log('*** NODEMON exited');
					});
});

function errorLogger(){
	log('***** Start of Error *****');
	log(error);
	log('***** End of Error *****');
	this.emit('end');
}

function log(msg) {
	if(typeof(msg) === 'object'){
		for(var item in msg){
			if(msg.hasOwnProperty(item)) {
				$.util.log($.util.colors.blue(msg[item]));
			}
		}
	} else {
		$.util.log($.util.colors.blue(msg));
	}
}
