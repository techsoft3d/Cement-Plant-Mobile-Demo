function readDrawImg(img, canvas, x, y, rad) {

  var w = img.width;
  var h = img.height;

  var resize = resizeWidthHeight(1024, w, h);
  drawImgOnCav(canvas, img, x, y, resize.w, resize.h, rad);

}

function readImg(reader) {
  var result_dataURL = reader.result;
  var img = new Image();
  img.src = result_dataURL;
  return img;
}


//端末がモバイルか
var _ua = (function (u) {
  var mobile = {
    0: (u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
      || u.indexOf("iphone") != -1
      || u.indexOf("ipod") != -1
      || (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
      || (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
      || u.indexOf("blackberry") != -1,
    iPhone: (u.indexOf("iphone") != -1),
    Android: (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
  };
  var tablet = (u.indexOf("windows") != -1 && u.indexOf("touch") != -1)
    || u.indexOf("ipad") != -1
    || (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
    || (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
    || u.indexOf("kindle") != -1
    || u.indexOf("silk") != -1
    || u.indexOf("playbook") != -1;
  var pc = !mobile[0] && !tablet;
  return {
    Mobile: mobile,
    Tablet: tablet,
    PC: pc
  };
})(window.navigator.userAgent.toLowerCase());

//キャンバスにImageを表示
function drawImgOnCav(canvas, img, x, y, w, h, rad) {
  var ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  var drawW = w;
  var drawH = h;
  if (rad != 0) {
    ctx.rotate(rad * Math.PI / 180);
    if (rad == 90) {
      ctx.translate(0, -w);
      drawW = h;
      drawH = w;
    } else if (rad == 180) {
      ctx.translate(-w, -h);
    } else if (rad == -90) {
      ctx.translate(-h, 0);
      drawW = h;
      drawH = w;
    }
  }

  ctx.drawImage(img, x, y, drawW, drawH);
}

function resizeWidthHeight(target_length_px, w0, h0) {
  //リサイズの必要がなければ元のwidth, heightを返す
  var length = Math.max(w0, h0);
  if (length <= target_length_px) {
    return {
      flag: false,
      w: w0,
      h: h0
    };
  }
  //リサイズの計算
  var w1;
  var h1;
  if (w0 >= h0) {
    w1 = target_length_px;
    h1 = h0 * target_length_px / w0;
  } else {
    w1 = w0 * target_length_px / h0;
    h1 = target_length_px;
  }
  return {
    flag: true,
    w: parseInt(w1),
    h: parseInt(h1)
  };
}