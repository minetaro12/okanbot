import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import parse from "yargs-parser";
import { createEmbed } from "../lib/createEmbed.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";
import { GuildStates, State } from "../state/state.ts";

export const sleepHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  const voiceChannel = message.member?.voice.channel;

  if (!voiceChannel) {
    message.reply({
      embeds: [
        createEmbed({
          title: "VCに接続してからコマンドを実行してください",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  if (!message.guildId) return;

  const timeInput = parse(message.content)._[1]?.toString();

  if (!timeInput) {
    message.reply({
      embeds: [
        createEmbed({
          title: "時間を指定してください",
          description: "例: `!sleep 23:30`",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  // 入力フォーマットのバリデーション (HH:MM 形式かチェック)
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeInput)) {
    message.reply({
      embeds: [
        createEmbed({
          title: "時間のフォーマットが正しくありません",
          description: "例: `!sleep 23:30`",
          color: "error"
        })
      ],
      ...DEFAULT_MESSAGE_OPTIONS
    });
    return;
  }

  const [hours, minutes] = timeInput.split(":").map(Number);

  // 現在時刻と目標時刻の計算
  const now = new Date();
  const target = new Date();
  target.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  // もし指定された時間がすでに過ぎている場合、翌日のその時間に設定する
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  // 実行までの残り時間をミリ秒で計算
  const delay = target.getTime() - now.getTime();

  // Statesからギルドの状態を取得、なければ新規作成
  const state = GuildStates.get(message.guildId);
  if (state) {
    state.setTimer(delay, timeInput);
  } else {
    const newState = new State(voiceChannel.id, message.channelId, message.guildId);
    newState.setTimer(delay, timeInput);
    GuildStates.set(message.guildId, newState);
  }

  message.reply({
    embeds: [
      createEmbed({
        title: `ボイスチャンネルからの切断を ${timeInput} に設定しました`,
        color: "success"
      })
    ],
    ...DEFAULT_MESSAGE_OPTIONS
  });
};
