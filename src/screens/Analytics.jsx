// Analytics（账号级）：Overview / Content / Viewers / Followers
// 证据：QKE_0042（iOS 2026 Overview）、o1g 0:36–7:13（Android 切日期/子 Tab/拖图）、rpfqP_0320（iOS 2024 Followers）
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../store.js';
import { Spinner, NavBar, LargeHeader, TopTabs, Pills, Section, KpiCard, KpiSkeleton, InsightCardSkeleton, Skel, useRefill, useFirstLoad, BarRows, Donut, Cover, Scroll, Avatar, useTabFirstLoad } from '../ui/kit.jsx';
import { TrendChart, BarChart } from '../ui/charts.jsx';
import { I } from '../ui/Icons.jsx';
import {
  RANGE_PRESETS, rangeLabel, overviewKpis, viewerKpis, followerKpis, series, trafficSources, topPosts, TOP_METRICS,
  fmt, fmtMoney, monDay, monDayYear, rangeDays, ago, fmtStat } from '../data/agg.js';
import { VIEWER_INSIGHTS, FOLLOWER_INSIGHTS, activeHours, ACTIVE_DAYS, ALSO_WATCHED_CREATORS, ALSO_VIEWED_POSTS, PERIOD_END, dayDate, VIEWERS_LAG } from '../data/seed.js';
import { ModuleA } from '../insight/ModuleA.jsx';
import { ModuleB } from '../insight/ModuleB.jsx';
import { buildModuleA, buildModuleB, mostActive } from '../insight/build.js';
import { AudienceInsight } from '../insight/AudienceInsight.jsx';

// V4 美国版子 Tab（appstore_analytics）：Overview / Content / Followers / LIVE
export const A_TABS_US = [
  { key: 'overview', label: 'Overview' }, { key: 'content', label: 'Content' },
  { key: 'followers', label: 'Followers' }, { key: 'live', label: 'LIVE' },
];
export const A_TABS = [
  { key: 'overview', label: 'Overview' }, { key: 'content', label: 'Content' },
  { key: 'viewers', label: 'Viewers' }, { key: 'followers', label: 'Followers' },
];

const TRAFFIC_INFO = 'It shows the places where your viewers discover your post. The main source types on TikTok are the For You feed, the Following feed, sound pages, profile pages, search pages, and direct messages. The other types are grouped together as "Other".';
const KEY_INFO = 'Key metrics show how your posts performed during the selected time period, compared with the previous period of the same length. Data is updated daily in your account’s time zone. The last day may be incomplete.';

function RangePills() {
  const range = useApp((s) => s.range);
  const market = useApp((s) => s.market);
  const setRange = useApp((s) => s.setRange);
  const openSheet = useApp((s) => s.openSheet);
  const items = [
    ...RANGE_PRESETS.filter((r) => !(market === 'store' && r.key === '365')).map((r) => ({ key: r.key, label: r.label })), // 美国版没有 365 days（appstore_analytics）
    { key: 'custom', label: 'Custom', caret: true },
  ];
  return (
    <Pills items={items} value={range.key} className="range-pills"
      onChange={(k) => (k === 'custom' ? openSheet('customRange') : k !== range.key && setRange({ key: k }))} />
  );
}

// 终稿（design_final/analytics，IMP-Ctx-Page1/2-Blue）：Overview 与 Content 顶部不再有日期胶囊，
// 改为区块标题右侧的「Last 7 days ⌄」下拉（样式同 Rewards analytics 里已有的 .ra-range），选项与原胶囊一致。
function RangeDropdown() {
  const range = useApp((s) => s.range);
  const market = useApp((s) => s.market);
  const setRange = useApp((s) => s.setRange);
  const openSheet = useApp((s) => s.openSheet);
  const options = [
    ...RANGE_PRESETS.filter((r) => !(market === 'store' && r.key === '365')).map((r) => ({ key: r.key, label: `Last ${r.label}` })),
    { key: 'custom', label: 'Custom' },
  ];
  const label = range.key === 'custom' ? 'Custom' : `Last ${RANGE_PRESETS.find((r) => r.key === range.key)?.label || '7 days'}`;
  return (
    <button className="ra-range" data-act="range-dd" style={{ flex: 'none', whiteSpace: 'nowrap' }}
      onClick={() => openSheet('ciOption', { title: 'Date range', options, value: range.key,
        onPick: (k) => (k === 'custom' ? openSheet('customRange') : k !== range.key && setRange({ key: k })) })}>
      {label} <I.down size={14} />
    </button>
  );
}

// 洞察卡（模块 A / B）在页面里的位置：左右各 8、上 8，与白色区块同宽（页面板 padding: 8px 8px 0）
// 雷达联动（2026-11-28 Yanice）：默认不选任何维度（五轴全亮，Key metrics 一张都不选）；用户在雷达上点了某一维度，
// 下方 Key metrics 选中对应的卡；在下方点了某张卡，雷达跟到对应维度（syncRose）。
// Overview → Key metrics 的卡和趋势图（Engagement 有 Likes、Comments 两项，聚焦第一项 Likes；点 Comments 卡时雷达选 Engagement）；
// Content → Top posts 的排序胶囊（Views 聚焦第一项 Most views；Most new viewers 也属于 Views）。
const AREA_KPI = { Views: 'views', Engagement: 'likes', Shares: 'shares', Visits: 'profile', Rewards: 'rewards' };
const AREA_TOP = { Views: 'views', Engagement: 'likes', Followers: 'newFollowers' };
const KPI_AREA = { views: 'Views', viewers: 'Views', likes: 'Engagement', comments: 'Engagement', shares: 'Shares', profile: 'Visits', rewards: 'Rewards' };
const TOP_AREA = { views: 'Views', newViewers: 'Views', likes: 'Engagement', newFollowers: 'Followers' };
function InsightSlot({ Module, loading }) {
  const push = useApp((s) => s.push);
  const range = useApp((s) => s.range);
  const market = useApp((s) => s.market);
  const isA = Module === ModuleA;
  // 下方联动晚 120ms 跟上：评分图先动，Key metrics / Top posts 再跟（层次感），也把趋势图重画这类重活错开到卡片动画的尾段；连续点时只执行最后一次
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onSelect = (name) => { clearTimeout(timer.current); timer.current = setTimeout(() => follow(name), 120); };
  const syncTo = useApp((s) => s.roseSync[isA ? 'A' : 'B']);
  // 下方先换了：取消还没执行的跟随，免得把刚选的卡又改回去
  useEffect(() => { clearTimeout(timer.current); }, [syncTo]);
  // 卡片（重新）出现时从下方当前的选择开始（Overview 默认没有选中的卡 → 雷达默认态）
  const initialArea = useMemo(() => {
    const st = useApp.getState();
    return isA ? KPI_AREA[st.kpiSel.overview] || null : null;
  }, [isA, loading, range]); // eslint-disable-line react-hooks/exhaustive-deps
  const follow = (name) => {
    const st = useApp.getState();
    if (isA) {
      // Overview：选中维度 → 选中对应的卡（已经是这一维度的卡，比如 Engagement 下的 Comments，就不动）
      const key = AREA_KPI[name];
      if (!key || !overviewKpis(st.range, market).some((k) => k.key === key)) return;
      if (KPI_AREA[st.kpiSel.overview] !== name) st.setKpiSel('overview', key);
      return;
    }
    // Content：点某一行指标 → Top posts 换成对应的排序（已经属于这一维度就不动）
    const key = AREA_TOP[name];
    if (!key || !TOP_METRICS.some((m) => m.key === key)) return;
    if (TOP_AREA[st.topMetric] !== name) st.setTopMetric(key);
  };

  const insight = useMemo(() => (Module === ModuleA ? buildModuleA(range) : buildModuleB(range)), [Module, range]);
  const newAccount = useApp((s) => s.newAccount);
  // 没有 Creator Assistant 的账号不出「Ask Creator Assistant」行，规则同原卡片（美国区需 10K+ 粉）
  const ca = newAccount || market === 'store' ? 'none' : 'row';
  return (
    <div style={{ padding: '8px 8px 0' }}>
      {/* 加载：和成品同形状的骨架；数据到了内容 200ms 淡入、上移 4px（2026-11-26） */}
      {loading ? <InsightCardSkeleton half={Module !== ModuleA} radar={isA} bars={!isA} /> : (
        <motion.div initial={{ opacity: 0, transform: 'translateY(4px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
          <Module ca={ca} insight={insight} onSelect={onSelect} syncTo={syncTo} initialArea={initialArea} onAsk={(q) => push('creatorAssistant', { from: Module === ModuleA ? 'analytics' : 'content', prompt: q })} />
        </motion.div>
      )}
    </div>
  );
}

function ProcessingBanner() {
  return <div className="banner-orange"><I.clock size={16} /> Data is processing. Check back in 1–2 days.</div>;
}

// 一个区块：KPI 卡组 + 随所选卡切换的趋势图
function KeyMetrics({ tabKey, kpis, chartMetric, loading, empty, right }) {
  const range = useApp((s) => s.range);
  const token = useApp((s) => s.rangeToken);
  const sel = useApp((s) => s.kpiSel[tabKey]);
  const setSel = useApp((s) => s.setKpiSel);
  // sel 为空（Overview 默认）时没有卡被选中，趋势图显示第一张
  const selKpi = kpis.find((k) => k.key === sel) || kpis[0];
  const data = useMemo(() => series(chartMetric(selKpi.key), range), [selKpi.key, range]);
  const isMoney = selKpi.money;
  return (
    <Section title="Key metrics" info={KEY_INFO} infoSheet={tabKey} right={right} sub={loading ? undefined : rangeLabel(range, tabKey === 'viewers' ? VIEWERS_LAG : 0)}>
      {loading ? <KpiSkeleton n={kpis.length} /> : (
        <div className="kpi-grid">
          {kpis.map((k, i) => (
            <KpiCard key={k.key + token} k={k} selected={k.key === sel} delay={i * 0.06} empty={empty}
              onPress={() => {
                if (tabKey !== 'overview') return setSel(tabKey, k.key);
                // Overview：点另一张卡 → 选它，雷达跟到对应维度；再点已选中的卡 → 保持选中（和 Top posts 胶囊一样）
                if (k.key === sel) return;
                setSel(tabKey, k.key);
                useApp.getState().syncRose('A', KPI_AREA[k.key]);
              }} />
          ))}
        </div>
      )}
      <div className="chart-wrap">
        {loading ? <Skel h={150} r={6} style={{ marginTop: 12 }} /> : empty ? (
          // 美国 2026-11-22（usrec 0:38）：空数据时仍画出网格，两端是完整日期
          <div className="chart-empty-grid"><i /><i /><i /><div><span>{monDayYear(data[0].date)}</span><span>{monDayYear(data[data.length - 1].date)}</span></div></div>
        ) : (
          <TrendChart key={selKpi.key} animKey={`${token}-${selKpi.key}`} data={data}
            hatchLast={selKpi.key !== 'followersTotal'} minZero={selKpi.key !== 'followersTotal'}
            fmtValue={isMoney ? (v) => '$' + v.toFixed(2) : fmtStat} />
        )}
      </div>
    </Section>
  );
}

function TrafficSource({ loading, empty }) {
  const range = useApp((s) => s.range);
  const rows = useMemo(() => trafficSources(range), [range]);
  return (
    <Section title="Traffic source" info={TRAFFIC_INFO}>
      {loading || empty ? (
        <div className="muted-note">You’ll be able to see this information once there’s enough data.</div>
      ) : <BarRows rows={rows} />}
    </Section>
  );
}

function Overview({ loading, empty }) {
  const range = useApp((s) => s.range);
  const push = useApp((s) => s.push);
  const market = useApp((s) => s.market);
  const kpis = useMemo(() => overviewKpis(range, market), [range, market]);
  const sel = useApp((x) => x.kpiSel.overview);
  return (
    <>
      {/* 终稿：原 Creator Assistant 提示卡取消，入口并入模块 A 底部的「Ask Creator Assistant」行；新账号（数据处理中）不出洞察卡 */}
      {!empty && <InsightSlot Module={ModuleA} loading={loading} />}
      <KeyMetrics tabKey="overview" kpis={kpis} chartMetric={(k) => k} loading={loading} empty={empty} right={!empty && <RangeDropdown />} />
      {/* 美国 2026-11-22（usrec 0:47 / 0:49）：只有选中 Est. rewards 卡时，图表下方才出现「View rewards analytics」 */}
      {!loading && sel === 'rewards' && <div className="ra-btn-wrap"><button className="hd-more" data-act="view-rewards-analytics" onClick={() => push(useApp.getState().market === 'store' ? 'rewardsAnalytics' : 'rewardsAnalyticsUS')}>View rewards analytics</button></div>}
      <TrafficSource loading={loading} empty={empty} />
      {/* 美国 2026-11-22（usrec 0:40）：Overview 底部是 Search queries；Android 的 Article link metrics 美国录屏里没有 */}
      <Section title="Search queries" info="Search terms that led viewers to your posts.">
        <div className="muted-note">Traffic from all current search queries is low. Information will be available when one or more queries has enough traffic.</div>
      </Section>
    </>
  );
}

function Insights({ title, data, tabKey }) {
  const pill = useApp((s) => s.insightPill[tabKey]);
  const setPill = useApp((s) => s.setInsightPill);
  const push = useApp((s) => s.push);
  return (
    <Section title={title} info="Insights are based on viewers in the last 7 days.">
      {useApp.getState().newAccount && <div className="muted-note small" style={{ marginBottom: 10 }}>Data is only shown when there are at least 100 viewers in the selected period.</div>}
      <Pills variant="blue" value={pill} onChange={(k) => setPill(tabKey, k)} items={Object.keys(data).map((k) => ({ key: k, label: k === 'Locations' ? 'Location' : k }))} />
      <div style={{ marginTop: 14 }}>
        {pill === 'Gender' ? <Donut rows={data.Gender} /> : pill === 'Age' ? <BarRows rows={data.Age} /> : (
          <BarRows rows={data.Locations.slice(0, 5)} chevron onRow={(c) => push('locations', { title, focus: c, tabKey })} />
        )}
      </div>
    </Section>
  );
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`));
const HOUR_FULL = (h) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Most active times：固定「In the last 7 days」，有自己的日期步进，不跟随日期胶囊（o1g_0117，Q1）
function MostActive() {
  const [mode, setMode] = useState('Hours');
  const [off, setOff] = useState(() => 6 - ACTIVE_DAYS.indexOf(Math.max(...ACTIVE_DAYS))); // 打开时停在最活跃的那天（和 Viewer summary 的「Thursday around 6 PM」一致），0 = 最近一天
  const [sel, setSel] = useState(null);
  const day = dayDate(PERIOD_END - off);
  const hours = activeHours(off);
  // The sentence always describes the 7-day peak (same as Days mode and the Viewer summary), not the stepped day.
  const ma = mostActive();
  const weekDays = Array.from({ length: 7 }, (_, i) => WEEK[dayDate(PERIOD_END - 6 + i).getDay()]);
  return (
    <Section title="Most active times" info="Times when your viewers were most active on TikTok in the last 7 days.">
      <Pills variant="blue" value={mode} onChange={(m) => { setMode(m); setSel(null); }} items={[{ key: 'Hours', label: 'Hours' }, { key: 'Days', label: 'Days' }]} />
      <div className="active-text">
        {mode === 'Hours'
          ? <>In the last 7 days, your viewers were most active on {ma.day}, between {HOUR_FULL(ma.peak)} and {HOUR_FULL((ma.peak + 1) % 24)}.</>
          : <>In the last 7 days, your viewers were most active on {ma.day}.</>}
      </div>
      {mode === 'Hours' && (
        <div className="stepper">
          <button data-act="active-prev" disabled={off >= 6} onClick={() => { setOff(off + 1); setSel(null); }}><I.left size={16} /></button>
          <span>{monDay(day)}</span>
          <button aria-label="Next" data-act="active-next" disabled={off <= 0} onClick={() => { setOff(off - 1); setSel(null); }}><I.right size={16} /></button>
        </div>
      )}
      {mode === 'Hours'
        ? <BarChart key={`h${off}`} values={hours} labels={HOUR_LABELS} selected={sel} onSelect={setSel} />
        : <BarChart key="d" values={ACTIVE_DAYS} labels={weekDays} tickEvery={1} selected={sel} onSelect={setSel} />}
    </Section>
  );
}

function Viewers({ loading, empty }) {
  const range = useApp((s) => s.range);
  const kpis = useMemo(() => viewerKpis(range), [range]);
  const showToast = useApp((s) => s.showToast);
  return (
    <>
      {/* Final（FIN-S5-Audience-Page）：Tab 下方一句话洞察；日期胶囊离开顶部，「Last 7 days」下拉放在 Key metrics 右侧 */}
      {!empty && !loading && <AudienceInsight tab="viewers" />}
      <KeyMetrics tabKey="viewers" kpis={kpis} chartMetric={(k) => k} loading={loading} empty={empty} right={!empty && <RangeDropdown />} />
      {!empty && <Insights title="Viewer insights" data={VIEWER_INSIGHTS} tabKey="viewers" />}
      {!empty && <MostActive />}
      {!empty && (
        <Section title="Creators your viewers also watched" info="Creators whose posts your viewers also watched in the last 7 days.">
          <div className="h-scroll creators">
            {ALSO_WATCHED_CREATORS.map((c) => (
              <button key={c.name} data-act="also-creator" className="creator-cell" onClick={() => useApp.getState().showAlert({ title: 'Continue to TikTok app?', message: `Open ${c.name} in TikTok`, actions: [{ label: 'Cancel' }, { label: 'Continue', bold: true }] })}>
                <Avatar hue={c.hue} size={58} label={c.name[0]} /><div className="cc-name">{c.name}</div><div className="cc-sub">{c.followers} followers</div>
              </button>
            ))}
          </div>
        </Section>
      )}
      {!empty && (
        <Section title="Posts your viewers also viewed" info="Popular posts your viewers also watched.">
          {ALSO_VIEWED_POSTS.map((p, i) => (
            <div key={i} className="rank-row static"><span className="rank">{i + 1}</span><Cover item={p} w={52} h={68} text={false} /><div className="rr-text"><div className="rr-title">{p.title}</div><div className="rr-sub">{p.views} views</div><div className="rr-sub by"><Avatar hue={p.hue} size={14} />{p.by}</div></div></div>
          ))}
        </Section>
      )}
    </>
  );
}

function Followers({ loading, empty }) {
  const range = useApp((s) => s.range);
  const kpis = useMemo(() => followerKpis(range), [range]);
  return (
    <>
      {!empty && !loading && <AudienceInsight tab="followers" />}
      <KeyMetrics tabKey="followers" kpis={kpis} chartMetric={(k) => k} loading={loading} empty={empty} right={!empty && <RangeDropdown />} />
      {!empty && <Insights title="Follower insights" data={FOLLOWER_INSIGHTS} tabKey="followers" />}
      {!empty && <MostActive />}
    </>
  );
}

function Content({ loading, empty }) {
  const range = useApp((s) => s.range);
  const metric = useApp((s) => s.topMetric);
  const setMetric = useApp((s) => s.setTopMetric);
  const topToken = useApp((s) => s.topToken);
  const listLoading = useRefill(topToken, 700) || loading;
  const push = useApp((s) => s.push);
  const detailEntry = useApp((s) => s.detailEntry);
  const rows = useMemo(() => topPosts(metric, range), [metric, range]);
  const unit = TOP_METRICS.find((m) => m.key === metric).unit;
  const days = rangeDays(range);
  return (
    <>
    {/* 终稿：模块 B 在 Content 顶部；日期胶囊离开顶部，「Last 7 days」下拉放在 Top posts 标题右侧 */}
    {!empty && <InsightSlot Module={ModuleB} loading={loading} />}
    <Section title="Top posts" right={!empty && <RangeDropdown />} info="Shows posts that performed well during the selected period, ranked by views, likes, new viewers and new followers.">
      <Pills variant="blue" value={metric} onChange={(k) => { if (k === metric) return; setMetric(k); useApp.getState().syncRose('B', TOP_AREA[k]); }} items={TOP_METRICS.map((m) => ({ key: m.key, label: m.label }))} />
      <div style={{ marginTop: 8 }}>
        {empty ? <div className="muted-note center" style={{ padding: '60px 0' }}>Data is processing. Check back in 1–2 days.</div> : listLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rank-row"><Skel w={14} h={14} /><Skel w={56} h={74} /><div style={{ flex: 1 }}><Skel h={14} /><Skel h={14} w="70%" style={{ marginTop: 6 }} /><Skel h={10} w="40%" style={{ marginTop: 10 }} /></div></div>
          ))
        ) : rows.map(({ post, value }, i) => (
          <motion.button key={post.id + metric} className="rank-row" data-act="top-post-open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            onClick={() => push(detailEntry === 'player' ? 'player' : 'videoAnalysis', { postId: post.id })}>
            <span className="rank">{i + 1}</span>
            <Cover item={post} w={56} h={74} />
            <div className="rr-text">
              <div className="rr-title">{post.title || 'Untitled post'}</div>
              <div className="rr-sub">{fmt(value)} {unit} in the last {range.key === 'custom' ? `${days} days` : `${days} days`}</div>
              <div className="rr-sub light">{ago(post.publishedAt)}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </Section>
    </>
  );
}

// 美国版 LIVE Tab：宣传图只看到 Tab 名，内容为原型假设
function Live() {
  const range = useApp((s) => s.range);
  return (
    <>
      <Section title="LIVE metrics" info="Metrics from your LIVE videos during the selected period." sub={rangeLabel(range)}>
        <div className="kpi-grid">
          {[['Total views', 0], ['Time watched', 0], ['New followers', 0], ['Diamonds', 0]].map(([l, v], i) => <KpiCard key={l} k={{ key: `live-${i}`, label: l, text: String(v) }} delay={i * 0.04} />)}
        </div>
      </Section>
      <Section title="LIVE videos"><div className="muted-note">You haven’t gone LIVE in this period.</div></Section>
    </>
  );
}

export function AnalyticsScreen() {
  const aTab = useApp((s) => s.aTab);
  const setATab = useApp((s) => s.setATab);
  const token = useApp((s) => s.rangeToken);
  const empty = useApp((s) => s.newAccount);
  const spin = useTabFirstLoad('analytics', 450); // 美国 2026-11-22（usrec 0:36）：先是居中的两点 loading
  const first = useTabFirstLoad('analytics', 1050); // → 骨架（usrec 0:37）→ 内容
  const refilling = useRefill(token, 900);
  const loading = first || refilling;
  const market = useApp((s) => s.market);
  const Body = { overview: Overview, content: Content, viewers: Viewers, followers: Followers, live: Live }[aTab] || Overview;
  return (
    <div className="screen gray">
      <div className="fixed-head">
        <LargeHeader title="Analytics" search="spark" />
        {!spin && <TopTabs id="atabs" tabs={market === 'store' ? A_TABS_US : A_TABS} value={aTab} onChange={setATab} equal={false} className="a-tabs" />}
      </div>
      {spin ? <div className="spin-center"><Spinner /></div> : (
        <Scroll id={`analytics-${aTab}`} className="with-tabbar">
          {/* 新账号「Data is processing」状态下没有日期胶囊（usrec 0:38，ioQ_0034） */}
          {/* 终稿：Overview / Content / Viewers / Followers 的日期选择都移到区块标题右侧的下拉；只有美国版 LIVE 仍是胶囊 */}
          {!empty && aTab === 'live' && <RangePills />}
          {empty && <ProcessingBanner />}
          <Body loading={loading} empty={empty} />
          <div style={{ height: 12 }} />
        </Scroll>
      )}
    </div>
  );
}

// Locations 详情（原型假设：Locations 行尾有 ›，点开内容未录到）
export function LocationsScreen({ params }) {
  const data = params.tabKey === 'followers' ? FOLLOWER_INSIGHTS : VIEWER_INSIGHTS;
  return (
    <div className="screen">
      <NavBar title="Locations" />
      <Scroll>
        <div className="pad">
          <div className="muted-note" style={{ marginBottom: 12 }}>{params.title} · Last 7 days</div>
          <BarRows rows={data.Locations} />
        </div>
      </Scroll>
    </div>
  );
}

export function ArticleLinksScreen() {
  return (
    <div className="screen">
      <NavBar title="Article link metrics" />
      <div className="pad"><div className="muted-note">Add a link to a photo post to see views and clicks here.</div></div>
    </div>
  );
}
