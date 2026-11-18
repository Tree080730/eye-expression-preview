# 动态眼神表情预览

基于团队提供的眼神设计制作的浏览器交互原型，包含困惑、开心、惊讶、生气、伤心、无聊和困了七种情绪。

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

- 点击情绪按钮切换静止表情，再点「播放」查看约 7.6 秒的动作。
- 可暂停、继续、重播，或拖动进度条检查任意时刻。
- 鼠标移入绿色画布，白眼与瞳孔一起跟随。移出后平滑回位。
- 七种表情以静止轮廓在 844 × 580 画布内居中，播放时叠加各自动作。
- 鼠标跟随适用于鼠标与触控笔。触屏可使用情绪选择和播放控件。系统启用减少动态效果时关闭鼠标跟随。

## 表情动作

| 情绪 | 主要动作 |
| --- | --- |
| 困惑 | 扫视，双眼交替倾斜 |
| 开心 | 双圆眼，下缘弧形裁切，轻快弹跳 |
| 惊讶 | 左方右圆，突然睁大并稍微张开 |
| 生气 | 双眼向内挤，眼形压低 |
| 伤心 | 缓慢下沉，眼形收窄 |
| 无聊 | 侧向慢扫，眼皮逐渐压低 |
| 困了 | 眼皮下垂、短暂睁开、闭眼停留后恢复 |

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
