import { Layout } from 'lucide-react';

export default function DashboardEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-[#a3a3a3] rounded-[10px] border border-dashed border-[#e5e5e5]">
      <div className="p-6 bg-[#f5f5f5] rounded-full mb-4">
        <Layout className="w-12 h-12 text-[#a3a3a3]" />
      </div>
      <p className="font-medium">Select a component to start editing</p>
    </div>
  );
}
