const { rateLimit } = require("express-rate-limit")

const createBaseRateLimit = (time, limit) => {
    return rateLimit({
        windowMs: time, // time
        limit: limit, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
        message: "Too many request, please try again  later",
        standardHeaders: true, // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
        // store: ... , // Redis, Memcached, etc. See below.
    })
}

module.exports = { createBaseRateLimit }