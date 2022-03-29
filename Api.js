const Functions = require("./Functions")
const Models = require("./Models")

module.exports.drizzly = {
    user: async function apifunc1(req, res, next) {
        let user = req.params.name ? await Models.user.findOne({ displayname: req.params.name.toLowerCase() }) : null
        if (user) {
            user.avatar = user ? await Functions.user.avatar(user.username) : null
            user.banner = user ? await Functions.user.banner(user.username) : null
        }
        let gUser = user ? {
            username: user.username, social: user.social, verified: user.verified.status, admin: user.admin,
            shortURL: `http://drizzlydeveloper.xyz/@${user.displayname}`, avatar: user.avatar, banner: user.banner
        } : null
        let token = req.params.token ? await Models.verification.findOne({ verification: req.params.token }) : null
        let data = {
            status: "OK",
            url: {
                url: req.url,
                args: req.params.name ? req.params.name : "not written",
            },
            token: req.params.token ? { get: req.params.token, status: token.current == "true" ? "authorized" : "expired" } : "not written",
            data: token && token.current == "true" ? user : gUser
        }
        return res.json(data)
    },
    users: async function apifunc11(req, res, next) {
        let users = await Models.user.find()
        let token = req.params.token ? await Models.verification.findOne({ verification: req.params.token }) : null
        let data = {
            status: "OK",
            url: req.url,
            token: req.params.token ? { get: req.params.token, status: token.current == "true" ? "authorized" : "expired" } : "not written",
            data: token ? token.current == "true" ? users : "expired" : "not written"
        }
        return res.json(data)
    }
}
module.exports.discord = async function apifunc2(req, res, next) {
    let user = req.params.id ? isNaN(req.params.id) !== true ? await Functions.Find.discord.user.info(req.params.id) : null : null
    let token = req.params.token ? await Models.verification.findOne({ verification: req.params.token }) : null
    let data = {
        status: "OK",
        url: {
            url: req.url,
            args: req.params.id ? req.params.id : "not written",
        },
        token: req.params.token ? { get: req.params.token, status: token.current == "true" ? "authorized" : "expired" } : "not written",
        data: user
    }
    return res.json(data)
}
module.exports.twitter = async function apifunc3(req, res, next) {
    let user = req.params.name ? await Functions.Find.twitter.user(req.params.name) : null
    let token = req.params.token ? await Models.verification.findOne({ verification: req.params.token }) : null
    let data = {
        status: "OK",
        url: {
            url: req.url,
            args: req.params.name ? req.params.name : "not written",
        },
        token: req.params.token ? { get: req.params.token, status: token.current == "true" ? "authorized" : "expired" } : "not written",
        data: user
    }
    return res.json(data)
}
module.exports.weather = async function apifunc4(req, res, next) {
    let status = req.params.location ? await Functions.Find.weather(req.params.location) : null
    let token = req.params.token ? await Models.verification.findOne({ verification: req.params.token }) : null
    let data = {
        status: "OK",
        url: {
            url: req.url,
            args: req.params.location ? req.params.location : "not written",
        },
        token: req.params.token ? { get: req.params.token, status: token.current == "true" ? "authorized" : "expired" } : "not written",
        data: status
    }
    return res.json(data)

}

module.exports.error = async function apifunc5(req, res, next) {
    let data = {
        status: "OK",
        url: {
            url: req.url,
            args: "not written",
        },
        token: "not written",
        data: null
    }
    return res.json(data)
}
