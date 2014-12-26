'use strict';
/**
 * @file directory test
 * @module mongodb-restore
 * @package mongodb-restore
 * @subpackage test
 * @version 0.0.1
 * @author hex7c0 <hex7c0@gmail.com>
 * @license GPLv3
 */

/*
 * initialize module
 */
// import
try {
  var restore = require('..');
  var assert = require('assert');
  var fs = require('fs');
  var client = require('mongodb').MongoClient;
  var URI = process.env.URI;
  var URI2 = process.env.URI2;
} catch (MODULE_NOT_FOUND) {
  console.error(MODULE_NOT_FOUND);
  process.exit(1);
}

/*
 * test module
 */
describe('directory', function() {

  var DOCS = {};
  var ROOT = __dirname + '/dump/';
  var COLLECTION = '';
  var INDEX = [];
  this.timeout(5000);

  it('should get db directory, not tar file', function(done) {

    fs.readdirSync(ROOT).forEach(function(first) { // database

      var t = ROOT + first;
      if (!fs.existsSync(t) || !fs.statSync(t).isDirectory()) {
        return;
      }
      ROOT += first;
      done();
    });
  });
  it('should get original data from db', function(done) {

    var second = fs.readdirSync(ROOT);
    assert.equal(second.length, 2); // .metadata + collection
    assert.equal(second[1], 'auths');
    COLLECTION = second[1];
    client.connect(URI2, function(err, db) {

      db.collection(COLLECTION, function(err, collection) {

        assert.equal(err, null);
        collection.indexes(function(err, index) {

          assert.equal(err, null);
          INDEX = index;
          collection.find({}).toArray(function(err, docs) {

            assert.equal(Array.isArray(docs), true);
            assert.equal(docs.length > 0, true);
            DOCS = docs;
            done();
          });
        });
      });
    });
  });

  describe('restore', function() {

    it('should save data to db', function(done) {

      restore({
        uri: URI,
        root: ROOT,
        metadata: true,
        callback: function() {

          setTimeout(done, 500); // time for mongod
        }
      });
    });
    it('should test original data and saved data', function(done) {

      client.connect(URI, function(err, db) {

        db.collectionNames(function(err, items) {

          assert.equal(err, null);
          assert.equal(items.length, 2); // collection + indexes
          db.collection(COLLECTION, function(err, collection) {

            assert.equal(err, null);
            collection.indexes(function(err, index) {

              assert.equal(err, null);
              assert.equal(index.length, INDEX.length);
              for (var i = 0, ii = index.length; i < ii; i++) { // remove db releated data
                delete index[i].ns;
                delete INDEX[i].ns;
              }
              assert.deepEqual(index, INDEX);
              collection.find({}).toArray(function(err, docs) {

                assert.equal(err, null);
                assert.deepEqual(docs, DOCS);
                done();
              });
            });
          });
        });
      });
    });
  });
});