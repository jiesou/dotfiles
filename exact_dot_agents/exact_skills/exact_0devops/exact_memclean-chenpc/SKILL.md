---
name: memclean-chenpc
description: Clean user's PC memory usage.
---

# memclean-chenpc

## 已知坑

### 1. opencode 编译缓存泄漏

opencode 在 `/tmp` (tmpfs) 创建 V8/Rust 预编译缓存 `.so` 文件，用完不删，48 小时能积 4+ GiB。

查：
```bash
ls -1 /tmp/.[0-9a-f]*-00000000.so | wc -l
du -sh /tmp/.[0-9a-f]*-00000000.so
```

杀：
```bash
rm -f /tmp/.[0-9a-f]*-00000000.so
```

### 2. zram swap 虚高

`free` 的 Swap used 含 zram 压缩数据，不是真磁盘 IO。看 `mm_stat` 分清压缩比：

```bash
cat /sys/block/zram0/mm_stat | awk '{printf "orig: %.1f GiB → compr: %.1f GiB → phys: %.1f GiB\n", $1/1073741824, $2/1073741824, $3/1073741824}'
```

### 3. OOM 时 swapoff 危险

memory 紧张时 `swapoff -a` 会把 zram 全部解压回 RAM → 立刻 OOM → 杀死 opencode / WeChat 等。

### 4. 进程 VmSwap 对不上 total swap

VmSwap 总和经常小于 `SwapTotal - SwapFree`。差额来自 SwapCached + 已退出进程残留 + 内核内存。

## 诊断命令

### 全景

```bash
free -h
swapon --show
cat /proc/meminfo | grep -E "^(MemTotal|MemFree|MemAvailable|AnonPages|Cached|Active\(anon\)|Inactive\(anon\)|Shmem|Slab|SwapTotal|SwapFree|SwapCached)"
```

### 进程 swap 排名

```bash
for f in /proc/[0-9]*/status; do
  swap=$(grep VmSwap $f 2>/dev/null | awk '{print $2}')
  name=$(grep ^Name: $f 2>/dev/null | awk '{print $2}')
  [ -n "$swap" ] && [ "$swap" != "0" ] && echo "$swap kB  $name ($(basename $f))"
done | sort -rn | head -20
```

### tmpfs 异常

```bash
df -h /tmp
find /proc/*/fd -type l -lname '/tmp/*' 2>/dev/null | while read link; do
  f=$(readlink "$link"); pid=$(echo "$link" | cut -d/ -f3)
  [ ! -f "$f" ] && echo "$(ls -l "/proc/$pid/fd/$(basename $link)" 2>/dev/null | awk '{print $5}')  $(grep "^Name:" /proc/$pid/status 2>/dev/null | awk '{print $2}') ($pid) -> $f (deleted)"
done | sort -rn | head -10
```

### OOM 日志

```bash
journalctl -k | grep -i "oom\|killed\|out of memory" | tail -20
```

## 这台机的基线

_根据变化需要随时更新本节_

- 物理内存 15 GiB，swap 为 zram (16G) + swapfile (32G)
- /tmp tmpfs 上限 7.8 GiB
