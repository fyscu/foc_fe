// Markdown转WXML页面
const article = `
<div class="markdown-body">
  <p class="p"><img class="img" src="https://www.feiyang.ac.cn/img/logo-blue.png" alt=""></p>
  <hr class="hr">
  <h1 class="h1" id="-">关于云上飞扬 v1.0</h1>
  <blockquote class="blockquote">
    <p class="p">
      云上飞扬是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现<strong class="strong">个人设备保修</strong>、<strong class="strong">设备问题搜索</strong>等功能，我们旨在为大家提供一个完备的<strong class="strong">个人设备一体化服务系统</strong>，让学习和生活变得便捷高效！
    </p>
  </blockquote>
  <h2 class="h2" id="-">制作团队</h2>
  <div style="text-align:center;">
    <table class="table">
      <tr class="tr">
        <td class="td" style="font-weight:bold;">胡宗尧</td>
        <td class="td">小程序开发</td>
      </tr>
      <tr class="tr">
        <td class="td" style="font-weight:bold;">王嘉麟</td>
        <td class="td">后端开发</td>
      </tr>
      <tr class="tr">
        <td class="td" style="font-weight:bold;">林峻铭</td>
        <td class="td">后台开发</td>
      </tr>
    </table>
  </div>
  <h2 class="h2" id="version-4-0">联系我们</h2>
  <ul>
    <li>电脑问题互助群：1083244225</li>
    <li>2024会员群：972863858</li>
    <li>哔哩哔哩：<a href="https://space.bilibili.com/28406325">飞扬代表发言</a></li>
    <li>官网：<a href="https://www.feiyang.ac.cn">四川大学飞扬俱乐部</a></li>
  </ul>
</div>
`;

Page({
  data: {
    article,
  },
});
