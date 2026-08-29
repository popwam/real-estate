import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" },
      ],
    }];
  },
};

export default nextConfig;
