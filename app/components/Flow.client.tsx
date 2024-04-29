import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowProps {
	edges: Edge<any>[];  // eslint-disable-line @typescript-eslint/no-explicit-any
	nodes: Node<any, string | undefined>[] | undefined;  // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function Flow({ nodes, edges }: FlowProps) {
	return (
		<div style={{ height: '300px' }}>
			<ReactFlow nodes={nodes} edges={edges}>
				<Background />
				<Controls />
			</ReactFlow>
		</div>
	);
}
