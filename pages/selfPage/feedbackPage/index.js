// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { userLogin, putFeedback } from "../../../utils/req"
import { checkUserInfo } from "../../../utils/util"

const app = getApp();

Page({
  data: {
    loggedin: 1,
    contact: "",
    rawText: "",
    userInfo: app.globalData.userInfo,
    autosizeData: {
      minHeight: 150
    }, // textfield最低高度100
  },
  onShow() {
    this.reloadData();
  },
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.onLogin();
    }
  },
  onFeedBack() {
    console.log(this.data.contact, this.data.rawText);
    if (this.data.rawText === "") {
      Toast("请先填写反馈内容!");
    } else if (this.data.rawText.trim() === "forum") {
      wx.redirectTo({
        url: "/pages/forumPage/index",
      });
    } else if (this.data.rawText.trim() === "chat") {
      wx.redirectTo({
        url: "/pages/chatPage/index",
      });
    } else {
      Dialog.confirm({
        title: "提交反馈",
        message: "确认提交吗？",
      }).then(() => {
        putFeedback(this.data.contact, this.data.rawText).then((returnCode) => {
          if (returnCode === 401) {
            Toast("鉴权失败，请刷新重试");
          } else if (returnCode === 200) {
            Toast("反馈成功！谢谢你的反馈，我们将尽快处理");
            this.setData({
              rawText: "",
            });
          } else {
            Toast("反馈失败！" + returnCode);
          }
        });
      }).catch((error) => {
        Toast("反馈失败！" + error);
      });
    }
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
        if (!checkUserInfo(this.data.userInfo)) {
          // 如果没有完善 userInfo
          // 跳转到用户信息设置页面
          wx.navigateTo({
            url: '/pages/selfPage/settingsPage/index?toast=登录成功！请完善个人信息',
          });
        }
      } else {
        console.log("未知错误", returnCode);
      }
    }).catch((error) => {
      Toast("登录失败！" + error);
    });
  },
  reloadData() {
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus?version=1.1.0', '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});
