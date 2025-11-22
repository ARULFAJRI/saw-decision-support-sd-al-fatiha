"use client";

import { useState, useEffect } from "react";
import { StorageService, Student, Criterion, StudentScore, Evaluation, EvaluationResult } from "@/lib/storage";
import { SAWAlgorithm, SAWInput } from "@/lib/saw";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Progress,
} from "@/components/ui/progress";
import { Calculator, Plus, Save, Trophy, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const evaluationSchema = z.object({
  name: z.string().min(1, "Nama evaluasi wajib diisi"),
  description: z.string().optional(),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

export default function Evaluation() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEvaluating, setIsDialogOpen] = useState(false);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [calculating, setCalculating] = useState(false);
  const [currentResults, setCurrentResults] = useState<EvaluationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const studentsData = StorageService.getStudents();
      const criteriaData = StorageService.getCriteria();
      const evaluationsData = StorageService.getEvaluations();

      setStudents(studentsData);
      setCriteria(criteriaData);
      setEvaluations(evaluationsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCriteriaValidation = () => {
    if (criteria.length === 0) {
      return { isValid: false, message: "Belum ada kriteria yang ditetapkan" };
    }

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      return {
        isValid: false,
        message: `Total bobot kriteria harus sama dengan 1 (saat ini: ${totalWeight.toFixed(3)})`,
      };
    }

    return { isValid: true, message: "Kriteria valid untuk evaluasi" };
  };

  const handleStartEvaluation = () => {
    const validation = getCriteriaValidation();
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (students.length === 0) {
      setError("Tidak ada data siswa untuk dievaluasi");
      return;
    }

    setError(null);
    setScores({});
    setCurrentResults(null);
    setIsEvaluating(true);
  };

  const handleScoreChange = (studentId: string, criterionId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const key = `${studentId}-${criterionId}`;
    setScores(prev => ({ ...prev, [key]: numValue }));
  };

  const handleCalculateSAW = async () => {
    try {
      setCalculating(true);
      setError(null);

      // Validate scores
      const studentScores: StudentScore[] = [];
      for (const student of students) {
        for (const criterion of criteria) {
          const key = `${student.id}-${criterion.id}`;
          const score = scores[key];

          if (score === undefined || score === null) {
            throw new Error(`Skor untuk ${student.name} pada kriteria ${criterion.name} belum diisi`);
          }

          studentScores.push({
            studentId: student.id,
            criterionId: criterion.id,
            score,
          });
        }
      }

      // Validate scores format
      const validation = SAWAlgorithm.validateScores(studentScores);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Calculate SAW
      const input: SAWInput = {
        students,
        criteria,
        scores: studentScores,
      };

      const output = SAWAlgorithm.calculate(input);
      setCurrentResults(output.results);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan dalam perhitungan SAW");
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveEvaluation = (data: EvaluationFormData) => {
    try {
      if (!currentResults || currentResults.length === 0) {
        setError("Tidak ada hasil evaluasi untuk disimpan");
        return;
      }

      const evaluation: Evaluation = {
        name: data.name,
        description: data.description,
        criteria: [...criteria],
        results: currentResults,
      };

      const savedEvaluation = StorageService.saveEvaluation(evaluation);
      setEvaluations(prev => [savedEvaluation, ...prev]);

      setIsDialogOpen(false);
      form.reset();
      setIsEvaluating(false);
      setCurrentResults(null);
      setScores({});

    } catch (error) {
      setError(error instanceof Error ? error.message : "Gagal menyimpan evaluasi");
    }
  };

  const criteriaValidation = getCriteriaValidation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat data evaluasi...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="guru">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evaluasi Siswa</h1>
            <p className="text-muted-foreground">
              Lakukan evaluasi siswa menggunakan metode SAW (Simple Additive Weighting)
            </p>
          </div>
          <Button onClick={handleStartEvaluation} disabled={!criteriaValidation.isValid || students.length === 0}>
            <Calculator className="mr-2 h-4 w-4" />
            Mulai Evaluasi Baru
          </Button>
        </div>

        {/* Validation Messages */}
        {!criteriaValidation.isValid && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {criteriaValidation.message}
            </AlertDescription>
          </Alert>
        )}

        {students.length === 0 && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada data siswa. Tambahkan siswa terlebih dahulu untuk melakukan evaluasi.
            </AlertDescription>
          </Alert>
        )}

        {/* Previous Evaluations */}
        {evaluations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Riwayat Evaluasi
              </CardTitle>
              <CardDescription>
                {evaluations.length} evaluasi telah dilakukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{evaluation.name}</h4>
                      <Badge variant="outline">
                        {new Date(evaluation.createdAt).toLocaleDateString("id-ID")}
                      </Badge>
                    </div>
                    {evaluation.description && (
                      <p className="text-sm text-muted-foreground mb-2">{evaluation.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{evaluation.results.length} siswa dievaluasi</span>
                      <span>{evaluation.criteria.length} kriteria</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Evaluation Dialog */}
        <Dialog open={isEvaluating} onOpenChange={setIsEvaluating}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Evaluasi Siswa dengan Metode SAW</DialogTitle>
              <DialogDescription>
                Masukkan skor untuk setiap siswa pada setiap kriteria yang telah ditetapkan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Criteria Summary */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-3">Ringkasan Kriteria</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="text-sm">
                      <div className="font-medium">{criterion.name}</div>
                      <div className="text-muted-foreground">
                        {criterion.type === "benefit" ? "Benefit" : "Cost"} • {(criterion.weight * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scores Input */}
              <div className="space-y-4">
                <h4 className="font-semibold">Input Skor Siswa</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Siswa</TableHead>
                        {criteria.map((criterion) => (
                          <TableHead key={criterion.id} className="min-w-[120px]">
                            {criterion.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          {criteria.map((criterion) => {
                            const key = `${student.id}-${criterion.id}`;
                            return (
                              <TableCell key={criterion.id}>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  value={scores[key] || ""}
                                  onChange={(e) => handleScoreChange(student.id, criterion.id, e.target.value)}
                                  className="w-full"
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Results Display */}
              {currentResults && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Hasil Perhitungan SAW</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peringkat</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Total Skor</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentResults.map((result, index) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                #{result.rank}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>{result.totalScore.toFixed(4)}</TableCell>
                            <TableCell className="text-right">
                              {index === 0 && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <Trophy className="mr-1 h-3 w-3" />
                                  Terbaik
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Save Evaluation Form */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Simpan Hasil Evaluasi</h4>
                    <form onSubmit={form.handleSubmit(handleSaveEvaluation)} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="evalName">Nama Evaluasi</Label>
                        <Input
                          id="evalName"
                          {...form.register("name")}
                          placeholder="Contoh: Evaluasi Semester Ganjil 2024"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="evalDescription">Deskripsi (Opsional)</Label>
                        <Textarea
                          id="evalDescription"
                          {...form.register("description")}
                          placeholder="Jelaskan konteks evaluasi ini"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Evaluasi
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEvaluating(false)}
                        >
                          Tutup
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!currentResults && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCalculateSAW}
                    disabled={calculating}
                    className="flex-1"
                  >
                    {calculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menghitung...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Hitung SAW
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEvaluating(false)}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}