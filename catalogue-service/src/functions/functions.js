
function success(data, message) {
    return {
        _payload: data,
        type: "success",
        message
    };
}
function success_with_page(data, total_records, page, limit, totalPages, message) {
    return {
        _payload: data,
        type: "success",
        message,
        page,
        totalPages,
        limit,
        total_records

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
const handleConverter = (name) => {
    if (typeof name != "string") {
        throw new Error("Name should be string.")
    }
    const convert = name.toLowerCase().split(" ").join("-")
    return convert
}
module.exports = { info, error, success, handleConverter, success_with_page }