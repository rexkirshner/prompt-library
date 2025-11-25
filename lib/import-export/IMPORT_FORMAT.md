# Prompt Import Format Documentation

This document describes the JSON format for importing prompts into the Prompt Library.

## Overview

The import system uses a structured JSON format that matches the export format. This ensures round-trip compatibility between export and import operations.

## JSON Structure

### Root Object

```json
{
  "version": "1.0",
  "exported_at": "2025-11-25T20:30:00.000Z",
  "total_count": 1,
  "prompts": [...]
}
```

**Fields:**
- `version` (string, required): Format version, currently "1.0"
- `exported_at` (string, required): ISO 8601 timestamp of when the export was created
- `total_count` (number, required): Total number of prompts in the array
- `prompts` (array, required): Array of prompt objects

### Prompt Object

```json
{
  "slug": "unique-prompt-slug",
  "title": "Prompt Title",
  "prompt_text": "The actual prompt content...",
  "description": "Description of what this prompt does",
  "example_output": "Example of the prompt output",
  "category": "Development",
  "author_name": "Author Name",
  "author_url": "https://example.com",
  "tags": ["tag1", "tag2", "tag3"],
  "status": "APPROVED",
  "featured": false,
  "created_at": "2025-11-25T20:25:00.000Z",
  "updated_at": "2025-11-25T20:25:00.000Z",
  "approved_at": "2025-11-25T20:25:00.000Z"
}
```

**Required Fields:**
- `slug` (string): Unique identifier, lowercase with hyphens, 1-200 chars
- `title` (string): Prompt title, 1-500 chars
- `prompt_text` (string): The actual prompt content
- `category` (string): Category name
- `author_name` (string): Author's name
- `tags` (array of strings): Array of tag names
- `status` (enum): One of: "PENDING", "APPROVED", "REJECTED"
- `featured` (boolean): Whether the prompt is featured
- `created_at` (string): ISO 8601 timestamp
- `updated_at` (string): ISO 8601 timestamp

**Optional Fields:**
- `description` (string | null): Description of the prompt
- `example_output` (string | null): Example output from the prompt
- `author_url` (string | null): Author's website URL
- `approved_at` (string | null): ISO 8601 timestamp when approved

## Field Constraints

### Slug Format
- Must match pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Only lowercase letters, numbers, and hyphens
- Cannot start or end with hyphen
- Length: 1-200 characters

### Status Values
- `PENDING`: Awaiting review
- `APPROVED`: Reviewed and approved (default for imports)
- `REJECTED`: Reviewed and rejected

### Categories
Common categories include:
- Development
- Writing
- Marketing
- Design
- Business
- Education
- Research
- Entertainment

### Timestamps
- Must be valid ISO 8601 format
- `updated_at` should not be before `created_at`
- `approved_at` should not be before `created_at`
- Timestamps with minor precision issues will generate warnings but won't block import

## Validation Rules

### Business Logic
1. **Approved prompts** must have an `approved_at` timestamp
2. **Featured prompts** must have `APPROVED` status
3. **Duplicate slugs** are detected during import

### Duplicate Handling Strategies

When importing, you can choose how to handle duplicates:

- **Skip** (default, safest): Keep existing prompts, skip duplicates
- **Update**: Replace existing prompts with new data
- **Error**: Fail the import if any duplicates are found

### Sanitization

All text fields are automatically sanitized to prevent XSS attacks:
- Script tags are removed
- Event handlers (onclick, onload, etc.) are removed
- javascript: protocols are removed

## Quick Template

```json
{
  "version": "1.0",
  "exported_at": "2025-11-25T20:30:00.000Z",
  "total_count": 1,
  "prompts": [
    {
      "slug": "my-new-prompt",
      "title": "My New Prompt",
      "prompt_text": "Prompt content here...",
      "description": "What this prompt does",
      "example_output": "Example output here",
      "category": "Development",
      "author_name": "Your Name",
      "author_url": null,
      "tags": ["tag1", "tag2"],
      "status": "APPROVED",
      "featured": false,
      "created_at": "2025-11-25T20:25:00.000Z",
      "updated_at": "2025-11-25T20:25:00.000Z",
      "approved_at": "2025-11-25T20:25:00.000Z"
    }
  ]
}
```

## Common Use Cases

### 1. Adding a Single New Prompt

Use the quick template above, replacing:
- `slug`: Unique lowercase-hyphen identifier
- `title`: Display name
- `prompt_text`: Your prompt content
- `description`: Brief description
- `tags`: Relevant tags (will be created if they don't exist)
- All timestamps: Use current ISO timestamp

### 2. Bulk Import

```json
{
  "version": "1.0",
  "exported_at": "2025-11-25T20:30:00.000Z",
  "total_count": 3,
  "prompts": [
    { /* prompt 1 */ },
    { /* prompt 2 */ },
    { /* prompt 3 */ }
  ]
}
```

### 3. Backup and Restore

1. **Export**: Use the admin backup page to export all prompts
2. **Import**: Upload the exported JSON file
3. Choose duplicate strategy:
   - **Skip**: Safe restore without overwriting
   - **Update**: Full restore with latest data
   - **Error**: Validate backup integrity

## Error Messages

Common validation errors:

- **"Invalid JSON syntax"**: File is not valid JSON
- **"Approved prompts must have approved_at timestamp"**: Set `approved_at` for `APPROVED` status
- **"Featured prompts must have APPROVED status"**: Only approved prompts can be featured
- **"Duplicate slug found"**: Slug already exists in database
- **"Invalid slug format"**: Slug doesn't match pattern requirements

## Import Workflow

1. **Upload File**: Select JSON file via admin UI
2. **Validation**: System validates structure and business rules
3. **Preview**: Review what will be imported/skipped/failed
4. **Confirm**: Execute the import with database transaction
5. **Results**: View success/error summary

All imports use database transactions - if any error occurs, the entire import is rolled back.

## Related Files

- **Schema Validation**: `lib/import-export/validators/json-validator.ts`
- **Business Validation**: `lib/import-export/validators/prompt-validator.ts`
- **Import Logic**: `lib/import-export/services/import-service.ts`
- **Type Definitions**: `lib/import-export/types/index.ts`
