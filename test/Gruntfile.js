'use strict';

var path = require('node:path');

// Run by test/helpers/grunt.js with --base set to a temporary directory, so
// every path below is relative to that directory.
module.exports = function(grunt) {
  grunt.initConfig({
    clean: {
      shortPathTest: ['tmp/sample_short'],
      longPathTest: {
        src: ['tmp/sample_long']
      },
      exclude: ['tmp/end_01/**/*', '!tmp/end_01/1.txt'],
      excludeSub: ['tmp/end_02/**/*.*', '!tmp/end_02/2/**/*'],
      contents: ['build/dev/*'],
      singleFiles: ['src/config/OperationConfig.json', 'src/config/modules/*', 'src/missing.mjs'],
      noWrite: {
        options: { 'no-write': true },
        src: ['keep']
      },
      outside: ['../' + path.basename(process.cwd()) + '-outside'],
      outsideForced: {
        options: { force: true },
        src: ['../' + path.basename(process.cwd()) + '-outside']
      },
      cwd: ['.'],
      link: ['link']
    }
  });

  grunt.loadTasks(path.join(__dirname, '..', 'tasks'));
};
