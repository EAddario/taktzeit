module.exports = {
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
                        heartbeat: 900
                    },
                    socketOptions: {
                        timeout: 1800
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
                        queue: "worker_queue",
                        "prefetch": 1,
                        options: {
                            noAck: false
                        }
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
