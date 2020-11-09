const mutedroles = require('../../data/mutedroles.json');
const fs = require('fs');

module.exports = {
    name: "mute",
    aliases: [],
    desc: "Mutes a user.",
    args: "<@mention|username>",
    level: "1",
    func: async (message, args) => {
        var getRole = message.guild.roles.cache.find(role => role.name === "Cuno's Bot").position
        const memberData = global.Functions.getMember(message, args.join(' '))
        if (!memberData[0]) {
            return message.channel.send(null, global.Functions.BasicEmbed("error", memberData[1]))
        }
        const member = memberData[1]
        if (!member) {
            return message.channel.send(global.Functions.BasicEmbed(("error"), "No users found!"))
        }
        else if (args[0] == undefined || args[0] == "") {
            return message.channel.send(global.Functions.BasicEmbed(("error"), "Please specify the user to mute."))
        }
        if (message.member.roles.highest.position <= member.roles.highest.position && message.author.id != message.guild.ownerID) {
            return message.channel.send(global.Functions.BasicEmbed(("error"), "Cannot mute users ranked the same or higher than you."))
        }
        if (mutedroles[message.guild.id] == undefined) {
            const mutechat = await message.channel.send("No muted role detected, creating one...")
            message.guild.roles.create({data: {name: 'Muted', color: 'GRAY', position: getRole, permissions: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'CONNECT']}, reason: 'No existing muted role'}).then((r) => {
                mutechat.edit("Successfully created muted role.")
                message.guild.members.resolve(member).roles.add(r.id, "Mute command used").then(() => {
                    fs.writeFile('C:/Users/Cuno/Documents/DiscordBot/src/data/mutedroles.json', JSON.stringify(mutedroles).replace("}", `,"${message.guild.id}":"${r.id}"}`), function (err) {
                        if (err) return message.channel.send(global.Functions.BasicEmbed(("error"), err))
                        return message.channel.send(global.Functions.BasicEmbed(("success"), "Successfully muted user."))
                    })
                })
            })
        }
        else if (message.guild.roles.cache.find(role => role.id === mutedroles[message.guild.id]) == undefined) {
            const mutechat = await message.channel.send("Couldn't find muted role in this server from database, creating one...")
            message.guild.roles.create({data: {name: 'Muted', color: 'GRAY', position: getRole, permissions: ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'CONNECT']}, reason: 'No existing muted role'}).then((r) => {
                mutechat.edit("Successfully created muted role.")
                toWrite = mutedroles
                toWrite[message.guild.id] = r.id
                message.guild.members.resolve(member).roles.add(r.id, "Mute command used").then(() => {
                    fs.writeFile('C:/Users/Cuno/Documents/DiscordBot/src/data/mutedroles.json', JSON.stringify(toWrite), function (err) {
                        if (err) return message.channel.send(global.Functions.BasicEmbed(("error"), err))
                        return message.channel.send(global.Functions.BasicEmbed(("success"), "Successfully muted user."))
                    })
                })
            })
        }
        else if (member.roles.cache.find(role => role.id === mutedroles[message.guild.id]) != undefined) {
            return message.channel.send(global.Functions.BasicEmbed(("error"), "User already muted."))
        }
        message.guild.members.resolve(member).roles.add(mutedroles[message.guild.id], "Mute command used").then(() => {
            return message.channel.send(global.Functions.BasicEmbed(("success"), "Successfully muted user."))
        })
        .catch((e) => {
            if (e.message == "Missing Permissions") {
                return message.channel.send(global.Functions.BasicEmbed(("error"), "The muted role is above my role in this server's role hierarchy.\nPlease move it below my role and try again."))
            }
        })
    }
}