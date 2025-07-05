import { MiniKit } from "@worldcoin/minikit-js";

export const takePhotoHaptic = () =>
    MiniKit.commands.sendHapticFeedback({
        hapticsType: "notification",
        style: "success",
    });

export const buttonClickedHaptic = () =>
    MiniKit.commands.sendHapticFeedback({
        hapticsType: "impact",
        style: "light",
    });