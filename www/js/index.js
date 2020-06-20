"use strict";
var platform
var dt = 0.01
var prevTime = 0
var ax0, ay0, az0 // Raw sensor acceleration without gravity
var gx0 = 0, gy0 = 0, gz0 = 0 // Raw sensor acceleration with graviry
var reverseFactor = 1.0 // Must be changed to -1.0 in iOS
var ox0, oy0, oz0 // Raw sensor rotation speed
var alpha, beta, gamma // Raw sensor orientation
var ex1 = 1, ex2 = 0, ex3 = 0 // Direction cosine of X
var ey1 = 0, ey2 = 1, ey3 = 0 // Direction cosine of Y
var ez1 = 0, ez2 = 0, ez3 = 1 // Direction cosine of Z
var ax, ay
var diagram
var interval
var measurementMem1 = [] // measurement buffer for general use
var measurementMem2 = []
var measurementMem3 = []
var measurementMem4 = []
var measurementMode = null // 1: Z-calibration, 2: X-calibration
var buf = [] // buffer for most recent data in realtime
var nBuf = 2000
var startedAt // Start time of a measurement
var recording = false // Boolean flag indicating whether it is recording
var dataHeaders
var selectedLogTimestamp
var pinnedLogTimeStamp
var realtimeMonitoring = true
var driverName
var vehicleName
var previewEach // Boolean option
var filterStrength = 0.15

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
  $(window).on("unload", function(e){
  })
  window.addEventListener("devicemotion", _handleDeviceMotion, true)
  window.addEventListener("deviceorientation", _handleDeviceOrientation, true)

  if (window.plugins && window.plugins.insomnia) window.plugins.insomnia.keepAwake()

  // Check Local Storage
  diagram = new Diagram(document.getElementById("diagramCanvas"))
  if (!localStorage.getItem("termsAgreed")){
    alert("【使用上の注意】公道を走行中の画面操作・画面注視は法令違反です。法令を遵守してご使用下さい。")
    localStorage.setItem("termsAgreed", true)
  }

  diagram.max = getLocalStorage("diagramRange", 10)
  $('#diagramRangeSelect').val(diagram.max)
  driverName = getLocalStorage("driverName", "Unknown")
  $('#driverNameInput').val(driverName)
  vehicleName = getLocalStorage("vehicleName", "Unknown")
  $('#vehicleNameInput').val(vehicleName)
  diagram.reverse = getLocalStorage("reverseAxis", false)
  $('#reverseAxisCheckbox').prop('checked', diagram.reverse)
  previewEach = getLocalStorage("previewEach", false)
  $('#previewEachCheckbox').prop('checked', previewEach)
  filterStrength = getLocalStorage("filterStrength", 0.15)
  $('#filterStrengthSelect').val(filterStrength)

  let h = getLocalStorage("directionVector", null)
  if (h) {
    ex1 = h.ex1; ex2 = h.ex2; ex3 = h.ex3
    ey1 = h.ey1; ey2 = h.ey2; ey3 = h.ey3
    ez1 = h.ez1; ez2 = h.ez2; ez3 = h.ez3
  }

  dataHeaders = getLocalStorage("dataHeaders", [])
  _resize()

  tappablize($("button"))
  tappablize($("[tappable=true]"))
  tappablize($("label"))

  // Measure values on interval
  setInterval(function(){
    if (ox0 == null) return
    if (measurementMode == 1 || measurementMode == 3) {
      measurementMem1.push(gx0)
      measurementMem2.push(gy0)
      measurementMem3.push(gz0)
      if (measurementMode == 3) measurementMem4.push(Date.now())
    }
    let timeStamp = Date.now()

    ax = ex1 * gx0 + ex2 * gy0 + ex3 * gz0
    ay = ey1 * gx0 + ey2 * gy0 + ey3 * gz0
    if (realtimeMonitoring) {
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
      str += timeStamp + "\n"
      str += ox0.toFixed(2) + "\n"
      str += oy0.toFixed(2) + "\n"
      str += oz0.toFixed(2) + "\n"
      str += alpha.toFixed(2) + "\n"
      str += beta.toFixed(2) + "\n"
      str += gamma.toFixed(2) + "\n"
      str += interval + "\n"
      //_showLog(str)
    }
    buf.push(new State(ax, ay, timeStamp))
    if (buf.length > nBuf) buf.shift()
  }, 1000 * dt)
})

/* ====================================
    On deviceready
===================================== */

function onDeviceReady(){
  if (cordova.platformId == 'android') platform = 'Android'
  else if (cordova.platformId == 'ios') platform = 'iOS'
  else if (cordova.windowsId == 'windows') platform = 'Windows'
  if (platform == 'Android') AndroidFullScreen.immersiveMode()
  else if (platform == 'iOS') reverseFactor = -1.0
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
  gx0 = (1 - filterStrength) * gx0 + filterStrength * reverseFactor * e.accelerationIncludingGravity.x // Low-pass filter
  gy0 = (1 - filterStrength) * gy0 + filterStrength * reverseFactor * e.accelerationIncludingGravity.y // Low-pass filter
  gz0 = (1 - filterStrength) * gz0 + filterStrength * reverseFactor * e.accelerationIncludingGravity.z // Low-pass filter
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

function _showLog(str){
  $('#logArea').val(str)
}

function _showPage(pageName){
  if (recording) return
  $('.page').hide()
  $('#page' + pageName).show()
}

function _clearMeasurement(){
  measurementMem1 = []
  measurementMem2 = []
  measurementMem3 = []
  measurementMem4 = []
}

function _changeDiagramRange(max){
  diagram.max = max
  localStorage.setItem("diagramRange", max)
  if (!realtimeMonitoring) diagram.visualizeRecords()
}

function _recordButtonClick(){
  if (recording) {
    $('#recordButton').css('background', '#292').html("<i class='fa fa-circle fa-fw'></i>記録開始")
    recording = false
    let endedAt = Date.now()
    let measurement = new Measurement(startedAt, endedAt)
    let genuineStartedAt = null
    for (let i = 0; i < buf.length; i++){
      if (buf[i].t >= startedAt) {
        if (genuineStartedAt == null) genuineStartedAt = buf[i].t
        measurement.addState(new State(buf[i].ax, buf[i].ay, buf[i].t - genuineStartedAt))
      }
    }
    dataHeaders.unshift({startedAt: genuineStartedAt || startedAt, endedAt: endedAt, driver: driverName, vehicle: vehicleName})
    writeDataHeaders()
    localStorage.setItem("data_" + endedAt, JSON.stringify(measurement))
    if (previewEach) {
      diagram.loadData(endedAt)
      diagram.visualizeRecords()
    }
  } else {
    toggleRealtime(true)
    startedAt = Date.now()
    $('#recordButton').css('background', '#a22').html("<span style='font-size:0.5em'>記録中...</span><br><i class='fa fa-stop fa-fw'></i>終了")
    recording = true
  }
}

/* ====================================
    Log page
===================================== */

function _refreshLogTable(){
  let tbody = $('#logTable').find('tbody')
  tbody.empty()
  dataHeaders.forEach(function(header){
    let date = moment(header.endedAt)
    date.locale('ja')
    tbody.append(
      "<tr data-timestamp='" + header.endedAt + "'>" +
      "<td class='center'>" + (header.endedAt == pinnedLogTimeStamp ? "<i class='fa fa-thumb-tack' style='color:limegreen'></i><br>" : "") + (header.locked ? "<i class='fa fa-lock'></i>" : "") + "</td>" +
      "<td class='small'>" + date.format('YYYY-MM-DD') + "<br>" + date.format('hh:mm:ss') + " (" + date.fromNow() + ")</td>" +
      "<td class='small'>" + header.driver + "<br>" + header.vehicle + "</td>" +
      "<td class='right'>" + Math.round((header.endedAt - header.startedAt)/100)/10 + "</td>" +
      "</tr>"
    )
  })
  tbody.find('tr').on('touchstart', function(){
    tbody.find('tr').removeClass('row-selected')
    $(this).addClass('row-selected')
    selectedLogTimestamp = $(this).data('timestamp')
    diagram.loadData(selectedLogTimestamp)
    diagram.visualizeRecords()
  })
  selectedLogTimestamp = null
}

function _logPinButtonClick(){
  if (selectedLogTimestamp == null) return
  if (pinnedLogTimeStamp == selectedLogTimestamp) {
    pinnedLogTimeStamp = null
    diagram.loadData(null, true)
  } else {
    pinnedLogTimeStamp = selectedLogTimestamp
    diagram.loadData(null)
    diagram.loadData(pinnedLogTimeStamp, true)
  }
  _refreshLogTable()
  diagram.visualizeRecords()
}

function _logDeleteButtonClick(){
  if (selectedLogTimestamp == null) return
  _deleteLog(selectedLogTimestamp, true)
  _refreshLogTable()
}

function _logLockButtonClick(){
  if (selectedLogTimestamp == null) return
  let i = findIndexInDataHeadersFromTimestamp(selectedLogTimestamp)
  if (i == null) return
  if (dataHeaders[i].locked) {
    delete dataHeaders[i].locked
  } else {
    dataHeaders[i].locked = true
  }
  writeDataHeaders()
  _refreshLogTable()
}

function _deleteLog(endedAt, warn = false){
  // warn: Stop deleting with an alert if the item is locked
  let i = findIndexInDataHeadersFromTimestamp(endedAt)
  if (i == null) return
  if (warn && dataHeaders[i].locked){
    alert('このデータはロックされているため削除できません')
    return
  }
  dataHeaders.splice(i, 1)
  writeDataHeaders()
  localStorage.removeItem("data_" + endedAt)
}

function writeDataHeaders(){
  localStorage.setItem("dataHeaders", JSON.stringify(dataHeaders))
}

function findIndexInDataHeadersFromTimestamp(endedAt){
  let iFound = null
  for (let i = 0; i < dataHeaders.length; i++){
    if (dataHeaders[i].endedAt == endedAt){
      iFound = i
      break
    }
  }
  return iFound
}

function _animateRecordButtonClick(){
  diagram.animateRecords()
}

function toggleRealtime(bool){
  // bool: Realtime mode ON or OFF
  if (bool) {
    realtimeMonitoring = true
    diagram.stopAnimation()
    $('#animateRecordButton').hide()
    $('#backToRealtimeButton').hide()
  } else {
    realtimeMonitoring = false
    $('#animateRecordButton').show()
    $('#backToRealtimeButton').show()
  }
}

function _backToRealtimeButtonClick(){
  toggleRealtime(true)
}

/* ====================================
    Option page
===================================== */

function _driverNameChange(elem){
  driverName = $(elem).val()
  localStorage.setItem("driverName", driverName)
}

function _vehicleNameChange(elem){
  vehicleName = $(elem).val()
  localStorage.setItem("vehicleName", vehicleName)
}

function _toggleReverseAxis(checked){
  diagram.reverse = checked
  localStorage.setItem("reverseAxis", checked)
  if (!realtimeMonitoring) diagram.visualizeRecords()
}

function _togglePreviewEach(checked){
  previewEach = checked
  localStorage.setItem("previewEach", checked)
}

function _changeFilterStrength(v){
  filterStrength = v
  localStorage.setItem("filterStrength", filterStrength)
}

/* ====================================
    Calibration
===================================== */

// キャリブレーションの各工程の処理を書くfunction
function _calibrationStep(n){
  $('#calibrationBox').children('div').hide()
  if (n==0 && !recording) {
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
  } else if (n==-1) { // Cancel
    $('#controlBox').show()
    $('#calibrationBox').hide()
  }
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

function getLocalStorage(key, initial){
  let tmp = localStorage.getItem(key)
  if (tmp) {
    try {
      return JSON.parse(tmp)
    } catch { // When it is just a string
      if (tmp == "true") return true
      else if (tmp == "false") return false
      else return tmp // Return the string itself
    }
  } else {
    return initial
  }
}

function tappablize(elem, strict = true){
  // elem: jQuery element
  elem.on('touchstart', function(e){
    if (platform == 'iOS') e.preventDefault()
  })
  elem.on('touchend', function(e){
    e.preventDefault()
    e.stopPropagation()
    let elm = $(e.target)
    let x = e.originalEvent.changedTouches[0].clientX
    let y = e.originalEvent.changedTouches[0].clientY
    if (!strict || (x >= elm.offset().left && x <= elm.offset().left + elm.width() && y >= elm.offset().top && y <= elm.offset().top + elm.height())) elm.click()
  })
}
