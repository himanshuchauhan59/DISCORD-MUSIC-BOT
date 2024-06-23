require("dotenv").config();
const { PING_MESSAGE, PING_EXECUTE } = require("./commands/ping.commands")
const { exec } = require('youtube-dl-exec');
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages] })
let songsCollections = [], playingSong = 0, isAnySongPlaying = false;
client.commands = new Collection();
{
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.commands.set(PING_MESSAGE.name, PING_EXECUTE);
    });
    client.on('messageCreate', (msg) => {
    });
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }
        try {
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


const playSong = async (connection, interaction) => {
    if (!songsCollections[playingSong]) {
        return console.log('No song to play.');
    }
    if (isAnySongPlaying) {
        return console.log('Already playing a song.', songsCollections);
    }
    const url = songsCollections[playingSong].url;
    const stream = exec(url, {
        output: '-',
        limitRate: '1M',
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
};