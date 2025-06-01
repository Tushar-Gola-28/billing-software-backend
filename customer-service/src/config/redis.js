const dotenv = require("dotenv")
const redis = require("redis")
const envFile = `.env.${process.env.NODE_ENV || "prod"}`;
// dotenv.config({ path: envFile });
dotenv.config({ path: envFile });


console.log("redis port-->", `redis://${process.env.REDIS_BASE_URL}:${process.env.REDIS_PORT}`);


const baseRedisClient = redis.createClient({
    url: `redis://${process.env.REDIS_BASE_URL}:${process.env.REDIS_PORT}`
});

const redisCall = async () => {
    await baseRedisClient.connect();
    console.log("✅ Connected to Redis on", process.env.REDIS_BASE_URL, "port", process.env.REDIS_PORT);
}

baseRedisClient.on("error", (err) => {
    console.log("Error occured while establishing redis connection");
    console.error(err);
});

module.exports = { redisCall, baseRedisClient }

