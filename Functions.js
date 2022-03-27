const request = require('request')
require('dayjs/locale/tr')
require("dayjs").extend(require('dayjs/plugin/timezone'))
require("dayjs").extend(require('dayjs/plugin/utc'))
require("dayjs").locale('tr')
let hostURL = process.env.TOKEN ? "http://api.drizzlydeveloper.xyz/" : "http://localhost:8881/"
let Find, discord_badges, LocalTime, pages, visitcounter, translate, token, userFunction, array = {}

module.exports.Connection = async function Connection(mongoose, server, client, config) {
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
        app.get("/drizzly/users/:name", pageLimit.api, api.drizzly.user)
        app.get("/drizzly/users/:name&:token", pageLimit.api, api.drizzly.user)
        app.get("/discord/users/:id", pageLimit.api, api.discord)
        app.get("/twitter/users/:name", pageLimit.api, api.twitter)
        app.get("/weather/:location", pageLimit.api, api.weather)

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
    register: async function register(req, time, cryptr_pass, code, id) {
        let location = await axios.get(`http://ip-api.com/json/${req.ip == "::1" ? "95.10.239.76" : req.ip}`)
        new Models.user({
            id, displayname: req.body.username.toLowerCase(), username: req.body.username, creation_date: time,
            email: req.body.email, admin: false, verified: { status: false, code, try: 0 }, password: cryptr_pass
        }).save()
        req.session.user = req.body.username
        setTimeout(async () => {
            await Models.user.updateOne({ username: req.session.user }, {
                $push: {
                    logins: {
                        date: time,
                        ip: req.ip,
                        browser: req.headers["user-agent"],
                        location: location.data
                    }
                }
            }, { upsert: true }).catch(err => console.error())
        }, 2500)
    },
    set: {
        admin: async function SetAdmin(userid, next) {
            let userData = await Models.user.findOne({ id: userid })
            if (!userData) return next()
            userData.admin == "true" ? userData.admin = "false" : userData.admin = "true";
            userData.save();
        },
        firstadmin: async function SetAdmin(firstadmin, users) {
            if (firstadmin && !users.filter(f => f.admin == 'true')[0]) {
                user.admin = "true";
                user.save();
                return res.redirect("/panel")
            }
        },
        social: async function SetSocial(req, res, user, x) {
            let { about, twitter, website, instagram, github, discord } = req.body
            let { delete_about, delete_discord, delete_github, delete_instagram, delete_twitter, delete_website } = req.body
            let DCuser = user.social && user.social.discord ? await Find.discord.user.info(user.social.discord) : null
            let TWuser = user.social && user.social.twitter ? await Find.twitter.user(user.social.twitter) : null
            let actvts = await Find.discord.user.activities(user.social.discord)
            let DCbanner = DCuser ? DCuser.bannerURL ? DCuser.bannerURL : DCuser.bannerColor ? DCuser.bannerColor : null : null
            let DCavatar = DCuser ? DCuser.avatarURL ? DCuser.avatarURL : null : null

            if (x && x == "edit") {
                user.discord_activities = DCuser ? actvts ? actvts : null : null
                user.discord = DCuser ? DCuser : null
                user.banner = TWuser && TWuser.banner ? TWuser.banner : DCbanner ? DCbanner : null
                user.avatar = TWuser && TWuser.avatar ? TWuser.avatar : DCavatar ? DCavatar : null
                return await res.render("account/profileEdit", { user })
            }
            if (about || twitter || website || instagram || github || discord) {
                about ? user.social.about = about : twitter ? user.social.twitter = twitter : website ? user.social.website = website :
                    instagram ? user.social.instagram = instagram : github ? user.social.github = github : discord ? user.social.discord = discord :
                        console.log(`${req.session.user}, Sosyal bağlantılarını eklerken problem oluştu.`)
                await user.save()
                user.discord_activities = DCuser ? actvts ? actvts : null : null
                user.discord = DCuser ? DCuser : null
                user.banner = TWuser && TWuser.banner ? TWuser.banner : DCbanner ? DCbanner : null
                user.avatar = TWuser && TWuser.avatar ? TWuser.avatar : DCavatar ? DCavatar : null
                return await res.render("account/profileEdit", { user })
            }
            if (delete_about || delete_twitter || delete_website || delete_instagram || delete_github || delete_discord) {
                delete_about ? user.social.about = "" : delete_twitter ? user.social.twitter = "" : delete_website ? user.social.website = "" :
                    delete_instagram ? user.social.instagram = "" : delete_github ? user.social.github = "" : delete_discord ? user.social.discord = "" :
                        console.log(`${req.session.user}, Sosyal bağlantılarını silerken problem oluştu.`)
                await user.save()
                user.discord_activities = DCuser ? actvts ? actvts : null : null
                user.discord = DCuser ? DCuser : null
                user.banner = TWuser && TWuser.banner ? TWuser.banner : DCbanner ? DCbanner : null
                user.avatar = TWuser && TWuser.avatar ? TWuser.avatar : DCavatar ? DCavatar : null
                return await res.render("account/profileEdit", { user })
            }
        }
    },
    check: async function User(req, res) {
        if (!req.session.user) return res.redirect("/girisyap")
        let userData = await Models.user.findOne({ username: req.session.user })
        if (!userData) return res.redirect("/girisyap")
        if (userData.verified.status !== "true") {
            if (userData.verified.code == req.body.verified_code) {
                userData.verified.status = "true"
                userData.save()
                return res.redirect("/")
            } else {
                userData.verified.try++
                userData.save()
                if (userData.verified.try == "5") {
                    await user.deleteOne({ username: req.body.username })
                    req.session.user = null
                    await View(req.url)
                    return res.render("error", { message: Messages.verified_fifth_error, button: Messages.register_try_button, href: "/kayitol", dual_button: "" })
                } else {
                    return res.render("error", { message: Messages.verified_error, button: Messages.try_button, href: "/", dual_button: "" })
                }
            }
        }
    },
    delete: async function Delete(req, res, user, delete_verified_code, delete_yes) {
        if (!user) return res.render("error", { message: Messages.thereisnotuser, button: Messages.go_home, href: "/", dual_button: "", conf: "x" })
        if (user.verified.code !== delete_verified_code)
            return res.render("error", { message: Messages.verified_code_error, button: Messages.go_profile, href: req.url, dual_button: "", conf: "x" })
        if (delete_yes !== "evet")
            return res.render("error", { message: Messages.deletion_not_confirmed, button: Messages.go_profile, href: req.url, dual_button: "", conf: "x" })
        if (user.verified.code == delete_verified_code) {
            await visitcounter(req.url)
            req.session.user = null
            await Models.user.deleteOne({ id: user.id })
            return res.render("error", { message: Messages.deleted_account, button: Messages.go_home, href: "/", dual_button: "", conf: "x" })
        }
    },
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
            let DCuser = user.social && user.social.discord ? await Functions.Find.discord.user.info(user.social.discord) : null
            let TWuser = user.social && user.social.twitter ? await Functions.Find.twitter.user(user.social.twitter) : null
            let TWbanner = TWuser ? TWuser.banner ? TWuser.banner : null : null
            let DCbanner = DCuser ? DCuser.bannerURL ? DCuser.bannerURL : null : null
            let banner = TWbanner ? TWbanner : DCbanner
            return resolve(banner)
        })
    }
}

module.exports.translate = translate = async function Translate(toLang, text) {
    let module = require('translate-google')
    return new Promise(async (resolve) => {
        resolve(toLang && text ? module(text, { to: toLang }).then((res) => res).catch((err) => err) : null)
    })
}

module.exports.visitcounter = visitcounter = async function VisitCounter(page) {
    let AllViews = await Models.view.findOne({ page: "all" })
    let FindViews = page ? await Models.view.findOne({ page: page }) : null;
    if (AllViews) { AllViews.views++; AllViews.save() } else { Models.functions.view.save("all") }
    if (FindViews) { FindViews.views++; FindViews.save() } else { Models.functions.view.save(page) }
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
                    const userFlags = new djs.UserFlags(user.public_flags)
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
                let headers = { "User-Agent": "v2UserLookupJS", "authorization": `Bearer ${config.twitter_token}` }
                let api = await needle('get', `https://api.twitter.com/1.1/users/show.json?screen_name=${name}`, { headers })
                console.log(api)
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

module.exports.error = {
    bot: async function bot_error(file, error) {
        djs.ServerLogWebhook.send({
            embeds: [
                djs.Embed.setDescription(`Sistemde bir hata oluştu: \n\n\`\`\`${file}\`\`\`\n\`\`\`${JSON.stringify(error, null, 4)}\`\`\``)
            ]
        })
    }
}

module.exports.admin = {
    user: {
        settings: async function settings(user, admin, req, res) {
            let users = await Models.user.find(), post = req.body
            if (!user) return res.render("error", { message: Messages.thereisnotuser, button: Messages.go_panel, href: "/panel", dual_button: "", conf: "search" })
            if (post.accountdelete) return res.render("account/delete", { user, users, conf: "settings" })
            if (post.delete_yes == "evet") {
                await Models.user.deleteOne({ id: user.id })
                return res.redirect("/panel")
            }
            if (post.logins_data) return await res.render("account/logins_data", { user, users, conf: "settings", all: null })
            if (post.logins_data_all) return await res.render("account/logins_data", { user, users, conf: "settings", all: true })
            //if (post.roles_settings) return await res.render("account/roles_settings", { user, users, conf: "settings" })
            if (post.setadmin && post.setadmin !== config.founder && post.setadmin !== user.id) await Models.functions.user.set.admin(post.setadmin, next)
            let DCuser = user.social && user.social.discord ? await Find.discord.user.info(user.social.discord) : null
            let TWuser = user.social && user.social.twitter ? await Find.twitter.user(user.social.twitter) : null
            let actvts = DCuser ? await Find.discord.user.activities(DCuser.id) : null
            let DCbanner = DCuser ? DCuser.bannerURL ? DCuser.bannerURL : DCuser.bannerColor ? DCuser.bannerColor : null : null
            let DCavatar = DCuser ? DCuser.avatarURL ? DCuser.avatarURL : null : null

            user.discord_activities = DCuser ? actvts ? actvts : null : null
            user.discord = DCuser ? DCuser : null
            user.banner = TWuser && TWuser.banner ? TWuser.banner : DCbanner ? DCbanner : null
            user.avatar = TWuser && TWuser.avatar ? TWuser.avatar : DCavatar ? DCavatar : null
            return await res.render('account/profile', { user, users, conf: "settings", admin: admin ? admin.admin : "false" })
        }
    }
}

module.exports.search = {
    user: async function user(user, _user, req, res) {
        let jsondata = { user: { username: user.username, verified: user.verified.status, social: user.social } }
        let errdata = { message: Messages.thereisnotuser, button: Messages.go_back, href: req.url, dual_button: "", conf: "search" }

        if (req.url.slice(1, 4) == "api") return user ? res.json(jsondata) : res.json({ user: null })
        if (!user) return res.render("error", errdata)

        let DCuser = user.social && user.social.discord ? await Find.discord.user.info(user.social.discord) : null
        let TWuser = user.social && user.social.twitter ? await Find.twitter.user(user.social.twitter) : null
        let actvts = await Find.discord.user.activities(user.social.discord)
        let DCbanner = DCuser ? DCuser.bannerURL ? DCuser.bannerURL : DCuser.bannerColor ? DCuser.bannerColor : null : null
        let DCavatar = DCuser ? DCuser.avatarURL ? DCuser.avatarURL : null : null

        user.discord_activities = DCuser ? actvts ? actvts : null : null
        user.discord = DCuser ? DCuser : null
        user.banner = TWuser && TWuser.banner ? TWuser.banner : DCbanner ? DCbanner : null
        user.avatar = TWuser && TWuser.avatar ? TWuser.avatar : DCavatar ? DCavatar : null
        return await res.render('account/profile', { user, conf: "search", admin: _user ? _user.admin : "false" })
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