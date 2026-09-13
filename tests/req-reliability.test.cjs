'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Only wx transport is mocked; the actual production candidate is evaluated unchanged
// except for its unrelated ES-module util import, which Node's CJS vm cannot parse.
const reqPath = process.env.FOC_REQ_FILE ||
  path.resolve(__dirname, '../../feiyang-maintenance-20260913/foc_fe/utils/req.js');
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
  Object.assign(h.wx, {
    showLoading() {}, hideLoading() {}, requestSubscribeMessage() {}, showToast() {},
  });
  vm.runInNewContext(pageSource, {
    getApp: () => h.app, Page: page => { definition = page; },
    ...h.api, wx: h.wx, Toast() {}, Dialog: { confirm: () => Promise.resolve() },
    console: { log() {}, error() {} }, setTimeout,
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
