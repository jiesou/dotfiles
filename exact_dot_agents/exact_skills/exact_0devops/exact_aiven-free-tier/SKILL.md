---
name: aiven-free-tier
description: "USE when an Aiven free service is about to be suspended for inactivity."
disable-model-invocation: true
---

# Aiven 免费实例保活

Aiven 发来 `Warning: Your Aiven free service <name> hasn't been actively used recently` 时，登一次 Console 即可把免费实例的闲置计时清零。邮件只要求“登录”，不要顺手升级套餐。

## 找邮件

`himalaya envelope list -a gmail`，发件人 `noreply@aiven.io`，标题带 `hasn't been actively used recently`。正文写明 Project / Service type / Name，`https://console.aiven.io/account/a4da3f2f9cd5/project/blog-waline/...` 这种链接里就带 account id、project 和 service 名。

## 登录

- Browser Use 打开 `https://console.aiven.io`，邮箱框已预填 `jiechushou@gmail.com`，**在该框按 Enter**。Playwright 点 “Log in” 按钮会因按钮动画一直等 `stable` 而超时。
- 提交走 GitHub OAuth，浏览器里有 GitHub 登录态，不用输密码/验证码，如果要登录，那就走 Bitwarden，回车后自动回到 Console。

## 坑：Console 卡在白屏

停在 `Loading...` / `The request is taking more time than expected` 且等多久都不好，是因为 tab 在后台（`document.visibilityState === 'hidden'`）被 Chromium 节流。先切到前台（`page.bringToFront()` 或点一下 tab），再 reload，秒开。归档/录制时保持这个 tab 可见。

## 确认成功

首次登录会弹模态框，原文：

> **Welcome back!**
> Your free services will not be automatically powered off. Please continue using the services actively. Alternatively, to reduce your carbon footprint, you can also power off or delete services yourself at any time.

这个框只在 `DELETE /v1/console/user/free-service-inactivity-alerts` 返回非空 `services` 时出现；清过一次后再登录返回 `{"services":[]}`，就不会再弹。

硬指标：`GET /v1/project/blog-waline/alerts` 返回 `{"alerts":[]}`，服务页 `blog-waline` 显示 Running。服务名旁的黄色三角是免费版的常驻提示（hover 文案 `Free services will be automatically powered off if they or the Aiven platform aren't actively used`），不是当前告警，别误判。

确认成功即退出。

## 定时巡检

`himalaya envelope search -a gmail -s 10 'from aiven and not flag seen'`，空表即无新告警，直接结束。处理完把那封标已读，否则下次还命中：`himalaya flag add -a gmail <ID> seen`。

