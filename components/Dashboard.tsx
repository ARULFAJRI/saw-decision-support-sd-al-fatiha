"use client";

import { useState, useEffect } from "react";
import { StorageService, Student, Criterion, Evaluation } from "@/lib/storage";
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
  Progress,
} from "@/components/ui/progress";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Button,
} from "@/components/ui/button";
import {
  Users,
  Settings,
  Calculator,
  FileText,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalCriteriaWeight = () => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  };

  const getLatestEvaluation = () => {
    return evaluations.length > 0 ? evaluations[0] : null;
  };

  const getTopStudent = () => {
    if (evaluations.length === 0) return null;
    const latest = evaluations[0];
    return latest.results.find(r => r.rank === 1) || null;
  };

  const getSystemStatus = () => {
    const issues = [];
    if (students.length === 0) issues.push("Belum ada data siswa");
    if (criteria.length === 0) issues.push("Belum ada data kriteria");
    if (criteria.length > 0 && Math.abs(getTotalCriteriaWeight() - 1) > 0.001) {
      issues.push("Total bobot kriteria tidak valid");
    }

    if (issues.length === 0) return { status: "ready", message: "Sistem siap digunakan" };
    return { status: "warning", message: issues.join(", ") };
  };

  const systemStatus = getSystemStatus();
  const latestEvaluation = getLatestEvaluation();
  const topStudent = getTopStudent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Selamat datang, {user?.name || "Pengguna"}!
          </h1>
          <p className="text-muted-foreground">
            Sistem Pendukung Keputusan Penilaian Siswa Terbaik Metode SAW
          </p>
        </div>

        {/* System Status */}
        <Card className={systemStatus.status === "warning" ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {systemStatus.status === "ready" ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Status Sistem
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Perhatian
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{systemStatus.message}</p>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                {students.length === 0 ? "Belum ada data" : "Siswa terdaftar"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kriteria</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criteria.length}</div>
              <p className="text-xs text-muted-foreground">
                {criteria.length === 0 ? "Belum ada data" : "Kriteria penilaian"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluasi Selesai</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{evaluations.length}</div>
              <p className="text-xs text-muted-foreground">
                {evaluations.length === 0 ? "Belum ada evaluasi" : "Evaluasi selesai"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siswa Terbaik</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topStudent ? topStudent.name : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {topStudent ? `Skor: ${topStudent.totalScore.toFixed(4)}` : "Belum ada evaluasi"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Criteria Weight Status */}
        {criteria.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status Bobot Kriteria</CardTitle>
              <CardDescription>
                Total bobot harus sama dengan 1 (100%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Bobot</span>
                  <span className="text-sm font-bold">
                    {getTotalCriteriaWeight().toFixed(3)} / 1.000
                  </span>
                </div>
                <Progress
                  value={Math.min(getTotalCriteriaWeight() * 100, 100)}
                  className="h-2"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${criterion.type === "benefit" ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-sm">{criterion.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(criterion.weight * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest Evaluation */}
        {latestEvaluation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Evaluasi Terbaru
              </CardTitle>
              <CardDescription>
                {new Date(latestEvaluation.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{latestEvaluation.name}</h4>
                  {latestEvaluation.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {latestEvaluation.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-lg font-bold">{latestEvaluation.results.length}</div>
                    <div className="text-xs text-muted-foreground">Siswa Dievaluasi</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-lg font-bold">{latestEvaluation.criteria.length}</div>
                    <div className="text-xs text-muted-foreground">Kriteria Digunakan</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-lg font-bold">
                      {latestEvaluation.results.find(r => r.rank === 1)?.totalScore.toFixed(4) || "0"}
                    </div>
                    <div className="text-xs text-muted-foreground">Skor Tertinggi</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Award className="mr-1 h-3 w-3" />
                    Terbaik: {latestEvaluation.results.find(r => r.rank === 1)?.name || "-"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>
              Akses langsung ke fitur-fitur utama sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/students">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Kelola Siswa
                </Button>
              </Link>
              <Link href="/dashboard/criteria">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Kelola Kriteria
                </Button>
              </Link>
              <Link href="/dashboard/evaluation">
                <Button className="w-full justify-start">
                  <Calculator className="mr-2 h-4 w-4" />
                  Evaluasi Siswa
                </Button>
              </Link>
              <Link href="/dashboard/reports">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Lihat Laporan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}