const config = require("./config")
const log4js = require("log4js");
const logger = log4js.getLogger();
const port = 5010
logger.level = "DEBUG";

logger.info('API server initializing...')

//Express app setup
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const app = express()
app.use(cors())
app.use(bodyParser.json())

//Postgres app setup
const {Pool} = require("pg")
const pgClient = new Pool({
    database: config.Postgres.Database,
    host: config.Postgres.Host,
    port: config.Postgres.Port,
    user: config.Postgres.User,
    password: config.Postgres.Password
})

pgClient.on('error', () => logger.fatal('Lost Postgres connection'))
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => logger.fatal(err))

//Redis client setup
const redis = require("redis")
const redisClient = redis.createClient({
    socket:{
        host: config.Redis.Host,
        port: config.Redis.Port,
        reconnectStrategy: () => 1000
    }})

redisClient.connect()
    .then(() => logger.info("Connected to Redis"))
    .catch(err => logger.fatal(err))

// RabbitMQ client setup
const rabbitBroker = require("rascal").Broker
let rabbitClient

rabbitBroker.create(config.RabbitMQ, (err, _rabbitClient) => {
    if (err) {
        logger.fatal(`Exception creating broker instance: ${err.message}`)
        throw new Error(`Exception creating broker instance: ${err.message}`)
    }
    rabbitClient = _rabbitClient
})

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

//Express route handlers
app.get('/', (req, res) => {
    logger.debug('GET /')
    res.send('API Running...')
});

app.get('/health', (req, res) => {
    const body = {
        message: 'OK',
        timestamp: new Date(Date.now()),
        uptime: secondsToDhms(process.uptime())
    }
    logger.debug('GET /health', body)
    res.send(body)
});

app.get('/values/all', async (req, res) => {
    logger.debug('GET /values/all')
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows)
})

app.get('/values/current', async (req, res) => {
    logger.debug('GET /values/current')
    redisClient.hGetAll('values')
        .then(values => {res.send(values)})
        .catch(err => logger.fatal(err))
})

app.post('/values', async (req, res) => {
    logger.debug('POST /values')
    const index = parseInt(req.body.index)

    if (!(Number.isInteger(index)) || (index > 55)) {
        logger.warn(`Invalid entry ${index}. Allowed range is 0 to 55`)
        return res.status(422).send('{error:"Invalid entry. Allowed range is 0 to 55"}')
    }

    redisClient.hSet('values', index, 'NaN')
        .catch(err => logger.fatal(err))

    rabbitClient.publish('worker_pub', index, (err, pub) => {
        if (err) throw new Error(`Exception while publishing: ${err.message}`)

        pub.on('error', (err) => {
            logger.error(`${err} while publishing number ${index}`)
        })

        pub.on('success', () => {
            logger.info(`Published number ${index}`)
        })

        pub.on('return', () => {
            logger.warn(`Could not publish number ${index}`)
        })

        pub.on('paused', () => {
            logger.warn(`Publication was paused. Aborting  number ${index}`)
            pub.abort()
        })
    })

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index])

    res.send({working: true})
})

app.post('/values/reset', async () => {
    logger.debug("POST /values/reset")

    pgClient.query('TRUNCATE values')
        .then(() => logger.info('PostgreSQL data flushed'))
        .catch(err => logger.fatal(err))

    redisClient.flushDb('ASYNC', () => logger.info("Redis cache flushed"))
        .catch(err => logger.fatal(err))
})

//Express instantiation
app.listen(port, err => {
    if (err) {
        logger.fatal(`Exception creating API server: ${err.message}`)
        throw new Error(`Exception creating API server: ${err.message}`)
    }

    logger.info(`API server ready and listening on port ${port}`)
})
