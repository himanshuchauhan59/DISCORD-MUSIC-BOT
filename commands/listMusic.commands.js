const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    LIST_MUSIC: new SlashCommandBuilder()
        .setName('getlist')
        .setDescription('Getting all music list in queue.'),
    async GETTING_LIST(interaction, message) {
        await interaction.reply(message);
    },
};