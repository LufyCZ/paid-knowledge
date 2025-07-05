import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

interface IRequestPayload {
    address: string;
}

export async function POST(req: NextRequest) {
    try {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL as string,
            token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
        })
        const { address } = (await req.json()) as IRequestPayload;
        await redis.set(address, "true");
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to enable notifications" },
            { status: 500 }
        );
    }
}
