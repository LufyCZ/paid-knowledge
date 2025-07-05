import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD%2CUSDCE&fiatCurrencies=USD",
      {
        method: "GET",
      }
    );

    const json = await res.json();

    const prices = {
      WLD:
        parseFloat(json.result.prices.WLD.USD.amount) /
        10 ** json.result.prices.WLD.USD.decimals,
      USDCE:
        parseFloat(json.result.prices.USDCE.USD.amount) /
        10 ** json.result.prices.USDCE.USD.decimals,
    };

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
