export interface Level {
  id: number
  name: string
}

export interface Grade {
  id: number
  name: string
  levelId: number
  levelName: string
}

export interface Parallel {
  id: number
  name: string
}

export interface Subject {
  id: string
  name: string
  area: string
  active: boolean
}
