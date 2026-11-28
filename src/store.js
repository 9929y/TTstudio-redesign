// 全局状态：导航栈、筛选、日期范围、草稿、定时任务、已读、研究开关
// 切 Tab / 返回时这些状态都保留（实录 #13 #23 #26）
import { create } from 'zustand';
import { INBOX_SEED, NOW, SEED_DRAFTS } from './data/seed.js';

let keySeq = 1;
const mk = (name, params = {}) => ({ key: `r${keySeq++}`, name, params });

const initialManage = () => ({
  tab: 'posts',
  sort: 'newest',          // newest | views | likes | comments | oldest（91F_0225）
  privacy: 'all',          // all | everyone | friends | only_you（原型假设）
  views: null,             // { op: 'more'|'less', n }（o1g_0248）
  replies: 'all',          // all | not_replied | replied（91F_0309）
  postedBy: 'all',         // all | followers | non_followers（91F 3:20）
  followerCount: [],       // ['lt5k','5k10k','10k100k','gt100k']（91F_0349 多选 + Aplicar）
});

export const useApp = create((set, get) => ({
  // ---- 启动 ----
  booted: false,
  boot: () => set({ booted: true }),

  // ---- 导航 ----
  tab: 'home',
  stacks: { home: [], analytics: [], create: [], inbox: [], manage: [], monetise: [] },
  modal: [],               // 上传流程等全屏模态栈
  popping: null,           // 正在执行返回动画的路由 key
  switchTab: (tab) => {
    const s = get();
    if (s.tab === tab) {
      // V4 美国版：在全屏视频流里再点 Home，回到 Home 页（原型假设）
      if (tab === 'home' && s.market === 'store' && s.homeTab !== 'home' && !s.stacks.home.length) { set({ homeTab: 'home' }); return; }
      // 再点当前 Tab：回到根（iOS 惯例，原型假设）
      if (s.stacks[tab].length) set({ stacks: { ...s.stacks, [tab]: [] } });
      else set({ scrollTopSignal: { tab, t: Date.now() } });
      return;
    }
    set({ tab });
  },
  scrollTopSignal: null,
  push: (name, params) => {
    const s = get();
    if (s.modal.length) return set({ modal: [...s.modal, mk(name, params)] });
    set({ stacks: { ...s.stacks, [s.tab]: [...s.stacks[s.tab], mk(name, params)] } });
  },
  pop: () => {
    const s = get();
    if (s.modal.length > 1) return set({ modal: s.modal.slice(0, -1) });
    if (s.modal.length === 1) return set({ modal: [] });
    const st = s.stacks[s.tab];
    if (!st.length) return;
    set({ stacks: { ...s.stacks, [s.tab]: st.slice(0, -1) } });
  },
  openModal: (name, params) => set({ modal: [mk(name, params)] }),
  closeModal: () => set({ modal: [] }),
  resetTab: (tab) => set((s) => ({ stacks: { ...s.stacks, [tab]: [] } })),

  // ---- 弹层 / 提示 ----
  sheet: null,             // { type, props }
  openSheet: (type, props = {}) => set({ sheet: { type, props, id: Date.now() } }),
  closeSheet: () => set({ sheet: null }),
  alert: null,             // { title, message, actions:[{label, bold, onPress}] }
  showAlert: (a) => set({ alert: a }),
  closeAlert: () => set({ alert: null }),
  toast: null,             // { kind: 'pill'|'center', text, id }
  showToast: (text, kind = 'pill') => {
    const id = Date.now();
    set({ toast: { text, kind, id } });
    setTimeout(() => { if (get().toast?.id === id) set({ toast: null }); }, kind === 'center' ? 1800 : 2000);
  },

  // ---- Analytics ----
  aTab: 'overview',
  range: { key: '7' },
  rangeToken: 0,           // 每次改区间 +1，触发骨架屏回填
  setRange: (range) => set((s) => ({ range, rangeToken: s.rangeToken + 1 })),
  setATab: (aTab) => set({ aTab }),
  kpiSel: { overview: null, viewers: 'viewers', followers: 'followersTotal' },
  // Overview 默认一张都不选（评分图联动 2026-11-26，Yanice 确认）：趋势图仍显示第一张 Post views，选中评分图某一维度时才选中对应的卡
  setKpiSel: (tab, key) => set((s) => ({ kpiSel: { ...s.kpiSel, [tab]: key } })),
  topMetric: 'views',
  topToken: 0,
  setTopMetric: (m) => set((s) => ({ topMetric: m, topToken: s.topToken + 1 })),
  // 评分图与下方数据双向联动（2026-11-26）：在下方换卡 / 换排序时，让上面的评分图回到总览
  roseClear: { A: 0, B: 0 },
  clearRose: (which) => set((s) => ({ roseClear: { ...s.roseClear, [which]: s.roseClear[which] + 1 } })),
  insightPill: { viewers: 'Locations', followers: 'Gender' },
  setInsightPill: (tab, v) => set((s) => ({ insightPill: { ...s.insightPill, [tab]: v } })),

  // ---- Manage ----
  manage: initialManage(),
  setManage: (patch) => set((s) => ({ manage: { ...s.manage, ...patch }, manageToken: s.manageToken + 1 })),
  manageToken: 0,

  // ---- 用户产生的数据 ----
  userPosts: [],           // 新发布 / 定时的作品（插到 Manage 顶部）
  drafts: SEED_DRAFTS,
  addDraft: (d) => set((s) => ({ drafts: [d, ...s.drafts] })),
  removeDraft: (id) => set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),
  addUserPost: (p) => set((s) => ({ userPosts: [p, ...s.userPosts] })),
  updateUserPost: (id, patch) => set((s) => ({ userPosts: s.userPosts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  replies: {},             // commentId -> [{text,time}]
  addReply: (cid, text) => set((s) => ({ replies: { ...s.replies, [cid]: [...(s.replies[cid] || []), { text, time: new Date(NOW) }] } })),
  commentLikes: {},        // commentId -> bool
  toggleCommentLike: (cid, init) => set((s) => ({ commentLikes: { ...s.commentLikes, [cid]: !(s.commentLikes[cid] ?? init) } })),
  commentDislikes: {},
  toggleCommentDislike: (cid) => set((s) => ({ commentDislikes: { ...s.commentDislikes, [cid]: !s.commentDislikes[cid] } })),
  // V4 子流程：Creator Assistant / 作品与评论操作 / 评论洞察开关
  assistantDismissed: {}, assistantThread: [], assistantOpened: false, postEdits: {}, deletedComments: {}, commentInsightsOn: true, 
  inbox: INBOX_SEED,
  markRead: (id) => set((s) => ({ inbox: s.inbox.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
  inboxFilter: 'all',
  setInboxFilter: (f) => set({ inboxFilter: f }),
  feedLikes: {},
  toggleFeedLike: (id) => set((s) => ({ feedLikes: { ...s.feedLikes, [id]: !s.feedLikes[id] } })),
  feedSaves: {},
  toggleFeedSave: (id) => set((s) => ({ feedSaves: { ...s.feedSaves, [id]: !s.feedSaves[id] } })),
  homeTab: 'home',
  setHomeTab: (t) => set({ homeTab: t }),
  feedIndex: { home: 0, inspiration: 0, trending: 0 },
  setFeedIndex: (k, i) => set((s) => ({ feedIndex: { ...s.feedIndex, [k]: i } })),
  scroll: {},              // 每个页面的滚动位置
  saveScroll: (k, y) => { get().scroll[k] = y; },

  // ---- 研究开关 ----
  // V4：市场变体。默认 'us' = 美国 iPhone 真机录屏（2026-11-22，用户提供，最高优先级）；
  // 'store' = App Store 美国区宣传图（画面早于 2026 录屏，作旧版对照）
  market: 'us',
  seenTagsTip: false,
  chipSel: {},             // 搜索 / 奖励页筛选胶囊的选择      // Creator inspiration 首次进入的「Video tags…」引导（usrec 0:10）
  homeScrolled: false,     // Home 仪表盘滚动后顶栏变白（usrec 0:02）
  legacyIA: false,         // 2024–25 IA：Monetise 代替 Inbox
  newAccount: false,       // 新账号：Data is processing（ioQ_0034）
  detailEntry: 'analysis', // 'analysis'（Android 证据）| 'player'（2024 iOS：全屏播放器 + More data）
  hotspots: false,
  welcomeArt: 'a',         // 2026-11-26 欢迎页插图三版：a 线稿 / b 素材拼贴 / c 产品卡片（研究面板切换）
  setResearch: (patch) => set((s) => {
    const next = { ...patch };
    const legacy = patch.legacyIA ?? s.legacyIA, market = patch.market ?? s.market;
    const monet = legacy || market === 'store';
    if (monet && s.tab === 'inbox') next.tab = 'monetise';
    if (!monet && s.tab === 'monetise') next.tab = 'inbox';
    if (patch.market === 'store') { if (s.aTab === 'viewers') next.aTab = 'overview'; if (s.range.key === '365') { next.range = { key: '7' }; next.rangeToken = s.rangeToken + 1; } }
    if (patch.market === 'us') { if (s.aTab === 'live') next.aTab = 'overview'; if (s.homeTab === 'trending') next.homeTab = 'home'; }
    if (patch.newAccount !== undefined) next.rangeToken = s.rangeToken + 1;
    return next;
  }),
  resetAll: () => set({
    booted: false, tab: 'home', stacks: { home: [], analytics: [], create: [], inbox: [], manage: [], monetise: [] }, modal: [],
    sheet: null, alert: null, toast: null, aTab: 'overview', range: { key: '7' }, manage: initialManage(),
    userPosts: [], drafts: SEED_DRAFTS, replies: {}, inbox: INBOX_SEED, commentLikes: {}, commentDislikes: {}, scroll: {}, homeTab: 'home',
    kpiSel: { overview: null, viewers: 'viewers', followers: 'followersTotal' }, topMetric: 'views',
    assistantDismissed: {}, assistantThread: [], assistantOpened: false, postEdits: {}, deletedComments: {}, commentInsightsOn: true, 
  }),
}));

export const currentRoute = (s) => {
  if (s.modal.length) return s.modal[s.modal.length - 1];
  const st = s.stacks[s.tab];
  return st.length ? st[st.length - 1] : { name: `tab:${s.tab}`, key: `root-${s.tab}`, params: {} };
};

// 调试用：dev 环境暴露 store，便于检查状态
if (import.meta.env.DEV) window.__app = useApp;

export const useMarket = () => useApp((s) => s.market);
export const hasMonetiseTab = (s) => s.legacyIA || s.market === 'store';

// 供纯函数读取当前市场变体
useApp.subscribe((st) => { if (typeof window !== 'undefined') window.__appMarket = st.market; });
if (typeof window !== 'undefined') window.__appMarket = useApp.getState().market;
