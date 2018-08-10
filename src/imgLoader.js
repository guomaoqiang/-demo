const EXIF = require('exif-js');
export default class {
  // this.imgOutputData;
  constructor(options) {
    this.callback = options.callback;
    this.beforeFun = options.beforeFun;
    this.init(options);
    this.bindEvent();
  }
  init(options) {
    this.inputfile = document.querySelector(options.selector);
  }
  bindEvent() {
    this.inputfile.onchange = e => {
      let files = this.inputfile.files;
      let file = files[0];
      if (file) {
        if (file.size >= 20*1024*1024) {
          this.callback && this.callback({
            error: 1,
            msg: '图片不能大于20M'
          });
          this.inputfile.value = null;
          return;
        }

        // 接受 jpeg, jpg, png 类型的图片
        if (/\/(?:jpeg|jpg|png|gif)/i.test(file.type)) {
          this.beforeFun && this.beforeFun();
          let reader = new FileReader();
          reader.onload = e => {
            //调用图片压缩方法：compress();
            let result = e.target.result;
            let img = new Image();
            img.onload = () => {
              this.compress(img, file.type, data => {
                this.callback && this.callback({
                  error: 0,
                  base64Img: data
                });
              });
              reader = img = null;
            };
            img.src = result;

          };
          reader.readAsDataURL(file);
        } else {
          console.log('不支持' + file.type + '格式的文件！')
          this.callback && this.callback({
            error: 1,
            msg: '请重新上传格式为jpg png gif的图片'
          });
        }
      }
    }
  }
  compress(img, fileType, callback) {
    let self = this;
    // 判断IOS下使用拍照功能是否需要旋转
    if (/ipad|iphone os/i.test(navigator.userAgent)) {
      EXIF.getData(img, function() {
        let orientation = EXIF.getTag(this, 'Orientation');
        self._compress(img, fileType, orientation, callback);
      });
    } else {
      self._compress(img, fileType, null, callback);
    }
  }
  _compress(img, fileType, orientation, callback) { //res代表上传的图片，fileSize大小图片的大小
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');

    let width = img.width,
      height = img.height,
      degreeCount = 0,
      x = 0,
      y = 0;

    // 只有当图片格式为jpeg格式时，orientation才有值
    // orientation＝1的情况图片是正的，不用处理
    if (orientation && orientation != 1) {
      switch (orientation) {
        case 6:
          width = img.height;
          height = img.width;
          x = 0;
          y = -width;
          degreeCount = 1;
          break;
        case 3:
          x = -img.width;
          y = -img.height;
          degreeCount = 2;
          break;
        case 8:
          width = img.height;
          height = img.width;
          x = -height;
          y = 0;
          degreeCount = 3;
          break;
      }
    }

    let initSize = img.src.length,
      twoHundred = 266763 * 2,
      scale = 0.1,
      // 判断是否进行长宽缩放处理
      isScale = width > 2000 || height > 2000 || initSize * scale > twoHundred;

    // 进行长宽缩放
    if (isScale) {
      scale = twoHundred / initSize;
      //width = width * scale;
      //height = height * scale;
    }

    // 若图片平身就小于50K缩放0.2了，若图片*0.1小于50K则压缩0.5
    let fifty = 66690;
    if (initSize < fifty) {
      scale = 0.2;
    } else if (initSize * 0.1 < fifty) {
      scale = 0.5;
    }

    if (isScale) {
      width = width * scale;
      height = height * scale;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.rotate(degreeCount * 90 * Math.PI / 180);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    if (isScale) {
      ctx.scale(scale, scale);
      // 若是拍照的大图，先用长宽压缩，再用canvas.toDataURL压缩
      scale = 0.5;
    }

    // drawImage在IOS7上的兼容问题处理
    if (/ipad|iphone os 7/i.test(navigator.userAgent)) {
      this._drawImageIOSFix(ctx, img, x, y);
    } else {
      ctx.drawImage(img, x, y);
    }

    // 压缩
    let base64data = canvas.toDataURL('image/jpeg', scale);

    console.log('压缩前：', initSize);
    console.log('压缩后：', base64data.length);
    console.log('压缩率：', 100 * (initSize - base64data.length) / initSize, "%");

    canvas = ctx = null;
    callback && callback(base64data);
  }
  _detectVerticalSquash(img) {
    let iw = img.naturalWidth,
      ih = img.naturalHeight;
    let canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let data = ctx.getImageData(0, 0, 1, ih).data;
    // search image edge pixel position in case it is squashed vertically.
    let sy = 0;
    let ey = ih;
    let py = ih;
    while (py > sy) {
      let alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    let ratio = (py / ih);
    return (ratio === 0) ? 1 : ratio;
  }
  _drawImageIOSFix(ctx, img, sx, sy) {
    let vertSquashRatio = this._detectVerticalSquash(img);
    ctx.drawImage(img, sx, sy, img.width, img.height / vertSquashRatio);
  }
};