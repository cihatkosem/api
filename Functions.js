const { Client, Intents, UserFlags } = require("discord.js"),
    client = new Client({
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
    }),
    app = require('express')(),
    rateLimit = require('express-rate-limit'),
    apiLimit = rateLimit({ windowMs: 10 * 1000, max: 1, message: { status: "API limit exceeded" } })

const config = require('./config.json')
const mongoose = require('mongoose')
const Models = require("./Models")
const needle = require('needle')
const googleTraslate = require('translate-google')

require('dayjs/locale/tr')
require("dayjs").extend(require('dayjs/plugin/timezone'))
require("dayjs").extend(require('dayjs/plugin/utc'))
require("dayjs").locale('tr')
let hostURL = process.env.TOKEN ? "http://api.drizzlydeveloper.xyz/" : "http://localhost:8881/"
let Find, discord_badges, LocalTime, pages, translate, array = {}

module.exports.Connection = async function Connection() {
    let server = require('http').createServer(app)
    function ConnectionStatus(Status, Detail) { this.Status = Status, this.Detail = Detail }
    mongoose.connect(process.env.MONGOURL || config.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            let mongoHost = mongoose.connections[0].host.substring(0, mongoose.connections[0].host.search("-shard"))
            array.mongodb = new ConnectionStatus("Connected", `Server: ${mongoHost}/${mongoose.connections[0].name}`)
        }).catch(() => array.mongodb = new ConnectionStatus("Not Connected", "Server: -"))

    client.login(process.env.TOKEN || config.token)
        .then(() => array.discord = new ConnectionStatus("Connected", `Bot Name: ${client.user.username}`))
        .catch(() => array.discord = new ConnectionStatus("Unknown", "Unknown"))

    server.listen(process.env.PORT || 8881, async function (err) {
        if (err) array.website = new ConnectionStatus("Not Connected", `Host: unknown - Port: unknown`)
        array.website = new ConnectionStatus("Connected", `Host: ${hostURL}`)
    })

    setTimeout(async () => console.table(array), 10000)
}

module.exports.pages = pages = {
    function: async function func(app) {
        let api = require("./Api.js")

        app.get("/", (req, res) => res.redirect("http://drizzlydeveloper.xyz/"))
        app.get("/drizzly/users/:name", apiLimit, api.drizzly.user)
        app.get("/drizzly/users/:name&:token", apiLimit, api.drizzly.user)
        app.get("/discord/users/:id", apiLimit, api.discord)
        app.get("/twitter/users/:name", apiLimit, api.twitter)
        app.get("/weather/:location", apiLimit, api.weather)

        app.use(api.error)
    }
}

module.exports.day = LocalTime = async function Day(date, time, time_data, userCreatedAt) {
    let module = require("dayjs"), data, f1 = "DD MMMM YYYY HH.mm.ss", f2 = "DD MMMM YYYY", f3 = "HH.mm.ss"
    let day = time_data ? module(time_data).tz('Asia/Istanbul') : module().tz('Asia/Istanbul')
    if (date == true && time == true) data = day.format(f1)
    if (date == true && time !== true) data = day.format(f2)
    if (date !== true && time == true) data = day.format(f3)
    else data = day.format(f1)
    return new Promise((resolve) => resolve(userCreatedAt && time_data == undefined ? null : data))
}

module.exports.user = userFunction = {
    avatar: async function Avatar(username) {
        return new Promise(async (resolve) => {
            if (!username) return resolve(null)
            let user = await Models.user.findOne({ displayname: username.toLowerCase() })
            if (!user) return resolve(null)
            let DCuser = user.social && user.social.discord ? await Find.discord.user.info(user.social.discord) : null
            let TWuser = user.social && user.social.twitter ? await Find.twitter.user(user.social.twitter) : null
            let TWavatar = TWuser ? TWuser.avatar ? TWuser.avatar : null : null
            let DCavatar = DCuser ? DCuser.avatarURL ? DCuser.avatarURL : null : null
            let avatar = TWavatar ? TWavatar : DCavatar ? DCavatar : "https://img.icons8.com/windows/512/ffffff/test-account.png"
            return resolve(avatar)
        })
    },
    banner: async function Banner(username) {
        return new Promise(async (resolve) => {
            if (!username) return resolve(null)
            let user = await Models.user.findOne({ displayname: username.toLowerCase() })
            if (!user) return resolve(null)
            let DCuser = user.social && user.social.discord ? await Find.discord.user.info(user.social.discord) : null
            let TWuser = user.social && user.social.twitter ? await Find.twitter.user(user.social.twitter) : null
            let TWbanner = TWuser ? TWuser.banner ? TWuser.banner : null : null
            let DCbanner = DCuser ? DCuser.bannerURL ? DCuser.bannerURL : null : null
            let banner = TWbanner ? TWbanner : DCbanner
            return resolve(banner)
        })
    }
}

module.exports.translate = translate = async function Translate(toLang, text) {
    return new Promise(async (resolve) => {
        resolve(toLang && text ? googleTraslate(text, { to: toLang }).then((res) => res).catch((err) => err) : null)
    })
}

module.exports.token = token = {
    create: async function Token_create(id, token) {
        await Models.functions.verification.save(id, token)
    },
    delete: async function Token_delete(id) {
        await Models.functions.verification.delete(id)
    }
}

module.exports.visitcounterpost = async function VisitCounterPost(data) {
    if (data) { data.visits++; data.save() }
}

module.exports.Find = Find = {
    discord: {
        user: {
            info: async function FindDiscordUser(id) {
                return new Promise(async (resolve) => {
                    const { REST } = require('@discordjs/rest'), { Routes } = require('discord-api-types/v10')
                    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN || config.token)
                    const user = await rest.get(Routes.user(id)).catch((err) => { return resolve(null) })
                    if (!user) return resolve(null)
                    const userFlags = new UserFlags(user.public_flags)
                    const userFlagsArray = userFlags.toArray()
                    const flags = userFlagsArray.filter(b => !!discord_badges[b]).map(m => discord_badges[m])
                    if (user.avatar && user.avatar.startsWith("a_")) flags.push(discord_badges["DISCORD_NITRO"])
                    let discordURL = "https://cdn.discordapp.com"
                    let avatarURL = user.avatar ? `${discordURL}/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=4096` : null
                    let bannerURL = user.banner ? `${discordURL}/banners/${user.id}/${user.banner}.${user.banner.startsWith("a_") ? "gif" : "png"}?size=4096` : null
                    let userInfo = {
                        id: user.id,
                        username: user.username,
                        discriminator: user.discriminator,
                        createdAt: await LocalTime(true, true, user.createdAt, true),
                        bot: user.bot && userFlagsArray.includes("VERIFIED_BOT") ? "verified" : user.bot ? "yes" : "no",
                        avatarURL,
                        bannerURL,
                        bannerColor: user.banner_color,
                        accentColor: user.accent_color,
                        flags
                    }
                    let data = userInfo.rawError ? userInfo.rawError.message == "Unknown User" ? null : userInfo : userInfo
                    return resolve(data)
                })
            },
            activities: async function activities(id) {
                return new Promise(async (resolve) => {
                    //bir problem oluştu şimdilik yapmadım.
                    return resolve(null)
                })
            },
        }
    },
    twitter: {
        user: async function TwitterSearch(name) {
            return new Promise(async (resolve) => {
                let headers = { "User-Agent": "v2UserLookupJS", "authorization": `Bearer ${process.env.TWITTERTOKEN || config.twitter_token}` }
                let api = await needle('get', `https://api.twitter.com/1.1/users/show.json?screen_name=${name}`, { headers })
                if (api.body.errors || !api.body.id) return resolve(null)
                let data = {
                    id: api.body.id,
                    name: api.body.name,
                    _name: api.body.screen_name,
                    description: {
                        original: api.body.description ? api.body.description : null,
                        en: api.body.description ? await translate('en', api.body.description) : null,
                        tr: api.body.description ? await translate('tr', api.body.description) : null
                    },
                    created_date: await LocalTime(true, true, api.body.created_at),
                    verified: api.body.verified,
                    location: api.body.location ? api.body.location : null,
                    _location: api.body.profile_location,
                    tweets: api.body.statuses_count,
                    followers: api.body.followers_count,
                    followed: api.body.friends_count,
                    url: api.body.url,
                    avatar: api.body.profile_image_url ? api.body.profile_image_url.substring(0, api.body.profile_image_url.search("_normal")) + ".jpg" : null,
                    banner: api.body.profile_banner_url ? api.body.profile_banner_url + "/1500x500" : null
                }
                resolve(data)
            })
        }
    },
    weather: async function Weather(search) {
        return new Promise(async (resolve) => {
            let module = require('weather-js')
            module.find({ search, degreeType: "C" }, async function (err, result) {
                if (err) return resolve(err)
                if (!search || !result[0]) return resolve(null)
                let data = {
                    en: {
                        name: result[0].location.name,
                        degreetype: "C",
                        current: {
                            day: result[0].current.day,
                            observationtime: result[0].current.observationtime,
                            date: await translate('en', await LocalTime(true, null, result[0].current.date)),
                            skytext: result[0].current.skytext,
                            temperature: result[0].current.temperature + "°C",
                            feelslike: result[0].current.feelslike + "°C",
                            humidity: "%" + result[0].current.humidity,
                        }
                    },
                    tr: {
                        name: await translate('tr', result[0].location.name),
                        degreetype: "C",
                        current: {
                            day: await translate('tr', result[0].current.day),
                            observationtime: result[0].current.observationtime,
                            date: await LocalTime(true, null, result[0].current.date),
                            skytext: await translate('tr', result[0].current.skytext),
                            temperature: result[0].current.temperature + "°C",
                            feelslike: result[0].current.feelslike + "°C",
                            humidity: "%" + result[0].current.humidity,
                        }
                    }
                }
                return resolve(data)
            })
        })
    }
}

module.exports.ip = {
    check: async function ipcheck(ip) {
        return new Promise(async (resolve) => {
            let users = await Models.user.find()
            let ips = users.map(m => m.logins[0].ip).filter(f => f == ip)
            return resolve(ips.length)
        })
    }
}


module.exports.statement = async function statement() {
    return new Promise(async (resolve) => {
        return resolve(require('./statement')[Math.floor(Math.random() * require('./statement').length)])
    })
}

module.exports.discord_badges = discord_badges = {
    DISCORD_CERTIFIED_MODERATOR: {
        name: "Discord Certified Moderator",
        url: `${hostURL}img/DISCORD_CERTIFIED_MODERATOR.png`
    },
    BUGHUNTER_LEVEL_1: {
        name: "Discord Bug Hunter",
        url: `${hostURL}img/BUGHUNTER_LEVEL_1.png`
    },
    BUGHUNTER_LEVEL_2: {
        name: "Discord Bug Hunter",
        url: `${hostURL}img/BUGHUNTER_LEVEL_2.png`
    },
    DISCORD_EMPLOYEE: {
        name: "Discord Staff",
        url: `${hostURL}img/DISCORD_EMPLOYEE.png`
    },
    DISCORD_NITRO: {
        name: "Discord Nitro",
        url: `${hostURL}img/DISCORD_NITRO.png`
    },
    PARTNERED_SERVER_OWNER: {
        name: "Partnered Server Owner",
        url: `${hostURL}img/PARTNERED_SERVER_OWNER.png`
    },
    EARLY_SUPPORTER: {
        name: "Early Supporter",
        url: `${hostURL}img/EARLY_SUPPORTER.png`
    },
    HOUSE_BALANCE: {
        name: "HypeSquad Balance",
        url: `${hostURL}img/HOUSE_BALANCE.png`
    },
    HOUSE_BRAVERY: {
        name: "HypeSquad Bravery",
        url: `${hostURL}img/HOUSE_BRAVERY.png`
    },
    HOUSE_BRILLIANCE: {
        name: "HypeSquad Brilliance",
        url: `${hostURL}img/HOUSE_BRILLIANCE.png`
    },
    HYPESQUAD_EVENTS: {
        name: "HypeSquad Events",
        url: `${hostURL}img/HYPESQUAD_EVENTS.png`
    },
    EARLY_VERIFIED_BOT_DEVELOPER: {
        name: "Early Verified Bot Developer",
        url: `${hostURL}img/EARLY_VERIFIED_BOT_DEVELOPER.png`
    },
    ADMIN: {
        name: "FindUser ADMINISTRATOR",
        url: `${hostURL}img/ADMIN.png`
    }
};