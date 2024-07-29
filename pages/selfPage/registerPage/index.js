// index.js
import Toast from "@vant/weapp/toast/toast";
import {
  userRegister,
  uploadQiniuImg,
  verify
} from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
    campusList: ["江安", "望江", "华西"],
    verifiCode: "",
    showPopup: 0, // 不弹出选择框
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
    Toast("您尚未注册，请使用手机号注册");
  },
  // 页面卸载时触发。如wx.redirectTo或wx.navigateBack到其他页面时。
  onUnload() {
    // 关闭页面时更新数据
    // app.globalData.userInfo = this.data.userInfo;
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
  onEmailBlur(e) {
    this.setData({
      ["userInfo.email"]: e.detail.value
    });
  },
  onNicknameBlur(e) {
    this.setData({
      ["userInfo.nickname"]: e.detail.value
    });
  },
  // 选择头像
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail;
    console.log("get avatar url:", avatarUrl);
    uploadQiniuImg(avatarUrl).then((imgUrl) => {
      this.setData({
        ["userInfo.avatarUrl"]: imgUrl,
      });
    }).catch((error) => {
      this.setData({
        ["userInfo.avatarUrl"]: "/image/icons/image_upload_failed.svg",
      });
    });
  },
  onRegister(e) {
    if (this.data.verifiCode === "") {
      Toast("请填写验证码");
      return;
    }
    if (!checkUserInfo(this.data.userInfo)) {
      Toast("请完善个人信息");
      return;
    }
    console.log(app.globalData.accessToken);
    // 验证码校验
    verify(this.data.userInfo.phone, this.data.verifiCode).then(
      (returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("注册成功");
        } else if (returnCode === 300) {
          Toast("验证码核验失败");
        } else {
          console.log(returnCode);
          Toast("未知错误");
        }
      }
    );
  },
  sendCode(e) {
    let _phone = this.data.userInfo.phone.trim();
    if (_phone === "") {
      Toast('请先完善手机号');
      return;
    }
    // 调用发送验证码接口
    userRegister(_phone).then(
      (returnCode) => {
        if (returnCode === 200) { // 成功发送
          Toast("验证码已发送");
          this.startCountingDown();
        } else if (returnCode === 300) {
          console.log("该手机号已注册");
          Toast("该手机号已注册");
        } else if (returnCode === 401) {
          console.log("鉴权失败");
          Toast("鉴权失败，请刷新重试");
        } else {
          console.log("未知错误", returnCode);
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
  // 弹出校区选择器
  showPopup(event) {
    // console.log(event);
    this.setData({
      showPopup: parseInt(event.target.dataset.index),
    });
  },
  closePopup() {
    this.setData({
      showPopup: 0,
    });
  },
  // 确认校区
  onConfirmCampus(event) {
    // 校区
    const {
      value
    } = event.detail;
    this.setData({
      ["userInfo.campus"]: value,
      showPopup: 0,
    });
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});