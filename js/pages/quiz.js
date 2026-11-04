'use strict';

/* Викторина: каждый раз 10 случайных вопросов из банка, за 7 правильных ответов — печать */

const QUIZ_SIZE = 10;
/* номер вопроса, счёт, состояние и набор вопросов этой попытки */
const quiz = { index: 0, score: 0, answered: false, done: false, set: [] };

/* новая попытка: перемешиваем банк (Фишер — Йетс) и берём первые 10 */
function newQuizSet() {
  const ids = QUIZ.map((_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  Object.assign(quiz, { index: 0, score: 0, answered: false, done: false, set: ids.slice(0, QUIZ_SIZE) });
}

/* рисует раздел викторины */
function renderQuiz() {
  const p = texts();
  $('#v-quiz').innerHTML =
    pageHead('quiz', p.qzH, p.qzLead) +
    `
    <div class="container">
      <div class="quiz" id="quiz-box"></div>
    </div>
  `;
  if (!quiz.set.length) newQuizSet();
  paintQuiz();
}

/* показывает текущий вопрос или итог */
function paintQuiz() {
  const p = texts();
  const box = $('#quiz-box');

  if (quiz.done) {
    const passed = quiz.score >= 7;
    box.innerHTML = `
      <div class="card quiz-result">
        <p class="eyebrow">${esc(p.qzDone)}</p>
        <strong class="quiz-result__score">${esc(p.qzScore(quiz.score))}</strong>
        <p>${esc(passed ? p.qzGood : p.qzTry)}</p>
        <div class="actions">
          <button class="button button--primary" type="button" id="qz-again">${esc(p.qzAgain)}</button>
          <a class="button" href="#chronicle">${esc(ui().nav.chronicle)}</a>
        </div>
      </div>
    `;
    $('#qz-again').addEventListener('click', () => {
      newQuizSet();
      paintQuiz();
    });
    return;
  }

  const question = QUIZ[quiz.set[quiz.index]];
  const isLast = quiz.index === QUIZ_SIZE - 1;

  box.innerHTML = `
    <div class="quiz__top">
      <span>${esc(p.qzQ(quiz.index + 1))}</span>
      <span>${esc(p.qzPts(quiz.score))}</span>
    </div>
    <div class="quiz__progress">
      <span class="quiz__progress-fill" style="width: ${(quiz.index / QUIZ_SIZE) * 100}%"></span>
    </div>
    <h3 class="quiz__question">${esc(tr(question.q))}</h3>
    <div class="options">${optionsHtml(tr(question.o))}</div>
    <p class="explain" hidden>${esc(tr(question.e))}</p>
    <div class="actions" id="qz-nr" hidden>
      <button class="button button--primary" type="button" id="qz-next">
        ${esc(isLast ? p.qzDone : p.qzNext)} <span class="button__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  `;

  $$('.option', box).forEach((option) =>
    option.addEventListener('click', () => {
      if (quiz.answered) return;
      quiz.answered = true;
      initSound();
      const picked = Number(option.dataset.k);
      if (picked === question.a) {
        quiz.score++;
        playBell(659.25, 0.04);
      }
      markAnswer(box, picked, question.a);
      $('.explain', box).hidden = false;
      $('#qz-nr').hidden = false;
      $('#qz-next').focus({ preventScroll: true });
    })
  );

  $('#qz-next').addEventListener('click', () => {
    quiz.answered = false;
    if (isLast) quiz.done = true;
    else quiz.index++;
    paintQuiz();
  });
}
