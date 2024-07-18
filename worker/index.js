const config = require('./config')
const redis = require('redis')
const Broker = require('rascal').Broker
const log4js = require("log4js");
const logger = log4js.getLogger();
const {v4: uuidv4} = require('uuid');
const express = require("express")
const app = express()
const port = 80

const instanceId = uuidv4()
logger.level = "DEBUG";
logger.info(`Worker ${instanceId} initializing...`)

const redisClient = redis.createClient({
    socket: {
        host: config.Redis.Host,
        port: config.Redis.Port,
        reconnectStrategy: () => 1000
    }
})

redisClient.connect()
    .then(() => logger.info("Connected to Redis"))
    .catch(err => logger.fatal(err))

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
            redisClient.hSet('values', content, fib)
                .catch(err => logger.fatal(err))
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

    broker.on('vhost_initialised', ({vhost, connectionUrl}) => {
        logger.warn(`Vhost ${vhost} was initialised using connection ${connectionUrl}`);
    })

    broker.on('blocked', (reason, {vhost, connectionUrl}) => {
        logger.warn(`Vhost ${vhost} was blocked on connection ${connectionUrl}. Reason: ${reason}`);
    })

    broker.on('unblocked', ({vhost, connectionUrl}) => {
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

function secondsToDhms(seconds) {
    seconds = Number(seconds)
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor((seconds % (3600 * 24)) / 3600)
    let m = Math.floor((seconds % 3600) / 60)
    let s = Math.floor(seconds % 60)
    let dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : ""
    let hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : ""
    let mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : ""
    let sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : ""

    return dDisplay + hDisplay + mDisplay + sDisplay
}

app.get('/health', (req, res) => {
    const body = {
        message: 'OK',
        timestamp: new Date(Date.now()),
        uptime: secondsToDhms(process.uptime())
    }
    logger.debug('GET /health', body)
    res.send(body)
});

app.listen(port, () => {
    logger.info(`Worker ${instanceId} ready and listening on port ${port}`)
})
