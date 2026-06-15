const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isGithubActions && repo ? `/${repo}` : "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;
