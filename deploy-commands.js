const { REST, Routes } = require('discord.js');
require("dotenv").config();
const { LIST_MUSIC, GETTING_LIST } = require("./commands/listMusic.commands")
const { PING_MESSAGE, PING_EXECUTE } = require("./commands/ping.commands")

const commands = [];
commands.push(LIST_MUSIC.toJSON());
commands.push(PING_MESSAGE.toJSON());
const rest = new REST().setToken(process.env.CLIENT_TOKEN);
// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();