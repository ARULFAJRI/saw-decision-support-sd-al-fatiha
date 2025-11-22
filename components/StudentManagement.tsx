"use client";

import { useState, useEffect } from "react";
import { StorageService, Student } from "@/lib/storage";
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
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().min(1, "Nama siswa wajib diisi"),
  class: z.string().min(1, "Kelas wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function StudentManagement() {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      class: "",
      nis: "",
    },
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    try {
      const data = StorageService.getStudents();
      setStudents(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      class: student.class,
      nis: student.nis,
    });
    setIsDialogOpen(true);
  };

  const handleSaveStudent = (data: StudentFormData) => {
    try {
      if (editingStudent) {
        // Update existing student
        const updated = StorageService.updateStudent(editingStudent.id, data);
        if (updated) {
          setStudents(prev =>
            prev.map(s => (s.id === updated.id ? updated : s))
          );
        }
      } else {
        // Add new student
        const newStudent = StorageService.saveStudent(data);
        setStudents(prev => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleDeleteStudent = (student: Student) => {
    try {
      const success = StorageService.deleteStudent(student.id);
      if (success) {
        setStudents(prev => prev.filter(s => s.id !== student.id));
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const isAdmin = hasRole("admin");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Siswa</h1>
            <p className="text-muted-foreground">
              Kelola data siswa SD Islam Al Fatiha
            </p>
          </div>
          {isAdmin && (
            <Button onClick={handleAddStudent}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Siswa
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Siswa
            </CardTitle>
            <CardDescription>
              Total {students.length} siswa terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Belum ada data siswa</h3>
                <p className="text-muted-foreground mb-4">
                  Mulai dengan menambahkan data siswa pertama
                </p>
                {isAdmin && (
                  <Button onClick={handleAddStudent}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Siswa
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.nis}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingStudent(student)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus siswa "{student.name}"?
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        if (deletingStudent) {
                                          handleDeleteStudent(deletingStudent);
                                          setDeletingStudent(null);
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

        {/* Add/Edit Student Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Siswa" : "Tambah Siswa Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingStudent
                  ? "Perbarui informasi siswa yang ada."
                  : "Masukkan informasi siswa baru untuk ditambahkan ke sistem."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSaveStudent)}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Masukkan nama lengkap siswa"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nis">Nomor Induk Siswa (NIS)</Label>
                  <Input
                    id="nis"
                    {...form.register("nis")}
                    placeholder="Masukkan NIS siswa"
                  />
                  {form.formState.errors.nis && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nis.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="class">Kelas</Label>
                  <Input
                    id="class"
                    {...form.register("class")}
                    placeholder="Contoh: 1A, 2B, 3C"
                  />
                  {form.formState.errors.class && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.class.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingStudent ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}