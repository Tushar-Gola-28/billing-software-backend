const { success, error, generateRefreshToken, generateToken } = require("../../functions/functions")
const { UserModal } = require("../../schemas/user")
const { CustomerPlanModal } = require("../../schemas/customer-plan")
const bcrypt = require("bcryptjs");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const { PlanModal } = require("../../schemas/plan");
const { baseRedisClient } = require("../../config/redis");
const createVendor = async (_req, _res) => {
    const { name, email, mobile, countryCode, password, plan_id, payment_status } = _req.body
    if (!plan_id) {
        return _res.status(400).json(error(400, "Plan id is required."))
    }
    const existUser = await UserModal.findOne({
        $or: [{ mobile }, { email }]
    });
    if (existUser) {
        return _res.status(400).json(error(400, "This user already exist."))
    }
    // ***************Encryption of the password***********

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ****************Encryption of the password Ended***************

    // ***************Creating User*************

    const createUser = new UserModal({
        name,
        email,
        mobile,
        countryCode,
        password: hashedPassword,
        loginCount: 1,
        role: "admin"
    })
    await createUser.save()

    // ***************Creation User Ended*************

    const findPlan = await PlanModal.findOne({ _id: plan_id })
    const convertDate = moment(new Date())
        .add(findPlan.joining_till, findPlan.joining_till_type)
        .hour(23)
        .minute(59)
        .second(59)
        .millisecond(59)

    const createPlan = new CustomerPlanModal({
        customer_id: new mongoose.Types.ObjectId(createUser._id),
        plan_id: new mongoose.Types.ObjectId(plan_id),
        payment_status: payment_status,
        expire: convertDate
    })
    await createPlan.save()

    const payload = { id: createUser._id, mobile: createUser.mobile, email: createUser?.email, plan_id, role: createUser.role, type: createUser.type, parent: createUser.parent, amount_paid: findPlan.price, previous_plan_amount_remove: 0 };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const sessionKey = `sessions:${email}`;
    const MAX_SESSIONS = 5;

    let sessions = await baseRedisClient.lRange(sessionKey, 0, -1);

    // Remove excess sessions from Redis and decrement loginCount
    if (sessions.length >= MAX_SESSIONS) {
        const excessCount = sessions.length - MAX_SESSIONS + 1;
        for (let i = 0; i < excessCount; i++) {
            const removedSession = await baseRedisClient.rPop(sessionKey);
            console.log(`Removed session: ${removedSession}`);

            // Decrement login count in DB for removed session
            await UserModal.findByIdAndUpdate(existUser._id, { $inc: { loginCount: -1 } });
        }
    }

    // Add new session to Redis
    await baseRedisClient.lPush(sessionKey, JSON.stringify({ accessToken, refreshToken, createdAt: Date.now() }));
    await baseRedisClient.expire(sessionKey, 15 * 24 * 60 * 60); // Optional: 7 days TTL
    _res.cookie('access_token', accessToken, {
        httpOnly: true,  // Prevent JavaScript from accessing this cookie
        secure: process.env.NODE_ENV === 'production',  // Only send cookies over HTTPS in production
        maxAge: 60 * 60 * 1000,  // 1 hour expiration
        path: '/',  // Available for the entire app
    });

    _res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    _res.cookie('user', createUser, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    _res.cookie('plan', createPlan, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    return _res.json(success({ createUser, accessToken, refreshToken, createPlan }))
}
const addVendorCustomer = async (_req, _res) => {
    const { name, email, mobile, countryCode } = _req.body
    const vendor = _req.headers["vendor"]
    const existUser = await UserModal.findOne({ mobile, email })
    if (existUser) {
        return _res.status(400).json(error(400, "This user already exist."))
    }
    const create = await UserModal.create({ mobile, email, name, countryCode, type: "customer", parent: vendor || null })
    return _res.json(success(create))
}
const verifyUserById = async (_req, _res) => {
    const { id: _id } = _req.params
    const existUser = await UserModal.findOne({ _id }, { password: 0, loginCount: 0, type: 0, inActiveReason: 0, createdAt: 0, updatedAt: 0, role: 0, parent: 0 })
    if (!existUser) {
        return _res.status(400).json(error(400, "Not Exist"))
    }
    return _res.json(success({ existUser }))
}
const suggestUserOnlyCustomer = async (_req, _res) => {
    const { mobile } = _req.body || {}
    const vendor = _req.headers["parent"]
    if (!mobile) {
        return _res.status(400).json(error(400, "Mobile number is required."))
    }
    const existUser = await UserModal.findOne({ parent: vendor, mobile, }, { password: 0 })
    if (!existUser) {
        return _res.status(400).json(error(400, "Not Exist"))
    }
    return _res.json(success({ existUser }))
}
const loginUser = async (_req, _res) => {
    const { email, password } = _req.body;
    console.log(email);


    const existUser = await UserModal.findOne({ email });
    if (!existUser) {
        return _res.status(400).json(error(400, "Please check your credential."));
    }

    const isMatch = await bcrypt.compare(password, existUser.password);
    if (!isMatch) {
        return _res.status(400).json(error(400, "Invalid password."));
    }

    // // Check login limit
    // if (existUser.loginCount >= 5) {
    //     return _res.status(400).json(error(400, "Oops! You've reached the limit of 5 devices. Please log out from another device to continue."));
    // }

    // Generate tokens
    const planDetails = await CustomerPlanModal.findOne({ customer_id: existUser._id, status: true });
    const payload = { id: existUser._id, mobile: existUser.mobile, plan_id: planDetails?.plan_id, email: existUser?.email, role: existUser.role, type: existUser.type, parent: existUser.parent };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const sessionKey = `sessions:${email}`;
    const MAX_SESSIONS = 5;

    let sessions = await baseRedisClient.lRange(sessionKey, 0, -1);

    // Remove excess sessions from Redis and decrement loginCount
    if (sessions.length >= MAX_SESSIONS) {
        const excessCount = sessions.length - MAX_SESSIONS + 1;
        for (let i = 0; i < excessCount; i++) {
            const removedSession = await baseRedisClient.rPop(sessionKey);
            console.log(`Removed session: ${removedSession}`);

            // Decrement login count in DB for removed session
            await UserModal.findByIdAndUpdate(existUser._id, { $inc: { loginCount: -1 } });
        }
    }

    // Add new session to Redis
    await baseRedisClient.lPush(sessionKey, JSON.stringify({ accessToken, refreshToken, createdAt: Date.now() }));
    await baseRedisClient.expire(sessionKey, 15 * 24 * 60 * 60); // Optional: 7 days TTL

    // Increment login count
    const updatedData = await UserModal.findByIdAndUpdate(existUser._id, { $inc: { loginCount: 1 } }, { new: true });

    // Set cookies
    _res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000,
        path: '/',
    });

    _res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    _res.cookie('user', updatedData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    _res.cookie('plan', planDetails, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    return _res.json(success({ user: updatedData, accessToken, refreshToken, planDetails }));
}

const refreshToken = async (_req, _res) => {
    const vendor = _req.headers["parent"]
    const existUser = await UserModal.findOne({ _id: vendor })


    const planDetails = await CustomerPlanModal.findOne({ customer_id: existUser._id, status: true })
    const payload = { id: existUser._id, mobile: existUser.mobile, plan_id: planDetails.plan_id, role: existUser.role, type: existUser.type, parent: existUser.parent };
    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);
    _res.cookie('access_token', accessToken, {
        httpOnly: true,  // Prevent JavaScript from accessing this cookie
        secure: process.env.NODE_ENV === 'production',  // Only send cookies over HTTPS in production
        maxAge: 60 * 60 * 1000,  // 1 hour expiration
        path: '/',  // Available for the entire app
    });

    _res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    _res.cookie('user', existUser, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    _res.cookie('plan', planDetails, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration
        path: '/',
    });
    return _res.json(success({ user: existUser, accessToken, refreshToken, planDetails }))
}
const logoutUser = async (_req, _res) => {
    const vendor = _req.headers["parent"]
    const accessToken = _req.headers["token"]
    if (!vendor) {
        return _res.status(400).json(error(400, "Vendor ID is missing in headers."))
    }

    const existUser = await UserModal.findByIdAndUpdate(vendor, { $inc: { loginCount: -1 } }, { new: true })
    if (!existUser) {
        return _res.status(400).json(error(400, "User not found."))
    }
    const sessionKey = `sessions:${existUser.email}`;
    const sessions = await baseRedisClient.lRange(sessionKey, 0, -1);
    const targetSession = sessions.find(s => {
        try {
            const parsed = JSON.parse(s);
            return parsed.accessToken === accessToken || parsed.refreshToken === accessToken;
        } catch {
            return false;
        }
    });

    if (targetSession) {
        await baseRedisClient.lRem(sessionKey, 1, targetSession);
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0), // Expire immediately
    };

    _res.clearCookie('access_token', options);
    _res.clearCookie('refresh_token', options);
    _res.clearCookie('user', options);
    _res.clearCookie('plan', options);
    return _res.json(success("Logged out successfully"))
}
const loginCountReduce = async (_req, _res) => {
    const vendor = _req.params?.user
    if (!vendor) {
        return _res.status(400).json(error(400, "Vendor ID is missing in params."))
    }

    const existUser = await UserModal.findByIdAndUpdate(vendor, { $inc: { loginCount: -1 } }, { new: true })
    if (!existUser) {
        return _res.status(400).json(error(400, "User not found."))
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires: new Date(0), // Expire immediately
    };

    _res.clearCookie('access_token', options);
    _res.clearCookie('refresh_token', options);
    _res.clearCookie('user', options);
    _res.clearCookie('plan', options);
    return _res.json(success("Logged out successfully"))
}
module.exports = { createVendor, loginCountReduce, loginUser, verifyUserById, suggestUserOnlyCustomer, addVendorCustomer, refreshToken, logoutUser }