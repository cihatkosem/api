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

module.exports.functions = {
    comment: {
        save: async function Comment(userid, username, commentstext) {
            comment.updateOne(
                { userId: userid },
                { userName: username, comments: commentstext, date: await Functions.day(true, true) },
                { upsert: true }
            ).catch(err => console.log(err))
        },
        delete: async function Comment(id) {
            await comment.deleteOne({ userId: id }).catch(err => console.log(err))
        }
    },
    shared_content: {
        save: async function SharedContent(a, x, y, z, t, w, q) {
            shared_content.updateOne({ id: a }, { author: x, share_date: y, title: z, description: t, image: w, content: q, visits: "1" }, { upsert: true })
                .catch(err => console.log(err))
        },
        delete: async function SharedContent(id) {
            await shared_content.deleteOne({ id: id }).catch(err => console.log(err))
            return res.redirect("/")
        },
        edit: async function SharedContent(id, user, users, req, res) {
            let datasc = await shared_content.findOne({ id: id })
            if (!datasc) return res.render("error", { message: Messages.thereisnotpost, button: Messages.go_home, href: "/", dual_button: "", conf: "search" })
            let data = { post: datasc, twitter: await Functions.Find.twitter.user("cihatksm"), users }
            return res.render('shared_content', { user, data, edit: "true" })
        },
    },
    project: {
        save: async function Project(name, description) {
            if (!name) return;
            project.updateOne(
                { projectname: name },
                { projectdesc: description, date: await Functions.day(true, true) },
                { upsert: true }
            ).catch(err => console.log(err))
        },
        delete: async function Project(name) {
            if (!name) return;
            await project.deleteOne({ projectname: name }).catch(err => console.log(err))
        }
    },
    view: {
        save: async function View(name) {
            if (!name) return;
            view.updateOne({ page: name }, { views: 1 }, { upsert: true }).catch(err => console.log(err))
        },
        delete: async function View(name) {
            if (!name) return;
            await view.deleteOne({ page: name }).catch(err => console.log(err))
        }
    },
    verification: {
        save: async function VerificationS(id, token) {
            await verification.updateOne({ id: id }, { token: token + id },{ upsert: true }).catch(err => console.log(err))
        },
        delete: async function VerificationD(id) {
            await verification.deleteOne({ id: id },{ upsert: true }).catch(err => console.log(err))
        }
    }
}
