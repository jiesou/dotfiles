---
name: watch-video
description: Watch a video.
disable-model-invocation: true
---

# Watch Video

把视频变成你能直接读的东西。默认一秒一帧。

## Workflow

1. **元数据**：先 ffprobe，记下时长、分辨率、有无音频轨/字幕轨、真正的视频流是哪条

```bash
ffprobe -v error -show_entries format=duration:stream=index,codec_type,codec_name,width,height:stream_disposition=attached_pic -of json input.mp4
```

2. **抽帧**：默认一秒一帧

```bash
mkdir -p /tmp/video-watch-<slug>
ffmpeg -v error -i input.mp4 -vf "fps=1" /tmp/video-watch-<slug>/%d.jpg
```

- 第 n 张帧的时间戳 = (n-1)/fps 秒。
- 长视频（>30 分钟）降到 `fps=0.25`，或只抽用户关心的时间段（`-ss <start> -t <dur>`）；静态内容（幻灯片/屏幕录制）`fps=0.2` 足够。

3. **转写**：一条命令，URL 和本地文件通吃，不要另装 whisper 之类的东西

```bash
python <yt-dlp skill 目录>/scripts/get-transcript.py --timestamps "<视频 URL /本地路径>"
```

- `--timestamps`: 时间码对齐，一般是需要的（不带 flag 将不提供）

4. **阅读与回答**：

- 先通读转写文本；再按问题换算帧号（时间戳 × fps + 1），只 Read 相关区间的帧。
- 如果没有文本，则主要读图片。
- 长视频粗扫：每隔 10-20 帧读一张建立时间线，再对可疑区段细读。
- 结论必须引用时间码；画面（帧）与语音（转写）交叉印证。

## Gotchas

- **社交平台下载的视频 stream 0 可能是 MJPEG 封面图**（ffprobe 里 `attached_pic=1`）。抽帧时显式 `-map 0:v:<序号>`，选 codec_name 为 h264/hevc/av1 的那条真视频流。
- `fps` 滤镜从 `1.jpg` 开始连续编号；中途中断会有空洞，按实际存在的文件名读。
- asr 对非语音段输出为空属正常。
