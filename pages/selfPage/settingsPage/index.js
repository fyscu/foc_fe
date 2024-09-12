// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  userLogin,
  uploadQiniuImg,
  setTechInfo,
  setUserInfo
} from "../../../utils/req"
import {
  isValidEmail,
  checkUserInfo
} from "../../../utils/util"

var app = getApp();
let userInfoOriginal = {};
let wantsMap3 = ["a", "b", "c", "d", "e"];

Page({
  data: {
    loggedin: 1,
    validEmail: true,
    hasEmail: true,
    hasPhone: true,
    hasCampus: true,
    hasNickname: true,
    hasAvatarUrl: true,
    userInfo: app.globalData.userInfo,
    campusList: ["江安", "望江", "华西"],
    showPopup: 0, // 不弹出选择框
    // 技术员接单意愿
    wantsMap1: {
      "a": "暂停接单（不推荐）",
      "b": "减少接单",
      "c": "正常",
      "d": "增加接单",
      "e": "疯狂接单！",
    },
    wantsMap2: {
      "a": 0,
      "b": 1,
      "c": 2,
      "d": 3,
      "e": 4,
    },
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
  // 拖动滑块时触发
  onDrag(event) {
    this.setData({
      ["userInfo.wants"]: wantsMap3[event.detail.value],
    });
  },
  onChange(event) {
    this.setData({
      ["userInfo.wants"]: wantsMap3[event.detail],
    });
  },
  // 在输入框不为focused时更新数据
  onNicknameChange(e) {
    this.setData({ ["userInfo.nickname"]: e.detail });
    this.setData({ hasNickname: e.detail !== "" });
  },
  onNicknameBlur(e) {
    this.setData({ ["userInfo.nickname"]: e.detail.value });
    this.setData({ hasNickname: e.detail.value !== "" });
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
      console.log("图片上传失败:", error);
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
    wx.showLoading({ title: '登录中', mask: true });
    userLogin().then((returnCode) => {
      wx.hideLoading();
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
    let unfilled = false;
    let thisUserInfo = this.data.userInfo;
    // 保存技术员信息
    setTechInfo(thisUserInfo);
    // 保存用户信息
    if (JSON.stringify(thisUserInfo) === JSON.stringify(userInfoOriginal)) {
      // 如果信息不变
      Toast("保存成功");
      // 应要求，保存成功后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    } else { // 信息填写完全，且发生了变动，可以提交给后端
      if (thisUserInfo.avatarUrl === "") {
        this.setData({ hasAvatarUrl: false });
        Toast("请上传头像");
        unfilled = true;
      }
      if (thisUserInfo.phone === "") {
        this.setData({ hasPhone: false });
        Toast("请填写手机号");
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
      if (unfilled) { // 有未填写的信息
        return;
      }
      setUserInfo(thisUserInfo).then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("设置成功");
          // 更新 userInfoOriginal
          userInfoOriginal = JSON.parse(JSON.stringify(thisUserInfo));
          // 应要求，保存成功后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        } else if (returnCode === 300) {
          Toast("修改失败");
        }
      })
    }
  },
  reloadData() {
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus?version=1.0.9', '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
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
      app.globalData.ticketList = [];
      app.globalData.isloggedin = false;
      app.globalData.code = null;
      app.globalData.openid = null;
      app.globalData.accessToken = null;
      // console.log(app.globalData);
      this.reloadData();
      wx.navigateBack();
    }).catch(() => {
      // on cancel
      console.log("用户取消退出登录");
    });
  },
});
