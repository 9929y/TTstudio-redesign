// Create 与发布：QKE_0124（iOS 2026 Create）、o1g 3:29–4:50（AutoCut / 发布页 / 存草稿）、zaDQ 0:58–1:50（定时发布）
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store.js';
import { LargeHeader, Cover, Scroll, Empty, Spinner, NavBar } from '../ui/kit.jsx';
import { I } from '../ui/Icons.jsx';
import { Illo } from '../ui/illo.jsx';
import { MEDIA, NOW, N_DAYS } from '../data/seed.js';
import { secToClock, monDay } from '../data/agg.js';
import { CuratedForMe } from '../insight/CuratedForMe.jsx';
import { AiStar } from '../insight/CardParts.jsx';

const pad2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;

// ---------------- Create 根页 ----------------
export function CreateScreen() {
  const openModal = useApp((s) => s.openModal);
  const market = useApp((s) => s.market); // 美国版草稿区叫 Projects（appstore_create）；非美区 2026 叫 Drafts
  const allDrafts = useApp((s) => s.drafts);
  const newAccount0 = useApp((s) => s.newAccount);
  // 新账号没有预置草稿，只显示自己刚存的
  const drafts = newAccount0 ? allDrafts.filter((d) => !d.seed) : allDrafts;
  const showAlert = useApp((s) => s.showAlert);
  const showToast = useApp((s) => s.showToast);
  const openSheet = useApp((s) => s.openSheet);
  const newAccount = useApp((s) => s.newAccount);
  // 2026-11 iOS：4 个工具（新增 Auto captions，7m2O_0106）；2026-06/08 为 3 个（Y2um_0138、QKE_0124）
  const tiles = [
    { key: 'captions', label: 'Auto captions', icon: <I.toolCaptions size={28} />, on: () => openModal('picker', { mode: 'captions' }) },
    { key: 'photo', label: 'Photo editor', icon: <I.toolPhoto size={28} />, on: () => openModal('picker', { mode: 'photo' }) },
    { key: 'autocut', label: 'AutoCut', icon: <I.toolAutocut size={28} />, on: () => openModal('picker', { mode: 'autocut' }) },
    { key: 'camera', label: 'Camera', icon: <I.toolCamera size={28} />, on: () => openModal('camera') },
  ];
  return (
    <div className="screen create-page">
      <Illo name="create-bg" className="create-swirl" fallback={<svg className="create-swirl" viewBox="0 0 393 240" aria-hidden="true"><path d="M-20 150C60 40 140 200 220 90S340 20 420 60" /><path d="M-10 210C90 120 190 250 300 150" /></svg>} />
      <div className="fixed-head"><LargeHeader title="Create" search="spark" bell={false} /></div>
      <Scroll id="create" className="with-tabbar">
        <div className="create-tiles">
          {tiles.map((t) => (
            <button key={t.key} className="ct" data-act={`create-${t.key}`} onClick={t.on}>
              <span className="ct-box">{t.icon}</span><span className="ct-label">{t.label}</span>
            </button>
          ))}
        </div>
        <button className="upload-btn" data-act="create-upload" onClick={() => openModal('picker', { mode: 'upload' })}><I.plus size={18} /> Upload</button>
        {/* FIN-S1-Page: Curated for me sits between Upload and Drafts */}
        <CuratedForMe place="create" only={newAccount ? 'trend' : ''} />
        <div className="drafts-title">{market === 'store' ? 'Projects' : 'Drafts'}</div>
        {drafts.length === 0 ? (
          <Empty title="No drafts yet" desc="Videos or photos that you save before posting will appear here" />
        ) : (
          <div className="drafts-grid">
            <AnimatePresence initial={false}>
              {drafts.map((d) => (
                <motion.div key={d.id} layout className="draft-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <button className="dc-thumb" data-act="draft-open" onClick={() => openModal('composer', { draftId: d.id })}>
                    <Cover item={d.media[0]} w={70} h={92} text={false} radius={3} />
                  </button>
                  <div className="dc-meta">
                    <div><div className="dc-name">{d.name}</div><div className="dc-sub">{d.size} · {d.kind}</div></div>
                    <button aria-label="More options" data-act="draft-more" onClick={() => openSheet('iosActions', { actions: [{ label: 'Delete', destructive: true, act: 'draft-delete', on: () => useApp.getState().removeDraft(d.id) }] })}><I.more size={18} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Scroll>
    </div>
  );
}

// ---------------- 素材选择器（o1g_0332：All / Videos / Photos） ----------------
export function PickerScreen({ params }) {
  const close = useApp((s) => s.closeModal);
  const push = useApp((s) => s.push);
  const [tab, setTab] = useState(params.mode === 'photo' ? 'Photos' : params.mode === 'captions' ? 'Videos' : 'All');
  const [sel, setSel] = useState([]);
  const [processing, setProcessing] = useState(null);
  const items = MEDIA.filter((m) => tab === 'All' || (tab === 'Videos' ? m.type === 'video' : tab === 'Live Photos' ? m.type === 'photo' && m.id.endsWith('4') : m.type === 'photo'));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const next = () => {
    const media = sel.map((id) => MEDIA.find((m) => m.id === id));
    if (params.mode === 'autocut') {
      // AutoCut：Processing x% · Stay on this screen to finish processing（o1g 3:32）
      setProcessing(0);
      let p = 0;
      const t = setInterval(() => {
        p += 7 + Math.random() * 9;
        if (p >= 100) { clearInterval(t); setProcessing(null); push('editor', { media, mode: 'autocut' }); }
        else setProcessing(Math.round(p));
      }, 160);
      return;
    }
    push('editor', { media, mode: params.mode });
  };
  return (
    <div className="screen">
      <div className="picker-top">
        <button aria-label="Close" data-act="picker-close" onClick={close}><I.close size={24} /></button>
        <button className="album" data-act="picker-album">{useApp.getState().market === 'store' ? 'All' : 'Recents'} <I.down size={16} /></button>
        <span style={{ width: 24 }} />
      </div>
      <div className="picker-tabs">
        {['All', 'Videos', 'Photos', 'Live Photos'].map((t) => (
          <button key={t} data-act={`picker-tab-${t}`} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}{tab === t && <motion.i layoutId="pk" className="tt-line" />}</button>
        ))}
      </div>
      <Scroll className="picker-grid-wrap">
        <div className="picker-grid">
          {items.map((m) => {
            const n = sel.indexOf(m.id) + 1;
            return (
              <button key={m.id} className="pk-cell" aria-label="Select item" data-act="picker-select" onClick={() => toggle(m.id)}>
                <Cover item={m} w={130} h={130} text={false} radius={0} />
                {m.type === 'video' && <span className="pk-dur">{secToClock(m.duration)}</span>}
                <span className={`pk-check ${n ? 'on' : ''}`}>{n || ''}</span>
              </button>
            );
          })}
        </div>
      </Scroll>
      <AnimatePresence>
        {sel.length > 0 && processing == null && (
          <motion.div className="picker-bar" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
            <button className="btn-primary block" data-act="picker-next" onClick={next}>Next ({sel.length})</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {processing != null && (
          <>
            <motion.div className="sheet-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="proc-card" initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
              <button aria-label="Cancel" className="sheet-x" data-act="autocut-cancel" onClick={() => setProcessing(null)}><I.close size={20} /></button>
              <div className="proc-ring"><Cover item={MEDIA.find((m) => m.id === sel[0])} w={56} h={56} text={false} radius={8} /><span>{processing}%</span></div>
              <div className="proc-title">Processing…</div>
              <div className="muted-note">Stay on this screen to finish processing</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- 编辑页（o1g_0447：右侧工具栏 + Save to camera roll / Next） ----------------
const TEMPLATES = ['Your Story', 'Recap', 'Daily', 'Cozy', 'Fast cut', 'Retro'];
export function EditorScreen({ params }) {
  const push = useApp((s) => s.push);
  const pop = useApp((s) => s.pop);
  const showToast = useApp((s) => s.showToast);
  const openSheet = useApp((s) => s.openSheet);
  const [tpl, setTpl] = useState(0);
  const [idx, setIdx] = useState(0);
  const [texts, setTexts] = useState([]);
  const [sound, setSound] = useState(null);
  const media = params.media;
  const m = media[idx % media.length];
  useEffect(() => { if (media.length > 1) { const t = setInterval(() => setIdx((i) => i + 1), 1600); return () => clearInterval(t); } }, [media.length]);
  return (
    <div className="screen black editor">
      <div className="ed-top">
        <button aria-label="Back" data-act="nav-back" onClick={pop}><I.arrowBack size={24} /></button>
        <button className="ed-sound" data-act="editor-sound" onClick={() => openSheet('sound', { onPick: setSound })}><I.music size={16} /> {sound || 'Add sound'}</button>
        <span style={{ width: 24 }} />
      </div>
      <div className="ed-tools">
        <button data-act="editor-text" onClick={() => setTexts((t) => [...t, `Text ${t.length + 1}`])}><I.text size={24} /><span>Text</span></button>
        <button data-act="editor-sticker" onClick={() => openSheet('toolTray', { kind: 'stickers' })}><I.sticker size={24} /><span>Stickers</span></button>
        <button data-act="editor-effects" onClick={() => openSheet('toolTray', { kind: 'effects' })}><I.effects size={24} /><span>Effects</span></button>
        <button data-act="editor-filter" onClick={() => openSheet('toolTray', { kind: 'filters' })}><I.filter size={24} /><span>Filters</span></button>
      </div>
      <div className="ed-canvas">
        <AnimatePresence mode="popLayout">
          <motion.div key={m.id + idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Cover item={m} w={300} h={400} text={false} radius={8} big t={params.mode === 'autocut' ? (idx % 4) / 4 : 0} />
          </motion.div>
        </AnimatePresence>
        {params.mode === 'captions' && <div className="ed-caption">{['Okay so here\u2019s the trick', 'you only need three things', 'and ten minutes'][idx % 3]}</div>}
        {texts.map((t, i) => (
          <motion.div key={i} drag dragMomentum={false} className="ed-text" initial={{ scale: 0.6 }} animate={{ scale: 1 }} style={{ top: 140 + i * 40 }}>{t}</motion.div>
        ))}
      </div>
      {params.mode === 'autocut' && (
        <div className="ed-templates">
          <div className="ed-tpl-head">Change a template</div>
          <div className="h-scroll">
            {TEMPLATES.map((t, i) => (
              <button key={t} data-act="editor-template" className={`tpl ${tpl === i ? 'on' : ''}`} onClick={() => setTpl(i)}>
                <Cover item={{ hue: (i * 50 + 20) % 360, emoji: '✨' }} w={54} h={70} text={false} radius={6} /><span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="ed-bottom">
        <button className="btn-white story" data-act="editor-your-story" onClick={() => showToast('Shared to your Story')}><span className="story-ring" />Your Story</button>
        <button className="btn-primary" data-act="editor-next" onClick={() => push('composer', { media, mode: params.mode, sound })}>Next</button>
      </div>
    </div>
  );
}

// ---------------- 发布页（o1g_0441 / zaDQ_0100 / zaDQ_0139） ----------------
export function makeUserPost({ title, media, scheduledAt, privacy }) {
  const id = `u${Date.now()}`;
  const dur = media[0]?.duration || 10;
  return {
    id, user: true, title, emoji: media[0]?.emoji || '🎬', hue: media[0]?.hue || 200, coverText: null,
    publishedAt: scheduledAt || new Date(NOW), scheduledAt, status: scheduledAt ? 'scheduled' : 'uploading', progress: 0,
    privacy: privacy || 'everyone', duration: dur, views: 0, likes: 0, comments: 0, shares: 0, saves: 0,
    likeRate: 0, retention: Array.from({ length: dur + 1 }, (_, s) => (s === 0 ? 1 : 0)), avgPct: 0, avgWatch: 0, watchedFull: 0,
    newFollowers: 0, newViewerRate: 0, followerViewerRate: 0, traffic: {}, gender: { Female: 0, Male: 0, Other: 0 }, topWords: [], searchQueries: [],
    hourly: [0, 0], daily: new Float64Array(N_DAYS), pubIdx: N_DAYS - 1, commentList: [],
  };
}

export function ComposerScreen({ params }) {
  const pop = useApp((s) => s.pop);
  const market = useApp((s) => s.market);
  const closeModal = useApp((s) => s.closeModal);
  const openSheet = useApp((s) => s.openSheet);
  const drafts = useApp((s) => s.drafts);
  const draft = params.draftId ? drafts.find((d) => d.id === params.draftId) : null;
  const media = draft?.media || params.media;
  const [desc, setDesc] = useState(draft?.desc || '');
  const [ptitle, setPtitle] = useState('');
  const allPhotos = media.length > 1 && media.every((m) => m.type === 'photo');
  const [privacy, setPrivacy] = useState(draft?.privacy || 'everyone');
  const [sched, setSched] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  useEffect(() => { const h = (e) => setPlaylist(e.detail); window.addEventListener('pick-playlist', h); return () => window.removeEventListener('pick-playlist', h); }, []);
  const [processing, setProcessing] = useState(false);
  const taRef = useRef(null);
  const insert = (s) => { setDesc((d) => (d && !d.endsWith(' ') ? d + ' ' : d) + s); taRef.current?.focus(); };

  const saveDraft = () => {
    // 存草稿：Processing 遮罩 → 回到 Create → toast「Draft saved」→ Drafts 网格新增（o1g 4:47–4:50）
    setProcessing(true);
    setTimeout(() => {
      const st = useApp.getState();
      const base = ymd(NOW);
      const same = st.drafts.filter((d) => d.name.startsWith(base)).length;
      if (draft) st.removeDraft(draft.id);
      st.addDraft({
        id: `d${Date.now()}`, name: same && !draft ? `${base}-${same}` : draft?.name || base, media, desc, privacy,
        size: `${(media.length * 38.4 + 12.1).toFixed(1)}M`, kind: media.every((m) => m.type === 'photo') ? `${media.length} Photo` : secToClock(media.reduce((a, m) => a + (m.duration || 3), 0)),
      });
      st.closeModal();
      st.resetTab('create');
      useApp.setState({ tab: 'create' });
      setTimeout(() => st.showToast('Draft saved', 'pill'), 380);
    }, 1100);
  };

  const publish = () => {
    const st = useApp.getState();
    const post = makeUserPost({ title: desc.trim(), media, scheduledAt: sched, privacy });
    if (draft) st.removeDraft(draft.id);
    // iOS 2026-11（7m2O 2:16 之后）：点 Schedule 后直接回到发起页（Create），没录到 toast；
    // Manage 顶部的绿色进度条 → 100% → toast 来自 Android（zaDQ 1:42–1:50）
    st.closeModal();
    st.addUserPost(post);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 4 + Math.random() * 7);
      useApp.getState().updateUserPost(post.id, { progress: p });
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => {
          const s2 = useApp.getState();
          if (sched) s2.showToast('Post scheduled', 'center');
          else { s2.updateUserPost(post.id, { status: 'posted' }); s2.showToast('Post uploaded', 'center'); }
        }, 250);
      }
    }, 140);
  };

  const schedLabel = sched ? `${monDay(sched)}, ${pad2(sched.getHours())}:${pad2(sched.getMinutes())}` : null; // 7m2O_0216「18 de nov., 13:40」
  const privLabel = { everyone: 'Everyone can view this post', friends: 'Friends can view this post', only_you: 'Only you can view this post' }[privacy];
  return (
    <div className="screen">
      <NavBar title={market === 'store' ? 'Post' : ''} onBack={draft ? closeModal : pop} close={!!draft} />
      <Scroll className="composer">
        {market === 'store' ? (<>
        {/* V4 美国版发布页（appstore_post_schedule）：标题 Post；4000 字提示；Select cover；# Hashtags / @ Mention / ▶ Videos；Schedule post / Tag people / Add location / Add link / Everyone can view / More options / Share to */}
        <div className="cmp-top">
          <textarea ref={taRef} data-act="composer-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Create more informative content when you go into greater detail with 4000 characters." />
          <button className="cmp-cover" data-act="composer-edit-cover" onClick={() => openSheet('info', { title: 'Select cover', text: 'Choose a frame from your video or upload an image to use as the cover.' })}>
            <Cover item={media[0]} w={92} h={128} text={false} radius={6} /><span>Select cover</span>
          </button>
        </div>
        <div className="cmp-chips">
          <button data-act="composer-hashtag" onClick={() => insert('#')}><I.hash size={14} /> Hashtags</button>
          <button data-act="composer-mention" onClick={() => insert('@')}><I.at size={14} /> Mention</button>
          <button data-act="composer-videos" onClick={() => openSheet('info', { title: 'Videos', text: 'Link related videos so viewers can find more of your content.' })}><I.play size={13} /> Videos</button>
        </div>
        <div className="cmp-rows">
          <button className="cmp-row" data-act="composer-schedule" onClick={() => openSheet('schedule', { value: sched, onDone: setSched })}><I.clock size={20} /><span>Schedule post</span>{schedLabel && <em>{schedLabel}</em>}<I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-tag" onClick={() => openSheet('info', { title: 'Tag people', text: 'Tag up to 20 people in this post.' })}><I.people size={20} /><span>Tag people</span><I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-location" onClick={() => openSheet('info', { title: 'Add location', text: 'Add a location so people nearby can discover your post.' })}><I.globe size={20} /><span>Add location</span><I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-link" onClick={() => openSheet('info', { title: 'Add link', text: 'Add a link to a product, playlist or website.' })}><I.plus size={20} /><span>Add link</span><I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-privacy" onClick={() => openSheet('postPrivacy', { value: privacy, onPick: setPrivacy })}><I.globe size={20} /><span>{privLabel}</span><I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-more" onClick={() => openSheet('moreOptions')}><I.more size={20} /><span>More options</span><I.right size={18} /></button>
          <button className="cmp-row two" data-act="composer-share" onClick={() => openSheet('info', { title: 'Share to', text: 'Automatically share this post to other platforms after it’s published.' })}><I.share size={20} /><span>Share to<small>Other platforms</small></span><I.right size={18} /></button>
        </div>
        </>) : (<>
        {/* 美国 2026-08 iPhone（Buffer @bufferapp 7696486766458440974 0:19–0:28）：多图时顶部是带序号的素材条（第 1 张标 Cover）+ 标题 0/90；
            描述占位「Writing a long description…」；工具条 # / @ / Description ideas / AI；4 行设置。单个视频时沿用巴西 2026-11（7m2O）的「描述 + 右侧封面」。 */}
        {allPhotos && (
          <div className="cmp-strip h-scroll">{media.map((m, i) => <span key={m.id} className="cmp-sm"><Cover item={m} w={66} h={88} text={false} radius={4} /><b>{i === 0 ? 'Cover' : i + 1}</b></span>)}</div>
        )}
        {allPhotos && <div className="cmp-title"><input data-act="composer-title" maxLength={90} value={ptitle} onChange={(e) => setPtitle(e.target.value)} placeholder="Add a title" /><span>{ptitle.length}/90</span></div>}
        <div className="cmp-top">
          <textarea ref={taRef} data-act="composer-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Writing a long description can help get 3x more views on average." />
          {!allPhotos && <button className="cmp-cover" data-act="composer-edit-cover" onClick={() => openSheet('info', { title: 'Edit cover', text: 'Choose a frame from your video or upload an image to use as the cover.' })}>
            <Cover item={media[0]} w={92} h={128} text={false} radius={6} /><i className="cmp-prev">Preview</i><span>Edit cover</span>
          </button>}
        </div>
        <div className="cmp-tools">
          <button data-act="composer-hashtag" aria-label="Hashtag" onClick={() => insert('#')}><I.hash size={16} /></button>
          <button data-act="composer-mention" aria-label="Mention" onClick={() => insert('@')}><I.at size={16} /></button>
          <button className="wide" data-act="composer-desc-ideas" onClick={() => openSheet('descIdeas', { onPick: (t) => setDesc(t) })}><I.bulb size={16} /> Description ideas</button>
          <button className="ai" data-act="composer-ai" aria-label="AI" onClick={() => openSheet('descIdeas', { onPick: (t) => setDesc(t) })}><AiStar size={16} /></button>
        </div>
        <div className="cmp-rows">
          <button className="cmp-row" data-act="composer-disclosure" onClick={() => openSheet('disclosure')}><I.disclosure size={20} /><span>Content disclosure and ads</span><I.right size={18} /></button>
          {/* 巴西 2026-11（7m2O，最新）有 Add to playlist；Buffer 美国 2026-08 的账号没有这一行（播放列表按账号资格开放） */}
          <button className="cmp-row" data-act="composer-playlist" onClick={() => openSheet('playlist')}><I.playlist size={20} /><span>Add to playlist</span>{playlist && <em>{playlist}</em>}<I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-privacy" onClick={() => openSheet('postPrivacy', { value: privacy, onPick: setPrivacy })}><I.globe size={20} /><span>{privLabel}</span><I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-schedule" onClick={() => openSheet('schedule', { value: sched, onDone: setSched })}><I.clock size={20} /><span>Schedule post</span>{schedLabel && <em>{schedLabel}</em>}<I.right size={18} /></button>
          <button className="cmp-row" data-act="composer-more" onClick={() => openSheet('moreOptions')}><I.gear size={20} /><span>More options</span><I.right size={18} /></button>
        </div>
        </>)}
      </Scroll>
      <div className="cmp-bottom">
        <button className="btn-gray" data-act="composer-drafts" onClick={saveDraft}><I.drafts size={18} /> Drafts</button>
        <button className="btn-primary" data-act={sched ? 'composer-schedule-submit' : 'composer-post'} onClick={publish}>
          {sched ? <><I.clock size={18} /> Schedule</> : <><I.uploadCircle size={20} /> Post</>}
        </button>
      </div>
      <AnimatePresence>
        {processing && (
          <motion.div className="proc-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="proc-box"><Spinner dark /><span>Processing</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- 相机（7m2O_0124，iOS 2026-11）：Add sound、右侧工具、10 min / 60 s / 15 s / PHOTO / TEXT、POST / CREATE ----------------
const CAM_MODES = ['10 min', '60 s', '15 s', 'PHOTO', 'TEXT'];
export function CameraScreen() {
  const close = useApp((s) => s.closeModal);
  const push = useApp((s) => s.push);
  const openSheet = useApp((s) => s.openSheet);
  const showToast = useApp((s) => s.showToast);
  const [mode, setMode] = useState(2);
  const [rec, setRec] = useState(null);
  const [front, setFront] = useState(true);
  const [sound, setSound] = useState(null);
  const [bottom, setBottom] = useState('post');
  useEffect(() => {
    if (rec == null) return;
    const max = [600, 60, 15][mode] || 0;
    if (rec >= max) { stop(); return; }
    const t = setTimeout(() => setRec((r) => r + 0.1), 100);
    return () => clearTimeout(t);
  }, [rec]);
  const stop = () => { const d = Math.max(1, Math.round(rec || 1)); setRec(null); push('editor', { media: [{ id: `cam${Date.now()}`, type: 'video', duration: d, hue: front ? 25 : 190, emoji: '🎥' }], mode: 'camera', sound }); };
  const shutter = () => {
    if (CAM_MODES[mode] === 'PHOTO') { push('editor', { media: [{ id: `ph${Date.now()}`, type: 'photo', hue: 40, emoji: '📸' }], mode: 'photo', sound }); return; }
    if (CAM_MODES[mode] === 'TEXT') { showToast('Text mode'); return; }
    if (rec == null) setRec(0); else stop();
  };
  const maxSec = [600, 60, 15][mode];
  return (
    <div className="screen black camera">
      <div className="cam-view" style={{ '--h': front ? 25 : 190 }}><span>{front ? '🙂' : '🍳'}</span></div>
      {rec != null && maxSec && <div className="cam-progress"><i style={{ width: `${(rec / maxSec) * 100}%` }} /></div>}
      <button aria-label="Close" className="cam-x" data-act="camera-close" onClick={close}><I.close size={26} /></button>
      <button className="cam-sound" data-act="camera-sound" onClick={() => openSheet('sound', { onPick: setSound })}><I.music size={15} /> {sound || 'Add sound'}</button>
      <div className="cam-tools">
        <button aria-label="Flip camera" data-act="camera-flip" onClick={() => setFront(!front)}><I.flip size={26} /></button>
        <button aria-label="Flash" data-act="camera-flash" onClick={() => showToast('Flash on')}><I.flash size={26} /></button>
        <button aria-label="Timer" data-act="camera-timer" onClick={() => showToast('Timer set: 3s')}><I.timer size={26} /></button>
        <button aria-label="Effects" data-act="camera-effects" onClick={() => openSheet('toolTray', { kind: 'effects' })}><I.effects size={26} /></button>
      </div>
      {rec == null && (
        <div className="cam-modes">
          {CAM_MODES.map((m, i) => <button key={m} data-act="camera-mode" className={i === mode ? 'on' : ''} onClick={() => setMode(i)}>{m}</button>)}
        </div>
      )}
      <div className="cam-row">
        <button className="cam-gallery" data-act="camera-gallery" onClick={() => push('picker', { mode: 'upload' })}><Cover item={{ hue: 140, emoji: '🖼️' }} w={44} h={44} text={false} radius={8} /></button>
        <button className={`cam-shutter ${rec != null ? 'rec' : ''} ${CAM_MODES[mode] === 'PHOTO' ? 'photo' : ''}`} data-act="camera-shutter" onClick={shutter}><i /></button>
        <span style={{ width: 44 }}>{rec != null && <b className="cam-time">{rec.toFixed(1)}s</b>}</span>
      </div>
      <div className="cam-bottom">
        {['post', 'create'].map((b) => <button key={b} data-act={`camera-${b}`} className={bottom === b ? 'on' : ''} onClick={() => setBottom(b)}>{b.toUpperCase()}</button>)}
      </div>
    </div>
  );
}
