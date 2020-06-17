const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisSubscriber = redisClient.duplicate();

//Inefficient Fibonacci algorithm used on purpose to simulate different workloads
function fib(index) {
    if (index < 2) return 1;
    return (fib(index - 1) + fib(index - 2));
}

redisSubscriber.on('message', (channel, message) => {
    const time = process.hrtime();
    redisClient.hset('values', message, fib(parseInt(message)));
    const diff = process.hrtime(time);
    console.log(`Computed Fibonacci for index ${message} in ${diff[0]}s ${diff[1] / 1000000}ms`);
});

redisSubscriber.subscribe('insert');
