"use strict"

// Diagramクラス
// GGダイアグラム部分のデータ保持や描画などのメソッドを司る
// this.canvasに、正方形のグラフ部分のcanvas要素を持つ

class Diagram{
  constructor(canvas){
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.max = 10 // Max range [m/s2]
    this.locusN = 500 // Max number of points in diagram

    this.recordData = null
    this.referenceData = null
  }

  setSize(W, H){
    this.canvas.width = W
    this.canvas.height = H
    this.W = W
    this.H = H
  }

  // 現在の1フレームを描画するメソッド。リアルタイムモニタリング中に1フレーム毎に呼び出す。
  // buf[]に格納されている最新のState配列を、徐々にopacityが変化する点群として描画。
  drawCurrent(){
    this.clear()
    let c = this.reverse ? 1 : -1
    for (let i = Math.max(0, buf.length - this.locusN); i < buf.length; i++){
      this.ctx.beginPath()
      this.ctx.arc(this.W/2 + c * buf[i].ay * this.W/2/this.max, this.H/2 + c * buf[i].ax * this.H/2/this.max, 5, 0, 2 * Math.PI)
      let opacity = 1.0 * (1 - (buf.length - i) / this.locusN)
      this.ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")"
      this.ctx.fill()
    }
    this.ctx.beginPath()
    this.ctx.arc(this.W/2 + c * ay * this.W/2/this.max, this.H/2 + c * ax * this.H/2/this.max, 12, 0, 2 * Math.PI)
    this.ctx.fillStyle = "red"
    this.ctx.fill()
  }

  loadData(timeStamp, isReference = false){
    // isReference(boolean): true if a reference data should be loaded
    let data = null
    if (timeStamp != null) {
      let h = getLocalStorage("data_" + timeStamp, null)
      if (h != null){
        data = h.data
      }
    }
    if (isReference) this.referenceData = data
    else this.recordData = data
  }

  // 比較元データ(もしあれば)と、着目データを2ケース表示する
  visualizeRecords(){
    this.clear()
    toggleRealtime(false)
    if (this.referenceData) this.drawRecord(this.referenceData, 'limegreen', 'dodgerblue')
    if (this.recordData) this.drawRecord(this.recordData, 'goldenrod', 'red')
  }

  // 比較元データ(もしあれば)と、着目データを2ケースともアニメーション表示する
  animateRecords(){
    this.stopAnimation()
    let startTime = Date.now()
    let maxTime1 = this.recordData ? (this.recordData[this.recordData.length - 1].t - this.recordData[0].t) : 0
    let maxTime2 = this.referenceData ? (this.referenceData[this.referenceData.length - 1].t - this.referenceData[0].t) : 0
    let maxTime = Math.max(maxTime1, maxTime2)
    let _this = this
    this.animationInterval = setInterval(function(){
      let timeNow = Date.now()
      _this.clear()
      if (_this.referenceData) _this.drawRecord(_this.referenceData, 'limegreen', 'dodgerblue', timeNow - startTime)
      if (_this.recordData) _this.drawRecord(_this.recordData, 'goldenrod', 'red', timeNow - startTime)
      if (timeNow - startTime > maxTime) _this.stopAnimation()
    }, 10)
  }

  stopAnimation(){
    clearInterval(this.animationInterval)
  }

  // timestampで指定される保存データをLocalStorageから読み込み、fillStyleの色で点群として描画するメソッド
  drawRecord(data, fillStyle, endFillStyle, limit = 1e6){
    // limit: msec
    let c = this.reverse ? 1 : -1
    if (data == null) return
    this.ctx.fillStyle = fillStyle
    let iFinal = 0
    let startTime = data[0].t
    for (let i = 0; i < data.length; i++){
      this.ctx.beginPath()
      this.ctx.arc(this.W/2 + c * data[i].ay * this.W/2/this.max, this.H/2 + c * data[i].ax * this.H/2/this.max, 5, 0, 2 * Math.PI)
      this.ctx.fill()
      iFinal = i
      if (data[i].t - startTime > limit) break
    }
    this.ctx.beginPath()
    this.ctx.arc(this.W/2 + c * data[iFinal].ay * this.W/2/this.max, this.H/2 + c * data[iFinal].ax * this.H/2/this.max, 12, 0, 2 * Math.PI)
    this.ctx.fillStyle = endFillStyle
    this.ctx.fill()
  }

  // Canvasをクリアする
  clear(){
    this.ctx.clearRect(0, 0, this.W, this.H)
  }
}
