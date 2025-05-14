const { default: mongoose } = require("mongoose");
const { baseRedisClient } = require("../cache/redis");

const checkInstance = async (req, res) => {
    // 1. Check MongoDB
    const mongoState = mongoose.connection.readyState === 1 ? 'up' : 'down';

    // 2. Check Redis
    let redisState = 'down';
    try {
        const pong = await baseRedisClient.ping();
        if (pong === 'PONG') redisState = 'up';
    } catch (err) {
        redisState = 'down';
    }

    // 3. Decide overall status
    const allUp = mongoState === 'up' && redisState === 'up';
    res.status(allUp ? 200 : 500)
        .json({
            status: allUp ? 'ok' : 'error',
            services: {
                mongodb: mongoState,
                redis: redisState
            }
        });
}

module.exports = { checkInstance }