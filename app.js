import 'dotenv/config';
import express from 'express';
import { InteractionType, InteractionResponseType, verifyKeyMiddleware } from 'discord-interactions';
import { getRandomEmoji } from './utils.js';
import { db } from './db.js';
import { DiscordRequest } from './utils.js';

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
    let discordUser = req.body.user;
    if (req.body.member) {
      discordUser = req.body.member.user;
    }
    let uitslag;
    let gifUrl;
    const userRef = db.collection('users').doc(discordUser.id);
    const spel = data.options[0];
    const inzet = spel.options.find(optie => optie.name === 'inzet').value;
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.send({ type: 4, data: { content: "Je hebt nog geen coins" } });
    }

    if (inzet > userDoc.data().coins) {
      return res.send({ type: 4, data: { content: "Je hebt niet genoeg" } });
    }

    if (spel.name === 'slotmachine') {
      const random = Math.floor(Math.random() * 4);
      let uitslag;

      if (random === 0) {
        const random2 = Math.floor(Math.random() * 25);
        if (random2 === 0) {
          await userRef.update({ coins: userDoc.data().coins + inzet * 10 });
          uitslag = `Je hebt een jackpot!!! ${inzet * 10} coins gewonnen!!!`;
          gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXkzaGN0cDVha2ZtZHlkeDIzc3huN3ozb2x0ZTlrMzBwY2UxeW93ZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/cLYAs7gtaEunQqRt1G/giphy.gif";
        } else {
          await userRef.update({ coins: userDoc.data().coins + inzet * 4 });
          uitslag = `Je hebt ${inzet * 4} coins gewonnen!`;
          gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWRzbzl3dmVjZ2d0a2hrY2U4M2xhaGplaGhiZmtld2VoMnFtcXdsMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lZTvTGEGKU6gnQ2wBr/giphy.gif";
        }
      } else {
        await userRef.update({ coins: userDoc.data().coins - inzet });
        uitslag = `Je hebt ${inzet} coins verloren!`;
        gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa240aGY3Mmh3aXE5ZzJubGkycmdidjRlNnQ1d28zZXN3d3MxaThxOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b7lMFJAqk5ERqtkf1o/giphy.gif";
      }

      res.send({
        type: 4,
        data: {
          content: 'De slotmachine draait..',
          embeds: [{ image: { url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaXkzaGN0cDVha2ZtZHlkeDIzc3huN3ozb2x0ZTlrMzBwY2UxeW93ZyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EahYBxGgJHLZ6/giphy.gif' } }],
        },
      });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
      method: 'PATCH',
      body: {
        content: uitslag,
        embeds: gifUrl ? [
          {
            image: {
              url: gifUrl
            }
          }
        ] : [],
      },
    });
    return;
    }

  if (spel.name === 'roulette') {
  const random = Math.floor(Math.random() * 3);
  let uitslag;
  let gifUrl;

  const kleur = spel.options.find(optie => optie.name === 'kleur').value;

  let resultaat;

  if (random == 0) {
    resultaat = 'groen';
  } else if (random == 1) {
    resultaat = 'rood';
  } else {
    resultaat = 'zwart';
  }

  if (kleur === resultaat) {
      const winst = inzet * 3;

      await userRef.update({
        coins: userDoc.data().coins + winst
      });

      uitslag = `Je hebt gewonnen! Je wint ${winst} coins!`;
      gifUrl = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWRzbzl3dmVjZ2d0a2hrY2U4M2xhaGplaGhiZmtld2VoMnFtcXdsMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lZTvTGEGKU6gnQ2wBr/giphy.gif';

    } else {
      await userRef.update({
        coins: userDoc.data().coins - inzet
      });

      uitslag = `Je hebt verloren! Je verliest ${inzet} coins.`;
      gifUrl = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa240aGY3Mmh3aXE5ZzJubGkycmdidjRlNnQ1d28zZXN3d3MxaThxOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/b7lMFJAqk5ERqtkf1o/giphy.gif';
    }

    res.send({
      type: 4,
      data: {
        content: 'De roulette draait...',
        embeds: [{
          image: {
            url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZmw3Zmc2aWZlaW02dHk5eXhtaDY3cWpkbWNuNDFyYWY0OHlhMWNvbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/d46C5wf3bjVK8pR6/giphy.gif'
          }
        }]
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
      method: 'PATCH',
      body: {
        content: uitslag,
        embeds: [{
          image: {
            url: gifUrl
          }
        }]
      }
    });

    return;
  }
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