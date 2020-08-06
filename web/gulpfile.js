const gulp = require('gulp');
const del = require('del');
const rename = require("gulp-rename");

gulp.task('dist-front', gulp.series([
	_=> del(['./dist/static']),
	_=> gulp.src("./build/**").pipe(rename(path=> {
		path.dirname='static/'+path.dirname;
	})).pipe(gulp.dest("./dist"))
]))

gulp.task('clean', _=> del(['./dist/**']))