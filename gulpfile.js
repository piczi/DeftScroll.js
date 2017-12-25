
var gulp = require('gulp'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    notify = require('gulp-notify'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint'),
    minimist = require('minimist'), // 处理输入的参数
    uglify = require('gulp-uglify'),
    sequence = require('gulp-sequence');

// 目标目录清理
gulp.task('clean', function() {
    return gulp.src(['dist/'], {read: false})
        .pipe(clean());
});

/**
 * 可设置参数
 * @param env {string|boolean} 设置运行环境，可为（dev/prod)
 */
var knowOption = {
    string: ['env'],
    boolean: true,
    default: {env: 'dev'},
    unknown: true
};

var gameOpt = minimist(process.argv.slice(2), knowOption);

var Game = require('./tool/game');

/**
 * 生成
 */
gulp.task('game', function(cp) {
    var projectName = gameOpt.project, sequenceArgv = [];
    // 编译项目
    Game.compile(gameOpt.env == 'pro');
    Game.watch(); // 监听修改
    Game.server(); // 开启服务
    sequenceArgv.push(Game.COMPILE);
    sequenceArgv.push(Game.WATCH_GAME);
    sequenceArgv.push(Game.SERVER);
    sequenceArgv.push(cp);

    return sequence.apply(sequence, sequenceArgv);
});


// 预设任务，执行清理后，
gulp.task('default', sequence('clean', 'game'));