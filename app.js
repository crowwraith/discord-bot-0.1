import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    if (name === 'test') {
      return res.send({ type: 4, data: { content: `hello world ${getRandomEmoji()}` } });
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
        return res.send({ type: 4, data: { content: "Je hebt je dagelijkse coins al geclaimd!" } });
      }

      const userDoc = await userRef.get();
      if (userDoc.exists) {
        await userRef.update({ coins: userDoc.data().coins + 100 });
      } else {
        await userRef.set({ username: discordUser.username, coins: 100, createdAt: new Date() });
      }

      await claimRef.set({ datum: vandaag });
      return res.send({ type: 4, data: { content: "Je hebt je dagelijkse 100 coins geclaimd!" } });
    }

    if (name === 'balance') {
      const userDoc = await db.collection('users').doc(req.body.member.user.id).get();

      if (!userDoc.exists) {
        return res.send({ type: 4, data: { content: "Je hebt nog geen coins!" } });
      }

      return res.send({ type: 4, data: { content: `Je hebt ${userDoc.data().coins} coins` } });
    }

    if (name === 'play') {
      
    }

    if (name === 'balance') {
      const userDoc = await db.collection('users').doc(req.body.member.user.id).get();

      if (!userDoc.exists) {
        return res.send({ type: 4, data: { content: "Je hebt nog geen coins!" } });
      }

      return res.send({ type: 4, data: { content: `Je hebt ${userDoc.data().coins} coins` } });
    }
  }

  return res.status(400).json({ error: 'onbekend verzoek' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});