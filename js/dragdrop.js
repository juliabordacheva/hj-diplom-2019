// ~~~~~~ Drag'n'Drop меню ~~~~~~


let dragged = null,
  draggedSettings = null;

const throttle = (cb) => {
  let isWaiting = false;
  return function (...args) {
    if (!isWaiting) {
      cb.apply(this, args);
      isWaiting = true;
      requestAnimationFrame(() => (isWaiting = false));
    }
  };
};

// menu moving

const putMenu = (event) => {
  if (event.which !== 1) { 
    return; 
  };

  movedPiece = menu; 
  minY = wrapApp.offsetTop + 1; 
  minX = wrapApp.offsetLeft + 1;
  maxX = wrapApp.offsetLeft + wrapApp.offsetWidth - movedPiece.offsetWidth - 1; 
  maxY = wrapApp.offsetTop + wrapApp.offsetHeight - movedPiece.offsetHeight - 1; 
  shiftX = event.pageX - event.target.getBoundingClientRect().left - window.pageXOffset; 
  shiftY = event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset;
};

// возможность перемещения меню
const dragMenu = (event, pageX, pageY) => {
  
  if(wrapApp.offsetWidth === menu.offsetWidth + parseInt(menu.style.left) + 1) {
    drop();
    menu.style.left = (parseInt(menu.style.left) - 2) + 'px';
  } else if(menu.style.left === '1px') {
    drop();
    menu.style.left = (parseInt(menu.style.left) + 2) + 'px';
  } else if(menu.style.top === '1px') {
    drop();
    menu.style.top = (parseInt(menu.style.top) + 2) + 'px';   
  } else if(wrapApp.offsetHeight === menu.offsetHeight + parseInt(menu.style.top) + 1) {
    drop();
    menu.style.top = (parseInt(menu.style.top) - 2) + 'px';
  };

  if (dragged) {
    x = x - shiftX; 
    y = y - shiftY; 
    x = Math.min(x, maxX);  
    y = Math.min(y, maxY); 
    x = Math.max(x, minX); 
    y = Math.max(y, minY); 
    movedPiece.style.left = x + 'px'; 
    movedPiece.style.top = y + 'px'; 
  } else {
    return;
  }
};

// "отпускание" перемещенного меню
const dropMenu = () => {
  if (dragged) {
    const menuSettings = getSessionSettings('menuSettings');

    dragged.style.pointerEvents = '';
    if (menuSettings) {
      menuSettings.left = dragged.offsetLeft;
      menuSettings.top = dragged.offsetTop;
      sessionStorage.menuSettings = JSON.stringify(menuSettings);
    } else {
      sessionStorage.menuSettings = JSON.stringify({
        left: dragged.offsetLeft,
        top: dragged.offsetTop,
      });
    }
    dragged = null;
  }
};

// работа с drag and drop, начало перемещения, перемещение, конец перемещения
const moveMenu = throttle((...coords) => dragMenu(...coords));
menu.addEventListener('mousedown', putMenu);
wrapApp.addEventListener('mousemove', event => moveMenu(event, event.pageX, event.pageY));
wrapApp.addEventListener('mouseup', dropMenu);
