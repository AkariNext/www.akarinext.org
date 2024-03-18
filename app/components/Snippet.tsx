import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "./ui/button";
import EasyTooltip from "./Tooltip";
import { useState } from "react";
import { useDebounceFn } from "@reactuses/core";

interface SnippetProps {
    children: string;
}

export function Snippet({ children }: SnippetProps) {
    const [isCopied, setIsCopied] = useState(false)
    const { run: copyToClipboard } = useDebounceFn(() => {
        navigator.clipboard.writeText(children)
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false)
        }, 2000)
    }, 200);

    return (
        <div className='py-1 px-2 flex justify-center items-center before:content-["&#36;"] before:text-slate-700 text-blue-500 pl-2 border gap-3 w-fit rounded-md'>
            {children}
            <Button size="icon" variant={"ghost"} className={`p-1 h-7 w-7 text-slate-700 hover:bg-slate-200 active:scale-90 ${isCopied ? 'bg-slate-200' : null}`}>
                <EasyTooltip tooltip="Copy">
                    {isCopied === false ? <IconCopy onClick={copyToClipboard} /> : <IconCheck />}
                </EasyTooltip>
            </Button>
        </div>
    )
}