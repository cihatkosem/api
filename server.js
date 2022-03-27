const { Client, Intents, Collection, MessageEmbed, WebhookClient, UserFlags } = global.djs = require("discord.js"),
  client = global.client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
  }),
  app = require('express')(),
  rateLimit = require('express-rate-limit'),
  cryptr = require('cryptr'),
  pageLimit = global.pageLimit = {
    mongoConnect: rateLimit({ windowMs: 60000, max: 1 }),
    normal: rateLimit({ windowMs: 1000, max: 2, message: { status: "API limit exceeded" } }),
    api: rateLimit({ windowMs: 10 * 1000, max: 1, message: { status: "API limit exceeded" } })
  }

let config, mongoose, Functions, Models;
global.config = config = require('./config.json')
global.mongoose = mongoose = require('mongoose')
global.nodemailer = require('nodemailer')
global.randomstring = require("randomstring")
global.Messages = require("./Messages")
global.needle = require('needle')
global.delay = require('delay')
global.axios = require("axios")
global.Functions = Functions = require("./Functions")
global.Models = Models = require("./Models")

global.cryptr = new cryptr(config.secretKey)

app.use(pageLimit.normal)
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('body-parser').json())
app.use(require('express').static(require('path').join(__dirname, './views')))
app.use(require("cookie-session")({ cookie: { secure: true, maxAge: 60000 }, secret: "~drizzlydeveloper", resave: false, saveUninitialized: true }))

app.set('view engine', 'ejs')
app.set('trust proxy', true)
app.set('views', require('path').join(__dirname, './views/'))

client.commands = new Collection()
client.aliases = new Collection()
client.slashCommands = new Collection()
client.system = { BotBuilder: config.BotBuilder, UserRole: config.UserRole, UnRegisterRole: config.UnRegisterRole }

Functions.pages.function(app)
require("./Functions").Connection(mongoose, require('http').createServer(app), client, config)