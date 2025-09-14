// qa.js - handles Q&A functionality
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.username) window.location.href = 'index.html';
  
  // Set up logout
  document.getElementById('logoutLink').addEventListener('click', () => { 
    localStorage.removeItem('user'); 
    window.location.href='index.html'; 
  });

  // Load questions
  loadQuestions();

  // Search functionality
  document.getElementById('searchQuestions').addEventListener('input', (e) => {
    filterQuestions();
  });

  // Category filter
  document.getElementById('filterCategory').addEventListener('change', (e) => {
    filterQuestions();
  });

  // Ask question form
  document.getElementById('submitQuestion').addEventListener('click', async () => {
    await submitQuestion();
  });

  // Answer form
  document.getElementById('submitAnswer').addEventListener('click', async () => {
    await submitAnswer();
  });
});

async function loadQuestions() {
  try {
    // For now, use localStorage to simulate questions
    let questions = JSON.parse(localStorage.getItem('questions') || '[]');
    
    if (questions.length === 0) {
      // Add some sample questions
      questions = [
        {
          id: 1,
          title: "How to solve quadratic equations?",
          description: "I'm struggling with the quadratic formula. Can someone explain it step by step?",
          category: "mathematics",
          askedBy: "student1",
          askedAt: new Date().toISOString(),
          answers: [
            {
              id: 1,
              text: "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. Here's how to use it...",
              answeredBy: "teacher1",
              answeredAt: new Date().toISOString(),
              isAccepted: true
            }
          ],
          isResolved: true
        },
        {
          id: 2,
          title: "What is Newton's first law?",
          description: "Can someone explain Newton's first law of motion with examples?",
          category: "physics",
          askedBy: "student2",
          askedAt: new Date().toISOString(),
          answers: [
            {
              id: 2,
              text: "Newton's first law states that an object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.",
              answeredBy: "teacher1",
              answeredAt: new Date().toISOString(),
              isAccepted: false
            }
          ],
          isResolved: false
        }
      ];
      localStorage.setItem('questions', JSON.stringify(questions));
    }

    displayQuestions(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

function displayQuestions(questions) {
  const questionsList = document.getElementById('questionsList');
  questionsList.innerHTML = '';

  if (questions.length === 0) {
    questionsList.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-question-circle fa-3x mb-3"></i><p>No questions found. Be the first to ask a question!</p></div>';
    return;
  }

  questions.forEach(question => {
    const questionCard = createQuestionCard(question);
    questionsList.appendChild(questionCard);
  });
}

function createQuestionCard(question) {
  const card = document.createElement('div');
  card.className = 'card mb-3 question-card';
  
  const timeAgo = getTimeAgo(question.askedAt);
  const answerCount = question.answers ? question.answers.length : 0;
  const hasAcceptedAnswer = question.answers && question.answers.some(answer => answer.isAccepted);
  
  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h5 class="card-title mb-0">${question.title}</h5>
        <div class="d-flex align-items-center">
          <span class="badge badge-${getCategoryColor(question.category)} mr-2">${question.category}</span>
          ${question.isResolved ? '<span class="badge badge-success"><i class="fas fa-check"></i> Resolved</span>' : ''}
        </div>
      </div>
      
      <p class="card-text text-muted">${question.description}</p>
      
      <div class="d-flex justify-content-between align-items-center">
        <div class="question-meta">
          <small class="text-muted">
            <i class="fas fa-user"></i> ${question.askedBy} • 
            <i class="fas fa-clock"></i> ${timeAgo} • 
            <i class="fas fa-reply"></i> ${answerCount} answer${answerCount !== 1 ? 's' : ''}
          </small>
        </div>
        <div class="question-actions">
          <button class="btn btn-sm btn-outline-primary" onclick="viewQuestion(${question.id})">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="answerQuestion(${question.id})">
            <i class="fas fa-reply"></i> Answer
          </button>
        </div>
      </div>
      
      ${answerCount > 0 ? `
        <div class="mt-3">
          <h6><i class="fas fa-reply"></i> Answers:</h6>
          ${question.answers.slice(0, 2).map(answer => `
            <div class="answer-preview p-2 border-left border-primary mb-2">
              <div class="d-flex justify-content-between align-items-start">
                <p class="mb-1">${answer.text.substring(0, 100)}${answer.text.length > 100 ? '...' : ''}</p>
                ${answer.isAccepted ? '<span class="badge badge-success"><i class="fas fa-check"></i></span>' : ''}
              </div>
              <small class="text-muted">by ${answer.answeredBy} • ${getTimeAgo(answer.answeredAt)}</small>
            </div>
          `).join('')}
          ${answerCount > 2 ? `<small class="text-muted">... and ${answerCount - 2} more answers</small>` : ''}
        </div>
      ` : ''}
    </div>
  `;
  
  return card;
}

function getCategoryColor(category) {
  const colors = {
    'mathematics': 'primary',
    'physics': 'info',
    'chemistry': 'success',
    'biology': 'warning',
    'english': 'secondary',
    'general': 'dark'
  };
  return colors[category] || 'secondary';
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function filterQuestions() {
  const searchTerm = document.getElementById('searchQuestions').value.toLowerCase();
  const categoryFilter = document.getElementById('filterCategory').value;
  
  let questions = JSON.parse(localStorage.getItem('questions') || '[]');
  
  questions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm) || 
                         question.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || question.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  displayQuestions(questions);
}

async function submitQuestion() {
  const title = document.getElementById('questionTitle').value.trim();
  const category = document.getElementById('questionCategory').value;
  const description = document.getElementById('questionDescription').value.trim();
  
  if (!title || !category || !description) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const newQuestion = {
    id: Date.now(),
    title,
    description,
    category,
    askedBy: user.username,
    askedAt: new Date().toISOString(),
    answers: [],
    isResolved: false
  };
  
  let questions = JSON.parse(localStorage.getItem('questions') || '[]');
  questions.unshift(newQuestion);
  localStorage.setItem('questions', JSON.stringify(questions));
  
  // Award XP for asking questions
  await addXP(user.username, 5);
  showNotification('Question submitted! +5 XP', 'success');
  
  // Close modal and refresh
  $('#askQuestionModal').modal('hide');
  document.getElementById('askQuestionForm').reset();
  loadQuestions();
}

function viewQuestion(questionId) {
  // For now, just scroll to the question
  const questionElement = document.querySelector(`[onclick="viewQuestion(${questionId})"]`).closest('.question-card');
  questionElement.scrollIntoView({ behavior: 'smooth' });
}

function answerQuestion(questionId) {
  const questions = JSON.parse(localStorage.getItem('questions') || '[]');
  const question = questions.find(q => q.id === questionId);
  
  if (!question) return;
  
  // Populate question details in modal
  document.getElementById('questionDetails').innerHTML = `
    <h6>${question.title}</h6>
    <p class="text-muted">${question.description}</p>
    <small class="text-muted">Asked by ${question.askedBy} • ${getTimeAgo(question.askedAt)}</small>
  `;
  
  // Store current question ID for answer submission
  document.getElementById('answerForm').dataset.questionId = questionId;
  
  $('#answerModal').modal('show');
}

async function submitAnswer() {
  const answerText = document.getElementById('answerText').value.trim();
  const questionId = parseInt(document.getElementById('answerForm').dataset.questionId);
  
  if (!answerText) {
    showNotification('Please write an answer', 'error');
    return;
  }
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const newAnswer = {
    id: Date.now(),
    text: answerText,
    answeredBy: user.username,
    answeredAt: new Date().toISOString(),
    isAccepted: false
  };
  
  let questions = JSON.parse(localStorage.getItem('questions') || '[]');
  const questionIndex = questions.findIndex(q => q.id === questionId);
  
  if (questionIndex !== -1) {
    questions[questionIndex].answers.push(newAnswer);
    localStorage.setItem('questions', JSON.stringify(questions));
    
    // Award XP for answering
    await addXP(user.username, 3);
    showNotification('Answer submitted! +3 XP', 'success');
    
    // Close modal and refresh
    $('#answerModal').modal('hide');
    document.getElementById('answerText').value = '';
    loadQuestions();
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert">
      <span>&times;</span>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

