import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const originalName = file.name || "uploaded_file";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + originalName.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Ensure the uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
    console.error("Upload POST error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
