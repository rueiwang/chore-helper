const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, deleteDoc, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config(); // 載入環境變數

// Firebase 配置，從 Firebase Console 複製
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 操作函數
const dbOperations = {
  // 新增提醒
  async addReminder(groupId, time, message) {
    try {
      const docRef = await addDoc(collection(db, 'reminders'), {
        groupId,
        time: time.toISOString(),
        message
      });
      return docRef.id;
    } catch (err) {
      console.error('新增提醒失敗:', err);
      throw err;
    }
  },

  // 刪除提醒
  async deleteReminder(groupId, time) {
    try {
      const q = query(
        collection(db, 'reminders'),
        where('groupId', '==', groupId),
        where('time', '==', time)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => await deleteDoc(doc.ref));
    } catch (err) {
      console.error('刪除提醒失敗:', err);
      throw err;
    }
  },

  // 獲取所有提醒
  async getAllReminders() {
    try {
      const querySnapshot = await getDocs(collection(db, 'reminders'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('獲取提醒失敗:', err);
      throw err;
    }
  },

  // 新增瓦斯訂單
  async addGasOrder(groupId, time) {
    try {
      const docRef = await addDoc(collection(db, 'gas_orders'), {
        groupId,
        time: time.toISOString()
      });
      return docRef.id;
    } catch (err) {
      console.error('新增瓦斯訂單失敗:', err);
      throw err;
    }
  },

  // 獲取最近瓦斯訂單
  async getLastGasOrder(groupId) {
    try {
      const q = query(
        collection(db, 'gas_orders'),
        where('groupId', '==', groupId),
        orderBy('time', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0].data().time;
    } catch (err) {
      console.error('獲取瓦斯訂單失敗:', err);
      throw err;
    }
  }
};

module.exports = dbOperations;