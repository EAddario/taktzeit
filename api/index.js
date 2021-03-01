const config = require('./config')
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "DEBUG";

logger.info("API initializing...")

//Express app setup
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

//Postgres app setup
const {Pool} = require('pg')
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
const redis = require('redis')
const redisClient = redis.createClient({
    host: config.Redis.Host,
    port: config.Redis.Port,
    retry_strategy: () => 1000
})

// RabbitMQ client setup
const rabbitmq = require('rascal').Broker
let rabbitClient
rabbitmq.create(config.RabbitMQ, (err, _rabbitClient) => {
    if (err) {
        logger.fatal(`Exception creating broker instance: ${err.message}`)
        throw new Error(`Exception creating broker instance: ${err.message}`)
    }
    rabbitClient = _rabbitClient
})

//Express route handlers
app.get('/', (req, res) => {
    logger.debug("GET /")
    res.send('API Running...')
});

app.get('/values/all', async (req, res) => {
    logger.debug("GET /values/all")
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows)
})

app.get('/values/current', async (req, res) => {
    logger.debug("GET /values/current")
    redisClient.hgetall('values', (err, values) => {
        res.send(values)
    })
})

app.post('/values', async (req, res) => {
    logger.debug("POST /values")
    const index = parseInt(req.body.index)

    if (!(Number.isInteger(index)) || (index > 55)) {
        logger.warn(`Invalid entry ${index}. Allowed range is 0 to 55`)
        return res.status(422).send('Invalid entry. Allowed range is 0 to 55')
    }

    redisClient.hset('values', index, 'NaN')

    rabbitClient.publish('worker_pub', index, (err, pub) => {
        if (err) throw new Error(`Exception while publishing: ${err.message}`)
        pub.on('error', (err) => {
            console.error(`Error while publishing messages: ${err.message}`)
        })
    })
    logger.info(`Published number ${index}`)

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index])

    res.send({working: true})
})

//Express instantiation
app.listen(5010, err => {
    logger.info('API listening...')
})

logger.info("API ready...")
