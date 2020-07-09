const config = require('./config')
const redis = require('redis')
const Broker = require('rascal').Broker

const redisClient = redis.createClient({
    host: config.Redis.Host,
    port: config.Redis.Port,
    retry_strategy: () => 1000
})

//Inefficient Fibonacci algorithm used to simulate system behaviour under different workloads
function fibonacci(index) {
    if (index < 2) return 1
    return (fibonacci(index - 1) + fibonacci(index - 2))
}

Broker.create(config.RabbitMQ, (err, broker) => {
    if (err) throw new Error(`Exception creating broker instance: ${err.message}`)

    // Consume a message
    broker.subscribe('worker_sub', (err, sub) => {
        if (err) throw new Error(`Exception creating subscription: ${err.message}`)

        sub.on('message', (message, content, ackOrNack) => {
            ackOrNack()
            console.log(`Got message ${content}`)
            const time = process.hrtime()
            const fib = fibonacci(parseInt(content))
            const diff = process.hrtime(time)
            redisClient.hset('values', content, fib)
            const minutes = Math.floor(diff[0] / 60)
            const seconds = diff[0] - (minutes * 60)
            console.log(`Computed Fibonacci for index ${content} in ${minutes}m ${seconds}s ${Math.ceil(diff[1] / 1000000)}ms`)
        })
            .on('error', (err) => {
                console.error(`Error while consuming messages: ${err.message}`)
            })
            .on('cancelled', (err) => {
                console.warn(`Cancelling messages: ${err.message}`)
            })
    });

    broker.on('vhost_initialised', ({ vhost, connectionUrl }) => {
        console.warn(`Vhost ${vhost} was initialised using connection ${connectionUrl}`);
    })

    broker.on('blocked', (reason, { vhost, connectionUrl }) => {
        console.warn(`Vhost ${vhost} was blocked on connection ${connectionUrl}. Reason: ${reason}`);
    })

    broker.on('unblocked', ({ vhost, connectionUrl }) => {
        console.warn(`Vhost: ${vhost} was unblocked on connection: ${connectionUrl}`);
    })

    broker.on('disconnect', () => {
        console.warn('Broker disconnected');
    })

    broker.on('connect', () => {
        console.warn('Broker connected');
    })

    broker.on('busy', (details) => {
        console.warn(`vhost ${details.vhost}'s queue ${details.queue} is busy`);
    })

    broker.on('ready', (details) => {
        console.warn(`vhost ${details.vhost}'s queue ${details.queue} is now available`);
    })

    broker.on('error', (err) => {
        console.error(`Broker error: ${err.message}`)
    })
})
