import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the trip planner shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /东京进，/);
  assert.doesNotMatch(html, /日本，<em>慢慢走/);
  assert.match(html, /两个人的 7 天 6 晚日本旅行/);
  assert.match(html, /东京站/);
  assert.match(html, /新增地点/);
  assert.match(html, /地图/);
  assert.match(html, /住宿节奏/);
  assert.match(html, /美食清单/);
  assert.match(html, /已收藏 \/ 打卡/);
  assert.match(html, /小时级攻略/);
  assert.match(html, /快速跳转/);
  assert.match(html, /京都 → 奈良/);
  assert.match(html, /南海难波 → 关西机场/);
  assert.match(html, /东京 3 晚 \+ 京都 2 晚 \+ 大阪 1 晚/);
  assert.match(html, /大阪城/);
  assert.match(html, /01:05 浦东/);
  assert.match(html, /19:30 KIX/);
  assert.match(html, /日本酒店为什么都是10:00退房/);
  assert.doesNotMatch(html, /关西取舍|攻略吸收|DAY BY DAY \/ 行程卡/);
  assert.match(html, /Esri World Street Map/);
  assert.match(html, /trip\/tokyo\.jpg/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
