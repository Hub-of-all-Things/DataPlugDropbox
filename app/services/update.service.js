'use strict';

const async = require('async');
const db = require('../services/db.service');
const hat = require('../services/hat.service');
const config = require('../config');

let queue = async.queue(work, 1);
let onQueueJobs = [];

let internals = {};

function work(item, cb)  {
  db.lockJob(item.info._id, (err, savedJob) => {
    if (err) {
      console.log(err);
      onQueueJobs.shift();
      cb();
    }

    if (item.task === 'UPDATE_RECORDS') {
      hat.updateDataSource(item.info.dataSource, (err) => {
        const currentTime = new Date();

        const isSuccess = err ? false : true;

        const nextRunAt = err ? new Date(currentTime.getTime() + config.updateService.repeatInterval) : null;

        db.updateDboxFolder(item.info, isSuccess, nextRunAt, (err) => {
          onQueueJobs.shift();
          cb();
        });

      });

    } else if (item.task === 'CREATE_MODEL') {
      hat.mapOrCreateModel(item.info.dataSource, (err) => {
        const currentTime = new Date();

        const isSuccess = err ? false : true;

        const nextRunAt = new Date(currentTime.getTime() + config.updateService.repeatInterval);

        db.updateDboxFolder(item.info, isSuccess, nextRunAt, (err) => {
          onQueueJobs.shift();
          cb();
        });

      });
    }
  });
};

setInterval(() => {
  console.log('Checking DB for tasks... ');

  db.findDueJobs(onQueueJobs, (err, results) => {
    console.log(results);
    const tasks = results.map((result) => {
      var taskName;
      if (!result.dataSource.dataSourceModelId || !result.dataSource.hatIdMapping) {
        taskName = "CREATE_MODEL";
      } else {
        taskName = "UPDATE_RECORDS";
      }

      return {
        task: taskName,
        info: result
      };
    });

    return internals.queueNewJobs(tasks);    
  });
}, config.updateService.dbCheckInterval);

internals.queueNewJobs = (jobs) => {
  async.eachSeries(jobs, (job, callback) => {
    console.log('Adding task to queue. Currently there are ' + queue.length() + ' tasks in the queue.');

    queue.push(job, () => {
      console.log('Task ' + job.task + ' has been completed.');
    });

    onQueueJobs.push(job.info._id);

    callback();
  }, () => {
    console.log('All tasks submitted to queue.');
  });
};