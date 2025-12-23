export default function QuizProgress({ current, total }: { current: number; total: number }) {
  const percentage = Math.min(100, Math.max(0, ((current + 1) / total) * 100));

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="text-xs text-gray-500 text-right mt-1">
        Question {current + 1} of {total}
      </div>
    </div>
  );
}
