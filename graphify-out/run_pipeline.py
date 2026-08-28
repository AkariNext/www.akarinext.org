import json
from pathlib import Path

from graphify.analyze import god_nodes, suggest_questions, surprising_connections
from graphify.build import build_from_json
from graphify.cache import save_semantic_cache
from graphify.cluster import cluster, score_all
from graphify.export import to_json
from graphify.report import generate

root = Path(".")
out = Path("graphify-out")
semantic_path = out / ".graphify_semantic.json"
semantic = json.loads(semantic_path.read_text(encoding="utf-8"))
assert isinstance(semantic.get("nodes"), list)
assert isinstance(semantic.get("edges"), list)

uncached = [
	line
	for line in (out / ".graphify_uncached.txt").read_text(encoding="utf-8").splitlines()
	if line
]
saved = save_semantic_cache(
	semantic.get("nodes", []),
	semantic.get("edges", []),
	semantic.get("hyperedges", []),
	root=root,
	allowed_source_files=uncached,
	prompt_file="/home/yupix/.codex/skills/graphify/references/extraction-spec.md",
)
print(f"Semantic: {len(semantic['nodes'])} nodes, {len(semantic['edges'])} edges; cached {saved} files")

ast = json.loads((out / ".graphify_ast.json").read_text(encoding="utf-8"))
seen = {node["id"] for node in ast["nodes"]}
nodes = list(ast["nodes"])
for node in semantic["nodes"]:
	if node["id"] not in seen:
		nodes.append(node)
		seen.add(node["id"])
extraction = {
	"nodes": nodes,
	"edges": ast["edges"] + semantic["edges"],
	"hyperedges": semantic.get("hyperedges", []),
	"input_tokens": semantic.get("input_tokens", 0),
	"output_tokens": semantic.get("output_tokens", 0),
}
(out / ".graphify_extract.json").write_text(
	json.dumps(extraction, indent=2, ensure_ascii=False), encoding="utf-8"
)

detection = json.loads((out / ".graphify_detect.json").read_text(encoding="utf-8"))
graph = build_from_json(extraction, root=root, directed=False)
communities = cluster(graph)
cohesion = score_all(graph, communities)
labels = {community_id: f"Community {community_id}" for community_id in communities}
gods = god_nodes(graph)
surprises = surprising_connections(graph, communities)
questions = suggest_questions(graph, communities, labels)
assert to_json(graph, communities, out / "graph.json")
(out / "GRAPH_REPORT.md").write_text(
	generate(
		graph,
		communities,
		cohesion,
		labels,
		gods,
		surprises,
		detection,
		{"input": extraction["input_tokens"], "output": extraction["output_tokens"]},
		root,
		suggested_questions=questions,
	),
	encoding="utf-8",
)
(out / ".graphify_analysis.json").write_text(
	json.dumps(
		{
			"communities": {str(key): value for key, value in communities.items()},
			"cohesion": {str(key): value for key, value in cohesion.items()},
			"gods": gods,
			"surprises": surprises,
			"questions": questions,
		},
		indent=2,
		ensure_ascii=False,
	),
	encoding="utf-8",
)
print(f"Graph: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges, {len(communities)} communities")
