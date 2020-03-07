"use strict"

// Stateクラス
// ある時刻における、計測対象の物理量一式を格納するオブジェクト

class State{
  constructor(ax, ay, t) {
    this.ax = ax // X-acceleration
    this.ay = ay // Y-acceleration
    this.t = t // Timestamp
  }
}
