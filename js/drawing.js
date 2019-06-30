// drawing отвечает за вес функционал связанный с рисованием
// drawing in canvas 

const penWidth = 4;
let checkedColorBtn = menu.querySelector('.menu__color[checked=\'\']'),
  penColor = getComputedStyle(checkedColorBtn.nextElementSibling).backgroundColor,
  strokes = [],
  isDrawing = false,
  needsRendering = false;

// рисование точки
const drawPoint = (point) => {
  ctx.beginPath();
  ctx.arc(...point, penWidth / 2, 0, 2 * Math.PI);
  ctx.fill();
};

const makePoint = (x, y) => [x, y];

// рисование линии
const drawStroke = (points) => {
  ctx.beginPath();
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.moveTo(...points[0]);
  for (let i = 1; i < points.length - 1; i++) {
    ctx.lineTo(...points[i], ...points[i + 1]);
  }
  ctx.stroke();
};

const draw = () => {
  strokes.forEach((stroke) => {
    drawPoint(stroke[0]);
    drawStroke(stroke);
  });
};

const sendMask = () => {
  canvas.toBlob(blob => socket.send(blob));
};

// начать рисование при зажимании копки мыши
const mouseDown = (event) => {
  if (drawBtn.dataset.state === 'selected') {
    isDrawing = true;
    const stroke = [];
    stroke.push(makePoint(event.offsetX, event.offsetY));
    strokes.push(stroke);
    needsRendering = true;
    toggleCommentsForm(commentsOff);
    menu.style.display = "none"
}
};

// рисование при движениие мыши
const mouseMove = (event) => {
  if (isDrawing) {
    const stroke = strokes[0];
    stroke.push(makePoint(event.offsetX, event.offsetY));
    needsRendering = true;
  }
};

// прекратить рисовании при отпускании копки мыши
const mouseUp = (event) => {
  if (drawBtn.dataset.state === 'selected') {
    isDrawing = false;
    strokes = [];
    setTimeout(sendMask, 1000);
    toggleCommentsForm(commentsOn);
    menu.style.display = "block"
  }
};

// инициализация рисования
const initDraw = (event) => {
  ctx.strokeStyle = ctx.fillStyle = getComputedStyle(checkedColorBtn.nextElementSibling).backgroundColor;
  ctx.lineWidth = penWidth;

  // выбор цвета
  const changeColor = (event) => {
    if (event.target.checked) {
      checkedColorBtn.removeAttribute('checked');
      checkedColorBtn = event.target;
      event.target.setAttribute('checked', '');
      ctx.strokeStyle = ctx.fillStyle = penColor = getComputedStyle(event.target.nextElementSibling).backgroundColor;
    }
  };

  // работа рисования
  drawTool.addEventListener('change', changeColor);
  canvas.addEventListener('mousedown', mouseDown);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('mouseup', mouseUp);
  canvas.addEventListener('mouseleave', () => (isDrawing = false)); // прерывать рисование, если курсор вышел за пределы картинки
};

// drawing to start:

drawBtn.addEventListener('click', initDraw);

// smooth line drawing

const tick = () => {
  if (needsRendering) {
    draw(ctx);
    needsRendering = false;
  }

//  menu width adjustment

  let crntMenuLeftPos = menu.getBoundingClientRect().left;
  while (menu.offsetHeight > defaultMenuHeight) {
    menu.style.left = `${--crntMenuLeftPos}px`;
  }
  window.requestAnimationFrame(tick);
};
tick();
