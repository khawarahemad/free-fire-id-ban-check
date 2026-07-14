import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import fetch from 'node-fetch';

// Bot setup
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Retrieve environment variables
const SERVER_ID = process.env.SERVER_ID;
const APPLICATION_ID = process.env.APPLICATION_ID;
const TOKEN = process.env.DISCORD_TOKEN;

// Validate environment variables
if (!SERVER_ID || !APPLICATION_ID || !TOKEN) {
  console.error('Error: SERVER_ID, APPLICATION_ID, and DISCORD_TOKEN must be defined in the .env file.');
  process.exit(1);
}


// Slash Command Setup
const commands = [
  {
    name: 'check_ban',
    description: 'Check if a UID is banned.',
    options: [
      {
        name: 'region',
        type: 3, // STRING
        description: 'Region of the UID',
        required: true,
      },
      {
        name: 'uid',
        type: 3, // STRING
        description: 'UID to check',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Register Slash Commands
(async () => {
  try {
    console.log('Refreshing application (/) commands...');
    await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, SERVER_ID), {
      body: commands,
    });
    console.log('Successfully registered application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

// Bot Event Handlers
bot.once('ready', () => {
  console.log('Bot is ready!');
});

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'check_ban') {
    const region = options.getString('region');
    const uid = options.getString('uid');

    const apiUrl = `https://ff.garena.com/api/antihack/check_banned?lang=${region}&uid=${uid}`;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'authority': 'ff.garena.com',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'referer': 'https://ff.garena.com/en/support/',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'B6FksShzIgjfrYImLpTsadjS86sddhFH',
    };

    try {
      await interaction.deferReply();
      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.banned) {
          await interaction.editReply(`The UID \`${uid}\` is **banned** in the \`${region}\` region.`);
        } else {
          await interaction.editReply(`The UID \`${uid}\` is **not banned** in the \`${region}\` region.`);
        }
      } else {
        await interaction.editReply('Error: Unable to fetch data from the API. Please try again later.');
      }
    } catch (error) {
      try {
        await interaction.editReply(`An error occurred: ${error.message}`);
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  }
});

// Login to Discord
bot.login(TOKEN);
