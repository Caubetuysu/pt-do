import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';

export interface Quest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  badge: string;
  expiresAt: Date;
}

// Weekly quests pool
const QUEST_POOL: Omit<Quest, 'id' | 'currentCount' | 'completed' | 'expiresAt'>[] = [
  { title: 'Cú Đêm', description: 'Check-in sau 10 giờ tối', emoji: '🦉', targetCount: 2, badge: '🦉 Cú Đêm' },
  { title: 'Dậy Sớm', description: 'Check-in trước 7 giờ sáng', emoji: '🌅', targetCount: 2, badge: '🌅 Dậy Sớm' },
  { title: 'Người Lang Thang', description: 'Check-in 5 địa điểm khác nhau trong tuần', emoji: '🚶', targetCount: 5, badge: '🚶 Người Lang Thang' },
  { title: 'Lữ Khách Xa', description: 'Đi hơn 50km trong tuần', emoji: '🚗', targetCount: 50, badge: '🚗 Lữ Khách Xa' },
  { title: 'Sáng Tạo', description: 'Check-in với ghi chú dài hơn 20 chữ', emoji: '✍️', targetCount: 3, badge: '✍️ Nhà Văn' },
  { title: 'Tập Thể Dục', description: 'Check-in lúc sáng sớm 3 ngày liên tiếp', emoji: '💪', targetCount: 3, badge: '💪 Sức Khỏe' },
  { title: 'Mọt Cafe', description: 'Check-in địa điểm có từ "cafe" hoặc "cà phê"', emoji: '☕', targetCount: 3, badge: '☕ Tín Đồ Cafe' },
];

export interface CustomQuest {
  id: string;
  uid: string;
  title: string;
  emoji: string;
  targetCount: number;
  currentCount: number;
  type: 'checkin' | 'km'; // 'checkin' = count check-ins, 'km' = distance
  completed: boolean;
  createdAt: Date | null;
}

const CUSTOM_QUESTS_COLLECTION = 'custom_quests';

const QUESTS_COLLECTION = 'quests';

export const questService = {
  // Get or assign quests for the current week
  async getWeeklyQuests(uid: string): Promise<Quest[]> {
    const weekKey = getWeekKey();
    const q = query(
      collection(db, QUESTS_COLLECTION, uid, 'weekly'),
      where('weekKey', '==', weekKey)
    );
    const snap = await getDocs(q);
    
    if (snap.docs.length > 0) {
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        expiresAt: d.data().expiresAt?.toDate() || new Date()
      }) as Quest);
    }

    // Generate new quests for this week
    const selectedQuests = shuffleArray(QUEST_POOL).slice(0, 3);
    const expiresAt = getEndOfWeek();
    const results: Quest[] = [];

    for (const quest of selectedQuests) {
      const ref = await addDoc(collection(db, QUESTS_COLLECTION, uid, 'weekly'), {
        ...quest,
        weekKey,
        currentCount: 0,
        completed: false,
        expiresAt: Timestamp.fromDate(expiresAt)
      });
      results.push({
        id: ref.id,
        ...quest,
        currentCount: 0,
        completed: false,
        expiresAt
      });
    }
    return results;
  },

  // Check and update quest progress after a new check-in
  async updateQuestProgress(uid: string, activityText: string, distanceKm: number, hour: number): Promise<string[]> {
    const quests = await this.getWeeklyQuests(uid);
    const newBadges: string[] = [];

    for (const quest of quests) {
      if (quest.completed) continue;

      let progress = false;
      if (quest.title === 'Cú Đêm' && hour >= 22) progress = true;
      if (quest.title === 'Dậy Sớm' && hour < 7) progress = true;
      if (quest.title === 'Người Lang Thang') progress = true; // count each checkin
      if (quest.title === 'Lữ Khách Xa' && distanceKm > 0) progress = true;
      if (quest.title === 'Sáng Tạo' && activityText.length > 20) progress = true;
      if (quest.title === 'Tập Thể Dục' && hour < 7) progress = true;
      if (quest.title === 'Mọt Cafe' && (activityText.toLowerCase().includes('cafe') || activityText.toLowerCase().includes('cà phê') || activityText.toLowerCase().includes('coffee'))) progress = true;

      if (progress) {
        const newCount = quest.currentCount + (quest.title === 'Lữ Khách Xa' ? distanceKm : 1);
        const completed = newCount >= quest.targetCount;
        
        await setDoc(doc(db, QUESTS_COLLECTION, uid, 'weekly', quest.id), {
          currentCount: newCount,
          completed
        }, { merge: true });

        if (completed && !quest.completed) {
          newBadges.push(quest.badge);
        }
      }
    }
    return newBadges;
  },

  // ---- Custom Quests ----
  async addCustomQuest(uid: string, quest: Pick<CustomQuest, 'title' | 'emoji' | 'targetCount' | 'type'>): Promise<string> {
    const ref = await addDoc(collection(db, CUSTOM_QUESTS_COLLECTION), {
      uid,
      ...quest,
      currentCount: 0,
      completed: false,
      createdAt: serverTimestamp()
    });
    return ref.id;
  },

  async getCustomQuests(uid: string): Promise<CustomQuest[]> {
    const q = query(collection(db, CUSTOM_QUESTS_COLLECTION), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || null
    }) as CustomQuest);
  },

  async updateCustomQuestProgress(uid: string, distanceKm: number): Promise<void> {
    const quests = await this.getCustomQuests(uid);
    for (const quest of quests) {
      if (quest.completed) continue;
      const increment = quest.type === 'km' ? distanceKm : 1;
      if (increment === 0 && quest.type === 'km') continue;
      const newCount = quest.currentCount + increment;
      const completed = newCount >= quest.targetCount;
      await updateDoc(doc(db, CUSTOM_QUESTS_COLLECTION, quest.id), { currentCount: newCount, completed });
    }
  },

  async deleteCustomQuest(questId: string): Promise<void> {
    await deleteDoc(doc(db, CUSTOM_QUESTS_COLLECTION, questId));
  },

  async resetCustomQuest(questId: string): Promise<void> {
    await updateDoc(doc(db, CUSTOM_QUESTS_COLLECTION, questId), { currentCount: 0, completed: false });
  }
};

function getWeekKey(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

function getEndOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const end = new Date(now);
  end.setDate(now.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  return end;
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}
