import type { Client, TextChannel } from "discord.js";
import { createEmbed } from "../lib/createEmbed.ts";
import { DEFAULT_MESSAGE_OPTIONS } from "../lib/messageOptions.ts";

type Schedule = {
  timer: NodeJS.Timeout | null;
  disconnectTime: string;
  voiceChannelId: string;
  notifyChannelId: string;
};

export const GuildStates = new Map<string, State>();

export class State {
  guildId: string;
  client: Client;
  globalSchedule: Schedule | null = null;
  userSchedules = new Map<string, Schedule>();

  constructor(guildId: string, client: Client) {
    this.guildId = guildId;
    this.client = client;
  }

  setTimer(delay: number, disconnectTime: string, voiceChannelId: string, notifyChannelId: string, userId?: string) {
    const previous = userId ? this.userSchedules.get(userId) : this.globalSchedule;
    if (previous?.timer) clearTimeout(previous.timer);

    const schedule: Schedule = { timer: null, disconnectTime, voiceChannelId, notifyChannelId };
    schedule.timer = setTimeout(() => {
      void this.disconnect(schedule, userId).catch(console.error);
    }, delay);

    if (userId) {
      this.userSchedules.set(userId, schedule);
    } else {
      this.globalSchedule = schedule;
    }
  }

  private async disconnect(schedule: Schedule, userId?: string) {
    try {
      const channel = await this.client.channels.fetch(schedule.voiceChannelId);
      if (channel && channel.isVoiceBased()) {
        const members = [...channel.members.values()].filter(member =>
          !member.user.bot && (userId ? member.id === userId : !this.userSchedules.has(member.id))
        );
        await Promise.all(members.map(member =>
          member.voice.disconnect("指定された時間になったため、ボイスチャンネルから切断されました")
        ));
      }

      const notifyChannel = await this.client.channels.fetch(schedule.notifyChannelId) as TextChannel;
      await notifyChannel.send({
        embeds: [createEmbed({
          title: userId ? "個別のVC切断時間になりました" : "全員用のVC切断時間になりました",
          description: userId ? `<@${userId}> の切断時間: ${schedule.disconnectTime}` : "個別設定のあるユーザーは切断対象から除外しました。",
          color: "info"
        })],
        ...DEFAULT_MESSAGE_OPTIONS
      });
    } finally {
      schedule.timer = null;
      if (userId) {
        // 個別タイマーが先に終了しても、全員用タイマーが終わるまでは優先設定を保持する。
        if (!this.globalSchedule && this.userSchedules.get(userId) === schedule) {
          this.userSchedules.delete(userId);
        }
      } else if (this.globalSchedule === schedule) {
        this.globalSchedule = null;
        for (const [id, individual] of this.userSchedules) {
          if (!individual.timer) this.userSchedules.delete(id);
        }
      }

      if (!this.globalSchedule && this.userSchedules.size === 0 && GuildStates.get(this.guildId) === this) {
        GuildStates.delete(this.guildId);
      }
    }
  }
}
