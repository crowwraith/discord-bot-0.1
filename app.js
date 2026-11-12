
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

// Firebase Admin SDK imports
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };

// --------------------------------------------------
// FIREBASE INITIALIZATION
// --------------------------------------------------

// Initialize Firebase Admin SDK.
// Hiermee krijgt je Discord-bot toegang tot je Firebase-project.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Maak een Firestore database-referentie aan.
// Deze gebruiken we om gegevens op te slaan en op te halen.
const db = admin.firestore();

console.log('Firebase Admin SDK initialized!');

// --------------------------------------------------
// FIRESTORE TEST DATA
// --------------------------------------------------

// Testfunctie om te controleren of Firestore werkt.
// We gebruiken async/await omdat databasebewerkingen asynchroon zijn.
async function testFirestore() {
  try {
    // Voeg een gebruiker toe aan de collectie 'users'.
    const docRef = await db.collection('users').add({
      first: 'Ada',
      last: 'Lovelace',
      born: 1815
    });

    console.log('Ada added with ID:', docRef.id);

    // Voeg nog een gebruiker toe.
    const secondDocRef = await db.collection('users').add({
      first: 'Alan',
      middle: 'Mathison',
      last: 'Turing',
      born: 1912
    });

    console.log('Alan added with ID:', secondDocRef.id);

  } catch (error) {
    // Als er iets misgaat, wordt de fout hier weergegeven.
    console.error('Firestore error:', error);
  }
}

// Voer de test uit.
await testFirestore();

// --------------------------------------------------
// EXPRESS INITIALIZATION
// --------------------------------------------------

// Maak een Express-app aan.
// Discord gebruikt deze server om interacties naar je bot te sturen.
const app = express();

// Bepaal welke poort de server gebruikt.
// Als PORT niet in .env staat, wordt poort 3000 gebruikt.
const PORT = process.env.PORT || 3000;

// Houd actieve games bij.
// Bijvoorbeeld voor games die gebruikers momenteel spelen.
const activeGames = {};

// --------------------------------------------------
// DISCORD INTERACTIONS
// --------------------------------------------------

/**
 * Discord stuurt interacties naar dit endpoint.
 * verifyKeyMiddleware controleert of de request daadwerkelijk
 * van Discord afkomstig is.
 */
app.post(
  '/interactions',
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {

    // Haal de gegevens van de Discord-interactie op.
    const { id, type, data } = req.body;

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
);

// --------------------------------------------------
// START EXPRESS SERVER
// --------------------------------------------------

// Start de Express-server zodat Discord interacties
// naar onze bot kan versturen.
app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});