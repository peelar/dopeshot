# Data Model: Persistent Backgrounds

## PresetBackground

**Purpose**: Curated background option available to branded users.

**Fields**
- id (unique identifier)
- name (display label)
- description (optional short description)
- storage_path (location of the asset in curated storage)
- preview_url (thumbnail or derived preview)
- is_active (boolean for availability)
- sort_order (integer for display ordering)
- created_at
- updated_at

**Validation Rules**
- name required, <= 80 chars
- storage_path required
- is_active defaults to true

## PersonalBackground

**Purpose**: User-uploaded background asset, private to the owner.

**Fields**
- id (unique identifier)
- user_id (owner)
- name (optional user label)
- storage_path (location of the asset in user storage)
- preview_url (thumbnail or derived preview)
- file_size_kb
- width_px
- height_px
- file_format
- created_at
- updated_at

**Validation Rules**
- user_id required
- file_size_kb <= 10240
- file_format in {png, jpg, webp}

## BackgroundSelection

**Purpose**: Persists the currently selected background for a user.

**Fields**
- id (unique identifier)
- user_id (owner)
- background_type (preset | personal)
- background_id (refers to PresetBackground or PersonalBackground)
- updated_at

**Validation Rules**
- background_type required
- background_id required
- user_id required

## Relationships

- PresetBackground is globally visible to branded users.
- PersonalBackground belongs to User (one-to-many).
- BackgroundSelection belongs to User (one-to-one).

## State Transitions

- PersonalBackground: uploaded -> active; removed -> deleted.
- BackgroundSelection: updated whenever user selects a new background.
