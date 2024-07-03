// Markdown转WXML页面

const article = `
<div class="markdown-body">
  <h1 class="h1" id="-">维修须知</h1>
  <ol class="ol">
    <li class="li">登录后请先<strong class="strong">修改自己的个人信息</strong>以方便后续送修、维修处理。</li>
    <li class="li">送修前请<strong class="strong">移除电源外其余外设配件</strong>，包括鼠标、接收器、U盘、内存卡等。</li>
    <li class="li">如要更换配件，清<strong class="strong">提前购买准备好</strong>；如需重装系统，请确保电脑电量充足。</li>
    <li class="li">送修前请<strong class="strong">备份好数据</strong>，我们不对数据丢失负责。</li>
    <li class="li">请将问题尽量描述清楚或提前与维修人员联系说明清楚情况。</li>
    <li class="li">我们也不是万能的，不保证一定能修好，还请理解。</li>
  </ol>
</div>
`;

Page({
  data: {
    article,
  },
});