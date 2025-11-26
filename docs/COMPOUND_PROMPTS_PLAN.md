# Compound Prompts Feature - Planning Document

## Overview

Compound prompts allow users to create complex prompts by composing multiple base prompts with custom text. Changes to base prompts automatically propagate to all compound prompts that use them, creating a modular, maintainable prompt system.

### Key Benefits
- **Modularity**: Reuse common prompt components across multiple compound prompts
- **Maintainability**: Update a base prompt once, changes propagate everywhere
- **Flexibility**: Mix base prompts with custom text for specific use cases
- **Composition**: Build complex prompts from simple building blocks

---

## Database Schema Changes

### New Table: `compound_prompt_components`

Tracks which base prompts are included in compound prompts and their order.

```sql
CREATE TABLE compound_prompt_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compound_prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  component_prompt_id UUID REFERENCES prompts(id) ON DELETE RESTRICT,
  position INT NOT NULL,
  custom_text_before TEXT,
  custom_text_after TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique positions within a compound prompt
  UNIQUE(compound_prompt_id, position),

  -- Prevent self-reference at database level
  CHECK (compound_prompt_id != component_prompt_id)
);

-- Index for efficient lookup of compound prompts using a specific base prompt
CREATE INDEX idx_compound_components_base ON compound_prompt_components(component_prompt_id);
-- Index for ordered retrieval of components
CREATE INDEX idx_compound_components_order ON compound_prompt_components(compound_prompt_id, position);
```

### Modified Table: `prompts`

Add fields to distinguish compound prompts from regular prompts.

```sql
ALTER TABLE prompts
  ADD COLUMN is_compound BOOLEAN DEFAULT FALSE,
  ADD COLUMN max_depth INT;

-- Add check constraint to ensure compound prompts don't have prompt_text
ALTER TABLE prompts
  ADD CONSTRAINT compound_prompt_no_text CHECK (
    (is_compound = FALSE AND prompt_text IS NOT NULL) OR
    (is_compound = TRUE AND prompt_text IS NULL)
  );
```

**Rationale**:
- `is_compound`: Distinguishes compound prompts from regular prompts
- `max_depth`: Cached value of the maximum nesting depth (for performance)
- Constraint ensures compound prompts don't have their own text (only components)

---

## Data Model

### Compound Prompt Structure

```typescript
interface CompoundPrompt {
  id: string
  title: string
  description: string | null
  slug: string
  is_compound: true
  components: CompoundPromptComponent[]
  // ... other prompt fields (author, tags, etc.)
}

interface CompoundPromptComponent {
  id: string
  position: number
  component_prompt_id: string | null  // null for pure custom text
  custom_text_before: string | null
  custom_text_after: string | null

  // Populated when fetching
  prompt?: Prompt  // The referenced base prompt
}

// Resolved view (what user sees when copying)
interface ResolvedCompoundPrompt {
  final_text: string
  components: {
    position: number
    custom_text_before: string | null
    base_prompt_title: string | null
    base_prompt_text: string | null
    custom_text_after: string | null
  }[]
}
```

---

## User Flows

### 1. Creating a Compound Prompt (Admin)

**UI Flow:**
1. Admin navigates to `/admin/prompts/create-compound`
2. Form displays:
   - Title, description, category (standard fields)
   - Component builder interface with sortable list
3. For each component position:
   - "Add Custom Text" button → opens textarea
   - "Add Base Prompt" button → opens modal to search/select existing prompts
   - Drag handles to reorder components
4. Real-time preview shows the final combined text
5. Submit for approval (follows same approval flow as regular prompts)

**Component Builder Interface:**
```
┌─────────────────────────────────────────────┐
│ Compound Prompt Builder                     │
├─────────────────────────────────────────────┤
│                                              │
│ [+ Add Custom Text] [+ Add Base Prompt]     │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ Component 1: Custom Text              │ │
│ │   [Edit] [Remove]                       │ │
│ │   ┌───────────────────────────────────┐ │ │
│ │   │ Your custom intro text here...    │ │ │
│ │   └───────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ Component 2: Base Prompt              │ │
│ │   [Change] [Remove]                     │ │
│ │   📄 "Modular Development Guidelines"   │ │
│ │   (shows first 100 chars preview...)    │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ≡ Component 3: Custom Text              │ │
│ │   [Edit] [Remove]                       │ │
│ │   ┌───────────────────────────────────┐ │ │
│ │   │ Transition text between prompts   │ │ │
│ │   └───────────────────────────────────┘ │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ [+ Add Custom Text] [+ Add Base Prompt]     │
│                                              │
│ ┌──────────── Preview ─────────────────┐   │
│ │ Your custom intro text here...       │   │
│ │                                       │   │
│ │ [Base: Modular Development Guidelines]│   │
│ │ Your core guidelines are 1) priorit...│   │
│ │                                       │   │
│ │ Transition text between prompts      │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ [Cancel] [Save Draft] [Submit for Approval] │
└─────────────────────────────────────────────┘
```

### 2. Viewing a Compound Prompt (All Users)

**Display Modes:**

**A. Component View (Default)**
Shows the structure with clearly marked components:
```
┌──────────────────────────────────────────┐
│ 🔗 AI Development Workflow (Compound)    │
├──────────────────────────────────────────┤
│ Components:                               │
│                                           │
│ 1. Custom Text:                          │
│    "This is a comprehensive workflow..." │
│                                           │
│ 2. Base Prompt: "Modular Development     │
│    Guidelines"                            │
│    └─ [View Base Prompt →]               │
│                                           │
│ 3. Custom Text:                          │
│    "Additionally, follow these rules..." │
│                                           │
│ 4. Base Prompt: "Git Workflow Rules"    │
│    └─ [View Base Prompt →]               │
│                                           │
│ [▶ Show Final Combined Text]             │
│ [Copy Prompt] [Options]                  │
└──────────────────────────────────────────┘
```

**B. Combined View**
Shows the final expanded text:
```
┌──────────────────────────────────────────┐
│ 🔗 AI Development Workflow (Compound)    │
├──────────────────────────────────────────┤
│ Final Combined Text:                     │
│                                           │
│ This is a comprehensive workflow...      │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ 📄 Modular Development Guidelines    │  │
│ │ Your core guidelines are 1) prior... │  │
│ │ (full base prompt text shown here)  │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ Additionally, follow these rules...      │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ 📄 Git Workflow Rules                │  │
│ │ I want you to commit liberally and...│  │
│ └─────────────────────────────────────┘  │
│                                           │
│ [▼ Show Component View]                  │
│ [Copy Prompt] [Options]                  │
└──────────────────────────────────────────┘
```

### 3. Copying a Compound Prompt

**Copy Behavior:**
1. User clicks "Copy Prompt" on compound prompt
2. System resolves all base prompts to their current text
3. Combines custom text + base prompt text in order
4. Opens copy preview (same as regular prompts)
5. User can add prefix/suffix/ultrathink/github reminder
6. Final text is fully expanded with all base prompts inlined
7. Copy to clipboard

**Example Copy Output:**
```
This is a comprehensive workflow...

Your core guidelines are 1) prioritize modularity 2) focus on
documentation and maintainability 3) always ensure we build
testing as we go...

Additionally, follow these rules...

I want you to commit liberally and often, but do not push to
github without my permission.

Use ultrathink.
```

### 4. Editing a Compound Prompt (Admin)

**UI Flow:**
1. Admin clicks "Edit" on compound prompt detail page
2. Opens same component builder interface as creation
3. Can:
   - Reorder components (drag-and-drop)
   - Edit custom text
   - Add/remove base prompts
   - Change which base prompts are included
   - **Cannot** edit the text of base prompts (must edit base prompt separately)
4. Real-time validation for circular references and depth limits
5. Save changes → triggers recalculation of max_depth

### 5. Deleting Base Prompts

**Protection Flow:**
1. Admin attempts to delete a prompt
2. System checks `compound_prompt_components` for references
3. If prompt is used in any compound prompts:
   ```
   ⚠️ Cannot Delete Prompt

   This prompt is used in the following compound prompts:
   • AI Development Workflow
   • Complete Testing Guidelines
   • Onboarding Checklist

   Please remove it from these compound prompts first.

   [View Dependencies] [Cancel]
   ```
4. Admin must first edit each compound prompt to remove the reference
5. Once no references exist, deletion is allowed

---

## Technical Implementation

### 1. Circular Reference Detection

**Algorithm:**
```typescript
function detectCircularReference(
  compoundPromptId: string,
  newComponentId: string,
  visited: Set<string> = new Set()
): boolean {
  // Base case: already visited = circular reference
  if (visited.has(newComponentId)) {
    return true
  }

  // Add to visited set
  visited.add(newComponentId)

  // Check if newComponent is itself a compound prompt
  const component = await prisma.prompts.findUnique({
    where: { id: newComponentId },
    include: {
      compound_components: {
        select: { component_prompt_id: true }
      }
    }
  })

  if (!component?.is_compound) {
    return false  // Regular prompt, no circular reference possible
  }

  // Check if this component eventually references the original compound prompt
  for (const subComponent of component.compound_components) {
    if (!subComponent.component_prompt_id) continue

    if (subComponent.component_prompt_id === compoundPromptId) {
      return true  // Direct circular reference
    }

    if (detectCircularReference(
      compoundPromptId,
      subComponent.component_prompt_id,
      new Set(visited)  // Pass copy to avoid cross-branch pollution
    )) {
      return true  // Indirect circular reference
    }
  }

  return false
}
```

**Usage:**
```typescript
// Before adding a component to a compound prompt
const hasCircular = await detectCircularReference(
  compoundPrompt.id,
  newComponent.id
)

if (hasCircular) {
  throw new Error('Cannot add component: would create circular reference')
}
```

### 2. Depth Limit Calculation

**Algorithm:**
```typescript
function calculateMaxDepth(
  promptId: string,
  visited: Set<string> = new Set()
): Promise<number> {
  // Prevent infinite recursion
  if (visited.has(promptId)) {
    throw new Error('Circular reference detected')
  }

  visited.add(promptId)

  const prompt = await prisma.prompts.findUnique({
    where: { id: promptId },
    include: {
      compound_components: {
        select: { component_prompt_id: true }
      }
    }
  })

  if (!prompt?.is_compound) {
    return 0  // Regular prompt has depth 0
  }

  if (prompt.compound_components.length === 0) {
    return 1  // Empty compound prompt has depth 1
  }

  // Calculate max depth of all components
  const depths = await Promise.all(
    prompt.compound_components
      .filter(c => c.component_prompt_id)
      .map(c => calculateMaxDepth(c.component_prompt_id!, new Set(visited)))
  )

  return 1 + Math.max(...depths, 0)
}

// Update cached depth after editing
async function updateMaxDepth(compoundPromptId: string) {
  const depth = await calculateMaxDepth(compoundPromptId)

  if (depth > MAX_NESTING_DEPTH) {
    throw new Error(`Maximum nesting depth (${MAX_NESTING_DEPTH}) exceeded`)
  }

  await prisma.prompts.update({
    where: { id: compoundPromptId },
    data: { max_depth: depth }
  })
}
```

**Validation:**
```typescript
const MAX_NESTING_DEPTH = 5

// Before saving compound prompt
const newDepth = await calculateMaxDepth(compoundPromptId)
if (newDepth > MAX_NESTING_DEPTH) {
  return res.status(400).json({
    error: `Nesting depth (${newDepth}) exceeds maximum (${MAX_NESTING_DEPTH})`
  })
}
```

### 3. Resolving Compound Prompts

**Core Resolution Function:**
```typescript
async function resolveCompoundPrompt(
  promptId: string,
  visited: Set<string> = new Set()
): Promise<string> {
  // Prevent infinite recursion
  if (visited.has(promptId)) {
    throw new Error('Circular reference detected during resolution')
  }

  visited.add(promptId)

  const prompt = await prisma.prompts.findUnique({
    where: { id: promptId },
    include: {
      compound_components: {
        include: { prompt: true },
        orderBy: { position: 'asc' }
      }
    }
  })

  if (!prompt) {
    throw new Error('Prompt not found')
  }

  // Regular prompt - return its text
  if (!prompt.is_compound) {
    return prompt.prompt_text || ''
  }

  // Compound prompt - resolve components
  const parts: string[] = []

  for (const component of prompt.compound_components) {
    // Add custom text before
    if (component.custom_text_before) {
      parts.push(component.custom_text_before.trim())
    }

    // Add base prompt (resolved recursively if compound)
    if (component.component_prompt_id) {
      const resolvedText = await resolveCompoundPrompt(
        component.component_prompt_id,
        new Set(visited)
      )
      parts.push(resolvedText)
    }

    // Add custom text after
    if (component.custom_text_after) {
      parts.push(component.custom_text_after.trim())
    }
  }

  return parts.join('\n\n')
}
```

**Usage in Copy:**
```typescript
// In copy button handler
const finalText = await resolveCompoundPrompt(promptId)

// Then apply user's copy preferences (prefix, suffix, etc.)
let textToCopy = finalText
if (addPrefix && prefix) {
  textToCopy = prefix + '\n\n' + textToCopy
}
// ... etc
```

### 4. Dependency Tracking

**Find Compound Prompts Using a Base Prompt:**
```typescript
async function findDependentCompoundPrompts(
  basePromptId: string
): Promise<Prompt[]> {
  return await prisma.prompts.findMany({
    where: {
      is_compound: true,
      compound_components: {
        some: {
          component_prompt_id: basePromptId
        }
      }
    },
    include: {
      user: { select: { name: true, email: true } }
    }
  })
}

// Before deleting a prompt
const dependents = await findDependentCompoundPrompts(promptId)
if (dependents.length > 0) {
  return res.status(400).json({
    error: 'Cannot delete prompt - used in compound prompts',
    dependents: dependents.map(p => ({ id: p.id, title: p.title }))
  })
}
```

### 5. Server Actions

**Create Compound Prompt:**
```typescript
// app/admin/prompts/actions.ts
'use server'

export async function createCompoundPrompt(data: {
  title: string
  description: string | null
  category: string
  components: {
    position: number
    component_prompt_id: string | null
    custom_text_before: string | null
    custom_text_after: string | null
  }[]
}) {
  const session = await auth()
  if (!session?.user?.is_admin) {
    throw new Error('Unauthorized')
  }

  // Validate circular references for each component
  const tempId = 'temp-' + Date.now()
  for (const component of data.components) {
    if (component.component_prompt_id) {
      const hasCircular = await detectCircularReference(
        tempId,
        component.component_prompt_id
      )
      if (hasCircular) {
        throw new Error(`Component "${component.component_prompt_id}" would create circular reference`)
      }
    }
  }

  // Create compound prompt with components in transaction
  const compoundPrompt = await prisma.$transaction(async (tx) => {
    // Create the prompt
    const prompt = await tx.prompts.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        slug: generateSlug(data.title),
        is_compound: true,
        user_id: session.user.id,
        status: 'PENDING',
        author_name: session.user.name || 'Unknown'
      }
    })

    // Create components
    await tx.compound_prompt_components.createMany({
      data: data.components.map(c => ({
        compound_prompt_id: prompt.id,
        ...c
      }))
    })

    // Calculate and set max_depth
    const depth = await calculateMaxDepth(prompt.id)
    await tx.prompts.update({
      where: { id: prompt.id },
      data: { max_depth: depth }
    })

    return prompt
  })

  revalidatePath('/admin/prompts')
  return compoundPrompt
}
```

**Update Compound Prompt:**
```typescript
export async function updateCompoundPrompt(
  promptId: string,
  data: {
    title?: string
    description?: string | null
    category?: string
    components?: {
      position: number
      component_prompt_id: string | null
      custom_text_before: string | null
      custom_text_after: string | null
    }[]
  }
) {
  const session = await auth()
  if (!session?.user?.is_admin) {
    throw new Error('Unauthorized')
  }

  // Validate circular references if components are being updated
  if (data.components) {
    for (const component of data.components) {
      if (component.component_prompt_id) {
        const hasCircular = await detectCircularReference(
          promptId,
          component.component_prompt_id
        )
        if (hasCircular) {
          throw new Error(`Component "${component.component_prompt_id}" would create circular reference`)
        }
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update basic fields
    const prompt = await tx.prompts.update({
      where: { id: promptId },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        slug: data.title ? generateSlug(data.title) : undefined
      }
    })

    // If components are being updated
    if (data.components) {
      // Delete existing components
      await tx.compound_prompt_components.deleteMany({
        where: { compound_prompt_id: promptId }
      })

      // Create new components
      await tx.compound_prompt_components.createMany({
        data: data.components.map(c => ({
          compound_prompt_id: promptId,
          ...c
        }))
      })

      // Recalculate max_depth
      const depth = await calculateMaxDepth(promptId)
      await tx.prompts.update({
        where: { id: promptId },
        data: { max_depth: depth }
      })
    }

    return prompt
  })

  revalidatePath('/admin/prompts')
  revalidatePath(`/prompts/${updated.slug}`)
  return updated
}
```

---

## UI Components

### 1. Compound Prompt Builder Component

**Location:** `components/CompoundPromptBuilder.tsx`

```typescript
'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface Component {
  id: string
  type: 'custom' | 'base'
  position: number
  custom_text_before?: string
  custom_text_after?: string
  base_prompt_id?: string
  base_prompt_title?: string
}

export function CompoundPromptBuilder({
  initialComponents = [],
  onChange
}: {
  initialComponents?: Component[]
  onChange: (components: Component[]) => void
}) {
  const [components, setComponents] = useState<Component[]>(initialComponents)

  const handleDragEnd = (result) => {
    // Reorder components
    // Update positions
    // Call onChange
  }

  const addCustomText = () => {
    // Add new custom text component
  }

  const addBasePrompt = () => {
    // Open modal to select base prompt
  }

  const removeComponent = (id: string) => {
    // Remove component
  }

  return (
    <div>
      {/* Drag-and-drop component list */}
      {/* Add buttons */}
      {/* Preview */}
    </div>
  )
}
```

### 2. Base Prompt Selector Modal

**Location:** `components/BasePromptSelector.tsx`

```typescript
'use client'

export function BasePromptSelector({
  onSelect,
  excludeIds = []  // Prevent selecting prompts that would cause circular refs
}: {
  onSelect: (prompt: Prompt) => void
  excludeIds?: string[]
}) {
  const [search, setSearch] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>([])

  return (
    <Modal>
      <input
        type="search"
        placeholder="Search prompts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="prompt-list">
        {prompts
          .filter(p => !excludeIds.includes(p.id))
          .map(prompt => (
            <div key={prompt.id} onClick={() => onSelect(prompt)}>
              <h4>{prompt.title}</h4>
              <p>{prompt.description}</p>
              {prompt.is_compound && <Badge>Compound</Badge>}
            </div>
          ))
        }
      </div>
    </Modal>
  )
}
```

### 3. Compound Prompt Display Component

**Location:** `components/CompoundPromptDisplay.tsx`

```typescript
'use client'

export function CompoundPromptDisplay({
  prompt
}: {
  prompt: CompoundPrompt
}) {
  const [viewMode, setViewMode] = useState<'component' | 'combined'>('component')
  const [resolvedText, setResolvedText] = useState<string>('')

  useEffect(() => {
    if (viewMode === 'combined') {
      // Fetch resolved text from API
      fetch(`/api/prompts/${prompt.id}/resolve`)
        .then(r => r.json())
        .then(data => setResolvedText(data.text))
    }
  }, [viewMode, prompt.id])

  return (
    <div>
      <div className="view-toggle">
        <button onClick={() => setViewMode('component')}>
          Component View
        </button>
        <button onClick={() => setViewMode('combined')}>
          Combined View
        </button>
      </div>

      {viewMode === 'component' ? (
        <ComponentView components={prompt.components} />
      ) : (
        <CombinedView text={resolvedText} components={prompt.components} />
      )}

      <CopyButton promptId={prompt.id} />
    </div>
  )
}
```

---

## API Endpoints

### 1. Resolve Compound Prompt

**Endpoint:** `GET /api/prompts/:id/resolve`

```typescript
// app/api/prompts/[id]/resolve/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedText = await resolveCompoundPrompt(params.id)

    return NextResponse.json({
      text: resolvedText,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error.message.includes('Circular reference')) {
      return NextResponse.json(
        { error: 'Circular reference detected' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to resolve compound prompt' },
      { status: 500 }
    )
  }
}
```

### 2. Get Prompt Dependencies

**Endpoint:** `GET /api/prompts/:id/dependencies`

```typescript
// app/api/prompts/[id]/dependencies/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const dependents = await findDependentCompoundPrompts(params.id)

  return NextResponse.json({
    count: dependents.length,
    prompts: dependents.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      author: p.user.name
    }))
  })
}
```

### 3. Validate Component Addition

**Endpoint:** `POST /api/prompts/:id/validate-component`

```typescript
// app/api/prompts/[id]/validate-component/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { componentId } = await request.json()

  // Check circular reference
  const hasCircular = await detectCircularReference(params.id, componentId)
  if (hasCircular) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Would create circular reference'
      },
      { status: 400 }
    )
  }

  // Check depth limit
  const newDepth = await calculateDepthIfAdded(params.id, componentId)
  if (newDepth > MAX_NESTING_DEPTH) {
    return NextResponse.json(
      {
        valid: false,
        error: `Would exceed maximum nesting depth (${MAX_NESTING_DEPTH})`
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ valid: true })
}
```

---

## Edge Cases & Error Handling

### 1. Circular References

**Scenario:** User tries to add Prompt A to Prompt B, but Prompt B is already in Prompt A.

**Prevention:**
- Real-time validation when selecting a base prompt
- Disable prompts in selector that would create circular refs
- Server-side validation before saving

**Error Message:**
```
⚠️ Cannot Add This Prompt

Adding "Advanced Git Workflow" would create a circular reference:

You → Advanced Git Workflow → Modular Guidelines → You

Please choose a different prompt.
```

### 2. Depth Limit Exceeded

**Scenario:** User tries to nest compound prompts beyond depth 5.

**Prevention:**
- Show current depth in UI
- Disable deeply nested prompts in selector
- Server-side validation

**Error Message:**
```
⚠️ Maximum Nesting Depth Exceeded

Adding this prompt would create a nesting depth of 6.
Maximum allowed depth is 5.

Current depth: 4
Prompt's depth: 2
Combined depth: 6 (exceeds limit)

Please choose a shallower prompt or restructure your components.
```

### 3. Base Prompt Deleted

**Scenario:** Someone tries to delete a prompt used in compound prompts.

**Prevention:**
- Database foreign key constraint: `ON DELETE RESTRICT`
- UI shows list of dependent compound prompts
- Admin must manually remove dependencies first

**Error Message:**
```
⚠️ Cannot Delete Prompt

This prompt is referenced by 3 compound prompts:

1. AI Development Workflow (by John Doe)
2. Complete Testing Guidelines (by Jane Smith)
3. Onboarding Checklist (by John Doe)

You must remove it from these compound prompts before deleting.

[View Dependencies]
```

### 4. Component Prompt Not Found

**Scenario:** A base prompt is referenced but has been deleted (shouldn't happen due to constraint, but handle gracefully).

**Handling:**
```typescript
async function resolveCompoundPrompt(promptId: string) {
  // ... resolution logic ...

  if (component.component_prompt_id) {
    const basePrompt = await prisma.prompts.findUnique({
      where: { id: component.component_prompt_id }
    })

    if (!basePrompt) {
      // Log error for investigation
      console.error(`Missing base prompt: ${component.component_prompt_id}`)

      // Skip this component but continue resolution
      parts.push('[Missing Prompt - Please Contact Admin]')
      continue
    }

    // ... normal resolution ...
  }
}
```

### 5. Empty Compound Prompt

**Scenario:** Compound prompt has no components.

**Handling:**
- Allow creation (might be in progress)
- Show warning in preview
- Resolve to empty string
- Status remains PENDING until components added

### 6. Only Custom Text Components

**Scenario:** Compound prompt has only custom text, no base prompts.

**Handling:**
- Perfectly valid use case
- Functions exactly like a regular prompt
- Consider suggesting conversion to regular prompt

---

## Import/Export Considerations

### Export Format

When exporting compound prompts, include component structure:

```json
{
  "version": "1.0",
  "exported_at": "2025-01-15T10:00:00.000Z",
  "total_count": 1,
  "prompts": [
    {
      "slug": "ai-development-workflow",
      "title": "AI Development Workflow",
      "description": "Complete workflow for AI-assisted development",
      "category": "Development",
      "is_compound": true,
      "components": [
        {
          "position": 0,
          "custom_text_before": "This is a comprehensive workflow...",
          "base_prompt_slug": "modular-development-guidelines",
          "custom_text_after": null
        },
        {
          "position": 1,
          "custom_text_before": "Additionally, follow these rules...",
          "base_prompt_slug": "git-workflow-rules",
          "custom_text_after": null
        }
      ],
      "tags": ["development", "workflow", "ai"],
      "featured": false,
      "author_name": "John Doe",
      "created_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### Import Handling

When importing compound prompts:

1. **Dependency Resolution:**
   - Check if referenced base prompts exist
   - If missing, options:
     - Skip compound prompt (log warning)
     - Import as regular prompt with resolved text (one-time expansion)
     - Fail import with clear error message

2. **Circular Reference Validation:**
   - Run circular reference check after all prompts imported
   - If detected, fail import with details

3. **Import Strategy:**
   ```typescript
   async function importCompoundPrompt(data: ExportedCompoundPrompt) {
     // Step 1: Verify all base prompts exist
     const missingPrompts: string[] = []

     for (const component of data.components) {
       if (component.base_prompt_slug) {
         const exists = await prisma.prompts.findUnique({
           where: { slug: component.base_prompt_slug }
         })

         if (!exists) {
           missingPrompts.push(component.base_prompt_slug)
         }
       }
     }

     if (missingPrompts.length > 0) {
       throw new Error(
         `Cannot import compound prompt "${data.title}": ` +
         `Missing base prompts: ${missingPrompts.join(', ')}`
       )
     }

     // Step 2: Import compound prompt
     // ... create prompt and components ...
   }
   ```

---

## Testing Strategy

### Unit Tests

**1. Circular Reference Detection:**
```typescript
describe('detectCircularReference', () => {
  it('should detect direct circular reference', async () => {
    // A → B → A
    const hasCircular = await detectCircularReference('A', 'B')
    expect(hasCircular).toBe(true)
  })

  it('should detect indirect circular reference', async () => {
    // A → B → C → A
    const hasCircular = await detectCircularReference('A', 'B')
    expect(hasCircular).toBe(true)
  })

  it('should allow valid nesting', async () => {
    // A → B → C (no circle)
    const hasCircular = await detectCircularReference('A', 'B')
    expect(hasCircular).toBe(false)
  })
})
```

**2. Depth Calculation:**
```typescript
describe('calculateMaxDepth', () => {
  it('should return 0 for regular prompt', async () => {
    const depth = await calculateMaxDepth('regular-prompt-id')
    expect(depth).toBe(0)
  })

  it('should calculate depth for simple compound', async () => {
    // Compound with 2 regular prompts
    const depth = await calculateMaxDepth('simple-compound-id')
    expect(depth).toBe(1)
  })

  it('should calculate depth for nested compound', async () => {
    // Compound → Compound → Regular
    const depth = await calculateMaxDepth('nested-compound-id')
    expect(depth).toBe(2)
  })

  it('should enforce max depth limit', async () => {
    await expect(
      calculateMaxDepth('too-deep-compound-id')
    ).rejects.toThrow('exceeds maximum')
  })
})
```

**3. Resolution:**
```typescript
describe('resolveCompoundPrompt', () => {
  it('should resolve simple compound prompt', async () => {
    const text = await resolveCompoundPrompt('simple-compound-id')
    expect(text).toContain('custom intro')
    expect(text).toContain('base prompt text')
  })

  it('should resolve nested compound prompts', async () => {
    const text = await resolveCompoundPrompt('nested-compound-id')
    // Verify all nested content is included
  })

  it('should handle custom text spacing correctly', async () => {
    const text = await resolveCompoundPrompt('compound-id')
    // Verify double newlines between components
  })
})
```

### Integration Tests

**1. Create Compound Prompt:**
```typescript
describe('POST /api/admin/prompts/compound', () => {
  it('should create compound prompt with components', async () => {
    const response = await createCompoundPrompt({
      title: 'Test Compound',
      components: [
        { position: 0, custom_text_before: 'Intro', base_prompt_id: 'base-1' },
        { position: 1, custom_text_before: null, base_prompt_id: 'base-2' }
      ]
    })

    expect(response.status).toBe(201)
    expect(response.data.is_compound).toBe(true)
  })

  it('should reject circular reference', async () => {
    await expect(
      createCompoundPrompt({
        components: [{ base_prompt_id: 'creates-circle' }]
      })
    ).rejects.toThrow('circular reference')
  })
})
```

**2. Copy Compound Prompt:**
```typescript
describe('Copy compound prompt', () => {
  it('should resolve all components when copying', async () => {
    const copyPreview = await getCopyPreview('compound-prompt-id')

    expect(copyPreview.text).toContain('base prompt 1 text')
    expect(copyPreview.text).toContain('base prompt 2 text')
    expect(copyPreview.text).toContain('custom text')
  })
})
```

### E2E Tests

**1. Create Compound Prompt Flow:**
```typescript
test('admin can create compound prompt', async ({ page }) => {
  await page.goto('/admin/prompts/create-compound')

  await page.fill('input[name="title"]', 'Test Compound')
  await page.click('button:has-text("Add Base Prompt")')
  await page.click('text=Modular Development Guidelines')
  await page.click('button:has-text("Add Custom Text")')
  await page.fill('textarea[name="custom_text"]', 'Additional notes...')

  await page.click('button:has-text("Submit for Approval")')

  await expect(page).toHaveURL(/\/admin\/prompts/)
  await expect(page.locator('text=Test Compound')).toBeVisible()
})
```

**2. Prevent Base Prompt Deletion:**
```typescript
test('cannot delete base prompt used in compound', async ({ page }) => {
  await page.goto('/admin/prompts/base-prompt-123')
  await page.click('button:has-text("Delete")')

  await expect(page.locator('text=used in compound prompts')).toBeVisible()
  await expect(page.locator('text=AI Development Workflow')).toBeVisible()
})
```

---

## Performance Considerations

### 1. Caching

**Resolved Text Caching:**
```typescript
// Cache resolved text for compound prompts
const CACHE_TTL = 60 * 60 // 1 hour

async function getResolvedTextCached(promptId: string): Promise<string> {
  const cacheKey = `resolved:${promptId}`

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) {
    return cached
  }

  // Resolve and cache
  const resolved = await resolveCompoundPrompt(promptId)
  await redis.setex(cacheKey, CACHE_TTL, resolved)

  return resolved
}

// Invalidate cache when base prompt is updated
async function updateBasePrompt(promptId: string, data: any) {
  await prisma.prompts.update({ where: { id: promptId }, data })

  // Find and invalidate all dependent compound prompts
  const dependents = await findDependentCompoundPrompts(promptId)
  for (const dependent of dependents) {
    await redis.del(`resolved:${dependent.id}`)
  }
}
```

**Why Cache:**
- Resolution can be expensive for deeply nested compounds
- Same compound prompt may be viewed/copied multiple times
- Base prompts don't change frequently

**Cache Invalidation:**
- When base prompt is updated → invalidate all dependent compounds
- When compound prompt structure is updated → invalidate that compound
- TTL as fallback (1 hour)

### 2. Database Indexes

Already included in schema:
```sql
-- Efficient lookup of compounds using a base prompt
CREATE INDEX idx_compound_components_base
  ON compound_prompt_components(component_prompt_id);

-- Efficient ordered retrieval
CREATE INDEX idx_compound_components_order
  ON compound_prompt_components(compound_prompt_id, position);
```

Additional considerations:
```sql
-- Index for finding compound prompts
CREATE INDEX idx_prompts_compound
  ON prompts(is_compound)
  WHERE is_compound = TRUE;

-- Index for approved compound prompts (public listing)
CREATE INDEX idx_prompts_compound_approved
  ON prompts(is_compound, status, deleted_at)
  WHERE is_compound = TRUE AND status = 'APPROVED' AND deleted_at IS NULL;
```

### 3. Lazy Loading

For UI component view:
```typescript
// Don't fetch full base prompt text initially
const components = await prisma.compound_prompt_components.findMany({
  where: { compound_prompt_id: promptId },
  select: {
    position: true,
    custom_text_before: true,
    custom_text_after: true,
    prompt: {
      select: {
        id: true,
        title: true,
        slug: true,
        is_compound: true
        // Don't select prompt_text initially
      }
    }
  },
  orderBy: { position: 'asc' }
})

// Only load full text when switching to combined view or copying
```

### 4. Pagination

For compound prompts with many components:
```typescript
// Paginate components in admin UI if > 20
const COMPONENTS_PER_PAGE = 20

// But always load all for resolution (needed for copy)
```

---

## Rollout Plan

### Phase 1: Foundation (Week 1) ✅ COMPLETED
- [x] Database migration (add tables/columns)
- [x] Core resolution function
- [x] Circular reference detection
- [x] Depth calculation
- [x] Unit tests (55 tests, all passing)

**Deliverable:** Backend logic works, tested via scripts ✅

**Implementation Details:**
- Created `lib/compound-prompts/` module with types, validation, and resolution
- Database schema with proper constraints and indexes
- 32 validation tests covering circular references, depth calculation, and edge cases
- 23 resolution tests covering simple/nested compounds, custom text, and error handling
- Committed in: 6e32ce4

### Phase 2: Admin UI (Week 2)
- [ ] Compound prompt builder component
- [ ] Base prompt selector modal
- [ ] Create compound prompt flow
- [ ] Edit compound prompt flow
- [ ] Admin list view (show compound badge)

**Deliverable:** Admins can create/edit compound prompts

### Phase 3: Public Display (Week 3)
- [ ] Compound prompt detail page (component view)
- [ ] Combined view toggle
- [ ] Copy functionality with resolution
- [ ] Copy preview
- [ ] Browse page (compound prompts show up)

**Deliverable:** Users can view/copy compound prompts

### Phase 4: Protection & Validation (Week 4)
- [ ] Deletion protection
- [ ] Dependency viewer
- [ ] Real-time validation in UI
- [ ] Error messaging
- [ ] Depth limit enforcement

**Deliverable:** System prevents invalid states

### Phase 5: Import/Export (Week 5)
- [ ] Export format update
- [ ] Import handling
- [ ] Dependency resolution during import
- [ ] Migration tool for existing data

**Deliverable:** Compound prompts can be exported/imported

### Phase 6: Polish & Optimization (Week 6)
- [ ] Caching implementation
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] E2E tests

**Deliverable:** Production-ready feature

---

## Success Metrics

### Technical Metrics
- Resolution time < 200ms for depth ≤ 3
- No circular references in production
- No orphaned components
- Cache hit rate > 80%

### Usage Metrics
- Number of compound prompts created
- Average nesting depth
- Most reused base prompts
- Compound vs regular prompt ratio

### User Feedback
- Admin satisfaction with creation UI
- User confusion about compound prompts
- Copy success rate
- Error rate during creation

---

## Future Enhancements

### 1. Variables/Placeholders
Allow custom text to include variables:
```
Hello {{user_name}},

[Base Prompt]

For project: {{project_name}}
```

### 2. Conditional Components
Include components based on conditions:
```
if (use_case === "backend") {
  include("Backend Guidelines")
} else {
  include("Frontend Guidelines")
}
```

### 3. Component Library
Pre-built, curated base prompts for common needs:
- "Standard Opening"
- "Tone: Professional"
- "Format: Markdown"
- "Security Reminder"

### 4. Visual Graph View
Show compound prompt structure as a graph:
```
     ┌─────────────┐
     │   My AI     │
     │   Workflow  │
     └─────┬───────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼──┐      ┌──▼────┐
│ Mod  │      │  Git  │
│ Dev  │      │ Rules │
└──────┘      └───┬───┘
                  │
              ┌───▼────┐
              │ Commit │
              │  Style │
              └────────┘
```

### 5. Version Pinning
Allow locking to specific versions of base prompts:
```typescript
{
  base_prompt_id: "abc-123",
  version_pinned: true,
  version_snapshot: "v2.1"  // Don't auto-update
}
```

### 6. Diff View
Show what changed in compound prompt when base prompts update:
```diff
This is the intro text

- [Old Version of Base Prompt]
+ [New Version of Base Prompt]

Additional text here
```

---

## Open Questions

1. **Should compound prompts have their own category?**
   - Pro: Easier to filter/find
   - Con: Categories should be semantic (Development, Testing, etc.)
   - Decision: Use tags instead (add "compound" tag automatically)

2. **Should we show a visual indicator of nesting depth?**
   - E.g., "Depth: 2/5" badge
   - Helpful for users to understand complexity
   - Decision: Yes, show in admin UI

3. **How to handle approved status?**
   - If base prompt is approved, compound using it is auto-approved?
   - Or compound needs separate approval?
   - Decision: Compound needs separate approval (admin controls what's public)

4. **Should non-admins be able to create compound prompts?**
   - Current plan: Admin-only
   - Future: Allow users, but requires approval
   - Decision: Start admin-only, expand later

5. **Analytics tracking?**
   - Track which base prompts are most used in compounds?
   - Track copy rate of compound vs regular prompts?
   - Decision: Yes, add to existing analytics

---

## Conclusion

This planning document provides a comprehensive blueprint for implementing compound prompts. The feature is designed with:

- **Safety**: Circular reference prevention, depth limits, deletion protection
- **Usability**: Clear UI, real-time preview, intuitive component builder
- **Performance**: Caching, lazy loading, efficient queries
- **Maintainability**: Live updates, automatic propagation, clear error messages
- **Extensibility**: Foundation for future enhancements (variables, conditions, etc.)

The phased rollout ensures each component is thoroughly tested before moving forward. The feature will significantly enhance the prompt library's flexibility and maintainability.
