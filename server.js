const app = require("express")()
const rateLimit = require("express-rate-limit")
const Functions = require("./Functions")
const cookie_session = { cookie: { secure: true, maxAge: 60000 }, secret: "~drizzlydeveloper", resave: false, saveUninitialized: true }
const message = { status: "Api limit exceeded", url: { url: null, args: null }, token: null, data: null }
let drizzlydeveloper = "drizzlydeveloper.xyz"

app.use(function api(req, res) { if(req.hostname !== drizzlydeveloper) rateLimit({ windowMs: 1000, max: 3, message }) })
app.use(require("body-parser").urlencoded({ extended: true }))
app.use(require("body-parser").json())
app.use(require("cookie-session")(cookie_session))

app.set("view engine", "ejs")
app.set("trust proxy", true)

Functions.pages.function()
Functions.Connection()
