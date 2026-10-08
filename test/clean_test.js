'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var grunt = require('./helpers/grunt');

function setup(t) {
  var base = grunt.tempDir(t);
  fs.cpSync(path.join(grunt.fixtures, 'sample_long'), path.join(base, 'tmp/sample_long'), { recursive: true });
  fs.cpSync(path.join(grunt.fixtures, 'sample_short'), path.join(base, 'tmp/sample_short'), { recursive: true });
  ['end_01', 'end_02'].forEach(function(dir) {
    fs.cpSync(path.join(grunt.fixtures, 'start'), path.join(base, 'tmp', dir), { recursive: true });
  });
  return base;
}

function ok(result) {
  assert.equal(result.status, 0, result.output);
}

test('removes a directory given as a short path list', function(t) {
  var base = setup(t);
  ok(grunt.run(base, ['clean:shortPathTest']));
  assert.equal(fs.existsSync(path.join(base, 'tmp/sample_short')), false);
  assert.equal(fs.existsSync(path.join(base, 'tmp/sample_long')), true);
});

test('removes a directory given as src', function(t) {
  var base = setup(t);
  ok(grunt.run(base, ['clean:longPathTest']));
  assert.equal(fs.existsSync(path.join(base, 'tmp/sample_long')), false);
});

test('honours exclusion patterns', function(t) {
  var base = setup(t);
  ok(grunt.run(base, ['clean:exclude']));
  assert.deepEqual(grunt.tree(path.join(base, 'tmp/end_01')), grunt.tree(path.join(grunt.expected, 'end_01')));
});

test('honours exclusion patterns for subdirectories', function(t) {
  var base = setup(t);
  ok(grunt.run(base, ['clean:excludeSub']));
  assert.deepEqual(grunt.tree(path.join(base, 'tmp/end_02')), grunt.tree(path.join(grunt.expected, 'end_02')));
});

test('dir/* empties a directory but keeps it', function(t) {
  var base = grunt.tempDir(t);
  fs.mkdirSync(path.join(base, 'build/dev/assets/fonts'), { recursive: true });
  fs.writeFileSync(path.join(base, 'build/dev/index.html'), 'x');
  fs.writeFileSync(path.join(base, 'build/dev/assets/fonts/a.woff'), 'x');
  fs.mkdirSync(path.join(base, 'build/prod'));
  var result = grunt.run(base, ['clean:contents']);
  ok(result);
  assert.match(result.output, /2 paths cleaned/);
  assert.deepEqual(fs.readdirSync(path.join(base, 'build/dev')), []);
  assert.equal(fs.existsSync(path.join(base, 'build/prod')), true);
});

test('removes single files and ignores paths that do not exist', function(t) {
  var base = grunt.tempDir(t);
  fs.mkdirSync(path.join(base, 'src/config/modules'), { recursive: true });
  fs.writeFileSync(path.join(base, 'src/config/OperationConfig.json'), '{}');
  fs.writeFileSync(path.join(base, 'src/config/modules/A.mjs'), '');
  fs.writeFileSync(path.join(base, 'src/config/modules/B.mjs'), '');
  fs.writeFileSync(path.join(base, 'src/config/keep.mjs'), '');
  ok(grunt.run(base, ['clean:singleFiles']));
  assert.deepEqual(grunt.tree(path.join(base, 'src')), ['config/', 'config/keep.mjs: ', 'config/modules/']);
});

test('no-write leaves files in place', function(t) {
  var base = grunt.tempDir(t);
  fs.writeFileSync(path.join(base, 'keep'), 'x');
  var result = grunt.run(base, ['clean:noWrite', '--verbose']);
  ok(result);
  assert.match(result.output, /Not actually cleaning keep/);
  assert.equal(fs.existsSync(path.join(base, 'keep')), true);
});

test('refuses to delete outside the cwd unless forced', function(t) {
  var base = grunt.tempDir(t);
  var outside = base + '-outside';
  fs.writeFileSync(outside, 'x');
  t.after(function() {
    fs.rmSync(outside, { force: true });
  });

  var result = grunt.run(base, ['clean:outside']);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Cannot delete files outside the current working directory/);
  assert.equal(fs.existsSync(outside), true);

  ok(grunt.run(base, ['clean:outsideForced']));
  assert.equal(fs.existsSync(outside), false);
});

test('refuses to delete the cwd', function(t) {
  var base = grunt.tempDir(t);
  var result = grunt.run(base, ['clean:cwd']);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Cannot delete the current working directory/);
  assert.equal(fs.existsSync(base), true);
});

test('removes a symlink without following it', { skip: process.platform === 'win32' }, function(t) {
  var base = grunt.tempDir(t);
  fs.mkdirSync(path.join(base, 'target'));
  fs.writeFileSync(path.join(base, 'target/file'), 'x');
  fs.symlinkSync('target', path.join(base, 'link'));
  ok(grunt.run(base, ['clean:link']));
  assert.equal(fs.existsSync(path.join(base, 'link')), false);
  assert.equal(fs.existsSync(path.join(base, 'target/file')), true);
});
