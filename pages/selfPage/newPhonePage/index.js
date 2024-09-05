// index.js
import Toast from "@vant/weapp/toast/toast";
import {
  newPhone,
  phoneChangeVerify
} from "../../../utils/req"

Page({
  data: {
    hasVerifiCode: true,
    hasPhone: true,
    newPhone: "",
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
    verifiCode: "",
  },
  // 显示页面时更新数据
  onLoad(options) {
    console.log(options);
  },
  // 页面卸载时触发
  onUnload() {
  },
  // 在输入框不为focused时更新数据
  onVerifiCodeChange(e) {
    this.setData({ verifiCode: e.detail });
    this.setData({ hasVerifiCode: e.detail !== "" });
  },
  onPhoneChange(e) {
    this.setData({ newPhone: e.detail });
    this.setData({ hasPhone: e.detail !== "" });
  },
  onVerify() {
    let unfilled = false;
    if (this.data.verifiCode === "") {
      this.setData({ hasVerifiCode: false });
      Toast("请填写验证码");
      unfilled = true;
    }
    if (this.data.newPhone === "") {
      this.setData({ hasPhone: false });
      Toast("请填写手机号");
      unfilled = true;
    }
    // 有未填写的信息
    if (unfilled) { return; }
    // 验证码校验
    wx.showLoading({ title: '核验中', mask: true });
    phoneChangeVerify(this.data.newPhone, this.data.verifiCode).then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) {
        Toast("手机号更新成功");
        setTimeout(() => {
          wx.navigateBack();  // 返回上一页
        }, 500);
      } else if (returnCode === 300) {
        Toast("验证码核验失败");
      } else {
        Toast("未知错误");
      }
    });
  },
  sendCode() {
    let _phone = this.data.newPhone.trim();
    if (_phone === "") {
      Toast('请先完善手机号');
      this.setData({ hasPhone: false });
      return;
    }
    // 调用发送验证码接口
    newPhone(_phone).then((returnCode) => {
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) { // 成功发送
        Toast("验证码已发送");
        this.startCountingDown();
      } else if (returnCode === 300) {
        Toast("该手机号已注册");
      } else if (returnCode === 403) {
        Toast("手机号已存在")
      } else {
        Toast("未知错误");
      }
    }).catch((error) => {
      Toast("请求失败:" + error);
    });
  },
  startCountingDown() {
    // 开始倒计时
    if (!this.data.isCountingDown) {
      this.setData({
        isCountingDown: true
      });
      let interval = setInterval(() => {
        let countDownNum = this.data.countDownNum - 1;
        this.setData({
          countDownNum: countDownNum
        });
        if (countDownNum === 0) {
          clearInterval(interval);
          this.setData({
            isCountingDown: false,
            countDownNum: 60 // 重置倒计时时间
          });
        }
      }, 1000);
    }
  },
});
