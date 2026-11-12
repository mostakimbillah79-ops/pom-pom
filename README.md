# POM POM - New Features Integration

## Features Added

### Feature 1: Menu Category Management
- Admin can add, edit, delete menu categories
- Categories: মেনু, পানীয়, মুরগি, ফ্রেঞ্চ ফ্রাই, বার্গার etc.
- Customer sees only items from selected category

### Feature 2: কাঁচামাল Stock % Management
- Track raw materials (পেঁয়াজ, আলু, মুরগি etc.)
- Automatic percentage calculation
- Red Alert when stock ≤ 80%
- Kitchen Display shows real-time updates

## Installation Steps

1. **Copy all files from this folder to your project:**
   ```
   src/types/index.ts
   src/components/MenuCategory.tsx
   src/components/CustomerMenu.tsx (from canvas)
   src/components/RawMaterialManager.tsx (from canvas)
   src/components/KitchenDisplay.tsx (from canvas)
   src/app/api/menu-categories/route.ts
   src/app/api/menu-categories/[id]/route.ts
   src/app/api/menu-categories/[id]/items/route.ts
   src/app/api/raw-materials/route.ts
   src/app/api/raw-materials/[id]/route.ts
   ```

2. **Update Prisma Schema:**
   - Open `prisma/schema.prisma`
   - Add models from `PRISMA_SCHEMA_UPDATE.txt`

3. **Run Migration:**
   ```bash
   npx prisma migrate dev --name add_menu_and_materials
   ```

4. **Create Test Pages:**
   - `src/app/admin/menu/page.tsx` - Import MenuCategoryManager
   - `src/app/admin/materials/page.tsx` - Import RawMaterialManager
   - `src/app/kitchen/page.tsx` - Import KitchenDisplay
   - `src/app/menu/page.tsx` - Import CustomerMenu

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── menu-categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── items/
│   │   │           └── route.ts
│   │   └── raw-materials/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   └── ...
├── components/
│   ├── MenuCategory.tsx
│   ├── CustomerMenu.tsx
│   ├── RawMaterialManager.tsx
│   └── KitchenDisplay.tsx
├── types/
│   └── index.ts
└── ...
```

## Notes

- All text is in Bangla (বাংলা) + English
- Uses shadcn/ui components
- Requires Prisma with Database
- Role-based access control (Admin only)

## Next Features

- Feature #3: Delivery Cost Management
- Feature #4: Old Stock Update
- Feature #5: POS/Counter System
