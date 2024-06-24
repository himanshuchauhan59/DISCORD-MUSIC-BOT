require("dotenv").config();
const { PING_MESSAGE, PING_EXECUTE } = require("./commands/ping.commands")
const { LIST_MUSIC, GETTING_LIST } = require("./commands/listMusic.commands")
const { exec } = require('youtube-dl-exec');
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages] })
let songsCollections = [], playingSong = 0, isAnySongPlaying = false;
client.commands = new Collection();

{
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.commands.set(PING_MESSAGE.name, PING_EXECUTE);
        client.commands.set(LIST_MUSIC.name, GETTING_LIST);
    });

    client.on('messageCreate', (msg) => {
    });

    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        console.log("command: ", interaction.commandName);

        try {
            switch (interaction.commandName) {
                case 'set':
                    await setSongCommand(interaction);
                    break;
                case 'getlist':
                    await getListOfSongs(interaction);
                    break;
            }

        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    });
    client.login(process.env.CLIENT_TOKEN);
}
const setSongCommand = async (interaction) => {
    let voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
        return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    }
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log('The bot has connected to the channel!');
    });
    const url = interaction.options.getString('url');
    if (url) {
        let songObj = {};
        if (songsCollections.length == 0) {
            songObj.url = url;
            songObj.playing = true;
            songsCollections.push(songObj);
            playSong(connection, interaction);
        } else {
            songObj.url = url;
            if (isAnySongPlaying) {
                songObj.playing = false;
            } else {
                songObj.playing = true;
            }
            songsCollections.push(songObj);
            playSong(connection, interaction);
        }
        if (isAnySongPlaying) {
            await PING_EXECUTE(interaction, `Added this song to queue ${url}`);
        } else {
            await PING_EXECUTE(interaction, `Playing this song ${url}`);
        }
    } else {
        await PING_EXECUTE(interaction, `No URL provided.`);
    }
}

const playSong = async (connection, interaction) => {
    try {
        if (!songsCollections[playingSong]) {
            connection.destroy();
            sendMessagOfPlayingSong(`Hope you enjoyed the songs!`);
            sendMessagOfPlayingSong(`No song to play now. I will be back with more songs. Thank you!`);
            return console.log('No song to play.');
        }
        if (isAnySongPlaying) {
            sendMessagOfPlayingSong(`Thank you for giving song`);
            sendMessagOfPlayingSong(`Your song will be added into queue. Thank you`);
            return console.log('Already playing a song.', songsCollections);
        }
        const url = songsCollections[playingSong].url;
        const stream = exec(url, {
            output: '-',
            limitRate: '5M',
            rmCacheDir: true,
            verbose: true,
        }, { stdio: ['ignore', 'pipe', 'ignore'] });
        const resource = createAudioResource(stream.stdout);
        const player = createAudioPlayer();
        player.play(resource);
        connection.subscribe(player);
        player.on(AudioPlayerStatus.Playing, () => {
            isAnySongPlaying = true;
            songsCollections[playingSong].playing = true;
            sendMessagOfPlayingSong(`Song playing now ${url}`);
            console.log('The audio is now playing!', songsCollections);
        });
        player.on(AudioPlayerStatus.Idle, () => {
            isAnySongPlaying = false;
            songsCollections[playingSong].playing = false;
            playingSong++;
            connection.destroy();
            let voiceChannel = interaction.member.voice.channel;
            const connectionNew = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            connectionNew.on(VoiceConnectionStatus.Ready, () => {
                console.log('The bot has connected to the channel!');
            });
            playSong(connectionNew, interaction);
        });
    } catch (error) {
        console.log(error)
    }
};

const sendMessagOfPlayingSong = async (message) => {
    try {
        let channel = client.channels.cache.get(process.env.CHANNEL_ID)
        if (!channel) {
            return console.error('The channel does not exist!');
        }
        channel.send(message);
    } catch (error) {
        console.error('Error while sending message', error);
    }
}

const getListOfSongs = async (interaction) => {
    console.log(songsCollections);
    if (songsCollections.length == 0) {
        await GETTING_LIST(interaction, 'No songs in list!');
        return;
    }
    let embedsSnippet = [];
    for (let i = 0; i < songsCollections.length; i++) {
        let obj = {
            name: `${i + 1} ${songsCollections[i].url}`,
            value: (songsCollections[i].playing) ? 'Status - Playing' : 'Status - Not Playing',
        }
        embedsSnippet.push(obj);
    }
    const exampleEmbed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Song Lists')
        .addFields(embedsSnippet);
    await GETTING_LIST(interaction, { embeds: [exampleEmbed] });
}