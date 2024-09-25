import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

import { useState } from "react";

export async function loader() {
    return json({

    });
}


export default function EditArticle() {
    const data = useLoaderData<typeof loader>();

        const [text, setText] = useState('');
      
        const handlePaste = async (event) => {
          const items = event.clipboardData.items;
          for (let item of items) {
            if (item.kind === 'file') {
              const file = item.getAsFile();
              const url = await uploadFile(file);
              setText((prevText) => `${prevText}\n${url}`);
            }
          }
        };
      
        const uploadFile = async (file) => {
          const formData = new FormData();
          formData.append('file', file);
      
          const response = await fetch('YOUR_UPLOAD_ENDPOINT', {
            method: 'POST',
            body: formData,
          });
      
          const data = await response.json();
          return data.url; // サーバーから返されるURL
        };

        return (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            rows={10}
            cols={50}
          />
        );
}