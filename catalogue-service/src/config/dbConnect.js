const mongoose = require("mongoose")
const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Db connection successfully with this" + " " + process.env.MONGO_URL);

    } catch (err) {
        console.log(err);
        throw new Error(err)
    }
}


module.exports = { dbConnect }