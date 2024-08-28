// Markdown转WXML页面
const article = `
<div class="markdown-body">
  <p class="p"><img class="img" src="https://www.feiyang.ac.cn/img/logo-blue.png" alt=""></p>
  <h1 class="h1" id="-">关于云上飞扬</h1>
  <blockquote class="blockquote">
    <p class="p">
    前身：小川电脑管家，是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现<strong class="strong">个人设备报修</strong>、<strong class="strong">设备问题搜索</strong>等功能，我们旨在为大家提供一个完备的<strong class="strong">个人设备一体化服务系统</strong>，让学习和生活变得便捷高效！
    </p>
  </blockquote>
  <h2 class="h2" id="-">云上飞扬 1.0</h2>
  <p class="p">
  在飞扬社团的转型启航之际，本系统改名重构升级，完全重写，在保留之前的小川电脑管家全部功能的同时，前端后端都进行了全面升级，并进行了业务范围的扩展，旨在为同学们提供更好的使用体验。
  </p>
  <h2 class="h2" id="-">制作团队</h2>
  <table class="table">
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://lab.feiyang.ac.cn/images/huzongyao.jpg" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">胡宗尧</td>
      <td class="td">小程序开发</td>
    </tr>
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://cdn.wjlo.cc/br/picture/wjlavatar.png" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">王嘉麟</td>
      <td class="td">后端开发</td>
    </tr>
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://www.ljm.im/avatar/512.png" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">林峻茗</td>
      <td class="td">管理后台开发</td>
    </tr>
  </table>
  <p class="p">Powered By <a class="a" href="https://lab.fyscu.com/">四川大学飞扬俱乐部研发部</a></p>
  <p class="p">飞扬俱乐部官网：https://fyscu.com</p>
  <p class="p">飞扬俱乐部研发部官网：https://lab.fyscu.com</p>
</div>
`;

Page({
  data: {
    article,
  },
});