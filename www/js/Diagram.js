"use strict"

class Diagram{
  constructor(canvas){
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.max = 10 // Max range [m/s2]
    this.locusN = 500
  }

  setSize(W, H){
    this.canvas.width = W
    this.canvas.height = H
    this.W = W
    this.H = H
  }

  drawCurrent(){
    this.clear()
    let c = this.reverse ? 1 : -1
    for (let i = Math.max(0, buf.length - this.locusN); i < buf.length; i++){
      this.ctx.beginPath()
      this.ctx.arc(this.W/2 + c * buf[i].ay * this.W/2/this.max, this.H/2 + c * buf[i].ax * this.H/2/this.max, 5, 0, 2 * Math.PI)
      //let brightness = Math.round(255 - 255 * i / buf.length)
      //this.ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")"
      //let brightness = Math.round(255 * (this.locusN - buf.length + i) / this.locusN)
      let opacity = 1.0 * (1 - (buf.length - i) / this.locusN)
      this.ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")"
      this.ctx.fill()
    }
    this.ctx.beginPath()
    this.ctx.arc(this.W/2 + c * ay * this.W/2/this.max, this.H/2 + c * ax * this.H/2/this.max, 12, 0, 2 * Math.PI)
    this.ctx.fillStyle="red"
    this.ctx.fill()
  }

  drawRecord(timestamp){
    toggleRealtime(false)
    this.clear()
    let c = this.reverse ? 1 : -1
    let h = getLocalStorage("data_" + timestamp, null)
    if (h == null) return
    this.ctx.fillStyle="limegreen"
    for (let i = 0; i < h.data.length; i++){
      this.ctx.beginPath()
      this.ctx.arc(this.W/2 + c * h.data[i].ay * this.W/2/this.max, this.H/2 + c * h.data[i].ax * this.H/2/this.max, 5, 0, 2 * Math.PI)
      this.ctx.fill()
    }
  }

  clear(){
    this.ctx.clearRect(0, 0, this.W, this.H)
  }
}
