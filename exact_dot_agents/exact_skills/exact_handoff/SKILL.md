---
name: handoff
description: Generate a handoff document for another agent to pick up.
disable-model-invocation: true
---

**⏹️ 立刻停止**
你所做的已经完全偏离了用户预期，触发系统干预。
停下手头的一切工作，生成交接文档，包含：
1. 用户的所有准确需求，原文（真实原文作为背景）
2. 眼前，用户要你解决的核心诉求（只有一个点，不带你自己总结“背景”）
3. 涉及的一切上下文、事实
不要包含推测、建议、待办
事实：做了什么，不说什么对什么错（你的判断默认错误）
直接输出，不要 Write 到某处 .md
输出内容中不要包含用户最后有关 handoff 的指令，只包含需求，不包含最后的抱怨