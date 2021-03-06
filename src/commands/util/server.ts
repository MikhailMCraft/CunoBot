import Discord from 'discord.js'
const dateFormat = require('dateformat');

module.exports = {
    name: "server",
    aliases: ["guild", "serverinfo"],
    desc: "Gets information about this server.",
    level: 0,
    func: async (message: Discord.Message) => {
        var roleSize = 0
        const guild = message.guild
        const [bots, humans] = guild.members.cache.partition(member => member.user.bot == true)
        guild.roles.cache.forEach(() => roleSize = roleSize + 1)
        message.channel.send(global.Functions.BasicEmbed("normal")
            .setAuthor(guild.name, guild.iconURL({format: 'png', dynamic: true}))
            .addField("Owner", guild.owner, true)
            .addField("Server Creation", dateFormat(guild.createdAt, "UTC: mmmm dS, yyyy"), true)
            .addField("Region", guild.region, true)
            .addField("Members", guild.memberCount, true)
            .addField("Humans", humans.size, true)
            .addField("Bots", bots.size, true)
            .addField("Text Channels", guild.channels.cache.filter(channel => channel.type == "text").size, true)
            .addField("Voice Channels", guild.channels.cache.filter(channel => channel.type == "voice").size, true)
            .addField("Roles", roleSize, true)
            .addField("Perks", `${guild.partnered == true ? "<:partnered:811309058833383446>" : ""}${guild.verified == true ? "<:verified:811310553577947216>" : ""}${guild.premiumTier != 0 ? `<:boost:811311024506011699> Level ${guild.premiumTier}` : ""} ${guild.partnered == false && guild.verified == false && guild.premiumTier == 0 ? "None" : ""}`))
    }
}