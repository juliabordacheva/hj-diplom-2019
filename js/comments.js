//файл comments.js выполняет задачи: создание форм комментариев и отправки сообщения на сервер. Связан с solution.js и server.js 

// Create and reneder comments
//определение время когда был сделан комментарий
const getDate = (timestamp) => {
  const date = new Date(timestamp);
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  };
  return date.toLocaleString('ru-RU', options);
};

// создание обьекта
const el = (name, attrs, childs) => {
  const element = document.createElement(name || 'div');

  if (typeof attrs === 'object' && attrs) {
    Object.keys(attrs).forEach(key => element.setAttribute(key, attrs[key]));
  }
  if (Array.isArray(childs)) {
    element.appendChild(
      childs.reduce((f, child) => {
        f.appendChild(child);
        return f;
      }, document.createDocumentFragment()),
    );
  } else if (typeof childs === 'string' || typeof childs === 'number') {
    element.appendChild(document.createTextNode(childs));
  }

  return element;
};
// comments form

const crtNewCommentNode = (date, message) => el('div', { class: 'comment' }, [
  el('p', { class: 'comment__time' }, date),
  el('p', { class: 'comment__message', style: 'white-space: pre;' }, message),
]);

const crtNewCommentsFormNode = (left, top) => el('form', { class: 'comments__form', style: `left: ${left}px; top: ${top}px;` }, [
  el('span', { class: 'comments__marker' }, null),
  el('input', { type: 'checkbox', class: 'comments__marker-checkbox' }, null),
  el('div', { class: 'comments__body', style: 'overflow-y: auto;' }, [
    el('div', { class: 'comment' }, [
      el('div', { class: 'loader', style: 'display: none;' }, [
        el('span', null, null),
        el('span', null, null),
        el('span', null, null),
        el('span', null, null),
        el('span', null, null),
      ]),
    ]),
    el('textarea', { class: 'comments__input', type: 'text', placeholder: 'Напишите ответ...' }, null),
    el('input', { class: 'comments__close', type: 'button', value: 'Закрыть' }, null),
    el('input', { class: 'comments__submit', type: 'submit', value: 'Отправить' }, null),
  ]),
]);

// создание новой формы комментария (новый комментарий)
const crtNewCommentsForm = (left, top) => {
  const newCommentsForm = crtNewCommentsFormNode(left, top);
  newCommentsForm.firstElementChild.dataset.left = parseInt(newCommentsForm.style.left);
  newCommentsForm.firstElementChild.dataset.top = parseInt(newCommentsForm.style.top);
  return newCommentsForm;
};

// состав/содержание новой формы комментария
const parseNewCommentsForm = (comment) => {
  const newCommentsForm = crtNewCommentsForm(comment.left, comment.top),
    [commentsBody] = newCommentsForm.getElementsByClassName('comments__body'),
    [loader] = newCommentsForm.getElementsByClassName('loader'),
    commentDate = getDate(comment.timestamp).replace(',', ''),
    newComment = crtNewCommentNode(commentDate, comment.message);
  newComment.dataset.timestamp = comment.timestamp;
  wrapCommentsCanvas.appendChild(newCommentsForm);
  commentsBody.insertBefore(newComment, loader.parentElement);
  return newCommentsForm;
};

// присоединение новых комментариев
const appendNewComment = (comment, commentsForm) => {
  const [commentsBody] = commentsForm.getElementsByClassName('comments__body'),
    comments = Array.from(commentsBody.getElementsByClassName('comment')),
    commentDate = getDate(comment.timestamp).replace(',', ''),
    newComment = crtNewCommentNode(commentDate, comment.message),
    nextComment = comments.find(curComment => Number(curComment.dataset.timestamp)
        > comment.timestamp);
  newComment.dataset.timestamp = comment.timestamp;
  commentsBody.insertBefore(newComment, nextComment || comments[comments.length - 1]);
};
// отрисовка комментария
const renderComments = (imgData) => {
  if (imgData.comments) {
    const Forms = Object.keys(imgData.comments).reduce((forms, id) => {
      const commentsMarker = forms.querySelector(`.comments__marker[data-left='${imgData.comments[id].left}'][data-top='${imgData.comments[id].top}']`);

      if (forms && commentsMarker) {
        appendNewComment(imgData.comments[id], commentsMarker.parentElement);
        return forms;
      }
      const newCommentsForm = parseNewCommentsForm(imgData.comments[id], id);
      forms.appendChild(newCommentsForm);
      return forms;
    }, document.createDocumentFragment());

    wrapCommentsCanvas.appendChild(Forms);
  }

  if (getSessionSettings('menuSettings').displayComments === 'hidden') {
    toggleCommentsForm(commentsOff);
    commentsOff.checked = true;
  }
};

// Work with comments form

// скрытие комментариев при использовании checkbox
const toggleCommentsFormShow = (event) => {
  if (event.target.classList.contains('menu__toggle')) {
    toggleCommentsForm(event.target);

    const menuSettings = getSessionSettings('menuSettings');
    menuSettings.displayComments = menuSettings.displayComments ? '' : 'hidden';
    sessionStorage.menuSettings = JSON.stringify(menuSettings);
  }
};

// сворачивание/скрытие комментариев при использовании кнопки
const toggleDisplayCommentsForm = (commentsFormCheckbox, isClosedByBtn) => {
  if (commentsFormCheckbox) {
    const [comment] = commentsFormCheckbox.parentElement.getElementsByClassName('comment');

    if (comment.firstElementChild.classList.contains('loader')) {
      wrapCommentsCanvas.removeChild(commentsFormCheckbox.parentElement);
    }
    if (!isClosedByBtn || !comment.firstElementChild.classList.contains('loader')) {
      commentsFormCheckbox.parentElement.style.zIndex = '';
      commentsFormCheckbox.checked = commentsFormCheckbox.disabled = false;
    }
  }
};

// Comments switch on/off:
commentsTools.addEventListener('change', toggleCommentsFormShow);

const addNewCommentsForm = (event) => {
  if (event.target.classList.contains('current-image') && commentsBtn.dataset.state === 'selected') {
    const prevCommentsFormCheckbox = wrapCommentsCanvas.querySelector('.comments__marker-checkbox[disabled=\'\']');
    toggleDisplayCommentsForm(prevCommentsFormCheckbox, false);
    const newCommentsForm = crtNewCommentsForm(event.offsetX - clickPointShifts.left,
      event.offsetY - clickPointShifts.top);
    wrapCommentsCanvas.appendChild(newCommentsForm);
    newCommentsForm.getElementsByClassName('comments__marker-checkbox')[0].checked = true;
    newCommentsForm.getElementsByClassName('comments__marker-checkbox')[0].disabled = true;
    newCommentsForm.style.zIndex = '5';
  }
};
// разворачивание формы комментариев
const openCommentsForm = (event) => {
  if (event.target.classList.contains('comments__marker-checkbox') && event.target.checked) {
    const prevCommentsFormCheckbox = wrapCommentsCanvas.querySelector('.comments__marker-checkbox[disabled=\'\']');
    toggleDisplayCommentsForm(prevCommentsFormCheckbox, false);
    event.target.disabled = true;
    event.target.parentElement.style.zIndex = '5';
  }
};

const typeComment = (event) => {
  if (event.target.classList.contains('comments__input')) {
    event.target.focus();
  }
};

// загрузка комментариев
const loadComment = (imgData, left, top) => {
  const commentForm = wrapApp.querySelector(`.comments__marker[data-left='${left}'][data-top='${top}']`).parentElement,
    [loader] = commentForm.getElementsByClassName('loader');
  for (const id in imgData.comments) {
    const comment = imgData.comments[id];
    const isPostedComment = wrapApp.querySelector(`.comment[data-timestamp='${comment.timestamp}']`);
    if (comment.left === left && comment.top === top && !isPostedComment) {
      appendNewComment(comment, commentForm);
      hideElement(loader);
      break;
    }
  }

  const menuSettings = getSessionSettings('menuSettings');
  if (menuSettings.displayComments === 'hidden') {
    toggleCommentsForm(commentsOff);
  }

  return imgData;
};

// post comment 
const postComment = (message, left, top) => {
  const id = getSessionSettings('imageSettings').id,
    body = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(left)}&top=${encodeURIComponent(top)}`;

  return fetch(`https:${urlApi}/${id}/comments`, {
    body,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then(checkResponseStatus)
    .then(data => loadComment(data, left, top))
    .then(saveImageSettings)
    .catch(err => console.error(err));
};

// отправка сообщения 
const sendComment = (event) => {
  if (event.target.classList.contains('comments__submit')) {
    event.preventDefault();
    const crntCommentsForm = event.target.parentElement.parentElement,
      [loader] = crntCommentsForm.getElementsByClassName('loader'),
      [input] = crntCommentsForm.getElementsByClassName('comments__input'),
      left = parseInt(crntCommentsForm.style.left),
      top = parseInt(crntCommentsForm.style.top);
    
  // проверка на пустоту формы отправки сообщения
  if (input.value === '') {
  alert ('Type your comment')
  } else { 
    showElement(loader);
    postComment(input.value ? input.value : '\n', left, top);
  input.value = '';
}
  }
};

// отправка текста комментария по кнопке enter
const pressEnter = (event) => {
  if (!event.repeat && !event.shiftKey && event.code === 'Enter' && event.target.classList.contains('comments__input')) {
    const submit = event.target.nextElementSibling.nextElementSibling;
    submit.dispatchEvent(new MouseEvent('click', event));
    event.target.blur();
  }
};

// закрытие/сворачивание формы комментария
const closeCommentsForm = (event) => {
  if (event.target.classList.contains('comments__close')) {
    const [checkbox] = event.target.parentElement.parentElement.getElementsByClassName('comments__marker-checkbox');
    toggleDisplayCommentsForm(checkbox, true);
  }
};

// Work with comments form:
wrapCommentsCanvas.addEventListener('click', addNewCommentsForm);
wrapCommentsCanvas.addEventListener('change', openCommentsForm);
wrapCommentsCanvas.addEventListener('click', typeComment);
wrapCommentsCanvas.addEventListener('click', sendComment);
wrapCommentsCanvas.addEventListener('keydown', pressEnter);
wrapCommentsCanvas.addEventListener('click', closeCommentsForm);
