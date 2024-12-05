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

// Replace these with your IDs
const SERVER_ID = '1304550156154441879'; // Your server ID
const APPLICATION_ID = '1314248837086580737'; // Your bot's application ID
const TOKEN = 'token'; // Your bot token

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
      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.banned) {
          await interaction.reply(`The UID \`${uid}\` is **banned** in the \`${region}\` region.`);
        } else {
          await interaction.reply(`The UID \`${uid}\` is **not banned** in the \`${region}\` region.`);
        }
      } else {
        await interaction.reply('Error: Unable to fetch data from the API. Please try again later.');
      }
    } catch (error) {
      await interaction.reply(`An error occurred: ${error.message}`);
    }
  }
});

// Login to Discord
bot.login(TOKEN);
