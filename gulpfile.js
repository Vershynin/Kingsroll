var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    del = require('del'),
    pngquant = require('imagemin-pngquant'),
    cache = require('gulp-cache'),
    autoprefixer = require('gulp-autoprefixer'),
    fileinclude = require('gulp-file-include'),
    gulpRemoveHtml = require('gulp-remove-html'),
    bourbon = require('node-bourbon'),
    htmlmin = require('gulp-htmlmin'),
    replace = require('gulp-replace'),
    ftp = require('vinyl-ftp'),
    realFavicon = require('gulp-real-favicon'),
    inject = require('gulp-inject'),
    // imagemin = require('gulp-imagemin'),
    // imageminPngquant = require('imagemin-pngquant'),
    // imageminZopfli = require('imagemin-zopfli'),
    // imageminMozjpeg = require('imagemin-mozjpeg'),
    // imageminGiflossy = require('imagemin-giflossy'),
    fs = require('fs');


gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false
    });
});





gulp.task('sass', function() {
    return gulp.src('app/sass/**/*.scss')
        .pipe(sass({
            includePaths: bourbon.includePaths
        }).on('error', sass.logError))
        .pipe(rename({
            suffix: '.min',
            prefix: ''
        }))
        .pipe(autoprefixer(['last 15 versions']))
        .pipe(cleanCSS())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('libs', function() {
    return gulp.src([
            'app/js/jquery.fancybox.min.js',
            'app/js/cart.js',
            'app/js/common.js',
        ])
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

//**/*.html
gulp.task('watch', ['sass', 'browser-sync'], function() {
    gulp.watch('app/sass/**/*.scss', ['sass']);
    gulp.watch('app/*.html', browserSync.reload);
    // gulp.watch('app/**/*.html', browserSync.reload);
    gulp.watch('app/js/**/*.js', browserSync.reload);

});

// var paths = {
// 	html:['index.html']
// };
//
//
// gulp.task('html', function(){
// 	gulp.src(paths.html)
// 		.pipe(reload({stream:true}));
// });


gulp.task('imagemin:old', function() {
    return gulp.src('app/img/**/*')
        .pipe(cache(imagemin({
            interlaced: true,
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('buildhtml', function() {
    gulp.src(['app/*.html'])
        .pipe(fileinclude({
            prefix: '@@'
        }))
        .pipe(gulpRemoveHtml())
        .pipe(gulp.dest('dist/'));
});

gulp.task('removedist', function() {
    return del.sync('dist');
});

gulp.task('build:old', ['removedist', 'buildhtml', 'sass', 'libs'], function() {

    var buildCss = gulp.src([
        'app/css/fonts.min.css',
        'app/css/main.min.css'
    ]).pipe(gulp.dest('dist/css'));

    var buildFiles = gulp.src([
        'app/.htaccess'
    ]).pipe(gulp.dest('dist'));

    var buildFonts = gulp.src('app/fonts/**/*').pipe(gulp.dest('dist/fonts'));

    var buildJs = gulp.src('app/js/**/*').pipe(gulp.dest('dist/js'));

});

gulp.task('deploy', function() {

    var conn = ftp.create({
        host: 'hostname.com',
        user: 'username',
        password: 'userpassword',
        parallel: 10,
        log: gutil.log
    });

    var globs = [
        'dist/**',
        'dist/.htaccess',
    ];
    return gulp.src(globs, {
            buffer: false
        })
        .pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('clearcache', function() {
    return cache.clearAll();
});

gulp.task('default', ['watch']);









gulp.task('cartjs', function() {
    return gulp.src('app/cart/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('app/cart/js'));
});

gulp.task('cartcss', function() {
    return gulp.src('app/cart/**/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('app/cart/css'));
});
// npm i gulp-real-favicon


// File where the favicon markups are stored
var FAVICON_DATA_FILE = 'faviconData.json';

// Generate the icons.
gulp.task('generate-favicon', function(done) {
    realFavicon.generateFavicon({
        masterPicture: 'app/favicons/basic.png', //optimal size 300px
        dest: 'app/favicons',
        iconsPath: 'favicons',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin', //Add a solid, plain background to fill the transparent regions.
                backgroundColor: '#ffffff',
                margin: '14%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {},
            windows: {
                masterPicture: 'app/favicons/basic_invert.png', //remove if basic.png is fine
                pictureAspect: 'whiteSilhouette', //Use a white silhouette version of the favicon
                backgroundColor: '#e10d1b',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: '#e10d1b',
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                masterPicture: 'app/favicons/basic_invert.png', //remove if basic.png is fine
                pictureAspect: 'silhouette', //if image has transparent background
                // pictureAspect: 'blackAndWhite', //if image has white background
                // threshold: 99, //if image has white background
                themeColor: '#e10d1b'
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false
        },
        markupFile: FAVICON_DATA_FILE
    }, function() {
        done();
    });
});

// Inject the favicon markups in your HTML pages.
gulp.task('inject-favicon-markups', function() {
    return gulp.src(['app/*.html'])
        .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
        .pipe(gulp.dest('app'));
});

// Check for updates on RealFaviconGenerator
gulp.task('check-for-favicon-update', function(done) {
    var currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
    realFavicon.checkForUpdates(currentVersion, function(err) {
        if (err) {
            throw err;
        }
    });
});

//compress html
gulp.task('htmlmin', ['inject:cssinlining'], function() {
    return gulp.src('dist/**/*.html')
        .pipe(htmlmin({
            //Extrem compression//
            collapseWhitespace: true,
            conservativeCollapse: true, //work with collapseWhitespace and save at least 1 space inside teg
            preserveLineBreaks: false, //make line break if collapseWhitespace true

            collapseBooleanAttributes: true, //<input disabled="disabled"> to <input disabled>. problem in cases when css looks like: input[disabled="disabled"] { color: green }
            decodeEntities: true,
            minifyCSS: true,
            minifyJS: true,
            //removeAttributeQuotes: true, //remove "" and it may be too much
            removeComments: true,
            removeCommentsFromCDATA: true,
            removeEmptyAttributes: true,
            removeRedundantAttributes: true, //default attribute name-value get stripped. Example: <input type="text" /> convert to <input/> so css input[type="text"] won't work
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            sortAttributes: true, //improve gzip compression
            sortClassName: true, //improve gzip compression
            useShortDoctype: true
        }))
        //remove empty line from compressed html
        .pipe(replace(/^\s*\r?\n/gm, ''))
        .pipe(gulp.dest('dist'));
});


gulp.task('unhtml', function() {
    return gulp.src('app/**/*.html')
        .pipe(htmlmin({
            minifyJS: true,
            minifyCSS: true
        }))
        .pipe(gulp.dest('app'));
});


// inject cssinlining
gulp.task('inject:cssinlining', ['inject:js', 'sass'], function() {
    return gulp.src('dist/**/*.html')
        .pipe(inject(gulp.src('app/css/header.min.css'), {
            starttag: '<!-- inject:cssinlining -->',
            transform: function(filePath, file) {
                return '<style>' + file.contents.toString('utf8') + '</style>'
            }
        }))
        .pipe(gulp.dest('./dist'));
});

//inject libs js
gulp.task('inject:js', ['libs'],  function() {
    return gulp.src('./app/*.html')
        .pipe(inject(gulp.src('./app/js/libs.min.js', {
            read: false
        }), {
            relative: true,
            transform: filepath => `<script src="${filepath}" defer></script>`
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['htmlmin', 'removedist'], function() {

    var buildCss = gulp.src(['app/**/*', '!app/**/*.html', '!app/{sass,sass/**/*}']).pipe(gulp.dest('dist'));
    var buildFiles = gulp.src([
        './.htaccess'
    ]).pipe(gulp.dest('dist'));

});

//compress all images
gulp.task('imagemin1', function() {
    return gulp.src(['app/**/*.{gif,png,jpg}'])
        .pipe(imagemin([
            //png
            // imageminPngquant({
            //     speed: 1,
            //     quality: 98 //lossy settings
            // }),
            // imageminZopfli({
            //     more: true
            // }),
            //gif
            // imagemin.gifsicle({
            //     interlaced: true,
            //     optimizationLevel: 3
            // }),
            //gif very light lossy, use only one of gifsicle or Giflossy
            // imageminGiflossy({
            //     optimizationLevel: 3,
            //     optimize: 3, //keep-empty: Preserve empty transparent frames
            //     lossy: 2
            // }),
            //svg
            imagemin.svgo({
                plugins: [{
                    removeViewBox: false
                }]
            }),
            //jpg lossless
            imagemin.jpegtran({
                progressive: true
            }),
            //jpg very light lossy, use vs jpegtran
            imageminMozjpeg({
                quality: 90
            })
        ]))
        .pipe(gulp.dest('dist'));
});
// install
// npm i gulp-imagemin imagemin-pngquant imagemin-zopfli imagemin-mozjpeg imagemin-giflossy
