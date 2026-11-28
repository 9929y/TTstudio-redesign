# 插图位

把图片放进这个文件夹，**文件名照下表起**（扩展名可以是 png / jpg / webp / svg / gif），原型就会用你的图替换自绘的插图。没放图的位置，继续显示原型自绘的版本。

放好之后要重新生成一次：

- 单文件版：在 `prototype_v4/` 运行 `npx vite build`，图片会内联进 `dist/TikTokStudio_prototype.html`。
- 开发预览：重启 `npm run dev`。

| 文件名 | 出现在哪 | 对照的录屏位置 | 显示尺寸（pt） | 建议图片尺寸（px） |
|---|---|---|---|---|
| `welcome` | 首次启动欢迎页的主插图 | iOS 2026-08 QKE 0:22 | 260 × 200 | 780 × 600 |
| `tags-tip` | Creator inspiration 首次进入的引导弹窗「Video tags help you discover content」 | 美国录屏 0:10 | 宽度撑满卡片（约 330）× 150 | 1000 × 450 |
| `no-results` | Creator inspiration → Posts → Recommended 为空时 | 美国录屏 0:21 | 150 × 120 | 450 × 360 |
| `empty-drafts` | Create 页「No drafts yet」 | 美国录屏 1:14 | 172 × 136 | 516 × 408 |
| `empty-circle` | 其他空状态（如 Strikes「No expired strikes」） | — | 172 × 136 | 516 × 408 |
| `ci-hero` | Creator inspiration 粉色头图里的大图形（作为背景铺满头图） | 美国录屏 0:08 / 0:17 | 393 × 178 | 1179 × 534 |
| `create-bg` | Create 页顶部浅灰背景里的线条装饰 | 美国录屏 1:14 | 393 × 240 | 1179 × 720 |
| `crp-squiggle` | Creator Rewards Program 标题旁的绿色涂鸦 | 美国录屏 1:36 | 120 × 50 | 360 × 150 |
| `crp-star` / `crp-video` / `crp-trend` | Creator Rewards Program 三张权益卡右侧的插图（黄 / 绿 / 紫卡） | 美国录屏 1:36 | 62 × 62 | 186 × 186 |
| `avatar` | 本人头像（Home、页头、评论框等所有「本人」头像） | 美国录屏 0:34 | 圆形，最大 58 | 300 × 300 |

## 作品封面 / 视频画面

把图片放进 `illustrations/covers/`，文件名随意，按文件名排序后轮流用作：

- 所有作品封面（Manage、Content、灵感、搜索结果等）
- 视频流画面

建议竖版 9:16，例如 720 × 1280。放了图之后，原型自绘的俯拍场景就不再显示。

## 不在这里替换的

图标（Tab、工具格、营收入口等）是按录屏重画的矢量图形，不属于插图位。如果要替换，告诉我具体是哪一个。

## 2026-11-25：照片素材

- `covers/`：30 张竖版照片（25 张旅行、5 张其他），由 `~/Desktop/TikTok_Studio_Photo_Assets` 压缩到 540 × 960 而来。帖子用 `seed.js` 里 `TITLES` 第 4 项（照片文件名，不带扩展名）指定封面；没指定的按 hue 轮流取。
- `avatar.jpg`：本人头像。`avatars/`：其他创作者头像，按创作者的 hue 对应（见 `src/ui/illo.jsx` 的 `AVATAR_HUES`）。
- 照片是 Pexels 图库素材，仅用于原型，不是真实的 TikTok 视频或账号。来源见 `PHOTO_SOURCES.csv`，说明见 `PHOTO_LICENSE.txt`。
- 账号同日从美食改为旅行（标题、评论、搜索词等）。改之前的文件在 `qa/backup_before_travel/`。
