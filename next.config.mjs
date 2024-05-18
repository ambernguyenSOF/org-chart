import withTM from 'next-transpile-modules';

const withTMConfig = withTM(['d3-org-chart']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withTMConfig(nextConfig);
