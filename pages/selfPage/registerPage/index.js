// index.js
import Toast from "@vant/weapp/toast/toast";

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
    verifiCode: "",
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
  },
  // Do something when page ready.
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.userRegister();
    }
  },
  // 页面卸载时触发。如wx.redirectTo或wx.navigateBack到其他页面时。
  onUnload() {
    // 关闭页面时更新数据
    app.globalData.userInfo = this.data.userInfo;
    // TODO: Save Data
    wx.request({
      url: "url",
    });
  },
  // 在输入框不为focused时更新数据
  onPhoneBlur(e) {
    this.setData({
      ["userInfo.phone"]: e.detail.value
    });
  },
  onVerifiCodeBlur(e) {
    this.setData({
      verifiCode: e.detail.value
    });
  },
  // 选择头像
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail;
    // console.log("get avatar url:", e.detail);
    this.setData({
      ["userInfo.avatarUrl"]: avatarUrl
    });
  },
  onRegister(e) {
    if (this.data.userInfo.phone === "") {
      Toast("请填写手机号");
      return;
    }
    if (this.data.verifiCode === "") {
      Toast("请填写验证码");
      return;
    }
    // 验证码校验
    try {
      wx.request({
        // https://fyapidocs.wjlo.cc/user/verify
        url: 'https://fyapi2.wjlo.cc/v1/user/verify',
        data: {
          phone: this.data.userInfo.phone,
          verification_code: verifiCode,
        },
        header: {
          'content-type': 'application/json'
        },
        method: 'POST',
        success(res) {
          console.log(res);
          if (res.status === "verified") {
            // 验证成功，从接口获取数据
            this.setData({
              openid: res.openid,
              ["userInfo.uid"]: res.uid,
              ["userInfo.email"]: res.email,
              ["userInfo.phone"]: res.phone,
              ["userInfo.avatarUrl"]: res.avatar,
              ["userInfo.nickname"]: res.nickname,
            });
            if (res.email === "" || res.avatar === "" || res.nickname === "") {
              // 用户个人信息不完善
              Toast("注册成功，请完善个人信息");
              wx.navigateTo({
                url: '../settingsPage/index',
              });
            } else {
              Toast("注册成功");
              wx.navigateBack();
            }
          }
        },
        fail() {
          // 验证码不正确
          console.log('验证码不正确！');
          Toast("验证码不正确");
        },
        complete() {
          console.log('complete');
        }
      })
    } catch (error) {
      console.log(error); // 输出错误信息
    }
  },
  sendCode(e) {
    if (this.data.userInfo.phone === "") {
      console.log("phone number not found.");
      Toast('请先完善手机号');
      return;
    }
    // 调用发送验证码接口
    this.userRegister();
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
  // 调用注册接口
  async userRegister() {
    try {
      // https://fyapidocs.wjlo.cc/user/register
      wx.request({
        url: 'https://fyapi2.wjlo.cc/v1/user/register',
        data: {
          phone: this.data.userInfo.phone,
          openid: "1234566789",
        },
        header: {
          'content-type': 'application/json'
        },
        method: 'POST',
        success(res) {
          console.log(res);
        },
        fail() {
          // 已经注册了
          console.log('registion failed');
          Toast("您已注册");
        },
        complete() {
          console.log('complete')
        }
      })
    } catch (error) {
      console.log(error); // 输出错误信息
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});