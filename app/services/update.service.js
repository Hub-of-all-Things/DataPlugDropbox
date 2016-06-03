'use strict';

const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');
const config = require('../config');

let internals = {};

let queue = async.queue(work, 1);
let onQueueJobs = [];

setInterval(() => {
  console.log('Checking DB for tasks... ');

  db.findDueJobs(onQueueJobs, (err, results) => {
    console.log(results);
    const updateTasks = results.reduce((memo, result) => {
      if (result.dataSource.dataSourceModelId && result.dataSource.hatIdMapping) {
        memo.push({
          task: 'UPDATE_RECORDS',
          info: result
        });
      }

      return memo;
    }, []);
    console.log(updateTasks);
    return internals.addNewJobs(updateTasks);
  });
}, config.updateService.dbCheckInterval);

exports.addInitJob = (dataSource) => {
  queue.unshift({ task: 'CREATE_MODEL', info: dataSource }, (err) => {
    if (err) {
        console.log('Error occured when creating model.');
      } else {
        console.log('Model has been successfully created.');
      }
  });

  onQueueJobs.unshift(dataSource._id);
};

exports.addNewJobsByAccount = (account, callback) => {
  db.getAllDboxFoldersByAccount(account, onQueueJobs, (err, results) => {
    if (err) return callback(err);
      const tasks = results.map((result) => {
        return {
          task: "UPDATE_RECORDS",
          info: result
        };
      });

      internals.addNewJobs(tasks);
      return callback(null);
    });
};

function work(item, cb) {
  if (item.task === 'UPDATE_RECORDS') {
    db.lockJob(item.info._id, (err, savedJob) => {
      if (err) {
        console.log(err);
        onQueueJobs.shift();
        return cb();
      }

      hat.updateDataSource(item.info.dataSource, item.info, (err) => {
        const currentTime = new Date();

        const isSuccess = err ? false : true;

        const nextRunAt = err ? new Date(currentTime.getTime() + config.updateService.repeatInterval) : null;

        db.updateDboxFolder(item.info, isSuccess, nextRunAt, (err) => {
          cb();
        });
      });
    });
  } else if (item.task === 'CREATE_MODEL') {
    hat.mapOrCreateModel(item.info, (err) => {
      const currentTime = new Date();

      const isSuccess = err ? false : true;

      const nextRunAt = new Date(currentTime.getTime() + config.updateService.repeatInterval);

      db.updateDboxFolder(item.info, isSuccess, nextRunAt, (err) => {
        onQueueJobs.shift();
        cb();
      });
    });
  }
}

internals.addNewJobs = (jobs) => {
  async.eachSeries(jobs, (job, callback) => {
    queue.push(job, (err) => {
      if (err) {
        console.log('Error occured when processing job.');
      } else {
        console.log('Job has been completed.');
        console.log('ON QUEUE', queue.length());
        console.log('OnQueueArray', onQueueJobs.length);

        onQueueJobs.shift();
      }
    });

    onQueueJobs.push(job.info._id);

    return callback();
  }, () => {
    console.log('All tasks submitted to queue.');
  });
};