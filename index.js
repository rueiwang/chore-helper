const express = require('express');
const line = require('@line/bot-sdk');
const schedule = require('node-schedule');
const db = require('./firebase.js'); // 改用 Firebase

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new line.Client(config);
const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ success: true }))
    .catch(err => res.status(500).end());
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text' || !event.source.groupId) return;

  const text = event.message.text;
  if (text.startsWith('@bot')) {
    const command = text.replace('@bot', '').trim();
    const timeMatch = command.match(/(\d+點|明天\d+點)/);
    const msgMatch = command.match(/提醒(.+)/);
    if (timeMatch && msgMatch) {
      const time = parseTime(timeMatch[0]);
      const message = msgMatch[1];
      const groupId = event.source.groupId;

      // 使用 Firebase 儲存提醒
      await db.addReminder(groupId, time, message);

      // 設定排程
      schedule.scheduleJob(time, async () => {
        await client.pushMessage(groupId, { type: 'text', text: `提醒：${message}` });
        await db.deleteReminder(groupId, time.toISOString());
      });

      return client.replyMessage(event.replyToken, { type: 'text', text: `已設定提醒：${time} ${message}` });
    }
  }

}

function parseTime(input) {
  const now = new Date();
  if (input.includes('明天')) {
    now.setDate(now.getDate() + 1);
  }
  const hour = parseInt(input.match(/\d+/)[0]);
  now.setHours(hour, 0, 0, 0);
  return now;
}

app.listen(3000, () => console.log('Bot running on port 3000'));