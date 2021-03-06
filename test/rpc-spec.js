const assert = require('assert');
const bunnymq = require('../src/index')();
const uuid = require('uuid');
const docker = require('./docker');
const utils = require('../src/modules/utils');

const fixtures = {
  queues: ['rpc-queue-0', 'rpc-queue-1', 'rpc-queue-2']
};

describe('Producer/Consumer RPC messaging:', () => {
  before(docker.start);

  after(docker.rm);

  it('should be able to create a consumer that returns a message if called as RPC [rpc-queue-0]', () =>
    bunnymq.consumer.consume(fixtures.queues[0], () =>
      'Power Ranger Red'
    )
    .then((created) => {
      assert(created === true);
    })
  );

  it('should be able to send directly to the queue, without correlationId and not crash [rpc-queue-0]', () =>
    bunnymq.producer.produce(fixtures.queues[0], { nothing: true }, { rpc: true })
      .then(() =>
        bunnymq.producer.produce(`${fixtures.queues[0]}:${bunnymq.connection.config.hostname}:res`, { nothing: true })
      )
      .then(utils.timeoutPromise(500))
  );

  it('should be able to produce a RPC message and get a response [rpc-queue-0]', () =>
    bunnymq.producer.produce(fixtures.queues[0], { msg: uuid.v4() }, { rpc: true })
    .then((response) => {
      assert.equal(response, 'Power Ranger Red');
    })
  );

  it('should be able to produce a RPC message and get a as JSON [rpc-queue-1]', () =>
    bunnymq.consumer.consume(fixtures.queues[1],
      () => Object.assign({}, { powerRangerColor: 'Pink' }))
    .then(() =>
      bunnymq.producer.produce(fixtures.queues[1], { msg: uuid.v4() }, { rpc: true })
    )
    .then((response) => {
      assert.equal(typeof response, 'object');
      assert.equal(response.powerRangerColor, 'Pink');
    })
  );

  it('should be able to produce a RPC message and get undefined response [rpc-queue-2]', () =>
    bunnymq.consumer.consume(fixtures.queues[2], () => undefined)
    .then(() => bunnymq.producer.produce(fixtures.queues[2], undefined, { rpc: true }))
    .then((response) => {
      assert(response === undefined, 'Got a response !== undefined');
    })
  );
});
