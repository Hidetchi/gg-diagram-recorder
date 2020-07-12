
"use strict"

class SoundPlayer{
  constructor(){
    this.threshold = 2
    this.loadChannels()
  }

  loadChannels(){
    this._channels = [
      new Audio('sound/voice1/number_00.mp3'),
      new Audio('sound/voice1/number_01.mp3'),
      new Audio('sound/voice1/number_02.mp3'),
      new Audio('sound/voice1/number_03.mp3'),
      new Audio('sound/voice1/number_04.mp3'),
      new Audio('sound/voice1/number_05.mp3'),
      new Audio('sound/voice1/number_06.mp3'),
      new Audio('sound/voice1/number_07.mp3'),
      new Audio('sound/voice1/number_08.mp3'),
      new Audio('sound/voice1/number_09.mp3'),
      new Audio('sound/voice1/number_10.mp3')
    ]
  }

  sayNumber(n){
    if (n < this.threshold || n > 10) return
    let ch = this._channels[n]
    ch.currentTime = 0
    ch.play()
  }
}
