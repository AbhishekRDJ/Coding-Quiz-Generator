import { useState, useEffect } from 'react'
import Confetti from 'react-confetti' // Import confetti library
import './App.css'

const QuizApp = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set())
  const [selectedOption, setSelectedOption] = useState(null)

  // Flag to track if confetti should be shown
  const [showConfetti, setShowConfetti] = useState(false)

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/generate-quiz', {
        method: 'POST'
      })
      const data = await response.json()
      console.log('Fetched Data:', data) // Add this line to inspect the response

      // Check if the response is a single question object
      if (data.question && Array.isArray(data.options) && data.answer) {
        setQuestions([data]) // Wrap the single question in an array
      } else if (Array.isArray(data)) {
        setQuestions(data) // If it's an array of questions, use it directly
      } else {
        throw new Error('Invalid question format received')
      }

      setCurrentQuestion(0) // Start from the first question
      setShowScore(false)
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleAnswerClick = option => {
    if (
      option === questions[currentQuestion]?.answer &&
      !answeredQuestions.has(currentQuestion)
    ) {
      setScore(score + 1)
    }
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestion]))
    setSelectedOption(option)
    setTimeout(handleNextQuestion, 500)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedOption(null)
    } else {
      setShowScore(true)
    }
  }

  useEffect(() => {
    if (showScore && score >= 3) {
      setShowConfetti(true) // Manually trigger confetti for testing
    }
  }, [showScore, score])

  const showScoreFunction = () => {
    setShowScore(true)
  }

  const restartQuiz = () => {
    setScore(0)
    setShowScore(false)
    setAnsweredQuestions(new Set())
    setShowConfetti(false) // Hide confetti when restarting
    fetchQuestions()
  }

  return (
    <div className='flex flex-col justify-center items-center bg-gray-100 p-4 h-screen'>
      {/* Show confetti when score is high */}
      {showConfetti && <Confetti />}

      <div className='bg-white shadow-lg p-6 rounded-lg w-full max-w-md'>
        {loading ? (
          <p>Loading questions...</p>
        ) : showScore ? (
          <div className='text-center'>
            <h2 className='mb-4 font-bold text-2xl'>
              Your Score: {score}/{questions.length}
            </h2>
            <ul>
              {questions.map((question, index) => (
                <li key={index}>
                  <p>
                    {index + 1}. {question.question}
                  </p>
                  <p>Correct Answer: {question.answer}</p>
                </li>
              ))}
            </ul>
            <button
              className='bg-blue-500 px-4 py-2 rounded text-white'
              onClick={restartQuiz}
            >
              Restart Quiz
            </button>
          </div>
        ) : questions.length > 0 ? (
          <div>
            <h2 className='mb-4 font-semibold text-xl'>
              Question {currentQuestion + 1}:{' '}
              {questions[currentQuestion]?.question}
            </h2>
            <div className='flex flex-col space-y-2 button-container'>
              {questions[currentQuestion]?.options?.map((option, index) => (
                <button
                  key={index}
                  className={`${
                    selectedOption === option
                      ? option === questions[currentQuestion]?.answer
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-blue-500'
                  } hover:bg-blue-600 px-4 py-2 rounded text-white`}
                  onClick={() => handleAnswerClick(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              className='bg-green-500 hover:bg-green-600 mt-4 px-4 py-2 rounded text-white next-button'
              onClick={showScoreFunction}
              disabled={selectedOption === null}
            >
              Show Score
            </button>
          </div>
        ) : (
          <p>No questions available</p>
        )}
      </div>
    </div>
  )
}

export default QuizApp
