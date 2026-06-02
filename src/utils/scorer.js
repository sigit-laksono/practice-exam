export function scoreSession(questions, answers) {
  let correct = 0
  const details = questions.map((q) => {
    const userAnswer = (answers[q.id] || []).slice().sort()
    const correctAnswer = q.answer.slice().sort()
    const isCorrect =
      userAnswer.length === correctAnswer.length &&
      userAnswer.every((v, i) => v === correctAnswer[i])
    if (isCorrect) correct++
    return { id: q.id, isCorrect, userAnswer, correctAnswer }
  })
  return {
    correct,
    wrong: questions.length - correct,
    total: questions.length,
    score: Math.round((correct / questions.length) * 100),
    details,
  }
}
