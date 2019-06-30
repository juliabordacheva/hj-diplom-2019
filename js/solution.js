'use strict'
// создания логики и расположение переменных, и их взаимодействие с овсеми файлами проекта
// constant task

const [wrapApp] = document.getElementsByClassName('app'),
  [menu] = wrapApp.getElementsByClassName('menu'),
  [burgerBtn] = menu.getElementsByClassName('burger'),
  [newImgBtn] = menu.getElementsByClassName('new'),
  [commentsBtn] = menu.getElementsByClassName('comments'),
  [commentsTools] = menu.getElementsByClassName('comments-tools'),
  commentsOn = document.getElementById('comments-on'),
  commentsOff = document.getElementById('comments-off'),
  [drawBtn] = menu.getElementsByClassName('draw'),
  [drawTool] = menu.getElementsByClassName('draw-tools'),
  [shareBtn] = menu.getElementsByClassName('share'),
  [shareTool] = menu.getElementsByClassName('share-tools'),
  [urlTextarea] = shareTool.getElementsByClassName('menu__url'),
  [currentImage] = wrapApp.getElementsByClassName('current-image'),
  [loader] = wrapApp.getElementsByClassName('image-loader'),
  [errorMsg] = wrapApp.getElementsByClassName('error'),
  [errorHeader] = errorMsg.getElementsByClassName('error__header'),
  [errorMes] = errorMsg.getElementsByClassName('error__message');
const markerBounds = wrapApp.getElementsByClassName('comments__marker')[0].getBoundingClientRect(),
  formBounds = wrapApp.getElementsByClassName('comments__form')[0].getBoundingClientRect(),
  defaultMenuHeight = menu.offsetHeight,
  clickPointShifts = {
  left: markerBounds.left - formBounds.left + markerBounds.width / 2,
  top: markerBounds.top - formBounds.top + markerBounds.height,
  };
const urlApi = '//neto-api.herokuapp.com/pic',
  wrapCommentsCanvas = document.createElement('div'),
  canvas = document.createElement('canvas'),
  ctx = canvas.getContext('2d');


// Application launch

// запуск приложения
const showElement = (el) => {
  el.style.display = '';
};

const hideElement = (el) => {
  el.style.display = 'none';
};

// отображение меню и развертывание меню
const renderApp = () => {
  wrapApp.removeChild(wrapApp.getElementsByClassName('comments__form')[0]);
  wrapCommentsCanvas.appendChild(currentImage);
  wrapCommentsCanvas.insertBefore(canvas, currentImage.nextElementSibling);
  hideElement(canvas);
  wrapApp.insertBefore(wrapCommentsCanvas, menu.nextElementSibling);
  const urlParamID = new URL(`${window.location.href}`).searchParams.get('id');
  const menuSettings = getSessionSettings('menuSettings');
  if (menuSettings) {
    if (urlParamID) {
      selectMenuModeTo(menuSettings.mode, menuSettings.selectItemType);
      if (menuSettings.selectItemType === 'draw') {
        currentImage.addEventListener('load', initDraw);
      }
    } else {
      delete sessionStorage.imageSettings;
      selectMenuModeTo('initial');
    }
    menu.style.left = `${menuSettings.left}px`;
    menu.style.top = `${menuSettings.top}px`;
    commentsOff.checked = menuSettings.displayComments === 'hidden';
  } else {
    selectMenuModeTo('initial');
  }
  const imageSettings = getSessionSettings('imageSettings');
  currentImage.src = '';
  if (imageSettings && urlParamID) {
    currentImage.dataset.status = 'load';
    currentImage.src = imageSettings.url;
    urlTextarea.value = imageSettings.path;
    initWSSConnection(imageSettings.id);
  } else if (urlParamID) {
    isLinkedFromShare = true;
    loadImage({ id: urlParamID });
  }
};

// активация загрузки изображения 
currentImage.addEventListener('load', () => {
  wrapCommentsCanvas.style.width = `${currentImage.width}px`;
  wrapCommentsCanvas.style.height = `${currentImage.height}px`;
  wrapCommentsCanvas.classList.add('current-image', 'picture-wrap');
  canvas.width = currentImage.width;
  canvas.height = currentImage.height;
  canvas.classList.add('current-image', 'mask-canvas');
  showElement(canvas);
});

document.addEventListener('DOMContentLoaded', renderApp);

// ~~~~~~ Общие функции ~~~~~~

const toggleCommentsForm = (radioBtn) => {
  Array.from(wrapApp.getElementsByClassName('comments__form')).forEach((comments) => {
    if (radioBtn.value === 'on') {
      showElement(comments);
    } else {
      hideElement(comments);
    }
  });
};

// сохранение изображения 
const saveImageSettings = (imgData) => {
  urlTextarea.value = imgData.path = `${window.location.href.replace(/\?id=.*$/, '')}?id=${imgData.id}`;
  sessionStorage.imageSettings = JSON.stringify(imgData);
};

const getSessionSettings = (key) => {
  try {
    if (sessionStorage[key]) {
      return JSON.parse(sessionStorage[key]);
    }
  } catch (err) {
    console.error(`${err}`);
  }
};

const checkResponseStatus = (resp) => {
  if (resp.status >= 200 && resp.status < 300) {
    return resp.json();
  }
  errorHeader.textContent = `Error: ${resp.status}`;
  throw new Error(`${resp.statusText}`);
};

const selectMenuModeTo = (mode, selectedItemType) => {
  switch (mode) {
    case 'initial':
      menu.dataset.state = 'initial';
      hideElement(burgerBtn);
      break;

    case 'default':
      menu.dataset.state = 'default';
      Array.from(menu.querySelectorAll('[data-state=\'selected\']')).forEach(
        el => (el.dataset.state = ''),
      );
      break;

    case 'selected':
      menu.dataset.state = 'selected';
      [commentsBtn, drawBtn, shareBtn].find(btn => btn.classList.contains(selectedItemType)).dataset.state = 'selected';
      [commentsTools, drawTool, shareTool].find(tools => tools.classList.contains(`${selectedItemType}-tools`)).dataset.state = 'selected';
      showElement(burgerBtn);
      break;
  }


  const menuSettings = getSessionSettings('menuSettings');
  if (menuSettings) {
    menuSettings.mode = mode;
    menuSettings.selectItemType = selectedItemType;
    sessionStorage.menuSettings = JSON.stringify(menuSettings);
  } else {
    sessionStorage.menuSettings = JSON.stringify({
      mode,
      selectItemType: selectedItemType,
    });
  }
};

// разворачивание меню
const selectMenuMode = (event) => {
  if (burgerBtn === event.target || burgerBtn === event.target.parentElement) {
    selectMenuModeTo('default');
  } else if (drawBtn === event.target || drawBtn === event.target.parentElement) {
    selectMenuModeTo('selected', 'draw');
  } else if (commentsBtn === event.target || commentsBtn === event.target.parentElement) {
    selectMenuModeTo('selected', 'comments');
  } else if (shareBtn === event.target || shareBtn === event.target.parentElement) {
    selectMenuModeTo('selected', 'share');
  }
};

menu.addEventListener('click', selectMenuMode);


//  Copy link in mode "Поделиться"
// копирование содержимого инпута, при клике на кнопку copy 
const checkSelectionResult = () => {
  try {
    const done = document.execCommand('copy');
    console.log(`Copy link: ${urlTextarea.value}${done ? ' ' : 'not'}done`);
  } catch (err) {
    console.error(`Can't copy link. Error: ${err}`);
  }
};

const clearSelection = () => {
  try {
    window.getSelection().removeAllRanges();
  } catch (err) {
    document.selection.empty();
    console.error(err);
  }
};

const copyURL = (event) => {
  if (event.target.classList.contains('menu_copy')) {
    urlTextarea.select();
    checkSelectionResult();
    clearSelection();
  }
};

shareTool.addEventListener('click', copyURL);
