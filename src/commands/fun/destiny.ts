import axios, { AxiosResponse } from 'axios';
import Discord from 'discord.js'
import * as Destiny from '../../interfaces';
const dateFormat = require("dateformat");
const itemManifest = require('../../data/DestinyManifest.json')
var OGType = 0
var listen = true
var page = 0
const characterTest = /[#*+:<>?]+/

module.exports = {
    name: "destiny",
    aliases: [],
    args: "[<item>, <keyword(s)>] [<player>, <platform>, <username>, <general|stats>]",
    desc: "Queries the Destiny API.",
    level: 0,
    func: async (message: Discord.Message, args: string[]) => {
        var subclass: number, kinetic: number, energy: number, power: number, ghost: number, vehicle: number, ship: number = 0
        if (args[0] == undefined) {
            return message.channel.send(global.Functions.BasicEmbed('error', "Please choose a valid option: `item`, `player`."))
        }
        if (args[0].toLowerCase() == "item") {
            listen = false
            page = 0
            var embed = global.Functions.BasicEmbed("normal")
            if (args[1] == undefined) {
                return message.channel.send(global.Functions.BasicEmbed('error', "Please provide keyword(s) to search with."))
            }
            message.channel.send("Searching database for items...").then(async (me) => {
                if (characterTest.test(args.slice(1).join(" "))) {
                    return me.edit("", global.Functions.BasicEmbed(("error"), "Entered keyword(s) cannot contain the following characters:\n```# (Hashtag)\n* (Asterisk)\n+ (Plus)\n: (Colon)\n< (Left Angle Bracket)\n> (Right Angle Bracket)\n? (Question Mark)```"))
                }
                if (args.slice(1).join(" ").length > 100) {
                    return me.edit("", global.Functions.BasicEmbed(("error"), "Entered keyword(s) cannot exceed 100 characters in length."))
                }
                const res = await axios.get<Destiny.ServerResponse<Destiny.DestinyEntitySearchResult>>(`https://www.bungie.net/Platform/Destiny2/Armory/Search/DestinyInventoryItemDefinition/${encodeURIComponent(args.slice(1).join(" "))}/`, {
                    headers: {
                        'X-API-Key': global.Auth.destinyAPI,
                        'User-Agent': global.Auth.destinyUserAgent
                    }
                })
                if (res.data.ErrorCode == Destiny.PlatformErrorCodes.SystemDisabled) {
                    return me.edit("", global.Functions.BasicEmbed('error', "The API is currently down for maintenance, please try again later."))
                }
                if (res.data.Response.results.totalResults == 0) {
                    return message.channel.send(global.Functions.BasicEmbed(("error"), `No results found.${res.data.Response.suggestedWords[0] != undefined ? `\nRecommended keywords to search with: \`${res.data.Response.suggestedWords.join(", ")}\`` : ""}`))
                }
                me.edit("Grabbing item definitions from manifest...")
                var item: Destiny.DestinyInventoryItemDefinition = itemManifest[res.data.Response.results.results[0].hash]
                if (item.itemType == 3 && item.traitIds[1] != 'weapon_type.rocket_launcher') {
                    embed = embed
                        .setTitle(`${res.data.Response.results.results[0].displayProperties.name} (result: ${page + 1}/${res.data.Response.results.totalResults})`)
                        .setDescription(`*${item.flavorText != "" ? item.flavorText : item.displayProperties.description != "" ? item.displayProperties.description : "No description provided"}*`)
                        .addField("Tier", item.inventory.tierTypeName, true)
                        .addField("Impact", item.stats.stats[4043523819].value, true)
                        .addField("Range", item.stats.stats[1240592695].value, true)
                        .addField("Magazine Size", item.stats.stats[3871231066].value, true)
                        .addField("Link", `[${res.data.Response.results.results[0].displayProperties.name}](https://light.gg/db/items/${res.data.Response.results.results[0].hash})`)
                        .setImage(`https://www.bungie.net${res.data.Response.results.results[0].displayProperties.icon}`)
                }
                else {
                    embed = embed
                        .setTitle(`${res.data.Response.results.results[0].displayProperties.name} (result: ${page + 1}/${res.data.Response.results.totalResults})`)
                        .setDescription(`*${item.flavorText != "" ? item.flavorText : item.displayProperties.description != "" ? item.displayProperties.description : "No description provided"}*`)
                        .addField("Tier", item.inventory.tierTypeName, true)
                        .addField("Link", `[${res.data.Response.results.results[0].displayProperties.name}](https://light.gg/db/items/${res.data.Response.results.results[0].hash})`)
                        .setImage(`https://www.bungie.net${res.data.Response.results.results[0].displayProperties.icon}`)
                }
                me.edit("", embed).then(async m => {
                    listen = true
                    m.react('⬅️')
                    m.react('➡️')
                    while (listen == true) {
                        await m.awaitReactions((reaction, user) => user.id === message.author.id, {max: 1, time: 1.8e+6, errors: ['time']}).then(async c => {
                            if (c.first().emoji.name == "➡️") {
                                if (page + 1 > res.data.Response.results.totalResults) {
                                    return true
                                }
                                page++
                            }
                            else if (c.first().emoji.name == "⬅️") {
                                if (page - 1 < 0) {
                                    return true
                                }
                                page--
                            }
                            m.reactions.removeAll()
                            m.react('⬅️')
                            m.react('➡️')
                            item = itemManifest[res.data.Response.results.results[page].hash]
                            if (item.itemType == 3) {
                                m.edit("", global.Functions.BasicEmbed("normal")
                                    .setTitle(`${res.data.Response.results.results[page].displayProperties.name} (result: ${page + 1}/${res.data.Response.results.totalResults})`)
                                    .setDescription(`*${item.flavorText != "" ? item.flavorText : item.displayProperties.description != "" ? item.displayProperties.description : "No description provided"}*`)
                                    .addField("Tier", item.inventory.tierTypeName, true)
                                    .addField("Impact", item.stats.stats[4043523819].value, true)
                                    .addField("Range", item.stats.stats[1240592695].value, true)
                                    .addField("Magazine Size", item.stats.stats[3871231066].value, true)
                                    .addField("Link", `[${res.data.Response.results.results[page].displayProperties.name}](https://light.gg/db/items/${res.data.Response.results.results[page].hash})`)
                                    .setImage(`https://www.bungie.net${res.data.Response.results.results[page].displayProperties.icon}`))
                            }
                            else {
                                m.edit("", global.Functions.BasicEmbed("normal")
                                .setTitle(`${res.data.Response.results.results[page].displayProperties.name} (result: ${page + 1}/${res.data.Response.results.totalResults})`)
                                .setDescription(`*${item.flavorText != "" ? item.flavorText : item.displayProperties.description != "" ? item.displayProperties.description : "No description provided"}*`)
                                .addField("Tier", item.inventory.tierTypeName, true)
                                .addField("Link", `[${res.data.Response.results.results[page].displayProperties.name}](https://light.gg/db/items/${res.data.Response.results.results[page].hash})`)
                                .setImage(`https://www.bungie.net${res.data.Response.results.results[page].displayProperties.icon}`))
                            }
                            return true
                        })
                        .catch((c) => {
                            m.reactions.removeAll()
                            return listen = false
                        })
                    }
                })
            })
        }
        else if (args[0].toLowerCase() == "player") {
            listen = false
            message.channel.send("Gathering player information, please wait...").then(async m => {
                if (args[1] == undefined || args[1].toLowerCase() != "xbox" && args[1].toLowerCase() != "psn" && args[1].toLowerCase() != "steam" && args[1].toLowerCase() != "stadia") {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Please choose a valid platform: `xbox`, `psn`, `steam`, `stadia`."))
                }
                if (args[2] == undefined) {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Please specifiy a username to search with."))
                }
                if (args[3] == undefined) {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Please choose a return type: `general`, `stats`."))
                }
                if (args[2].length > 100) {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Entered username cannot exceed 100 characters in length."))
                }
                if (characterTest.test(args[2])) {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Entered username cannot contain the following characters:\n```# (Hashtag)\n* (Asterisk)\n+ (Plus)\n: (Colon)\n< (Left Angle Bracket)\n> (Right Angle Bracket)\n? (Question Mark)```"))
                }
                switch (args[1].toLowerCase()) {
                    case "xbox":
                        OGType = 1
                        break
                    case "psn":
                        OGType = 2
                        break
                    case "steam":
                        OGType = 3
                        break
                    case "stadia":
                        OGType = 5
                        break
                }
                const res = await axios.get<Destiny.ServerResponse<Destiny.UserInfoCard[]>>(`https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/Tiger${args[1].toLowerCase().charAt(0).toUpperCase() + args[1].toLowerCase().slice(1)}/${encodeURIComponent(args[2])}/`, {
                    headers: {
                        'X-API-Key': global.Auth.destinyAPI,
                        'User-Agent': global.Auth.destinyUserAgent
                    }
                })
                if (res.data.ErrorCode == Destiny.PlatformErrorCodes.SystemDisabled) {
                    return m.edit("", global.Functions.BasicEmbed('error', "The API is currently down for maintenance, please try again later."))
                }
                else if (res.data.ErrorCode == Destiny.PlatformErrorCodes.UserBanned) {
                    return m.edit("", global.Functions.BasicEmbed('error', "Requested user is banned from Bungie services."))
                }
                if (res.data.Response[0] == undefined) {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Could not find user."))
                }
                m.edit("Gathering character information, please wait...")
                const res1 = await axios.get<Destiny.ServerResponse<Destiny.DestinyProfileResponse>>(`https://www.bungie.net/Platform/Destiny2/${res.data.Response[0].membershipType}/Profile/${res.data.Response[0].membershipId}/?components=CharacterEquipment,Characters,CharacterActivities`, {
                    headers: {
                        'X-API-Key': global.Auth.destinyAPI,
                        'User-Agent': global.Auth.destinyUserAgent
                    }
                })
                var embed = global.Functions.BasicEmbed("normal")
                if (args[3].toLowerCase() == "general") {
                    var res9: AxiosResponse<Destiny.ServerResponse<Destiny.DestinyActivityDefinition>>
                    var res10: AxiosResponse<Destiny.ServerResponse<Destiny.DestinyActivityDefinition>>
                    m.edit("Gathering inventory information, please wait...")
                    kinetic = itemManifest[res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[0].itemHash].itemType == 3 ? res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[0].itemHash : 0
                    energy = itemManifest[res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[1].itemHash].itemType == 3 ? res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[1].itemHash : 0
                    power = itemManifest[res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[2].itemHash].itemType == 3 ? res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items[2].itemHash : 0
                    for (var item of res1.data.Response.characterEquipment.data[Object.keys(res1.data.Response.characterEquipment.data)[0]].items) {
                        switch (itemManifest[item.itemHash].itemType) {
                            case Destiny.DestinyItemType.Subclass:
                                subclass = item.itemHash
                                break
                            case Destiny.DestinyItemType.Ship:
                                ship = item.itemHash
                                break
                            case Destiny.DestinyItemType.Vehicle:
                                vehicle = item.itemHash
                                break
                            case Destiny.DestinyItemType.Ghost:
                                ghost = item.itemHash
                                break
                        }
                    }
                    m.edit("Gathering activity information, please wait...")
                    const res8 = await axios.get<Destiny.ServerResponse<Destiny.DestinyActivityHistoryResults>>(`https://www.bungie.net/Platform/Destiny2/${res.data.Response[0].membershipType}/Account/${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].membershipId}/Character/${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].characterId}/Stats/Activities/?count=1&mode=None&page=0`, {
                        headers: {
                            'X-API-Key': global.Auth.destinyAPI,
                            'User-Agent': global.Auth.destinyUserAgent
                        }
                    })
                    if (res8.data.Response.activities != undefined) {
                        res9 = await axios.get<Destiny.ServerResponse<Destiny.DestinyActivityDefinition>>(`https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/${res8.data.Response.activities[0].activityDetails.directorActivityHash}/`, {
                            headers: {
                                'X-API-Key': global.Auth.destinyAPI,
                                'User-Agent': global.Auth.destinyUserAgent
                            }
                        })
                    }
                    if (res1.data.Response.characterActivities.data[Object.keys(res1.data.Response.characterActivities.data)[0]].currentActivityHash != 0) {
                        res10 = await axios.get<Destiny.ServerResponse<Destiny.DestinyActivityDefinition>>(`https://www.bungie.net/Platform/Destiny2/Manifest/DestinyActivityDefinition/${res1.data.Response.characterActivities.data[Object.keys(res1.data.Response.characterActivities.data)[0]].currentActivityHash}/`, {
                            headers: {
                                'X-API-Key': global.Auth.destinyAPI,
                                'User-Agent': global.Auth.destinyUserAgent
                            }
                        })
                    }
                    var race = "Unknown"
                    var userClass = "Unknown"
                    switch (res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].raceType) {
                        case Destiny.DestinyRace.Human:
                            race = "Human"
                            break
                        case Destiny.DestinyRace.Awoken:
                            race = "Awoken"
                            break
                        case Destiny.DestinyRace.Exo:
                            race = "Exo"
                            break
                    }
                    switch (res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].classType) {
                        case Destiny.DestinyClass.Titan:
                            userClass = "Titan"
                            break
                        case Destiny.DestinyClass.Hunter:
                            userClass = "Hunter"
                            break
                        case Destiny.DestinyClass.Warlock:
                            userClass = "Warlock"
                            break
                    }
                    embed = embed
                        .setTitle(args[2])
                        .setThumbnail(`https://bungie.net${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].emblemPath}`)
                        .addField("Race", race, true)
                        .addField("Class", userClass, true)
                        .addField("Subclass", itemManifest[subclass] != undefined ? itemManifest[subclass].displayProperties.name : "Unknown", true)
                        .addField("Light", `<:light:811725351587807313>${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].light}`, true)
                        .addField("Kinetic Weapon", itemManifest[kinetic] != undefined ? `[${itemManifest[kinetic].displayProperties.name}](https://light.gg/db/items/${kinetic})` : "None")
                        .addField("Energy Weapon", itemManifest[energy] != undefined ? `[${itemManifest[energy].displayProperties.name}](https://light.gg/db/items/${energy})`: "None")
                        .addField("Power Weapon", itemManifest[power] != undefined ? `[${itemManifest[power].displayProperties.name}](https://light.gg/db/items/${power})` : "None")
                        .addField("Ghost Shell", itemManifest[ghost] != undefined ? `[${itemManifest[ghost].displayProperties.name}](https://light.gg/db/items/${ghost})` : "None")
                        .addField("Vehicle", itemManifest[vehicle] != undefined ? `[${itemManifest[vehicle].displayProperties.name}](https://light.gg/db/items/${vehicle})` : "None")
                        .addField("Ship", itemManifest[ship] != undefined ? `[${itemManifest[ship].displayProperties.name}](https://light.gg/db/items/${ship})`: "None")
                        .addField("Latest Activity", res9.data == undefined ? "Unknown" : `[${res9.data.Response.displayProperties.name != "" ? res9.data.Response.displayProperties.name : "Unknown"}](https://destinytracker.com/destiny-2/db/activities/${res9.data.Response.hash})`, true)
                        .addField("Current Activity", res1.data.Response.characterActivities.data[Object.keys(res1.data.Response.characterActivities.data)[0]].currentActivityHash != 0 ? `[${res10.data.Response.displayProperties.name != "" ? res10.data.Response.displayProperties.name : "Unknown"}](https://destinytracker.com/destiny-2/db/activities/${res10.data.Response.hash})` : "User Offline", true)
                        .addField("Time Played", `${(Number(res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].minutesPlayedTotal) / 60).toFixed(1)} hours`, true)
                        .addField("Last Login", `${dateFormat(res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].dateLastPlayed, "mmmm dS, yyyy, h:MM:ss TT")} ${res1.data.Response.characterActivities.data[Object.keys(res1.data.Response.characterActivities.data)[0]].currentActivityHash != 0 ? "(currently in-game)" : ""}`, true)
                    m.edit(`${res.data.Response[0].membershipType != OGType ? "Original player's profile is not available. Returning currently active profile instead." : ""}`, embed)
                }
                else if (args[3].toLowerCase() == "stats") {
                    m.edit("Gathering statistics information, please wait...")
                    const res2 = await axios.get<Destiny.ServerResponse<Destiny.DestinyHistoricalStatsAccountResult>>(`https://www.bungie.net/Platform/Destiny2/${res.data.Response[0].membershipType}/Account/${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].membershipId}/Stats/?groups=General`, {
                        headers: {
                            'X-API-Key': global.Auth.destinyAPI,
                            'User-Agent': global.Auth.destinyUserAgent
                        }
                    })
                    if (res2.data.Response.characters[0] == undefined) {
                        return m.edit("", global.Functions.BasicEmbed(("error"), "Unable to fetch stats for this player."))
                    }
                    if (res2.data.Response.characters[0].results.allPvP.allTime != undefined) {
                        embed = embed
                            .setTitle(`${args[2]}'s PvP Stats`)
                            .setThumbnail(`https://bungie.net${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].emblemPath}`)
                            .addField("PvP Kills", res2.data.Response.characters[0].results.allPvP.allTime.kills.basic.value, true)
                            .addField("PvP Deaths", res2.data.Response.characters[0].results.allPvP.allTime.deaths.basic.value, true)
                            .addField("PvP Precision Kills", res2.data.Response.characters[0].results.allPvP.allTime.precisionKills.basic.value, true)
                            .addField("KDR", res2.data.Response.characters[0].results.allPvP.allTime.killsDeathsRatio.basic.displayValue, true)
                            .addField("Games Played", res2.data.Response.characters[0].results.allPvP.allTime.activitiesEntered.basic.value, true)
                            .addField("Games Won", res2.data.Response.characters[0].results.allPvP.allTime.activitiesWon.basic.value, true)
                    }
                    else {
                        embed = embed
                            .setTitle(`${args[2]}'s PvE Stats`)
                            .setThumbnail(`https://bungie.net${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].emblemPath}`)
                            .addField("PvE Kills", res2.data.Response.characters[0].results.allPvE.allTime.kills.basic.value, true)
                            .addField("PvE Deaths", res2.data.Response.characters[0].results.allPvE.allTime.deaths.basic.value, true)
                            .addField("PvE Precision Kills", res2.data.Response.characters[0].results.allPvE.allTime.precisionKills.basic.value, true)
                            .addField("Players Revived", res2.data.Response.characters[0].results.allPvE.allTime.resurrectionsPerformed.basic.value, true)
                            .addField("Public Events Completed", res2.data.Response.characters[0].results.allPvE.allTime.publicEventsCompleted.basic.value, true)
                    }
                    m.edit(`${res.data.Response[0].membershipType != OGType ? "Original player's profile is not available. Returning currently active profile instead." : ""}`, embed).then(async m => {
                        if (res2.data.Response.characters[0].results.allPvP.allTime == undefined) {
                            return message.channel.send("Player PvP stats unavailable.")
                        }
                        page = 0
                        listen = true
                        m.react('⬅️')
                        m.react('➡️')
                        while (listen == true) {
                            await m.awaitReactions((reaction, user) => user.id === message.author.id, {max: 1, time: 1.8e+6, errors: ['time']}).then(async c => {
                                if (c.first().emoji.name == "➡️") {
                                    if (page == 1) {
                                        return true
                                    }
                                    page++
                                }
                                else if (c.first().emoji.name == "⬅️") {
                                    if (page == 0) {
                                        return true
                                    }
                                    page--
                                }
                                m.reactions.removeAll()
                                m.react('⬅️')
                                m.react('➡️')
                                if (page == 1) {
                                    m.edit(`${res.data.Response[0].membershipType != OGType ? "Original player's profile is not available. Returning currently active profile instead." : ""}`, global.Functions.BasicEmbed("normal")
                                    .setTitle(`${args[2]}'s PvE Stats`)
                                    .setThumbnail(`https://bungie.net${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].emblemPath}`)
                                    .addField("PvE Kills", res2.data.Response.characters[0].results.allPvE.allTime.kills.basic.value, true)
                                    .addField("PvE Deaths", res2.data.Response.characters[0].results.allPvE.allTime.deaths.basic.value, true)
                                    .addField("PvE Precision Kills", res2.data.Response.characters[0].results.allPvE.allTime.precisionKills.basic.value, true)
                                    .addField("Players Revived", res2.data.Response.characters[0].results.allPvE.allTime.resurrectionsPerformed.basic.value, true)
                                    .addField("Public Events Completed", res2.data.Response.characters[0].results.allPvE.allTime.publicEventsCompleted.basic.value, true))
                                }
                                else {
                                    m.edit(`${res.data.Response[0].membershipType != OGType ? "Original player's profile is not available. Returning currently active profile instead." : ""}`, global.Functions.BasicEmbed("normal")
                                    .setTitle(`${args[2]}'s PvP Stats`)
                                    .setThumbnail(`https://bungie.net${res1.data.Response.characters.data[Object.keys(res1.data.Response.characters.data)[0]].emblemPath}`)
                                    .addField("PvP Kills", res2.data.Response.characters[0].results.allPvP.allTime.kills.basic.value, true)
                                    .addField("PvP Deaths", res2.data.Response.characters[0].results.allPvP.allTime.deaths.basic.value, true)
                                    .addField("PvP Precision Kills", res2.data.Response.characters[0].results.allPvP.allTime.precisionKills.basic.value, true)
                                    .addField("KDR", res2.data.Response.characters[0].results.allPvP.allTime.killsDeathsRatio.basic.displayValue, true)
                                    .addField("Games Played", res2.data.Response.characters[0].results.allPvP.allTime.activitiesEntered.basic.value, true)
                                    .addField("Games Won", res2.data.Response.characters[0].results.allPvP.allTime.activitiesWon.basic.value, true))
                                }
                                return true
                            })
                            .catch(c => {
                                m.reactions.removeAll()
                                return listen = false
                            })
                        }
                    })
                }
                else {
                    return m.edit("", global.Functions.BasicEmbed(("error"), "Please choose a valid return type: `general`, `stats`."))
                }
            })
        }
        else {
            return message.channel.send(global.Functions.BasicEmbed(("error"), "Please choose a valid option: `item`, `player`."))
        }
    }
}