const express = require("express");
const line = require("@line/bot-sdk");
const timeParser = require("./modules/timeParser.js");
const addReminder = require("./modules/reminder.js");
const {
  config,
  isValidBotMention,
  replyTextMessage,
} = require("./modules/lineMessenger.js");

const app = express();

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.log("18", err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (
    event.type !== "message" ||
    event.message.type !== "text" ||
    !event.source.groupId
  )
    return;

  const { text, mention } = event.message;
  const { groupId } = event.source;

  // 使用共用函式檢查是否為有效的機器人提及
  if (!isValidBotMention(text, mention)) {
    return;
  }

  const messageForReminder = text
    .replace(/@[\S]+\s/, "")
    .trim()
    .split("提醒");

  if (messageForReminder.length === 2) {
    const timeMessage = messageForReminder[0].trim();
    const reminderMessage = messageForReminder[1].trim();

    if (!timeMessage || !reminderMessage) return;

    const parsedTime = timeParser(timeMessage);
    console.log("解析時間結果：", parsedTime);

    if (!parsedTime) {
      return replyTextMessage(
        event.replyToken,
        "設定提醒失敗：無法解析時間，請使用正確的時間格式\n" +
          "例如：\n" +
          "・一次性提醒：今天下午三點/明天上午八點/下週五晚上九點\n" +
          "・週期提醒：每週一/每星期五\n" +
          "・月期提醒：每月1號/每月15日"
      );
    }

    // 根據時間類型設定不同的提醒
    let recurrence = null;
    if (parsedTime.type === "weekly" || parsedTime.type === "monthly") {
      recurrence = {
        type: parsedTime.type,
        count: 12, // 預設執行12次
      };
    }

    // 設定提醒
    await addReminder(
      groupId,
      parsedTime.type === "once" ? parsedTime.value : new Date(), // 如果是週期性提醒，使用當前時間
      reminderMessage,
      recurrence
    );

    // 回覆確認訊息
    return replyTextMessage(
      event.replyToken,
      `已設定${parsedTime.type === "once" ? "" : "週期性"}提醒：${
        parsedTime.displayText
      } ${reminderMessage}`
    );
  }
}

app.listen(3000, () => console.log("Bot running on port 3000"));
