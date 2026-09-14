'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Only wx transport is mocked; the actual production candidate is evaluated unchanged
// except for its unrelated ES-module util import, which Node's CJS vm cannot parse.
const reqPath = process.env.FOC_REQ_FILE ||
  path.resolve(__dirname, '../utils/req.js');
const source = fs.readFileSync(reqPath, 'utf8').replace(
  /^import\s*\{\s*getUUid\s*\}\s*from\s*["']\.\/util["'];?\s*/, '');
function harness() {
  const requests = [];
  const logins = [];
  const app = { globalData: {
    rootApiUrl: 'https://foc.example.test', accessToken: 'expired-token',
    isloggedin: true, userInfo: {}
  }};
  const sandbox = {
    getApp: () => app, getUUid: () => 'unused',
    wx: {
      request: options => requests.push(options),
      login: options => logins.push(options),
    },
    console: { log() {} }, module: { exports: {} },
  };
  vm.runInNewContext(source, sandbox, { filename: reqPath });
  return { api: sandbox.module.exports, app, requests, logins, wx: sandbox.wx };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const success = (req, body = { success: true }, statusCode = 200) =>
  req.success({ statusCode, data: body });
const unauthorized = req => success(req, { success: false }, 401);
async function finishLogin(h, overrides = {}) {
  assert.equal(h.logins.length, 1);
  assert.equal(h.logins[0].timeout, 15000);
  h.logins[0].success({ code: 'fresh-code' });
  const login = h.requests.find(req => req.url.endsWith('/user/login'));
  assert.ok(login);
  assert.deepEqual(JSON.parse(JSON.stringify(login.data)), { code: 'fresh-code' });
  assert.equal(login.timeout, 20000);
  success(login, {
    success: true, registered: true, access_token: 'fresh-token',
    uid: 21, role: 'technician', openid: 'test-openid', ...overrides,
  });
  await tick();
}
const operations = [
  ['giveTicket', api => api.giveTicket({ tid: 41, vcode: '12345' }),
    '/ticket/give', { tid: 41, vcode: '12345' }],
  ['completeTicket', api => api.completeTicket(41),
    '/ticket/complete', { order_id: 41 }],
  ['setTicketStatus', api => api.setTicketStatus(41, 'Cancel'),
    '/ticket/set', { tid: 41, repair_status: 'Cancel' }],
  ['setCompleteImage', api => api.setCompleteImage(41, 'https://example.test/done.jpg'),
    '/ticket/set', { tid: 41, complete_image_url: 'https://example.test/done.jpg' }],
];
for (const [name, invoke, route, payload] of operations) {
  test(name + ': 401 waits for login and replays original request with new token', async () => {
    const h = harness();
    const result = invoke(h.api);
    const first = h.requests[0];
    assert.ok(first.url.endsWith(route));
    assert.equal(first.method, 'POST');
    assert.equal(first.header.Authorization, 'Bearer expired-token');
    assert.equal(first.timeout, 20000);
    unauthorized(first);
    await tick();
    assert.equal(h.requests.length, 1, 'no write before login completes');
    await finishLogin(h);
    assert.equal(h.requests.length, 3);
    const retry = h.requests[2];
    assert.equal(retry.url, first.url);
    assert.equal(retry.header.Authorization, 'Bearer fresh-token');
    const replayPayload = JSON.parse(JSON.stringify(retry.data));
    assert.deepEqual(replayPayload, JSON.parse(JSON.stringify(first.data)));
    if (name === 'giveTicket') {
      assert.match(replayPayload.request_id, /^[A-Za-z0-9_-]{1,64}$/);
      delete replayPayload.request_id;
    }
    assert.deepEqual(replayPayload, payload);
    success(retry);
    assert.equal(await result, 200);
  });

  test(name + ': a second 401 stops without another login or replay', async () => {
    const h = harness();
    const result = invoke(h.api);
    unauthorized(h.requests[0]);
    await finishLogin(h);
    unauthorized(h.requests[2]);
    assert.equal(await result, 401);
    assert.equal(h.logins.length, 1);
    assert.equal(h.requests.length, 3);
  });

  test(name + ': uncertain network failure settles without retrying a write', async () => {
    const h = harness();
    const result = invoke(h.api);
    h.requests[0].fail({ errMsg: 'request:fail timeout' });
    assert.equal(await result, 500);
    assert.equal(h.requests.length, 1);
    assert.equal(h.logins.length, 0);
  });

  test(name + ': transport failure after auth retry does not trigger a third write', async () => {
    const h = harness();
    const result = invoke(h.api);
    unauthorized(h.requests[0]);
    await finishLogin(h);
    h.requests[2].fail({ errMsg: 'request:fail disconnected' });
    assert.equal(await result, 500);
    assert.equal(h.requests.length, 3);
    assert.equal(h.logins.length, 1);
  });

  test(name + ': invalid JSON or false success on HTTP500 returns 500', async () => {
    for (const [body, status] of [[null, 200], ['<html>error</html>', 502],
      [{ success: true }, 500]]) {
      const h = harness();
      const result = invoke(h.api);
      success(h.requests[0], body, status);
      assert.equal(await result, 500);
      assert.equal(h.logins.length, 0);
    }
  });
}

function captureUploads(h) {
  const uploads = [];
  h.wx.uploadFile = options => uploads.push(options);
  return uploads;
}

const uploadSuccess = (upload, body, statusCode = 200) => upload.success({
  statusCode,
  data: typeof body === 'string' ? body : JSON.stringify(body),
});

test('raw image upload accepts pure JSON and leaves multipart boundary to wx', async () => {
  const h = harness();
  const uploads = captureUploads(h);
  const result = h.api.uploadQiniuImgRaw('/synthetic/photo.jpg');
  assert.equal(uploads.length, 1);
  const upload = uploads[0];
  assert.equal(upload.url, 'https://foc.example.test/v1/user/avatar');
  assert.equal(upload.name, 'file');
  assert.equal(upload.filePath, '/synthetic/photo.jpg');
  assert.equal(upload.timeout, 20000);
  assert.equal(upload.header.Authorization, 'Bearer expired-token');
  assert.equal(Object.keys(upload.header).some(key => key.toLowerCase() === 'content-type'), false);
  assert.equal(upload.formData.key, 'fyMiniprogam/unused');
  uploadSuccess(upload, { success: true, data: 'signed-preview', rawdata: 'https://example.test/raw.jpg' });
  assert.equal(await result, 'https://example.test/raw.jpg');
});

test('regular image upload uses the signed preview field without setting Content-Type', async () => {
  const h = harness();
  const uploads = captureUploads(h);
  const result = h.api.uploadQiniuImg('/synthetic/avatar.jpg');
  assert.equal(Object.keys(uploads[0].header).some(key => key.toLowerCase() === 'content-type'), false);
  uploadSuccess(uploads[0], { success: true, data: 'https://example.test/signed.jpg', rawdata: 'raw' });
  assert.equal(await result, 'https://example.test/signed.jpg');
});

test('raw image upload retries exactly once after 401 with the refreshed token and same payload', async () => {
  const h = harness();
  const uploads = captureUploads(h);
  const result = h.api.uploadQiniuImgRaw('/synthetic/photo.jpg');
  uploadSuccess(uploads[0], { success: false }, 401);
  await tick();
  assert.equal(uploads.length, 1, 'no upload replay before login completes');
  await finishLogin(h);
  assert.equal(uploads.length, 2);
  assert.equal(uploads[1].header.Authorization, 'Bearer fresh-token');
  assert.equal(uploads[1].filePath, uploads[0].filePath);
  assert.deepEqual(uploads[1].formData, uploads[0].formData);
  uploadSuccess(uploads[1], { success: true, rawdata: 'https://example.test/retried.jpg' });
  assert.equal(await result, 'https://example.test/retried.jpg');
  assert.equal(h.logins.length, 1);
});

test('raw image upload rejects a second 401 without a third upload', async () => {
  const h = harness();
  const uploads = captureUploads(h);
  const result = h.api.uploadQiniuImgRaw('/synthetic/photo.jpg');
  const rejected = assert.rejects(result, error => error && error.code === 401);
  uploadSuccess(uploads[0], { success: false }, 401);
  await finishLogin(h);
  uploadSuccess(uploads[1], { success: false }, 401);
  await rejected;
  assert.equal(uploads.length, 2);
  assert.equal(h.logins.length, 1);
});

test('raw image upload settles as 401 when reauthentication fails', async () => {
  const h = harness();
  const uploads = captureUploads(h);
  const result = h.api.uploadQiniuImgRaw('/synthetic/photo.jpg');
  const rejected = assert.rejects(result, error => error && error.code === 401);
  uploadSuccess(uploads[0], { success: false }, 401);
  h.logins[0].fail({ errMsg: 'login:fail' });
  await rejected;
  assert.equal(uploads.length, 1);
  assert.equal(h.logins.length, 1);
});

for (const [label, complete] of [
  ['PHP warning prefix', upload => uploadSuccess(upload,
    'Deprecated: Creation of dynamic property Qiniu\\Config::$zone is deprecated\n' +
    JSON.stringify({ success: true, rawdata: 'https://example.test/orphan.jpg' }))],
  ['malformed JSON', upload => uploadSuccess(upload, '<invalid>')],
  ['missing rawdata', upload => uploadSuccess(upload, { success: true, data: 'signed-only' })],
  ['non-2xx success body', upload => uploadSuccess(upload,
    { success: true, rawdata: 'https://example.test/not-accepted.jpg' }, 503)],
  ['API failure body', upload => uploadSuccess(upload, { success: false, data: '七牛云上传错误' })],
  ['network failure', upload => upload.fail({ errMsg: 'uploadFile:fail timeout' })],
  ['missing native response', upload => upload.success()],
]) {
  test('raw image upload always rejects and settles: ' + label, async () => {
    const h = harness();
    const uploads = captureUploads(h);
    const result = h.api.uploadQiniuImgRaw('/synthetic/photo.jpg');
    const rejected = assert.rejects(result);
    complete(uploads[0]);
    await rejected;
    assert.equal(uploads.length, 1);
    assert.equal(h.requests.length, 0);
    assert.equal(h.logins.length, 0);
  });
}

test('raw image upload settles when native uploadFile throws synchronously', async () => {
  const h = harness();
  h.wx.uploadFile = () => { throw new Error('synthetic native failure'); };
  await assert.rejects(h.api.uploadQiniuImgRaw('/synthetic/photo.jpg'), /synthetic native failure/);
});

test('raw image upload rejects an empty local path without calling native transport', async () => {
  const h = harness();
  let calls = 0;
  h.wx.uploadFile = () => { calls += 1; };
  await assert.rejects(h.api.uploadQiniuImgRaw(''));
  assert.equal(calls, 0);
});

test('concurrent 401s share one login and each write resumes once', async () => {
  const h = harness();
  const promises = operations.map(([, invoke]) => invoke(h.api));
  h.requests.slice().forEach(unauthorized);
  assert.equal(h.logins.length, 1);
  await finishLogin(h);
  const replay = h.requests.filter(r => r.header.Authorization === 'Bearer fresh-token');
  assert.equal(replay.length, 4);
  replay.forEach(r => success(r));
  assert.deepEqual(await Promise.all(promises), [200, 200, 200, 200]);
  assert.equal(h.requests.filter(r => r.url.endsWith('/user/login')).length, 1);
});

test('late 401 from old token reuses completed refresh without a second login', async () => {
  const h = harness();
  const first = h.api.giveTicket({ tid: 41, vcode: '12345' });
  const second = h.api.completeTicket(42);
  const slowRequest = h.requests[1];
  unauthorized(h.requests[0]);
  await finishLogin(h);
  success(h.requests[3]);
  assert.equal(await first, 200);
  unauthorized(slowRequest);
  await tick();
  assert.equal(h.logins.length, 1);
  assert.equal(h.requests[4].header.Authorization, 'Bearer fresh-token');
  success(h.requests[4]);
  assert.equal(await second, 200);
});

test('transfer payload is captured before waiting for login', async () => {
  const h = harness();
  const payload = { tid: 41, vcode: '12345' };
  const result = h.api.giveTicket(payload);
  unauthorized(h.requests[0]);
  payload.tid = 99;
  payload.vcode = 'different';
  await finishLogin(h);
  const replayPayload = JSON.parse(JSON.stringify(h.requests[2].data));
  assert.equal(replayPayload.request_id, h.requests[0].data.request_id);
  delete replayPayload.request_id;
  assert.deepEqual(replayPayload, { tid: 41, vcode: '12345' });
  success(h.requests[2]);
  assert.equal(await result, 200);
});

for (const mode of ['wx-fail', 'wx-no-code', 'http-fail', 'api-failure', 'unregistered',
  'missing-token', 'malformed-response', 'http500-success']) {
  test('login failure settles 401 without business replay: ' + mode, async () => {
    const h = harness();
    const result = h.api.giveTicket({ tid: 41, vcode: '12345' });
    unauthorized(h.requests[0]);
    if (mode === 'wx-fail') {
      h.logins[0].fail({ errMsg: 'login:fail timeout' });
    } else if (mode === 'wx-no-code') {
      h.logins[0].success({});
    } else {
      h.logins[0].success({ code: 'fresh-code' });
      const login = h.requests[1];
      if (mode === 'http-fail') login.fail({ errMsg: 'request:fail timeout' });
      if (mode === 'api-failure') success(login, { success: false });
      if (mode === 'unregistered') success(login, {
        success: true, registered: false, access_token: 'registration-token'
      });
      if (mode === 'missing-token') success(login, { success: true, registered: true });
      if (mode === 'malformed-response') success(login, null);
      if (mode === 'http500-success') success(login, {
        success: true, registered: true, access_token: 'bad-token'
      }, 500);
    }
    assert.equal(await result, 401);
    assert.equal(h.requests.filter(r => r.url.endsWith('/ticket/give')).length, 1);
    assert.equal(h.logins.length, 1);
    // A failed shared promise must not poison a later explicit login attempt.
    const nextLogin = h.api.userLogin();
    assert.equal(h.logins.length, 2);
    h.logins[1].fail({});
    assert.equal(await nextLogin, 500);
  });
}

test('direct concurrent logins return the same promise and retain user profile contract', async () => {
  const h = harness();
  const a = h.api.userLogin();
  const b = h.api.userLogin();
  assert.equal(a, b);
  await finishLogin(h, { nickname: 'Test Tech', wants: 1, available: 1, canDuo: 0 });
  assert.equal(await a, 200);
  assert.equal(await b, 200);
  assert.equal(h.app.globalData.userInfo.uid, 21);
  assert.equal(h.app.globalData.userInfo.id, 21);
  assert.equal(h.app.globalData.userInfo.nickname, 'Test Tech');
  assert.equal(h.app.globalData.userInfo.wants, 1);
  assert.equal(h.app.globalData.isloggedin, true);
});

test('synchronous request exceptions settle as 500', async () => {
  for (const [, invoke] of operations) {
    const h = harness();
    h.wx.request = () => { throw new Error('mock native failure'); };
    assert.equal(await invoke(h.api), 500);
  }
});

test('business return codes preserve existing page handling', async () => {
  const cases = [
    ['giveTicket', { success: false, message: 'Transfer vcode mismatch' }, 403],
    ['giveTicket', { success: false, message: 'Ticket not found' }, 404],
    ['giveTicket', { success: false, message: 'Order has closed' }, 300],
    ['completeTicket', { success: false, status: 'ticket not found' }, 404],
    ['completeTicket', { success: false, status: 'technician does not match the ticket' }, 403],
  ];
  for (const [name, body, expected] of cases) {
    const h = harness();
    const invoke = operations.find(op => op[0] === name)[1];
    const result = invoke(h.api);
    success(h.requests[0], body, expected === 300 ? 400 : expected);
    assert.equal(await result, expected);
    assert.equal(h.logins.length, 0);
  }
});

test('existing explicit no-auth-retry argument is respected', async () => {
  const h = harness();
  const complete = h.api.completeTicket(41, false);
  const status = h.api.setTicketStatus(42, 'Cancel', false);
  h.requests.forEach(unauthorized);
  assert.deepEqual(await Promise.all([complete, status]), [401, 401]);
  assert.equal(h.logins.length, 0);
});

for (const [label, fields, expected] of [
  ['top-level state', { repair_status: 'Done' }, 'Done'],
  ['changedFields state', { changedFields: { repair_status: 'Done' } }, 'Done'],
  ['top-level state wins', {
    repair_status: 'Done', changedFields: { repair_status: 'UserConfirming' }
  }, 'Done'],
  ['old API fallback', {}, 'TechConfirming'],
]) {
  test('setTicketStatus updates cached final state, preserves 200: ' + label, async () => {
    const h = harness();
    h.app.globalData.ticketList = [
      { id: '41', repair_status: 'UserConfirming' },
      { id: '42', repair_status: 'Repairing' },
    ];
    const result = h.api.setTicketStatus(41, 'TechConfirming');
    success(h.requests[0], { success: true, ...fields });
    assert.equal(await result, 200);
    assert.equal(h.app.globalData.ticketList[0].repair_status, expected);
    assert.equal(h.app.globalData.ticketList[1].repair_status, 'Repairing');
  });
}

test('failed status response does not overwrite cached state', async () => {
  const h = harness();
  h.app.globalData.ticketList = [{ id: '41', repair_status: 'UserConfirming' }];
  const result = h.api.setTicketStatus(41, 'TechConfirming');
  success(h.requests[0], { success: false, repair_status: 'Done' }, 403);
  assert.equal(await result, 500);
  assert.equal(h.app.globalData.ticketList[0].repair_status, 'UserConfirming');
});

function mountTicketDetail(h) {
  const pagePath = process.env.FOC_TICKET_DETAIL_FILE ||
    path.resolve(path.dirname(reqPath), '../pages/homePage/ticketDetail/index.js');
  const pageSource = fs.readFileSync(pagePath, 'utf8')
    .replace(/^import[\s\S]*?;\s*/gm, '');
  let definition;
  h.toasts = [];
  h.timers = [];
  h.loadingCount = 0;
  Object.assign(h.wx, {
    showLoading() { h.loadingCount += 1; },
    hideLoading() { h.loadingCount -= 1; },
    requestSubscribeMessage() {}, showToast() {},
    navigateBack() {},
  });
  vm.runInNewContext(pageSource, {
    getApp: () => h.app, Page: page => { definition = page; },
    ...h.api, wx: h.wx, Toast: message => h.toasts.push(message), Dialog: { confirm: () => Promise.resolve() },
    console: { log() {}, error() {} }, setTimeout: callback => h.timers.push(callback),
  }, { filename: pagePath });
  const page = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(values) {
      for (const [key, value] of Object.entries(values)) {
        const fields = key.replace(/\[(\d+)\]/g, '.$1').split('.');
        let target = this.data;
        for (const field of fields.slice(0, -1)) target = target[field];
        target[fields.at(-1)] = value;
      }
    },
  };
  page.data.ticket = { id: 41, repair_status: 'UserConfirming' };
  page.data.role = 'user';
  return page;
}

for (const [label, fields, expected, step] of [
  ['top-level Done', { repair_status: 'Done' }, 'Done', 3],
  ['changedFields Done', { changedFields: { repair_status: 'Done' } }, 'Done', 3],
  ['legacy no state', {}, 'TechConfirming', 2],
]) {
  test('confirmation page renders backend final state: ' + label, async () => {
    const h = harness();
    h.app.globalData.ticketList = [{ id: '41', repair_status: 'UserConfirming' }];
    const page = mountTicketDetail(h);
    page.confirmTheTicket();
    await tick();
    assert.equal(h.requests[0].data.repair_status, 'TechConfirming');
    success(h.requests[0], { success: true, ...fields });
    await tick();
    assert.equal(page.data.ticket.repair_status, expected);
    assert.equal(page.data.active, step);
    assert.equal(h.app.globalData.ticketList[0].repair_status, expected);
  });
}

test('separate user transfer actions create different request IDs without mutating caller data', async () => {
  const h = harness();
  const data = { tid: 41, vcode: '12345' };
  const first = h.api.giveTicket(data);
  const second = h.api.giveTicket(data);
  const firstId = h.requests[0].data.request_id;
  const secondId = h.requests[1].data.request_id;
  assert.match(firstId, /^[A-Za-z0-9_-]{1,64}$/);
  assert.match(secondId, /^[A-Za-z0-9_-]{1,64}$/);
  assert.notEqual(firstId, secondId);
  assert.equal(data.request_id, undefined);
  h.requests.forEach(r => success(r));
  assert.deepEqual(await Promise.all([first, second]), [200, 200]);
});

test('transfer auth retry retains an explicit valid request ID', async () => {
  const h = harness();
  const data = { tid: 41, vcode: '12345', request_id: 'operation_123-ABC' };
  const result = h.api.giveTicket(data);
  assert.equal(h.requests[0].data.request_id, data.request_id);
  unauthorized(h.requests[0]);
  await finishLogin(h);
  assert.equal(h.requests[2].data.request_id, data.request_id);
  assert.deepEqual(JSON.parse(JSON.stringify(h.requests[2].data)), data);
  success(h.requests[2]);
  assert.equal(await result, 200);
});

test('invalid caller request IDs are replaced with valid operation IDs', async () => {
  for (const invalid of ['', 'bad request', 'x'.repeat(65), 42, null]) {
    const h = harness();
    const result = h.api.giveTicket({ tid: 41, vcode: '12345', request_id: invalid });
    assert.match(h.requests[0].data.request_id, /^[A-Za-z0-9_-]{1,64}$/);
    assert.notEqual(h.requests[0].data.request_id, invalid);
    success(h.requests[0]);
    assert.equal(await result, 200);
  }
});

test('late transfer conflict never replays the operation', async () => {
  const h = harness();
  const result = h.api.giveTicket({ tid: 41, vcode: '12345', request_id: 'old-operation' });
  success(h.requests[0], { success: false, message: 'Transfer request is no longer current' }, 409);
  assert.equal(await result, 500);
  assert.equal(h.requests.length, 1);
  assert.equal(h.logins.length, 0);
});

const detailTicket = (changes = {}) => ({
  id: 41, repair_status: 'Pending', qq_number: 'QQ|synthetic-user',
  complete_image_url: null, ...changes,
});
const detailSuccess = (req, ticket = detailTicket()) => success(req, {
  success: true, requesttype: 'by_workorder_id', data: [ticket], page: 1, limit: 20,
});

for (const id of [41, '41']) {
  test('detail GET matches JSON ID type ' + typeof id + ' without replacing other tickets', async () => {
    const h = harness();
    const other = detailTicket({ id: '42' });
    h.app.globalData.ticketList = [detailTicket({ id: '41' }), other];
    const result = h.api.getTicketDetail('41');
    const request = h.requests[0];
    assert.equal(request.method, 'GET');
    assert.equal(request.url, 'https://foc.example.test/v1/status/getTicket');
    assert.equal(request.data.orderid, '41');
    assert.equal(request.timeout, 20000);
    detailSuccess(request, detailTicket({ id, repair_status: 'Repairing' }));
    assert.equal((await result).ticket.repair_status, 'Repairing');
    assert.equal(h.app.globalData.ticketList.length, 2);
    assert.equal(h.app.globalData.ticketList[1], other);
  });
}

test('detail GET includes user context so refreshed technician contact is retained', async () => {
  const h = harness();
  h.app.globalData.userInfo = { uid: 21, role: 'user' };
  h.app.globalData.ticketList = [detailTicket({
    id: '41', assigned_technician_id: 'Cached Technician - 13000000000',
  })];
  const result = h.api.getTicketDetail(41);
  assert.equal(h.requests[0].data.orderid, '41');
  assert.equal(h.requests[0].data.uid, '21');
  assert.equal(h.requests[0].data.tid, undefined);
  detailSuccess(h.requests[0], detailTicket({
    id: '41', assigned_technician_id: 'Current Technician - 13100000000',
  }));
  assert.equal((await result).ticket.assigned_technician_id,
    'Current Technician - 13100000000');
  assert.equal(h.app.globalData.ticketList[0].assigned_technician_id,
    'Current Technician - 13100000000');
});

test('detail GET includes technician context without requesting user-only contact data', async () => {
  const h = harness();
  h.app.globalData.userInfo = { id: 22, role: 'technician' };
  const result = h.api.getTicketDetail(41);
  assert.equal(h.requests[0].data.orderid, '41');
  assert.equal(h.requests[0].data.tid, '22');
  assert.equal(h.requests[0].data.uid, undefined);
  detailSuccess(h.requests[0]);
  assert.equal((await result).code, 200);
});

test('detail GET retries one 401 and shares the login used by other operations', async () => {
  const h = harness();
  const read = h.api.getTicketDetail(41);
  const write = h.api.setTicketStatus(42, 'Canceled');
  unauthorized(h.requests[0]);
  unauthorized(h.requests[1]);
  assert.equal(h.logins.length, 1);
  await finishLogin(h);
  const retriedRead = h.requests.find(r => r.method === 'GET' && r.header.Authorization === 'Bearer fresh-token');
  const retriedWrite = h.requests.find(r => r.url.endsWith('/ticket/set') && r.header.Authorization === 'Bearer fresh-token');
  assert.ok(retriedRead);
  assert.equal(retriedRead.data.orderid, '41');
  assert.equal(retriedRead.data.tid, '21');
  assert.equal(retriedRead.data.uid, undefined);
  detailSuccess(retriedRead);
  success(retriedWrite);
  assert.equal((await read).code, 200);
  assert.equal(await write, 200);
  assert.equal(h.logins.length, 1);
});

test('detail GET stops at a second 401 and can recover on a later explicit refresh', async () => {
  const h = harness();
  const first = h.api.getTicketDetail(41);
  unauthorized(h.requests[0]);
  await finishLogin(h);
  unauthorized(h.requests[2]);
  assert.equal((await first).code, 401);
  assert.equal(h.requests.length, 3);
  assert.equal(h.logins.length, 1);
  const next = h.api.getTicketDetail(41);
  detailSuccess(h.requests[3]);
  assert.equal((await next).code, 200);
});

test('detail GET respects disabled auth retry and failed login settles', async () => {
  const noRetry = harness();
  const disabled = noRetry.api.getTicketDetail(41, false);
  unauthorized(noRetry.requests[0]);
  assert.equal((await disabled).code, 401);
  assert.equal(noRetry.logins.length, 0);
  const failedLogin = harness();
  const failed = failedLogin.api.getTicketDetail(41);
  unauthorized(failedLogin.requests[0]);
  failedLogin.logins[0].fail({ errMsg: 'login:fail' });
  assert.equal((await failed).code, 401);
  assert.equal(failedLogin.requests.length, 1);
});

test('detail GET handles late 401 with an already refreshed token', async () => {
  const h = harness();
  const read = h.api.getTicketDetail(41);
  h.app.globalData.accessToken = 'newer-token';
  unauthorized(h.requests[0]);
  await tick();
  assert.equal(h.logins.length, 0);
  assert.equal(h.requests[1].header.Authorization, 'Bearer newer-token');
  detailSuccess(h.requests[1]);
  assert.equal((await read).code, 200);
});

for (const [label, reply, expected] of [
  ['HTTP404', req => success(req, { success: false }, 404), 404],
  ['HTTP403', req => success(req, { success: false }, 403), 403],
  ['empty', req => success(req, { success: true, data: [] }), 404],
  ['wrong ticket', req => detailSuccess(req, detailTicket({ id: 42 })), 404],
  ['network timeout', req => req.fail({ errMsg: 'request:fail timeout' }), 500],
  ['invalid JSON', req => success(req, '<html>error</html>'), 500],
  ['false success', req => success(req, { success: true, data: [detailTicket()] }, 500), 500],
]) {
  test('detail GET settles without damaging cached list: ' + label, async () => {
    const h = harness();
    const cached = [detailTicket()];
    h.app.globalData.ticketList = cached;
    const result = h.api.getTicketDetail(41);
    reply(h.requests[0]);
    assert.equal((await result).code, expected);
    assert.equal((await result).ticket, null);
    assert.equal(h.app.globalData.ticketList, cached);
    assert.equal(h.requests.length, 1);
  });
}

test('detail GET handles missing ID and synchronous native transport failure', async () => {
  const h = harness();
  assert.equal((await h.api.getTicketDetail(undefined)).code, 404);
  assert.equal(h.requests.length, 0);
  h.wx.request = () => { throw new Error('native unavailable'); };
  assert.equal((await h.api.getTicketDetail(41)).code, 500);
});

for (const id of [41, '41']) {
  test('detail page loads cached ' + typeof id + ' ID and refreshes Pending to Repairing once', async () => {
    const h = harness();
    h.app.globalData.userInfo = { uid: 21, role: 'user' };
    h.app.globalData.ticketList = [detailTicket({ id })];
    const page = mountTicketDetail(h);
    page.onLoad({ id: '41', role: 'technician' });
    assert.equal(page.data.ticket.id, id);
    assert.equal(page.data.role, 'user', 'session role takes precedence over route hint');
    assert.equal(page.data.active, 0);
    assert.equal(h.requests.length, 0, 'onLoad displays cache only');
    const shown = page.onShow();
    assert.equal(page.onShow(), shown, 'overlapping shows share one read');
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].data.uid, '21');
    assert.equal(h.requests[0].data.tid, undefined);
    page.cancelTheTicket();
    await tick();
    assert.equal(h.requests.length, 1, 'mutation waits for authoritative refresh');
    detailSuccess(h.requests[0], detailTicket({ id, repair_status: 'Repairing',
      qq_number: '微信|new-contact', complete_image_url: 'https://example.test/done.png' }));
    assert.equal(await shown, 200);
    assert.equal(page.data.active, 1);
    assert.equal(page.data.needCompleteImage, false);
    assert.equal(page.data.contactValue, '微信');
    assert.equal(page.data.contactNumber, 'new-contact');
    assert.equal(page.data.detailsRefreshing, false);
    assert.equal(page.data.detailUnavailable, false);
  });
}

test('detail page cache miss and absent contact do not crash or allow premature writes', async () => {
  const h = harness();
  h.app.globalData.ticketList = undefined;
  const page = mountTicketDetail(h);
  page.data.ticket = null;
  page.onLoad({ id: '41', role: 'user' });
  assert.equal(page.data.ticket, null);
  page.cancelTheTicket();
  page.confirmTheTicket();
  page.completeTheTicket();
  page.completeImage();
  page.closeTheTicket();
  assert.equal(h.requests.length, 0);
  assert.equal(page.onShareAppMessage().path, '/pages/homePage/index');
  const shown = page.onShow();
  detailSuccess(h.requests[0], detailTicket({ qq_number: null, repair_status: 'Repairing' }));
  assert.equal(await shown, 200);
  assert.equal(page.data.active, 1);
  assert.equal(page.data.contactNumber, '');
});

test('detail page cancellation sends the right ID and synchronizes final state to cache', async () => {
  const h = harness();
  h.app.globalData.ticketList = [detailTicket({ repair_status: 'Repairing' })];
  const page = mountTicketDetail(h);
  page.onLoad({ id: '41', role: 'user' });
  page.cancelTheTicket();
  await tick();
  assert.equal(h.requests[0].data.tid, 41);
  assert.equal(h.requests[0].data.repair_status, 'Canceled');
  page.cancelTheTicket();
  await tick();
  assert.equal(h.requests.length, 1, 'repeat taps do not race the same mutation');
  success(h.requests[0], { success: true, repair_status: 'Canceled' });
  await tick();
  assert.equal(page.data.active, 3);
  assert.equal(page.data.activeColor, '#ff0000');
  assert.equal(page.data.ticket.repair_status, 'Canceled');
  assert.equal(h.app.globalData.ticketList[0].repair_status, 'Canceled');
  assert.equal(page._mutationPending, false);
});

for (const [label, reply, expected] of [
  ['404', req => success(req, { success: false }, 404), 404],
  ['network failure', req => req.fail({ errMsg: 'request:fail timeout' }), 500],
]) {
  test('detail page remains recoverable after ' + label, async () => {
    const h = harness();
    h.app.globalData.ticketList = [detailTicket()];
    const page = mountTicketDetail(h);
    page.onLoad({ id: '41', role: 'user' });
    const first = page.onShow();
    reply(h.requests[0]);
    assert.equal(await first, expected);
    assert.equal(page.data.detailsRefreshing, false);
    assert.equal(page.data.detailUnavailable, true);
    page.cancelTheTicket();
    await tick();
    assert.equal(h.requests.length, 1);
    const recovered = page.onShow();
    detailSuccess(h.requests[1], detailTicket({ repair_status: 'Repairing' }));
    assert.equal(await recovered, 200);
    assert.equal(page.data.detailUnavailable, false);
    assert.equal(page.data.active, 1);
  });
}

test('detail page recovers after 401 login failure on next show', async () => {
  const h = harness();
  const page = mountTicketDetail(h);
  page.data.ticket = null;
  page.onLoad({ id: '41', role: 'user' });
  const first = page.onShow();
  unauthorized(h.requests[0]);
  h.logins[0].fail({ errMsg: 'login:fail' });
  assert.equal(await first, 401);
  assert.equal(page.data.detailsRefreshing, false);
  assert.equal(page.data.detailUnavailable, true);
  const retry = page.onShow();
  detailSuccess(h.requests[1], detailTicket({ repair_status: 'Repairing' }));
  assert.equal(await retry, 200);
  assert.equal(page.data.active, 1);
});

test('detail refresh resets old terminal and confirmation step decorations', () => {
  const h = harness();
  const page = mountTicketDetail(h);
  page.applyTicket(detailTicket({ repair_status: 'Canceled' }));
  assert.equal(page.data.steps[3].activeIcon, 'close');
  page.applyTicket(detailTicket({ repair_status: 'UserConfirming' }));
  assert.equal(page.data.steps[2].text, '技术员确认');
  page.applyTicket(detailTicket({ repair_status: 'Repairing' }));
  assert.equal(page.data.active, 1);
  assert.equal(page.data.activeColor, '#38f');
  assert.equal(page.data.steps[2].text, '维修完成');
  assert.equal(page.data.steps[3].activeIcon, undefined);
});

test('returning from media picker does not refresh over an in-flight image update', async () => {
  const h = harness();
  h.app.globalData.ticketList = [detailTicket({ repair_status: 'Repairing' })];
  const page = mountTicketDetail(h);
  page.onLoad({ id: '41', role: 'technician' });
  let picker, upload;
  h.wx.chooseMedia = options => { picker = options; };
  h.wx.uploadFile = options => { upload = options; };
  page.completeImage();
  await page.onShow();
  assert.equal(h.requests.length, 0);
  picker.success({ tempFiles: [{ tempFilePath: '/synthetic/photo.jpg', size: 1024 }] });
  await page.onShow();
  assert.equal(h.requests.length, 0);
  assert.equal(upload.timeout, 20000);
  upload.success({ statusCode: 200, data: JSON.stringify({ success: true, rawdata: 'https://example.test/photo.jpg' }) });
  await tick();
  assert.equal(h.requests[0].data.complete_image_url, 'https://example.test/photo.jpg');
  success(h.requests[0]);
  await tick();
  assert.equal(page.data.needCompleteImage, false);
  assert.equal(page.data.ticket.complete_image_url, 'https://example.test/photo.jpg');
  assert.equal(h.app.globalData.ticketList[0].complete_image_url, 'https://example.test/photo.jpg');
  assert.equal(page._mutationPending, false);
  assert.equal(h.loadingCount, 0);
});

test('cancelled media picker allows the next detail refresh', async () => {
  const h = harness();
  const page = mountTicketDetail(h);
  page.onLoad({ id: '41', role: 'technician' });
  let picker;
  h.wx.chooseMedia = options => { picker = options; };
  page.completeImage();
  picker.fail({ errMsg: 'chooseMedia:fail cancel' });
  const refreshed = page.onShow();
  detailSuccess(h.requests[0]);
  assert.equal(await refreshed, 200);
});

for (const [mode, failUpload] of [
  ['network', upload => upload.fail({ errMsg: 'uploadFile:fail' })],
  ['malformed JSON', upload => upload.success({ statusCode: 200, data: '<invalid>' })],
  ['PHP warning prefix', upload => upload.success({ statusCode: 200,
    data: 'Deprecated: Qiniu warning\n' + JSON.stringify({ success: true, rawdata: 'orphan' }) })],
  ['missing rawdata', upload => upload.success({ statusCode: 200,
    data: JSON.stringify({ success: true, data: 'signed-only' }) })],
  ['non-2xx', upload => upload.success({ statusCode: 503,
    data: JSON.stringify({ success: true, rawdata: 'not-accepted' }) })],
]) {
  test('failed completion image upload releases page mutation state: ' + mode, async () => {
    const h = harness();
    const page = mountTicketDetail(h);
    page.onLoad({ id: '41', role: 'technician' });
    let picker, upload;
    h.wx.chooseMedia = options => { picker = options; };
    h.wx.uploadFile = options => { upload = options; };
    page.completeImage();
    picker.success({ tempFiles: [{ tempFilePath: '/synthetic/photo.jpg', size: 1024 }] });
    await tick();
    failUpload(upload);
    await tick();
    assert.equal(page._mutationPending, false);
    assert.equal(page.data.needCompleteImage, true);
    assert.equal(page.data.showDialog, true);
    assert.equal(h.loadingCount, 0);
    assert.equal(h.requests.length, 0);
    assert.ok(h.toasts.includes('上传图片失败，请重试'));
  });
}

test('oversized completion evidence is compressed and size-checked before upload', async () => {
  const h = harness();
  h.app.globalData.ticketList = [detailTicket({ repair_status: 'Repairing' })];
  const page = mountTicketDetail(h);
  page.onLoad({ id: '41', role: 'technician' });
  let picker, compression, stat, upload;
  h.wx.chooseMedia = options => { picker = options; };
  h.wx.compressImage = options => { compression = options; };
  h.wx.getFileSystemManager = () => ({ stat: options => { stat = options; } });
  h.wx.uploadFile = options => { upload = options; };
  page.completeImage();
  assert.deepEqual(Array.from(picker.sizeType), ['compressed']);
  picker.success({ tempFiles: [{ tempFilePath: '/synthetic/large.jpg', size: 3 * 1024 * 1024 }] });
  await tick();
  assert.equal(compression.src, '/synthetic/large.jpg');
  assert.equal(compression.quality, 75);
  compression.success({ tempFilePath: '/synthetic/compressed.jpg' });
  await tick();
  stat.success({ stats: { size: 1024 * 1024 } });
  await tick();
  assert.equal(upload.filePath, '/synthetic/compressed.jpg');
  uploadSuccess(upload, { success: true, rawdata: 'https://example.test/compressed.jpg' });
  await tick();
  success(h.requests[0]);
  await tick();
  assert.equal(page.data.needCompleteImage, false);
  assert.equal(page.data.ticket.complete_image_url, 'https://example.test/compressed.jpg');
  assert.equal(page._mutationPending, false);
  assert.equal(h.loadingCount, 0);
});

test('completion evidence compression failure is visible and releases page state', async () => {
  const h = harness();
  h.app.globalData.ticketList = [detailTicket({ repair_status: 'Repairing' })];
  const page = mountTicketDetail(h);
  page.onLoad({ id: '41', role: 'technician' });
  let picker;
  h.wx.chooseMedia = options => { picker = options; };
  h.wx.compressImage = options => options.fail({ errMsg: 'compressImage:fail' });
  h.wx.uploadFile = () => assert.fail('oversized image must not upload after compression failure');
  page.completeImage();
  picker.success({ tempFiles: [{ tempFilePath: '/synthetic/large.jpg', size: 3 * 1024 * 1024 }] });
  await tick();
  await tick();
  assert.equal(page._mutationPending, false);
  assert.equal(page.data.needCompleteImage, true);
  assert.equal(page.data.showDialog, true);
  assert.equal(h.loadingCount, 0);
  assert.ok(h.toasts.includes('图片处理失败，请换一张图片重试'));
});
