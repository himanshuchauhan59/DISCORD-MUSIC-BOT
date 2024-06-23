const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    PING_MESSAGE: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Set a new URL for the bot to play.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Url for play music.')
                .setRequired(false)),
    async PING_EXECUTE(interaction, message) {
        await interaction.reply(message);
    },
};