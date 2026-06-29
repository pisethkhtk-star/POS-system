import * as jose from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "default-secret-key-32-characters-minimum"
);

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "CASHIER";
  permissions: string[];
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  const jwt = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
