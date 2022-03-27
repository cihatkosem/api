const mongoose = require('mongoose')
const Functions = require("./Functions")
let comment, project, user, view, shared_content, verification;

module.exports.comment = comment = mongoose.model("comments", mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    comments: { type: String, required: true },
    date: { type: String, required: true },
}))

module.exports.project = project = mongoose.model("projects", mongoose.Schema({
    projectname: { type: String, required: true },
    projectdesc: { type: String, required: true },
    date: { type: String, required: true },
}))

module.exports.shared_content = shared_content = mongoose.model("shared_contents", mongoose.Schema({
    id: { type: String, required: true },
    author: { type: String, required: true },
    share_date: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    content: { type: String, required: true },
    visits: { type: String, required: true },
}))

module.exports.user = user = mongoose.model("user", mongoose.Schema({
    id: { type: String, required: true },
    displayname: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    creation_date: { type: String, required: true },
    admin: { type: String, required: true },
    verified: { status: String, code: String, try: String },
    social: { about: String, website: String, twitter: String, instagram: String, github: String, discord: String },
    logins: { type: Array, default: [] },
}))

module.exports.verification = verification = mongoose.model("verification", mongoose.Schema({
    id: { type: String, required: true },
    token: { type: String, required: true },
    current: { type: String, required: true },
}))

module.exports.view = view = mongoose.model("views", mongoose.Schema({
    page: { type: String, required: true },
    views: { type: String, required: true },
    dailyvisits: { type: Array, default: [] }
}))