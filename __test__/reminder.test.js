const addReminder = require("../modules/reminder.js");
const timeParser = require("../modules/timeParser.js");
const { sendTextMessage } = require("../modules/lineMessenger.js");

// Mock LINE 訊息發送功能
jest.mock("../modules/lineMessenger.js", () => ({
  sendTextMessage: jest.fn().mockResolvedValue(true),
}));

// Mock Firebase 操作
jest.mock("../modules/firebase.js", () => ({
  addReminder: jest.fn().mockResolvedValue(true),
  deleteReminder: jest.fn().mockResolvedValue(true),
}));

describe("Reminder Tests", () => {
  const mockGroupId = "test-group-id";

  beforeEach(() => {
    // 清除所有 mock 的調用記錄
    jest.clearAllMocks();
    // 模擬時間為 2024-05-20 星期一 10:00
    jest.useFakeTimers().setSystemTime(new Date("2024-05-20T10:00:00"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("週期性提醒（每週）應該在正確的時間觸發", async () => {
    // 設定每週一 15:00 的提醒
    const timeMessage = "每週一";
    const reminderMessage = "寫週報";

    const parsedTime = timeParser(timeMessage);
    const recurrence = {
      type: parsedTime.type,
      count: 2, // 測試用，只執行兩次
    };

    await addReminder(mockGroupId, new Date(), reminderMessage, recurrence);

    // 快轉到下週一 15:00
    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);

    // 驗證是否發送了提醒
    expect(sendTextMessage).toHaveBeenCalledWith(
      mockGroupId,
      expect.stringContaining("第1次週循環提醒：寫週報")
    );

    // 快轉到再下一週
    jest.advanceTimersByTime(7 * 24 * 60 * 60 * 1000);

    // 驗證第二次提醒
    expect(sendTextMessage).toHaveBeenCalledWith(
      mockGroupId,
      expect.stringContaining("第2次週循環提醒：寫週報")
    );

    // 驗證完成訊息
    expect(sendTextMessage).toHaveBeenCalledWith(
      mockGroupId,
      expect.stringContaining("已完成2次循環提醒")
    );
  });

  test("週期性提醒（每月）應該在正確的時間觸發", async () => {
    // 設定每月1號 10:00 的提醒
    const timeMessage = "每月1號";
    const reminderMessage = "繳房租";

    const parsedTime = timeParser(timeMessage);
    const recurrence = {
      type: parsedTime.type,
      count: 2,
    };

    await addReminder(mockGroupId, new Date(), reminderMessage, recurrence);

    // 快轉到下個月1號
    jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);

    // 驗證是否發送了提醒
    expect(sendTextMessage).toHaveBeenCalledWith(
      mockGroupId,
      expect.stringContaining("第1次月循環提醒：繳房租")
    );
  });

  test("一次性提醒應該只觸發一次", async () => {
    // 設定明天下午三點的提醒
    const timeMessage = "明天下午三點";
    const reminderMessage = "開會";

    const parsedTime = timeParser(timeMessage);

    await addReminder(mockGroupId, parsedTime.value, reminderMessage);

    // 快轉到明天下午三點
    jest.advanceTimersByTime(29 * 60 * 60 * 1000);

    // 驗證是否發送了提醒
    expect(sendTextMessage).toHaveBeenCalledWith(
      mockGroupId,
      expect.stringContaining("提醒：開會")
    );

    // 快轉一天
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);

    // 驗證沒有再次發送提醒
    expect(sendTextMessage).toHaveBeenCalledTimes(1);
  });
});
