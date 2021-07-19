const mongodb = require('mongodb');
const mongoClient = new mongodb.MongoClient(global.Auth.dbLogin, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = {
    name: "about",
    aliases: ["user", "member"],
    desc: "Gets information about a user.",
    args: "<@mention|username>",
    level: "0",
    func: async (message, args) => {
        var m = await message.channel.send(global.Functions.BasicEmbed(("normal"), "Gathering data..."))
        const memberData = global.Functions.getMember(message, args.join(' '))
        if (!memberData[0]) {
            return m.edit("", global.Functions.BasicEmbed("error", memberData[1]))
        }
        const member = memberData[1]
        var embed = global.Functions.BasicEmbed("normal")
        if (!member) {
            return m.edit("", global.Functions.BasicEmbed(("error"), "No users found!"))
        }
        //Presence Data
        const game = member.user.presence.activities[0]
        if (game) {
            if (game.type == "LISTENING") {
                embed = embed.setDescription(`*Listening to ${game.name}: ${game.details} by ${game.state}*`)
            }
            else if (game.type == "WATCHING") {
                embed = embed.setDescription(`*Watching ${game.name}*`)
            }
            else if (game.type == "STREAMING") {
                embed = embed.setDescription(`*Streaming ${game.name}: ${game.url}*`)
            }
            else {
                switch (game.name) {
                    case "Fortnite":
                        embed = embed.setDescription(`*Playing Fortnite: ${game.details} | ${game.state}*`)
                        break
                    case "Roblox":
                        embed = embed.setDescription(`*Playing Roblox: ${game.details}*`)
                        break
                    case "Paladins":
                        embed = embed.setDescription(`*Playing Paladins: ${game.state}*`)
                        break
                    case "Visual Studio Code":
                        embed = embed.setDescription(`*Visual Studio Code: ${game.details}*\n*${game.state}*`)
                        break
                    case "Custom Status":
                        if (game.emoji == null) embed = embed.setDescription(`*${game.state}*`)
                        else embed = embed.setDescription(`*${game.emoji}${game.state}*`)
                        break
                    default:
                        embed = embed.setDescription(`*Playing ${game.name}*`)
                        break
                }
            }
        }
        //Status
        var emoji = ""
        var stat = ""
        switch (member.presence.status) {
            case "online":
                emoji = "<:online:666789311722553376>"
                stat = "Online"
                break
            case "offline":
                emoji = "<:offline:666790009399148564>"
                stat = "Offline"
                break
            case "idle":
                emoji = "<:idle:666789999726952454>"
                stat = "Idle"
                break
            case "dnd":
                emoji = "<:dnd:666789986447785986>"
                stat = "DnD"
                break
            default:
                emoji = ""
                stat = "Unknown"
                break
        }
        await mongoClient.connect()
        const check = await mongoClient.db("Servers").collection("Permissions").findOne({server: message.guild.id})
        mongoClient.close()
        if (game && game.type == 1) {
            emoji = "<:streaming:671128707603103799>"
            stat = `[Streaming](${game.url})` 
        }
        var level = await global.Functions.getUserLevel(message.guild.id, member)
        embed = embed
            .setAuthor(member.displayName, member.user.avatarURL({format: 'png', dynamic: true}))
            .addField("Username", member.user.tag, true)
            .addField("ID", member.id, true)
            .addField("Status", `${emoji} ${stat}`, true)
            .addField("Account Creation", member.user.createdAt.toLocaleString('en-US', {year: "numeric", month: "long", day: "numeric", timeZone: "UTC"}), true)
            .addField("Joined Server", member.joinedAt.toLocaleString('en-US', {year: "numeric", month: "long", day: "numeric", timeZone: "UTC"}), true)
            .addField("Bot Permissions", `${level} (${level == 3 ? "Bot Owner" : level == 0 ? "Normal User" : level == -1 ? "Bot" : message.guild.roles.resolve(check[`level${level}`]).name})`, true)
            .addField("Roles", member.roles.cache.array().join(", "))
        m.edit("", embed)
    }
}