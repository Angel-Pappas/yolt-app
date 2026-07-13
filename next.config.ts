import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1mb — the transaction importer (transactions/import/) uploads
    // an .xlsx file as a Server Action argument; the ~750-row historical file
    // this was built for is comfortably under this, but leaves real headroom
    // for it to grow without silently failing on a body-size limit.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
