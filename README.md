## UNION 品牌网站 / 团队体验

[在线体验](https://Tree080730.github.io/eye-expression-preview/walking-companion/) · [网站源码与接入说明](walking-companion/README.md)

灰紫金属海报视觉、一屏左右展开、八种表情交互、五种场景及视频接口、模拟设备控制。视频素材和真实硬件尚未接入。原表情预览入口保持不变。

# 动态眼神表情预览

基于团队提供的眼神设计制作的浏览器交互原型，包含默认待机、六点等待，以及困惑、开心、惊讶、生气、伤心、无聊和困了七种情绪。

在线体验：[打开动态表情预览](https://tree080730.github.io/eye-expression-preview/) 。

## 运行

直接用 Chrome、Edge 或 Safari 打开 `expression-preview/index.html`，即可离线使用，无需安装依赖。

也可以在仓库根目录启动本地服务。

```sh
python3 -m http.server 8000
```

打开 http://localhost:8000/expression-preview/ 。

## 在线发布

仓库包含 `.github/workflows/pages.yml`，将预览目录发布到 GitHub Pages 网站根路径。

首次推送后，在 GitHub 仓库的 Settings → Pages 中将 Source 设为 GitHub Actions，再运行 Publish expression preview 工作流。部署成功后，从 Pages 设置或 Actions 的 github-pages 环境获取实际预览地址。团队成员打开该地址即可操作表情，后续推送到 main 会自动更新网页。

项目已上传并通过 GitHub Pages 部署。团队成员可直接打开上方的在线体验链接，后续推送到 main 会自动发布更新。

## 使用

- 点击情绪按钮切换静止表情，再点「播放」查看动作（待机 10.4 秒，情绪动画含进出过渡共 12 秒，等待 11.4 秒）。
- 可暂停、继续、重播，或拖动进度条检查任意时刻。
- 点击「导出 GIF」下载当前表情的预设动作，默认 844 × 580、20 帧/秒、待机 10.4 秒／情绪 12 秒／等待 11.4 秒、所选纯色背景、无限循环。导出独立于鼠标位置，GIF 在 Mosaico 中按录制好的画面播放。
- 鼠标移入绿色画布，白眼与瞳孔一起跟随。移出后平滑回位。
- 开心保持双圆眼，用脸颊托起下眼睑表现笑意。困惑保留规律的方圆交换，惊讶与无聊降低交换频率，生气、伤心和困了固定左右眼形状。方圆交换均在闭眼期间完成。
- 整套表情共用基础显示比例，按全套动作范围放大并预留边距。所有情绪从相同的待机画面开始，经眨眼进入情绪，结束前经眨眼回到相同的待机画面。等待状态使用双眼收缩、白点展开的连续形变，不使用眨眼切换。
- 背景颜色可调，并填满整个预览和导出画布；支持全屏预览。
- 预览及 GIF 的首尾帧使用同一张待机画面，跨情绪也完全一致。设备需在播放边界切换文件以实现连续衔接。
- 鼠标跟随适用于鼠标与触控笔。触屏可使用情绪选择和播放控件。系统启用减少动态效果时关闭鼠标跟随。

## 表情动作

| 情绪 | 主要动作 |
| --- | --- |
| 待机 | 默认双圆眼、居中瞳孔，轻微呼吸起伏，偶尔眨眼和小幅扫视 |
| 等待 | 双眼蓄力后向中央收成一个白点，挤压回弹再弹开为六个白点（进入与退出均为 0.5 秒）；圆点依次弹跳，结束反向合拢并恢复共同待机画面（11.4 秒） |
| 困惑 | 扫视，双眼交替倾斜 |
| 开心 | 从完整双圆眼开始，脸颊逐渐鼓起、挤出笑眼后放松 |
| 惊讶 | 圆眼适度放大、瞳孔收小，方眼缩小眯起并倾斜；低频交换左右眼形状 |
| 生气 | 固定眼形，向内皱紧、压低眼皮，短促发抖后松开 |
| 伤心 | 固定眼形，下沉垂眼，成组抽泣，勉强抬眼后低落 |
| 无聊 | 低频交换眼形，半睁慢扫、轻微抬眼，拖长眨眼 |
| 困了 | 固定眼形，逐渐垂头后突然下坠，猛抬头睁眼惊醒 |

## 修改代码

当前实现集中在 `expression-preview/index.html`。

- `expressions` 配置眼形、瞳孔、扫视、眨眼与情绪动作。
- `gaze` 的 `x`、`y` 是瞳孔相对基础姿势的位移。
- `motion` 的 `stretch` 控制纵向伸缩，`pinch` 控制双眼向内挤压，`lift` 控制上抬，`tilt` 控制旋转弧度。
- 时间 `at` 与 `duration` 使用毫秒，坐标按画布原始像素计算。
- 动作关键帧经弹簧积分生成，鼠标跟随与预设动作叠加。
- `measureCenterOffset` 测量各表情静止时的可见边界，确定居中偏移。

## 来源

参考仓库为 https://github.com/legendtired/grok-bot-study ，本原型参考的版本为 `dfe1140`。

`MotionClock` 来自其 `web/bot-element.jsx`。弹簧积分、视线缓动和眨眼时序参考其 `web/motion-engine.js`。本项目增加了团队眼形、七种情绪的动作编排、Canvas 绘制、居中与预览控件。

来源项目将用途限定为个人学习、研究和非商业实验，且说明原始动画代码与相关表达存在第三方权利。团队后续使用时需一并核对其来源和授权范围。

- https://github.com/legendtired/grok-bot-study/blob/dfe1140/RIGHTS.md
- https://github.com/legendtired/grok-bot-study/blob/dfe1140/LICENSE

## 已验证范围

Chrome 中已检查七种表情的动作、静止居中、鼠标跟随回位，以及播放、暂停、拖动和手机布局。硬件接入尚待实现。

## GIF 编码依赖

浏览器本地编码使用 gifenc 1.0.3（MIT），已随项目存放于 `expression-preview/vendor/`，无需访问外部 CDN。原许可证见 `expression-preview/vendor/gifenc-LICENSE.md`。来源为 https://github.com/mattdesl/gifenc 。
