// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { unRegister } from "../../../utils/req";

const app = getApp();
const article = `
<div class="markdown-body">
  <h1 class="h1" id="-">注销账号</h1>
  <p class="p">注销后您当前账号的所有数据，包括维修订单、报修记录、个人信息等<b>将被删除，且不可恢复</b>。请谨慎操作。</p>
</div>
`

Page({
  data: {
    article
  },
  onShow() {
    this.reloadData();
  },
  onSignOut() {
    Dialog.confirm({
      title: "注销",
      message: "确认注销吗？此操作不可逆",
    }).then(() => {
      unRegister().then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          // 清空所有数据
          app.globalData.userInfo.qq = ""; // 用户QQ号
          app.globalData.userInfo.uid = ""; // 用户id
          app.globalData.userInfo.role = ""; // 用role替代is_tech
          app.globalData.userInfo.email = ""; // 用户邮箱
          app.globalData.userInfo.phone = ""; // 用户手机号
          app.globalData.userInfo.campus = ""; // 所在校区
          app.globalData.userInfo.nickname = ""; // 用户昵称
          app.globalData.userInfo.avatarUrl = "https://img1.doubanio.com/view/group_topic/l/public/p560183288.webp"; // 用户头像地址
          app.globalData.ticketList = [];
          app.globalData.isloggedin = false;
          app.globalData.code = null;
          app.globalData.openid = null;
          app.globalData.accessToken = null;
          Toast("注销成功！");
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/selfPage/index' });
          }, 500);
        } else {
          Toast("注销失败！" + returnCode);
        }
      });
    }).catch(() => {
      console.log("用户取消注销");
    });
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});
