import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import fs from "fs";
import path from "path";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "store-settings.json");

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading settings file:", err);
  }
  return {
    storeName: "My POS System",
    storeAddress: "123 Main Street, Phnom Penh",
    storePhone: "012-345-678",
    taxRate: 10,
    receiptHeader: "Thank you for shopping with us!",
    receiptFooter: "Please come again!",
  };
}

function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing settings file:", err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  try {
    const { storeName, storeAddress, storePhone, taxRate, receiptHeader, receiptFooter } =
      await request.json();

    const currentSettings = readSettings();

    const newSettings = {
      storeName: storeName || currentSettings.storeName,
      storeAddress: storeAddress !== undefined ? storeAddress : currentSettings.storeAddress,
      storePhone: storePhone !== undefined ? storePhone : currentSettings.storePhone,
      taxRate: taxRate !== undefined ? parseFloat(taxRate) : currentSettings.taxRate,
      receiptHeader: receiptHeader !== undefined ? receiptHeader : currentSettings.receiptHeader,
      receiptFooter: receiptFooter !== undefined ? receiptFooter : currentSettings.receiptFooter,
    };

    const success = writeSettings(newSettings);
    if (!success) {
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 }
    );
  }
}
