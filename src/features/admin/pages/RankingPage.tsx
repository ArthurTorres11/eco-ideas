import { RankingPanel } from "@/features/ideas/components/RankingPanel";

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Ranking de Usuários</h1>
      <RankingPanel />
    </div>
  );
}
