import { NextResponse, type NextRequest } from "next/server";

const appHosts = new Set(["localhost", "127.0.0.1", "popwam.com", "www.popwam.com"]);

function getHost(request: NextRequest) {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

function getDomainKind(host: string) {
  if (!host) {
    return "unknown";
  }

  if (appHosts.has(host)) {
    return "main";
  }

  if (host.endsWith(".popwam.com")) {
    return "subdomain";
  }

  return "custom";
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const host = getHost(request);

  response.headers.set("x-popwam-domain-kind", getDomainKind(host));
  response.headers.set("x-popwam-domain-host", host);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
