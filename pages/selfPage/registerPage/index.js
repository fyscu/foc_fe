// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  userLogin,
  userRegister,
  uploadQiniuImg,
  userMigration,
  setUserInfo,
  verify
} from "../../../utils/req"
import { appVersion } from "../../../utils/util";

var app = getApp();
let message = `
1. 本小程序会收集您的手机号、邮箱地址和昵称。
    - 手机号用于给您发送维修进度的短信通知；
    - 邮箱地址用于接收维修进度的邮件通知；
    - 您的昵称和头像将会显示在工单中，提供给技术员。
2. 本小程序不会在未经用户同意的情况下，存储或公开用户的任何隐私信息。
3. 本小程序不会向用户发送任何广告、推销或与维修工单无关的信息。
4. 本小程序不会向任何无关人员（包括其他用户和技术员）和第三方机构提供您的任何信息。
5. 您的个人信息会在您主动注销账号或者撤回同意本隐私协议时被永久删除。
6. 您不同意本隐私条例仅仅限制您使用本小程序的报修功能，但不会影响您使用其他功能，例如报名活动和AI助手等。您也可以选择线下维修、参与校区大型维修等其他方式。`

Page({
  data: {
    loggedin: 1,
    showDialog: false,
    article: {},
    // 账号是否需要迁移
    migration: true,
    verified: false,
    // 检查是否完善信息
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
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus?version='+appVersion, '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
    this.onShowDialog();
  },
  // 在输入框不为focused时更新数据
  onVerifiCodeChange(e) {
    this.setData({ verifiCode: e.detail });
    this.setData({ hasVerifiCode: e.detail !== "" });
  },
  onPhoneChange(e) {
    this.setData({ ["userInfo.phone"]: e.detail });
    this.setData({ hasPhone: e.detail !== "" });
    if (e.detail.length === 11) {
      this.sendCode(e.detail);
    }
  },
  onNicknameChange(e) {
    this.setData({ ["userInfo.nickname"]: e.detail });
    this.setData({ hasNickname: e.detail !== "" });
  },
  onNicknameBlur(e) {
    this.setData({ ["userInfo.nickname"]: e.detail.value });
    this.setData({ hasNickname: e.detail.value !== "" });
  },
  // 隐私协议弹窗
  onShowDialog() {
    let result = app.towxml(
      message,
      'markdown',
      { theme: app.systemInfo.theme }
    );
    // 显示确认弹窗
    this.setData({
      showDialog: true,
      article: result,
    });
  },
  onConfirmDialog() {
    this.setData({ showDialog: false });
  },
  onCloseDialog() {
    this.setData({ showDialog: false });
    wx.navigateBack();
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
    if (this.data.loggedin === 1) {
      Toast("很抱歉，本小程序仅对四川大学在校生开放");
      return;
    }
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
    console.error(this.data.migration);
    if (this.data.migration) {
      userMigration(thisUserInfo.phone, this.data.verifiCode).then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("成功迁移帐号");
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        } else if (returnCode === 300) {
          Toast("验证码核验失败");
        } else {
          Toast("验证码核验失败");
        }
      });
    } else {
      verify(thisUserInfo.phone, this.data.verifiCode).then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("验证码核验成功");
          this.setData({ verified: true });
          this.reloadData();
        } else if (returnCode === 300) {
          Toast("验证码核验失败");
        } else if (returnCode === 404) {
          Toast("验证码核验失败");
        } else {
          Toast("未知错误");
        }
      });
    }
  },
  onRegister() {
    let unfilled = false;
    if (this.data.userInfo.avatarUrl === "") {
      this.setData({ hasAvatarUrl: false });
      Toast("请上传头像");
      unfilled = true;
    }
    if (this.data.userInfo.campus === "") {
      this.setData({ hasCampus: false });
      Toast("请填写校区");
      unfilled = true;
    }
    if (this.data.userInfo.nickname === "") {
      this.setData({ hasNickname: false });
      Toast("请填写昵称");
      unfilled = true;
    }
    // 有未填写的信息
    if (unfilled) { return; }
    wx.showLoading({ title: '注册中', mask: true });
    userLogin().then((loginCode) => {
      wx.hideLoading();
      if (loginCode === 200) {
        setUserInfo(this.data.userInfo).then((returnCode) => {
          if (returnCode === 401) {
            Toast("鉴权失败，请刷新重试");
          } else if (returnCode === 200) {
            Toast("注册成功");
              setTimeout(() => {
                wx.navigateBack();
              }, 500);
          } else {
            Toast("注册失败");
          }
        });
      } else {
        Toast("注册失败，未知错误");
      }
    });
  },
  sendCode(e) {
    if (this.data.loggedin === 1) {
      Toast("很抱歉，本小程序仅对四川大学在校生开放");
      return;
    }
    let _phone = this.data.userInfo.phone.trim();
    if (_phone === "") {
      Toast('请先完善手机号');
      this.setData({ hasPhone: false });
      return;
    }
    
    // 调用发送验证码接口
    userRegister(_phone).then((returnCode) => {
      this.setData({ migration: false });
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) { // 成功发送
        Toast("验证码已发送");
        
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
  // 游客模式登录
  onTestLogin() {
    app.globalData.isloggedin = true;
    app.globalData.userInfo = {
      qq: "666666",
      uid: "000000",
      role: "user",
      phone: "12345678901",
      email: "test-mail@qq.com",
      campus: "江安",
      nickname: "游客",
      avatarUrl: "https://marketplace.canva.cn/EAGE6DsWb24/1/0/1600w/canva-cFjPThAyvu8.jpg",
    };
    Toast("测试身份登录成功");
    setTimeout(() => {
      wx.navigateBack();
    }, 500);
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
  copyPhone() {
    const phone = this.data.userInfo.codePhone;
    if (!phone) {
      wx.showToast({ title: '号码为空', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: String(phone),
      success: () => {
        console.log('手机号复制成功'); 
      }
    });
  },
  copyCode() {
    const code = this.data.userInfo.verCode;
    if (!code) {
      wx.showToast({ title: '内容为空', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: String(code),
      success: () => {
        console.log('内容复制成功');
      }
    });
  }
});
