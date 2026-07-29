import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";
import {
  Plan,
  DiscoveryQuestionAnswer,
  FeatureNode,
  SubFeatureNode,
  PrdDocument,
  TaskItem,
  AiChatMessage,
  User
} from "@rencanangoding/shared";

const STORE_DIR = path.join(os.homedir(), ".rencanangoding");
const STORE_FILE = path.join(STORE_DIR, "local_store.json");

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface DbOtp {
  email: string;
  code: string;
  expiresAt: number;
  verified: boolean;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
}

interface PersistedState {
  plans: Plan[];
  discoveryAnswers: Record<string, DiscoveryQuestionAnswer[]>;
  features: Record<string, FeatureNode[]>;
  prdDocuments: Record<string, PrdDocument>;
  tasks: Record<string, TaskItem[]>;
  chatMessages: Record<string, AiChatMessage[]>;
  users?: DbUser[];
  otps?: Record<string, DbOtp>;
  sessions?: Record<string, DbSession>;
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_rng_salt_2026").digest("hex");
}

class PersistentDataStore {
  private plansMap = new Map<string, Plan>();
  private discoveryMap = new Map<string, DiscoveryQuestionAnswer[]>();
  private featuresMap = new Map<string, FeatureNode[]>();
  private prdMap = new Map<string, PrdDocument>();
  private tasksMap = new Map<string, TaskItem[]>();
  private chatMap = new Map<string, AiChatMessage[]>();
  private usersMap = new Map<string, DbUser>(); // key: email
  private usersByIdMap = new Map<string, DbUser>(); // key: id
  private otpsMap = new Map<string, DbOtp>(); // key: email
  private sessionsMap = new Map<string, DbSession>(); // key: token

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        const data: PersistedState = JSON.parse(raw);

        (data.plans || []).forEach((p) => this.plansMap.set(p.id, p));
        Object.entries(data.discoveryAnswers || {}).forEach(([k, v]) => this.discoveryMap.set(k, v));
        Object.entries(data.features || {}).forEach(([k, v]) => this.featuresMap.set(k, v));
        Object.entries(data.prdDocuments || {}).forEach(([k, v]) => this.prdMap.set(k, v));
        Object.entries(data.tasks || {}).forEach(([k, v]) => this.tasksMap.set(k, v));
        Object.entries(data.chatMessages || {}).forEach(([k, v]) => this.chatMap.set(k, v));

        (data.users || []).forEach((u) => {
          this.usersMap.set(u.email.toLowerCase(), u);
          this.usersByIdMap.set(u.id, u);
        });
        Object.entries(data.otps || {}).forEach(([k, v]) => this.otpsMap.set(k.toLowerCase(), v));
        Object.entries(data.sessions || {}).forEach(([k, v]) => this.sessionsMap.set(k, v));
      }
    } catch (err) {
      console.warn("Could not load store from disk:", err);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(STORE_DIR)) {
        fs.mkdirSync(STORE_DIR, { recursive: true });
      }

      const discoveryAnswers: Record<string, DiscoveryQuestionAnswer[]> = {};
      this.discoveryMap.forEach((v, k) => (discoveryAnswers[k] = v));

      const features: Record<string, FeatureNode[]> = {};
      this.featuresMap.forEach((v, k) => (features[k] = v));

      const prdDocuments: Record<string, PrdDocument> = {};
      this.prdMap.forEach((v, k) => (prdDocuments[k] = v));

      const tasks: Record<string, TaskItem[]> = {};
      this.tasksMap.forEach((v, k) => (tasks[k] = v));

      const chatMessages: Record<string, AiChatMessage[]> = {};
      this.chatMap.forEach((v, k) => (chatMessages[k] = v));

      const otps: Record<string, DbOtp> = {};
      this.otpsMap.forEach((v, k) => (otps[k] = v));

      const sessions: Record<string, DbSession> = {};
      this.sessionsMap.forEach((v, k) => (sessions[k] = v));

      const state: PersistedState = {
        plans: Array.from(this.plansMap.values()),
        discoveryAnswers,
        features,
        prdDocuments,
        tasks,
        chatMessages,
        users: Array.from(this.usersMap.values()),
        otps,
        sessions
      };

      fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save store to disk:", err);
    }
  }

  // --- Auth Methods ---

  async getUserByEmail(email: string): Promise<User | null> {
    const dbUser = this.usersMap.get(email.toLowerCase());
    if (!dbUser) return null;
    return { id: dbUser.id, email: dbUser.email, name: dbUser.name, createdAt: dbUser.createdAt };
  }

  async requestOtp(email: string): Promise<{ code: string; expiresAt: number; isExistingUser: boolean }> {
    const cleanEmail = email.toLowerCase().trim();
    // Generate 6 digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const isExistingUser = this.usersMap.has(cleanEmail);

    const otpRecord: DbOtp = {
      email: cleanEmail,
      code,
      expiresAt,
      verified: false
    };

    this.otpsMap.set(cleanEmail, otpRecord);
    this.saveToDisk();

    return { code, expiresAt, isExistingUser };
  }

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; isExistingUser: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const otp = this.otpsMap.get(cleanEmail);

    if (!otp) {
      return { success: false, isExistingUser: false, error: "Kode OTP belum diminta atau sudah kadaluarsa" };
    }

    if (Date.now() > otp.expiresAt) {
      this.otpsMap.delete(cleanEmail);
      this.saveToDisk();
      return { success: false, isExistingUser: false, error: "Kode OTP sudah kadaluarsa, silakan minta kode baru" };
    }

    if (otp.code !== code.trim()) {
      return { success: false, isExistingUser: false, error: "Kode OTP salah, mohon periksa kembali" };
    }

    otp.verified = true;
    this.otpsMap.set(cleanEmail, otp);
    this.saveToDisk();

    const isExistingUser = this.usersMap.has(cleanEmail);
    return { success: true, isExistingUser };
  }

  async createPasswordAndRegister(
    email: string,
    otpCode: string,
    password: string,
    name?: string
  ): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const otp = this.otpsMap.get(cleanEmail);

    if (!otp || !otp.verified || otp.code !== otpCode.trim()) {
      throw new Error("Verifikasi OTP diperlukan sebelum membuat password");
    }

    const passwordHash = hashPassword(password);
    const existing = this.usersMap.get(cleanEmail);
    const now = new Date().toISOString();

    let dbUser: DbUser;

    if (existing) {
      dbUser = {
        ...existing,
        passwordHash,
        name: name || existing.name || cleanEmail.split("@")[0]
      };
    } else {
      dbUser = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        passwordHash,
        name: name || cleanEmail.split("@")[0],
        createdAt: now
      };
    }

    this.usersMap.set(cleanEmail, dbUser);
    this.usersByIdMap.set(dbUser.id, dbUser);
    this.otpsMap.delete(cleanEmail);

    // Create session
    const token = `rng_sess_${crypto.randomBytes(24).toString("hex")}`;
    const session: DbSession = {
      token,
      userId: dbUser.id,
      createdAt: now
    };
    this.sessionsMap.set(token, session);
    this.saveToDisk();

    return {
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, createdAt: dbUser.createdAt },
      token
    };
  }

  async loginWithPassword(email: string, password: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const dbUser = this.usersMap.get(cleanEmail);

    if (!dbUser) {
      throw new Error("Email belum terdaftar. Silakan minta kode OTP terlebih dahulu.");
    }

    const hash = hashPassword(password);
    if (dbUser.passwordHash !== hash) {
      throw new Error("Password yang dimasukkan salah");
    }

    const token = `rng_sess_${crypto.randomBytes(24).toString("hex")}`;
    const session: DbSession = {
      token,
      userId: dbUser.id,
      createdAt: new Date().toISOString()
    };
    this.sessionsMap.set(token, session);
    this.saveToDisk();

    return {
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, createdAt: dbUser.createdAt },
      token
    };
  }

  async getUserByToken(token: string): Promise<User | null> {
    const session = this.sessionsMap.get(token);
    if (!session) return null;

    const dbUser = this.usersByIdMap.get(session.userId);
    if (!dbUser) return null;

    return { id: dbUser.id, email: dbUser.email, name: dbUser.name, createdAt: dbUser.createdAt };
  }

  async revokeSession(token: string): Promise<boolean> {
    const deleted = this.sessionsMap.delete(token);
    this.saveToDisk();
    return deleted;
  }

  // --- Plans & Application Data ---

  async createPlan(input: Partial<Plan>): Promise<Plan> {
    const id = input.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const plan: Plan = {
      id,
      userId: input.userId || "demo-user",
      name: input.name || (input.rawIdea ? input.rawIdea.slice(0, 35) + "..." : "Plan Baru"),
      rawIdea: input.rawIdea || "",
      outputLanguage: input.outputLanguage || "id",
      techPreference: input.techPreference || "ai_choice",
      techStackJson: input.techStackJson || null,
      status: input.status || "draft",
      createdAt: now,
      updatedAt: now
    };
    this.plansMap.set(id, plan);
    this.saveToDisk();
    return plan;
  }

  async getPlan(id: string): Promise<Plan | null> {
    return this.plansMap.get(id) || null;
  }

  async updatePlan(id: string, updates: Partial<Plan>): Promise<Plan | null> {
    const existing = this.plansMap.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.plansMap.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  async listPlans(userId?: string): Promise<Plan[]> {
    const allPlans = Array.from(this.plansMap.values());
    if (!userId) {
      return allPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return allPlans
      .filter((p) => !p.userId || p.userId === userId || p.userId === "demo-user")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deletePlan(id: string): Promise<boolean> {
    const existed = this.plansMap.delete(id);
    this.discoveryMap.delete(id);
    this.featuresMap.delete(id);
    this.prdMap.delete(id);
    this.tasksMap.delete(id);
    this.chatMap.delete(id);
    this.saveToDisk();
    return existed;
  }

  async saveDiscoveryAnswers(
    planId: string,
    answers: { questionIndex: number; questionText: string; answerText: string; suggestedChips?: string[] }[]
  ): Promise<DiscoveryQuestionAnswer[]> {
    const list: DiscoveryQuestionAnswer[] = answers.map((a) => ({
      id: crypto.randomUUID(),
      planId,
      questionIndex: a.questionIndex,
      questionText: a.questionText,
      suggestedChips: a.suggestedChips || [],
      answerText: a.answerText
    }));
    this.discoveryMap.set(planId, list);
    await this.updatePlan(planId, { status: "discovery_ready" });
    this.saveToDisk();
    return list;
  }

  async getDiscoveryAnswers(planId: string): Promise<DiscoveryQuestionAnswer[]> {
    return this.discoveryMap.get(planId) || [];
  }

  async saveFeatures(planId: string, features: FeatureNode[]): Promise<FeatureNode[]> {
    this.featuresMap.set(planId, features);
    await this.updatePlan(planId, { status: "structure_ready" });
    this.saveToDisk();
    return features;
  }

  async getFeatures(planId: string): Promise<FeatureNode[]> {
    return this.featuresMap.get(planId) || [];
  }

  async savePrd(planId: string, markdown: string): Promise<PrdDocument> {
    const existing = this.prdMap.get(planId);
    const now = new Date().toISOString();
    const doc: PrdDocument = {
      id: existing ? existing.id : crypto.randomUUID(),
      planId,
      contentMarkdown: markdown,
      version: existing ? existing.version + 1 : 1,
      isPublic: existing ? existing.isPublic : false,
      publicSlug: existing ? existing.publicSlug : `prd-${planId.slice(0, 8)}`,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
    this.prdMap.set(planId, doc);
    await this.updatePlan(planId, { status: "prd_ready" });
    this.saveToDisk();
    return doc;
  }

  async getPrd(planId: string): Promise<PrdDocument | null> {
    return this.prdMap.get(planId) || null;
  }

  async getPrdBySlug(slug: string): Promise<PrdDocument | null> {
    for (const doc of this.prdMap.values()) {
      if (doc.publicSlug === slug && doc.isPublic) {
        return doc;
      }
    }
    return null;
  }

  async togglePrdPublic(planId: string, isPublic: boolean): Promise<PrdDocument | null> {
    const prd = this.prdMap.get(planId);
    if (!prd) return null;
    prd.isPublic = isPublic;
    if (!prd.publicSlug) {
      prd.publicSlug = `prd-${planId.slice(0, 8)}`;
    }
    this.prdMap.set(planId, prd);
    this.saveToDisk();
    return prd;
  }

  async saveTasks(planId: string, tasks: TaskItem[]): Promise<TaskItem[]> {
    this.tasksMap.set(planId, tasks);
    await this.updatePlan(planId, { status: "tasks_ready" });
    this.saveToDisk();
    return tasks;
  }

  async getTasks(planId: string): Promise<TaskItem[]> {
    return this.tasksMap.get(planId) || [];
  }

  async updateTaskStatus(
    planId: string,
    ref: string,
    status: TaskItem["status"],
    failReason?: string
  ): Promise<TaskItem | null> {
    const list = this.tasksMap.get(planId) || [];
    const task = list.find((t) => t.ref === ref);
    if (!task) return null;
    task.status = status;
    if (failReason !== undefined) {
      task.failReason = failReason;
    }
    task.updatedAt = new Date().toISOString();
    this.saveToDisk();
    return task;
  }

  async addChatMessage(planId: string, role: "user" | "assistant", content: string): Promise<AiChatMessage> {
    const list = this.chatMap.get(planId) || [];
    const msg: AiChatMessage = {
      id: crypto.randomUUID(),
      planId,
      role,
      content,
      createdAt: new Date().toISOString()
    };
    list.push(msg);
    this.chatMap.set(planId, list);
    this.saveToDisk();
    return msg;
  }

  async getChatMessages(planId: string): Promise<AiChatMessage[]> {
    return this.chatMap.get(planId) || [];
  }
}

// GlobalThis Singleton to prevent Next.js HMR resets
const globalForDb = globalThis as unknown as {
  dbStore: PersistentDataStore | undefined;
};

export const dbStore = globalForDb.dbStore ?? new PersistentDataStore();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbStore = dbStore;
}
