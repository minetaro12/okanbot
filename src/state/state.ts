import type { TextChannel } from "discord.js";
import { client } from "../main.ts";
import { createEmbed } from "../lib/createEmbed.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

export const GuildStates = new Map<string, State>();

export class State {
  voiceChannelId: string;
  notifyChannelId: string;
  guildId: string;
  timer: NodeJS.Timeout | null;
  disconnectTime: string | null;

  constructor(voiceChannelId: string, notifyChannelId: string, guildId: string) {
    this.voiceChannelId = voiceChannelId;
    this.notifyChannelId = notifyChannelId;
    this.guildId = guildId;
    this.timer = null;
    this.disconnectTime = null;
  }

  setTimer(delay: number, disconnectTime: string) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      this.disconnectTime = null;
    }

    this.timer = setTimeout(() => {
      this.disconnectAll();
    }, delay);
    this.disconnectTime = disconnectTime;
  }

  async disconnectAll() {
    const notifyChannel = await client.channels.fetch(this.notifyChannelId) as TextChannel;
    notifyChannel.send({
      embeds: [
        createEmbed({
          title: "指定された時間になったため、ボイスチャンネルから切断されました。",
          color: "info",
          ...DEFAULT_MESSAGE_OPTIONS
        })
      ]
    });

    const channel = await client.channels.fetch(this.voiceChannelId);
    if (channel && channel.isVoiceBased()) {
      channel.members.forEach(member => {
        if (!member.user.bot) {
          member.voice.disconnect("指定された時間になったため、ボイスチャンネルから切断されました");
        }
      });
    }

    // 切断後stateを削除
    if (this.timer) {
      GuildStates.delete(this.guildId);
    }
  }
}
