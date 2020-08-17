const dateFormat = require('dateformat');

module.exports = {
    name: "getmessage",
    aliases: ["getm"],
    desc: "Gets a message based on ID.",
    args: "<messageid>",
    level: "1",
    func: (message, args) => {
        message.channel.messages.fetch(args[0]).then(m => {
            if (m.attachments.size > 0) {
                var Attachment = (m.attachments).array()
                var attachments = []
                Attachment.forEach(function (Attachment) {
                    attachments.push(`[${Attachment.name}](${Attachment.url})\n`)
                })
                return message.channel.send(m.url, global.Functions.BasicEmbed("normal")
                    .setAuthor(m.author.username, m.author.avatarURL({format: 'png', dynamic: true}))
                    .addField("Content", m.content == "" ? "_ _" : m.content)
                    .addField("Attachments", attachments)
                    .addField("Date sent", dateFormat(m.createdAt, "mmmm dS, yyyy 'at' h:MM TT '(EST)'")))
            }
            return message.channel.send(m.url, global.Functions.BasicEmbed("normal")
                .setAuthor(m.author.username, m.author.avatarURL({format: 'png', dynamic: true}))
                .addField("Content", m.content == "" ? "_ _" : m.content)
                .addField("Date sent", dateFormat(m.createdAt, "mmmm dS, yyyy 'at' h:MM TT '(EST)'")))
        })
        .catch((e) => {
            if (e.message.startsWith("Unknown") || e.message.startsWith("404")) {
                return message.channel.send(global.Functions.BasicEmbed(("error"), "Message not found."))
            }
            return message.channel.send(global.Functions.BasicEmbed(("error"), e))
        })
    }
}