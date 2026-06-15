import { NodeClient } from "./node-client";

export default function NodePage({ params }: { params: { nodeId: string } }) {
  return <NodeClient nodeId={params.nodeId} />;
}
