"use client";

import { useState, useEffect } from "react";
import { StorageService, Criterion } from "@/lib/storage";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Plus, Edit, Trash2, Settings, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const criteriaSchema = z.object({
  name: z.string().min(1, "Nama kriteria wajib diisi"),
  weight: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1;
    },
    { message: "Bobot harus berupa angka antara 0 dan 1" }
  ),
  type: z.enum(["benefit", "cost"], {
    required_error: "Tipe kriteria wajib dipilih",
  }),
  description: z.string().optional(),
});

type CriteriaFormData = z.infer<typeof criteriaSchema>;

export default function CriteriaManagement() {
  const { hasRole } = useAuth();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
  const [deletingCriterion, setDeletingCriterion] = useState<Criterion | null>(null);

  const form = useForm<CriteriaFormData>({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      name: "",
      weight: "",
      type: "benefit",
      description: "",
    },
  });

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = () => {
    try {
      const data = StorageService.getCriteria();
      setCriteria(data);
    } catch (error) {
      console.error("Error loading criteria:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalWeight = () => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  };

  const getWeightValidation = () => {
    const total = getTotalWeight();
    const isValid = Math.abs(total - 1) < 0.001;
    return {
      isValid,
      total,
      message: isValid
        ? "Bobot kriteria valid"
        : `Total bobot harus sama dengan 1 (saat ini: ${total.toFixed(3)})`,
    };
  };

  const handleAddCriterion = () => {
    setEditingCriterion(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion);
    form.reset({
      name: criterion.name,
      weight: criterion.weight.toString(),
      type: criterion.type,
      description: criterion.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveCriterion = (data: CriteriaFormData) => {
    try {
      const weight = parseFloat(data.weight);

      if (editingCriterion) {
        // Update existing criterion
        const updated = StorageService.updateCriterion(editingCriterion.id, {
          ...data,
          weight,
        });
        if (updated) {
          setCriteria(prev =>
            prev.map(c => (c.id === updated.id ? updated : c))
          );
        }
      } else {
        // Add new criterion
        const newCriterion = StorageService.saveCriterion({
          ...data,
          weight,
        });
        setCriteria(prev => [...prev, newCriterion]);
      }

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving criterion:", error);
    }
  };

  const handleDeleteCriterion = (criterion: Criterion) => {
    try {
      const success = StorageService.deleteCriterion(criterion.id);
      if (success) {
        setCriteria(prev => prev.filter(c => c.id !== criterion.id));
      }
    } catch (error) {
      console.error("Error deleting criterion:", error);
    }
  };

  const isAdmin = hasRole("admin");
  const weightValidation = getWeightValidation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat data kriteria...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Kriteria</h1>
            <p className="text-muted-foreground">
              Kelola kriteria penilaian untuk sistem SAW
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddCriterion}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Kriteria
            </Button>
          )}
        </div>

        {/* Weight Validation Alert */}
        <Alert className={!weightValidation.isValid ? "border-destructive" : ""}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {weightValidation.message}
            {!weightValidation.isValid && (
              <span className="ml-2">
                Total bobot saat ini: {weightValidation.total.toFixed(3)}
              </span>
            )}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Daftar Kriteria
            </CardTitle>
            <CardDescription>
              Total {criteria.length} kriteria terdaftar • Total bobot: {getTotalWeight().toFixed(3)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criteria.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Belum ada data kriteria</h3>
                <p className="text-muted-foreground mb-4">
                  Mulai dengan menambahkan kriteria penilaian pertama
                </p>
                {isAdmin && (
                  <Button onClick={handleAddCriterion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kriteria
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kriteria</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Bobot</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">{criterion.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={criterion.type === "benefit" ? "default" : "secondary"}
                            className="flex w-fit gap-1"
                          >
                            {criterion.type === "benefit" ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                Benefit
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3" />
                                Cost
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(criterion.weight * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {criterion.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCriterion(criterion)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingCriterion(criterion)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Kriteria</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus kriteria "{criterion.name}"?
                                      Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data
                                      penilaian yang terkait.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (deletingCriterion) {
                                          handleDeleteCriterion(deletingCriterion);
                                          setDeletingCriterion(null);
                                        }
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Criterion Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCriterion ? "Edit Kriteria" : "Tambah Kriteria Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingCriterion
                  ? "Perbarui informasi kriteria yang ada."
                  : "Masukkan informasi kriteria baru untuk sistem penilaian SAW."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSaveCriterion)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Kriteria</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Contoh: Nilai Akademik, Kedisiplinan"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipe Kriteria</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value as "benefit" | "cost")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe kriteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="benefit">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Benefit (semakin tinggi semakin baik)
                        </div>
                      </SelectItem>
                      <SelectItem value="cost">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Cost (semakin rendah semakin baik)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.type.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Bobot (0-1)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    {...form.register("weight")}
                    placeholder="Contoh: 0.3 untuk 30%"
                  />
                  {form.formState.errors.weight && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.weight.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Total bobot semua kriteria harus sama dengan 1
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Jelaskan cara penilaian untuk kriteria ini"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingCriterion ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}