const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const express = require("express")
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware")
const { globalErrorhandler } = require("./middleware/error-handler")
const customerRoute = require("./routes/v1/customer.route")
const planRoute = require("./routes/v1/plan.route")
const { connectDb } = require("./config/db/config")
const app = express()
const PORT = process.env.PORT
app.use(requestLogger)
app.use(addTimeStamp)
app.use(express.json())
app.use(customerRoute)
app.use(planRoute)
app.use(globalErrorhandler)
app.listen(PORT, () => {
    console.log(`Customer service listening on http://localhost:${PORT} ${process.env.BASE_PATH}`);
})
connectDb()