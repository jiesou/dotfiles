# OpenPnP安装调试

OpenPnP安装调试

4月2日修改

OpenPnP 是一款开源软件，旨在控制贴片机。它支持多种机器，具有高端商业软件中的许多功能。您可以[在此处](<https://openpnp.org/>)了解更多信息。

推荐硬件和系统

OpenPnP 旨在运行在许多不同类型的主机计算机上。但是，USB 驱动程序和内部 USB 集线器带宽可能因计算机而异。我们建议使用运行 Ubuntu 20.04 LTS 或 Ubuntu 22.04 LTS 的具有三个以上usb端口的计算机上，以便与相机、曝光控制和串行通信实现已知良好的连接。

❗

这里推荐使用Ubuntu 22.04 版本，已经接到多起使用24及更新版本的ubuntu有问题的反馈。

安装OpenPnP

![飞书文档 - 图片](OpenPnP安装调试/img0.png)

我们支持最新的稳定版OpenPnP V2.6，建议安装该版本。下载链接如下：

Linux（Ubuntu）

✔️

推荐使用 Linux

Ubuntu Linux 提供与 LumenPnP 和摄像头的可靠 USB 通信。也是本文档测试的平台。

1.

下载Linux版OpenPnP

如果你还没有安装Ubuntu（建议安装Ubuntu 22.04 LTS版本），请按照官方指南操作：[安装Ubuntu Desktop。](<https://ubuntu.com/tutorials/install-ubuntu-desktop#1-overview>)

之后下载OpenPnP安装包

OpenPnP-linux-main.deb

188.16MB

OpenPnP-unix-main.tar.gz

187.72MB

要正确在linux上运行 OpenPnP，需要提前做以下配置：
