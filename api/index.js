const config = require('./config')

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

pgClient.on('error', () => console.log('Lost Postgres connection'))
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err))

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
    if (err) throw new Error(`Exception creating broker instance: ${err.message}`)
    rabbitClient = _rabbitClient
})

//Express route handlers
app.get('/', (req, res) => {
    res.send('API Running...')
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows)
})

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values)
    })
})

app.post('/values', async (req, res) => {
    const index = parseInt(req.body.index)

    if (!(Number.isInteger(index)) || (index > 55)) {
        console.warn(`Index ${index} is too high`)
        return res.status(422).send('Index too high')
    }

    redisClient.hset('values', index, 'NaN')

    rabbitClient.publish('worker_pub', index, (err, pub) => {
        if (err) throw new Error(`Exception while publishing: ${err.message}`)
        pub.on('error', (err) => {
            console.error(`Error while publishing messages: ${err.message}`)
        })
    })
    console.log(`Published index ${index}`)

    pgClient.query('INSERT INTO values(number) VALUES($1)', [index])

    res.send({working: true})
})

//Express instantiation
app.listen(5000, err => {
    console.log('API listening...')
})
