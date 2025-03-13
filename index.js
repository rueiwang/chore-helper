const express = require('express');
const line = require('@line/bot-sdk');
const schedule = require('node-schedule');
const db = require('./modules/firebase.js'); // 改用 Firebase
const timeParser = require('./modules/timeParser.js');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(config);
const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.log('18', err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (
    event.type !== 'message' ||
    event.message.type !== 'text' ||
    !event.source.groupId
  )
    return;
  const { text, mention } = event.message;
  const { groupId } = event.source;

  // 只有在開頭是 @bot 或是標註機器人時才回應
  if (
    !text.trim().startsWith('@bot') ||
    (mention && !mention?.mentionees.some((mentionee) => mentionee.isSelf))
  ) {
    return;
  }

  const messageForReminder = text
    .replace(/@[\S]+\s/, '')
    .trim()
    .split('提醒');

  if (messageForReminder.length === 2) {
    const timeMessage = messageForReminder[0].trim();
    const reminderMessage = messageForReminder[1].trim();

    // 確保訊息字串是由「時間字串」＋「提醒」+ 「訊息」組成
    if (!timeMessage || !reminderMessage) return;

    const parsedTime = timeParser(timeMessage);
    console.log(parsedTime, timeMessage, reminderMessage, messageForReminder);
    // if (!parsedTime) {
    //   return client.replyMessage(event.replyToken, {
    //     type: 'text',
    //     text: '設定提醒失敗：無法解析時間，請使用「@bot 今天下午九點/明天上午八點提醒吃飯」格式',
    //   });
    // }

    // // 使用 Firebase 儲存提醒
    // await db.addReminder(groupId, parsedTime, reminderMessage);

    // // 設定排程
    // schedule.scheduleJob(parsedTime, async () => {
    //   await client.pushMessage(groupId, {
    //     type: 'text',
    //     text: `提醒：${messageForReminder}`,
    //   });
    //   await db.deleteReminder(groupId, parsedTime.toISOString());
    // });

    // return client.replyMessage(event.replyToken, {
    //   type: 'text',
    //   text: `已設定提醒：${parsedTime} ${reminderMessage}`,
    // });
  }
}

app.listen(3000, () => console.log('Bot running on port 3000'));
