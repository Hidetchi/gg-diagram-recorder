"use strict";
var platform
var dt = 0.01
var prevTime = 0
var ax0, ay0, az0 // Raw sensor acceleration without gravity
var gx0 = 0, gy0 = 0, gz0 = 0 // Raw sensor acceleration with graviry
var ox0, oy0, oz0 // Raw sensor rotation speed
var alpha, beta, gamma // Raw sensor orientation
var ex1 = 1, ex2 = 0, ex3 = 0 // Direction cosine of X
var ey1 = 0, ey2 = 1, ey3 = 0 // Direction cosine of Y
var ez1 = 0, ez2 = 0, ez3 = 1 // Direction cosine of Z
var ax, ay
var diagram
var interval
var measurementMem1 = []
var measurementMem2 = []
var measurementMem3 = []
var measurementMem4 = []
var measurementMode = null // 1: Z-calibration, 2: X-calibration

document.addEventListener("deviceready", onDeviceReady, false)

/* ====================================
    On document.ready
===================================== */

$(function(){
  // Event listeners
  window.onblur = function(){
  }
  window.onfocus = function(){
  }
  $(window).on("beforeunload",function(e){
  })
  $(window).unload(function(){
  })
  window.addEventListener("devicemotion", _handleDeviceMotion, true)
  window.addEventListener("deviceorientation", _handleDeviceOrientation, true)
  //$("[tappable=true]").each(function(){ tappablize($(this)) })
  //$(".ui-dialog-titlebar-close").click(function(){sp.buttonClick("CANCEL")})
  //tappablize($(".ui-dialog-titlebar-close"), false)
  /*$("input[type=text], input[type=password]", $("#loginForm")).on('focus', function(){
    if (platform == 'Android') $("div.dynamic-spacer").css('flex', '0 0 0%')
  })
  $("input[type=text], input[type=password]", $("#loginForm")).on('blur', function(){
    $("div.dynamic-spacer").css('flex', '1 1 0%')
  })*/

  diagram = new Diagram(document.getElementById("diagramCanvas"))
  let tmp = localStorage.getItem("diagramRange")
  if (tmp) {
    diagram.max = tmp
    $('#diagramRangeSelect').val(tmp)
  }
  tmp = localStorage.getItem("directionVector")
  if (tmp) {
    let h = JSON.parse(tmp)
    ex1 = h.ex1; ex2 = h.ex2; ex3 = h.ex3
    ey1 = h.ey1; ey2 = h.ey2; ey3 = h.ey3
    ez1 = h.ez1; ez2 = h.ez2; ez3 = h.ez3
  }
  _resize()


  // Measure values on interval
  setInterval(function(){
    if (ox0 == null) return
    if (measurementMode == 1 || measurementMode == 3) {
      measurementMem1.push(gx0)
      measurementMem2.push(gy0)
      measurementMem3.push(gz0)
      if (measurementMode == 3) measurementMem4.push(Date.now())
    }

    ax = ex1 * gx0 + ex2 * gy0 + ex3 * gz0
    ay = ey1 * gx0 + ey2 * gy0 + ey3 * gz0
    diagram.drawCurrent()
    let str = ""
    str += gx0.toFixed(2) + "\n"
    str += gy0.toFixed(2) + "\n"
    str += gz0.toFixed(2) + "\n"
    //str += ax0.toFixed(2) + "\n"
    //str += ay0.toFixed(2) + "\n"
    //str += az0.toFixed(2) + "\n"
    str += ax.toFixed(2) + "\n"
    str += ay.toFixed(2) + "\n"
    str += Date.now() + "\n"
    str += ox0.toFixed(2) + "\n"
    str += oy0.toFixed(2) + "\n"
    str += oz0.toFixed(2) + "\n"
    str += alpha.toFixed(2) + "\n"
    str += beta.toFixed(2) + "\n"
    str += gamma.toFixed(2) + "\n"
    str += interval + "\n"
    _showLog(str)
    diagram.addLocus(ax, ay)
  }, 1000 * dt)
})

/* ====================================
    On deviceready
===================================== */

function onDeviceReady(){
  if (cordova.platformId == 'android') platform = 'Android'
  else if (cordova.platformId == 'ios') platform = 'iOS'
  else if (cordova.windowsId == 'windows') platform = 'Windows'
  //if (platform == 'Android') AndroidFullScreen.immersiveMode()
  //window.open = cordova.InAppBrowser.open
  document.addEventListener("pause", function(){
  }, false)
  document.addEventListener("resume", function(){
  }, false)
  if (window.plugins && window.plugins.insomnia) window.plugins.insomnia.keepAwake()
}

/* ====================================
    On window.resize
===================================== */

window.onresize = function () {
  _resize()
}

function _resize(){
  diagram.setSize(2*$('#diagramBox').width(), 2*$('#diagramBox').height())
}

/* ====================================
    functions
===================================== */

function _handleDeviceMotion(e){
  //ax0 = e.acceleration.x
  //ay0 = e.acceleration.y
  //az0 = e.acceleration.z
  gx0 = 0.85 * gx0 + 0.15 * e.accelerationIncludingGravity.x // Low-pass filter
  gy0 = 0.85 * gy0 + 0.15 * e.accelerationIncludingGravity.y // Low-pass filter
  gz0 = 0.85 * gz0 + 0.15 * e.accelerationIncludingGravity.z // Low-pass filter
  ox0 = e.rotationRate.alpha
  oy0 = e.rotationRate.beta
  oz0 = e.rotationRate.gamma
  interval = e.interval
}

function _handleDeviceOrientation(e){
  alpha = e.alpha
  beta = e.beta
  gamma = e.gamma
}

function _calibrationStep(n){
  $('#calibrationBox').children('div').hide()
  if (n==0) {
    $('#controlBox').hide()
    $('#calibrationBox').show()
    $('#calibrationStep0').show()
  } else if (n==1) {
    $('#calibrationStep1').show()
    _clearMeasurement()
    measurementMode = 1
    setTimeout(function(){
      measurementMode = null
      _calculateOrientationZ()
      _calibrationStep(2)
    }, 2000)
  } else if (n==2) {
    $('#calibrationStep2').show()
  } else if (n==3) {
    _clearMeasurement()
    measurementMode = 3
    $('#calibrationStep3').show()
  } else if (n==4) {
    measurementMode = null
    _calculateOrientationXY()
    _clearMeasurement()
    alert('キャリブレーションが完了しました')
    localStorage.setItem("directionVector", JSON.stringify({
      ex1: ex1, ex2: ex2, ex3: ex3,
      ey1: ey1, ey2: ey2, ey3: ey3,
      ez1: ez1, ez2: ez2, ez3: ez3
    }))
    $('#controlBox').show()
    $('#calibrationBox').hide()
  }
}

function _showLog(str){
  $('#logArea').val(str)
}

function _showPage(pageName){
  $('.page').hide()
  $('#page' + pageName).show()
}

function _clearMeasurement(){
  measurementMem1 = []
  measurementMem2 = []
  measurementMem3 = []
  measurementMem4 = []
}

function _calculateOrientationZ(){
  let avgX = avgArr(measurementMem1)
  let avgY = avgArr(measurementMem2)
  let avgZ = avgArr(measurementMem3)
  ez1 = avgX / Math.sqrt(avgX ** 2 + avgY ** 2 + avgZ ** 2)
  ez2 = avgY / Math.sqrt(avgX ** 2 + avgY ** 2 + avgZ ** 2)
  ez3 = avgZ / Math.sqrt(avgX ** 2 + avgY ** 2 + avgZ ** 2)
}

function _calculateOrientationXY(){
  let maxCrossProduct = 0
  let iPeak = null
  for (let i = 0; i < measurementMem1.length; i++) {
    let crossX = ez2 * measurementMem3[i] - ez3 * measurementMem2[i]
    let crossY = ez3 * measurementMem1[i] - ez1 * measurementMem3[i]
    let crossZ = ez1 * measurementMem2[i] - ez2 * measurementMem1[i]
    if (crossX ** 2 + crossY ** 2 + crossZ ** 2 > maxCrossProduct) {
      iPeak = i
      maxCrossProduct = crossX ** 2 + crossY ** 2 + crossZ ** 2
    }
  }
  let x = ez2 * measurementMem3[iPeak] - ez3 * measurementMem2[iPeak]
  let y = ez3 * measurementMem1[iPeak] - ez1 * measurementMem3[iPeak]
  let z = ez1 * measurementMem2[iPeak] - ez2 * measurementMem1[iPeak]
  ey1 = x / Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  ey2 = y / Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  ey3 = z / Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  ex1 = ey2 * ez3 - ey3 * ez2
  ex2 = ey3 * ez1 - ey1 * ez3
  ex3 = ey1 * ez2 - ey2 * ez1
  let minDotProduct = 0
  let maxDotProduct = 0
  let iPeakMin = null
  let iPeakMax = null
  for (let i = 0; i < measurementMem1.length; i++) {
    let dotProduct = ex1 * measurementMem1[i] + ex2 * measurementMem2[i] + ex3 * measurementMem3[i]
    if (dotProduct < minDotProduct) {
      minDotProduct = dotProduct
      iPeakMin = i
    } else if (dotProduct > maxDotProduct) {
      maxDotProduct = dotProduct
      iPeakMax = i
    }
  }
  if (iPeakMin < iPeakMax) {
    ex1 = - ex1
    ex2 = - ex2
    ex3 = - ex3
    ey1 = - ey1
    ey2 = - ey2
    ey3 = - ey3
  }
}

function _changeDiagramRange(max){
  diagram.max = max
  localStorage.setItem("diagramRange", max)
}

/* ====================================
    Utilities
===================================== */

function roundNum(v,n){
  let order = Math.pow(10, n)
  return Math.round(order * v)/order
}

function avgArr(arr){
  let sum = 0
  arr.forEach(function(elm){
    sum += elm
  })
  return sum / arr.length
}
