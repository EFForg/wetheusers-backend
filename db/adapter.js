/**
 * Adapters for different datastore types.
 */

var lodash = require('lodash');
var redis = require('redis');
var url = require('url');
var kue = require('kue')
var Step = require('step');

var redisConfig = require('config').get('REDIS');
var wtpConfig = require('config').get('WE_THE_PEOPLE');
var dbUtils = require('./utils');
var wtp = require('../lib/wethepeople.js');


var RedisAdapter = function() {
  var options = {
    max_attempts: redisConfig.get('MAX_ATTEMPTS')
  };

  var port = redisConfig.get('PORT');
  var hostname = redisConfig.get('URL');


  // TODO(leah): per https://github.com/mranney/node_redis/issues/226 connection pooling shouldn't
  //             be necessary for our use case, so manage a single conn instance.
  /**
   * The underlying Redis client connection.
   * @type {*}
   * @private
   */
  this.client_ = redis.createClient(port, hostname, options);

  /**
   * The Kue job queue used to send tasks to the daemon.
   * @type {Queue}
   */
  this.jobQueue = kue.createQueue({
    redis: { port: port, host: hostname }
  });

  this.jobQueue.process('sign', wtpConfig.get('MAXIMUM_CONCURRENCY'),
    function(job, done){
      // send the job off to We The People and mark as sent if successful
      wtp.sign(
        job.data.signature.petitionId,
        job.data.signature.firstName,
        job.data.signature.lastName,
        job.data.signature.email,
        function(err){
          if(err) return done(err);
          job.data.signature.sentToWhiteHouse = true;
          job.save();
          done();
        }
      );
    }
  );

  this.jobQueue.on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
      if(err) return;
      job.remove();
    })
  });
};


/**
 * Saves the supplied signature object.
 *
 * @param signature
 * @param success
 * @param failure
 */
RedisAdapter.prototype.saveSignature = function(signature, success, failure) {
  var adapter = this;
  var emailHash = dbUtils.hashEmail(signature.email);

  Step(function(){

    adapter.client_.set(emailHash, JSON.stringify(signature), this.parallel());
    adapter.jobQueue.create('sign', {
      signature: signature
    }).save(this.parallel());

  }, function(err){
    if(err) return failure(err);
    success();
  });
};


/**
 * Fetches a signature object for the supplied email address.
 *
 * @param email
 * @param success
 * @param failure
 */
RedisAdapter.prototype.getSignature = function(email, success, failure) {
  var emailHash = dbUtils.hashEmail(email);

  this.client_.get(emailHash, function(err, reply) {
    if (err) {
      failure(err);
    } else {
      success(JSON.parse(reply));
    }
  });
};


module.exports = new RedisAdapter();
