import { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useApp, currentRoute, hasMonetiseTab } from './store.js';
import { TabStack, ModalStack } from './shell/Navigator.jsx';
import { SheetHost, AlertHost, ToastHost } from './shell/Overlays.jsx';
import { Illo } from './ui/illo.jsx';
import { I } from './ui/Icons.jsx';
import { Avatar } from './ui/kit.jsx';
import { ACCOUNT } from './data/seed.js';
import { HomeScreen } from './screens/Home.jsx';
import { AnalyticsScreen, LocationsScreen, ArticleLinksScreen } from './screens/Analytics.jsx';
import { CreateScreen, PickerScreen, EditorScreen, ComposerScreen, CameraScreen } from './screens/Create.jsx';
import { ManageScreen } from './screens/Manage.jsx';
import { VideoAnalysisScreen, PlayerScreen, VideoCommentsScreen } from './screens/VideoAnalysis.jsx';
import { MonetizationScreen, InboxScreen, AppealScreen, StrikesScreen, PolicyScreen, SettingsScreen, SettingDetailScreen, SearchScreen, NotificationsScreen, NotifSettingsScreen, MonetiseScreen, CreatorProfileScreen } from './screens/Other.jsx';
import { SHEETS } from './screens/sheets.jsx';
import { TopicSearchScreen, PostSearchScreen, LegacyMonetiseV4, RewardsAnalyticsScreen, V4_SHEETS } from './screens/V4.jsx';
import { CreatorInspirationScreen, RelatedCommentsScreen, SearchPlayerScreen, RewardsAnalyticsUSScreen, CreatorRewardsScreen, AnalysisSheet, CreatorAnalysisSheet, CiOptionSheet, KpiInfoSheet } from './screens/US.jsx';
import { InsightsSheet } from './screens/Home.jsx';
import { CreatorAssistantScreen, SUBFLOW_SHEETS } from './screens/Subflows.jsx';
import { POLISH_SHEETS } from './screens/Polish.jsx';
import { ResearchPanel, HotspotLayer } from './research/Panel.jsx';

const ROUTES = {
  videoAnalysis: VideoAnalysisScreen, player: PlayerScreen, videoComments: VideoCommentsScreen,
  locations: LocationsScreen, articleLinks: ArticleLinksScreen,
  appeal: AppealScreen, strikes: StrikesScreen, policy: PolicyScreen,
  settings: SettingsScreen, settingDetail: SettingDetailScreen, search: PostSearchScreen, topicSearch: TopicSearchScreen, rewardsAnalytics: RewardsAnalyticsScreen, notifications: NotificationsScreen, notifSettings: NotifSettingsScreen,
  picker: PickerScreen, editor: EditorScreen, composer: ComposerScreen, creatorProfile: CreatorProfileScreen,
  monetization: MonetizationScreen, camera: CameraScreen,
  creatorAssistant: CreatorAssistantScreen,
  creatorInspiration: CreatorInspirationScreen, relatedComments: RelatedCommentsScreen, searchPlayer: SearchPlayerScreen, rewardsAnalyticsUS: RewardsAnalyticsUSScreen, creatorRewards: CreatorRewardsScreen, inboxPage: (p) => <InboxScreen pushed {...p} />,
};
const DARK = new Set(['player', 'videoComments', 'editor', 'camera', 'searchPlayer']);
// 美国版用 Analysis 弹层（usrec 1:45）；旧版美国（宣传图）用原 Insights 弹层
function InsightsRouter(props) { const store = useApp((s) => s.market === 'store'); return store ? <InsightsSheet {...props} /> : <AnalysisSheet {...props} />; }
const renderRoute = (r) => { const C = ROUTES[r.name]; return C ? <C params={r.params} /> : <div className="pad">Missing route {r.name}</div>; };

function StatusBar() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i); }, []);
  const dark = useApp((s) => {
    const r = currentRoute(s);
    return DARK.has(r.name) || (r.name === 'tab:home' && !s.legacyIA && !s.sheet && !(s.homeTab === 'home' && s.homeScrolled && s.market !== 'store'));
  });
  const showToast = useApp((s) => s.showToast);
  return (
    <div className={`status ${dark ? 'light' : ''}`}>
      <div className="st-left">
        <span className="st-time">{String(t.getHours()).padStart(2, '0')}:{String(t.getMinutes()).padStart(2, '0')}</span>
      </div>
      <div className="island" />
      <div className="st-right">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .7 10.3 10.3 0 0 0 .8 3.6L2 4.9a8.5 8.5 0 0 1 6-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4.3a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3zM8 9.6 9.9 7.7a2.8 2.8 0 0 0-3.8 0z" /></svg>
        <span className="batt"><i /></span>
      </div>
    </div>
  );
}

function TabBar({ tab }) {
  const legacy = useApp(hasMonetiseTab);
  const market = useApp((s) => s.market);
  const switchTab = useApp((s) => s.switchTab);
  const unread = useApp((s) => s.inbox.filter((n) => n.unread).length);
  const homeTab = useApp((s) => s.homeTab);
  const newAccount = useApp((s) => s.newAccount);
  // Inspiration 视频流上 TabBar 为深色（QKE_0038）；Home 仪表盘上为浅色（Y2um_0058）；新账号 Home 为深色（aHcj_0028）
  const homeDark = tab === 'home' && !useApp.getState().legacyIA && (homeTab !== 'home' || market === 'store');
  const items = [
    { key: 'home', label: 'Home', icon: I.home },
    { key: 'analytics', label: 'Analytics', icon: I.analytics },
    { key: 'create', label: 'Create', icon: I.create },
    legacy ? { key: 'monetise', label: 'Monetize', icon: I.monetise } : { key: 'inbox', label: 'Inbox', icon: I.inbox, badge: unread },
    { key: 'manage', label: 'Manage', icon: I.manage },
  ];
  return (
    <nav className={`tabbar ${homeDark ? 'dark' : ''}`}>
      {items.map((it) => {
        const on = it.key === tab;
        return (
          <button key={it.key} data-act={`tabbar-${it.key}`} className={on ? 'on' : ''} onClick={() => switchTab(it.key)}>
            <span className="tb-icon">{it.icon({ size: 24, active: on })}{it.badge ? <motion.span key={it.badge} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="tb-badge">{it.badge}</motion.span> : null}</span>
            <span className="tb-label">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const ROOTS = { home: HomeScreen, analytics: AnalyticsScreen, create: CreateScreen, inbox: InboxScreen, manage: ManageScreen, monetise: LegacyMonetiseV4 };

// 首次启动：Welcome to TikTok Studio + Continue as <账号>（QKE_0026）
// 欢迎页插图三版（illustrations/welcome_options/welcome_a|b|c.svg），研究面板切换；文件缺失时回落到 illustrations/welcome 或自绘版
const WELCOME_OPTIONS = Object.fromEntries(Object.entries(import.meta.glob('../illustrations/welcome_options/welcome_*.svg', { eager: true, query: '?url', import: 'default' }))
  .map(([k, v]) => [k.match(/welcome_([a-z])\.svg$/)[1], v]));
function Welcome() {
  const boot = useApp((s) => s.boot);
  const welcomeArt = useApp((s) => s.welcomeArt);
  const artUrl = WELCOME_OPTIONS[welcomeArt];
  const openSheet = useApp((s) => s.openSheet);
  const [loading, setLoading] = useState(false);
  return (
    <motion.div className="welcome" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {artUrl ? <motion.img key={welcomeArt} className="wl-art" src={artUrl} alt="" draggable={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} /> : <Illo name="welcome" className="wl-art" fallback={<svg className="wl-art" viewBox="0 0 260 200" fill="none" stroke="#161823" strokeWidth="2" strokeLinecap="round">
        <rect x="40" y="30" width="54" height="40" rx="4" fill="#fe2c55" stroke="none" transform="rotate(-12 67 50)" /><path d="m62 44 12 7-12 7z" fill="#fff" stroke="none" transform="rotate(-12 67 50)" />
        <circle cx="120" cy="80" r="22" /><path d="M95 150c4-28 14-44 25-44s21 16 25 44" /><rect x="150" y="60" width="60" height="44" rx="4" fill="#20d5a0" stroke="none" transform="rotate(8 180 82)" /><path d="m160 92 12-12 10 8 16-18" stroke="#161823" transform="rotate(8 180 82)" />
        <rect x="150" y="130" width="12" height="30" fill="#fe2c55" stroke="none" /><rect x="168" y="118" width="12" height="42" fill="#fe2c55" stroke="none" /><rect x="186" y="104" width="12" height="56" fill="#fe2c55" stroke="none" />
        <path d="M30 168h200M210 30l6-6m0 6-6-6M30 110l4 4m0-4-4 4" />
      </svg>} />}
      <h1>Welcome to TikTok Studio</h1>
      <p>Edit, create, publish, monetise and engage with your community on TikTok</p>
      <div className="wl-bottom">
        <button className="wl-continue" data-act="welcome-continue" onClick={() => { setLoading(true); setTimeout(boot, 650); }}>
          {loading ? <span className="tt-spinner light"><i /><i /></span> : <><Avatar size={22} label="ML" /> Continue as {ACCOUNT.handle}</>}
        </button>
        <button className="wl-other" data-act="welcome-other" onClick={() => openSheet('loginMethods')}>Log in with other methods</button>
        <div className="wl-legal">You must be 18+ to use TikTok Studio. By continuing, you agree to our Terms of Service and acknowledge that you have read our Privacy Policy to learn how we collect, use and share your data.</div>
      </div>
    </motion.div>
  );
}

function Phone() {
  const booted = useApp((s) => s.booted);
  const tab = useApp((s) => s.tab);
  const legacy = useApp(hasMonetiseTab);
  const tabs = ['home', 'analytics', 'create', legacy ? 'monetise' : 'inbox', 'manage'];
  return (
    <div className="device">
      <div className="screen-root" id="phone-screen">
        <AnimatePresence>{!booted && <Welcome key="w" />}</AnimatePresence>
        {booted && (
          <>
            {['home', 'analytics', 'create', 'inbox', 'manage', 'monetise'].map((t) => {
              const Root = ROOTS[t];
              const shown = tabs.includes(t);
              return (
                <TabStack key={t} tab={t} active={t === tab && shown} renderRoute={renderRoute} darkRoutes={DARK}
                  root={<div className="root-wrap"><Root /><TabBar tab={t} /></div>} />
              );
            })}
            <ModalStack renderRoute={renderRoute} darkRoutes={DARK} />
          </>
        )}
        <StatusBar />
        <SheetHost registry={{ ...SHEETS, ...V4_SHEETS, insights: InsightsRouter, creatorAnalysis: CreatorAnalysisSheet, ciOption: CiOptionSheet, kpiInfo: KpiInfoSheet, ...POLISH_SHEETS, ...SUBFLOW_SHEETS }} />
        <AlertHost />
        <ToastHost />
        <HotspotLayer />
        <div className="home-ind" />
      </div>
    </div>
  );
}

// 嵌入模式（#embed）：只显示手机，隐藏研究面板；供动线图页面 iframe 嵌入并跳转到指定页面
const EMBED = typeof location !== 'undefined' && /embed/.test(location.hash);
// 公开版（GitHub）：只显示手机，不出现版本说明和研究面板。构建：npm run build:public
const PUBLIC = import.meta.env.VITE_PUBLIC === '1';
// 动线图页面跳到某一步：postMessage({ type: 'studio-go', spec })，spec = { welcome, tab, homeTab, aTab, manageTab, push: [[route, params]], modal: [route, params], sheet: [type, props] }
function applySpec(spec = {}) {
  const st = useApp.getState();
  st.resetAll();
  if (spec.welcome) { if (spec.sheet) setTimeout(() => useApp.getState().openSheet(...spec.sheet), 350); return; }
  useApp.setState({ booted: true, tab: spec.tab || 'home', homeTab: spec.homeTab || 'home', aTab: spec.aTab || 'overview' });
  if (spec.manageTab) useApp.setState((x) => ({ manage: { ...x.manage, tab: spec.manageTab } }));
  setTimeout(() => {
    const g = useApp.getState();
    if (spec.modal) g.openModal(spec.modal[0], spec.modal[1] || {});
    (spec.push || []).forEach(([n, prm]) => useApp.getState().push(n, prm || {}));
    if (spec.sheet) setTimeout(() => useApp.getState().openSheet(spec.sheet[0], spec.sheet[1] || {}), 420);
  }, 80);
}
if (typeof window !== 'undefined') {
  window.__studio = useApp;
  window.__studioGo = applySpec;
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'studio-go') applySpec(e.data.spec);
    // 联动示例页（linkage.html）用：读当前评分图状态（选中哪一项、Key metrics 选中哪张卡、Ask 行文案），跨源也能用
    if (e.data && e.data.type === 'studio-peek' && e.source) {
      const card = document.querySelector('#phone-screen [data-insight="insight-a"]');
      const tip = card ? Number(card.dataset.tip) : null;
      const labs = card ? [...card.querySelectorAll('[data-act^="insight-a-area-"]')].map((b) => b.textContent.replace(/[\d.]+$/, '')) : [];
      const st = useApp.getState();
      e.source.postMessage({ type: 'studio-peek-result', state: {
        screen: st.tab === 'analytics' && st.aTab === 'overview' && card ? 'overview' : 'other',
        area: tip != null && tip >= 0 ? labs[tip] : null,
        kpi: document.querySelector('#phone-screen .kpi.sel .kpi-label')?.textContent || null,
        ask: (card ? [...card.querySelectorAll('.ask-row .ask-roll-t')].pop()?.textContent : null) || null, // 换文案时新旧两条短暂并存，取后进来的那条
        assistant: !!document.querySelector('#phone-screen .ca-head'),
      } }, '*');
    }
  });
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">{/* 系统开了「减弱动态效果」时，位移动画改为淡入淡出 */}
    <div className={`stage-root ${EMBED ? 'embed' : ''}`}>
      <div className="phone-col"><Phone />{!PUBLIC && <div className="proto-note">Version 4 · Unofficial research prototype · simulated data</div>}</div>
      {!EMBED && !PUBLIC && <ResearchPanel />}
    </div>
    </MotionConfig>
  );
}
