import json
from datetime import datetime, timezone
from pathlib import Path

from graphify.analyze import suggest_questions
from graphify.build import build_from_json
from graphify.cli import _stamped_manifest_files
from graphify.detect import save_manifest
from graphify.report import generate

out = Path("graphify-out")
root = Path(".")
extraction = json.loads((out / ".graphify_extract.json").read_text(encoding="utf-8"))
detection = json.loads((out / ".graphify_detect.json").read_text(encoding="utf-8"))
analysis = json.loads((out / ".graphify_analysis.json").read_text(encoding="utf-8"))
graph = build_from_json(extraction, root=root, directed=False)
communities = {int(key): value for key, value in analysis["communities"].items()}
cohesion = {int(key): value for key, value in analysis["cohesion"].items()}
labels = {
	0: "Dashboard Data Flow", 1: "Runtime Dependencies", 2: "Project Documentation",
	3: "Authentication Types", 4: "Link Metadata", 5: "Development Tooling",
	6: "Biome Configuration", 7: "Site Layout", 8: "Content Editors",
	9: "Package Scripts", 10: "Post Index", 11: "CMS Query API",
	12: "Server Monitoring", 13: "Content Migration", 14: "Markdown Editor",
	15: "CMS Data Shaping", 16: "TypeScript Configuration", 17: "Status API",
	18: "Member Profiles", 19: "Renovate Configuration", 20: "Traefik Watchdog",
	21: "Sitemap Generation", 22: "Post Cards", 23: "PocketBase Notifications",
	24: "Native Dependencies", 25: "Crawler Policy", 26: "Astro Configuration",
	27: "Discord Hook", 28: "User Hook", 29: "Initial Schema",
	30: "Series Migration", 31: "Dashboard Rules", 32: "Media Migration",
	33: "Series Editing", 34: "Icon Library",
}
questions = suggest_questions(graph, communities, labels)
(out / "GRAPH_REPORT.md").write_text(
	generate(
		graph, communities, cohesion, labels, analysis["gods"], analysis["surprises"],
		detection, {"input": extraction.get("input_tokens", 0), "output": extraction.get("output_tokens", 0)},
		root, suggested_questions=questions,
	), encoding="utf-8"
)
(out / ".graphify_labels.json").write_text(
	json.dumps({str(key): value for key, value in labels.items()}, ensure_ascii=False), encoding="utf-8"
)

corpus = detection.get("all_files") or detection["files"]
manifest_files = _stamped_manifest_files(corpus, extraction, root)
scan = {item for file_list in corpus.values() for item in file_list}
save_manifest(manifest_files, root=root, scan_corpus=scan)

cost_path = out / "cost.json"
cost = json.loads(cost_path.read_text()) if cost_path.exists() else {"runs": [], "total_input_tokens": 0, "total_output_tokens": 0}
input_tokens = extraction.get("input_tokens", 0)
output_tokens = extraction.get("output_tokens", 0)
cost["runs"].append({"date": datetime.now(timezone.utc).isoformat(), "input_tokens": input_tokens, "output_tokens": output_tokens, "files": detection.get("total_files", 0)})
cost["total_input_tokens"] += input_tokens
cost["total_output_tokens"] += output_tokens
cost_path.write_text(json.dumps(cost, indent=2, ensure_ascii=False), encoding="utf-8")
print("Report updated with community labels")
