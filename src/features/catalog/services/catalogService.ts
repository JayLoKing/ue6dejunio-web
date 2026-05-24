import { httpClient } from "@/lib/axios"

import { CatalogUrl } from "../helpers/catalogServicePath"
import type {
  GradeItem,
  ParallelItem,
  SubjectItem,
  TeacherItem,
} from "../types"

export class CatalogService {
  static async grades(): Promise<GradeItem[]> {
    const { data } = await httpClient.get<GradeItem[]>(CatalogUrl.Grades)
    return data
  }
  static async parallels(): Promise<ParallelItem[]> {
    const { data } = await httpClient.get<ParallelItem[]>(CatalogUrl.Parallels)
    return data
  }
  static async subjects(): Promise<SubjectItem[]> {
    const { data } = await httpClient.get<SubjectItem[]>(CatalogUrl.Subjects)
    return data
  }
  static async teachers(): Promise<TeacherItem[]> {
    const { data } = await httpClient.get<TeacherItem[]>(CatalogUrl.Teachers)
    return data
  }
}
