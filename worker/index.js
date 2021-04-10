const config = require('./config')
const redis = require('redis')
const Broker = require('rascal').Broker
const log4js = require("log4js");
const logger = log4js.getLogger();
const { v4: uuidv4 } = require('uuid');

const instanceId = uuidv4()
logger.level = "DEBUG";
logger.info(`Worker ${instanceId} initializing...`)

const redisClient = redis.createClient({
    host: config.Redis.Host,
    port: config.Redis.Port,
    retry_strategy: () => 1000
})

//Inefficient Fibonacci algorithm used to simulate system behaviour under different workloads
function fibonacci(index) {
    if (index === 1) return 1
    if (index < 1) return 0
    return (fibonacci(index - 1) + fibonacci(index - 2))
}

Broker.create(config.RabbitMQ, (err, broker) => {
    if (err) {
        logger.fatal('Exception creating message broker instance')
        throw new Error(`Exception creating message broker instance: ${err.message}`)
    }

    // Consume a message
    broker.subscribe('worker_sub', (err, sub) => {
        if (err) {
            logger.fatal('Exception creating message subscription')
            throw new Error(`Exception creating message subscription: ${err.message}`)
        }

        logger.info('Broker created message subscription');

        sub.on('message', (message, content, ackOrNack) => {
            ackOrNack()
            logger.info(`Got message ${content}`)
            const time = process.hrtime()
            const fib = fibonacci(parseInt(content))
            const diff = process.hrtime(time)
            redisClient.hset('values', content, fib)
            const minutes = Math.floor(diff[0] / 60)
            const seconds = diff[0] - (minutes * 60)
            logger.info(`Worker ${instanceId} computed Fibonacci for number ${content} in ${minutes}m ${seconds}s ${Math.ceil(diff[1] / 1000000)}ms`)
        })
            .on('error', (err) => {
                logger.error(`Error while consuming messages: ${err.message}`)
            })
            .on('cancelled', (err) => {
                logger.warn(`Cancelling messages: ${err.message}`)
            })
    });

    broker.on('vhost_initialised', ({ vhost, connectionUrl }) => {
        logger.warn(`Vhost ${vhost} was initialised using connection ${connectionUrl}`);
    })

    broker.on('blocked', (reason, { vhost, connectionUrl }) => {
        logger.warn(`Vhost ${vhost} was blocked on connection ${connectionUrl}. Reason: ${reason}`);
    })

    broker.on('unblocked', ({ vhost, connectionUrl }) => {
        logger.warn(`Vhost: ${vhost} was unblocked on connection: ${connectionUrl}`);
    })

    broker.on('disconnect', () => {
        logger.warn('Broker disconnected');
    })

    broker.on('connect', () => {
        logger.warn('Broker connected');
    })

    broker.on('busy', (details) => {
        logger.warn(`vhost ${details.vhost}'s queue ${details.queue} is busy`);
    })

    broker.on('ready', (details) => {
        logger.warn(`vhost ${details.vhost}'s queue ${details.queue} is now available`);
    })

    broker.on('error', (err) => {
        logger.error(`Broker error: ${err.message}`)
    })
})

logger.info(`Worker ${instanceId} ready...`)
