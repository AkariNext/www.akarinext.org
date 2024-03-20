import { Position } from "reactflow";
import { ClientOnly } from "remix-utils/client-only";
import { Flow } from "~/components/Flow.client";

export default function OrgIndex() {

    return (
        <div style={{ height: '100%' }}>
        <ClientOnly>
                {() => <Flow

                    edges={[
                        { id: '1-2', source: '1', target: '2' },
                        { id: '2-3', source: '2', target: '3', animated: true },
                        { id: '2-4', source: '2', target: '4', animated: true },
                    ]}
                    nodes={[
                        {
                            id: '1',
                            data: { label: 'Rikkalab' },
                            position: { x: 0, y: 0 },
                            type: 'input',
                            sourcePosition: Position.Right,
                            connectable: false,
                        },
                        {
                            id: '2',
                            data: { label: 'AkariNext' },
                            position: { x: 200, y: 0 },
                            targetPosition: Position.Left,
                            connectable: false,
                        },
                        {
                            id: '3',
                            data: { label: 'PimcServer' },
                            type: 'output',
                            position: { x: 200, y: 100 },
                            connectable: false,
                        },
                        {
                            id: '4',
                            data: { label: 'MinecraftGameNetwork' },
                            type: 'output',
                            position: { x: 400, y: 100 },
                            connectable: false,
                        }
                    ]}
                />}
            </ClientOnly>
        </div>
    )
}