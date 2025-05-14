export const addCustomer = async (_req, _res) => {
    const body = _req.body
    return _res.json({ name: "Event Service Call" })
}
// module.exports = { addCustomer }