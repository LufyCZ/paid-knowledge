import { BountyForm } from "@/lib/types";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

export const sendNewBountyNotification = async (
  address: string,
  form: BountyForm
) => {
  const addresses = await redis.get(address);
  if (!addresses) return;

  try {
    const response = await fetch(
      "https://developer.worldcoin.org/api/v2/minikit/send-notification",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WORLD_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: process.env.WORLD_APP_ID,
          wallet_addresses: [address],
          title: "New Bounty Available! 🎯",
          message: `A new bounty "${form.name}" is available with ${form.reward_per_question} ${form.reward_token} reward per question. Check it out!`,
          mini_app_path: `worldapp://mini-app?app_id=${process.env.WORLD_APP_ID}&path=/forms/${form.id}`,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to send notification:",
        response.status,
        response.statusText
      );
      return;
    }

    const result = await response.json();
    console.log("Notification sent successfully:", result);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
