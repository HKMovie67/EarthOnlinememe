// ==================== Firestore 角色數據儲存 ====================

// ── 保存角色數據 ──
async function saveCharacterToCloud(characterData) {
  const user = getCurrentUser();
  if (!user) {
    showToast('儲存失敗', '請先登入', 'warning');
    return false;
  }
  try {
    const docRef = db.collection('users').doc(user.uid);
    await docRef.set({
      character: characterData,
      email: user.email,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('💾 角色已保存到雲端');
    return true;
  } catch (error) {
    console.error('保存失敗:', error);
    showToast('儲存失敗', '無法連接到伺服器，請檢查網絡', 'warning');
    return false;
  }
}

// ── 載入角色數據 ──
async function loadCharacterFromCloud() {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    const docRef = db.collection('users').doc(user.uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      console.log('📥 已從雲端載入角色');
      
      // Update last login time
      await docRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      return data.character;
    }
    return null; // 新用戶，未有角色
  } catch (error) {
    console.error('載入失敗:', error);
    showToast('載入失敗', '無法連接到伺服器', 'warning');
    return null;
  }
}

// ── 檢查用戶有冇已保存嘅角色 ──
async function hasSavedCharacter() {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    const docSnap = await db.collection('users').doc(user.uid).get();
    return docSnap.exists && docSnap.data().character;
  } catch {
    return false;
  }
}

// ── 打包當前角色狀態 ──
function packCharacterState() {
  return {
    gender: playerContext.gender,
    wealth: playerContext.wealth,
    constitution: playerContext.constitution,
    years: playerContext.years,
    love: playerContext.love,
    achievements: playerContext.achievements,
    traits: playerTraits.map(t => ({ id: t.id, title: t.title, desc: t.desc, type: t.type })),
    activeMissions: activeMissions.map(m => ({
      id: m.id, name: m.name, done: m.done, status: m.status
    })),
    simulatedHistory: simulatedHistory,
    createdAt: playerContext.createdAt || new Date().toISOString()
  };
}

// ── 解包角色狀態 ──
function unpackCharacterState(data) {
  if (!data) return;
  
  playerContext.gender = data.gender || '男';
  playerContext.wealth = data.wealth || 50000;
  playerContext.constitution = data.constitution || 80;
  playerContext.years = data.years || 15;
  playerContext.love = data.love || 'A0';
  playerContext.achievements = data.achievements || [];
  playerContext.createdAt = data.createdAt;
  
  playerTraits = (data.traits || []).map(t => ({
    id: t.id, title: t.title, desc: t.desc, type: t.type
  }));

  simulatedHistory = data.simulatedHistory || [];

  // 恢復任務狀態
  if (data.activeMissions && data.activeMissions.length > 0) {
    activeMissions = missionsData.map(m => {
      const saved = data.activeMissions.find(sm => sm.id === m.id);
      if (saved) {
        return { ...m, done: saved.done, status: saved.status, showWarning: false };
      }
      return { ...m, done: 0, status: 'available', showWarning: false };
    });
  }
}

// ── 刪除角色 (重新投胎) ──
async function deleteCharacterFromCloud() {
  const user = getCurrentUser();
  if (!user) return false;

  try {
    await db.collection('users').doc(user.uid).update({
      character: firebase.firestore.FieldValue.delete()
    });
    showToast('角色已刪除', '可以重新投胎', 'info');
    return true;
  } catch (error) {
    console.error('刪除失敗:', error);
    return false;
  }
}
