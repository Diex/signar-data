import p5 from 'p5';
import '../css/style.scss';
import covid from '../assets/dna.json';
import regeneratorRuntime from 'regenerator-runtime';
const sketch = (p) => {
  let canvas;
  let roboto;
  let pallete;
  let go = false;
  let genome;
  let randoms;
  let to;
  let background;
  const numRows = 498;
  const numCols = 60;

  let w;
  let h;
  let y = 0;
  let matrix;

  p.preload = async () => {
    roboto = p.loadFont('assets/roboto-mono-v13-latin-regular.ttf');
    genome = covid.data;
    await spawn();
  };

  async function spawn() {
    console.log('recreate');
    let value = cryptoColor();
    background = await complement(value);
    pallete = await createPallete(value);
    randoms = await randomNumbers();
    prev = randoms.shift();
    // https://stackoverflow.com/questions/18163234/declare-an-empty-two-dimensional-array-in-javascript
    matrix = new Array(numRows).fill(0).map(() => new Array(numCols).fill(0));
    to = {
      row: Math.floor(p.random(numRows)),
      column: Math.floor(p.random(numCols)),
    };

    for (let times = 0; times < 32000; times++) {
      let polymer = genome[to.row][to.column];
      to = find(to);
      check(to, polymer);
    }
    go = true;
    y = 0;
  }

  p.setup = async () => {
    canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    p.frameRate(60);
    p.textFont(roboto);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.noStroke();
    p.background(0);
  };

  function check(to, polymer) {
    matrix[to.row][to.column] = polymer;
  }

  function scan() {
    if (y >= numRows) {
      setTimeout(spawn, 5000);
      go = false;
      return;
    }

    h = p.windowHeight / numRows;
    w =
      p.windowHeight < p.windowWidth
        ? p.windowHeight / numCols
        : p.windowWidth / numCols;

    printData(y);
    p.translate((p.windowWidth - w * numCols) / 2, 20);

    for (let x = 0; x < numCols; x++) {
      translate(matrix[y][x], { row: y, column: x });
    }

    y++;
  }

  function translate(polymer, location) {
    if (polymer == 0) {
      if (yes()) {
        p.fill(0);
        p.rect(location.column * w, location.row * h, w, h);
      }
      return;
    }
    let c = toColor(polymer);
    c.setAlpha(random() * 255);
    p.fill(c);

    p.rect(location.column * w, location.row * h, w, h);
  }

  function printData(row) {
    p.noStroke();
    p.fill(0);
    p.rect(0, 0, p.width, 20);
    p.fill('#FFF');
    p.text(row + ' ' + genome[row], p.windowWidth / 2, 12);
  }

  function dec2bin(dec) {
    return (dec >>> 0).toString(2).padStart(8, '00000000');
  }

  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  function find(to) {
    let x1 = to.column + direction();
    let y1 = to.row + direction();

    let loc = {
      column: x1 < 0 ? numCols - 1 : x1 >= numCols ? 0 : x1,
      row: y1 < 0 ? numRows - 1 : y1 >= numRows ? 0 : y1,
    };
    return loc;
  }

  function toColor(polymer) {
    return pallete[polymer];
  }

  function cryptoColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    let array = new Uint8Array(6);
    window.crypto.getRandomValues(array);
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(array[i] / 16)];
    }
    return color;
  }

  async function createPallete(value) {
    // console.log(value);
    let url =
      'https://www.thecolorapi.com/scheme?hex=' +
      value +
      '&mode=analogic&count=4&format=json';
    let pallete = {};
    // console.log('pallete');
    await p.httpGet(url, 'json', false, function (response) {
      console.log(response);
      pallete['a'] = p.color(
        response.colors[0].rgb.r,
        response.colors[0].rgb.g,
        response.colors[0].rgb.b
      );
      pallete['g'] = p.color(
        response.colors[1].rgb.r,
        response.colors[1].rgb.g,
        response.colors[1].rgb.b
      );
      pallete['c'] = p.color(
        response.colors[2].rgb.r,
        response.colors[2].rgb.g,
        response.colors[2].rgb.b
      );
      pallete['t'] = p.color(
        response.colors[3].rgb.r,
        response.colors[3].rgb.g,
        response.colors[3].rgb.b
      );
      // console.log(pallete);
    });

    return pallete;
  }

  async function complement(value) {
    let url =
      'https://www.thecolorapi.com/scheme?hex=' +
      value +
      '&mode=complement&count=1&format=json';
    let background;
    await p.httpGet(url, 'json', false, function (response) {
      background = p.color(
        response.colors[0].rgb.r,
        response.colors[0].rgb.g,
        response.colors[0].rgb.b
      );
    });
    return background;
  }
  async function randomNumbers() {
    let qty = 512;
    let url =
      'https://qrng.anu.edu.au/API/jsonI.php?length=' + qty + '&type=uint8';
    let r;
    await await p.httpGet(url, 'json', false, function (response) {
      console.log(response);
      r = response.data;
    });

    return r;
  }

  let bit = 0;
  let prev;

  let count = 0;
  function yes() {
    if (bit == 7) {
      randoms.push(prev);
      count++;
      if (count == randoms.length - 1) {
        shuffleArray(randoms);
        count = 0;
      }
      prev = randoms.shift();
      bit = 0;
    }
    let result = (prev >> bit) & 1;
    bit++;
    return result;
  }

  function direction() {
    if (yes()) {
      if (yes()) {
        return 1;
      } else {
        return -1;
      }
    }
    return 0;
  }
  function random() {
    randoms.push(prev);
    prev = randoms.shift();
    let result = p.map(prev, 0, 255, 0.0, 1.0);

    return result;
  }

  p.draw = () => {
    if (go) scan();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
  };

  p.keyPressed = () => {};

  p.mousePressed = toggleFullScreen;

  function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen =
      docEl.requestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.webkitRequestFullScreen ||
      docEl.msRequestFullscreen;
    var cancelFullScreen =
      doc.exitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.webkitExitFullscreen ||
      doc.msExitFullscreen;

    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      requestFullScreen.call(docEl);
    } else {
      cancelFullScreen.call(doc);
    }

    if (!document.fullscreenElement) {
      p.noCursor();
    } else {
      p.cursor(p.ARROW);
    }
  }
};

new p5(sketch);
