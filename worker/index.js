const config = require('./config')
const redis = require('redis')
const Broker = require('rascal').Broker

const redisClient = redis.createClient({
    host: config.Redis.Host,
    port: config.Redis.Port,
    retry_strategy: () => 1000
})

//Inefficient Fibonacci algorithm used to simulate system behaviour under different workloads
function fib(index) {
    if (index < 2) return 1
    return (fib(index - 1) + fib(index - 2))
}

Broker.create(config.RabbitMQ, (err, broker) => {
    if (err) throw err

    // Consume a message
    broker.subscribe('worker_sub', (err, sub) => {
        if (err) throw err

        sub.on('message', (message, content, ackOrNack) => {
            ackOrNack()
            console.log(`Got message ${content}`)
            const time = process.hrtime()
            redisClient.hset('values', content, fib(parseInt(content)))
            const diff = process.hrtime(time)
            console.log(`Computed Fibonacci for index ${content} in ${diff[0]}s ${diff[1] / 1000000}ms`)
        })
            .on('error', console.error)
            .on('cancel', console.warn)
    });

    broker.on('error', console.error)
})
