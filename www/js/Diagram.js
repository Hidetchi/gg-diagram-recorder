"use strict"

class Diagram{
  constructor(canvas){
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.points = []
    this.max = 10
    this.locusN = 500
  }

  addLocus(ax, ay){
    this.points.push({x:ax, y:ay})
    if (this.points.length > this.locusN) this.points.shift()
  }

  setSize(W, H){
    this.canvas.width = W
    this.canvas.height = H
    this.W = W
    this.H = H
  }

  drawCurrent(){
    this.clear()
    for (let i = 0; i < this.points.length; i++){
      this.ctx.beginPath()
      this.ctx.arc(this.W/2 - this.points[i].y * this.W/2/this.max, this.H/2 - this.points[i].x * this.H/2/this.max, 5, 0, 2 * Math.PI)
      //let brightness = Math.round(255 - 255 * i / this.points.length)
      //this.ctx.fillStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")"
      //let brightness = Math.round(255 * (this.locusN - this.points.length + i) / this.locusN)
      let opacity = 1.0 * (this.locusN - this.points.length + i) / this.locusN
      this.ctx.fillStyle = "rgb(255, 255, 255, " + opacity + ")"
      this.ctx.fill()
    }
    this.ctx.beginPath()
    this.ctx.arc(this.W/2 - ay * this.W/2/this.max, this.H/2 - ax * this.H/2/this.max, 12, 0, 2 * Math.PI)
    this.ctx.fillStyle="red"
    this.ctx.fill()
  }

  clear(){
    this.ctx.clearRect(0, 0, this.W, this.H)
  }
}
