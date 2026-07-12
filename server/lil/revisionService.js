const http = require('http');
const mongoose = require('mongoose');
const { Attempt } = require('./models');

function getQueryParamsForTopic(topicId, difficulty) {
  if (topicId === 'addition') {
    const digitsMap = { easy: 1, medium: 2, hard: 3, extrahard: 4 };
    return `digits=${digitsMap[difficulty] || 1}`;
  }
  if (topicId === 'sqrt') {
    const step = difficulty === 'easy'
      ? Math.floor(Math.random() * 10) + 1
      : difficulty === 'medium'
        ? Math.floor(Math.random() * 25) + 11
        : difficulty === 'hard'
          ? Math.floor(Math.random() * 25) + 36
          : Math.floor(Math.random() * 20) + 61;
    return `step=${step}`;
  }
  if (topicId === 'multiply') {
    const table = difficulty === 'easy'
      ? Math.floor(Math.random() * 4) + 2
      : difficulty === 'medium'
        ? Math.floor(Math.random() * 4) + 6
        : difficulty === 'hard'
          ? Math.floor(Math.random() * 5) + 10
          : Math.floor(Math.random() * 5) + 15;
    return `table=${table}`;
  }
  return `difficulty=${difficulty}`;
}

function fetchLocalQuestion(topicId, difficulty) {
  return new Promise((resolve, reject) => {
    const port = process.env.PORT || 4000;
    const queryParams = getQueryParamsForTopic(topicId, difficulty);
    const path = topicId === 'circleth' ? 'circle-api' : `${topicId}-api`;
    
    const req = http.get(`http://127.0.0.1:${port}/${path}/question?${queryParams}&goal=revision`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const RevisionService = {
  generateRevisionQuestions: async (userId, topicId, count = 15) => {
    // 15 questions: 4 easy, 4 medium, 4 hard, 3 extrahard
    const targets = {
      easy: 4,
      medium: 4,
      hard: 4,
      extrahard: 3
    };

    const questions = [];
    
    // Fetch previously incorrect attempts for this topic
    let incorrectAttempts = [];
    try {
      incorrectAttempts = await Attempt.find({
        userId: new mongoose.Types.ObjectId(userId),
        topicId,
        isCorrect: false
      }).sort({ createdAt: -1 });
    } catch (e) {
      console.error('[RevisionService] Failed to fetch incorrect attempts:', e);
    }

    // Group incorrect attempts by difficulty
    const incorrectByDiff = {
      easy: [],
      medium: [],
      hard: [],
      extrahard: []
    };

    for (const attempt of incorrectAttempts) {
      if (attempt.prompt) {
        const diff = attempt.difficulty || 'medium';
        if (incorrectByDiff[diff]) {
          incorrectByDiff[diff].push({
            questionId: attempt._id.toString(),
            difficulty: diff,
            prompt: attempt.prompt,
            answer: attempt.correctAnswer,
            display: attempt.display,
            options: attempt.options
          });
        }
      }
    }

    const difficulties = ['easy', 'medium', 'hard', 'extrahard'];
    for (const diff of difficulties) {
      const targetCount = targets[diff];
      const diffQuestions = [];

      const incorrectList = incorrectByDiff[diff];
      for (const q of incorrectList) {
        if (diffQuestions.length >= targetCount) break;
        diffQuestions.push(q);
      }

      while (diffQuestions.length < targetCount) {
        try {
          const q = await fetchLocalQuestion(topicId, diff);
          if (q) {
            diffQuestions.push({
              questionId: q.id || `q-${Date.now()}-${Math.random()}`,
              difficulty: diff,
              prompt: q.prompt,
              answer: q.answer,
              display: q.display,
              options: q.options
            });
          }
        } catch (err) {
          console.error(`[RevisionService] Failed to fetch local question for ${topicId} (${diff}):`, err.message);
          diffQuestions.push({
            questionId: `stub-${Date.now()}-${Math.random()}`,
            difficulty: diff,
            prompt: `Solve revision question for ${topicId}`,
            answer: '0',
            display: '0'
          });
        }
      }

      questions.push(...diffQuestions);
    }

    // Shuffle the final question list so it's not ordered by difficulty
    return questions.sort(() => Math.random() - 0.5);
  },

  evaluateRevision: (answers) => {
    const total = answers.length;
    const score = answers.filter(a => a.isCorrect).length;
    const percentage = total > 0 ? (score / total) : 0;
    return {
      passed: percentage >= 0.80,
      score,
      total,
      percentage: Math.round(percentage * 100)
    };
  }
};

module.exports = RevisionService;
