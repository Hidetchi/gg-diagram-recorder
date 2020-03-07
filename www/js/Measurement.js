"use strict"

// Measurementクラス
// 1つの記録データ一式を格納するオブジェクト。
// this.data[]に、記録されたStateの配列を格納。

class Measurement{
  constructor(startedAt, endedAt){
    this.startedAt = startedAt
    this.endedAt = endedAt
    this.data = []
  }

  addState(state){
    this.data.push(state)
  }

}
