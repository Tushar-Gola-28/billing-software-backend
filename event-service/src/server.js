const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const express = require("express")
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware")
const { configureCors } = require("./config/corsConfig")
const { globalErrorhandler } = require("./middleware/error-handler")
const customerroute = require("./routes/v1/customer.route")
const app = express()
const PORT = process.env.PORT
app.use(requestLogger)
app.use(addTimeStamp)
app.use(express.json())
app.use(configureCors())
app.use(customerroute)
app.use(globalErrorhandler)
app.listen(PORT, () => {
    console.log(`Event service listening on http://localhost:${PORT} ${process.env.BASE_PATH}`);
})