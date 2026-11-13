import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const CLAIM_COMMAND = {
  name: 'claim',
  description: 'Claim je dagelijkse coins',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const BALANCE_COMMAND = {
  name: 'balance',
  description: 'Bekijk hoeveel coins je hebt',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const PLAY_COMMAND = {
  name: 'play',
  description: 'Speel een game',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
  options: [
    {
      type: 1,
      name: 'slotmachine',
      description: 'Speel de slotmachine',
      options: [
        { type: 4, name: 'inzet', description: 'Hoeveel coins wil je inzetten?', required: true, min_value: 1 },
      ],
    },
    {
      type: 1,
      name: 'roulette',
      description: 'Speel roulette',
      options: [
        {
          type: 3,
          name: 'kleur',
          description: 'Kies een kleur',
          required: true,
          choices: [
            { name: 'Rood', value: 'rood' },
            { name: 'Zwart', value: 'zwart' },
            { name: 'Groen', value: 'groen' },
          ],
        },
        { type: 4, name: 'inzet', description: 'Hoeveel coins wil je inzetten?', required: true, min_value: 1 },
      ],
    },
  ],
};

const LEADERBOARD_COMMAND = {
  name: 'leaderboard',
  description: 'Bekijk wie de meeste coins heeft',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};
// Command containing options
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, CHALLENGE_COMMAND, CLAIM_COMMAND, BALANCE_COMMAND, LEADERBOARD_COMMAND, PLAY_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);