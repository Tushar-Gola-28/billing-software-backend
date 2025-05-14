const axios = require("axios")
const { decodeToken, error, decodeRefreshToken } = require("../functions/functions");
const verifyToken = async (req, res, next) => {
    try {
        if (!req.originalUrl.includes("no-auth")) {
            // if (!req.headers["authorization"]) {
            //     return res.status(401).json(error(401, "Unauthorized: Missing Authorization header"));
            // }
            let token;
            let decodeTkn
            if (req.headers["authorization"]) {
                token = req.headers["authorization"].split(" ")[1]
                decodeTkn = decodeToken(token)

            }
            if (!token && req.cookies.refresh_token) {
                token = req.cookies.refresh_token
                decodeTkn = decodeRefreshToken(token)
            }

            if (!token) {
                return res.status(401).json(error(401, "Unauthorized: No token provided"))
            }

            if (!decodeTkn.valid) {
                return res.status(400).json(error("Token is expired."))
            }
            if (!decodeTkn.payload.id) {
                return res.status(400).json(error("Invalid token"))
            }

            await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/no-auth/verify/${decodeTkn.payload.id}`)
            req.user = decodeTkn.payload.id;
            req.role = decodeTkn.payload.role;
            req.type = decodeTkn.payload.type;
            req.plan_id = decodeTkn.payload.plan_id;
            req.parent = decodeTkn.payload.parent || decodeTkn.payload.id;

        }
        next()
    } catch (err) {
        console.log(err);
        return res.status(400).json(error(400, err.message));
    }
}

module.exports = { verifyToken }