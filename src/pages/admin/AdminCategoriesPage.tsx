import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  const addCategory = async () => {
    if (!newName.trim()) return;
    const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
    const { data } = await supabase.from('categories').insert({ name: newName.trim(), sort_order: maxOrder + 1 }).select().maybeSingle();
    if (data) setCategories(p => [...p, data as Category]);
    setNewName('');
    toast({ description: 'Category added!' });
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', editId);
    setCategories(p => p.map(c => c.id === editId ? { ...c, name: editName.trim() } : c));
    setEditId(null);
    toast({ description: 'Category updated' });
  };

  const deleteCategory = async () => {
    if (!deleteId) return;
    await supabase.from('categories').delete().eq('id', deleteId);
    setCategories(p => p.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast({ description: 'Category deleted' });
  };

  return (
    <AdminLayout title="Categories">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name" className="h-8 text-sm flex-1" onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <Button size="sm" onClick={addCategory} className="btn-gradient gap-1.5 flex-shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3 shadow-brand-sm">
              {editId === cat.id ? (
                <>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm flex-1" onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                  <button onClick={saveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="text-sm font-semibold text-foreground flex-1">{cat.name}</span>
                  <button onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="text-primary hover:bg-primary-light p-1 rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {cat.name !== 'All' && (
                    <button onClick={() => setDeleteId(cat.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>Products in this category will be uncategorized.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCategory} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
