# Firebase 設置指南 — 地球Online

跟住下面步驟做，10 分鐘內搞掂。

---

## 步驟 1：開 Firebase Project

1. 去 https://console.firebase.google.com
2. 撳 **「建立專案」**（Create a project）
3. Project name 輸入 `earth-online-meme`（或者你鍾意嘅名）
4. 可以熄咗 Google Analytics（meme game 唔需要）
5. 撳 **「建立專案」**，等佢 load 完

---

## 步驟 2：開啟 Authentication

1. 左邊 menu → **「Authentication」**
2. 撳 **「開始使用」**（Get started）
3. 喺 **「登入方式」**（Sign-in method）嗰頁：
   - 撳 **「電子郵件/密碼」**（Email/Password）
   - 啟用佢 ✅
   - 撳 **「儲存」**

---

## 步驟 3：開啟 Firestore Database

1. 左邊 menu → **「Firestore Database」**
2. 撳 **「建立資料庫」**（Create database）
3. 選擇 **「以測試模式啟動」**（Start in test mode）⚠️
   - 咁樣開發階段唔使搞 security rules
   - 正式上線記得改返！
4. 揀一個 location（建議 `asia-east1` 台灣，香港連過去最快）
5. 撳 **「啟用」**

---

## 步驟 4：攞 Firebase Config

1. 左上角 ⚙️ 齒輪 → **「專案設定」**（Project settings）
2. Scroll 到下面 **「您的應用程式」**（Your apps）
3. 撳 **「</>」**（Web app icon）
4. App nickname 是但填 `earth-online-web`
5. **唔使**剔「Also set up Firebase Hosting」
6. 撳 **「註冊應用程式」**（Register app）
7. 佢會 show 一個 `firebaseConfig` object，類似咁：

```js
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "earth-online-meme.firebaseapp.com",
  projectId: "earth-online-meme",
  storageBucket: "earth-online-meme.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

---

## 步驟 5：貼上 Config

1. 打開 `firebase-config.js`
2. 將上面成個 `firebaseConfig` object **取代**入面嘅 placeholder
3. 儲存檔案

---

## 步驟 6：測試！

用任何 HTTP server 開個 game（唔可以直接 double-click HTML，Firebase Auth 要用 http/https）：

```bash
# 如果你有 Python：
cd EarthOnlinememe
python -m http.server 8080

# 或者用 npx：
npx serve .
```

然後開瀏覽器去 `http://localhost:8080`

---

## 完成後嘅遊戲流程

1. 主選單 → **開始** → Server 選擇
2. 撳 **登入** → Firebase Auth 彈窗 → 入 email + password
3. 新玩家：註冊 → 投胎動畫 → 角色生成 → 自動保存到 Firestore
4. 舊玩家：登入 → 自動載入角色 → 直接入 game
5. 角色畫面右上角：
   - 🟢 **保存** — 手動 save 到雲端
   - 🔴 **登出** — 自動保存 + 登出
6. 任務改動會 **自動保存**

---

## 注意事項

- Firebase Free Tier（Spark Plan）：
  - Auth：**無限** email/password 用戶
  - Firestore：1 GB 儲存、每日 50K reads、20K writes — meme game 夠晒用
- 如果想 deploy 上網，可以用 `firebase deploy --only hosting`
- 正式上線記得改 Firestore security rules：
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
