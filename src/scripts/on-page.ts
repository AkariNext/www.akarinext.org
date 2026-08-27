/**
 * ページを開くたびに初期化を走らせる。
 *
 * このサイトは ClientRouter（View Transitions）を使っているため、
 * `<script>` はセッション中に一度しか評価されない。
 * 一覧に戻ってから同じページを開き直すと DOM は新しくなるのに初期化は再実行されず、
 * ボタンや入力欄にイベントが付かないままになる（#429 がこれ）。
 *
 * setup は初回と遷移のたびに呼ばれるので、二重登録しないよう冪等に書くこと。
 * 要素側に `data-bound` を立てて判定するのが簡単。
 */
export function onEachPage(setup: () => void): void {
	setup();
	document.addEventListener("astro:page-load", setup);
}
