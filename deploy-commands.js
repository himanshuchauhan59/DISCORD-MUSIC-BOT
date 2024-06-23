const { REST, Routes } = require('discord.js');
require("dotenv").config();
const { PING_MESSAGE, PING_EXECUTE } = require("./commands/ping.commands")

const commands = [];
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