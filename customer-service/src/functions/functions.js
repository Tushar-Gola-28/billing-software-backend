
const jwt = require("jsonwebtoken");
function success(data, message) {
    return {
        _payload: data,
        type: "success",
        message
    };
}

function error(statusCode, message, errors = []) {
    return {
        _payload_error: errors,
        message,
        statusCode,
        type: "error"
    };
}
function info(message, data = null) {
    return {
        _payload_error: data,
        message,
        type: "info"
    };
}

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
    });
}
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
    });
}

const handleConverter = (name) => {
    if (typeof name != "string") {
        throw new Error("Name should be string.")
    }
    const convert = name.toLowerCase().split(" ").join("-")
    return convert
}
module.exports = { info, error, success, generateToken, generateRefreshToken, handleConverter }