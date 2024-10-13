// index.js
import Toast from "@vant/weapp/toast/toast";
import { newEmail } from "../../../utils/req"
import { isValidEmail } from "../../../utils/util"

Page({
  data: {
    validEmail: true,
    hasEmail: true,
    newEmail: "",
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
  },
  // 显示页面时更新数据
  onLoad(options) {
    if (options.toast) {
      Toast(options.toast);
    }
  },
  // 在输入框不为focused时更新数据
  onEmailChange(e) {
    this.setData({ newEmail: e.detail });
    this.setData({ hasEmail: e.detail !== "" });
    this.setData({ validEmail: isValidEmail(e.detail) })
  },
  sendCode() {
    let _email = this.data.newEmail.trim();
    if (_email === "") {
      Toast('请先完善邮箱');
      this.setData({ hasEmail: false });
      return;
    }
    if (!isValidEmail(_email)) {
      return;
    }
    // 调用发送验证码接口
    wx.showLoading({ title: '发送中', mask: true });
    newEmail(_email).then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) { // 成功发送
        Toast("邮箱验证码已发送，请于验证后刷新页面");
        setTimeout(() => {
          wx.navigateBack();  // 返回上一页
        }, 500);
      } else if (returnCode === 300) {
        Toast("邮箱未改变");
      } else {
        Toast("未知错误");
      }
    }).catch((error) => {
      Toast("请求失败:" + error);
    });
  },
});
