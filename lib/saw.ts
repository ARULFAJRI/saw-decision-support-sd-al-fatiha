import { Criterion, Student, StudentScore, EvaluationResult } from "./storage";

export interface SAWInput {
  students: Student[];
  criteria: Criterion[];
  scores: StudentScore[];
}

export interface SAWOutput {
  results: EvaluationResult[];
  normalizedMatrix: number[][];
  weightedMatrix: number[][];
}

export class SAWAlgorithm {
  /**
   * Normalize the decision matrix
   * For benefit criteria: (value - min) / (max - min)
   * For cost criteria: (max - value) / (max - min)
   */
  private static normalizeMatrix(
    matrix: number[][],
    criteria: Criterion[]
  ): number[][] {
    const normalizedMatrix: number[][] = [];
    const criteriaCount = criteria.length;

    for (let j = 0; j < criteriaCount; j++) {
      const column = matrix.map(row => row[j]);
      const max = Math.max(...column);
      const min = Math.min(...column);
      const criterion = criteria[j];

      // Handle case where max equals min (all values are the same)
      if (max === min) {
        // Use 0.5 for all values when they're identical
        for (let i = 0; i < matrix.length; i++) {
          if (!normalizedMatrix[i]) {
            normalizedMatrix[i] = new Array(criteriaCount);
          }
          normalizedMatrix[i][j] = 0.5;
        }
      } else {
        for (let i = 0; i < matrix.length; i++) {
          if (!normalizedMatrix[i]) {
            normalizedMatrix[i] = new Array(criteriaCount);
          }

          if (criterion.type === "benefit") {
            normalizedMatrix[i][j] = (matrix[i][j] - min) / (max - min);
          } else {
            normalizedMatrix[i][j] = (max - matrix[i][j]) / (max - min);
          }
        }
      }
    }

    return normalizedMatrix;
  }

  /**
   * Apply weights to the normalized matrix
   */
  private static applyWeights(
    normalizedMatrix: number[][],
    criteria: Criterion[]
  ): number[][] {
    const weightedMatrix: number[][] = [];

    for (let i = 0; i < normalizedMatrix.length; i++) {
      weightedMatrix[i] = [];
      for (let j = 0; j < criteria.length; j++) {
        weightedMatrix[i][j] = normalizedMatrix[i][j] * criteria[j].weight;
      }
    }

    return weightedMatrix;
  }

  /**
   * Calculate final scores and rankings
   */
  private static calculateScoresAndRankings(
    weightedMatrix: number[][],
    students: Student[]
  ): EvaluationResult[] {
    const results: EvaluationResult[] = [];

    // Calculate total scores
    const scoredResults = weightedMatrix.map((row, index) => ({
      index,
      totalScore: row.reduce((sum, value) => sum + value, 0),
      student: students[index],
    }));

    // Sort by total score (descending)
    scoredResults.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // Tiebreaker: use student name alphabetically
      return a.student.name.localeCompare(b.student.name);
    });

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < scoredResults.length; i++) {
      const result = scoredResults[i];

      // Check for ties with previous result
      if (i > 0 && Math.abs(result.totalScore - scoredResults[i - 1].totalScore) < 0.0001) {
        result.totalScore = scoredResults[i - 1].totalScore;
      } else {
        currentRank = i + 1;
      }

      results.push({
        id: result.student.id,
        name: result.student.name,
        scores: {}, // Will be filled in with the original scores
        totalScore: Math.round(result.totalScore * 10000) / 10000, // Round to 4 decimal places
        rank: currentRank,
      });
    }

    return results;
  }

  /**
   * Main SAW calculation method
   */
  static calculate(input: SAWInput): SAWOutput {
    const { students, criteria, scores } = input;

    // Validate input
    if (students.length === 0) {
      throw new Error("No students provided");
    }

    if (criteria.length === 0) {
      throw new Error("No criteria provided");
    }

    if (scores.length !== students.length * criteria.length) {
      throw new Error(
        `Invalid number of scores. Expected ${students.length * criteria.length}, got ${scores.length}`
      );
    }

    // Validate criteria weights sum to 1
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error(`Criteria weights must sum to 1. Current sum: ${totalWeight.toFixed(3)}`);
    }

    // Build decision matrix
    const matrix: number[][] = [];
    for (let i = 0; i < students.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < criteria.length; j++) {
        const score = scores.find(
          s => s.studentId === students[i].id && s.criterionId === criteria[j].id
        );
        if (!score) {
          throw new Error(
            `Missing score for student ${students[i].name} and criterion ${criteria[j].name}`
          );
        }
        matrix[i][j] = score.score;
      }
    }

    // Apply SAW algorithm
    const normalizedMatrix = this.normalizeMatrix(matrix, criteria);
    const weightedMatrix = this.applyWeights(normalizedMatrix, criteria);
    const results = this.calculateScoresAndRankings(weightedMatrix, students);

    // Fill in individual scores for each result
    results.forEach((result, i) => {
      criteria.forEach((criterion, j) => {
        const score = scores.find(
          s => s.studentId === students[i].id && s.criterionId === criterion.id
        );
        if (score) {
          result.scores[criterion.id] = score.score;
        }
      });
    });

    return {
      results,
      normalizedMatrix,
      weightedMatrix,
    };
  }

  /**
   * Validate scores before calculation
   */
  static validateScores(scores: StudentScore[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for negative scores
    const negativeScores = scores.filter(s => s.score < 0);
    if (negativeScores.length > 0) {
      errors.push("Scores cannot be negative");
    }

    // Check for NaN or invalid scores
    const invalidScores = scores.filter(s => isNaN(s.score) || !isFinite(s.score));
    if (invalidScores.length > 0) {
      errors.push("Scores must be valid numbers");
    }

    // Check for extremely large scores (potential data entry errors)
    const largeScores = scores.filter(s => s.score > 1000000);
    if (largeScores.length > 0) {
      errors.push("Scores appear to be unusually large");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get calculation summary for debugging
   */
  static getCalculationSummary(input: SAWInput): {
    studentsCount: number;
    criteriaCount: number;
    scoresCount: number;
    totalWeight: number;
    benefitCriteria: string[];
    costCriteria: string[];
  } {
    const { students, criteria, scores } = input;

    return {
      studentsCount: students.length,
      criteriaCount: criteria.length,
      scoresCount: scores.length,
      totalWeight: criteria.reduce((sum, c) => sum + c.weight, 0),
      benefitCriteria: criteria.filter(c => c.type === "benefit").map(c => c.name),
      costCriteria: criteria.filter(c => c.type === "cost").map(c => c.name),
    };
  }
}