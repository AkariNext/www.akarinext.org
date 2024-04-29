/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare module "*.mdx" {
    let MDXComponent: (props: any) => JSX.Element;  // eslint-disable-line @typescript-eslint/no-explicit-any
    export const frontmatter: any;  // eslint-disable-line @typescript-eslint/no-explicit-any
    export default MDXComponent;
  }
