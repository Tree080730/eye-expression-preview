# UNION / Walking Companion

当前交付：灰紫金属海报风格，一屏体验，无需构建。右侧“立即体验”展开场景/视频，左侧为八种表情与模拟设备控制，场景按钮在视频下方。返回首页或 Escape 收起。

在线预览：https://Tree080730.github.io/eye-expression-preview/walking-companion/

## 本地运行

进入本目录，运行 `python3 preview.py`，打开 http://127.0.0.1:8768/ 。安装 Python 3 后即可使用，无需 npm。

## 团队接入

- 页面：index.html；样式：css/style.css、experience.css、metal.css。
- 一屏与表情交互：js/experience.js；媒体与 UI 协调：js/main.js。
- 五种场景和视频路径：js/scenes.js。将 walking.mp4、chilling.mp4、working.mp4、exploring.mp4、playing.mp4 放到 assets/videos/。
- 视频支持播放/暂停/静音/加载提示与错误回退；当前未附实拍视频，默认概念预览。
- js/device.js 分离 DeviceService、DeviceAdapter 与 MockDeviceAdapter。当前连接与行为均为模拟，不会控制真实设备。
- WebSocket/Bluetooth 仅预留接口骨架，接入前需要具体协议与鉴权，不能当作已完成硬件适配。
- 产品使用原透明图片；城市源图为生成的概念摄影，其余环境图来源链接见 assets/images/provenance.json。

原表情预览仍保留在仓库 expression-preview/ 和 GitHub Pages 根入口。
