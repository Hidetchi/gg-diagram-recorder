"use strict"
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
