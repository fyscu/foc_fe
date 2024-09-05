// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { unRegister } from "../../../utils/req";

const app = getApp();
const article = `
<div class="markdown-body">
  <h1 class="h1" id="-">删除账号</h1>
  <p class="p">删除后您当前账号的所有数据，包括维修订单、报修记录、个人信息等<b>将被永久删除，且不可恢复</b>。请谨慎操作。</p>
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
      title: "删除账号",
      message: "确认删除您的账号吗？此操作不可逆",
    }).then(() => {
      unRegister().then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("删除成功！");
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/selfPage/index' });
          }, 500);
        } else {
          Toast("删除失败！" + returnCode);
        }
      });
    }).catch(() => {
      console.log("用户取消删除");
    });
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});
