// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  userRegister,
  uploadQiniuImg,
  userMigration,
  setUserInfo,
  userLogin,
  verify
} from "../../../utils/req"
import {
  isValidEmail
} from "../../../utils/util"

var app = getApp();

Page({
  data: {
    // 账号是否需要迁移
    migration: true,
    verified: false,
    // 检查是否完善信息
    validEmail: true,
    hasVerifiCode: true,
    hasEmail: true,
    hasPhone: true,
    hasCampus: true,
    hasNickname: true,
    hasAvatarUrl: true,
    // 用户信息
    userInfo: app.globalData.userInfo,
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
    campusList: ["江安", "望江", "华西"],
    verifiCode: "",
    showPopup: 0, // 不弹出选择框
  },
  // 显示页面时更新数据
  onLoad(options) {
    console.log(options);
    // Toast("请使用手机号注册");
    Dialog.confirm({
      title: "隐私协议",
      messageAlign: "left",
      confirmButtonText: "我同意",
      cancelButtonText: "不同意",
      message: `
      1. 本小程序会收集您的手机号、邮箱地址和昵称。
        - 手机号用于给您发送维修进度的短信通知；
        - 邮箱地址用于接收维修进度的邮件通知；
        - 您的昵称和头像将会显示在工单中，提供给技术员。
      2. 本小程序不会在未经用户同意的情况下，存储或公开用户的任何隐私信息。
      3. 本小程序不会向用户发送任何广告、推销或与维修工单无关的信息。
      4. 本小程序不会向任何无关人员（包括其他用户和技术员）和第三方机构提供您的任何信息。
      5. 您的个人信息会在您主动注销账号或者撤回同意本隐私协议时被永久删除。
      6. 您不同意本隐私条例仅仅限制您使用本小程序的报修功能，但不会影响您使用其他功能，例如报名活动和AI助手等。您也可以选择线下维修、参与校区大型维修等其他方式。`
    }).then(() => {

    }).catch(() => {
      wx.navigateBack();
    });
  },
  // 页面卸载时触发。如wx.redirectTo或wx.navigateBack到其他页面时。
  onUnload() {
    // 关闭页面时更新数据
    // app.globalData.userInfo = this.data.userInfo;
  },
  // 在输入框不为focused时更新数据
  onVerifiCodeChange(e) {
    this.setData({ verifiCode: e.detail });
    this.setData({ hasVerifiCode: e.detail !== "" });
  },
  onPhoneChange(e) {
    this.setData({ ["userInfo.phone"]: e.detail });
    this.setData({ hasPhone: e.detail !== "" });
  },
  onEmailChange(e) {
    this.setData({ ["userInfo.email"]: e.detail });
    this.setData({ hasEmail: e.detail !== "" });
    this.setData({ validEmail: true });
  },
  onNicknameChange(e) {
    this.setData({ ["userInfo.nickname"]: e.detail });
    this.setData({ hasNickname: e.detail !== "" });
  },
  onNicknameBlur(e) {
    this.setData({ ["userInfo.nickname"]: e.detail.value });
    this.setData({ hasNickname: e.detail.value !== "" });
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
      Toast("图片上传失败");
      this.setData({
        ["userInfo.avatarUrl"]: "/image/icons/image_upload_failed.svg",
      });
    });
  },
  onVerify() {
    let unfilled = false;
    let thisUserInfo = this.data.userInfo;
    if (this.data.verifiCode === "") {
      this.setData({ hasVerifiCode: false });
      Toast("请填写验证码");
      unfilled = true;
    }
    if (thisUserInfo.phone === "") {
      this.setData({ hasPhone: false });
      Toast("请填写手机号");
      unfilled = true;
    }
    // 有未填写的信息
    if (unfilled) { return; }
    // 验证码校验
    wx.showLoading({ title: '核验中', mask: true });
    if (this.data.migration) {
      userMigration(thisUserInfo.phone, this.data.verifiCode).then((code0) => {
        wx.hideLoading();
        if (code0 === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (code0 === 200) {
          Toast("成功迁移帐号");
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        } else if (code0 === 300) {
          Toast("验证码核验失败");
        } else {
          Toast("未知错误");
        }
      });
    } else {
      verify(thisUserInfo.phone, this.data.verifiCode).then((code1) => {
        wx.hideLoading();
        if (code1 === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (code1 === 200) {
          Toast("验证码核验成功");
          this.setData({ verified: true });
          this.reloadData();
        } else if (code1 === 300) {
          Toast("验证码核验失败");
        } else if (code1 === 404) {
          Toast("验证码核验失败");
        } else {
          Toast("未知错误");
        }
      });
    }
  },
  onRegister() {
    let unfilled = false;
    let thisUserInfo = this.data.userInfo;
    if (thisUserInfo.avatarUrl === "") {
      this.setData({ hasAvatarUrl: false });
      Toast("请上传头像");
      unfilled = true;
    }
    if (thisUserInfo.campus === "") {
      this.setData({ hasCampus: false });
      Toast("请填写校区");
      unfilled = true;
    }
    if (thisUserInfo.nickname === "") {
      this.setData({ hasNickname: false });
      Toast("请填写昵称");
      unfilled = true;
    }
    if (thisUserInfo.email === "") {
      this.setData({ hasEmail: false });
      Toast("请填写邮箱");
      unfilled = true;
    } else if (!isValidEmail(thisUserInfo.email)) {
      this.setData({ validEmail: false });
      unfilled = true;
    }
    // 有未填写的信息
    if (unfilled) { return; }
    wx.showLoading({ title: '注册中', mask: true });
    userLogin().then((code2) => {
      wx.hideLoading();
      if (code2 === 200) {
        console.log("注册成功");
        setUserInfo(thisUserInfo).then((code3) => {
          if (code3 === 200) {
            Toast("登录成功");
            // 保存个人信息
            app.globalData.userInfo = thisUserInfo;
            setTimeout(() => {
              wx.navigateBack();
            }, 500);
          }
        })
      }
    });
  },
  sendCode(e) {
    let _phone = this.data.userInfo.phone.trim();
    if (_phone === "") {
      Toast('请先完善手机号');
      this.setData({ hasPhone: false });
      return;
    }
    // 调用发送验证码接口
    userRegister(_phone).then((returnCode) => {
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) { // 成功发送
        Toast("验证码已发送");
        this.setData({ migration: false });
        this.startCountingDown();
      } else if (returnCode === 300) {
        Toast("该手机号已注册");
      } else if (returnCode === 400) {
        Dialog.alert({
          title: "账号迁移",
          message: "云端线上大数据智能检测到您的帐号有尚未迁移的老数据，即将自动为您迁移。"
        }).then(() => {
          Toast("验证码已发送");
          this.setData({ migration: true });
          this.startCountingDown();
        });
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
  // 弹出校区选择器
  showPopup(event) {
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
  }
});
