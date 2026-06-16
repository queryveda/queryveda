import { excelSkillTreeNodes } from "@/lib/excel-skill-tree-data";
import { ExcelNodeClient } from "./excel-node-client";

export function generateStaticParams() {
  return excelSkillTreeNodes.map((n) => ({ nodeId: n.id }));
}

export default async function ExcelNodePage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = await params;
  return <ExcelNodeClient nodeId={nodeId} />;
}
