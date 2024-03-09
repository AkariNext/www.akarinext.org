import { LoaderFunctionArgs, json } from "@remix-run/node";
import { ServiceCard } from "../components/ServiceCard";
import { SERVICES } from "~/lib/services.server";
import { useLoaderData } from "@remix-run/react";

export async function loader(_: LoaderFunctionArgs) {
    return json({ services: SERVICES });
}

export default function Services() {
    const { services } = useLoaderData<typeof loader>()
    return (
        <div>

            <div className="text-2xl mb-8 text-center">AkariNextが運営するサービス</div>
            <div className="flex flex-wrap justify-center  gap-x-8">
                {services.map((service, index) => (
                    <div key={index} className="mb-8">
                        <ServiceCard {...service} />
                    </div>
                ))}
            </div>
        </div>
    )
}