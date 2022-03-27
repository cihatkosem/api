const app = require("express")()
const rateLimit = require("express-rate-limit")
const Functions = require("./Functions")

app.use(
  rateLimit({
    windowMs: 1000,
    max: 2,
    message: { status: "API limit exceeded" },
  })
);
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(require("body-parser").json());
app.use(require("express").static(require("path").join(__dirname, "./views")));
app.use(
  require("cookie-session")({
    cookie: { secure: true, maxAge: 60000 },
    secret: "~drizzlydeveloper",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("trust proxy", true);

Functions.pages.function(app);
Functions.Connection();
