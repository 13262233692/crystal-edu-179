import React, { useState, useEffect } from 'react'
import { quizAPI } from '../services/api.js'

const categoryNames = {
  lattice: '晶格',
  symmetry: '对称性',
  crystal: '晶体结构',
  measurement: '测量'
}

export default function Quiz() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadQuestions()
  }, [category])

  const loadQuestions = async () => {
    try {
      const data = await quizAPI.getQuestions(category)
      setQuestions(data)
      setCurrentIndex(0)
      setSelectedOption(null)
      setShowResult(false)
      setScore(0)
    } catch (error) {
      console.error('Failed to load questions:', error)
    }
  }

  const currentQuestion = questions[currentIndex]

  const handleSelectOption = (index) => {
    if (showResult) return
    setSelectedOption(index)
  }

  const checkAnswer = () => {
    if (selectedOption === currentQuestion.answer) {
      setScore(score + 1)
    }
    setShowResult(true)
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setShowResult(false)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelectedOption(null)
      setShowResult(false)
    }
  }

  const getOptionClass = (index) => {
    if (!showResult) {
      return selectedOption === index ? 'selected' : ''
    }
    if (index === currentQuestion.answer) {
      return 'correct'
    }
    if (selectedOption === index && index !== currentQuestion.answer) {
      return 'wrong'
    }
    return ''
  }

  return (
    <div className="main-content" style={{ padding: 32, overflow: 'auto' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📝 题库练习</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: 120 }}
            >
              <option value="all">全部</option>
              <option value="lattice">晶格</option>
              <option value="symmetry">对称性</option>
              <option value="crystal">晶体结构</option>
              <option value="measurement">测量</option>
            </select>
          </div>
        </div>

        {currentQuestion ? (
          <div className="question-card">
            <span className="category-tag">
              {categoryNames[currentQuestion.category] || currentQuestion.category}
            </span>
            
            <div style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 14 }}>
              第 {currentIndex + 1} / {questions.length} 题 | 得分: {score}
            </div>

            <div className="question-text">{currentQuestion.question}</div>

            <div className="options">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${getOptionClass(index)}`}
                  onClick={() => handleSelectOption(index)}
                >
                  <span style={{ marginRight: 12 }}>{String.fromCharCode(65 + index)}.</span>
                  {option}
                </div>
              ))}
            </div>

            {showResult && (
              <div className="explanation">
                <strong>{selectedOption === currentQuestion.answer ? '✅ 回答正确！' : '❌ 回答错误'}</strong>
                <p style={{ marginTop: 8 }}>{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="quiz-nav">
              <button
                className="btn btn-outline"
                onClick={prevQuestion}
                disabled={currentIndex === 0}
              >
                上一题
              </button>
              
              {!showResult ? (
                <button
                  className="btn btn-primary"
                  onClick={checkAnswer}
                  disabled={selectedOption === null}
                >
                  提交答案
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={nextQuestion}
                  disabled={currentIndex === questions.length - 1}
                >
                  下一题
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="panel" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <p>暂无题目</p>
          </div>
        )}
      </div>
    </div>
  )
}
