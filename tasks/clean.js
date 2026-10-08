/*
 * grunt-contrib-clean
 * https://gruntjs.com/
 *
 * Copyright (c) 2016 Tim Branyen, contributors
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');

module.exports = function(grunt) {

  function clean(filepath, options) {
    if (!grunt.file.exists(filepath)) {
      return Promise.resolve();
    }

    // Only delete cwd or outside cwd if --force enabled. Be careful, people!
    if (!options.force) {
      if (grunt.file.isPathCwd(filepath)) {
        grunt.verbose.error();
        grunt.fail.warn('Cannot delete the current working directory.');
        return Promise.resolve();
      } else if (!grunt.file.isPathInCwd(filepath)) {
        grunt.verbose.error();
        grunt.fail.warn('Cannot delete files outside the current working directory.');
        return Promise.resolve();
      }
    }

    grunt.verbose.writeln((options['no-write'] ? 'Not actually cleaning ' : 'Cleaning ') + filepath + '...');
    // Actually delete. Or not.
    if (options['no-write']) {
      return Promise.resolve();
    }
    // fs.rm removes symlinks themselves rather than following them, and
    // retries transient EBUSY/EPERM/ENOTEMPTY errors as rimraf did.
    return fs.promises.rm(filepath, { recursive: true, force: true, maxRetries: 3 }).catch(function(err) {
      grunt.log.error();
      grunt.fail.warn('Unable to delete "' + filepath + '" file (' + err.message + ').', err);
    });
  }

  grunt.registerMultiTask('clean', 'Clean files and folders.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      force: grunt.option('force') === true,
      'no-write': grunt.option('no-write') === true
    });

    var done = this.async();

    // Clean specified files / dirs, one at a time and in order.
    var files = this.filesSrc;
    files.reduce(function(previous, filepath) {
      return previous.then(function() {
        return clean(filepath, options);
      });
    }, Promise.resolve()).then(function() {
      grunt.log.ok(files.length + ' ' + grunt.util.pluralize(files.length, 'path/paths') + ' cleaned.');
      done();
    }, done);
  });

};
