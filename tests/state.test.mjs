import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { GuildStates, State } from "../src/state/state.ts";

function setup(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const disconnected = [];
  const members = new Map(["individual", "other", "bot"].map(id => [id, {
    id,
    user: { bot: id === "bot" },
    voice: { disconnect: async () => { disconnected.push(id); } }
  }]));
  const notifications = [];
  const client = { channels: { fetch: async id => id === "voice"
    ? { isVoiceBased: () => true, members }
    : { send: async message => { notifications.push(message); } }
  } };
  const state = new State("guild", client);
  GuildStates.set("guild", state);
  t.after(() => GuildStates.clear());
  const advance = async delay => {
    t.mock.timers.tick(delay);
    await setImmediate();
  };
  return { state, disconnected, members, notifications, advance };
}

for (const individualFirst of [true, false]) {
  for (const individualEarlier of [true, false]) {
    test(`individual overrides global: set first=${individualFirst}, fires earlier=${individualEarlier}`, async t => {
      const { state, disconnected, advance } = setup(t);
      const global = () => state.setTimer(individualEarlier ? 20 : 10, "23:30", "voice", "text");
      const individual = () => state.setTimer(individualEarlier ? 10 : 20, "01:00", "voice", "text", "individual");
      if (individualFirst) { individual(); global(); } else { global(); individual(); }

      await advance(10);
      assert.deepEqual(disconnected, [individualEarlier ? "individual" : "other"]);
      assert.equal(GuildStates.get("guild"), state);
      await advance(10);
      assert.deepEqual(disconnected, individualEarlier ? ["individual", "other"] : ["other", "individual"]);
      assert.equal(GuildStates.has("guild"), false);
    });
  }
}

test("updating global leaves individual timer intact and cancels old global timer", async t => {
  const { state, disconnected, advance } = setup(t);
  state.setTimer(10, "23:00", "voice", "text");
  state.setTimer(20, "23:30", "voice", "text", "individual");
  state.setTimer(30, "00:00", "voice", "text");
  await advance(10);
  assert.deepEqual(disconnected, []);
  await advance(10);
  assert.deepEqual(disconnected, ["individual"]);
  await advance(10);
  assert.deepEqual(disconnected, ["individual", "other"]);
  assert.equal(GuildStates.has("guild"), false);
});

test("updating individual replaces only that user's timer", async t => {
  const { state, disconnected, advance } = setup(t);
  state.setTimer(20, "23:30", "voice", "text");
  state.setTimer(10, "23:00", "voice", "text", "individual");
  state.setTimer(30, "00:00", "voice", "text", "individual");
  await advance(10);
  assert.deepEqual(disconnected, []);
  await advance(10);
  assert.deepEqual(disconnected, ["other"]);
  await advance(10);
  assert.deepEqual(disconnected, ["other", "individual"]);
});

test("individual-only timer excludes bots and users who left the configured VC", async t => {
  const { state, disconnected, members, advance } = setup(t);
  state.setTimer(10, "23:00", "voice", "text", "individual");
  members.delete("individual");
  await advance(10);
  assert.deepEqual(disconnected, []);
  assert.equal(GuildStates.has("guild"), false);
});

test("global-only timer disconnects all humans and cleans up state", async t => {
  const { state, disconnected, advance } = setup(t);
  state.setTimer(10, "23:00", "voice", "text");
  await advance(10);
  assert.deepEqual(disconnected, ["individual", "other"]);
  assert.equal(GuildStates.has("guild"), false);
});
