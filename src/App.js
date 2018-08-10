import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import QRcode from 'qrcode';
import axios from 'axios';
import ImgLoader from './imgLoader.js';

import html2canvas from 'html2canvas';

class App extends Component {
  state = {
    url: '',
    _url: '',
  }

  componentDidMount() {
    // this.qrcode();
    this.upload();
  }
  upload(){
    new ImgLoader({
      selector: '#face-input',
      beforeFun: this.showLoading,
      callback: (data) => {
        console.log(data);        
        if (data.error === 0) {
          if (data.base64Img) {
            this.refs.faceImg.src = data.base64Img;
            this.refs.faceImg.style.display = 'block';
            this.request(data.base64Img);
          }
        } else {
          
        }
      }
    });
  }
  // 微表情
  request(imgBase64,imgType='jpg') {
    const params = {
      imgBase64,
      imgType,
    };
    axios.get('https://ai.pingan.com/face/faceImgRectBase64', {params}).then(function (response) {
      console.log(response.data);
      alert(response.data);
    }).catch(function (error) {
      console.log(error);
    });
  }
  // 生成二维码
  qrcode() {
    const location = window.location.href;
    QRcode.toDataURL(location).then((url) => {
      console.log(url);
    })
  }
  // 生成海报
  creatImg() {
    html2canvas(this.refs.canvasRef).then((canvas) => {
      const img = canvas.toDataURL();
      this.setState({
        _url: img
      })
    });
  }
  render() {
    return (
      <div className="App">
        <div className="face">
          <img src="#" ref="faceImg" className='faceImg'/>
          <input 
            type="file" 
            accept="image/*"
            id="face-input" />
        </div>
        <div ref='canvasRef' className='canvasRef'>
          <img src={this.state.url} alt='图片'/>
        </div>
        <button onClick={()=>{this.creatImg()}}>生成图片</button>
        { this.state._url && 
          <div className='_photo'>
            <span>长按图片保存</span>
            <img src={this.state._url} alt='2324'  className='img'/>
          </div>
        }
      </div>
    );
  }
}

export default App;
