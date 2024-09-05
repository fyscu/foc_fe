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
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          if (res.data.status === "verification_code_sent") {
            console.log("成功发送验证码");
            app.globalData.accessToken = res.data.access_token;
            resolve(200);
          } else if (res.data.status === "user_exists_verified") {
            console.log("已有用户");
            resolve(300);
          } else if (res.data.status === "user_need_migration") {
            console.log("用户需要迁移");
            app.globalData.accessToken = res.data.access_token;
            resolve(400);
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

// https://fyapidocs.wjlo.cc/user/delete
function unRegister() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/delete...", app.globalData.openid);
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/delete',
      data: {
        openid: app.globalData.openid,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log('成功删除帐号');
          resolve(200);
        } else {
          console.log('删除失败:', res);
          resolve(500);
        }
      },
      complete() {
        console.log('requesting /user/delete complete.');
      },
    })
  });
}

// https://fyapidocs.wjlo.cc/user/migration
function userMigration(phone, verifiCode) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/migration...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/migration',
      data: {
        phone: phone,
        code: verifiCode,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          if (res.data.status === "user_migrated") {
            console.log("成功迁移帐号");
            resolve(200);
          } else if (res.data.status === "invalid_verification_code") {
            console.log('验证码核验失败:', res);
            resolve(300);
          } else {
            console.log('迁移失败:', res);
            resolve(500);
          }
        } else {
          console.log('迁移失败，未知错误', res);
          resolve(500);
        }
      },
      complete() {
        console.log('requesting /user/migration complete.');
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
        code: verifiCode,
      },
      header: {
        'content-type': 'application/json',
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.status === "verified") {
          // 验证成功，从接口获取数据
          console.log("验证成功", res);
          app.globalData.isloggedin = true; // 注册成功≈登录成功
          app.globalData.userInfo.phone = phone; // (暂时) 保存用户手机号
          resolve(200);
        } else if (res.data.status === "verification_failed") {
          console.log('验证码核验失败:', res);
          resolve(300);
        } else if (res.data.status === "user_not_exists") {
          console.log('用户不存在:', res);
          resolve(404);
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
    console.log("Requesting /user/setuser...", userInfo);
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/setuser',
      data: {
        id: app.globalData.openid, // 必填
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
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log('修改成功:', res);
          app.globalData.userInfo = userInfo;
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

// 设置技术员是否接单
function setTechInfo(available = true) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/setuser...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/setuser',
      data: {
        // qq: qq,
        available: available,
      },
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          // 修改成功
          console.log('修改成功:', res);
          app.globalData.userInfo.available = available;
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
          console.log("Upload image success!", data);
          resolve(data.data);
        } else {
          console.log("Error occured:", data);
          reject(data.data);
        }
      },
      fail: function (res) {
        console.log("Failed to upload image:", res);
        reject(res);
      },
    });
  });
}

function putFeedback(text) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/feedback/add',
      data: { "text": text },
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      success: function (res) {
        console.log("反馈内容:", text)
        if (res.statusCode === 401) {
          console.log("鉴权失败，重新登录中...", res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log("反馈成功: id =", res.data.qid);
          resolve(200);
        } else {
          console.log("反馈失败:", res.data);
          resolve(300);
        }
      },
    })
  });
}

// https://fyapidocs.wjlo.cc/ticket/add
function addTicket(purchase_date, phone, device_type, brand, description, image, fault_type, qq, campus) {
  return new Promise((resolve, reject) => {
    if (!image) {
      image = "https://focapp.feiyang.ac.cn/public/ticketdefault.svg";
      console.log("use default url:", image);
    }
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/ticket/create",
      data: {
        uid: app.globalData.userInfo.uid,
        phone: phone,
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
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log("创建工单成功，工单号:", res.data.ticketid);
          resolve(200);
        } else {
          console.log("创建工单失败:", res.data);
          resolve(300);
        }
      }
    });
  });
}

// https://fyapidocs.wjlo.cc/get/getticket
function getTicket(data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getTicket",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'GET',
      data: data,
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          console.log('获取失败，权限不足:', res);
          resolve(403);
        } else if (res.data.data) {
          console.log('获取工单成功:', res);
          // 更新全局工单
          app.globalData.ticketList = res.data.data;
          resolve(200);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/ticket/complete
function completeTicket(orderId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/ticket/complete",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'POST',
      data: {
        order_id: orderId
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          if (res.data.status === "ticket not found") {
            console.log('工单未找到:', res);
            resolve(404);
          } else if (res.data.status === "technician does not match the ticket") {
            console.log('技术员与工单分配不对应:', res);
            resolve(403);
          } else {
            console.log('未知错误:', res);
            resolve(500);
          }
        } else if (res.data.success === true) {
          console.log('结束工单成功:', res);
          resolve(200);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/ticket/set
function setTicketStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/ticket/set",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'POST',
      data: {
        tid: orderId,
        repair_status: status,
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log('更改成功:', res);
          resolve(200);
        } else {
          console.log('更改失败:', res);
          resolve(500);
        }
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/get/getconfig
function getConfig() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/conf/get",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      method: 'GET',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          console.log('获取失败:', res);
          resolve(403);
        } else if (res.data.configs) {
          console.log('获取全局配置成功:', res);
          app.globalData.sysConfig = res.data.configs;
          resolve(200);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

function setConfig(name, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/conf/set",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        name: name,
        data: data,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          console.log('获取失败:', res);
          resolve(403);
        } else if (res.data.success === true) {
          console.log('修改成功:', res);
          resolve(200);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/event/regevent
// TODO:
// - 报名活动后，分配唯一的活动号码
// - 活动开始时微信推送
function regevent(activity_id, uid = app.globalData.userInfo.uid) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/event/regevent",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        activity_id: activity_id,
        uid: uid,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          console.log('报名失败:', res);
          resolve(403);
        } else if (res.data.success === true) {
          console.log('报名成功:', res);
          resolve(200);
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

module.exports = {
  userLogin,
  unRegister,
  userRegister,
  verify,
  setUserInfo,
  setTechInfo,
  uploadQiniuImg,
  addTicket,
  getTicket,
  putFeedback,
  getConfig,
  completeTicket,
  setTicketStatus,
  setConfig,
  regevent,
  userMigration,
}
