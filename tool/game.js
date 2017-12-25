/**
 *
 * 游戏生成管理类
 *
 */

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),// 混淆js
    clean = require('gulp-clean'), // 清理文件
    concat = require('gulp-concat'), // 合并
    template = require('gulp-template'), // 替换变量以及动态html用
    rename = require('gulp-rename'), // 重命名
    gulpif  = require('gulp-if'), // if判断，用来区别生产环境还是开发环境的
    notify = require('gulp-notify'),  // 通知显示信息
    cleanCss = require('gulp-clean-css'),
    modify = require('gulp-modify'),
    webserver = require('gulp-webserver'),
    historyApiFallback = require('connect-history-api-fallback');


const copy = require('copy');

var fs = require('fs'),
    path = require('path');

function getIPAdress(){
    var interfaces = require('os').networkInterfaces();
    for(var devName in interfaces){
        var iface = interfaces[devName];
        for(var i=0;i<iface.length;i++){
            var alias = iface[i];
            if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

var Game = {
    COMPRESS_IMAGE: 'compressImages',
    COMPRESS_SOUND: 'compressSound',
    COMPRESS_CSS: 'compressCss',
    COMPRESS_JS: 'compressJs',
    COPY_DEMO: 'copy_demo',
    DIST_LIB: 'distLib',
    WATCH_GAME: 'watchGame',
    SERVER: 'runServer',
    SERVER_FOR_ENGINE: 'serverForEngine',
    COMPILE_INDEX: 'compile_index',
    COMPILE: 'compile',
    isPro: false,
    /**
     * 编译游戏
     * @param isPro
     */
    compile: function(isPro) {
        var me = this;
        me.isPro = isPro;

        // 压图
        gulp.task(this.COMPRESS_IMAGE, function() {
            return gulp.src(['src/image/*', 'src/image/**'], {base: 'src/image/'}).pipe(gulp.dest('dist/image/'));
        });

        gulp.task(this.COMPRESS_SOUND, function() {
            return gulp.src(['src/sound/*', 'src/sound/**'], {base: 'src/image/'}).pipe(gulp.dest('dist/sound/'));
        });

        // 压缩css
        gulp.task(this.COMPRESS_CSS, function() {
            return gulp.src('src/css/*')
                .pipe(concat('style.css'))
                .pipe(cleanCss())
                .pipe(gulp.dest('dist/css'));
        });

        // 核心js库
        gulp.task(this.DIST_LIB, function() {
            return gulp.src('./src/lib/**', { base: './src/lib' }).pipe(gulp.dest('./dist/lib'));
        });

        // 压缩js
        gulp.task(this.COMPRESS_JS, function() {
            var task = gulp.src(['src/js/base/*.js', 'src/js/component/*.js', 'src/js/*.js'])
                .pipe(concat('game.js'));
            me.isPro && task.pipe(uglify());
            return task.pipe(gulp.dest('dist/js'));
        });

        // 复制demo
        gulp.task(this.COPY_DEMO, function() {
            var path = './src/demo/';
            var distPath = './dist/demo/';
            return gulp.src([path + '**'], { base: path }).pipe(gulp.dest(distPath));
        });

        // 组装index
        gulp.task(this.COMPILE_INDEX, function() {
            return gulp.src('src/index.html')
                .pipe(modify({
                    fileModifier: function(file, contents) {
                        var depends = '<link href="css/style.css" type="text/css" rel="stylesheet"/>';
                        if (!me.isPro) {
                            // depends += '<script type="text/javascript" src="lib/mock-min.js"></script>';
                        } else {
                            // depends += '<script type="text/javascript" src="lib/pixi.min.js"></script>';
                        }
                        // depends += '<script type="text/javascript" src="lib/tween.min.js"></script>';
                        contents = contents
                            .replace('</head>', depends + '</head>')
                            .replace('</body>', '<script type="text/javascript" src="js/game.js"></script></body>');

                        return contents;
                    }
                }))
                .pipe(gulp.dest('dist'));
        });

        gulp.task(this.COMPILE, [this.COMPRESS_IMAGE, this.COMPRESS_SOUND, this.COMPRESS_CSS, this.COMPRESS_JS, this.DIST_LIB, this.COPY_DEMO, this.COMPILE_INDEX], function() {

        });
    },
    deleteFolderRecursive: function(path) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    this.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }

            });

            fs.rmdirSync(path);

        }

    },
    /**
     * 监控游戏
     * 监控游戏文件变化，自动编辑生成游戏数据文件
     */
    watch: function() {
        var me = this;
        gulp.task(this.WATCH_GAME, function() {
            // 监听的目录
            var watchPaths = ['src/index.html', 'src/*.*', 'src/**/*.*', 'src/**/**/*.*'];
            var watcher = gulp.watch(watchPaths, function(event) {
                if (event.type == 'unlink') {
                    // 删除文件
                    //this.deleteFolderRecursive(event.pa)
                    return ;
                }
                console.log('修改' + event.path + '，重新编译...');
                var path = event.path;
                var ext = path.substr(path.lastIndexOf('.') + 1);
                switch (ext) {
                    case 'png':
                    case 'jpg':
                        copy(path, 'dist', {base: './src'},function(err, files) {
                            if (err) console.log(err);
                            else
                                console.log('测试图片生成完毕');
                            // `files` is an array of the files that were copied
                        });
                        break;
                    case 'js':
                        path.indexOf('lib') < 0 && gulp.start(me.COMPRESS_JS);
                        break;
                    case 'css':
                        gulp.start(me.COMPRESS_CSS);
                        break;
                    case 'mp3':
                        copy(path, 'dist', {base: './src'},function(err, files) {
                            if (err)
                                console.log(err);
                            else
                                console.log('音乐数据生成完毕');
                        });
                        break;
                }

                if (path.indexOf('demo') > 0) {
                    if (path.indexOf('image') >= 0) {
                        copy(path, 'dist', {base: './src'},function(err, files) {
                            if (err) console.log(err);
                            else
                                console.log('测试图片生成完毕');
                            // `files` is an array of the files that were copied
                        });
                    } else if (path.indexOf('data') >= 0) {
                        copy(path, 'dist', {base: './src'},function(err, files) {
                            if (err)
                                console.log(err);
                            else
                                console.log('测试数据生成完毕');
                        });
                    }
                } else if (path.indexOf('lib') > 0) {
                    copy(path, './dist', {base: './src'},function(err, files) {
                        if (err)
                            console.log(err);
                        else
                            console.log('核心js库生成完毕');
                    });
                } else if (path.indexOf('index.html') > 0) {
                    gulp.start(me.COMPILE_INDEX);
                }

            });
        });
    },
    /**
     * 为游戏开启web服务
     */
    server: function() {
        gulp.task(this.SERVER, function() {
            return gulp.src(['dist/'])
                .pipe(webserver({
                    host: getIPAdress(),
                    port: 5000,
                    livereload: false,
                    open: '/index.html',
                    directoryListing: false

                }));
        });
    }
};

module.exports = Game;