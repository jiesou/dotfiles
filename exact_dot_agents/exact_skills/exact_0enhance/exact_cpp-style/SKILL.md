---
name: cpp-style
description: Use when writing C++ code, especially for embedded projects.
---

# C++ 风格要求

- 偏爱 modern c++ 特性，std::string 优于 Arduino String
- 常量偏爱 constexpr
- namespace 优于全局单例 class
- 可以暴露 foo::init foo::update 类方法
- 直接暴露参数变量优于 crud 方法调用
- 方法内写 static 优于外部写 BSS
- 显式优于隐式：main(void) 而不是 main()
- 少缩进，少代码量，少抽象层。抽象层风格统一
- ESP-IDF 方法优于 Arduino 方法
- 根据需求，时刻反复读文档
