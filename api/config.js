module.exports = {
    Postgres: {
        Database: process.env.POSTGRES_DATABASE,
        Host: process.env.POSTGRES_HOST,
        Port: process.env.POSTGRES_PORT,
        User: process.env.POSTGRES_USER,
        Password: process.env.POSTGRES_PASSWORD
    },
    RabbitMQ: {
        vhosts: {
            "/": {
                connection: {
                    protocol: "amqp",
                    hostname: process.env.RABBITMQ_HOST,
                    port: process.env.RABBITMQ_PORT,
                    user: process.env.RABBITMQ_USER,
                    password: process.env.RABBITMQ_PASSWORD,
                    options: {
                        heartbeat: 60
                    },
                    socketOptions: {
                        timeout: 600
                    },
                    retry: {
                        min: 1000,
                        max: 300000,
                        factor: 2,
                        strategy: "exponential"
                    }
                },
                exchanges: ["worker_exchange"],
                queues: ["worker_queue"],
                bindings: ["worker_exchange[a.b.c] -> worker_queue"],
                publications: {
                    worker_pub: {
                        exchange: "worker_exchange",
                        routingKey: "a.b.c",
                        options: {
                            persistent: false
                        }
                    }
                },
                subscriptions: {
                    worker_sub: {
                        queue: "worker_queue"
                    }
                }
            }
        }
    },
    Redis: {
        Host: process.env.REDIS_HOST,
        Port: process.env.REDIS_PORT
    }
};
