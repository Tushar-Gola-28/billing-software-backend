const path = `.env.${process.env.NODE_ENV || 'development'}`
require("dotenv").config({ path })
const express = require("express")
const { requestLogger, addTimeStamp } = require("./middleware/customMiddleware")
const { globalErrorhandler } = require("./middleware/error-handler")
const { dbConnect } = require("./config/dbConnect")
const { categoryRoute } = require("./routes/v1/category.route")
const app = express()
const PORT = process.env.PORT
app.use(requestLogger)
app.use(addTimeStamp)
app.use(express.json())
app.use(categoryRoute)
app.use(globalErrorhandler)
app.listen(PORT, () => {
    console.log(`Event service listening on http://localhost:${PORT} ${process.env.BASE_PATH}`);
})
dbConnect()