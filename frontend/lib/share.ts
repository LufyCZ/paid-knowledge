import { MiniKit } from "@worldcoin/minikit-js"
import { BountyForm } from "./supabase"

export const shareBounty = async (form: BountyForm) => {
    await MiniKit.commandsAsync.share({
        title: form.name,
        text: form.description as string,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/forms/${form.id}`,
    })
}