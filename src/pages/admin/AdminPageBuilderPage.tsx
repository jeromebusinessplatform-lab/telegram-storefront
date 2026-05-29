import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ImageUploadInput from '@/components/common/ImageUploadInput';
import {
  DEFAULT_PAGE_BUILDER_CONFIG,
  PAGE_BUILDER_SETTING_KEY,
  createPageBlock,
  normalizePageBuilderConfig,
} from '@/lib/page-builder';
import type { PageBuilderBlock, PageBuilderConfig, PageBuilderPage } from '@/types';
import { ArrowDown, ArrowUp, GripVertical, Plus, Palette, Layers3, LayoutGrid, Type, Image as ImageIcon, Link2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const dragStyles = (isActive: boolean) =>
  cn('rounded-2xl border p-3 transition-all', isActive ? 'border-primary bg-primary/5 shadow-brand-sm' : 'border-border bg-card');

export default function AdminPageBuilderPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PageBuilderConfig>(DEFAULT_PAGE_BUILDER_CONFIG);
  const [selectedPageSlug, setSelectedPageSlug] = useState('global');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [newPageLabel, setNewPageLabel] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', PAGE_BUILDER_SETTING_KEY).maybeSingle();
      const next = normalizePageBuilderConfig(data?.value ?? DEFAULT_PAGE_BUILDER_CONFIG);
      setConfig(next);
      const initialPage = next.pages.find((page) => page.slug === 'store') ?? next.pages[0];
      setSelectedPageSlug(initialPage?.slug ?? 'global');
      setSelectedBlockId(initialPage?.blocks[0]?.id ?? '');
      setIsLoading(false);
    };
    void load();
  }, []);

  const selectedPage = useMemo<PageBuilderPage>(() => {
    return config.pages.find((page) => page.slug === selectedPageSlug) ?? config.pages[0] ?? DEFAULT_PAGE_BUILDER_CONFIG.pages[0];
  }, [config, selectedPageSlug]);

  const selectedBlock = useMemo<PageBuilderBlock | null>(() => {
    return selectedPage.blocks.find((block) => block.id === selectedBlockId) ?? selectedPage.blocks[0] ?? null;
  }, [selectedPage, selectedBlockId]);

  useEffect(() => {
    if (!selectedPage.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(selectedPage.blocks[0]?.id ?? '');
    }
  }, [selectedPage, selectedBlockId]);

  const updateConfig = (updater: (prev: PageBuilderConfig) => PageBuilderConfig) => {
    setConfig((prev) => updater(prev));
  };

  const updateCurrentPage = (updater: (page: PageBuilderPage) => PageBuilderPage) => {
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => (page.slug === selectedPage.slug ? updater(page) : page)),
    }));
  };

  const updateBlock = (blockId: string, updater: (block: PageBuilderBlock) => PageBuilderBlock) => {
    updateCurrentPage((page) => ({
      ...page,
      blocks: page.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
    }));
  };

  const addBlock = (type: PageBuilderBlock['type']) => {
    const block = createPageBlock(type);
    updateCurrentPage((page) => {
      const nextBlocks = [...page.blocks, { ...block, sort_order: page.blocks.length }];
      setSelectedBlockId(block.id);
      return { ...page, blocks: nextBlocks };
    });
  };

  const removeBlock = (blockId: string) => {
    updateCurrentPage((page) => {
      const nextBlocks = page.blocks.filter((block) => block.id !== blockId).map((block, index) => ({ ...block, sort_order: index }));
      return { ...page, blocks: nextBlocks };
    });
    setSelectedBlockId((prev) => (prev === blockId ? '' : prev));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    updateCurrentPage((page) => {
      const nextBlocks = [...page.blocks];
      const [moved] = nextBlocks.splice(fromIndex, 1);
      nextBlocks.splice(toIndex, 0, moved);
      return { ...page, blocks: nextBlocks.map((block, index) => ({ ...block, sort_order: index })) };
    });
    setDragIndex(null);
  };

  const addPage = () => {
    const label = newPageLabel.trim();
    const slug = slugify(newPageSlug.trim() || label);
    if (!label || !slug) {
      toast({ description: 'Page label and slug are required.', variant: 'destructive' });
      return;
    }
    if (config.pages.some((page) => page.slug === slug)) {
      toast({ description: 'That page slug already exists.', variant: 'destructive' });
      return;
    }
    const nextPage: PageBuilderPage = { slug, label, blocks: [] };
    updateConfig((prev) => ({ ...prev, pages: [...prev.pages, nextPage] }));
    setSelectedPageSlug(slug);
    setSelectedBlockId('');
    setNewPageLabel('');
    setNewPageSlug('');
  };

  const deletePage = () => {
    if (selectedPage.slug === 'global') return;
    updateConfig((prev) => ({
      ...prev,
      pages: prev.pages.filter((page) => page.slug !== selectedPage.slug),
    }));
    setSelectedPageSlug('global');
    setSelectedBlockId(config.pages.find((page) => page.slug === 'global')?.blocks[0]?.id ?? '');
  };

  const save = async () => {
    setIsSaving(true);
    const payload = normalizePageBuilderConfig(config);
    const { error } = await supabase.from('app_settings').upsert({ key: PAGE_BUILDER_SETTING_KEY, value: payload }, { onConflict: 'key' });
    setIsSaving(false);
    if (error) {
      toast({ description: error.message, variant: 'destructive' });
      return;
    }
    toast({ description: 'Page builder saved.' });
  };

  return (
    <AdminLayout title="Page Builder">
      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
        <aside className="rounded-2xl border border-border bg-card p-3 shadow-brand-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black">Pages</h2>
          </div>

          <div className="space-y-2">
            {config.pages.map((page) => (
              <button
                key={page.slug}
                type="button"
                onClick={() => {
                  setSelectedPageSlug(page.slug);
                  setSelectedBlockId(page.blocks[0]?.id ?? '');
                }}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left transition-all',
                  selectedPage.slug === page.slug ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/50',
                )}
              >
                <p className="text-xs font-bold">{page.label}</p>
                <p className="text-[10px] text-muted-foreground">/{page.slug}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <p className="text-xs font-bold">Add Page</p>
            <div>
              <Label className="text-[10px]">Label</Label>
              <Input value={newPageLabel} onChange={(e) => setNewPageLabel(e.target.value)} className="mt-1 h-8 text-xs" placeholder="Promos Page" />
            </div>
            <div>
              <Label className="text-[10px]">Slug</Label>
              <Input value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} className="mt-1 h-8 text-xs" placeholder="promos" />
            </div>
            <Button onClick={addPage} className="w-full h-8 text-xs btn-gradient">
              <Plus className="w-3 h-3" /> Add Page
            </Button>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-brand-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Builder Target</p>
                <h2 className="text-lg font-black">{selectedPage.label}</h2>
                <p className="text-[11px] text-muted-foreground">Edit blocks for this page. Global blocks render everywhere.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addBlock('text')}
                  className="h-8 text-xs gap-1.5"
                >
                  <Type className="w-3 h-3" /> Text
                </Button>
                <Button type="button" variant="outline" onClick={() => addBlock('hero')} className="h-8 text-xs gap-1.5">
                  <LayoutGrid className="w-3 h-3" /> Hero
                </Button>
                <Button type="button" variant="outline" onClick={() => addBlock('image')} className="h-8 text-xs gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Image
                </Button>
                <Button type="button" variant="outline" onClick={() => addBlock('button')} className="h-8 text-xs gap-1.5">
                  <Link2 className="w-3 h-3" /> Button
                </Button>
                <Button type="button" variant="outline" onClick={() => addBlock('spacer')} className="h-8 text-xs gap-1.5">
                  <Layers3 className="w-3 h-3" /> Spacer
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-brand-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold">Canvas</h3>
                <p className="text-[11px] text-muted-foreground">Drag blocks to reorder. Select one to edit its font, color, alignment, and image fit.</p>
              </div>
              {selectedPage.slug !== 'global' && (
                <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={deletePage}>
                  <Trash2 className="w-3 h-3" /> Delete Page
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted/40" />
                ))}
              </div>
            ) : selectedPage.blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No blocks yet. Add a block to start building this page.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPage.blocks.map((block, index) => {
                  const isActive = selectedBlockId === block.id;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dragIndex !== null && moveBlock(dragIndex, index)}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={dragStyles(isActive)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black uppercase tracking-wide">{block.type}</p>
                            {!block.enabled && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold">Disabled</span>}
                          </div>
                          {block.title && <p className="text-sm font-bold leading-tight">{block.title}</p>}
                          {block.body_markdown && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{block.body_markdown}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); if (index > 0) moveBlock(index, index - 1); }}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); if (index < selectedPage.blocks.length - 1) moveBlock(index, index + 1); }}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-brand-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Page Settings</h3>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[10px]">Label</Label>
                <Input
                  value={selectedPage.label}
                  onChange={(e) => {
                    const nextLabel = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      pages: prev.pages.map((page) => (page.slug === selectedPage.slug ? { ...page, label: nextLabel } : page)),
                    }));
                  }}
                  className="mt-1 h-8 text-xs"
                  disabled={selectedPage.slug === 'global'}
                />
              </div>
              <div>
                <Label className="text-[10px]">Slug</Label>
                <Input
                  value={selectedPage.slug}
                  onChange={(e) => {
                    const nextSlug = slugify(e.target.value);
                    if (!nextSlug) return;
                    updateConfig((prev) => ({
                      ...prev,
                      pages: prev.pages.map((page) => (page.slug === selectedPage.slug ? { ...page, slug: nextSlug } : page)),
                    }));
                    setSelectedPageSlug(nextSlug);
                  }}
                  className="mt-1 h-8 text-xs"
                  disabled={selectedPage.slug === 'global'}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Block Settings</h3>
            </div>

            {!selectedBlock ? (
              <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Select a block to edit font, style, color, alignment, image zoom, and button link.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <Label className="text-xs font-semibold">Enabled</Label>
                    <p className="text-[10px] text-muted-foreground">Show this block on the live page.</p>
                  </div>
                  <Switch checked={selectedBlock.enabled} onCheckedChange={(checked) => updateBlock(selectedBlock.id, (block) => ({ ...block, enabled: checked }))} />
                </div>

                <div>
                  <Label className="text-[10px]">Type</Label>
                  <select
                    value={selectedBlock.type}
                    onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, type: e.target.value as PageBuilderBlock['type'] }))}
                    className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="text">Text</option>
                    <option value="hero">Hero</option>
                    <option value="image">Image</option>
                    <option value="button">Button</option>
                    <option value="spacer">Spacer</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[10px]">Title</Label>
                  <Input value={selectedBlock.title} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, title: e.target.value }))} className="mt-1 h-8 text-xs" />
                </div>

                <div>
                  <Label className="text-[10px]">Body / Rich Text</Label>
                  <Textarea value={selectedBlock.body_markdown} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, body_markdown: e.target.value }))} className="mt-1 min-h-24 text-xs" />
                </div>

                <div>
                  <ImageUploadInput
                    label="Image"
                    value={selectedBlock.image_url}
                    onChange={(url) => updateBlock(selectedBlock.id, (block) => ({ ...block, image_url: url }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Button Label</Label>
                    <Input value={selectedBlock.button_label} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, button_label: e.target.value }))} className="mt-1 h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Button Link</Label>
                    <Input value={selectedBlock.button_href} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, button_href: e.target.value }))} className="mt-1 h-8 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Font</Label>
                    <select
                      value={selectedBlock.style.font_family}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, font_family: e.target.value as PageBuilderBlock['style']['font_family'] } }))}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="body">Roboto</option>
                      <option value="condensed">Roboto Condensed</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Mono</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Style</Label>
                    <select
                      value={selectedBlock.style.font_style}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, font_style: e.target.value as PageBuilderBlock['style']['font_style'] } }))}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Text Color</Label>
                    <Input type="color" value={selectedBlock.style.text_color} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, text_color: e.target.value } }))} className="mt-1 h-8 p-1" />
                  </div>
                  <div>
                    <Label className="text-[10px]">Accent Color</Label>
                    <Input type="color" value={selectedBlock.style.accent_color} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, accent_color: e.target.value } }))} className="mt-1 h-8 p-1" />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px]">Background Color</Label>
                  <Input type="color" value={selectedBlock.style.background_color} onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, background_color: e.target.value } }))} className="mt-1 h-8 p-1" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Alignment</Label>
                    <select
                      value={selectedBlock.style.alignment}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, alignment: e.target.value as PageBuilderBlock['style']['alignment'] } }))}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px]">Image Fit</Label>
                    <select
                      value={selectedBlock.style.image_fit}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, image_fit: e.target.value as PageBuilderBlock['style']['image_fit'] } }))}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px]">Image Zoom: {selectedBlock.style.image_zoom.toFixed(2)}x</Label>
                  <Input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={selectedBlock.style.image_zoom}
                    onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, image_zoom: parseFloat(e.target.value) } }))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Image X Position</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedBlock.style.image_position_x}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, image_position_x: parseInt(e.target.value, 10) } }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Image Y Position</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedBlock.style.image_position_y}
                      onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, image_position_y: parseInt(e.target.value, 10) } }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[10px]">Border Radius: {selectedBlock.style.border_radius}px</Label>
                  <Input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={selectedBlock.style.border_radius}
                    onChange={(e) => updateBlock(selectedBlock.id, (block) => ({ ...block, style: { ...block.style, border_radius: parseInt(e.target.value, 10) } }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-1">
            <Button onClick={save} disabled={isSaving} className="w-full btn-gradient">
              {isSaving ? 'Saving...' : 'Save Builder'}
            </Button>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
