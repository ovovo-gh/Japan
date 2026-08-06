import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop() ?? "Japan";
const githubBasePath = process.env.GITHUB_PAGES_BASE_PATH ?? `/${repositoryName}`;
const githubAssetPrefix = process.env.GITHUB_PAGES_ASSET_PREFIX ?? githubBasePath;

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: githubBasePath,
        assetPrefix: githubAssetPrefix ? `${githubAssetPrefix.replace(/\/$/, "")}/` : undefined,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
