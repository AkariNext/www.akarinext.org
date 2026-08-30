import preview from "../../.storybook/preview";
import Pagination from "./Pagination.astro";

const meta = preview.meta({
	title: "記事/Pagination",
	component: Pagination,
	args: { page: 2, totalPages: 5, basePath: "/posts" },
});

export default meta;

export const Middle = meta.story({});

/** 最初のページ。前へは出さない */
export const FirstPage = meta.story({ args: { page: 1 } });

/** 最後のページ。次へは出さない */
export const LastPage = meta.story({ args: { page: 5 } });

/** 1 ページしかないときは、そもそも出さない */
export const SinglePage = meta.story({ args: { page: 1, totalPages: 1 } });
