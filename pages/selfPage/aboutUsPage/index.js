// Markdown转WXML页面
const app = getApp();
Page({
  data: {
    article: {},
  },
  onLoad: function () {
    let obj = app.towxml(
      `
<rich-text>
  <div style="text-align:center">
    <img src="https://www.fyscu.com/img/logo-blue.png" style="width:50%;"/>
  </div>
</rich-text>

---

# 关于小川电脑管家

> 小川电脑管家是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现**个人设备保修**、**设备问题搜索**等功能，我们旨在为大家提供一个完备的**个人设备一体化服务系统**，让学习和生活变得便捷高效！

## 制作团队

<rich-text>
<table>
    <tr>
      <td style="line-height:100%;text-align:center;">
        <img src="/image/hzy.jpg" alt="Avatar" style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td style="font-weight:bold;">胡宗尧</td>
      <td>小程序开发</td>
    </tr>
    <tr>
      <td style="line-height:100%;text-align:center;">
        <img src="/image/fwj.jpg" alt="Avatar" style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td style="font-weight:bold;">付文君</td>
      <td>后端开发</td>
    </tr>
    <tr>
      <td style="line-height:100%;text-align:center;">
        <img src="/image/gxq.jpg" alt="Avatar" style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td style="font-weight:bold;">郭晓庆</td>
      <td>后端开发</td>
    </tr>
 </table>
</rich-text>

## Version 4.0

小川电脑管家\`V4.0\`是一次重大重构，在保留\`V3.0\`**全部功能**的同时，前端后端都进行了全面升级。旨在为同学们提供更好的使用体验。

> Powered By [四川大学飞扬俱乐部研发部](https://lab.fyscu.com/)

---
`,
      "markdown"
    );
    this.setData({ article: obj });
  },
});
