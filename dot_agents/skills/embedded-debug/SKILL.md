---
name: embedded-debug
description: "Embedded device debug via serial. Use when: (1) monitoring serial output from ESP32/STM32/Arduino, (2) flashing firmware and reading boot output, (3) killing processes holding serial ports."
---

# Embedded Debug

Core trick: background `cat` writes to file, LLM reads file on demand. **Serial output is often empty until the device is reset.** Always reset the target after starting the daemon, `openocd` for everything else.

## Typical workflow

1. Discover port → 2. Start daemon → 3. Reset device → 4. Read log

## Discover port

```bash
ls /dev/ttyUSB* /dev/ttyACM* /dev/serial/by-id/* 2>/dev/null
```

## Start daemon

```bash
fuser -k /dev/ttyACM0 2>/dev/null; while :; do stty -F /dev/ttyACM0 115200 raw -echo 2>/dev/null && cat /dev/ttyACM0 | while read -r line; do printf '[%s] %s\n' "$(date +%H:%M:%S)" "$line"; done; sleep 1; done >> /tmp/ser.log 2>&1 &
```

## Reset device (required to see boot output)

**ARM Cortex-M via CMSIS-DAP / ST-LINK (OpenOCD SWD reset):**

```bash
openocd -s /usr/share/openocd/scripts -f interface/cmsis-dap.cfg -f target/stm32f4x.cfg -c "init" -c "reset run" -c "exit"
```

Swap `interface/cmsis-dap.cfg` for `interface/stlink-v2.cfg` etc. Swap `target/stm32f4x.cfg` to match your MCU.

## Read

```bash
tail -50 /tmp/ser.log; : > /tmp/ser.log  # read then truncate, next read is fresh
timeout 5 cat /dev/ttyACM0               # direct read, blocking 5s
```

## Send command

```bash
printf 'AT\r\n' > /dev/ttyACM0
```

## Stop

```bash
fuser -k /dev/ttyACM0 2>/dev/null
```

## Crash format decode

- **ESP32**: `Guru Meditation Error: Core 0 panic'ed` → PC/LR in dump → `xtensa-esp32-elf-addr2line -e build/firmware.elf <addr>`
- **STM32 with CmBacktrace**: register dump + `addr2line -e build/projectname.elf -a -f <pc> <lr>`
- **Cortex-M raw**: exception frame `r0,r1,r2,r3,r12,lr,pc,xpsr` on stack; read SCB CFSR at `0xE000ED28`
