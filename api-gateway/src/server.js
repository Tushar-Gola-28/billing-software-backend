const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const express = require("express")
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware")
const { createBaseRateLimit } = require("./middleware/rate-limit")
const { configureCors } = require("./config/corsConfig")
const { globalErrorhandler } = require("./middleware/error-handler")
const app = express()
const { connectDb } = require("./config/db/config")
const { featureRoute } = require("./routes/features.routes")
const { versionRoute } = require("./routes/version.routes")
const proxy = require('express-http-proxy');
const { getVersionsByCode } = require("./helpers/collection-functions")
const { redisCall, baseRedisClient } = require("./cache/redis")
const { VersionModal } = require("./schemas/version")
const { checkInstance } = require("./helpers/check-intance")
const { verifyToken } = require("./middleware/tokenVerify")
const axios = require("axios")
const cookieParser = require('cookie-parser')

const PORT = process.env.PORT
app.use(requestLogger)
app.use(addTimeStamp)
app.use(createBaseRateLimit(1 * 60 * 1000, 100))
app.use(express.json())
app.use(configureCors())
app.use(cookieParser())
app.use('/service/:service/:version', verifyToken, async (req, res, next) => {
    const { service, version } = req.params;
    const svcConfig = await getVersionsByCode(service, version);
    if (!svcConfig) {
        return res.status(404).json({ error: 'Feature or version not found' });
    }
    next();
});

const serviceMap = {
    customer_service: process.env.CUSTOMER_SERVICE_URL,
    event_service: process.env.EVENT_SERVICE_URL,
}
app.use('/service', (req, res, next) => {

    const suffix = req.originalUrl.replace(/^\/service/, '').split("/")
    const feature = suffix[1]
    return proxy(serviceMap[feature], {
        proxyReqPathResolver: req => {
            const suffix = req.originalUrl.replace(/^\/service/, '').split("/")
            const feature = suffix[1]
            const version = suffix[2]
            const prefix = `/service/${feature}/${version}`
            const path = req.originalUrl.replace(prefix, '')
            return path
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            if (srcReq.user) {
                proxyReqOpts.headers['user'] = srcReq.user;
                proxyReqOpts.headers['plan_id'] = srcReq.plan_id;
                proxyReqOpts.headers['type'] = srcReq.type;
                proxyReqOpts.headers['role'] = srcReq.role;
                proxyReqOpts.headers['parent'] = srcReq.parent;
            }
            return proxyReqOpts;
        },
        limit: '50mb',
        proxyErrorHandler: function (err, res, next) {
            next(new Error(err));
        }
    })(req, res, next)
})
app.use('/gateway', [featureRoute, versionRoute])
app.get('/gateway/health', checkInstance);
app.use(globalErrorhandler)

const storeVersionInRedis = async () => {
    const getAllData = await VersionModal.find()
    baseRedisClient.set("versions", JSON.stringify(getAllData))
    const allPlans = await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/no-auth/plans`)
    if (allPlans && allPlans.data && allPlans.data._payload) {
        baseRedisClient.set("plans-list", JSON.stringify(allPlans.data._payload))
    }

    //  { EX: 3600 }  
}
async function start() {
    await connectDb();
    await redisCall();
    await storeVersionInRedis();         // now safe: Mongo + Redis are up
    app.listen(PORT, () => {
        console.log(`API Gateway listening on http://localhost:${PORT}`);
    });

}
start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});