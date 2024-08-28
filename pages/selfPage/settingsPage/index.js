// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  userLogin,
  uploadQiniuImg,
  setUserInfo
} from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

var app = getApp();
let userInfoOriginal = {};

Page({
  data: {
    userInfo: app.globalData.userInfo,
    campusList: ["江安", "望江", "华西"],
    showPopup: 0, // 不弹出选择框
  },
  // 页面加载时触发
  onLoad(options) {
    // 获取页面参数 // console.log(options);
    if (options.toast) {
      Toast(options.toast);
    }
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
    // 对 userInfo 使用深拷贝
    userInfoOriginal = JSON.parse(JSON.stringify(this.data.userInfo));
  },
  // Do something when page ready.
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.onLogin();
    }
  },
  // 页面卸载时触发
  // 如 wx.redirectTo 或 wx.navigateBack 到其他页面时
  onUnload() {
    // 关闭页面时更新数据
    app.globalData.userInfo = this.data.userInfo;
    // console.log(app.globalData.userInfo);
    if (app.globalData.isloggedin) { // 如果已经登录
      if (!checkUserInfo(this.data.userInfo)) {
        console.log("信息不完善");
        wx.navigateTo({
          url: '/pages/selfPage/settingsPage/index?toast=必须完善所有信息',
        })
      } else {
        this.saveChanges();
      }
    }
  },
  // 在输入框不为focused时更新数据
  onNicknameChange(e) {
    this.setData({
      ["userInfo.nickname"]: e.detail
    });
  },
  onPhoneChange(e) {
    this.setData({
      ["userInfo.phone"]: e.detail
    });
  },
  onEmailChange(e) {
    this.setData({
      ["userInfo.email"]: e.detail
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
      Toast("图片上传失败");
      this.setData({
        ["userInfo.avatarUrl"]: "/image/icons/image_upload_failed.svg",
      });
    });
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
  onLogin() {
    userLogin().then((returnCode) => {
      console.log("returnCode:", returnCode);
      if (returnCode === 300) {
        Toast("您尚未注册");
        // 跳转到注册页
        wx.navigateTo({
          url: '/pages/selfPage/registerPage/index',
        });
      } else if (returnCode === 200) {
        // 成功登录
        this.reloadData();
        // 更新 userInfoOriginal
        userInfoOriginal = JSON.parse(JSON.stringify(this.data.userInfo));
        if (!checkUserInfo(this.data.userInfo)) {
          Toast("登录成功！请完善个人信息");
        } else {
          Toast("登录成功！");
        }
      } else {
        console.log("未知错误", returnCode);
      }
    }).catch((error) => {
      Toast("登录失败！" + error);
    });
  },
  saveChanges() {
    if (JSON.stringify(this.data.userInfo) ===
      JSON.stringify(userInfoOriginal)) {
      // 如果信息不变
      Toast("保存成功");
    } else { // 信息填写完全，且发生了变动，可以提交给后端
      // let diff = {};
      // for (const key in userInfoOriginal) {
      //   if (this.data.userInfo[key] !== userInfoOriginal[key]) {
      //     diff[key] = this.data.userInfo[key];
      //   }
      // }
      // console.log("diff:", diff);
      setUserInfo(this.data.userInfo).then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("设置成功");
          // 更新 userInfoOriginal
          userInfoOriginal = JSON.parse(JSON.stringify(this.data.userInfo));
        } else if (returnCode === 300) {
          Toast("修改失败");
        }
      })
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
  onLogout() {
    Dialog.confirm({
      title: "退出登录",
      message: "确定要退出登录吗？",
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
      this.setData({
        userInfo: emptyUserInfo,
      });
      app.globalData.ticketList = [];
      app.globalData.isloggedin = false;
      app.globalData.code = null;
      app.globalData.openid = null;
      app.globalData.accessToken = null;
      // console.log(app.globalData);
      wx.navigateBack();
    }).catch(() => {
      // on cancel
      console.log("用户取消退出登录");
    });
  },
});
