class APIError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
        this.name = this.constructor.name || "APIError"
        Error.captureStackTrace(this, this.constructor);
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

const globalErrorhandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    const statusCode = err instanceof APIError ? err.statusCode : err.statusCode ? err.statusCode : 500;
    const message = err instanceof APIError ? err.message : err.message ? err.message : "Something went wrong";

    res.status(statusCode).json({
        status: "error",
        name:err.name,
        statusCode,
        message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
}

module.exports = { globalErrorhandler, asyncHandler }