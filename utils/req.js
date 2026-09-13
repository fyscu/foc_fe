import {
  getUUid
} from "./util";

// 本页面专用于与后端的Http交互
var app = getApp();

// 用户注册 https://fyapidocs.wjlo.cc/user/register
function userRegister(phone) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/register...", phone);
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
          if (res.data.status === "no_imm") {
            console.log("无需迁移");
            app.globalData.accessToken = res.data.access_token;
            resolve(900);
          } else if (res.data.status === "verification_code_sent") {
            console.log("验证码已发送");
            resolve(200);
          } else if (res.data.status === "user_exists_verified") {
            console.log("已有用户");
            resolve(300);
          } else if (res.data.status === "user_need_migration") {
            console.log("用户需要迁移");
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
        console.log('Requesting /user/checktoimm complete.');
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
          // 清空所有数据
          app.globalData.userInfo.qq = ""; // 用户QQ号
          app.globalData.userInfo.uid = ""; // 用户id
          app.globalData.userInfo.role = ""; // 用role替代is_tech
          app.globalData.userInfo.email = ""; // 用户邮箱
          app.globalData.userInfo.phone = ""; // 用户手机号
          app.globalData.userInfo.campus = ""; // 所在校区
          app.globalData.userInfo.nickname = ""; // 用户昵称
          app.globalData.userInfo.tempEmail = ""; // 临时邮箱
          app.globalData.userInfo.avatarUrl = "https://img1.doubanio.com/view/group_topic/l/public/p560183288.webp"; // 用户头像地址
          app.globalData.ticketList = [];
          app.globalData.isloggedin = false;
          app.globalData.code = null;
          app.globalData.openid = null;
          app.globalData.accessToken = null;
          resolve(200);
        } else {
          console.log('删除失败:', res);
          resolve(500);
        }
      },
      complete() {
        console.log('Requesting /user/delete complete.');
      },
    })
  });
}

// https://fyapidocs.wjlo.cc/user/migration
function userMigration(phone, verifiCode) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/migration...", phone, verifiCode);
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
        console.log('Requesting /user/migration complete.');
      },
    })
  });
}

// 微信登录 https://fyapidocs.wjlo.cc/admin/login
// 并发请求共享一次微信登录，避免多个临时 code 互相覆盖。
let loginInFlight = null;
function userLogin() {
  if (loginInFlight) {
    return loginInFlight;
  }
  const attempt = new Promise((resolve, reject) => {
    wx.login({
      timeout: 15000,
      success(res) {
        if (!res.code) {
          reject(-1);
          return;
        }
        app.globalData.code = res.code;
        try {
          wx.request({
            url: app.globalData.rootApiUrl + '/v1/user/login',
            method: 'POST',
            timeout: 20000,
            header: { 'content-type': 'application/json' },
            data: { code: res.code },
            success(apiRes) {
              try {
                const result = apiRes.data;
                if (apiRes.statusCode < 200 || apiRes.statusCode >= 300 ||
                    !result || result.success !== true || !result.access_token) {
                  resolve(500);
                  return;
                }
                if (result.openid) {
                  app.globalData.openid = result.openid;
                }
                app.globalData.accessToken = result.access_token;
                if (result.registered) {
                  app.globalData.userInfo.uid = result.uid;
                  app.globalData.userInfo.id = result.uid;
                  app.globalData.userInfo.role = result.role;
                  app.globalData.userInfo.email = result.email;
                  app.globalData.userInfo.phone = result.phone;
                  app.globalData.userInfo.campus = result.campus;
                  app.globalData.userInfo.nickname = result.nickname;
                  app.globalData.userInfo.avatarUrl = result.avatar;
                  app.globalData.userInfo.tempEmail = result.temp_email;
                  if (result.role === 'technician') {
                    app.globalData.userInfo.wants = result.wants;
                    app.globalData.userInfo.available = result.available;
                    app.globalData.userInfo.canDuo = result.canDuo;
                  }
                  app.globalData.isloggedin = true;
                  resolve(200);
                } else {
                  app.globalData.isloggedin = false;
                  app.globalData.userInfo.openid = result.openid;
                  app.globalData.userInfo.codePhone = result.codePhone;
                  app.globalData.userInfo.verCode = result.verCode;
                  resolve(300);
                }
              } catch (error) {
                resolve(500);
              }
            },
            fail() {
              resolve(500);
            },
          });
        } catch (error) {
          resolve(500);
        }
      },
      fail() {
        resolve(500);
      },
    });
  });
  loginInFlight = attempt.then((code) => {
    loginInFlight = null;
    return code;
  }, (error) => {
    loginInFlight = null;
    throw error;
  });
  return loginInFlight;
}

// https://fyapidocs.wjlo.cc/user/verify
function verify(phone, verfiCode) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/verify...", phone, verfiCode);
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/verify',
      data: {
        phone: phone,
        code: verfiCode,
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
        } else if (res.data.status === "no_sms") {
          console.log('未收到验证码:', res);
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
        console.log('Requesting /user/verify complete.');
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
        id: userInfo.id, // 必填
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
          resolve(500);
        }
      },
      complete() {
        console.log('Requesting /user/setuser complete.');
      }
    })
  });
}

// 设置技术员是否接单
function setTechInfo(userInfo) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/setuser...", userInfo);
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/setuser',
      data: {
        id: userInfo.id, // 必填
        wants: userInfo.wants,
        canDuo: userInfo.canDuo
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
          app.globalData.userInfo.wants = userInfo.wants;
          resolve(200);
        } else {
          console.log('修改失败:', res);
          resolve(300);
        }
      },
      complete() {
        console.log('Requesting /user/setuser complete.');
      }
    })
  });
}

// https://fyapidocs.wjlo.cc/user/avatar
function uploadQiniuImg(localFilePath) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/avatar...", localFilePath);
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

function uploadQiniuImgRaw(localFilePath) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/avatar...", localFilePath);
    wx.uploadFile({
      url: app.globalData.rootApiUrl + "/v1/user/avatar",
      name: "file",
      filePath: localFilePath,
      timeout: 20000,
      header: {
        "Content-Type": "multipart/form-data",
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      formData: {
        key: "fyMiniprogam/" + getUUid(),
      },
      success: function (res) {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300 && data.success && data.rawdata) {
            resolve(data.rawdata);
          } else {
            reject(data.data);
          }
        } catch (error) {
          reject(error);
        }
      },
      fail: function (res) {
        console.log("Failed to upload image:", res);
        reject(res);
      },
    });
  });
}

function putFeedback(contact, text) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /feedback/add...", contact, text);
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/feedback/add',
      data: { text: text, contact: contact },
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
function addTicket(
  purchase_date, phone, device_type,
  brand, description, image, fault_type,
  qq, campus, DuoCampus, warranty_status, model
) {
  return new Promise((resolve, reject) => {
    if (!image) {
      image = "https://focapp.feiyang.ac.cn/public/ticketdefault.svg";
      console.log("use default url:", image);
    }
    console.log("Requesting /ticket/add...", purchase_date, phone, device_type, brand, description, image, fault_type, qq, campus, warranty_status, model);
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
        DuoCampus: DuoCampus,
        campus: campus, // 用户所在校区 string
        warranty_status: warranty_status, // 保修状态
        model: model, // 设备型号
        user_nick: app.globalData.userInfo.nickname,
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
        } else if (res.data.success === false) {
          if (res.data.message === "order_exists") {
            console.log("工单已存在", res);
            resolve(300);
          } else if (res.data.message === "已达用户每周限额") {
            console.log("已达用户每周限额", res);
            resolve(403);
          } else {
            console.log("创建工单失败:", res);
            resolve(500);
          }
        } else {
          console.log("创建工单失败:", res);
          resolve(500);
        }
      }
    });
  });
}

// 只有明确的 401 才重放一次；断网/超时无法确定写入结果，交给页面刷新确认。
function ticketMutation(path, data, resultCode, allowAuthRetry = true) {
  const payload = Object.assign({}, data);
  const url = app.globalData.rootApiUrl + path;
  function send(canRetry) {
    const sentToken = app.globalData.accessToken;
    return new Promise((resolve) => {
      wx.request({
        url: url,
        data: payload,
        header: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${sentToken}`,
        },
        method: 'POST',
        timeout: 20000,
        success(res) {
          if (res.statusCode === 401) {
            if (!canRetry) {
              resolve(401);
              return;
            }
            // 较慢的旧请求可能在其他请求已经刷新 token 后才返回 401。
            const refreshed = app.globalData.isloggedin &&
              app.globalData.accessToken && app.globalData.accessToken !== sentToken;
            const login = refreshed ? Promise.resolve(200) : userLogin();
            login.then((code) => {
              if (code !== 200 || !app.globalData.accessToken) {
                resolve(401);
                return;
              }
              send(false).then(resolve);
            }).catch(() => resolve(401));
            return;
          }
          try {
            if (!res.data || typeof res.data !== 'object' ||
                (res.data.success === true && (res.statusCode < 200 || res.statusCode >= 300))) {
              resolve(500);
              return;
            }
            resolve(resultCode(res.data));
          } catch (error) {
            resolve(500);
          }
        },
        fail() {
          resolve(500);
        },
      });
    }).catch(() => 500);
  }
  return send(allowAuthRetry);
}

// https://fyapidocs.wjlo.cc/ticket/give
function giveTicket(data) {
  const payload = Object.assign({}, data);
  if (typeof payload.request_id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(payload.request_id)) {
    // 仅用于识别一次转单操作；不是凭据。401 重放复用下方同一 payload。
    payload.request_id = Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 12) + '_' +
      Math.random().toString(36).slice(2, 12);
  }
  return ticketMutation('/v1/ticket/give', payload, (result) => {
    if (result.success === true) return 200;
    if (result.success === false) {
      if (result.message === 'Transfer vcode mismatch') return 403;
      if (result.message === 'Ticket not found') return 404;
      if (result.message === 'Order has closed') return 300;
    }
    return 500;
  });
}

// https://fyapidocs.wjlo.cc/get/getticket
function getTicket(data) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getTicket...", data);
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
        } else if (res.data.success === true && res.data.data) {
          console.log('获取工单成功:', res);
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

// 详情读取不覆盖首页的整张列表；路由参数与 JSON 的 ID 类型都按字符串比较。
function getTicketDetail(orderId, allowAuthRetry = true) {
  const id = orderId === undefined || orderId === null ? '' : String(orderId);
  if (!/^\d+$/.test(id)) return Promise.resolve({ code: 404, ticket: null });
  const failed = (code) => ({ code: code, ticket: null });
  function send(canRetry) {
    const sentToken = app.globalData.accessToken;
    return new Promise((resolve) => {
      wx.request({
        url: app.globalData.rootApiUrl + '/v1/status/getTicket',
        method: 'GET',
        data: { orderid: id },
        timeout: 20000,
        header: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${sentToken}`,
        },
        success(res) {
          if (res.statusCode === 401) {
            if (!canRetry) { resolve(failed(401)); return; }
            const refreshed = app.globalData.isloggedin &&
              app.globalData.accessToken && app.globalData.accessToken !== sentToken;
            const login = refreshed ? Promise.resolve(200) : userLogin();
            login.then((code) => {
              if (code !== 200 || !app.globalData.accessToken) {
                resolve(failed(401)); return;
              }
              send(false).then(resolve);
            }).catch(() => resolve(failed(401)));
            return;
          }
          if (res.statusCode === 404 || res.statusCode === 403) {
            resolve(failed(res.statusCode)); return;
          }
          try {
            const body = res.data;
            if (res.statusCode < 200 || res.statusCode >= 300 ||
                !body || body.success !== true || !Array.isArray(body.data)) {
              resolve(failed(500)); return;
            }
            const ticket = body.data.find(item => item && String(item.id) === id);
            if (!ticket) { resolve(failed(404)); return; }
            const list = Array.isArray(app.globalData.ticketList) ? app.globalData.ticketList : [];
            const index = list.findIndex(item => item && String(item.id) === id);
            if (index === -1) list.push(ticket);
            else list[index] = ticket;
            app.globalData.ticketList = list;
            resolve({ code: 200, ticket: ticket });
          } catch (error) {
            resolve(failed(500));
          }
        },
        fail() { resolve(failed(500)); },
      });
    }).catch(() => failed(500));
  }
  return send(allowAuthRetry);
}

// https://fyapidocs.wjlo.cc/ticket/complete
function completeTicket(orderId, allowAuthRetry = true) {
  return ticketMutation('/v1/ticket/complete', { order_id: orderId }, (result) => {
    if (result.success === true) {
      const ticket = (app.globalData.ticketList || []).find(
        item => String(item.id) === String(orderId)
      );
      if (ticket) ticket.repair_status = result.repair_status || 'Done';
      return 200;
    }
    if (result.success === false) {
      if (result.status === 'ticket not found') return 404;
      if (result.status === 'technician does not match the ticket') return 403;
    }
    return 500;
  }, allowAuthRetry);
}

// https://fyapidocs.wjlo.cc/ticket/set
function setTicketStatus(orderId, status, allowAuthRetry = true) {
  return ticketMutation('/v1/ticket/set', {
    tid: orderId,
    repair_status: status,
  }, (result) => {
    if (result.success !== true) return 500;
    // 双方确认可能直接变成 Done，以服务器最终状态更新列表。
    const returnedStatus = result.repair_status ||
      (result.changedFields && result.changedFields.repair_status);
    const actualStatus = typeof returnedStatus === 'string' && returnedStatus ?
      returnedStatus : status; // 兼容未回传最终状态的旧接口。
    const ticket = (app.globalData.ticketList || []).find(
      (item) => String(item.id) === String(orderId)
    );
    if (ticket) {
      ticket.repair_status = actualStatus;
    }
    return 200;
  }, allowAuthRetry);
}

// https://fyapidocs.wjlo.cc/ticket/set
function setCompleteImage(orderId, url) {
  return ticketMutation('/v1/ticket/set', {
    tid: orderId,
    complete_image_url: url,
  }, (result) => {
    if (result.success !== true) return 500;
    const ticket = (app.globalData.ticketList || []).find(
      item => String(item.id) === String(orderId)
    );
    if (ticket) ticket.complete_image_url = url;
    return 200;
  });
}

// https://fyapidocs.wjlo.cc/get/getconfig
function getConfig() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /conf/get...");
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

function getTopTech(campus = app.globalData.userInfo.campus) {
  let data = {}; // 总榜
  if (campus === "江安") {
    data = { campus: "j" }; // 江安榜
  } else if (campus === "望江" || campus === "华西") {
    data = { campus: "m" }; // 磨子桥榜
  }
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getLaomo...");
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getLaomo",
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
        } else if (res.data.success === true) {
          console.log('获取劳模成功:', res);
          resolve(res.data.top_technicians);
        } else {
          console.log('获取劳模失败:', res);
          resolve(500);
        }
      }
    })
  });
}

function setConfig(name, data) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /conf/set...", name, data);
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
    console.log("Requesting /event/regevent...", activity_id, uid);
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
          if (res.data.message === "Registered") {
            console.log("已报名", res);
            resolve(300);
          } else if (res.data.message === "请使用大修活动报名接口") {
            console.log('请使用大修活动报名接口:', res);
            resolve(403);
          } else {
            console.log('报名失败:', res);
            resolve(500);
          }
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

// https://fyapidocs.wjlo.cc/event/regrepair
function regrepair(
  activity_id, name, gender,
  departments, free_times,
  uid = app.globalData.userInfo.uid
) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /event/regrepair...", activity_id, name, gender, departments, free_times, uid);
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/event/regrepair",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        activity_id: activity_id,
        name: name,
        gender: gender,
        departments: departments, // ["研发部", "行政部"]
        free_times: free_times,  // ["08:00-10:00", "12:00-14:00", "16:00-18:00"]
        uid: uid,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          if (res.data.message === "Registered") {
            console.log("已报名", res);
            resolve(300);
          } else if (res.data.message === "此活动不是大修活动") {
            console.log("此活动不是大修活动", res);
            resolve(403);
          } else {
            console.log('报名失败:', res);
            resolve(500);
          }
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

// https://fyapidocs.wjlo.cc/user/phonechange
function newPhone(phone) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/newphone...");
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/user/newphone",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        phone: phone,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          if (res.data.status === "same_phone") {
            console.log('手机号相同:', res);
            resolve(300);
          } else if (res.data.status === "phone_exists") {
            console.log('手机号已存在:', res);
            resolve(403);
          }
        } else if (res.data.success === true) {
          if (res.data.status === "verification_code_sent") {
            console.log('成功发送验证码:', res);
            resolve(200);
          } else {
            console.log('请求失败:', res);
            resolve(500);
          }
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

function newEmail(email) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/newemail...", email);
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/user/newemail",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        email: email,
      },
      method: 'POST',
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === false) {
          if (res.data.status === "same_email") {
            console.log('邮箱未改变:', res);
            resolve(300);
          }
        } else if (res.data.success === true) {
          if (res.data.status === "verification_email_sent") {
            console.log('成功发送验证码:', res);
            resolve(200);
          } else {
            console.log('请求失败:', res);
            resolve(500);
          }
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      }
    })
  });
}

//https://fyapidocs.wjlo.cc/user/vchangephone
function phoneChangeVerify(phone, verifiCode) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /user/phonechange_verify...");
    wx.request({
      url: app.globalData.rootApiUrl + '/v1/user/phonechange_verify',
      data: {
        vcode: verifiCode,
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
        } else if (res.data.status === "success") {
          if (res.data.message === "phone_updated") {
            console.log("手机号更改成功");
            app.globalData.userInfo.phone = phone;
            resolve(200);
          } else {
            console.log('请求失败:', res);
            resolve(500);
          }
        } else if (res.data.status === "error") {
          if (res.data.message === "bad_code") {
            console.log("验证码错误", res);
            resolve(300);
          } else {
            console.log('请求失败:', res);
            resolve(500);
          }
        } else {
          console.log('请求失败:', res);
          resolve(500);
        }
      },
      complete() {
        console.log('Requesting /user/phonechange_verify complete.');
      }
    })
  });
}

function getRootApi() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /rootApiUrl.json...");
    wx.request({
      url: "https://fyclub.oss-cn-chengdu.aliyuncs.com/rootApiUrl.json",
      method: "GET",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      success(res) {
        console.log("获取rootApiUrl成功", res);
        app.globalData.rootApiUrl = res.data.url;
        resolve(200);
      },
      fail(err) {
        console.log("获取rootApiUrl失败", err);
        resolve(500);
      }
    });
  });
}

// https://fyapidocs.wjlo.cc/get/getevent
function getEvent() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getEvent...");
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getEvent",
      method: "GET",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log("获取活动成功", res);
          resolve(res.data.activities);
        } else if (res.data.success === false) {
          if (res.data.activities === "No activities found") {
            console.log("找不到活动", res);
            resolve(404);
          } else {
            console.log("获取活动失败", res);
            resolve(500);
          }
        } else {
          console.log("获取活动失败", res);
          resolve(500);
        }
      }
    });
  });
}

// https://fyapidocs.wjlo.cc/get/getLuckynum
function getLuckynum(activity_id, uid = app.globalData.userInfo.uid) {
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getLuckynum...", activity_id, uid);
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getLuckynum",
      method: "GET",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        activity_id: activity_id,
        user_id: uid,
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          console.log("获取抽奖号成功", res);
          resolve(res.data);
        } else if (res.data.success === false) {
          console.log("获取抽奖号失败", res);
          resolve(500);
        } else {
          console.log("获取抽奖号失败", res);
          resolve(500);
        }
      }
    });
  });
}

// https://fyapidocs.wjlo.cc/get/getuser
function getUserInfo() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getUser...");
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getUser",
      method: "GET",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        openid: app.globalData.openid,
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          let tmpData = res.data.data;
          console.log("获取用户数据成功", res);
          // app.globalData.accessToken = tmpData.access_token;
          // 设置用户信息
          app.globalData.userInfo.uid = tmpData.id;
          app.globalData.userInfo.role = tmpData.role;
          app.globalData.userInfo.email = tmpData.email;
          app.globalData.userInfo.phone = tmpData.phone;
          app.globalData.userInfo.campus = tmpData.campus;
          app.globalData.userInfo.nickname = tmpData.nickname;
          app.globalData.userInfo.avatarUrl = tmpData.avatar;
          app.globalData.userInfo.tempEmail = tmpData.temp_email;
          // 设置技术员信息
          if (tmpData.role === "technician") {
            app.globalData.userInfo.wants = tmpData.wants;
            app.globalData.userInfo.available = tmpData.available;
          }
          resolve(200);
        } else if (res.data.success === false && res.data.data === "权限不足") {
          console.log("权限不足", res);
          resolve(403);
        } else {
          console.log("获取用户数据失败", res);
          resolve(500);
        }
      }
    });
  });
}

function getTechSum() {
  return new Promise((resolve, reject) => {
    console.log("Requesting /status/getTechSum...");
    wx.request({
      url: app.globalData.rootApiUrl + "/v1/status/getTechSum",
      method: "GET",
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${app.globalData.accessToken}`,
      },
      data: {
        year: 2024,
      },
      success(res) {
        if (res.statusCode === 401) {
          console.log('鉴权失败，重新登录中...', res);
          userLogin();
          resolve(401);
        } else if (res.data.success === true) {
          let tmpData = res.data.data;
          console.log("获取年度总结成功", res);
          // app.globalData.accessToken = tmpData.access_token;
          app.globalData.techSum.first_time = tmpData.first_time;
          app.globalData.techSum.last_time = tmpData.last_time;
          app.globalData.techSum.total_orders = tmpData.total_orders;
          app.globalData.techSum.shortest_time = tmpData.shortest_time;
          app.globalData.techSum.longest_time = tmpData.longest_time;
          app.globalData.techSum.total_time = tmpData.total_time;
          app.globalData.techSum.total_time_in_hour = tmpData.total_time_in_hour;
          resolve(200);
        } else if (res.data.success === false && res.data.data === "权限不足") {
          console.log("权限不足", res);
          resolve(403);
        } else {
          console.log("获取年度总结失败", res);
          resolve(500);
        }
      }
    });
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
  uploadQiniuImgRaw,
  addTicket,
  giveTicket,
  getTicket,
  getTicketDetail,
  putFeedback,
  getConfig,
  completeTicket,
  setTicketStatus,
  setCompleteImage,
  setConfig,
  getTopTech,
  regevent,
  regrepair,
  userMigration,
  newPhone,
  newEmail,
  getRootApi,
  getEvent,
  getLuckynum,
  getUserInfo,
  getTechSum,
  phoneChangeVerify
}
