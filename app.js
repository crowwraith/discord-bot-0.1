import 'dotenv/config';
import express from 'express';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import { db, FieldValue } from './db.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      // "test" command
      if (name === 'test') {
        // Send a message into the channel where command was triggered from
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                // Fetches a random emoji to send from a helper function
                content: `hello world ${getRandomEmoji()}`
              }
            ]
          },
        });
      }

  if (name === 'claim') {
    let discordUser = req.body.user;
    if (req.body.member) {
      discordUser = req.body.member.user;
    }

    const userRef = db.collection('users').doc(discordUser.id);

    const claimRef = db.collection('claims').doc(discordUser.id);

    const vandaag = new Date().toDateString();

    const claimDoc = await claimRef.get();
    if (claimDoc.exists && claimDoc.data().datum === vandaag) {
      return res.send({ type: 4, data: { content: 'Je hebt je dagelijkse coins al geclaimd!' } });
    }

    const userDoc = await userRef.get();
    if (userDoc.exists) {
      const huidigeCoins = userDoc.data().coins;
      await userRef.update({ coins: huidigeCoins + 100 });
    } else {
      await userRef.set({
        username: discordUser.username,
        coins: 100,
        createdAt: new Date(),
      });
    }

    await claimRef.set({ datum: vandaag });

    return res.send({ type: 4, data: { content: 'Je hebt je dagelijkse 100 coins geclaimd!' } });
  }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});