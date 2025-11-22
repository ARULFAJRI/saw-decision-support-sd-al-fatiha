"use client";

import { useState, useEffect } from "react";
import { StorageService, Evaluation, EvaluationResult } from "@/lib/storage";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Reports() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = () => {
    try {
      const data = StorageService.getEvaluations();
      setEvaluations(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Error loading evaluations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsPreviewOpen(true);
  };

  const exportToPDF = async (evaluation: Evaluation) => {
    try {
      setExporting("pdf");

      const doc = new jsPDF();

      // Add custom font for Indonesian characters (if needed)
      // For now using default font

      // Header
      const schoolName = "SD ISLAM AL FATIHA";
      const reportTitle = "LAPORAN HASIL EVALUASI SISWA";
      const evaluationName = evaluation.name;
      const evaluationDate = new Date(evaluation.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // School Header
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text(schoolName, 105, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setFont(undefined, "normal");
      doc.text(reportTitle, 105, 30, { align: "center" });

      doc.setFontSize(12);
      doc.text(`Nama Evaluasi: ${evaluationName}`, 20, 45);
      doc.text(`Tanggal: ${evaluationDate}`, 20, 52);

      if (evaluation.description) {
        doc.text(`Deskripsi: ${evaluation.description}`, 20, 59);
      }

      // Add evaluation summary
      doc.setFont(undefined, "bold");
      doc.text("Ringkasan Evaluasi:", 20, 72);
      doc.setFont(undefined, "normal");
      doc.text(`Jumlah Siswa: ${evaluation.results.length}`, 25, 79);
      doc.text(`Jumlah Kriteria: ${evaluation.criteria.length}`, 25, 86);

      // Criteria information
      let yPosition = 100;
      doc.setFont(undefined, "bold");
      doc.text("Kriteria Penilaian:", 20, yPosition);
      yPosition += 10;

      evaluation.criteria.forEach((criterion, index) => {
        doc.setFont(undefined, "normal");
        doc.text(
          `${index + 1}. ${criterion.name} (${criterion.type}) - ${(criterion.weight * 100).toFixed(1)}%`,
          25,
          yPosition
        );
        yPosition += 7;
      });

      // Results table
      yPosition += 10;

      const tableData = evaluation.results.map((result) => [
        result.rank.toString(),
        result.name,
        result.totalScore.toFixed(4),
        result.rank === 1 ? "Terbaik" : "",
      ]);

      autoTable(doc, {
        head: [["Peringkat", "Nama Siswa", "Total Skor", "Status"]],
        body: tableData,
        startY: yPosition,
        theme: "grid",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // Save the PDF
      const fileName = `Laporan_Evaluasi_${evaluation.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setExporting(null);
    }
  };

  const exportToExcel = async (evaluation: Evaluation) => {
    try {
      setExporting("excel");

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Evaluation Summary Sheet
      const summaryData = [
        ["LAPORAN EVALUASI SISWA"],
        [],
        ["Nama Sekolah", "SD ISLAM AL FATIHA"],
        ["Nama Evaluasi", evaluation.name],
        ["Tanggal Evaluasi", new Date(evaluation.createdAt).toLocaleDateString("id-ID")],
        ["Deskripsi", evaluation.description || "-"],
        ["Jumlah Siswa", evaluation.results.length.toString()],
        ["Jumlah Kriteria", evaluation.criteria.length.toString()],
        [],
        ["Kriteria Penilaian:"],
      ];

      evaluation.criteria.forEach((criterion, index) => {
        summaryData.push([
          `${index + 1}. ${criterion.name}`,
          `${criterion.type} - ${(criterion.weight * 100).toFixed(1)}%`,
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      // Results Sheet
      const resultsData = [
        ["Peringkat", "Nama Siswa", "Total Skor", "Status"],
        ...evaluation.results.map((result) => [
          result.rank,
          result.name,
          result.totalScore.toFixed(4),
          result.rank === 1 ? "Terbaik" : "",
        ]),
      ];

      const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);

      // Set column widths
      resultsSheet["!cols"] = [
        { width: 10 }, // Peringkat
        { width: 30 }, // Nama Siswa
        { width: 15 }, // Total Skor
        { width: 15 }, // Status
      ];

      XLSX.utils.book_append_sheet(workbook, resultsSheet, "Hasil Evaluasi");

      // Detailed Scores Sheet
      const detailedData = [
        ["Nama Siswa", ...evaluation.criteria.map(c => c.name), "Total Skor", "Peringkat"],
        ...evaluation.results.map((result) => [
          result.name,
          ...evaluation.criteria.map(criterion => result.scores[criterion.id] || 0),
          result.totalScore.toFixed(4),
          result.rank,
        ]),
      ];

      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);

      // Set column widths for detailed sheet
      detailedSheet["!cols"] = [
        { width: 30 }, // Nama Siswa
        ...evaluation.criteria.map(() => ({ width: 15 })), // Scores
        { width: 15 }, // Total Skor
        { width: 10 }, // Peringkat
      ];

      XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detail Skor");

      // Save the Excel file
      const fileName = `Laporan_Evaluasi_${evaluation.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="guru">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Evaluasi</h1>
            <p className="text-muted-foreground">
              Lihat dan unduh laporan hasil evaluasi siswa dalam format PDF dan Excel
            </p>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum Ada Laporan</h3>
              <p className="text-muted-foreground mb-4">
                Lakukan evaluasi terlebih dahulu untuk menghasilkan laporan
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        {evaluation.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {evaluation.description && (
                          <p className="mb-2">{evaluation.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(evaluation.createdAt).toLocaleDateString("id-ID")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {evaluation.results.length} siswa
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {evaluation.criteria.length} kriteria
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(evaluation)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(evaluation)}
                        disabled={exporting === "pdf"}
                      >
                        {exporting === "pdf" ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : (
                          <FileDown className="mr-2 h-4 w-4" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToExcel(evaluation)}
                        disabled={exporting === "excel"}
                      >
                        {exporting === "excel" ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : (
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                        )}
                        Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Laporan Evaluasi</DialogTitle>
              <DialogDescription>
                {selectedEvaluation && (
                  <>
                    <strong>{selectedEvaluation.name}</strong>
                    {selectedEvaluation.description && ` - ${selectedEvaluation.description}`}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedEvaluation && (
              <div className="space-y-6">
                {/* Evaluation Summary */}
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Ringkasan Evaluasi</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedEvaluation.results.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Siswa Dievaluasi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedEvaluation.criteria.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Kriteria</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedEvaluation.results.find(r => r.rank === 1)?.totalScore.toFixed(4) || "0"}
                      </div>
                      <div className="text-sm text-muted-foreground">Skor Tertinggi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {selectedEvaluation.results.find(r => r.rank === 1)?.name || "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">Siswa Terbaik</div>
                    </div>
                  </div>
                </div>

                {/* Criteria Information */}
                <div>
                  <h4 className="font-semibold mb-3">Kriteria Penilaian</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEvaluation.criteria.map((criterion) => (
                      <div key={criterion.id} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{criterion.name}</span>
                          <Badge variant={criterion.type === "benefit" ? "default" : "secondary"}>
                            {criterion.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Bobot: {(criterion.weight * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Table */}
                <div>
                  <h4 className="font-semibold mb-3">Hasil Evaluasi</h4>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peringkat</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead>Total Skor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEvaluation.results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Badge variant={result.rank === 1 ? "default" : "secondary"}>
                                #{result.rank}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{result.name}</TableCell>
                            <TableCell>{result.totalScore.toFixed(4)}</TableCell>
                            <TableCell>
                              {result.rank === 1 && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  <Award className="mr-1 h-3 w-3" />
                                  Terbaik
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}