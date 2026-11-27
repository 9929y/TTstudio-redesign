// 插图位：把图片放进 prototype_v4/illustrations/<插图名>.<png|jpg|webp|svg|gif> 即可替换原型里画的插图；
// 封面放进 illustrations/covers/（任意文件名，按文件名排序轮流使用）。构建时会内联进单文件 HTML。
// 清单与尺寸见 illustrations/README.md。
const FILES = import.meta.glob('../../illustrations/*.{png,jpg,jpeg,webp,svg,gif}', { eager: true, query: '?url', import: 'default' });
const COVER_FILES = import.meta.glob('../../illustrations/covers/*.{png,jpg,jpeg,webp,gif}', { eager: true, query: '?url', import: 'default' });

const BY_NAME = Object.fromEntries(Object.entries(FILES).map(([p, url]) => [p.split('/').pop().replace(/\.[^.]+$/, ''), url]));
export const COVERS = Object.keys(COVER_FILES).sort().map((k) => COVER_FILES[k]);
export const illoUrl = (name) => BY_NAME[name] || null;
// 封面：item.cover 指定照片名（不带扩展名）；没指定时按 hue 轮流取
const COVER_BY_NAME = Object.fromEntries(Object.keys(COVER_FILES).map((k) => [k.split('/').pop().replace(/\.[^.]+$/, ''), COVER_FILES[k]]));
export const coverUrl = (item) => COVER_BY_NAME[item?.cover] || (COVERS.length ? COVERS[Math.abs(Math.round(item?.hue ?? 200)) % COVERS.length] : null);
// 其他创作者的头像：illustrations/avatars/，按创作者的 hue 对应（Discover 的 6 位、Also watched 的 5 位）
const AVATAR_FILES = import.meta.glob('../../illustrations/avatars/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' });
const AVATARS = Object.keys(AVATAR_FILES).sort().map((k) => AVATAR_FILES[k]);
const AVATAR_HUES = { 10: 1, 67: 2, 124: 3, 181: 4, 238: 2, 295: 4, 20: 3, 160: 1, 260: 2, 40: 4, 200: 3 };
export const avatarUrl = (hue) => (AVATARS.length > 4 && AVATAR_HUES[hue] != null ? AVATARS[AVATAR_HUES[hue]] : null);

// 有图用图，没图显示 fallback（原型自绘的 SVG）
export function Illo({ name, fallback, className, style, alt = '' }) {
  const url = BY_NAME[name];
  if (!url) return fallback ?? null;
  return <img src={url} alt={alt} className={`illo ${className || ''}`} style={style} draggable={false} />;
}
// 作为背景图（头图、装饰）
export const illoBg = (name) => (BY_NAME[name] ? { backgroundImage: `url("${BY_NAME[name]}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined);
