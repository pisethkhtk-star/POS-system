import { NextRequest } from "next/server";
import { verifyJWT, JWTPayload } from "./auth";

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}
