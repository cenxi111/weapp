const gulp = require('gulp')
const less = require('gulp-less')
const cssmin = require('gulp-clean-css')
const rename = require('gulp-rename')
const clean = require('del')

gulp.task('compile-css', () => {
    return gulp.src(['../src/**/*.less', '!../src/**/_*.less'])
        .pipe(less())
        .pipe(cssmin())
        .pipe(rename((path) => {
            path.extname = '.wxss'
        }))
        .pipe(gulp.dest('../examples/dist/'))
})

gulp.task('compile-js', () => {
    return gulp.src(['../src/**/*.js'])
        .pipe(gulp.dest('../examples/dist/'))
})

gulp.task('compile-json', () => {
    return gulp.src(['../src/**/*.json'])
        .pipe(gulp.dest('../examples/dist/'))
})

gulp.task('compile-wxml', () => {
    return gulp.src(['../src/**/*.wxml'])
        .pipe(gulp.dest('../examples/dist/'))
})

gulp.task('compile-wxs', () => {
    return gulp.src(['../src/**/*.wxs'])
        .pipe(gulp.dest('../examples/dist/'))
})


gulp.task('clean', () => {
    return gulp.src(['../src/**/*.css'])
    .pipe(clean(['../src/**/*.css'],
    {force: true})).on('error', () => {})
})

gulp.task('auto', () => {
    gulp.watch('../src/**/*.less', ['compile-css'])
    gulp.watch('../src/**/*.js', ['compile-js'])
    gulp.watch('../src/**/*.json', ['compile-json'])
    gulp.watch('../src/**/*.wxml', ['compile-wxml'])
    gulp.watch('../src/**/*.wxs', ['compile-wxs'])
    // gulp.watch('../src/**/*.css', ['clean'])
})

gulp.task('default', ['compile-css', 'compile-js', 'compile-json', 'compile-wxml', 'compile-wxs','auto'])
