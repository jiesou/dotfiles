---
name: workspace-clean
description: "USE when archiving the workspace or reclaiming disk space."
disable-model-invocation: true
---

# workspace-cleanup

先出计划，等用户拍板再动手。删任何东西前先证明它可重建，证明不了就归为保留。`rm` 被沙箱禁用，用 `gio trash`。

## 盘点

```bash
bash <skill目录>/scripts/audit.sh          # 默认审计 ~/.agents/workspace
```

## 判定可重建

- git 仓库：`dirty=0` 且 `unpushed=0` 且 origin 是 http(s)，才可 `git clone` 重建
- `node_modules` / `.venv`：同级有 lockfile 或 pyproject.toml，可重装
- 符号链接型 `node_modules`：永远保留，删了断链且不省空间
- 下载物：笔记或脚本里有下载 URL 才算

```bash
git -C <repo> status --porcelain | wc -l          # 必须 0
git -C <repo> log --branches --not --remotes     # 必须空
```

origin 是本地路径（如指向 `~/.dsh/...`）时，那边干净不代表这份干净 —— 未提交改动可能只存在于 workspace 这份。

## 镜像比对

`du` 是真实占盘，`stat -c%s` 是标称，不等即稀疏。但 btrfs 开了 `compress=zstd:1`，连续零区会压成洞，看着稀疏往往只是零区多，不代表是别的文件的稀疏版。

判定重复要比内容。0xFF/0x00 填充区会让任何文件都看起来一样，采样时跳过：

```bash
for off in 0 33554432 268435456 1073741824; do
  dd if=A.img bs=1M skip=$((off/1048576)) count=8 2>/dev/null | md5sum
  dd if=B.img bs=1M skip=$((off/1048576)) count=8 2>/dev/null | md5sum
done
```

`dumpe2fs -h <img>` 看 UUID、volume name、Last mount time。UUID 相同不代表内容相同，Last mount time 才区分得出不同时间点。

## 删除

保留目录结构，每个目录内放一个 `已删除.md`，一行写明原大小和重建命令。

```bash
d=<dir>; sz=$(du -sh "$d" | cut -f1)
find "$d" -mindepth 1 -maxdepth 1 ! -name '.git' -exec gio trash {} +
gio trash "$d/.git"
printf '已删除（%s，原 %s）。<一句话说明 + 重建命令>\n' "$(date +%F)" "$sz" > "$d/已删除.md"
```

单个大文件保留文件名、清空内容，脚本路径引用才不会断：`: > deps/dotnet48.exe`

别额外生成 manifest 汇总文件。

## 归档整个工作区

```bash
cd ~/.agents/workspace && bash <skill目录>/scripts/archive.sh
```

搬之前问用户两件事：运行中的 tmux 怎么办（照搬 / 先停 / socket 不搬）；根目录 `.git` 留不留（含 dsh-turn-rewind 数据，一般留原地）。

搬完核对条目数与搬前一致。

## 坑

- `gio trash` 移到 `~/.local/share/Trash`，同一 btrfs 卷，`df` 不变。清空不可逆，且里面可能混着用户之前手动删的东西，必须逐项确认再清。
- `mv` 跨目录需要对该目录自身有写权限（要更新 `..` 项），`d--------x` 的残留目录会失败，先 `chmod u+rwx`。
- 同卷内 `mv` 是瞬时改名不拷贝，`stat -c %d` 确认同设备即可放心用。
- `mv` 到 workspace 外（如 `~/Documents/...`）会被沙箱拦，需申请提权。
- 归档命名用原项目名加 `YYYYMMDD` 后缀，别覆盖已有文件。
