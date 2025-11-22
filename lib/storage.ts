"use client";

// Types for the SAW Decision Support System
export interface Student {
  id: string;
  name: string;
  class: string;
  nis: string; // Nomor Induk Siswa
  createdAt: string;
}

export interface Criterion {
  id: string;
  name: string;
  weight: number; // 0-1 range
  type: "benefit" | "cost";
  description?: string;
  createdAt: string;
}

export interface StudentScore {
  studentId: string;
  criterionId: string;
  score: number;
}

export interface EvaluationResult {
  id: string;
  name: string;
  scores: { [criterionId: string]: number };
  totalScore: number;
  rank: number;
}

export interface Evaluation {
  id: string;
  name: string;
  description?: string;
  criteria: Criterion[];
  results: EvaluationResult[];
  createdAt: string;
}

// Storage keys
const STORAGE_KEYS = {
  STUDENTS: "saw_students",
  CRITERIA: "saw_criteria",
  EVALUATIONS: "saw_evaluations",
} as const;

// Storage service class
export class StorageService {
  // Generic methods
  private static getFromStorage<T>(key: string): T[] {
    if (typeof window === "undefined") return [];

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return [];
    }
  }

  private static saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // Student methods
  static getStudents(): Student[] {
    return this.getFromStorage<Student>(STORAGE_KEYS.STUDENTS);
  }

  static saveStudent(student: Omit<Student, "id" | "createdAt">): Student {
    const students = this.getStudents();
    const newStudent: Student = {
      ...student,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    students.push(newStudent);
    this.saveToStorage(STORAGE_KEYS.STUDENTS, students);
    return newStudent;
  }

  static updateStudent(id: string, updates: Partial<Omit<Student, "id" | "createdAt">>): Student | null {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);

    if (index === -1) return null;

    students[index] = { ...students[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.STUDENTS, students);
    return students[index];
  }

  static deleteStudent(id: string): boolean {
    const students = this.getStudents();
    const filteredStudents = students.filter(s => s.id !== id);

    if (filteredStudents.length === students.length) return false;

    this.saveToStorage(STORAGE_KEYS.STUDENTS, filteredStudents);
    return true;
  }

  // Criteria methods
  static getCriteria(): Criterion[] {
    return this.getFromStorage<Criterion>(STORAGE_KEYS.CRITERIA);
  }

  static saveCriterion(criterion: Omit<Criterion, "id" | "createdAt">): Criterion {
    const criteria = this.getCriteria();
    const newCriterion: Criterion = {
      ...criterion,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    criteria.push(newCriterion);
    this.saveToStorage(STORAGE_KEYS.CRITERIA, criteria);
    return newCriterion;
  }

  static updateCriterion(id: string, updates: Partial<Omit<Criterion, "id" | "createdAt">>): Criterion | null {
    const criteria = this.getCriteria();
    const index = criteria.findIndex(c => c.id === id);

    if (index === -1) return null;

    criteria[index] = { ...criteria[index], ...updates };
    this.saveToStorage(STORAGE_KEYS.CRITERIA, criteria);
    return criteria[index];
  }

  static deleteCriterion(id: string): boolean {
    const criteria = this.getCriteria();
    const filteredCriteria = criteria.filter(c => c.id !== id);

    if (filteredCriteria.length === criteria.length) return false;

    this.saveToStorage(STORAGE_KEYS.CRITERIA, filteredCriteria);
    return true;
  }

  // Evaluation methods
  static getEvaluations(): Evaluation[] {
    return this.getFromStorage<Evaluation>(STORAGE_KEYS.EVALUATIONS);
  }

  static saveEvaluation(evaluation: Omit<Evaluation, "id" | "createdAt">): Evaluation {
    const evaluations = this.getEvaluations();
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    evaluations.push(newEvaluation);
    this.saveToStorage(STORAGE_KEYS.EVALUATIONS, evaluations);
    return newEvaluation;
  }

  static deleteEvaluation(id: string): boolean {
    const evaluations = this.getEvaluations();
    const filteredEvaluations = evaluations.filter(e => e.id !== id);

    if (filteredEvaluations.length === evaluations.length) return false;

    this.saveToStorage(STORAGE_KEYS.EVALUATIONS, filteredEvaluations);
    return true;
  }

  // Utility methods
  static validateCriteriaWeights(): { isValid: boolean; message?: string } {
    const criteria = this.getCriteria();

    if (criteria.length === 0) {
      return { isValid: false, message: "No criteria found" };
    }

    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

    if (Math.abs(totalWeight - 1) > 0.001) {
      return {
        isValid: false,
        message: `Total weight must equal 1. Current total: ${totalWeight.toFixed(3)}`
      };
    }

    return { isValid: true };
  }

  static exportData(): {
    students: Student[];
    criteria: Criterion[];
    evaluations: Evaluation[];
  } {
    return {
      students: this.getStudents(),
      criteria: this.getCriteria(),
      evaluations: this.getEvaluations(),
    };
  }

  static importData(data: {
    students?: Student[];
    criteria?: Criterion[];
    evaluations?: Evaluation[];
  }): void {
    if (data.students) {
      this.saveToStorage(STORAGE_KEYS.STUDENTS, data.students);
    }
    if (data.criteria) {
      this.saveToStorage(STORAGE_KEYS.CRITERIA, data.criteria);
    }
    if (data.evaluations) {
      this.saveToStorage(STORAGE_KEYS.EVALUATIONS, data.evaluations);
    }
  }

  static clearAllData(): void {
    if (typeof window === "undefined") return;

    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}