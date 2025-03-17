const line = require("@line/bot-sdk");

/**
 * LINE Bot 客戶端配置
 * @type {Object}
 */
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

/**
 * 發送文字訊息
 * @param {string} groupId - LINE 群組 ID
 * @param {string} message - 要發送的文字訊息
 * @returns {Promise} - LINE API 回應
 */
async function sendTextMessage(groupId, message) {
  return client.pushMessage(groupId, {
    type: "text",
    text: message,
  });
}

/**
 * 回覆文字訊息
 * @param {string} replyToken - LINE 回覆 Token
 * @param {string} message - 要回覆的文字訊息
 * @returns {Promise} - LINE API 回應
 */
async function replyTextMessage(replyToken, message) {
  return client.replyMessage(replyToken, {
    type: "text",
    text: message,
  });
}

/**
 * 驗證是否為有效的 LINE Bot 提及
 * @param {string} text - 訊息文字
 * @param {Object} mention - LINE 提及資訊
 * @returns {boolean} - 是否為有效的機器人提及
 */
function isValidBotMention(text, mention) {
  return (
    text.trim().startsWith("@bot") ||
    (mention && mention?.mentionees?.some((mentionee) => mentionee.isSelf))
  );
}

module.exports = {
  config,
  client,
  sendTextMessage,
  replyTextMessage,
  isValidBotMention,
};
