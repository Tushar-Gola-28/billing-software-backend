const cors = require("cors")

const configureCors = () => {
    return cors({
        origin: (origin, callback) => {
            const allowOrigin = ["https://localhost:3001","http://localhost:3001"]
            console.log(allowOrigin.includes(origin), origin);

            if (!origin || allowOrigin.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error("Not Allowed by cors"))
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept-Version"
        ],
        exposedHeaders: [
            'Content-Range', 'X-Content-Range'
        ],
        credentials: true,  //enable support for cookies
        optionsSuccessStatus: 200
    })
}

module.exports = { configureCors }