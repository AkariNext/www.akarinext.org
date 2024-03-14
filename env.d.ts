/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare module "*.mdx" {
    let MDXComponent: (props: any) => JSX.Element;
    export const frontmatter: any;
    export default MDXComponent;
  }

  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        POSTGRES_USER: string;
        POSTGRES_PASSWORD: string;
        POSTGRES_DB: string;
        POSTGRES_PORT: string;
      }
    }
  }

  export {}
