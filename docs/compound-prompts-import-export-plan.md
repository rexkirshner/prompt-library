# Compound Prompts Import/Export Implementation Plan

## Overview
Add full support for compound prompts to the import/export system, enabling backup and restoration of compound prompt structures including their component relationships.

## Current State

### What Works
- ✅ `prompt_text` is nullable in PromptData interface
- ✅ Validators handle null prompt_text
- ✅ Basic export/import for regular prompts

### What's Missing
- ❌ No compound prompt metadata in export format
- ❌ No component relationships exported
- ❌ No component recreation on import
- ❌ No handling of component slug references

## Problem Statement

Currently, exporting a compound prompt results in:
```json
{
  "title": "My Compound Prompt",
  "prompt_text": null,
  "is_compound": false  // Not even included!
  // Missing: component structure, relationships, etc.
}
```

When imported back, this creates a broken prompt with no text and no way to reconstruct it.

## Data Structure Changes

### 1. Update PromptData Interface

Add compound prompt fields to `lib/import-export/types.ts`:

```typescript
export interface PromptData {
  // Existing fields...
  title: string
  slug: string
  prompt_text: string | null
  description: string | null
  example_output: string | null
  category: string
  tags: string[]
  author_name: string
  author_url: string | null
  status: PromptStatus
  featured: boolean
  created_at: string
  updated_at: string
  approved_at: string | null
  submitted_by?: string
  approved_by?: string

  // NEW: Compound prompt fields
  is_compound: boolean
  max_depth: number | null
  components?: CompoundComponent[]  // Only present if is_compound=true
}

export interface CompoundComponent {
  position: number
  component_prompt_slug: string | null  // Reference by slug, not ID
  custom_text_before: string | null
  custom_text_after: string | null
}
```

**Key Decision**: Use slugs instead of IDs for component references
- ✅ Portable across databases
- ✅ Survives export/import cycles
- ✅ Human-readable
- ⚠️ Requires slug resolution during import

### 2. Version Bump

Update export format version from "1.0" to "2.0" to indicate schema change:
- Version 1.0: Regular prompts only
- Version 2.0: Regular + compound prompts

## Implementation Plan

### Phase 1: Export Enhancement

#### 1.1 Update Export Service
**File**: `lib/import-export/services/export-service.ts`

```typescript
async exportAll(): Promise<ExportResult> {
  const prompts = await prisma.prompts.findMany({
    include: {
      prompt_tags: { include: { tags: true } },
      // NEW: Include compound components
      compound_components: {
        include: {
          component_prompt: {
            select: { slug: true }  // Get slug for reference
          }
        },
        orderBy: { position: 'asc' }
      },
      // ... existing user includes
    },
    where: { deleted_at: null },
    orderBy: { created_at: 'asc' }
  })

  const promptData: PromptData[] = prompts.map((prompt) => {
    const base = {
      // ... existing fields
      is_compound: prompt.is_compound,
      max_depth: prompt.max_depth,
    }

    // Only include components if compound
    if (prompt.is_compound && prompt.compound_components.length > 0) {
      base.components = prompt.compound_components.map(comp => ({
        position: comp.position,
        component_prompt_slug: comp.component_prompt?.slug || null,
        custom_text_before: comp.custom_text_before,
        custom_text_after: comp.custom_text_after,
      }))
    }

    return base
  })

  // Update version to 2.0
  return this.jsonExporter.export(promptData)
}
```

#### 1.2 Update JSON Exporter
**File**: `lib/import-export/exporters/json-exporter.ts`

Update version number:
```typescript
const exportData: ExportData = {
  version: '2.0',  // Updated from 1.0
  exported_at: new Date().toISOString(),
  total_count: prompts.length,
  prompts,
}
```

### Phase 2: Import Enhancement

#### 2.1 Update Import Service
**File**: `lib/import-export/services/import-service.ts`

**Challenge**: Components reference other prompts by slug, which may not exist yet.

**Solution**: Two-pass import:
1. **Pass 1**: Import all prompts as regular prompts (no components yet)
2. **Pass 2**: Create component relationships after all prompts exist

```typescript
async importPrompts(
  prompts: PromptData[],
  options: ImportOptions
): Promise<ImportResult> {
  const results = { imported: 0, skipped: 0, failed: 0, errors: [], warnings: [] }

  // PASS 1: Import all prompts (structure only)
  const promptMap = new Map<string, string>()  // slug -> new ID

  for (const [index, promptData] of prompts.entries()) {
    try {
      const promptId = await this.importPromptStructure(promptData, index, options)
      if (promptId) {
        promptMap.set(promptData.slug, promptId)
        results.imported++
      } else {
        results.skipped++
      }
    } catch (error) {
      results.failed++
      results.errors.push({
        index,
        slug: promptData.slug,
        message: error.message
      })
    }
  }

  // PASS 2: Create compound prompt relationships
  const compoundPrompts = prompts.filter(p => p.is_compound && p.components)

  for (const [index, promptData] of compoundPrompts.entries()) {
    try {
      await this.importCompoundComponents(
        promptMap.get(promptData.slug)!,
        promptData.components!,
        promptMap,
        index
      )
    } catch (error) {
      results.warnings.push({
        index,
        slug: promptData.slug,
        message: `Component import failed: ${error.message}`
      })
    }
  }

  return results
}
```

#### 2.2 Import Prompt Structure (Pass 1)
```typescript
private async importPromptStructure(
  promptData: PromptData,
  index: number,
  options: ImportOptions
): Promise<string | null> {
  // Check for duplicates
  const existing = await this.checkDuplicate(promptData.slug)
  if (existing) {
    if (options.onDuplicate === 'skip') return null
    if (options.onDuplicate === 'error') throw new Error('Duplicate slug')
    // 'update' case - update existing
  }

  // Create/update prompt (without components)
  const prompt = await prisma.prompts.create({
    data: {
      id: crypto.randomUUID(),
      title: promptData.title,
      slug: promptData.slug,
      prompt_text: promptData.prompt_text,
      description: promptData.description,
      // ... all other fields
      is_compound: promptData.is_compound,
      max_depth: promptData.max_depth,
      // Don't create components yet
    }
  })

  return prompt.id
}
```

#### 2.3 Import Compound Components (Pass 2)
```typescript
private async importCompoundComponents(
  compoundPromptId: string,
  components: CompoundComponent[],
  promptMap: Map<string, string>,
  index: number
): Promise<void> {
  // Validate all component slugs exist
  for (const comp of components) {
    if (comp.component_prompt_slug) {
      const componentId = promptMap.get(comp.component_prompt_slug)
      if (!componentId) {
        throw new Error(
          `Component prompt "${comp.component_prompt_slug}" not found in import`
        )
      }
    }
  }

  // Create all components
  await prisma.compound_prompt_components.createMany({
    data: components.map(comp => ({
      id: crypto.randomUUID(),
      compound_prompt_id: compoundPromptId,
      component_prompt_id: comp.component_prompt_slug
        ? promptMap.get(comp.component_prompt_slug)!
        : null,
      position: comp.position,
      custom_text_before: comp.custom_text_before,
      custom_text_after: comp.custom_text_after,
    }))
  })

  // Recalculate max_depth
  const depth = await calculateMaxDepth(compoundPromptId, getPromptWithComponents)
  await prisma.prompts.update({
    where: { id: compoundPromptId },
    data: { max_depth: depth }
  })
}
```

### Phase 3: Validation Updates

#### 3.1 Schema Validation
**File**: `lib/import-export/validators/schema-validator.ts`

Update Zod schema to include compound fields:
```typescript
const PromptDataSchema = z.object({
  // ... existing fields
  is_compound: z.boolean(),
  max_depth: z.number().nullable(),
  components: z.array(z.object({
    position: z.number(),
    component_prompt_slug: z.string().nullable(),
    custom_text_before: z.string().nullable(),
    custom_text_after: z.string().nullable(),
  })).optional(),
}).refine(
  (data) => {
    // If compound, must have components
    if (data.is_compound) {
      return data.components && data.components.length > 0
    }
    return true
  },
  { message: "Compound prompts must have at least one component" }
)
```

#### 3.2 Business Logic Validation
**File**: `lib/import-export/validators/prompt-validator.ts`

Add new validations:
```typescript
export async function validatePromptForImport(
  prompt: PromptData,
  index: number,
  allPrompts: PromptData[]  // NEW: Need full context
): Promise<{ errors: ImportError[]; warnings: ImportWarning[] }> {
  const errors: ImportError[] = []
  const warnings: ImportWarning[] = []

  // Existing validations...

  // NEW: Validate compound prompts
  if (prompt.is_compound) {
    // Must have null prompt_text
    if (prompt.prompt_text !== null) {
      errors.push({
        index,
        slug: prompt.slug,
        message: 'Compound prompts must have null prompt_text',
        field: 'prompt_text'
      })
    }

    // Must have components
    if (!prompt.components || prompt.components.length === 0) {
      errors.push({
        index,
        slug: prompt.slug,
        message: 'Compound prompts must have at least one component',
        field: 'components'
      })
    }

    // Validate component references
    if (prompt.components) {
      const slugSet = new Set(allPrompts.map(p => p.slug))

      for (const comp of prompt.components) {
        if (comp.component_prompt_slug) {
          if (!slugSet.has(comp.component_prompt_slug)) {
            errors.push({
              index,
              slug: prompt.slug,
              message: `Component references unknown prompt: ${comp.component_prompt_slug}`,
              field: 'components'
            })
          }
        }
      }
    }
  } else {
    // Regular prompts should not have components
    if (prompt.components && prompt.components.length > 0) {
      warnings.push({
        index,
        slug: prompt.slug,
        message: 'Non-compound prompt has components (will be ignored)'
      })
    }
  }

  return { errors, warnings }
}
```

## Edge Cases & Considerations

### 1. Circular Dependencies
**Problem**: Compound prompt A references compound prompt B, which references A.

**Solution**: Already handled by existing `validateCircularReference` in compound-prompts/validation.ts. Call during import validation.

### 2. Missing Component Prompts
**Problem**: Component references a prompt that doesn't exist in the import file.

**Solution**:
- **During validation**: Error if slug not found in import
- **Option**: Allow importing compound prompts that reference existing DB prompts

### 3. Depth Limit Violations
**Problem**: Importing a structure that exceeds max depth of 5.

**Solution**: Validate depth during import, reject if exceeds limit.

### 4. Version Compatibility
**Problem**: Importing v1.0 exports (no compound data) into v2.0 system.

**Solution**:
- v1.0 files: Set `is_compound: false` as default
- v2.0 files: Require compound fields
- Store version in import results for debugging

### 5. Slug Conflicts
**Problem**: Import contains slug that exists in DB but with different content.

**Solution**: Use existing `onDuplicate` option:
- `skip`: Don't import
- `error`: Fail with error
- `update`: Replace existing (careful with compound references!)

### 6. Component Order
**Problem**: Components must maintain their order.

**Solution**: Use `position` field, order by it when creating.

### 7. Custom Text Only Components
**Problem**: Component with no component_prompt_slug (just custom text).

**Solution**: Allow `component_prompt_slug: null`, store custom text.

## Testing Strategy

### Unit Tests

1. **Export Tests** (`export-service.test.ts`)
   - Export compound prompt with components
   - Export mixed regular + compound prompts
   - Verify component order preserved
   - Verify slug references correct

2. **Import Tests** (`import-service.test.ts`)
   - Import compound prompt
   - Import with missing component reference (should error)
   - Import with circular reference (should error)
   - Import with depth violation (should error)
   - Two-pass import works correctly
   - Component recreation is accurate

3. **Round-trip Tests**
   - Export then import should produce identical structure
   - Compound prompt resolves to same text after round-trip

### Integration Tests

1. Create compound prompt via UI
2. Export all prompts
3. Clear database
4. Import exported file
5. Verify compound prompt works identically

## Migration Path

### For Existing Exports (v1.0)
No migration needed - v1.0 exports don't have compound prompts, they'll import as-is.

### For New Exports (v2.0)
All new exports will include compound prompt data automatically.

## Implementation Order

1. ✅ Update types (PromptData interface)
2. ✅ Update export service to fetch components
3. ✅ Update export service to include compound fields
4. ✅ Update version to 2.0
5. ✅ Update import validation (schema + business logic)
6. ✅ Implement two-pass import algorithm
7. ✅ Add component creation logic
8. ✅ Add depth recalculation
9. ✅ Update tests
10. ✅ Test round-trip export/import

## Files to Modify

### Core Implementation
- `lib/import-export/types.ts` - Add compound fields to PromptData
- `lib/import-export/services/export-service.ts` - Export components
- `lib/import-export/services/import-service.ts` - Two-pass import
- `lib/import-export/exporters/json-exporter.ts` - Version bump to 2.0

### Validation
- `lib/import-export/validators/schema-validator.ts` - Schema updates
- `lib/import-export/validators/prompt-validator.ts` - Business logic

### Tests
- `lib/import-export/services/__tests__/export-service.test.ts` - Export tests
- `lib/import-export/services/__tests__/import-service.test.ts` - Import tests
- `lib/import-export/__tests__/round-trip.test.ts` - New file for round-trip tests

## Success Criteria

- ✅ Compound prompts export with full component structure
- ✅ Exported data is portable (uses slugs not IDs)
- ✅ Import recreates compound prompts correctly
- ✅ Component relationships are preserved
- ✅ Depth limits are validated
- ✅ Circular references are detected
- ✅ Round-trip export/import works
- ✅ All existing tests pass
- ✅ Version compatibility maintained

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing exports | HIGH | Version field distinguishes v1.0 vs v2.0 |
| Import performance with large component graphs | MEDIUM | Batch operations, optimize queries |
| Circular reference not detected | HIGH | Use existing validation, add tests |
| Component order lost | MEDIUM | Explicit position field, order by it |
| Slug conflicts during import | MEDIUM | Clear error messages, onDuplicate options |

## Future Enhancements

1. **Incremental Import**: Only import new/changed prompts
2. **Component Deduplication**: Detect and merge identical components
3. **Import Preview**: Show what will be imported before committing
4. **Selective Export**: Export only specific prompts and their dependencies
5. **Format Conversion**: Import from other prompt library formats

## Timeline Estimate

- Phase 1 (Export): 2-3 hours
- Phase 2 (Import): 4-5 hours
- Phase 3 (Validation): 2-3 hours
- Testing: 2-3 hours
- **Total**: ~10-14 hours

## Notes

- Keep backward compatibility with v1.0 exports
- Use slugs for references (portable across databases)
- Two-pass import ensures all components exist before creating relationships
- Leverage existing validation functions where possible
- Comprehensive testing is critical due to complexity
