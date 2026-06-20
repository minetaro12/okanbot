import type { APIEmbed } from "discord.js";

export const createEmbed = ({
  title,
  description = "",
  thumbnail_url = "",
  color = "info"
}: {
  title: string;
  description?: string;
  thumbnail_url?: string;
  color?: "success" | "error" | "info";
}): APIEmbed => {
  const colors = {
    "success": 0x1DB954,
    "error": 0xE74C3C,
    "info": 0x3498DB,
  };

  return {
    title,
    description,
    thumbnail: {
      url: thumbnail_url
    },
    color: colors[color]
  };
};
