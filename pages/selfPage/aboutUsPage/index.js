// Markdown转WXML页面
const article = `
<img src="https://about.feiyang.ac.cn/assets/logo.png" alt="logo">

# 关于云上飞扬

> 前身：小川电脑管家，是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现**个人设备报修**、**设备问题搜索**等功能，我们旨在为大家提供一个完备的**个人设备一体化服务系统**，让学习和生活变得便捷高效！

## 云上飞扬 1.0

在飞扬社团的转型启航之际，本系统改名升级，完全重写，在保留之前的小川电脑管家全部功能的同时，前端后端都进行了全面升级，并进行了业务范围的扩展，旨在为同学们提供更好的使用体验。

## 制作团队

| | | |
| :------------------------------------------------------: | :-----: | :--------: |
| <img src="https://lab.feiyang.ac.cn/images/huzongyao.jpg" alt="胡宗尧"> | 胡宗尧 | 小程序开发 |
| <img src="https://cdn.wjlo.cc/br/picture/wjlavatar.png" alt="王嘉麟"> | 王嘉麟 | 后端开发 |
| <img src="https://www.ljm.im/avatar/512.png" alt="林峻茗"> | 林峻茗 | 管理后台开发 |

Powered By 2024 四川大学飞扬俱乐部研发部
- 飞扬俱乐部： <https://fyscu.com>
- 飞扬俱乐部研发部： <https://lab.fyscu.com>
- 源码仓库：<https://github.com/fyscu/foc_fe>
`;

const app = getApp();

Page({
  data: {
    isLoading: true,
    article: {},
  },
  onLoad: function () {
    let result = app.towxml(
      article,
      'markdown',
      { theme: app.systemInfo.theme }
    );

    // 更新解析数据
    this.setData({
      article: result,
      isLoading: false
    });
  }
});
