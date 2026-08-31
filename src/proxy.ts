import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");

  if (
    process.env.NODE_ENV === "production" &&
    forwardedProtocol &&
    forwardedProtocol !== "https"
  ) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https";
    return NextResponse.redirect(secureUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
