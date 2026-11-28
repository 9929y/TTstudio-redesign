// Inbox（QKE_0052）/ Appeal（QKE_0102）/ Strikes / Settings（4.2 节）/ Search / Notifications / Monetise（rpfqP_0252，2024–25）
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timeline } from '@douyinfe/semi-ui';
import { useApp } from '../store.js';
import { LargeHeader, NavBar, Pills, Scroll, Cover, Avatar, Section, Row, Empty, Spinner, useFirstLoad, useTabFirstLoad, asButton } from '../ui/kit.jsx';
const useFirstLoadInbox = () => useFirstLoad(500);
import { SettingPage, SETTING_PAGES, CaIcon } from './Subflows.jsx';
import { AskPill } from '../insight/AskAssistant.jsx';
import { I } from '../ui/Icons.jsx';
import { POSTS, POST_BY_ID, REMOVED_POST, SETTINGS_GROUPS, INSPIRATION, ACCOUNT, PERIOD_END } from '../data/seed.js';
import { fmt, fmtMoney, overviewKpis, listTime } from '../data/agg.js';

// ---------------- Inbox ----------------
// 3 行截断 + 行尾「… ⌄ 时间」；展开后整段 +「⌃」收起（usrec 1:19）
function ClampBody({ text, time, open, onToggle, id }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current; if (!el || open) return undefined;
    const check = () => { if (el.clientHeight > 0) setOver(el.scrollHeight > el.clientHeight + 2); };
    check(); const ro = new ResizeObserver(check); ro.observe(el); return () => ro.disconnect();
  }, [text, open]);
  if (open) return <div className="ib-body open">{text} <button aria-label="Collapse" className="ib-chev" data-act="inbox-collapse" onClick={(e) => { e.stopPropagation(); onToggle(false); }}><I.up size={14} /></button><span className="ib-time">{time}</span></div>;
  return (
    <div className="ib-clamp">
      <div ref={ref} className="ib-body">{text}{!over && <> <span className="ib-time">{time}</span></>}</div>
      {over && <span className="ib-tail">…<button aria-label="Expand" className="ib-chev" data-act="inbox-expand" onClick={(e) => { e.stopPropagation(); onToggle(true); }}><I.down size={14} /></button><span className="ib-time">{time}</span></span>}
    </div>
  );
}
// Inbox 顶部的 Creator Assistant 入口（2026-11-27）：和 Home 同一个 AskPill（轮播、第一次出现的出场光、机器人图标），浅色版。
// 4 条问题都对得上这个账号 Inbox 里现有的消息（seed.js INBOX_SEED）：
// 1 要处理的事：3 条新设备登录、申诉未通过、一条隐私设置变更
// 2 Posts 更新「You’re outperforming 90%…」说的是 Kyoto at dusk（今天播放最多）
// 3 评论要先回哪些：Positano 那条评论最多（365 条），反复有人问「Itinerary in bio?」「Could I do this with kids?」（带上作品名会超出一行，所以不写名字）
// 4 Appeal not approved：被下架的是机场贵宾室那条（Trying every lounge at the airport…）
const INBOX_PROMPTS = [
  'Anything here I need to act on?',
  'Why is “Kyoto at dusk” doing so well?',
  'Which comments should I answer first?',
  'Why was your lounge video taken down?',
];

export function InboxScreen({ pushed }) {
  const pushedLoad = useFirstLoadInbox(); const tabLoad = useTabFirstLoad('inbox', 500);
  const firstLoad = pushed ? pushedLoad : tabLoad; // 美国 2026-11-22（usrec 1:18）：进入 Inbox 先出现两点 loading
  const [exp, setExp] = useState({});
  const inbox = useApp((s) => s.inbox);
  const filter = useApp((s) => s.inboxFilter);
  const setFilter = useApp((s) => s.setInboxFilter);
  const markRead = useApp((s) => s.markRead);
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const us = useApp((s) => s.market) !== 'store';
  const noAssistant = useApp((s) => s.newAccount) || !us; // 同 Home：新账号和美国商店版不显示 Creator Assistant 入口
  const assistantOpened = useApp((s) => s.assistantOpened);
  const assistantLast = useApp((s) => { const t = s.assistantThread; const m = t[t.length - 1]; return m ? m.text.split('\n')[0].slice(0, 80) : ''; });
  const list = inbox.filter((n) => filter === 'all' || n.type === filter);
  const open = (n) => {
    markRead(n.id);
    if (n.postId) push('videoAnalysis', { postId: n.postId });
    else if (n.detail === 'appeal') push('appeal');
    else push('policy', { id: n.id });
  };
  return (
    <div className="screen gray">
      {pushed ? <NavBar title="Inbox" /> : <div className="fixed-head"><LargeHeader title="Inbox" search={null} gear /></div>}
      {firstLoad ? <div className="spin-center"><Spinner /></div> : <Scroll id={pushed ? 'inbox-pushed' : 'inbox'} className={pushed ? '' : 'with-tabbar'}>
        <Pills variant="blue" className="inbox-pills" value={filter} onChange={setFilter}
          items={[{ key: 'all', label: 'All' }, { key: 'posts', label: 'Posts' }, { key: 'account', label: 'Account updates' }]} />
        {!noAssistant && (
          <div style={{ padding: '0 16px 12px' }}>
            <AskPill act="inbox-ask" tone="light" prompts={INBOX_PROMPTS} icon={<CaIcon size={22} />} onAsk={(q) => push('creatorAssistant', { from: 'inbox', prompt: q })} />
          </div>
        )}
        {assistantOpened && filter !== 'account' && (
          <button className="ca-inbox" data-act="inbox-assistant" onClick={() => push('creatorAssistant')}>
            <span className="ca-inbox-ava"><CaIcon size={32} /></span>
            <span className="ca-inbox-t"><b>Creator Assistant</b><span><em>{assistantLast || 'Hi, I’m your personal Creator Assistant!'}</em> · now</span></span>
          </button>
        )}
        <AnimatePresence initial={false}>
          {list.map((n) => {
            const post = n.postId && POST_BY_ID[n.postId];
            return (
              <motion.div layout key={n.id} className={`inbox-card ${n.unread ? 'unread' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="ib-tag"><span className="ib-ic">{n.type === 'posts' ? <I.play size={10} /> : <I.arrowUpSm size={11} />}</span><b>{n.tag}</b>{n.unread && <i className="red-dot" />}
                  {(n.menu || !us) && <button aria-label="More options" className="ib-more" data-act="inbox-more" onClick={() => openSheet('inboxMore', { id: n.id })}><I.more size={18} /></button>}</div>
                <div className="ib-row" data-act="inbox-open" onClick={() => open(n)} {...asButton(() => open(n))}>
                  <div className="ib-text">
                    <div className="ib-title">{n.title}</div>
                    {/* 美国 2026-11-22（usrec 1:19）：正文最多 3 行，超出时行尾「… ⌄ 时间」，点 ⌄ 展开、⌃ 收起 */}
                    <ClampBody id={n.id} text={n.body} time={n.time} open={!!exp[n.id]} onToggle={(v) => setExp({ ...exp, [n.id]: v })} />
                  </div>
                  {post && <Cover item={post} w={44} h={58} text={false} />}
                </div>
                {!us && <button className="ib-view" data-act="inbox-view-more" onClick={() => open(n)}>View more</button>}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Scroll>}
    </div>
  );
}

// Appeal 详情：竖向时间线 Submitted → Reviewed → Not approved（QKE 0:52–1:04）——复用 Semi Timeline
export function AppealScreen() {
  const push = useApp((s) => s.push);
  return (
    <div className="screen">
      <NavBar title="" />
      <Scroll>
        <div className="pad appeal">
          <div className="appeal-mark"><I.warning size={64} /></div>
          <h2>Appeal not approved</h2>
          <p className="muted">We reviewed your appeal and found that your video violates our Community Guidelines. Your video will not be restored.</p>
          <h3>Important info</h3>
          <button className="warn-card" data-act="appeal-warning" onClick={() => push('strikes')}>
            <div className="wc-title">Warning received <I.right size={16} /></div>
            <div className="muted small">You’ve received a warning for your first violation. The next violation will result in a strike. Tap to find out how this affects your account.</div>
          </button>
          <div className="appeal-status">
            <div className="as-title">Appeal status</div>
            <Timeline className="tt-timeline">
              <Timeline.Item time="11/14/2026 11:59AM" type="default">Submitted</Timeline.Item>
              <Timeline.Item time="" type="default">Reviewed</Timeline.Item>
              <Timeline.Item time="11/15/2026 05:23PM" type="error">Not approved</Timeline.Item>
            </Timeline>
          </div>
          <h3>About your video</h3>
          <div className="video-details">
            <div className="vd-title">Video details</div>
            <div className="vd-row"><div className="muted small">{REMOVED_POST.title}</div><Cover item={REMOVED_POST} w={44} h={58} text={false} /></div>
          </div>
          <div className="muted small" style={{ marginTop: 14 }}>Policy: Regulated goods and commercial activities</div>
        </div>
      </Scroll>
    </div>
  );
}

export function StrikesScreen() {
  const [tab, setTab] = useState('active');
  return (
    <div className="screen">
      <NavBar title="Strikes and warnings" />
      <Scroll>
        <div className="pad">
          <div className="strike-meter">
            <div className="sm-row"><span>Account status</span><b>Good standing</b></div>
            <div className="sm-bar">{[0, 1, 2, 3].map((i) => <i key={i} className={i === 0 ? 'warn' : ''} />)}</div>
            <div className="muted small">1 warning · 0 strikes. Warnings don’t count toward account restrictions.</div>
          </div>
          <Pills variant="blue" value={tab} onChange={setTab} items={[{ key: 'active', label: 'Active' }, { key: 'expired', label: 'Expired' }]} />
          {tab === 'active' ? (
            <div className="enf-card">
              <div className="enf-head"><span className="enf-tag">Warning</span><span className="muted small">Nov 15, 2026</span></div>
              <div className="enf-title">Regulated goods and commercial activities</div>
              <div className="vd-row"><div className="muted small">{REMOVED_POST.title}</div><Cover item={REMOVED_POST} w={40} h={52} text={false} /></div>
              <button className="link-btn" data-act="view-enforcements" onClick={() => useApp.getState().push('policy', { id: 'n2' })}>View enforcements <I.right size={14} /></button>
            </div>
          ) : <Empty title="No expired strikes" art="circle" />}
        </div>
      </Scroll>
    </div>
  );
}

export function PolicyScreen({ params }) {
  const n = useApp((s) => s.inbox.find((x) => x.id === params.id));
  return (
    <div className="screen">
      <NavBar title={n?.tag || ''} />
      <Scroll><div className="pad"><h2>{n?.title}</h2><p className="muted">{n?.body}</p><p className="muted small">Received {n?.time}</p></div></Scroll>
    </div>
  );
}

// ---------------- Settings and privacy（iOS 2026 4.2 节） ----------------
export function SettingsScreen() {
  const push = useApp((s) => s.push);
  const showAlert = useApp((s) => s.showAlert);
  const resetAll = useApp((s) => s.resetAll);
  return (
    <div className="screen gray">
      <NavBar title="Settings and privacy" />
      <Scroll>
        <div className="settings-profile"><Avatar size={52} label="ML" /><div><b>{ACCOUNT.name}</b><div className="muted small">@{ACCOUNT.handle}</div></div></div>
        {SETTINGS_GROUPS.map(([g, items]) => (
          <div key={g} className="settings-group">
            <div className="sg-title">{g}</div>
            <div className="sg-card">
              {items.map((it, i) => (
                <Row key={it} label={it} last={i === items.length - 1} act={`settings-${it}`}
                  onPress={() => (it === 'Log out' ? showAlert({ title: 'Log out of TikTok Studio?', actions: [{ label: 'Cancel' }, { label: 'Log out', bold: true, destructive: true, onPress: resetAll }] })
                    : it === 'Switch account' ? useApp.getState().openSheet('switchAccount')
                      : push('settingDetail', { title: it }))} />
              ))}
            </div>
          </div>
        ))}
        <div className="muted small center" style={{ padding: 20 }}>Version 44.6.3</div>
      </Scroll>
    </div>
  );
}

// 设置子页：条目按官方帮助 H1 / CA3 / H12 列出（Privacy → Comments 两个评论洞察开关）
export function SettingDetailScreen({ params }) {
  return (
    <div className="screen gray">
      <NavBar title={params.title} />
      <Scroll>{SETTING_PAGES[params.title] ? <SettingPage title={params.title} /> : <SettingPage title="Support" />}<div style={{ height: 24 }} /></Scroll>
    </div>
  );
}

// ---------------- Search（2026 iOS 右上角入口；H1/CA8：Creator Search，内容未录到 → 模拟） ----------------
export function SearchScreen() {
  const [q, setQ] = useState('');
  const push = useApp((s) => s.push);
  const pop = useApp((s) => s.pop);
  const posts = useMemo(() => (q ? POSTS.filter((p) => p.title.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : []), [q]);
  const recent = ['kyoto', 'carry-on', 'day trips'];
  return (
    <div className="screen">
      <div className="search-top">
        <div className="search-field"><I.search size={18} /><input autoFocus data-act="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your posts" /></div>
        <button data-act="search-cancel" onClick={pop}>Cancel</button>
      </div>
      <Scroll>
        {!q ? (
          <div className="pad">
            <div className="sg-title">Recent searches</div>
            {recent.map((r) => <button key={r} className="recent-row" data-act="search-recent" onClick={() => setQ(r)}><I.clock size={18} />{r}</button>)}
          </div>
        ) : posts.length ? posts.map((p) => (
          <button key={p.id} className="rank-row" data-act="search-result" onClick={() => push('videoAnalysis', { postId: p.id })}>
            <Cover item={p} w={48} h={64} /><div className="rr-text"><div className="rr-title">{p.title}</div><div className="rr-sub">{listTime(p.publishedAt)} · {fmt(p.views)} views</div></div>
          </button>
        )) : <div className="muted-note center" style={{ paddingTop: 60 }}>No results for “{q}”</div>}
      </Scroll>
    </div>
  );
}

export function NotificationsScreen() {
  const push = useApp((s) => s.push);
  const items = POSTS.slice(-6).reverse().map((p, i) => ({ p, text: i % 2 ? `${p.commentList[0]?.user.handle || 'someone'} commented: ${p.commentList[0]?.text || 'Nice!'}` : `${fmt(Math.round(p.likes / 10))} people liked your video` }));
  return (
    <div className="screen">
      <NavBar title="Notifications" />
      <Scroll>
        {items.map(({ p, text }, i) => (
          <button key={i} className="rank-row" data-act="notif-open" onClick={() => push('videoAnalysis', { postId: p.id })}>
            <Avatar hue={(i * 70) % 360} size={40} /><div className="rr-text"><div className="rr-title">{text}</div><div className="rr-sub light">{listTime(p.publishedAt)}</div></div><Cover item={p} w={40} h={52} text={false} />
          </button>
        ))}
      </Scroll>
    </div>
  );
}
export function NotifSettingsScreen() { return <SettingDetailScreen params={{ title: 'Notifications' }} />; }

// ---------------- Monetise（2024–25 IA；rpfqP_0252、91F、o1g） ----------------
export function MonetiseScreen() {
  const showAlert = useApp((s) => s.showAlert);
  const push = useApp((s) => s.push);
  const k = overviewKpis({ key: '7' });
  const toMain = (what) => showAlert({ title: 'Continue to TikTok app?', message: `Open ${what} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true, onPress: () => useApp.getState().showToast('Opening TikTok…') }] });
  const [lb, setLb] = useState('recommended');
  return (
    <div className="screen gray">
      <div className="fixed-head"><LargeHeader title="Monetization" search={null} /></div>
      <Scroll id="monetise" className="with-tabbar">
        <div className="money-card">
          <div className="small">Estimated rewards in the last 7 days</div>
          <div className="mc-num">{fmtMoney(k[5].value)}</div>
          <div className="mc-row"><span>Balance {fmtMoney(k[5].value * 3.2)}</span><button data-act="money-view" onClick={() => toMain('Balance')}>View</button></div>
        </div>
        <Section title="Programmes for you">
          {[['Subscription', <I.star size={20} />], ['Work with Artists', <I.music size={20} />], ['Video Gifts', <I.gift size={20} />]].map(([n, ic]) => (
            <div key={n} className="prog-row"><span className="pr-ic">{ic}</span><span className="pr-name">{n}</span><button className="btn-join" data-act={`join-${n}`} onClick={() => toMain(n)}>Join</button></div>
          ))}
        </Section>
        <Section title="Active programmes">
          <div className="prog-grid">{[['TikTok Shop for Creator', <I.bag size={20} />], ['Creator Rewards Program', <I.dollar size={20} />], ['Creator Marketplace', <I.bag size={20} />], ['Work with Artists', <I.music size={20} />]].map(([n, ic]) => (
            <button key={n} data-act="active-programme" onClick={() => toMain(n)}><span className="pr-ic">{ic}</span><span>{n}</span></button>
          ))}</div>
        </Section>
        <Section title="Trending in Monetisation">
          <Pills variant="blue" value={lb} onChange={setLb} items={[{ key: 'recommended', label: 'Recommended' }, { key: 'live', label: 'LIVE rewards' }]} />
          {(lb === 'recommended' ? INSPIRATION : [...INSPIRATION].reverse()).slice(0, 5).map((x) => (
            <button key={x.id} className="rank-row" data-act="monetise-creator" onClick={() => push('creatorProfile', { id: x.id })}><Avatar hue={x.hue} size={40} label={x.creator[0].toUpperCase()} /><div className="rr-text"><div className="rr-title">{x.creator}</div><div className="rr-sub">{fmt(x.creatorStats.followers)} followers</div></div></button>
          ))}
        </Section>
        <Section title="Learning resources"><div className="muted-note">How Creator Rewards are calculated · Getting started with Subscription</div></Section>
      </Scroll>
    </div>
  );
}

export function CreatorProfileScreen({ params }) {
  const x = INSPIRATION.find((i) => i.id === params.id);
  const openSheet = useApp((s) => s.openSheet);
  return (
    <div className="screen">
      <NavBar title={x.creator} />
      <Scroll>
        <div className="ins-creator"><Avatar hue={x.hue} size={72} label={x.creator[0].toUpperCase()} /><b>@{x.creator}</b><div className="muted small">{fmt(x.creatorStats.followers)} followers · {fmt(x.creatorStats.totalLikes)} likes</div></div>
        <div className="pad"><button className="upload-btn" data-act="see-growth" onClick={() => openSheet('insights', { id: x.id })}>See how this creator grew</button></div>
      </Scroll>
    </div>
  );
}

// ---------------- Monetization（2026：从 Home 的 Monetization 卡片推入；Y2um_0205 / 0209，iOS 2026-06） ----------------
const PROGRAMMES = [
  { n: 'Subscription', lock: '2/4', d: 'Build closer connections with your viewers through exclusive content and perks for subscribers.', ic: <I.star size={22} /> },
  { n: 'Video Gifts', lock: '4/5', d: 'Get Gifts for your best-performing videos.', ic: <I.gift size={22} /> },
  { n: 'Service+', lock: '0/1', d: 'Connect with potential clients when you go LIVE.', ic: <I.comment size={22} /> },
];
export function MonetizationScreen() {
  const openSheet = useApp((s) => s.openSheet);
  const showAlert = useApp((s) => s.showAlert);
  const [usd, setUsd] = useState(true);
  const [res, setRes] = useState('rec');
  const k = overviewKpis({ key: '7' });
  const toMain = (what) => showAlert({ title: 'Continue to TikTok app?', message: `Open ${what} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true, onPress: () => useApp.getState().showToast('Opening TikTok…') }] });
  return (
    <div className="screen">
      <NavBar title="Monetization" />
      <Scroll>
        <div className="money-card m26">
          <div className="mc-top"><span className="small">Estimated rewards in the last 7 days</span>
            <button data-act="money-currency" className="mc-cur" onClick={() => setUsd(!usd)}><I.info size={13} /> ⇄ {usd ? 'USD' : 'EUR'}</button></div>
          <button className="mc-num" data-act="money-rewards" onClick={() => openSheet('info', { title: 'Estimated rewards', text: 'Estimated rewards for eligible posts published during the selected period. Final amounts may change after review.' })}>{usd ? '$' : '€'}{(k[5].value * (usd ? 1 : 0.92)).toFixed(2)} <I.right size={18} /></button>
          <button className="mc-bal" data-act="money-balance" onClick={() => toMain('Balance')}><span>Balance: ${(k[5].value * 3.2).toFixed(2)}</span><span>View <I.right size={14} /></span></button>
        </div>
        <div className="m-sec">
          <div className="m-head"><b>Recommended programs for you</b><button data-act="money-see-all" onClick={() => openSheet('info', { title: 'All programs', text: 'Subscription · Video Gifts · Service+ · LIVE Gifts · TikTok Shop for Sellers · Creator Marketplace' })}><I.info size={14} /> See all <I.right size={14} /></button></div>
          {PROGRAMMES.map((p) => (
            <button key={p.n} className="m-prog" data-act={`money-programme-${p.n}`} onClick={() => toMain(p.n)}>
              <span className="m-ic">{p.ic}</span>
              <span className="m-txt"><span className="m-name">{p.n} <em><I.lock size={11} /> {p.lock}</em></span><span className="m-desc">{p.d}</span></span>
              <I.right size={16} />
            </button>
          ))}
        </div>
        <div className="m-sec">
          <div className="m-head"><b>Learning resources</b><button data-act="money-res-all">See all <I.right size={14} /></button></div>
          <Pills value={res} onChange={setRes} items={[{ key: 'rec', label: 'Recommended' }, { key: 'crp', label: 'Creator Rewards Program' }, { key: 'sub', label: 'Subscription' }]} />
          {[['Monetize your content on TikTok', 'TikTok offers several programs to help you earn.'], ['How Creator Rewards are calculated', 'Qualified views, RPM and what affects them.']].map(([t, d], i) => (
            <button key={t} className="m-article" data-act="money-article" onClick={() => openSheet('info', { title: t, text: d })}><span><b>{t}</b><small>{d}</small></span><Cover item={{ hue: 200 + i * 60, emoji: '💡' }} w={56} h={56} text={false} radius={6} /></button>
          ))}
        </div>
      </Scroll>
    </div>
  );
}
