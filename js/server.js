// веб сокеты и взаимодействие с сервером
// work with server
// WebSocket conect

const addCommentInDirectory = (comment, directory) => {
  directory[comment.id] = {
    left: comment.left,
    top: comment.top,
    message: comment.message,
    timestamp: comment.timestamp,
  };
};

// обновление картинки
const updatePic = (event) => {
  const wssResponse = JSON.parse(event.data);

  switch (wssResponse.event) {
    case 'pic':
      if (wssResponse.pic.mask) {
        canvas.style.background = `url('${wssResponse.pic.mask}')`;
      } else {
        canvas.style.background = '';
      }

      if (wssResponse.pic.comments) {
        renderComments(wssResponse.pic);
      }
      break;

    case 'comment':
      const imageSettings = getSessionSettings('imageSettings');
      const commentsMarker = wrapApp.querySelector(`.comments__marker[data-left='${wssResponse.comment.left}'][data-top='${wssResponse.comment.top}']`);

      if (imageSettings.comments) {
        addCommentInDirectory(wssResponse.comment, imageSettings.comments);
      } else {
        imageSettings.comments = {};
        addCommentInDirectory(wssResponse.comment, imageSettings.comments);
      }

      if (commentsMarker) {
        loadComment(imageSettings, wssResponse.comment.left, wssResponse.comment.top);
      } else {
        wrapCommentsCanvas.appendChild(crtNewCommentsForm(wssResponse.comment.left,
          wssResponse.comment.top));
        loadComment(imageSettings, wssResponse.comment.left, wssResponse.comment.top);
      }
      break;

    case 'mask':
      canvas.style.background = `url('${wssResponse.url}')`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!sessionStorage.wssReload) {
        console.log('requires restarting websocket connection');
        sessionStorage.wssReload = 1;
        socket.close(1000);
        initWSSConnection(getSessionSettings('imageSettings').id);
      }
      break;
  }
};

// инициализации веб сокет соеденения и отлов ошибок при соеденении
const initWSSConnection = (id) => {
  socket = new WebSocket(`wss:${urlApi}/${id}`);
  socket.addEventListener('message', updatePic);
  socket.addEventListener('open', event => console.log('Websocket connection established'));
  socket.addEventListener('close', event => console.log(event.wasClean ? '\'Net closure\' connections' : `Breakage of communication, cause: ${event.reason}`));
  window.addEventListener('beforeunload', () => socket.close(1000, 'Session successfully completed'));
  socket.addEventListener('error', error => console.error(`Error: ${error.message}`));
};


// Loading image
// ошибка при загрузке картинки
let isLinkedFromShare = false;
const postError = (header, message) => {
  errorHeader.textContent = header;
  errorMes.textContent = message;
  showElement(errorMsg);
};

// загрузка картинки 
const showImage = (imgData) => {
  currentImage.dataset.status = 'load';
  currentImage.src = imgData.url;
  saveImageSettings(imgData);
  window.history.pushState({ path: urlTextarea.value }, '', urlTextarea.value);

  while (wrapCommentsCanvas.hasChildNodes() && wrapCommentsCanvas.lastElementChild.classList.contains('comments__form')) {
    wrapCommentsCanvas.removeChild(wrapCommentsCanvas.lastElementChild);
  }
  initWSSConnection(imgData.id);

  currentImage.addEventListener('load', () => {
    hideElement(loader);
    const menuSettings = getSessionSettings('menuSettings');
    delete menuSettings.displayComments;
    sessionStorage.menuSettings = JSON.stringify(menuSettings);
    sessionStorage.wssReload ? delete sessionStorage.wssReload : '';
    selectMenuModeTo('selected', isLinkedFromShare ? 'comments' : 'share');
    commentsOn.checked = true;
    isLinkedFromShare = false;
  });
};

// создание и запись id картинки при загрузке картинки
const loadImage = ({ id }) => {
  fetch(`https:${urlApi}/${id}`)
    .then(checkResponseStatus)
    .then(showImage)
    .catch(err => postError(errorHeader.textContent, err.message));
};

const postImage = (path, file) => {
  const formData = new FormData();
  const name = file.name.replace(/\.\w*$/, '');

  formData.append('title', name);
  formData.append('image', file);

  showElement(loader);
  fetch(path, {
    body: formData,
    method: 'POST',
  })
    .then(checkResponseStatus)
    .then(showImage)
    .catch(err => postError(errorHeader.textContent, err.message));
};

const uploadNewByInput = (event) => {
  if (errorMsg.style.display !== 'none') {
    hideElement(errorMsg);
  }

  if (newImgBtn === event.target || newImgBtn === event.target.parentElement) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg, image/png';
    input.addEventListener('change', event => postImage(`https:${urlApi}`, event.currentTarget.files[0]));
    input.dispatchEvent(new MouseEvent(event.type, event));
  }
};

// проверка формата файла при загрузке
const uploadNewByDrop = (event) => {
  event.preventDefault();
  if (errorMsg.style.display !== 'none') {
    hideElement(errorMsg);
  }
  if (event.target === event.currentTarget || event.target === canvas || event.target === errorMsg || event.target.parentElement === errorMsg) {
    if (currentImage.dataset.status !== 'load') {
      const file = event.dataTransfer.files[0];
      if (/^image\/[(jpeg) | (png)]/.test(file.type)) {
        postImage(`https:${urlApi}`, file);
      } else {
        postError('Error', 'Invalid file format. Please select image format .jpg or .png.');
      }
    } else {
      postError('Error', 'To upload a new file, use the button \'Загрузить новое\' in menu');
    }
  }
};

// Загрузка файла на сервер:

menu.addEventListener('click', uploadNewByInput);
wrapApp.addEventListener('dragover', event => event.preventDefault());
wrapApp.addEventListener('drop', uploadNewByDrop);
