import ReactFlow, { Background, Controls, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface FlowProps {
	edges: Edge<any>[];
	nodes: Node<any, string | undefined>[] | undefined;
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
