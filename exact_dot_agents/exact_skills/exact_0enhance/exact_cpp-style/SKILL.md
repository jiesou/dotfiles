---
name: cpp-style
description: Use when writing C++ code, especially for embedded projects.
---

# C++ 风格要求

- 偏爱 modern c++ 特性，std::string 优于 Arduino String
- 常量偏爱 constexpr
- namespace 优于全局单例 class
- 可以暴露 foo::init foo::update 类方法
update中，时间片分工是优选，我希望看到这样的代码：
static uint32_t lastUpdate = 0;
void update()
{
    uint32_t now = millis();
    if (now - lastUpdate < 200)
        return;
    lastUpdate = now;
    ...
}
- 直接暴露参数变量优于 crud 方法调用
- 方法内写 static 优于外部写 BSS
- 显式优于隐式：main(void) 而不是 main()
- 少缩进，少代码量，少抽象层。抽象层风格统一
- 暴露越少越好，变量函数越少越好，概念越少越好
- 所谓高内聚，就是：该内联的就内联，该写死的就写死，不要暴露没有意义的配置项
- ESP-IDF 方法优于 Arduino 方法
- 根据需求，时刻反复读文档

