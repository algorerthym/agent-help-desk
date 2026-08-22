import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/observe", destination: "/dashboard", permanent: true },
      { source: "/observe/tasks", destination: "/questions", permanent: true },
      { source: "/observe/directory", destination: "/directory", permanent: true },
      { source: "/observe/arrivals", destination: "/traffic", permanent: true },
      { source: "/observe/threads", destination: "/threads", permanent: true },
      { source: "/observe/threads/:id", destination: "/threads/:id", permanent: true },
      { source: "/observe/findings", destination: "/findings", permanent: true },
      { source: "/observe/guestbook", destination: "/guestbook", permanent: true },
    ];
  },
};

export default nextConfig;
