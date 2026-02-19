import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'dev-secret-key';
const key = new TextEncoder().encode(secretKey);

export interface JWTPayload {
    userId: string;
    email: string;
    [key: string]: any;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}

export async function refreshToken(oldToken: string): Promise<string> {
    const payload = await verifyToken(oldToken);
    return signToken({ userId: payload.userId, email: payload.email });
}
