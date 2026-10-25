import type { Message, OmitPartialGroupDMChannel } from "discord.js";
import { GuildStates } from "../state/state.ts";
import { createEmbed } from "../lib/createEmbed.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const statusHandler = (message: OmitPartialGroupDMChannel<Message<boolean>>) => {
  if (!message.guildId) return;

  const state = GuildStates.get(message.guildId);

  if (!state) {
    message.reply({
      embeds: [createEmbed({
        title: "VC切断時間は設定されていません",
        description: "まずは `!sleep` コマンドでタイマーを設定してください",
        color: "info",
        ...DEFAULT_MESSAGE_OPTIONS
      })]
    });
  } else {
    message.reply({
      embeds: [createEmbed({
        title: "VC切断時間が設定されています",
        description: [
          state.globalSchedule
            ? `全員用: ${state.globalSchedule.disconnectTime}（<#${state.globalSchedule.voiceChannelId}>）`
            : "全員用: 未設定",
          ...[...state.userSchedules].map(([userId, schedule]) =>
            `個別: <@${userId}> ${schedule.disconnectTime}（<#${schedule.voiceChannelId}>）${schedule.timer ? "" : "（実行済み・全員用から除外）"}`
          ),
          "個別設定は全員用の設定より優先されます。"
        ].join("\n"),
        color: "info",
        ...DEFAULT_MESSAGE_OPTIONS
      })]
    });
  }
};
