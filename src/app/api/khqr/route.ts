import { NextRequest, NextResponse } from "next/server";
const { BakongKHQR, khqrData } = require("bakong-khqr");

export async function POST(request: NextRequest) {
  try {
    const { amount, orderId } = await request.json();

    // In a real app, you would load these from environment variables
    const bakongAccountId = process.env.BAKONG_ACCOUNT_ID || "sok.sao@acleda";
    const merchantName = process.env.BAKONG_MERCHANT_NAME || "Sok Sao Shop";
    const merchantCity = process.env.BAKONG_MERCHANT_CITY || "Phnom Penh";

    const optionalData = {
      currency: khqrData.currency.usd,
      amount: amount || 0,
      mobileNumber: "",
      storeLabel: merchantName,
      terminalLabel: "POS-01",
      purposeOfTransaction: orderId ? `Payment for order ${orderId}` : "POS Checkout",
      languageData: {
        languagePreference: "KM",
        merchantNameAlternateLanguage: merchantName,
        merchantCityAlternateLanguage: merchantCity,
      },
    };

    const individualInfo = new khqrData.IndividualInfo(
      bakongAccountId,
      merchantName,
      merchantCity,
      optionalData
    );

    const khqr = new BakongKHQR();
    const response = khqr.generateIndividual(individualInfo);

    if (response && response.data) {
      return NextResponse.json({ qrString: response.data.qr, amount, currency: "USD" });
    } else {
      return NextResponse.json({ error: "Failed to generate KHQR" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("KHQR Generation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate KHQR" }, { status: 500 });
  }
}
