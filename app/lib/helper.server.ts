import { Magika } from "magika";
import * as mime from "mime-types"
import { fileTypeFromBuffer } from "file-type"

export type PickType<T, K extends keyof T> = T[K];


export async function convertToBuffer(unit8Array: AsyncIterable<Uint8Array>) {
    const chunks = [];
    for await (const chunk of unit8Array) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}


export async function getMIMEType(data: Buffer) {
    const magika = new Magika();
    await magika.load();

    const prediction = await magika.identifyBytes(data);

    if (prediction.label === "empty") {  // 空のファイルは例外を投げる
        throw new Error("No prediction");
    }

    const result = mime.lookup(prediction.label);

    if (result === false) {  // MIMEタイプが見つからない場合はfile-typeで判定
        const fileType = await fileTypeFromBuffer(data);
        if (fileType) {
            return fileType.mime;
        }

        throw new Error("No MIME type found");
    }

    return result
}
