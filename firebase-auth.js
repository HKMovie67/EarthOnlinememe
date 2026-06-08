// ==================== Firebase Auth 輔助函數 ====================

// ── 註冊新帳戶 ──
async function firebaseRegister(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    showToast('註冊成功', `歡迎嚟到地球Online，${email}！`, 'info');
    return { success: true, user: userCredential.user };
  } catch (error) {
    let msg = '註冊失敗';
    if (error.code === 'auth/email-already-in-use') msg = '呢個電郵已經註冊咗，請直接登入';
    else if (error.code === 'auth/weak-password') msg = '密碼最少需要 6 個字元';
    else if (error.code === 'auth/invalid-email') msg = '電郵格式唔正確';
    showToast('註冊失敗', msg, 'warning');
    return { success: false, error: msg };
  }
}

// ── 登入 ──
async function firebaseLogin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    showToast('登入成功', `歡迎返嚟，${email}！`, 'info');
    return { success: true, user: userCredential.user };
  } catch (error) {
    let msg = '登入失敗';
    if (error.code === 'auth/user-not-found') msg = '搵唔到呢個帳戶，請先註冊';
    else if (error.code === 'auth/wrong-password') msg = '密碼錯誤';
    else if (error.code === 'auth/invalid-email') msg = '電郵格式唔正確';
    else if (error.code === 'auth/invalid-credential') msg = '電郵或密碼錯誤';
    showToast('登入失敗', msg, 'warning');
    return { success: false, error: msg };
  }
}

// ── 登出 ──
async function firebaseLogout() {
  try {
    await auth.signOut();
    showToast('已登出', '你嘅角色數據已經安全保存', 'info');
    return true;
  } catch (error) {
    console.error('登出失敗:', error);
    return false;
  }
}

// ── 監聽登入狀態變化 ──
function onAuthChange(callback) {
  auth.onAuthStateChanged(user => {
    if (user) {
      console.log('👤 已登入:', user.email);
      callback(user);
    } else {
      console.log('👤 未登入');
      callback(null);
    }
  });
}

// ── 獲取當前用戶 ──
function getCurrentUser() {
  return auth.currentUser;
}
