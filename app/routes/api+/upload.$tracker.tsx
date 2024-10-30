import { ActionFunctionArgs, unstable_parseMultipartFormData } from "@remix-run/node";
import { authenticator } from "~/lib/auth.server";
import { uploadHandler } from "~/lib/s3.server";

export async function action({ request, params }: ActionFunctionArgs) {	
	if (request.method !== 'POST') {return new Response(null, { status: 405 });}
    
    const user = await authenticator.isAuthenticated(request, {
        failureRedirect: '/login',
	});
    
	const uploader = uploadHandler(user.id, ['image/jpeg', 'image/png']);
    const formData = await unstable_parseMultipartFormData(
        request,
		uploader.s3UploadHandler,
	);

	let urls = [];
	for (const [_, value] of formData.entries()) {
		urls.push(value);
	}

	return {urls, tacker: params.tracker};
}
