
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
const decodeToken = (token) => {
    try {
        
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, error: err.message };
    }
};
const decodeRefreshToken = (token) => {
    try {
        
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, error: err.message };
    }
};

module.exports = { info, error, success ,decodeToken,decodeRefreshToken}