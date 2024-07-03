// Markdown转WXML页面
const article = `
<div class="markdown-body">
  <p class="p"><img class="img" src="https://www.fyscu.com/img/logo-blue.png" alt=""></p>
  <hr class="hr">
  <h1 class="h1" id="-">关于小川电脑管家</h1>
  <blockquote class="blockquote">
    <p class="p">
      小川电脑管家是一款面向全体四川大学学生的个人设备管理维护的微信小程序，同学可以在该小程序上实现<strong class="strong">个人设备保修</strong>、<strong class="strong">设备问题搜索</strong>等功能，我们旨在为大家提供一个完备的<strong class="strong">个人设备一体化服务系统</strong>，让学习和生活变得便捷高效！
    </p>
  </blockquote>
  <h2 class="h2" id="-">制作团队</h2>
  <table class="table">
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://lab.fyscu.com/images/huzongyao.jpg" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">胡宗尧</td>
      <td class="td">小程序开发</td>
    </tr>
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://lab.fyscu.com/images/fwj.jpg" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">付文君</td>
      <td class="td">后端开发</td>
    </tr>
    <tr class="tr">
      <td class="td" style="line-height:100%;text-align:center;">
        <img class="img" src="https://tmp.fyscu.com/staffs/2022_gxq_horizontal_thumb.jpg" alt="Avatar"
          style="width: 50px;height: 50px;border-radius: 50%;">
      </td>
      <td class="td" style="font-weight:bold;">郭晓庆</td>
      <td class="td">后端开发</td>
    </tr>
  </table>

  <h2 class="h2" id="version-4-0">Version 4.0</h2>
  <p class="p">小川电脑管家<code class="code">V4.0</code>是一次重大重构，在保留<code class="code">V3.0</code><strong class="strong">全部功能</strong>的同时，前端后端都进行了全面升级。旨在为同学们提供更好的使用体验。</p>
  <blockquote class="blockquote">
    <p class="p">Powered By <a class="a" href="https://lab.fyscu.com/">四川大学飞扬俱乐部研发部</a></p>
  </blockquote>
</div>
`;

Page({
  data: {
    article,
  },
});