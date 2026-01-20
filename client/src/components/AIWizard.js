import React, {useState} from 'react';
import axios from 'axios';

const AIWizard = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      question: 'כמה זמן אתה רוצה להשקיע בבישול?',
      options: ['פחות מ-30 דקות', '30-60 דקות', 'יותר משעה'],
      key: 'prepTime',
    },
    {
      question: 'איזה סוג אוכל אתה מעדיף?',
      options: ['בשרי', 'חלבי', 'פרווה'],
      key: 'category',
    },
  ];

  const handleAnswer = answer => {
    setAnswers({...answers, [questions[step].key]: answer});
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      getRecommendation();
    }
  };

  const getRecommendation = async () => {
    setLoading(true);
    try {
      // For now, just get all public recipes and pick random
      // In future, implement proper filtering
      const res = await axios.get('/api/recipes');
      const recipes = res.data;
      if (recipes.length > 0) {
        const randomRecipe =
          recipes[Math.floor(Math.random() * recipes.length)];
        setRecommendation(randomRecipe);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setRecommendation(null);
  };

  if (recommendation) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-2xl font-bold mb-4">המלצת AI</h2>
        <h3 className="text-xl mb-2">{recommendation.title}</h3>
        <p className="mb-4">{recommendation.description}</p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          נסה שוב
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
        <div className="text-4xl mb-4">🤖</div>
        <p>מחפש מתכון מתאים...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="text-4xl text-center mb-4">🤖</div>
      <h2 className="text-2xl font-bold text-center mb-6">
        מה תרצה לאכול היום?
      </h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {questions[step].question}
        </h3>
        <div className="space-y-2">
          {questions[step].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded text-left">
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="text-center text-sm text-gray-500">
        שאלה {step + 1} מתוך {questions.length}
      </div>
    </div>
  );
};

export default AIWizard;
