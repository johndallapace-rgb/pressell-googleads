import { QuizQuestion as IQuizQuestion } from '@/data/products';

interface Props {
  question: IQuizQuestion;
  onAnswer: (value: string) => void;
}

export default function QuizQuestion({ question, onAnswer }: Props) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {question.question}
      </h2>
      <div className="space-y-4">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer(option.id)}
            className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group flex items-center justify-between"
          >
            <span className="text-lg font-medium text-gray-700 group-hover:text-blue-700">
              {option.label}
            </span>
            <span className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-blue-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
