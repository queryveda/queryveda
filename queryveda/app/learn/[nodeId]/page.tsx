import { skillTreeNodes } from "@/lib/skill-tree-data";
import { NodeClient } from "./node-client";

export function generateStaticParams() {
  return skillTreeNodes.map((n) => ({ nodeId: n.id }));
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  return <NodeClient nodeId={nodeId} />;
}
