// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";

const app = getApp();

Page({
  data: {
  },
  onShow() {
    this.reloadData();
  },
  onSignOut() {
    Dialog.confirm({
      title: "注销",
      message: "确认注销吗？此操作不可逆，我们将会删除您的所有数据",
    }).then(() => {
      // 清空所有数据
      const emptyUserInfo = {
        qq: "", // 用户QQ号
        uid: "", // 用户id
        role: "", // 用role替代is_tech
        email: "", // 用户邮箱
        phone: "", // 用户手机号
        campus: "", // 所在校区
        nickname: "", // 用户昵称
        avatarUrl: "https://img1.doubanio.com/view/group_topic/l/public/p560183288.webp", // 用户头像地址
      };
      app.globalData.userInfo = emptyUserInfo;
      app.globalData.ticketList = [];
      app.globalData.isloggedin = false;
      app.globalData.code = null;
      app.globalData.openid = null;
      app.globalData.accessToken = null;
      Toast("注销成功！");
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/selfPage/index' });
      }, 500);
    }).catch((error) => {
      Toast("反馈失败！" + error);
    });
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});
