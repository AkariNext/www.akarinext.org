import * as cheerio from 'cheerio';
import { fetchOgp } from './ogp';

/**
 * 記事コンテンツの処理ユーティリティ
 * - 外部リンクに target="_blank" rel="noopener noreferrer" を付与
 * - 外部リンクが単独の段落にある場合、OGPを取得してリンクカード表示にする
 */
export async function processContentHtml(content: string | null | undefined): Promise<string> {
    if (!content) return "";

    const html = content;

    // リンクが含まれていない場合はそのまま返す（パフォーマンス最適化）
    if (!html.includes('<a ')) return html;

    // HTMLパース (デフォルトモードでロードし、後でbodyの中身を取り出す)
    const $ = cheerio.load(html);

    const anchors = $('a').toArray();

    const promises = anchors.map(async (el: any) => {
        const $el = $(el);
        const href = $el.attr('href');

        // 内部リンクまたは無効なリンクはスキップ
        if (!href || !href.startsWith('http')) return;

        // 外部リンク属性の付与
        $el.attr('target', '_blank');
        $el.attr('rel', 'noopener noreferrer');
        $el.addClass('external-link');

        // 単独のリンクかどうか判定（親がpタグで、実質的な中身がこのaタグのみ）
        const parent = $el.parent();

        // 親がpタグでない場合はスキップ
        if (!parent.is('p')) return;

        // テキストノード（空白含む）を除外して要素数をチェック、かつテキスト全体がリンクテキストと一致するか確認
        const parentText = parent.text().trim();
        const anchorText = $el.text().trim();

        const hasOtherElements = parent.children().not($el).length > 0;

        const isStandalone = !hasOtherElements && parentText === anchorText;

        if (isStandalone) {
            try {
                const data = await fetchOgp(href);

                if (data && (data.ogTitle || data.ogDescription)) {
                    const title = data.ogTitle || data.twitterTitle || href;
                    const desc = data.ogDescription || data.twitterDescription || '';
                    const image = data.ogImage?.[0]?.url || data.twitterImage?.[0]?.url || '';
                    const siteName = data.ogSiteName || new URL(href).hostname;

                    const cardHtml = `
                <a href="${href}" target="_blank" rel="noopener noreferrer" class="link-card-rich">
                    <div class="link-card-text">
                        <div class="link-card-meta">
                            ${image ? `<img src="${image}" alt="" class="link-card-favicon" />` : ''}
                            <span>${siteName}</span>
                        </div>
                        <div class="link-card-title">${title}</div>
                        ${desc ? `<div class="link-card-desc">${desc}</div>` : ''}
                    </div>
                    ${image ? `<div class="link-card-image" style="background-image: url('${image}')"></div>` : ''}
                </a>`;

                    // 親のpタグごと置換
                    parent.replaceWith(cardHtml);
                }
            } catch (e) {
                console.error(`Failed to fetch OGP for ${href}:`, e);
            }
        }
    });

    await Promise.all(promises);

    return $('body').html() || "";
}
