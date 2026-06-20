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
        description: `次の切断時間が設定されています: ${state.disconnectTime}`,
        color: "info",
        ...DEFAULT_MESSAGE_OPTIONS
      })]
    });
  }
};
