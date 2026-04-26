import { getAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const auth = await getAuth();
    return auth.handler(request);
}

export async function POST(request: NextRequest) {
    const auth = await getAuth();
    return auth.handler(request);
}
