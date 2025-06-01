const axios = require("axios")
const { decodeToken, error, decodeRefreshToken } = require("../functions/functions");
const { baseRedisClient } = require("../cache/redis");
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
                // console.log(token);

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
            // ✅ Redis session check
            const email = decodeTkn.payload.email;
            const sessionKey = `sessions:${email}`;
            const sessions = await baseRedisClient.lRange(sessionKey, 0, -1);

            const isValidSession = sessions.find((sessionStr) => {
                try {
                    const session = JSON.parse(sessionStr);
                    return session.accessToken == token || session.refreshToken == token;
                } catch {
                    return false;
                }
            });

            if (!isValidSession && !req.originalUrl.includes("logout")) {
                return res.status(440).json(error(440, "Session expired or logged out from server."));
            }

            await axios.get(`${process.env.CUSTOMER_SERVICE_URL}/no-auth/verify/${decodeTkn.payload.id}`)
            req.user = decodeTkn.payload.id;
            req.role = decodeTkn.payload.role;
            req.type = decodeTkn.payload.type;
            req.plan_id = decodeTkn.payload.plan_id;
            req.token = token;
            req.parent = decodeTkn.payload.parent || decodeTkn.payload.id;

        }
        next()
    } catch (err) {
        console.log(err);
        return res.status(400).json(error(400, err.message));
    }
}

module.exports = { verifyToken }