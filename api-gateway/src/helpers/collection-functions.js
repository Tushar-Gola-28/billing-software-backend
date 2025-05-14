const { baseRedisClient } = require("../cache/redis")
const { VersionModal } = require("../schemas/version")

const getVersionsByCode = async (feature, version) => {
    let findVersion = await baseRedisClient.get("versions")
    let parseData = findVersion ? JSON.parse(findVersion) : ""
    let versionData
    if (!parseData) {        
        versionData = await VersionModal.findOne({ code: version, featureName: feature })
        console.log(versionData,"Db Data");
        
    } else {
        console.log(versionData,"Redis Data");
        versionData = parseData.find((it) => it.code == version && it.featureName == feature)
    }
    
    if (!versionData) {
        throw new Error(`Feature ${feature} version ${version} was not found.`)
    }
    return versionData
}
module.exports = { getVersionsByCode }