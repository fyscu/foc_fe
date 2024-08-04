import {
  getUUid
} from "./util";

// 本页面专用于与后端的Http交互
var app = getApp();

// 用户注册 https://fyapidocs.wjlo.cc/user/register
function userRegister(phone) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/register...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/register',
      data: {
        phone: phone,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log("鉴权失败");
          resolve(401);
        } else if (res.data.success) {
          if (res.data.status === "verification_code_sent") {
            console.log("成功发送验证码");
            resolve(200);
          } else if (res.data.status === "user_exists") {
            console.log("已有用户");
            resolve(300);
          } else {
            console.log('注册失败:', res);
            resolve(500);
          }
        } else {
          console.log('注册失败，未知错误', res);
          reject(-1);
        }
      },
      complete() {
        console.log('requesting /user/register complete.');
      },
    })
  });
}

// 微信登录 https://fyapidocs.wjlo.cc/admin/login
function userLogin() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/login...");
    wx.login({
      success: (res) => {
        if (res.code) {
          app.globalData.code = res.code;
          console.log('code:', res.code);
          wx.request({
            url: app.globalData.rootApiUrl + '/v1/user/login',
            method: "POST",
            header: {
              'content-type': 'application/json',
            },
            data: {
              'code': app.globalData.code,
            },
            success(apiRes) {
              let result = apiRes.data;
              if (result.success) {
                if (result.openid) {
                  // 成功获取用户OpenId
                  app.globalData.openid = result.openid;
                }
                if (result.registered) {
                  // 用户已经注册
                  console.log('用户已注册:', result.access_token);
                  app.globalData.accessToken = result.access_token;
                  // 设置用户信息
                  app.globalData.userInfo.uid = result.uid;
                  app.globalData.userInfo.role = result.role;
                  app.globalData.userInfo.email = result.email;
                  app.globalData.userInfo.phone = result.phone;
                  app.globalData.userInfo.campus = result.campus;
                  app.globalData.userInfo.nickname = result.nickname;
                  app.globalData.userInfo.avatarUrl = result.avatar;
                  // 成功登录
                  app.globalData.isloggedin = true;
                  resolve(200); // 返回 200 (成功登录)
                } else {
                  // 用户尚未注册
                  console.log('用户尚未注册:', result);
                  app.globalData.accessToken = result.access_token;
                  resolve(300); // 返回 300 (未注册)
                }
              } else {
                console.log('请求失败:', result);
                resolve(500); // 返回 500 (服务器错误)
              }
            },
            complete() {
              console.log('requesting /user/login complete.');
            },
          })
        } else {
          // 获取code失败，使用 reject 返回 -1
          console.log('获取code失败:', res);
          reject(-1);
        }
      },
    });
  });
}

// https://fyapidocs.wjlo.cc/user/verify
function verify(phone, verifiCode) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/verify...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/verify',
      data: {
        phone: phone,
        verification_code: verifiCode,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败:', res);
          resolve(401);
        } else if (res.data.status === "verified") {
          // 验证成功，从接口获取数据
          console.log("验证成功");
          that.setData({
            ["userInfo.uid"]: res.data.uid,
            ["userInfo.role"]: res.data.role,
          });
          resolve(200);
        } else if (res.data.status === "verification_failed") {
          console.log('验证码核验失败:', res);
          resolve(300);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      },
      complete() {
        console.log('requesting /user/verify complete.');
      }
    })
  });
}

// 更改用户信息 https://fyapidocs.wjlo.cc/user/setuser
function setUserInfo(userInfo) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/setuser...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/setuser',
      data: {
        openid: app.globalData.openid, // 必填
        role: userInfo.role,
        email: userInfo.email,
        campus: userInfo.campus,
        avatar: userInfo.avatarUrl,
        nickname: userInfo.nickname,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败:', res);
          resolve(401);
        } else if (res.data.success) {
          // 修改成功
          console.log('修改成功:', res);
          resolve(200);
        } else {
          console.log('修改失败:', res);
          resolve(300);
        }
      },
      complete() {
        console.log('requesting /user/setuser complete.');
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/user/avatar
function uploadQiniuImg(localFilePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: app.globalData.rootApiUrl + "/v1/user/avatar",
      name: "file",
      filePath: localFilePath,
      header: {
        "Content-Type": "multipart/form-data",
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      formData: {
        key: "fyMiniprogam/" + getUUid(),
      },
      success: function (res) {
        let data = JSON.parse(res.data);
        if (data.success) {
          console.log("Upload image success!");
          resolve("https://cdn.feiyang.ac.cn/" + data.key);
        } else {
          console.log("Error occured:", data.data);
          reject(data);
        }
      },
      fail: function (res) {
        console.log("Failed to upload image:", res);
        reject(res);
      },
    });
  });
}

// function putFeedback() {
//   wx.request({
//     url: 'https://fix.fyscu.com/api/onpage/about/put_feedback.php',
//     data: {
//       "seid": temp_seid,
//       "pnum": temp_pnum,
//       "text": temp_this.data.question,
//     },
//     method: 'GET',
//     header: {
//       'content-type': 'application/json'
//     },
//     success: function (res) {
//       console.log('[获取反馈状态]内容：' + res.data)
//     },
//   })
//   wx.showToast({
//     title: '反馈成功',
//     icon: 'success'
//   })
//   this.setData({
//     isShow: false,
//   })
// }

// https://fyapidocs.wjlo.cc/ticket/add
function addTicket(purchase_date, device_type, brand, description, image, fault_type, qq, campus) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/ticket/create",
      data: {
        uid: app.globalData.userInfo.uid,
        phone: app.globalData.userInfo.phone,
        purchase_date: purchase_date, // 机器购买时间 date
        device_type: device_type, // 设备类型 string
        brand: brand, // 设备品牌 string
        description: description, // 报修问题描述 string
        image: image, // 报修图片地址 string
        fault_type: fault_type, // 问题类型 string
        qq: qq, // 用户预留qq号 int
        campus: campus, // 用户所在校区 string
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      success(res) {
        console.log(`Bearer ${app.globalData.accessToken}`);
        if (res.statusCode === 401) {
          console.log('鉴权失败:', res);
          resolve(401);
        } else if (res.data.success) {
          console.log("创建工单成功，订单号:", res.data.orderid);
          resolve(200);
        } else {
          console.log("创建工单失败:", res.data);
          resolve(300);
        }
      }
    });
  });
}


module.exports = {
  userLogin,
  userRegister,
  verify,
  setUserInfo,
  uploadQiniuImg,
  addTicket,
}